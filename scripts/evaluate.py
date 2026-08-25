# SPDX-License-Identifier: Apache-2.0
#
# /// script
# dependencies = ["upkie", "pybullet"]
# ///

"""Session 3: the measurement harness.

One score for any controller. `evaluate` takes a *callable* `policy(obs) ->
action` so the same code scores the PD baseline (S2), a trained PPO policy
(S5), and anything after it. Nothing in here may know what a gain vector is.

Every number this file produces is stamped with the constants below. Change
them and prior numbers become incomparable -- see Q9 in LOGBOOK.md.
"""

import numpy as np
import gymnasium as gym
import random
import upkie.envs
from upkie.utils.external_force import ExternalForce

upkie.envs.register()

FREQUENCY = 200  # Hz, matches the plan; keep pd_balancer.py in sync (Q4)
DT = 1.0 / FREQUENCY

# Unstable mode of the inverted pendulum. Measured off the PyBullet model:
# CoM sits 0.3546 m up, wheel contact is at the 0.05 m wheel radius.
GRAVITY = 9.81
COM_HEIGHT = 0.3546
WHEEL_RADIUS = 0.05
PENDULUM_LENGTH = COM_HEIGHT - WHEEL_RADIUS  # 0.3046 m
LAMBDA = np.sqrt(GRAVITY / PENDULUM_LENGTH)  # 5.675 rad/s

# --- The ruler's units (Q9) -------------------------------------------------
# Initial-state randomization amplitudes. WITHOUT THESE THE SEEDS DO NOTHING:
# RobotStateRandomization defaults to zero, so every seed samples the identical
# state and 20 episodes are 20 copies of one episode. S2 run C proved this --
# two controllers with a 7x difference in push tolerance both survived 30 s
# undisturbed and scored identical.
#
# Freeze these. Every score in LOGBOOK.md is only comparable to scores taken at
# the same amplitudes.
PITCH = 0.05  # rad, initial lean (2.9 deg)
OMEGA_Y = 0.2  # rad/s, initial pitch rate

# The disturbance, and the third frozen unit. Calibrated in S4 so the PD
# baseline falls ~50% of the time -- headroom for a policy to beat it in
# either direction. 460 N for one 5 ms step is J = 2.30 N.s, xi = 0.6469.
# Below ~410 N every controller scores 0/20 and above ~600 N every controller
# scores 20/20, so the usable scale is only ~200 N wide (Q16).
PUSH = 460.0  # N, applied to the torso for PUSH_LEN steps from PUSH_STEP
PUSH_STEP = 400  # step at which the push lands (arbitrary, unexamined -- Q15)
PUSH_LEN = 1  # steps the force is held (arbitrary, unexamined -- Q15)
MAX_STEPS = 2000  # 10 s at 200 Hz (arbitrary, unexamined -- Q15)
SEEDS = range(20)  # fixed, and identical for every controller scored

# Action limit. TASK_SPEC.md section 3: this belongs on the env, never as a
# clip inside the policy. For a deterministic controller the two are the same;
# for PPO they are not, because SB3 scales its exploration Gaussian to the
# declared action space. Declaring +-3.0 while the policy clips at +-0.99 wastes
# most of the exploration on commands that are silently thrown away -- and the
# inherited +-0.99 clip was causing 8 falls in 20 that the gains were blamed for.
MAX_GROUND_VELOCITY = 3.0  # m/s


METRICS = (
    "episode_length",
    "max_theta",
    "min_theta",
    "mean_abs_theta",
    "mean_delta_a",
    "p_drift",
    "xi",
)


def summarize(results) -> dict:
    """Collapse per-episode dicts into mean and std per metric.

    The std is not decoration. S13 asks whether seed-to-seed variance swamps
    the difference between two configs; without it, every comparison in the
    logbook is unfalsifiable. A difference smaller than the spread is noise.
    """
    summary = {
        "n_episodes": len(results),
        "n_fell": sum(r["fell"] for r in results),
    }
    for key in METRICS:
        values = np.array([r[key] for r in results], dtype=float)
        finite = values[~np.isnan(values)]
        summary[f"{key}_mean"] = float(finite.mean()) if finite.size else float("nan")
        summary[f"{key}_std"] = float(finite.std()) if finite.size else float("nan")
    summary["episodes"] = results
    return summary


def evaluate(
    policy,
    seeds=SEEDS,
    max_steps=MAX_STEPS,
    push=None,
    push_step=PUSH_STEP,
    push_len=PUSH_LEN,
) -> dict:
    """Score `policy` over `seeds`. `push` is a force in newtons.

    The push is applied to the torso for `push_len` steps starting at
    `push_step`, giving an impulse of `push * DT * push_len` N.s.
    """
    with gym.make(
        "Upkie-PyBullet-Pendulum",
        frequency=FREQUENCY,
        gui=False,
        regulate_frequency=False,
        max_ground_velocity=MAX_GROUND_VELOCITY,
    ) as env:
        simulator = env.unwrapped.backend
        env.unwrapped.update_init_rand(pitch=PITCH, omega_y=OMEGA_Y)
        results = []
        # Other knobs available: roll, pitch, x, z, omega_x, omega_y,
        # linear_velocity.
        for seed in seeds:
            observation, info = env.reset(seed=seed)
            # The backend keeps its force dictionary across reset(), so a push
            # from the previous seed would still be blowing on the robot.
            simulator.set_external_forces(
                {"torso": ExternalForce(force=np.zeros(3), local=False)}
            )

            # --- per-episode accumulators, reset for every seed -------------
            # episode_length: steps survived before the fall (pitch > 1.0 rad)
            #   or the max_steps cap. THE PRIMARY SCORE. "2000" means "survived
            #   10 s at 200 Hz", not "balances".
            episode_length = 0

            # theta: the lean angle, obs[0], in radians. 0 is upright, the
            #   episode terminates past 1.0 rad. You want TWO numbers out of
            #   it, and they say different things:
            #     max|theta| -- worst excursion, i.e. how close it came to
            #       falling. A single spike shows up here and nowhere else.
            #     mean|theta| -- the typical lean. Catches a controller that
            #       never spikes but sits permanently tilted. Accumulate a
            #       running sum here and divide by episode_length at the end.
            #   A small mean with a large max is a controller that gets
            #   surprised; a large mean with a small max is one holding a
            #   static offset (see Q8 -- that can be an equilibrium, not a
            #   fault).
            max_theta = -np.inf  # signed, so asymmetry stays visible
            min_theta = np.inf
            sum_abs_theta = 0.0
            n_theta = 0

            # delta_a: |a_t - a_{t-1}|, the STEP-TO-STEP CHANGE in commanded
            #   ground velocity, in m/s. Accumulate the sum, divide by steps at
            #   the end to get mean |delta a| -- the smoothness score.
            #
            #   Note it is a *rate of change*, not effort: a large steady
            #   command has delta_a = 0. High delta_a means the command is
            #   chattering between steps.
            #
            #   Why the plan calls this the best early predictor of
            #   sim-to-real failure: PyBullet will happily absorb a command
            #   that flips sign every 5 ms, because its wheels have no
            #   bandwidth limit, no backlash and no thermal budget. Real
            #   actuators have all three. A policy that scores well on episode
            #   length and badly here is the one that screams on the bench in
            #   S10. It is also the exact quantity S7 puts in the reward as
            #   the action-rate penalty.
            #
            #   Needs a `previous_action` carried across iterations, and a
            #   decision about step 0, which has no predecessor: skipping it
            #   and comparing against zero give different numbers, and
            #   comparing against zero charges the controller for its first
            #   action, which is not a *change*.
            previous_action = None  # step 0 has no predecessor: skipped,
            #   because comparing against zero would charge the controller
            #   for its first command, which is not a *change*.
            delta_a = 0.0
            n_delta = 0

            # p_drift: |obs[1]| at the end -- how far the wheel contact point
            #   ended up from the origin, in metres. Station-keeping.
            #
            #   Read it together with mean|theta|. A nonzero final position is
            #   not automatically sloppiness: with a static pitch bias the
            #   position loop CANNOT null it and settles at
            #   p = -(K_theta/K_p) * theta instead (Q8). That is a stable
            #   offset, not a wander. Drift proper keeps growing; an offset
            #   stops. The extreme alone cannot tell them apart, which is why
            #   S2 needed a trajectory trace to work out what -0.119 m meant.

            # xi = theta + theta_dot / LAMBDA, the divergent component of
            #   motion. This is the ROBUSTNESS axis, and it is only meaningful
            #   when `push` is set -- sample it ONCE, on the step the push
            #   ends, not every step.
            #
            #   Why this and not newtons: theta_dot decays on its own along
            #   theta - theta_dot/lambda and only xi grows, as e^(lambda t).
            #   So xi is "how much trouble am I in", independent of how the
            #   trouble arrived. S2 measured 0.0014 rad/N for both
            #   controllers, because xi is read 5 ms after the impulse before
            #   feedback can act: the SLOPE is physics, the FALL THRESHOLD in
            #   xi is the controller. That threshold is the number to report.
            #   It also survives to hardware in S14, where you are shoving the
            #   robot by hand and cannot quote a force at all.
            #   Sampled once, when the push ends -- not a running max. A
            #   running max over the whole episode would report how much
            #   trouble the controller got itself into, which for a falling
            #   robot is just the fall. NaN when there is no push, so an
            #   unpushed episode cannot be mistaken for one that survived a
            #   zero-size disturbance.
            xi = float("nan")
            terminated = False

            def record(obs):
                # Called on the reset state and after every step, so the
                # terminal observation -- necessarily the largest |theta|
                # in a failed episode -- is not missed.
                nonlocal max_theta, min_theta, sum_abs_theta, n_theta
                theta = float(obs[0])
                max_theta = max(max_theta, theta)
                min_theta = min(min_theta, theta)
                sum_abs_theta += abs(theta)
                n_theta += 1

            record(observation)

            for i in range(max_steps):
                if push is not None:
                    if i == push_step:
                        simulator.set_external_forces(
                            {
                                "torso": ExternalForce(
                                    force=np.array([push, 0.0, 0.0]),
                                    local=False,
                                )
                            }
                        )
                    elif i == push_step + push_len:
                        # The backend re-applies a stored force on every step
                        # until it is overwritten, so the push has to be
                        # switched off by hand or it becomes a wind tunnel.
                        simulator.set_external_forces(
                            {"torso": ExternalForce(force=np.zeros(3), local=False)}
                        )
                        xi = observation[0] + observation[2] / LAMBDA

                # Observation layout is [theta, p, theta_dot, p_dot]:
                #   obs[0] pitch, obs[1] ground position,
                #   obs[2] pitch rate, obs[3] ground velocity.
                action = np.asarray(policy(observation), dtype=float)

                # Smoothness is a property of the COMMAND, not of the measured
                # velocity -- the plant filters the command, so obs[3] is
                # exactly where chatter hides. And the difference is absolute:
                # a signed sum telescopes to (last - first), cancelling every
                # intermediate step however violently it oscillated.
                if previous_action is not None:
                    delta_a += float(np.abs(action - previous_action).sum())
                    n_delta += 1
                previous_action = action.copy()

                observation, reward, terminated, truncated, info = env.step(action)
                episode_length += 1
                record(observation)
                if terminated or truncated:
                    break
            results.append(
                {
                    "episode_length": episode_length,
                    "fell": bool(terminated),
                    "max_theta": max_theta,
                    "min_theta": min_theta,
                    "mean_abs_theta": sum_abs_theta / n_theta,
                    "mean_delta_a": delta_a / n_delta if n_delta else 0.0,
                    "p_drift": abs(float(observation[1])),
                    "xi": xi,
                }
            )

    return summarize(results)


def report(name, summary) -> None:
    print(f"{name}")
    print(
        f"  episodes {summary['n_episodes']}, fell {summary['n_fell']}"
    )
    for key in METRICS:
        mean, std = summary[f"{key}_mean"], summary[f"{key}_std"]
        print(f"  {key:<16} {mean:+10.4f} +/- {std:.4f}")
    print()


if __name__ == "__main__":
    # The whole point of the callable contract: `evaluate` never learns what a
    # gain vector is. In S5 this is replaced by a wrapper around
    # model.predict(obs, deterministic=True) and nothing else changes.
    GAIN = np.array([10.0, 1.0, 0.0, 0.1])

    def pd_policy(obs):
        return np.clip(
            [GAIN @ obs], -MAX_GROUND_VELOCITY, MAX_GROUND_VELOCITY
        )

    report("PD baseline [10, 1, 0, 0.1], undisturbed", evaluate(pd_policy))
    report(
        f"PD baseline [10, 1, 0, 0.1], {PUSH:.0f} N push at step {PUSH_STEP}"
        " -- THE ROW TO BEAT",
        evaluate(pd_policy, push=PUSH),
    )
