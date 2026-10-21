---
day: 10
minutes: 60
widgets: [curve-reader]
quiz:
  - kind: why
    q: "A training curve of mean episode length (out of 1000 steps) swings by about 60 steps between iterations while the policy barely changes. Two evaluations of one checkpoint, each with a fresh seed and the same domain randomisation as training, take the mean action over 1000 full episodes and agree within 0.4 points of survival. Why do they agree so much better?"
    choices:
      - "Evaluations run on a more accurate simulator than the one used for training."
      - "They drop the noise sources: no sampled actions, many full episodes, one fixed policy."
      - "The training curve is smoothed by the logger, and the evaluations are not."
      - "Survival is a yes/no outcome, and yes/no averages are always steadier than lengths."
    answer: 1
    explain: "Each training dot comes from noisy sampled actions, a fresh draw of randomised robots, and the small, biased set of episodes that happened to end inside one short rollout. The evals take the mean action and run 1000 complete episodes of the same weights. Survival over 1000 episodes is steady because of the count, not because it is yes/no. The wobble is a noise floor: a recipe change smaller than it is invisible in the curve. Training curves lie a little, and only the gates count. (Beat 1: the wobble is a measurement.)"
  - kind: whatif
    q: "A run's curriculum raises a penalty weight at six planned iterations. Each raise makes total reward drop sharply, then recover over a few hundred iterations, except that one of the six (you don't know which) never recovers. An alert fires whenever total reward falls more than 3 standard deviations below its recent mean. What does the alert do?"
    choices:
      - "Fires only on the raise that never recovers, since dips that recover look normal."
      - "Stays quiet, because its recent mean drifts down along with each planned dip."
      - "Fires on all six dips alike, with nothing to tell the stuck one from the other five."
      - "Fires only after the last raise, once the stuck dip has pulled the mean far down."
    answer: 2
    explain: "A z-score knows nothing about the schedule, so all six planned dips look like the same anomaly and it cannot say which one failed to recover. An alert that fires on every scheduled dip gets muted, and then it misses the dip that mattered. A model of what to expect reads the schedule, waits a window after each raise, and flags only a dip that never climbs back; then you check the raw metric behind that penalty. (Beat 3: reading a run is a loop.)"
  - kind: why
    q: "Total reward is task terms (positive) plus penalty terms (negative). Over 1000 iterations the total rises while every task term stays flat. Why is that not progress on the task?"
    choices:
      - "The penalties shrank: the robot learned to be still and smooth, not to do the task."
      - "Rising reward always means progress; the task terms simply lag behind."
      - "Task terms are logged unweighted, so their rise does not show up on their own."
      - "The critic is overfitting, which inflates the total but not its parts."
    answer: 0
    explain: "If the task terms are flat, the only thing that can lift the total is the penalties getting smaller, and standing still is the cheapest way to shrink them. So ask the second question, \"is it learning the right thing?\", and read the terms, the raw metrics and episode length, not only the total. A robot at the time limit that does not walk is surviving, not tracking. (Beat 2: a dashboard, not a number.)"
  - kind: numbers
    q: "Explained variance is $EV = 1 - \\operatorname{Var}[G - V] / \\operatorname{Var}[G]$. In a batch the returns have variance 4.0 and the residuals $G - V$ have variance 5.0. What is EV, and what does it say?"
    choices:
      - "$+0.20$: the critic explains a fifth of the returns."
      - "$+0.80$: the critic is doing well."
      - "$-0.25$: the critic is worse than a constant guess."
      - "$+1.25$: the critic over-explains the returns."
    answer: 2
    explain: "$1 - 5/4 = -0.25$. 1 means the critic predicts the returns, 0 means it is no better than predicting the batch mean, and below 0 means its errors add variance instead of removing it: overfit, or too noisy. Every advantage built on that critic carries its error. (Beat 2: a dashboard, not a number.)"
  - kind: numbers
    q: "A training run takes 1.16 s per iteration for 50,000 iterations. A rule flags any reward term that reads exactly 0 for 500 consecutive iterations. How long after the start can it fire, and what share of the run is that?"
    choices:
      - "About 10 minutes in, roughly 1% of a run that takes about 16 hours."
      - "About 1 hour in, 6% of the run."
      - "About 10 seconds in, before the first checkpoint."
      - "About 16 hours in: an inert term only shows once training ends."
    answer: 0
    explain: "$500 \\times 1.16 = 580$ s, just under 10 minutes, and $500 / 50{,}000 = 1\\%$. The whole run is $50{,}000 \\times 1.16 = 58{,}000$ s, about 16.1 h. A penalty that is always zero looks like perfection and contributes nothing; caught at minute 10, the fix lands before the next run instead of after this one. (Beat 4: audit the reward before trusting it.)"
  - kind: whatif
    q: "A curriculum makes the task harder as a global step counter grows. You load the checkpoint from iteration 12,000 into a viewer to study a dip, but the viewer starts that counter at 0. What would you expect?"
    choices:
      - "The dip reproduces exactly, because the weights fully determine behaviour."
      - "The policy faces the easy early world, so the dip likely won't reproduce."
      - "The viewer crashes, because the observation size depends on the counter."
      - "The policy fails at once, because it has forgotten the early curriculum."
    answer: 1
    explain: "Loading weights does not rewind the world. The policy now meets the curriculum's iteration-0 settings, easier than anything it saw late in training, so whatever caused the dip is missing and you are tempted to call it noise. Set the counter to match the checkpoint and run the curriculum once before playing. (Beat 5: replay the world, not just the weights.)"
  - kind: why
    q: "A rule flags premature convergence when a Gaussian policy's $\\sigma$ drops below 0.3. Why should it apply only early in training (say, the first 5,000 of 50,000 iterations) rather than at any time?"
    choices:
      - "Late in training $\\sigma$ is clamped by the optimiser, so its readings are unreliable."
      - "A single global threshold would fire too rarely to catch anything useful."
      - "$\\sigma$ only becomes meaningful after warm-up, so early values should be ignored."
      - "A low $\\sigma$ late is normal settling; the same value early means exploration quit."
    answer: 3
    explain: "A number alone has no verdict. At iteration 40,000, $\\sigma = 0.16$ is consolidation after the skill formed; at iteration 300 it means the policy stopped trying things before the skill was solid. Thresholds belong to a phase, and to a project: replay the rules over finished runs you understand before trusting them. (Beat 5: thresholds belong to a phase and a project.)"
  - kind: whatif
    q: "Training uses its own environment reset code; every validation test runs the trained policy in a separate, correct environment. A bug in the training reset starts each episode with the robot 57 mm in the air, so it drops onto its wheels before balancing. The trained policy also balances fine from a grounded start, and all validation tests pass. What do the passing tests tell you about the bug?"
    choices:
      - "That it is absent: a policy trained from a broken reset could not pass them."
      - "That it exists: their scores differ from the training logs by a fixed offset."
      - "Nothing: they never run the training reset, so they pass with or without it."
      - "That it was caught and fixed, since every test resets the robot before it runs."
    answer: 2
    explain: "A test validates the code path it runs through, not the training path. Bugs like this are silent: the run learns, the reward rises, the tests pass, and logged numbers such as episode length no longer mean what their headers say. The fix is a test that asserts where the robot actually starts in the training environment, and a parity test for every consumer of the observation. (Beat 6: the training environment can lie.)"
---

**Goal:** have a checklist for "why isn't it learning?", a dashboard you trust, and a way to read a run instead of staring at it.

## Where we left off

How do we tell a healthy run from a broken one? Day 9 left us with a clip that removes the reward for drifting but not the drift itself, and with a curve that does not hold still: on the wheeled-leg robot, between iterations 1500 and 2999, the mean episode length wanders between 911 and 975 while the policy barely changes. If the curve moves by 60 steps when nothing is happening, a 60-step move cannot tell us anything is happening.

Deep RL people have been staring at the same wobble for years. In the summer of 2017 John Schulman gave a talk at the Deep RL Bootcamp in Berkeley, *The Nuts and Bolts of Deep RL Research*, which is mostly a list of what to look at when a run misbehaves: know your noise, look beyond the mean return, watch entropy, KL and explained variance. My notes on it are the backbone of this Day.

Their starting point is the one everyone starts from. Open TensorBoard, look at the mean reward, and wait for it to go up.

## The picture

Think of a hospital chart. The obvious way to watch a patient is a nurse who calls the doctor every time a number on the chart moves. Temperature up half a degree: call. Heart rate down: call.

It breaks in the first hour. The numbers move on their own: the thermometer reads a little different every time, and the patient on the ward today is not the same patient as yesterday. They also move for reasons the nurse should have known about. Someone who had surgery this morning is supposed to run a fever tonight. A nurse who calls on every move gets ignored by lunchtime, and then misses the call that mattered. A good doctor reads the chart against what was done to the patient. The first problem is the thermometer: how much of the movement is the patient at all?

## Step by step

### The wobble is a measurement

Back to the 60 steps. The policy between iterations 1500 and 2999 hardly changes, so the swing has to come from how the number is measured. It has three sources:

1. **Sampled actions.** Training-time episode length is measured with exploration noise on. Every iteration, the same policy gets a different draw of perturbations of about ±0.3 V, and some draws push a marginal robot over.
2. **A different 1024 robots every time.** Each iteration draws new masses, friction, battery, pushes and start states. Some iterations simply draw harder robots.
3. **A small, biased sample.** An iteration is 128 steps, an eighth of a 1000-step episode. The "mean episode length" of an iteration comes from the few hundred episodes that happened to *end* inside that window.

The obvious fix is to smooth the curve harder. That hides the wobble without removing any of its three causes, and it delays every real change by the length of the window. What we need is a measurement that removes the causes. Take the mean action (no noise), run 1000 complete episodes, and keep the policy fixed. Two such evals on that run read 0.910 and 0.914: they agree to 0.4 points, where neighbouring training iterations disagree by 60 steps out of 1000.

::: tip
Training curves lie a little, and only the gates count. The wobble is a noise floor: any recipe change that moves survival by less than that band, on a single seed, is invisible in the curve.
:::

Even the gate has a floor of its own, because the evaluator wobbles too. Day 14 measures it before trusting any difference.

::: field Field notes: know your noise
**Use the deterministic eval when** you compare two recipes, two checkpoints, or anything you will act on. **Use the training curve when** you want to know whether the run is alive. **What goes wrong:** a single-seed difference smaller than the wobble gets read as a result. **Test:** evaluate one checkpoint three times before you set any threshold, and set the threshold from that spread.
:::

So the evals are the truth, and they are expensive: a full eval needs a finished checkpoint and a separate run. The Microduck velocity run takes 16 hours. During those 16 hours, the curves are all we have, so we need to read more of them than the mean.

### A dashboard, not a number

Schulman's list says what else to read. Read it as a set of gauges, each answering one question the mean reward cannot.

- **Entropy, or $\sigma$: is it still exploring?** A fast collapse means the policy went deterministic; entropy that never drops means it stays random. Day 6 showed that a Gaussian's entropy depends on $\sigma$ alone and crosses zero at $\sigma \approx 0.242$, so read the trend and large late swings, never the sign.

- **Approx KL per update: how big was the step?** About 0.01 is a small update, about 10 is far too big. Under adaptive KL it is held near the target, so watch the learning rate instead (Day 9).
- **Explained variance of the critic: is the critic predicting anything?**

$$
EV = 1 - \frac{\operatorname{Var}[G - V]}{\operatorname{Var}[G]}
$$

::: tip
1 means the critic predicts the returns, 0 means it is no better than a constant, and negative means it is worse than a constant: overfit or too noisy.
:::

- **Min and max return, and episode length, not only the mean.** The max shows what the policy can do when it goes right. Losing more slowly is progress.

On Microduck the same gauges get grouped into three questions: is the policy learning (total reward, episode length, task terms rising)? Is it learning the *right* thing (penalty audit, raw metrics, video)? Is the curriculum pacing right (dips that recover at boundaries)? Most wasted training time comes from answering the first question, "yes, reward is up", and skipping the second. Total reward can rise because the penalties shrink while the robot learns to stand still and smooth, with the tracking terms flat the whole time.

::: field Field notes: Schulman's hacks, mapped onto my robots
| Hack | Where it shows up |
|---|---|
| Know your noise; many seeds | Two evals of one policy agree to 0.004 while the curve swings 60 steps; Day 14 measures the evaluator itself |
| Look beyond the mean return | Min/max return, episode length and raw `Metrics/*` next to the total; Day 14 finds the tail bin that predicted the bench |
| γ from real time | 0.999 ≈ 1000 steps ≈ 10 s at 100 Hz, longer than the slowest thing we reward |
| Entropy, KL, init | Entropy sign flips at $\sigma \approx 0.242$; adaptive KL pushes the LR up |
| If nothing learns, raise the batch size | Small batches let noise drown the signal (Day 11 has the evidence) |

I have no logged explained-variance number for either robot in my notes, so that gauge has no robot evidence on this page.
:::

So now we have half a dozen gauges instead of one. The obvious next move is a threshold on each, and an alert when one crosses. On Microduck, a z-score alert on mean reward fires six times in the first 2000 iterations, and every one of them is a dip we scheduled ourselves.

### Reading a run is a loop

The six alerts are the nurse calling about a post-op fever. Microduck's curriculum changes its reward weights in hard jumps at iterations 500, 750, 1000, 1250, 1500 and 2000; the action-rate penalty alone goes from −0.1 to −1.0 by iteration 1500. A heavier penalty is supposed to lower total reward, so each jump dips the curve. The gauge is right and the alert is useless, because it knows nothing about what we did to the run.

What an experienced engineer does instead is a six-step loop, and a tracker (W&B, Comet, TensorBoard) covers exactly one of the steps:

1. **Context.** What changed since the last run? Diff the two `env.yaml` files.
2. **Expect.** Given the change and the curriculum schedule, what should the curves do, and when?
3. **Observe.** What did they actually do? This is the only step the tracker does.
4. **Compare.** Is the gap between expected and observed concerning, or a scheduled shock?
5. **Diagnose.** Group symptoms that happen at the same time under one cause, and check it with a second metric.
6. **Decide.** Wait, stop, or change one thing for the next run.

Step 2 is the one that kills the six alerts. The schedule is already on disk in `env.yaml`, so an expectation model can predict each dip, open a 200-iteration window after it, and only flag a dip that never recovers. On this run three of the six recover above their pre-shock level and three do not:

| Boundary | Before | After | +150 to +200 | Read |
|---|---|---|---|---|
| 500 | 107.2 | 103.2 | 111.7 | recovered, stay quiet |
| 750 | 112.5 | 109.7 | 117.6 | recovered, stay quiet |
| 1000 | 119.0 | 114.8 | 115.8 | below, check raw `Metrics/*` |
| 1250 | 117.6 | 115.7 | 120.8 | recovered, stay quiet |
| 1500 | 121.1 | 116.7 | 114.3 | below, check raw `Metrics/*` |
| 2000 | 116.3 | 112.7 | 110.3 | below, check raw `Metrics/*` |

At the last three the doctor looks at the raw metric behind the penalty, not the total, because the total is supposed to be lower. A dip that recovers within 100 to 200 iterations means the stage was paced well. One that never recovers in the raw metric means the stage was too aggressive: split it or move it later, never earlier. No dip at all means it could have come sooner.

::: field Field notes: the value is in the flags that don't fire
A tool that alerts on every dip is muted within a day. The expectation model exists to suppress the six scheduled shocks on this run and leave attention for the seventh thing, whatever it is. **What goes wrong:** a general tracker cannot do this, because the rules need per-codebase knowledge: that `Curriculum/*` is a schedule and not a metric, which terms are penalties, what `action_rate_l2` means. A doctor has to live in the repo.
:::

The design write-up has the real curves from this run, with the shock windows shaded. Scroll inside the frame: hover the charts, and on a phone the two architecture diagrams scroll sideways.

<figure class="embed">
  <iframe src="../assets/embeds/run-doctor-microduck.html" title="Microduck Run Doctor: the six-step loop, curriculum-aware expectation, the penalty audit and sigma phases on a real 50,000-iteration run" loading="lazy" style="height:760px"></iframe>
  <figcaption>The Run Doctor write-up for the Microduck velocity run (English only). Look at the reward chart with the six shaded windows, then the penalty audit table. <a href="../assets/embeds/run-doctor-microduck.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

Suppressing scheduled dips assumes the reward terms mean what their names say. The expectation model is built on the terms. If one of them is quietly broken, the doctor will happily stay quiet about it.

### Audit the reward before trusting it

The cheapest check is a sign. Every `Episode_Reward/<penalty>` must stay at or below zero for the whole run. If any penalty goes positive, the sign convention is wrong and the policy is being paid for the violation. On this project that has already produced butt-hopping and crash-sitting. On the velocity run every penalty passes, and one reads like a perfect score:

| Term | Weight | Max over run | Status |
|---|---|---|---|
| `action_rate_l2` | −0.1 → −1.0 | −0.0336 | pass |
| `body_ang_vel` | −0.05 | −0.0067 | pass |
| `foot_slip` | −0.1 | −0.00002 | pass |
| `angular_momentum` | −0.02 | exactly 0.0 | **inert** |

`angular_momentum` read exactly 0 for all 50,000 iterations. That is not a robot with no angular momentum. That is a term that never computed: the sensor returns zeros, or the selector matches no body. A penalty that is always zero looks like perfection and contributes nothing.

There is a second trap in the same logs: `Episode_Reward/*` records *weighted* values. A term at curriculum weight 0 reads 0 whatever the robot does, so a flat zero at the start of a run can mean "off" rather than "perfect". Read every reward curve against the `Curriculum/*` staircase for that term, and compare runs on the raw `Metrics/*`, which do not depend on the weights.

The last check in this family is the edge of a reward window. Microduck's air-time reward pays between 0.125 and 0.3 s. The policy converged to 0.1254 s and spends only 31% of iterations above the floor. It is not a bug, but it is a fact about the gait the reward shaped: the policy takes the shortest step that pays. Whether that is the gait you want is a design question, and Day 12 picks it up.

::: field Field notes: plot every term early
**Put it in when:** always. A rule engine wrapped around the training logger decides the sign audit at iteration 1 and fires `inert_term` at iteration 500, 10 minutes into a 16-hour run. **What goes wrong without it:** Jumper's turning reward logged 0.0017 for 37,500 iterations before anyone looked. A backflip helper at weight 0 was skipped for two versions. **Test:** for every term, check that it changes something on a smoke test before the long run. ✅ Next to every number you set, write down why and what you measured.
:::

Now the terms are honest and the schedule is known. Look at $\sigma$ on the same run: it ends at 0.16. Is that good? On its own, the number cannot say.

### Thresholds belong to a phase and a project

On Microduck, $\sigma$ drops below 0.5 at iteration 468, below 0.3 at 791, and stays under 0.2 from 1358. Those crossings mark three phases: exploration, commitment, consolidation. A $\sigma$ of 0.16 at iteration 40,000 is healthy consolidation. The same 0.16 at iteration 300 would be premature convergence: the policy stopped trying things before walking was solid. Same number, two verdicts, decided by phase. That is why `premature_convergence` is written as "$\sigma < 0.3$ before phase 2" and not as one global constant.

Thresholds also belong to a project, and the way to find them is to run the rules on finished runs you already understand. Replaying the rules over old wheeled-leg runs turned up two that were simply wrong for this project. Entropy falls under 10% of its start by iteration 200 on every run, good or bad, so `entropy_collapse` was disabled. A 20% relative rise in falls fired on good runs, where falls went from 0.12 to 0.15, so that rule gained a 0.05 absolute floor. The rules that survived fired where they should: on sk_lean, `late_decline` at iteration 3318, with `peak_passed` as an early heads-up at 2099. My expectations were wrong, not the rules: when a measured run disagrees with what I expected a rule to do, the run wins.

The other way to get a threshold is to commit to one before the run. For sk_lean4 I wrote down that `reward_per_step` would reach at least 0.87 by iteration 1200. It came in at 0.65. Here is the finished dashboard, with the curriculum boundaries at 250, 500 and 1000 shaded:

<figure class="embed">
  <iframe src="../assets/embeds/rundoctor-sk-lean4.html" title="rundoctor dashboard for the finished sk_lean4 run, with curriculum boundaries shaded and one open warning" loading="lazy" style="height:900px"></iframe>
  <figcaption>The exported rundoctor dashboard for sk_lean4 (static mode, 5000 iterations). Find the one open warning, <code>prediction_missed</code>, and the two <code>peak_passed</code> notes. On a phone the event cards sit below the charts. <a href="../assets/embeds/rundoctor-sk-lean4.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

::: field Field notes: pre-register, then believe the miss
The miss is logged as `prediction_missed`, the only open warning on the run, and the alert says what to do with it: "Not a kill on its own. Record the miss; if the rest of the run's predictions also miss, the hypothesis is wrong, not the pacing." It was right, and Day 12 shows what the 0.65 turned out to be. The doctor flagged the miss on its own, before anyone had looked at the run. ⚖️ `peak_passed` (episode length peaked at 959 around iteration 853, then 92% of that) is an info line: evaluate `model_800.pt` against the latest before you export.
:::

Try the calls yourself. Seven of these curves are real, from the Microduck run and sk_lean4; one is a sketch, marked as such. For each, decide what you would do.

<curve-reader></curve-reader>

::: field Field notes: replay the world, not just the weights
**What goes wrong:** you load `model_12000.pt` to look at a flag, and the robot in the viewer faces a world easier than anything it saw after iteration 500. mjlab's `play` starts `common_step_counter` at 0, so the curriculum does not rewind with the checkpoint. **Fix:** set the counter to $k \times 24$ (24 env steps per iteration) and run the curriculum terms once. At iteration 12,000 that is the difference between a head-pose range of ±0.05 rad and ±0.39 rad. About 20 lines, and the dip you saw on the curve becomes reproducible.
:::

Every rule on this page, whatever its threshold, reads the logs the training environment writes. The phase, the schedule and the term audit all assume that the environment is doing what its code says.

### The training environment can lie

On the wheeled-leg robot's rl_toys stack, two review passes over the training code turned up about sixty findings. Some of them, every one silent:

- Every GPU episode spawned the robot 57.3 mm in the air.
- The odometry advanced twice per policy step: a global observation-cache reset at 4096 envs made the 0.05 s low-pass behave like 0.028 s.
- The curriculum ramp meant to finish at 50% of training finished at 9.4%, because the config froze at import time while the launcher defaulted to 128 steps.
- Unclipped actions were stored in `prev_action`: ±2 in training against ±1 on the robot, on 8 of the 40 inputs.

None of these shows up as a strange curve. The run learns, the reward rises, the doctor stays quiet, and the numbers in the training log no longer mean what their column headers say.

The gates passed too, and that is the worst part. Every validation gate ran through the standalone parity backend, which was correct. Nearly every finding was in the training path, which no gate exercised end to end. The sixty findings collapsed into two patterns: a reset that puts the robot somewhere other than where the code says (found independently three times, with no gate asserting the start state), and a consumer with no parity-test partner (the observation grew from 36 to 40 inputs and missed exactly the two consumers without a parity test).

<figure class="embed">
  <iframe src="../assets/embeds/rl-toys-defect-register.html" title="rl_toys defect register: about sixty findings in the training, export and deploy path, filterable by severity" loading="lazy" style="height:720px"></iframe>
  <figcaption>The rl_toys defect register (English only). Read the "Two patterns" box at the top, then filter by severity. Checkboxes are saved in your browser only. <a href="../assets/embeds/rl-toys-defect-register.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

::: field Field notes: two patterns, not sixty bugs
**Fix first:** whatever invalidates the training-log numbers, before trusting any of them. **Test:** one gate that asserts where the robot actually starts, and a parity test for every consumer of the observation, not only the two that already have one. **Related trap (config spine):** keys consumed at build time (masses, geometry, leg PD) are baked into the robot file by `regen`, so a run-time override does nothing, silently. Doubling `masses.base` in the config left the simulated base mass at 0.1858. **Profiling sidebar:** measure one level deeper before editing. The kinematics GPU-CPU round trip that looked like the obvious waste in the reset cost 0.13 ms, 6% of it. And time with the minimum, not the mean: interruptions only add, so the floor is the cost.
:::

So the curves can be noisy, the gauges can be wrong for the phase, a term can be dead, and the environment underneath can be lying. That is a lot of ways to be wrong, and a tempting answer is to let the tool act on its own: kill the run when a rule fires.

### Advisor, not operator

The doctor never stops a run. An automatic kill is the one action where a false positive costs more than the bug it prevents, and the person watching knows things the rules don't. Every event, even a critical one, posts and training continues. In return, the alert owes you a decision you can make in ten seconds:

```text
[warn] inert_term · it 512 · 10 min elapsed
 Episode_Reward/angular_momentum has read 0.000000 for 500 consecutive
 iterations while its weight is -0.02.
 Likely: robot/root_angmom sensor returns zeros, or the selector matches
 no body. The term is contributing nothing to training.
 Consider: this run is unaffected either way; fix before the next run.
 Replay: model_500.pt · uv run play Microduck-Velocity-v0 --checkpoint 500
```

What was observed, what it most likely means, what your options are, and how to stand in the sim at that moment. Step 6 of the loop stays with a person.

Let me regroup, because that was a long run. Day 9 left us with a curve that wobbles by 60 steps on its own. The wobble turned out to be a measurement, so decisions go through deterministic evals with a measured noise floor. During the run we read a dashboard instead of one number, and read it as a loop that starts from what we changed and what we expect. That kills the scheduled alarms, and leaves the attention for the flags that matter: a penalty with the wrong sign, a term that never computes, a $\sigma$ that is fine at 40,000 and alarming at 300, a prediction that missed. Underneath all of it, the training environment itself has to be audited, because it can be wrong without a single curve looking strange. What we still cannot do is tell, from a healthy run, whether we picked good settings.

## Pitfalls

- **Comparing two single-seed curves (beat 1).** Two runs whose episode-length curves differ by less than the 60-step wobble are, as far as the curve knows, the same run. Compare deterministic evals, and only differences larger than the evaluator's own repeat spread.
- **Reading total reward as the task (beat 2).** `Train/mean_reward` rising over 1000 iterations while every tracking term's slope is flat means the robot learned to be still and smooth. Check episode length: a robot at the 20 s limit that does not walk is surviving, not tracking.
- **Treating a flat zero as a perfect score (beat 4).** A penalty reading exactly 0 for 500 iterations is a dead term, and a weighted term at curriculum weight 0 reads 0 by construction. Neither says anything about the robot.
- **Replaying a checkpoint in the wrong world (beat 5).** Loading weights without rewinding `common_step_counter` shows the policy a world it left behind at iteration 500. The dip you are investigating will not reproduce, and you will conclude it was noise.
- **Trusting the gates because they pass (beat 6).** A gate that runs through a different code path than training validates that path, not training. If the reset, the observation cache or a curriculum ramp is wrong in the training env, every curve and every gate can look fine.

<!-- quiz -->

## Next

You might ask, if the dashboard is healthy, are we done? The doctor answers "is this run learning, and is it learning what the reward says". It does not answer "would a different run have learned better". On the wheeled-leg robot, the change that moved the result most was not a reward term or a bug fix: going from a 24-step to a 128-step rollout took yaw RMSE from 0.3-0.7 down to 0.11-0.27, and no curve on the dashboard would have suggested it. A healthy dashboard says the run is learning, not that the settings are right. Rollout length, minibatch size and learning rate moved the result more than any curve showed. Which knobs matter, and how do we tune them with evidence? That is [Day 11](../day11/).

## Sources

- `notes/deep-rl-hacks-schulman.md` ([Notion](https://app.notion.com/p/3e467249ddbf81039772e3df5492078f)): paraphrased from John Schulman, *The Nuts and Bolts of Deep RL Research*, Deep RL Bootcamp, UC Berkeley, August 2017, as written up by William Falcon ([github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks)). The gauges, "know your noise", "look beyond the mean", the KL rule of thumb, and the hack-to-practice map.
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), "The wobble", "Entropy flipping between positive and negative" and "Training health dashboard". The original PPO takeaways page ([Notion](https://app.notion.com/p/28a67249ddbf80cda601dacbc9d8cf80)), "Metrics" and "ML utils" (approx KL, TensorBoard and W&B tracking: the "observe" step).
- `artifacts/wlbot-learning-log-aug-30.html`: the 911 to 975 wobble and the evals at 0.910 and 0.914 (n = 1000).
- `notes/the-worries-of-simulation-and-how-to-diagnose-them.md` and `notes/ablation-studies-how-to-run-them.md`: the evaluator's repeat spread (0.974 / 0.976 / 0.982), the yaw RMSE spread, three seeds.
- `notes/microduck-takeaways.md`, "Training introspection": the three questions, the penalty audit, weighted `Episode_Reward/*`, dip-and-recover at boundaries.
- `artifacts/microduck-run-doctor.html` (embedded): the six-step loop, the boundary table, the penalty audit, $\sigma$ phases, the air-time window edge, faithful replay, the ten rules, advisor not operator, early-detection timings.
- `artifacts/rundoctor-sk-lean4.html` (embedded): the sk_lean4 dashboard, `prediction_missed`, `peak_passed`.
- `artifacts/rundoctor-milestone-2-playbook.html`, summarised only: rule set v1.1, golden counts (sk_lean `late_decline` at 3318, `peak_passed` at 2099), the calibration rulings, "my expectations were wrong, not the rules".
- `artifacts/rl-toys-defect-register.html` (embedded): the findings and the two patterns.
- `artifacts/jumper-field-guide.html`: the traps table (0.0017 for 37,500 iterations, the helper at weight 0).
- Sidebars: `artifacts/wlbot-config-spine.html` (build-time keys), `artifacts/launches-and-resets.html` ("measure one level deeper"), `artifacts/where-the-3-milliseconds-go.html` (minimum, not mean).
