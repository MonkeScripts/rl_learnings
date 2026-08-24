# LOGBOOK

The 15-minute ritual at the end of every session. Three parts, five minutes each.
Rule: **never write "seemed better." If there is no number, that absence is the finding.**

Once a week, re-read the last five rows before starting. The biggest time sink in
robot RL is re-running an experiment you already ran.

---

## 1. What changed, numerically

| Date | Session | Hypothesis | Change made | Metric before | Metric after | Verdict |
|---|---|---|---|---|---|---|
| 2026-08-24 | 1 | A 3-term linear feedback on `[θ, p, ṗ]` balances Upkie in PyBullet | Wrote `scripts/pd_balancer.py`, gains `[10, 1, 0, 0.1]`, clip ±0.99 m/s, 1000 Hz | — | — | Balances. **No number yet — `evaluate.py` is S3.** This row is qualitative and that is the finding. |
| 2026-08-24 | 1 | Zeroing the gains makes it fall, proving the loop is live and not just a stable sim | Set `gain = 0` | — | — | **Confirmed — falls immediately.** The loop is driving the robot; the sim is not passively stable. No number (S3). |

---

## 2. Surprises and confusions

A confusion that appears three sessions running gets promoted to a session objective.

### Session 1 — 2026-08-24
- **Surprise:** The controller has no subtraction in it. Expected `error = target − measured`;
  instead the raw observation is fed straight through the gains.
- **Confusion (resolved this session, see Q2):** what `env.step()` actually computes —
  whether the PID lives inside it.
- **Guess to check in S3:** **pitch (`obs[0]`) matters most for staying upright.**
  Ablation in Session 3 confirms or kills this.

---

## 3. Next session's single target

One sentence, measurable. "Get mean episode length above 800 steps under 30 ms
action lag" — not "work on domain randomization."

- **After session 1:** Find, by one-gain-at-a-time sweep, the gain vector that survives
  the largest push; and record the three failure sets (oscillates / wanders / falls)
  with the gain values attached.

---

## Standing questions (carried forward)

| # | Question | Raised | Answered | Answer |
|---|---|---|---|---|
| Q1 | Which of the 4 obs components matters most for staying upright? | S1 (guess: **pitch**) | S3 (ablation) | |
| Q2 | Does `env.step()` do the PID — subtract from target, form the error, multiply by gains? | S1 | S1 | **No.** `step()` does no balancing feedback at all. It pads 1D→2D, converts ground velocity to wheel velocity by pure kinematics (`ṗ*/wheel_radius`), regulates loop rate, and hands a servo dict to the backend. The only PID downstream is the **joint servo loop** (PyBullet `VELOCITY_CONTROL`; moteus firmware on hardware) which answers a *different* question — "what torque achieves this wheel velocity?" — not "how do I stay upright." See Q3. |
| Q3 | Why is there no subtraction in the control law? | S1 | S1 | Every setpoint is zero (θ\*=0, p\*=0, ṗ\*=0), so `e = 0 − o = −o` and `a = −K·e` collapses to `a = +K·o`. **The observation *is* the error.** This stops being true in S15, when a commanded velocity makes ṗ\* nonzero and the subtraction reappears. |
| Q4 | Loop frequency: the script runs at 1000 Hz, the plan and README say 200 Hz. Which, and does it matter? | S1 | | Matters concretely: S4 derives γ's horizon *in seconds* from it, S8 tunes latency against it. Pick one before S4. |
| Q5 | `gain[2] = 0` — no pitch-rate term. What does real pitch damping buy over the velocity term currently standing in for it? | S1 | S2 (gain sweep) | |
