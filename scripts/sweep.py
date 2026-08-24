# SPDX-License-Identifier: Apache-2.0
#
# /// script
# dependencies = ["upkie", "pybullet"]
# ///

"""Session 2: sweep PD gains and measure push robustness."""

import numpy as np
import gymnasium as gym

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


def pd_action(obs, gain):
    """Linear feedback: one gain per observation component."""
    return np.clip([gain @ obs], -0.99, 0.99)


def run_trial(
    gain,
    push_force=None,
    push_step=400,
    push_len=1,
    seed=0,
    max_steps=6000,
):
    """Run one episode, optionally pushing the torso, and score it."""
    gain = np.asarray(gain, dtype=float)
    max_abs_pitch = 0.0
    xi = float("nan")  # divergent component of motion, sampled after the push

    with gym.make(
        "Upkie-PyBullet-Pendulum",
        frequency=FREQUENCY,
        gui=False,
        # Without this the env sleeps to hold 200 Hz in wall-clock time, so a
        # 2000-step trial takes 10 s instead of 2 s. Only matters for sweeps;
        # the real robot obviously does regulate.
        regulate_frequency=False,
    ) as env:
        simulator = env.unwrapped.backend
        observation, info = env.reset(seed=seed)

        for i in range(max_steps):
            if push_force is not None:
                if i == push_step:
                    simulator.set_external_forces(
                        {"torso": ExternalForce(force=push_force, local=False)}
                    )
                elif i == push_step + push_len:
                    # The backend re-applies a force every step until it is
                    # overwritten, so a push has to be switched off by hand.
                    simulator.set_external_forces(
                        {"torso": ExternalForce(force=np.zeros(3), local=False)}
                    )
                    xi = observation[0] + observation[2] / LAMBDA

            action = pd_action(observation, gain)
            observation, reward, terminated, truncated, info = env.step(action)

            max_abs_pitch = max(max_abs_pitch, abs(observation[0]))
            if terminated or truncated:
                break

    steps = i + 1
    return {
        "steps": steps,
        "fell": steps < max_steps,
        "max_abs_pitch": max_abs_pitch,
        "final_position": abs(observation[1]),
        "xi": xi,
    }


def max_push_survived(gain, forces, **kwargs):
    """Ramp the push until the robot falls. Returns the last one it survived."""
    best = None
    for fx in forces:
        result = run_trial(gain, push_force=np.array([fx, 0.0, 0.0]), **kwargs)
        impulse = fx * DT * kwargs.get("push_len", 1)
        print(
            f"    fx={fx:6.1f} N  J={impulse:5.2f} N.s  xi={result['xi']:+.3f}"
            f"  steps={result['steps']:4d}  {'FELL' if result['fell'] else 'ok'}"
        )
        if result["fell"]:
            break
        best = (fx, impulse, result["xi"])
    return best


if __name__ == "__main__":
    nominal = np.array([1.0, 0.0, 0.0, 0.1])

    print(
        f"lambda = {LAMBDA:.3f} rad/s, doubling time "
        f"{1000 * np.log(2) / LAMBDA:.0f} ms\n"
    )

    print("no push, nominal gains:")
    print(" ", run_trial(nominal), "\n")

    # One gain at a time. Edit the values, read the failure modes.
    for index, name, values in [
        (0, "K_pitch", [1.0, 2.0, 5.0, 10.0, 20.0, 40.0]),
        (1, "K_position", [0.0, 0.5, 1.0, 2.0, 4.0, 8.0, 16.0, 32.0]),
        (2, "K_pitch_rate", [0.0, 0.2, 0.5, 1.0, 2.0, 4.0]),
        (3, "K_velocity", [0.0, 0.1, 0.3, 1.0]),
    ]:
        print(f"{name}:")
        for value in values:
            gain = nominal.copy()
            gain[index] = value
            result = run_trial(gain)
            print(
                f"  {value:5.1f} -> steps={result['steps']:4d}"
                f"  max|pitch|={result['max_abs_pitch']:.3f}"
                f"  |p|={result['final_position']:.3f}"
            )
        print()

    print("push ramp, nominal gains:")
    max_push_survived(nominal, forces=[10, 20, 40, 80, 160, 320, 640])
