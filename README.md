# rl_learnings — Upkie RL balancing, 20 sessions

Working through `~/Downloads/upkie-rl-balancing-plan.md`. Goal: a neural policy
trained in sim that balances a real Upkie, plus enough understanding to debug it.

**No real Upkie.** The hardware I own is the micro wheeled-leg robot in
`~/wheeled_robot`, with the `~/rl_toys` (wlbot) pipeline aimed at it. So:
learn on Upkie *sim*, deploy on *my* robot. Phase C/D hardware sessions
(10, 11, 12, 14) retarget onto the wlbot Stage-A host loop rather than a pi3hat
spine. Kept separate from rl_toys so that when something breaks I know whether
it is my robot or my understanding.

## Setup

`pixi install`. Env pins `upkie==12.0.0` — the plan's stack table is verified
against this version. Upstream source checkout for reading/examples: `~/upkie`.

| Command | What |
|---|---|
| `pixi run pd` | PD balancer, headless |
| `pixi run pd-gui` | PD balancer, PyBullet GUI |

## Key facts about the stack (v12)

- Env IDs are `Upkie-<Backend>-<ActionSpace>`, backends `Mock` / `PyBullet` / `Spine`,
  action spaces `Pendulum` / `Servos` / `Gyropod` / `BaseVelocity`.
  They register lazily — you must call `upkie.envs.register()` first.
- `Upkie-*-Pendulum`: **1D action** = commanded ground velocity ṗ* (m/s).
  **4D observation** = `[θ, p, θ̇, ṗ]` = pitch (rad), ground position (m),
  pitch rate (rad/s), ground velocity (m/s).
- Sim → real is literally `PyBullet` → `Spine` in the env ID. The same script
  must run in both. That property is the backbone of the whole plan.

## Layout

- `LOGBOOK.md` — the review ritual. Not optional.
- `TASK_SPEC.md` — written in Session 4.
- `scripts/` — my own code. `pd_balancer.py` (S1), `evaluate.py` (S3).
- `runs/` — training output, gitignored.
- `notes/` — reading notes per session.
# rl_learnings
