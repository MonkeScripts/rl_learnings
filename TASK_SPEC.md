# TASK_SPEC.md

Written in Session 4 (2026-08-25). Every constant here is either given by the
environment or was measured in Sessions 1-3 — none is an inherited default,
with the exceptions flagged under *Unexamined constants* at the bottom.

**Rule: any number in this file is part of the ruler.** Changing one voids every
score recorded against it. See `LOGBOOK.md` for what each was measured from.

---

## 1. Environment

`Upkie-PyBullet-Pendulum` (upkie 12.0.0). Sim-to-real is `PyBullet` -> `Spine`
in the env ID and nothing else.

## 2. Observation space

4D, `[θ, p, θ̇, ṗ]`:

| idx | symbol | meaning | unit |
|---|---|---|---|
| 0 | θ | base pitch, 0 = upright | rad |
| 1 | p | average wheel contact position | m |
| 2 | θ̇ | pitch rate | rad/s |
| 3 | ṗ | contact-point ground velocity | m/s |

Ranked by S3 ablation (falls out of 20 when zeroed, PD, pushed condition):

    θ  20/20  ≫  ṗ  19/20  ≫  [full PD 8/20]  ≫  p  1/20

`p` is **net harmful under disturbance** — removing it cuts falls 8x. It costs
4x the mean drift and 22x the spread undisturbed (Q11). Kept because S15 needs
position/velocity tracking, not because it helps balancing.

θ̇ is untested: PD's gain on it is 0, so the ablation could not move it (Q5).

## 3. Action space

1D: commanded ground velocity ṗ*, **±3.0 m/s** (`max_ground_velocity`, the env
default, adopted deliberately in S4).

The env converts it: `wheel_velocity = ṗ* / 0.05 = 20·ṗ* rad/s`. Wheel limits are
1.7 N·m effort and 111 rad/s, so torque binds long before velocity does:
3.4 N·m / 0.05 m = 68 N -> 12.7 m/s² -> 236 ms to reach 3 m/s.

**Set the limit via `max_ground_velocity`, never by clipping inside the policy.**
For a deterministic controller the two are identical; for PPO they are not, because
SB3 scales its exploration Gaussian to the declared action space. A ±3.0 Box with a
±0.99 clip wastes most of its exploration on commands that are silently discarded.

S1-S3 used a ±0.99 clip inherited from the upstream example. It caused 8 falls in
20 that the gains were being blamed for (S4). Do not reintroduce it.

## 4. Control frequency and discount

**200 Hz** (`dt = 5 ms`). `pd_balancer.py` runs at 1000 Hz as an S1 demo only;
no number from it is comparable to anything here (Q4).

The pendulum's unstable mode, measured off the model
(CoM 0.3546 m, wheel radius 0.05 m, so l = 0.3046 m):

    λ = √(g/l) = 5.675 rad/s   ->   e-fold 176 ms,   doubling 122 ms

**γ = 0.99 at 200 Hz** -> `1/(1-γ)` = 100 steps -> **0.50 s** -> **4.1 doublings**.
Long enough for the value function to watch a fall develop and a recovery finish.

γ is meaningless without its frequency: the same 0.99 at 1000 Hz gives 0.10 s, i.e.
0.8 doublings — the value function could not perceive a single doubling of the lean.
**Always write γ with its Hz.**

## 5. Episode

- **Termination** — fall, `|θ| > fall_pitch = 1.0 rad`. Absorbing; no bootstrap.
- **Truncation** — time limit. The state was *not* terminal, so the value function
  **must bootstrap**: `y = r + γ·V(s')`.

**The time limit is reported as `truncated`, never `terminated`.** With ~+1 reward
per step and γ=0.99 a healthy state is worth ~100; labelling the clock as
termination declares an upright robot at the horizon worth 1, so the agent cannot
distinguish "about to fall" from "about to run out of time". The policy is stateless
and cannot see the clock, so it enters as value-function noise — no crash, no error,
just a policy that trains worse for no visible reason (Q12).

`UpkieEnv.step` hardcodes `truncated = False` and ships no `TimeLimit` wrapper, so
this is not yet a live bug (Q13). It goes live in S5. Gymnasium's own `TimeLimit`
sets `truncated=True` correctly; a hand-rolled cap is the hazard. **Check what
`rl_zoo3_balancer` wraps before trusting its episode ends.**

## 6. Initial state distribution

    PITCH   = 0.05 rad   (2.9°)
    OMEGA_Y = 0.2 rad/s

**Without these, seeds do nothing.** `RobotStateRandomization` defaults to zero
amplitudes, so every seed samples the identical state and 20 episodes are 20 copies
of one episode. S2 run C: two controllers with a 7x difference in push tolerance
both survived 30 s undisturbed and scored *identical* (Q9).

## 7. Reward

Shape only — **weights are set in S7**. Scaling discipline: bring each term to a
comparable magnitude *first*, then weight, keeping per-step reward roughly in
[-1, 1]. A term that dominates by 100x is the only term that exists.

| term | on | source |
|---|---|---|
| **survival** | +1 per step alive | env default; termination carries it |
| **upright** | penalty on \|θ\| | "fails when the pitch observation is unavailable" |
| **station-keeping** | penalty on \|p\|, \|ṗ\| | "fails when ground-velocity feedback is removed" |
| **action rate** | penalty on \|aₜ − aₜ₋₁\| | not a failure that was found — included anyway |

The base env gives `reward = 1.0` hardcoded with the comment *"reward can be decided
by a wrapper"*, so survival is free and **every other term needs a wrapper**.

**Known conflict, to be resolved in S7 rather than discovered there:**
station-keeping rewards the behaviour the S3 ablation showed is harmful. Zeroing
position feedback cut falls from 8/20 to 1/20. A strong station-keeping weight should
be expected to *cost* robustness. The term is kept because S15 replaces it with
velocity tracking, where it becomes the objective rather than a nuisance.

**Do not omit the action-rate penalty.** RL exploits high-frequency action noise that
PyBullet absorbs — no bandwidth limit, no backlash, no thermal budget — and real
actuators do not. Baseline to weight against: **mean|Δa| = 0.00695** (PD, pushed).

## 8. Evaluation protocol

`scripts/evaluate.py`, on any `policy(obs) -> action` callable.

    seeds        range(20), fixed, identical for every controller
    max_steps    2000  (10 s at 200 Hz)
    push         460 N for 1 step at step 400   (J = 2.30 N·s, ξ = 0.6469)

**The pushed condition is primary.** Not merely because undisturbed saturates, but
because it *inverts the ranking*: undisturbed, zeroing ground velocity costs nothing
(0/20 fall); under push it is nearly fatal (19/20). A metric that reorders the
observations is wrong, not just blunt (Q10).

**Headline statistic: mean episode length.** Fall count is reported alongside as
readable colour and is never the tested quantity. At n=20 the binomial σ on a
fall count near 50% is ±2.24 counts, so fall count resolves ~30 percentage points;
mean episode length resolves 1.9%. Binarising discards *when* it fell, which is most
of the information.

Robustness axis is **ξ = θ + θ̇/λ**, the divergent component, sampled once on the step
the push ends. Only ξ grows (as e^{λt}); the θ − θ̇/λ mode decays unaided. ξ is
independent of how the disturbance arrived, and computable from the IMU on hardware
in S14 where no force can be quoted. Measured at 0.0014 rad/N, confirmed three times
by three methods.

## 9. The baseline to beat

PD `[10, 1, 0, 0.1]`, ±3.0 action limit, 460 N push, 20 seeds:

| metric | value |
|---|---|
| **mean episode length** | **1950.5 ± 57.1** |
| fell | 10/20 |
| ξ | 0.6469 |
| mean\|Δa\| | 0.00695 |

Supersedes the S3 baseline, which was measured at the ±0.99 clip.

Note this gain vector is **known not to be optimal**: `[10, 0, 0, 0.1]` beats it
badly on robustness. It is the baseline because it is the hand-tuned one, and the
plan's argument is that a neural policy must clear the honest non-RL attempt.

## 10. Unexamined constants

Inherited or arbitrary, still unjustified by measurement (Q15). The ±0.99 clip was
in this category for three sessions and turned out to dominate the failure rate.

    push_step  = 400     arbitrary
    max_steps  = 2000    arbitrary
    fall_pitch = 1.0     env default
    frequency  = 1000    in pd_balancer.py, inherited from the upstream example

## 11. Open questions with deadlines

- **Q16, before the first S9 randomisation run.** The fixed-force metric has ~200 N
  of usable scale: below ~410 N every controller reads 0/20, above ~600 N every
  controller reads 20/20. S9 randomises mass ±20% and S17 adds a payload; either can
  shift the curve off the end, and the robustness column would go quiet for reasons
  unrelated to the policy. The alternative is **ξ₅₀** — the disturbance at which the
  controller falls half the time. Continuous, never saturates, ~5 evaluations
  (~4 min) per controller instead of 40 s.
