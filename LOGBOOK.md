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
| 2026-08-24 | 2 | One-gain-at-a-time sweep reveals each gain's failure mode | `scripts/sweep.py`, 200 Hz, headless, seed 0, 2000 steps (**= 10 s only**) | nominal `[10,1,0,0.1]`: 2000 steps, max\|θ\|=0.016, \|p\|=0.119 m | see per-gain rows below | Partial — K_position range/window inadequate, see Q6 |
| 2026-08-24 | 2 | `K_pitch` too low fails to hold, too high overreacts | swept 2 / 5 / 10 / 20 / 40 | — | 2.0 **falls at 789 steps**; 5–20 survive; 40 degrades (max\|θ\|=0.161, drift 0.534 m) | Confirmed. Usable band ≈ 5–20. |
| 2026-08-24 | 2 | `K_pitch_rate` adds damping | swept 0 / 0.2 / 0.5 / 1 / 2 | 0.0: max\|θ\|=0.016, \|p\|=0.119 | 0.5: max\|θ\|=0.011, \|p\|=0.047. **1.0 and 2.0 fall.** | Confirmed with a caveat — narrow band, see Q5 |
| 2026-08-24 | 2 | `K_velocity` trades smoothness for sluggishness | swept 0 / 0.1 / 0.3 / 1.0 | — | all survive; 1.0 degrades max\|θ\| to 0.140 | Weak effect in this range |
| 2026-08-24 | 2 | Push robustness of the nominal gains | force on `torso`, 1 step @ 5 ms, ramped | — | **survives J=1.60 N·s (320 N), ξ=0.436 rad; falls at J=3.20 N·s (640 N), ξ=0.884 rad** | Baseline robustness number for S3 |
| 2026-08-24 | 2 | **(run A, `nominal=[10,1,0,0.1]`)** Extending `K_position` to 32 exposes the non-minimum-phase cost Q6 predicts | re-ran the sweep with `K_position` ∈ {0, 0.5, 1, 2, 4, 8, 16, 32}; **`max_steps` left at 2000 (10 s)** | K_pos=4: max\|θ\|=0.017, \|p\|=0.032 | K_pos=8: 0.022 / 0.016 · 16: **0.045** / 0.006 · 32: **falls at 95 steps (0.48 s)** | Confirmed, but read it in the *pitch* column: drift shrinks monotonically to 0.006 m while pitch excursion triples. Range was too narrow. **Window still untested — see Q6.** |
| 2026-08-24 | 2 | **(run A)** `K_pitch` below the usable band simply fails to hold | added `K_pitch`=1.0 to the sweep | 2.0: **falls at 789 steps** | 1.0: 2000 steps, max\|θ\|=0.020, **\|p\|=0.002** — the lowest drift in the entire sweep | **Refuted, and non-monotonic.** A gain 10x weaker than nominal survives while 2.0 falls. Triggered run B. |
| 2026-08-24 | 2 | **(run A)** ξ = θ + θ̇/λ is a valid scalar axis for push size | read ξ across the force ramp | — | ξ ratio per force doubling: 5.7, 2.6, 2.24, 2.11, 2.05, **2.03**; slope **0.0014 rad/N = 0.27 rad per N·s** | Confirmed above ~40 N. ξ is linear in impulse, so it is the right disturbance axis for S3. Low-force deviation is the controller's own residual state at step 400. |
| 2026-08-24 | 2 | **(run B, `nominal=[1,0,0,0.1]`)** the weak-pitch survivor from run A is a real controller | set `nominal = [1, 0, 0, 0.1]`, re-ran the whole sweep | `[10,1,0,0.1]`: survives J=1.60 N·s, ξ=0.436 | survives 10 s undisturbed (max\|θ\|=0.019, \|p\|=0.0020) but **falls at J=0.40 N·s (80 N), ξ=0.117**, 1.8 s after the push | **Refuted — ~7x less push tolerance.** `\|p\|=0.002` means *never displaced*, not *well regulated*. |
| 2026-08-24 | 2 | **(run B)** the push-ramp slope is a property of the controller | compared the ξ-vs-force fits of both nominals | run A slope 0.0014 rad/N | run B slope **0.0014 rad/N**, identical | **Refuted, usefully.** ξ is sampled 5 ms after the impulse, before the controller can respond — so **slope = disturbance, fall threshold in ξ = controller**. Thresholds: A ∈ (0.436, 0.884), B ∈ (0.061, 0.117). Free self-consistency check on the instrumentation. |
| 2026-08-24 | 2 | **(run B)** survival around `[1,0,0,0.1]` is a stability region with a findable boundary | one-at-a-time sweep off the new nominal | — | `K_velocity`: 0.0 **fell 343**, 0.1 ok, 0.3 **fell 1379**, 1.0 ok (\|p\|=6.278, max\|θ\|=0.168). `K_pitch_rate`: 0.0 ok, **every nonzero value fell** (0.2/0.5/1/2/4 → 348/634/398/321/334 steps, no ordering) | **Refuted.** Non-monotonic in two gains with unordered fall times — the signature of a slowly growing mode, not a boundary. Feeds Q7. |
| 2026-08-24 | 2 | **(run C)** `[1,0,0,0.1]` falls between 10 s and 30 s undisturbed while `[10,1,0,0.1]` does not (**prediction on record**) | `max_steps=6000`, undisturbed, seed 0, both nominals | both survive 10 s | **both survive 6000 steps (30 s)** | **Refuted.** Extending the window separates nothing. The undisturbed test has no discriminating power at all. |
| 2026-08-24 | 2 | **(run C)** Q7's dichotomy — marginally stable *vs* slowly diverging | logged θ and p every 500 steps instead of extremes only (the instrumentation gap noted above) | — | `[1,0,0,0.1]`: θ bounded ±0.010 rad, p pinned +0.0018 m. `[10,1,0,0.1]`: θ bounded ±0.014 rad, p settles −0.119 m. **Neither grows.** | **False dichotomy — both are locally stable.** The difference is *basin size*, which no undisturbed trial can see. |
| 2026-08-24 | 2 | **(run C)** basin of attraction is the thing the push ramp was actually measuring | `update_init_rand(pitch=0.02, omega_y=0.1)`, seeds 0-4, 6000 steps | undisturbed: both 6000/6000, **scored identical** | `[1,0,0,0.1]` → **2/5** survive; `[10,1,0,0.1]` → **4/5** | **Decisive, and it settles the S3 design.** A 1.1° initial lean separates two controllers that 30 s of undisturbed simulation calls equal. |
| 2026-08-24 | 2 | **(run C)** the −0.119 m offset of `[10,1,0,0.1]` is drift | solved the zero-action equilibrium `K_θ·θ + K_p·p = 0` | — | predicts `p = −(K_θ/K_p)·θ = −10 × 0.0115 = −0.115 m` vs **measured −0.118 m** | **Refuted — it is an equilibrium, not drift.** Implies a **static pitch bias ≈ 0.012 rad (0.7°)** in the model, amplified into position error by the gain ratio `K_θ/K_p`. This is the S12 IMU-mounting-bias mechanism, in sim. |
| 2026-08-24 | 2 | **(bookkeeping)** run A and run B sweep columns can be compared row-for-row | — | run A `K_pitch`=40: \|p\|=0.534 | run B `K_pitch`=40: **\|p\|=4.759** | **False.** Changing `nominal` re-based every column; each column is conditional on the other three gains. Same seed, so run A reproduces the earlier rows exactly where the gains match. |

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

### Session 2 — 2026-08-24
- **Surprise:** `K_pitch_rate` is not monotonically helpful. Textbook damping should
  only ever calm things down; here 1.0 and 2.0 *fall*. The action being a velocity
  command rather than a torque is the suspected cause (Q5).
- **Surprise (tooling):** the env sleeps to hold 200 Hz in *wall-clock* time, so a
  2000-step trial cost 10 real seconds. `regulate_frequency=False` → 2 s. Sweeps are
  5x faster. Real deployment must keep regulation on.
- **Confusion:** why the predicted non-minimum-phase oscillation from `K_position`
  never appeared (Q6). A physics prediction that failed to reproduce is not yet a
  refutation — the test window may simply have been too short.
- **Caveat on every S2 number:** 2000 steps @ 200 Hz is **10 seconds**. "steps=2000"
  means *survived 10 s*, not *balances*.

#### Session 2, runs A and B (same day, after the first sweep)
- **Surprise:** the *weakest* pitch gain posted the *best* undisturbed numbers.
  `[1, 0, 0, 0.1]` holds max|θ|=0.019 and |p|=0.0020 for 10 s — better station-keeping
  than any other row in the sweep — and then falls to a push 7x smaller than the one
  `[10, 1, 0, 0.1]` absorbs. **|p|=0.002 does not mean "regulates position." It means
  "was never displaced."** Seed 0 resets nearly balanced, and 10 s is not long enough
  for a near-zero initial condition to grow to the 1 rad fall threshold.
- **Surprise (measurement):** the ξ-vs-force slope came out at **0.0014 rad/N for both
  controllers**. That is not a coincidence and it is not a null result — ξ is sampled
  5 ms after the impulse, before feedback can act, so the slope is pure physics. It is a
  free check that the push instrumentation is measuring what it claims to.
- **Confusion (→ Q7):** whether `[1, 0, 0, 0.1]` is marginally *stable* or slowly
  *diverging*. The evidence leans diverging: falls at 0.2/0.5/1/2/4 pitch-rate gain with
  unordered fall times (348/634/398/321/334), and K_velocity 0.0 falls / 0.1 survives /
  0.3 falls / 1.0 survives. Non-monotonic survival with unordered fall times is what a
  slowly growing mode looks like, not what a stability boundary looks like.
- **Instrumentation gap:** `max_abs_pitch` and `final_position` are *extremes* — they
  throw away the shape of the trajectory. Whether `K_pitch=1.0` was settling or creeping
  had to be inferred from the push ramp; logging θ at even five checkpoints per trial
  would have shown it directly. Fix before S3.
  **Fixed in run C, and it paid immediately:** twelve θ/p checkpoints showed both
  controllers bounded, killing the "slowly diverging" hypothesis in one run, and exposed
  the static pitch bias of Q8 as a side effect.
- **Process note:** editing `nominal` re-bases every column of the sweep. Runs A and B
  are not row-comparable. Record the gain vector on every table row from now on.

#### Session 2, run C — the session's actual lesson
- **The prediction I recorded was wrong, and the way it was wrong is the finding.**
  `[1,0,0,0.1]` did not fall inside 30 s. Neither controller diverges. Undisturbed
  episodes from a near-perfect equilibrium **cannot rank controllers at all** — the
  robot is never asked a question, so any controller "passes."
- **Two controllers with a 7x difference in push tolerance scored identically** on the
  undisturbed test (6000/6000 both). One 1.1° initial lean separates them 2/5 vs 4/5.
  This is the plan's central thesis landing one session before the harness that fixes it:
  *you cannot tell whether a change helped without a measurement built for the purpose.*
- **Consequence:** every no-push row in this table is superseded, not wrong — the numbers
  reproduce exactly, they just measure the wrong thing. The push-ramp rows survive,
  because a push is the only real question any of those trials asked.

---

## 3. Next session's single target

One sentence, measurable. "Get mean episode length above 800 steps under 30 ms
action lag" — not "work on domain randomization."

- **After session 1:** Find, by one-gain-at-a-time sweep, the gain vector that survives
  the largest push; and record the three failure sets (oscillates / wanders / falls)
  with the gain values attached.
- **After session 2:** *(superseded — range half of Q6 answered in run A, window half
  still open)*
- **After runs A and B:** Set `max_steps = 6000` (30 s) and run **two** undisturbed
  trials, `[1, 0, 0, 0.1]` and `[10, 1, 0, 0.1]`. Prediction on record: **the first falls
  between 10 s and 30 s, the second does not.** That one change settles Q7 and the window
  half of Q6 for ~8 s of compute. Then revert `nominal` to `[10, 1, 0, 0.1]` and bisect
  the push between 320 N and 640 N to commit a single ξ threshold before the S3
  ablations.
- **After run C (→ S3):** Build `evaluate.py` with initial-state randomization **on**
  and its amplitudes frozen (Q9), and report **mean episode length over 20 seeds ± std**
  for `[10, 1, 0, 0.1]`. Every undisturbed single-seed number above is superseded: the
  test that produced them cannot distinguish a good controller from a bad one.

---

## Standing questions (carried forward)

| # | Question | Raised | Answered | Answer |
|---|---|---|---|---|
| Q1 | Which of the 4 obs components matters most for staying upright? | S1 (guess: **pitch**) | S3 (ablation) | |
| Q2 | Does `env.step()` do the PID — subtract from target, form the error, multiply by gains? | S1 | S1 | **No.** `step()` does no balancing feedback at all. It pads 1D→2D, converts ground velocity to wheel velocity by pure kinematics (`ṗ*/wheel_radius`), regulates loop rate, and hands a servo dict to the backend. The only PID downstream is the **joint servo loop** (PyBullet `VELOCITY_CONTROL`; moteus firmware on hardware) which answers a *different* question — "what torque achieves this wheel velocity?" — not "how do I stay upright." See Q3. |
| Q3 | Why is there no subtraction in the control law? | S1 | S1 | Every setpoint is zero (θ\*=0, p\*=0, ṗ\*=0), so `e = 0 − o = −o` and `a = −K·e` collapses to `a = +K·o`. **The observation *is* the error.** This stops being true in S15, when a commanded velocity makes ṗ\* nonzero and the subtraction reappears. |
| Q4 | Loop frequency: the script runs at 1000 Hz, the plan and README say 200 Hz. Which, and does it matter? | S1 | S2 | **Split, deliberately.** `pd_balancer.py` stays at **1000 Hz** as the committed S1 demo; all *measurement* (`sweep.py`, and `evaluate.py` in S3) runs at **200 Hz**. Consequence to respect: the demo script is not the controller being scored, so never quote a number from one against the other. γ in S4 and the latency budget in S8 are both computed against **200 Hz**. |
| Q5 | `gain[2] = 0` — no pitch-rate term. What does real pitch damping buy over the velocity term currently standing in for it? | S1 | S2 | **A narrow useful band, then it kills you.** 0.2–0.5 behaves like damping (max\|θ\| 0.016→0.011, drift 0.119→0.047 m); 1.0 and 2.0 both fall. Reason to carry forward: the action is a *velocity* command, not a torque, so pitch-rate feedback closes a fast loop through the servo layer rather than adding mechanical damping. **Caveat added after run B: that band is conditional on `K_position`=1.0 being present.** With `[1, 0, 0, 0.1]` as the base, *every* nonzero pitch-rate gain falls. Quote the answer with its gain vector attached. |
| Q6 | Does high `K_position` produce the slow non-minimum-phase oscillation the physics predicts? | S2 | S2 (**partial**) | **Range was too narrow; the cost is real but shows up in pitch, not position.** Over 0→32 with `[10, ·, 0, 0.1]`, drift falls monotonically all the way to 0.006 m at K_pos=16 while max\|θ\| climbs 0.017 → 0.022 → **0.045**, then 32 falls at 95 steps. So you buy station-keeping and pay in pitch excursion, as predicted. **But the 32.0 failure is fast divergence (0.48 s), not the slow multi-second oscillation that was hypothesised, and `max_steps` was never raised — the window half of this question is still untested.** |
| Q7 | Is `[1, 0, 0, 0.1]` marginally stable, or just diverging too slowly to fall inside a 10 s window from a near-zero reset? | S2 (runs A/B) | S2 (run C) | **Neither — the dichotomy was false.** Over 30 s undisturbed, θ stays bounded within ±0.010 rad and p within 0.002 m: it is genuinely locally stable, not diverging. What it lacks is **basin size** — under a 0.02 rad initial lean it survives 2/5 seeds vs 4/5 for `[10,1,0,0.1]`. The prior evidence (7x lower push threshold, non-monotonic survival) was measuring the basin all along. |
| Q8 | Why does `[10,1,0,0.1]` stand at p = −0.119 m when it has position feedback and `[1,0,0,0.1]` does not? | S2 (run C) | S2 (run C) | **Static pitch bias ≈ 0.012 rad (0.7°) in the PyBullet model.** At equilibrium `K_θ·θ + K_p·p = 0`, so `p = −(K_θ/K_p)·θ ≈ −0.115 m`, measured −0.118 m. The position loop cannot null a pitch bias; it trades it for a standing position offset amplified by `K_θ/K_p`. **Carry to S12** — this is the IMU-mounting-bias mechanism, and the gain ratio is the exchange rate. |
| Q9 | What initial-state randomization amplitudes should `evaluate.py` freeze? | S2 (run C) | | `pitch=0.02, omega_y=0.1` demonstrably discriminates, but was picked to make a point, not tuned. Needs to be wide enough to separate controllers and narrow enough that a good controller still scores well. **Whatever is chosen must be frozen and recorded — it is the ruler's unit, and changing it voids every prior number.** |
