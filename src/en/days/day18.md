---
day: 18
minutes: 60
widgets: [arm-table, run-lineage]
quiz:
  - kind: why
    q: "The worry: a policy tuned against a detailed simulator may learn habits that only pay off inside that simulator. Every policy you flash balances on the robot. Why doesn't that settle the worry?"
    choices:
      - "Balancing is too easy a task to separate good policies from bad ones."
      - "Such habits only show up after thousands of hours on the hardware."
      - "It is about ranking: a working policy may have beaten a better one."
      - "Each policy was tested at one leg height, so the coverage is too thin."
    answer: 2
    explain: "Does it work asks about one policy; lock-in is about the choice between policies. So the test needs two policies the simulator separates and a bench that agrees or not, on the axis the simulator claims to measure. A worry becomes useful once it names its own test. (Beat 1: three worries, each written as an experiment.)"
  - kind: whatif
    q: "A sensor's height is written three times: in a config that engine A reads, and as a literal inside each of two model generators, one of which builds engine B's model. You correct the config only. A parity gate compares each body's inertial offset between engines, and the sensor's offset is zero by construction. What happens?"
    choices:
      - "The engines silently disagree on the sensor height, and the gate stays green."
      - "Nothing: the generators pick up the new config value the next time they build."
      - "The parity gate fails at once, because the sensor body moved in one engine."
      - "Both engines train on the new height, but the firmware keeps the old one."
    answer: 0
    explain: "A number with three copies is three numbers. Fixing one turns a measurement error into an engine disagreement, and the gate cannot see it because it checks a quantity that is zero for this sensor wherever it sits. The fix is one source that both generators read, and a check on what actually differs. (Beat 2: the plant was wrong where no gate looked.)"
  - kind: numbers
    q: "A body-rocking mode's frequency goes as $1/\\sqrt{I}$. Correcting the centre of mass cuts the pitch inertia by a factor of 6.25, and the mode was at 1.5 Hz before. The real robot wobbles at 7.3 to 9.7 Hz. What does the correction predict?"
    choices:
      - "About 9.4 Hz: $6.25 \\times 1.5$, inside the wobble band."
      - "About 3.75 Hz: $\\sqrt{6.25} \\times 1.5$, well short of it."
      - "About 0.6 Hz: $1.5 / 2.5$, since a lighter body is slower."
      - "About 1.5 Hz: stiffness sets the mode, not the inertia."
    answer: 1
    explain: "$\\sqrt{6.25} = 2.5$, so 1.5 Hz becomes about 3.75 Hz; a tap test in simulation measured 3.1 Hz. Either way it stops more than a factor of two short of the bench wobble. The fix was real and the robot balanced better, but it did not explain the wobble, so the remaining suspect is compliance the model does not have. (Beat 2: the plant was wrong where no gate looked, and beat 6: what is still open.)"
  - kind: why
    q: "The worry: observation filters and stacked frames constrain exploration, so PPO settles on something mediocre. You remove the filter. The run learns slightly faster early, then plateaus at the same survival as before, a little shakier. Why does this count against the worry?"
    choices:
      - "Faster early learning shows the filter was slowing exploration down."
      - "A shakier policy shows the filter was carrying useful information."
      - "Removing one piece cannot test a constraint; remove all at once."
      - "A binding constraint lifts the ceiling when removed; this did not."
    answer: 3
    explain: "A constraint that limits exploration has a signature: take it away and the plateau rises. Here it stayed put, and the arms that did move the ceiling moved it down, by removing information. So whatever binds is elsewhere; in this project it was the randomisation width and the pushes. (Beat 1: three worries, each written as an experiment.)"
  - kind: whatif
    q: "Midway through a series of training runs you correct a plant number: the centre-of-mass height drops from 85 to 57 mm. To decide whether a later reward change helped, you compare a new run's survival with runs trained before the correction. What is wrong with that?"
    choices:
      - "Nothing, as long as both runs used the same seed, rewards and iteration count."
      - "The runs trained on different plants, so the plant change is mixed into the result."
      - "Nothing: the fix shifts every run's survival by the same amount, so rankings hold."
      - "Survival is noisy, so the comparison needs more seeds rather than a new baseline."
    answer: 1
    explain: "A plant number that changes makes every earlier training number incomparable: the old runs solved a different task. Retrain the baseline on the new plant and compare there. Treat each such change as an era break, and expect gates tuned on the old plant to need re-baselining too. (Beat 2: changing a plant number is an era break.)"
  - kind: numbers
    q: "Near upright, an inverted pendulum's small tilt grows like $e^{\\lambda t}$ with $\\lambda = \\sqrt{g/l}$. The centre-of-mass height $l$ is corrected from 85 mm to 57 mm. Over a 0.5 s settle window, with $g = 9.81$ m/s², how many times larger does the same initial tilt end up?"
    choices:
      - "About 1.2×: the ratio of the two $\\lambda$."
      - "About 1.5×: the ratio of the two heights."
      - "About 10.8×: $e^{\\Delta\\lambda}$ over 1 s."
      - "About 3.3×: $e^{\\Delta\\lambda \\cdot 0.5}$."
    answer: 3
    explain: "$\\lambda$ goes from $\\sqrt{9.81/0.085} \\approx 10.7$ to $\\sqrt{9.81/0.057} \\approx 13.1$ per second, and $e^{(13.1 - 10.7) \\times 0.5} \\approx 3.3$. A modest change in growth rate compounds over the window. That is why the correction broke open-loop gates with a fixed settle time, and why the fix was a shorter window, not a wider tolerance. (Beat 2: changing a plant number is an era break.)"
  - kind: whatif
    q: "A policy observes its own previous action. A candidate passes the survival and push gates and its training curves look healthy, but a static probe, started from previous action = ±1 in a neutral state, settles at 2.74 V against a 2 V limit. You skip the probe and flash it. What risk are you taking?"
    choices:
      - "It may latch itself onto a rail on the robot, which no curve showed."
      - "None: the probe tests a state the robot never reaches in practice."
      - "It will balance but drift in heading, since the probe tests yaw."
      - "It will hold at first, then saturate slowly as the battery sags."
    answer: 0
    explain: "When the previous action is an input, a large output can feed itself: the policy sees its own rail and asks for it again. Training curves average over episodes that start calm, so they miss it, and a run that looks like a fix on every curve can still rail on the robot. The probe is cheap, so every candidate goes through it before the bench. (Beat 3: the lean MDP produced lean3.)"
  - kind: why
    q: "Two physics engines agree, bin for bin, on a simulator metric for wobble, yet that metric has ranked policies against the bench wrongly twice. Both engines load the same model, with rigid links and a rigid tyre. Why doesn't the second engine's agreement rescue the metric?"
    choices:
      - "Two engines only agree by chance, so agreement carries no information."
      - "The second engine was tuned to match the first, so it adds nothing."
      - "Both share one rigid plant, so they agree on the same missing physics."
      - "Wobble metrics need hardware in the loop, which neither engine has."
    answer: 2
    explain: "A second engine checks the engine, not the plant. If the robot's wobble comes from compliance neither model contains, both engines will be wrong together. A simulator metric earns its weight only after it has predicted a bench result before you saw it. (Beat 5: the simulator did not rank them the way the bench did.)"
---

**Goal:** follow one real project end to end: the fears it started with, the ablation that answered them, the plant fixes and the wobble chase, and the bench verdicts that decided which simulator numbers to trust.

## Where we left off

The policy runs on the chip, and Day 17's first flash showed that its own feedback can latch it onto a rail. Fixing that meant retraining, re-ablating and re-gating the whole project, so today is that loop end to end on one robot: the micro wheeled-leg robot, from three worries to the bench.

Who hit this wall first is on Day 16: Jie Tan's Minitaur in 2018, where the fix for the gap went into the simulator, not the policy. This day is the whole loop on our robot, with every number in it, including the ones that went the wrong way.

Here is how the nine weeks went, with the RL work in bold. Weeks 1 to 3 were hardware; the robot arm, the camera work and helping a colleague are left out.

| Week | 2026 | What happened |
|---|---|---|
| 1-3 | 29 Jul - 14 Aug | Robot built; FOC on both legs; PD balance holds 30 minutes freestanding; yaw and velocity control; code moved to ESP-IDF |
| 4 | 17-21 Aug | Crouching and jumping; **PyBullet sim with the firmware's PD balancing in it** |
| 5 | 24-28 Aug | **Own PPO loop; PyBullet to MuJoCo Warp via URDF; an rsl_rl policy balances in sim.** 25 Aug: the CoM target adopted from a firmware constant. 27 Aug: the vendor CAD arrives and leaves that CoM outside the body; a trained policy exposes the two engines' different hip laws |
| 6 | 1-4 Sep | **Sim and firmware inconsistencies fixed, randomisation grounded.** 1 Sep: the defect register (about sixty findings). 2 Sep: **first network on the robot**, holds at 40 mm, rails at 70 and 85 mm |
| 7 | 7-11 Sep | 7 Sep: **mass, IMU height and CoM corrected.** ESP-DL port with min-max quantisation. 11 Sep: **the overnight nine-arm ablation** |
| 8 | 14-18 Sep | **Workspace refactored towards Isaac Lab's shape; the run doctor; Microduck's reward and curriculum habits; sk_lean to sk_lean3; the wobble chase**; Newton/Kamino as a third engine |
| 9 | 21-24 Sep | **Microduck's curriculum applied further**; servo bench code with BAM, torque constants derived |

The critic rework (report section 3.8) is not dated in the report. The first attempt at all of this was the obvious one: worry about the network.

## The picture

A tailor makes suits on a mannequin built to the customer's measurements. Before the first fitting the tailor has three worries. The suits might fit only the mannequin. The pattern might be so constrained that it can never produce a good suit. And half the lining might be doing nothing. The obvious plan is to test the suits: cut nine versions, each missing one piece, and see which fits the mannequin best.

It breaks in two places. The mannequin's measurements could be wrong, in which case every suit is fitted to the wrong body and the comparison is clean and useless. And even with a right mannequin, the customer may prefer the suit that fits it second best. The first problem is to say each worry precisely enough that a fitting could answer it.

## Step by step

### Three worries, each written as an experiment

The policy saw 40 inputs: ten channels stacked four frames deep, a 50 ms low-pass on wheel odometry, and a heading fused by a ten-constant yaw estimator. A sibling firmware balances the same robot on six inputs and one action. That comparison produced three worries, and each one only became useful once it named its own test.

- **Simulator lock-in.** We tuned the simulator against the firmware closely enough to transliterate its filters, so the policy might learn habits that only pay off in our model. The obvious test is "does it work on the robot", and that test is too weak: a policy can work and still have been chosen over a better one by the simulator's quirks. Lock-in is a claim about **ordering**. The test is whether the simulator ranks two policies the way the robot does, on the axis it claims.
- **A constraint limiting exploration.** Filters add lag and stacked frames add dimensions, so PPO might settle on something safe and mediocre. A binding constraint has a signature: remove it and the ceiling rises.
- **Dead weight.** Every filter constant is a number we chose and the firmware must mirror. Remove each piece and measure, singly and together.

The nine arms of Day 14 were built to answer all three at once. Day 14 took them apart as a lesson in method; here they are as a decision. Sort the columns, then pick the arm you would flash:

<arm-table></arm-table>

The verdicts, with the caveats the source gives them:

- **Lock-in: ✅ answered, with a caveat.** The long-delay bin ranked combo and the jerk arm below the control, and on the bench both drove further forward before recovering from a push. The ranking held on the axis it predicted (Day 14). The real coupling was different from the feared one: the policy is pinned to the firmware's signal processing, not to the simulator as such.
- **Exploration: ❌ not supported.** nolpf learned slightly faster early (926 against 896 at iteration 300) and finished in the same place, shakier. Every arm that balanced at all plateaued near 0.97, and the arms that moved the ceiling moved it down, by removing information.
- **Dead weight: ⚖️ half right.** The low-pass and the stack pay for themselves, because they interact (Day 14's square). The expensive complexity was the yaw estimator: about 5° of drift corrected against a 14° heading sigma.

::: field Field notes: what the three worries turned into
**Lock-in, when to test:** before trusting any simulator metric for a decision. **How:** two policies the simulator separates, then the bench. "Does it work" is not the test. **What it actually found:** coupling to the firmware's filters and delays; Day 17 has what that cost when the delay window moved for the ESP-DL port. **Constraint, test:** remove it; if the ceiling does not rise, it was not binding. ❌ Ours did not rise. **Estimator, test:** compare the error it removes with the sigma of the reward term that scores it before building it. ⚖️ gyroyaw (0.973) rests on one seed, and its 20 s settle clock never runs out inside a 10 s episode, so it is a bench question.
:::

So the observation was not the ceiling. Every arm stopped near 0.97, and the source names what binds instead: the randomisation width and the pushes. What every arm shares is the plant they were all trained on, and the plant had been wrong in ways no gate saw.

### The plant was wrong where no gate looked

In calendar order this came first: the plant fixes landed on 7 September, and the ablation ran later that week. I tell it second because that is the order of the argument. Three numbers, each passing every test we had.

- **The centre of mass**, Day 16's floating CoM: solved from the firmware's 85 mm boot height, it sat 25.3 mm above the body for eleven days, and the plant was a pendulum 47% too long.
- **The IMU height**, Day 15's three copies: CAD and a ruler had both measured the ESP32 board, so the real 40 mm lever was 20 mm in the model, and fixing one copy would have split the engines under a green parity gate.
- **The hip law**, also Day 15: a position source in PyBullet and a PD in MuJoCo, green through V0 to V4 until a trained policy exposed it.

All three share a shape. Two numbers with two owners and a hard physical relationship between them, and nothing that makes them meet. The fix for each was an assertion or a single source, not more care.

::: warn
**A correction to my own notes.** My probation report says the too-high centre of gravity was "the main cause of wobble" and the largest fix. The correction was real: the robot's CoM went from 85.0 to 57.0 mm, the plant stopped floating, and together with the mass and IMU fixes the robot held upright and rejected pushes better. But it did not explain the bench wobble. Day 16's tap test, wheels welded to the world, moved the body mode from 1.5 Hz to 3.1 Hz, and the bench wobbles at 7.3 to 9.7 Hz. Sweeping the hip armature and servo stiffness across their whole plausible range put nothing anywhere between 3 and 34 Hz. The CoM was a real error and the wrong suspect.
:::

::: field Field notes: changing a plant number is an era break
**Rule:** a plant number that changes makes every earlier training number incomparable. Retrain and re-gate; do not compare across the change. **What goes wrong:** the CoM correction also broke three passive gates, because a 47% shorter pendulum grows the same small perturbation 3.3 times more over the settle window; Day 16 has why the windows were shortened and the bars kept. **Test:** an assertion that the CoM sits inside the body box, and one source per number. A parity gate that compares settled poses cannot see servo transients or a lever that is zero by construction.
:::

So the plant got more honest, and everything trained before 7 September stopped counting. The retrain could have reused the old recipe. But reviewing the training dashboards had shown that very few of the logged metrics were informative, and that many observation and reward terms could go.

### The lean MDP produced lean3

The obvious move after an era break is to carry the old reward over and retrain. Instead the lean MDP cut the reward to three terms in product form with a slew penalty, gave the actor 32 inputs, and asked one question per run. My notes do not record which eight of the 40 inputs went; that is a gap.

| Run | Schedule (heading / half slew / full slew) | What it showed |
|---|---|---|
| sk_lean | none | Survived (0.876 at 2500), but chattered: clean yaw rate 0.80 |
| sk_lean2 | 750 / 1500 / 2250 | Ramped slew fixed the chatter (yaw rate 0.262), but the latch probe failed at 2.74 V |
| sk_lean3 | 250 / 500 / 1000 | First clean gate PASS; latch fixed, 0.21 V at model_4500 |

The latch is Day 17's crack closing. sk_lean2 still railed itself in the static probe from Day 13, and the run that front-loaded the curriculum, with nothing else changed in the table, is the one that brought it under the 2 V acceptance. That is the result the probation report calls "lean3, the best policy so far", and it was still the best policy on the bench when the wobble chase ended.

::: field Field notes: start from the fewest terms
**Put a term in when** the dashboards show it moves something you measure. **Leave it out when** nothing reads it: the W&B review found few informative metrics and many removable terms. **What goes wrong without the latch probe as a gate:** sk_lean2 looked like a fix on every curve and would have railed on the robot at 2.74 V. **Test:** every candidate goes through the clean gate, the shove gate and the latch probe before the bench. ✅ sk_lean3 was the first run to pass all three.
:::

One row still failed: wobble at 77 mm of leg height with 30 ms of held delay, 13.5°. The bench shows its wobble at 40 to 45 ms, outside the 3 to 30 ms the policy trains on. That row started the chase.

### Chasing the wobble

The obvious reading of a policy that wobbles is that it lacks something, so the chase added things, one question per run. Tap through the runs; each shows what the simulation said next to what the robot said.

<run-lineage run="sk_lean3"></run-lineage>

- **Wider network.** sk_lean4 swapped the mixer for per-wheel commands and went to 128×128 in one commit, so no later run separates the two (Days 11 and 14). Its one wobble gain, 13.5° to 9.2° at 30 ms, sits inside checkpoint scatter. ❌
- **Stage spacing.** sk_lean4 balanced and spun in place at 1.6 rad/s: with stages 250 iterations apart it never learned heading and earned 0.65 per step. On a 500 / 1500 / 3000 schedule the same architecture held heading to 0.003 rad/s (Day 12). ✅
- **Mixer against per-wheel.** Equal in simulation, and on the bench the mixer won; Day 11 has how the per-wheel policy re-learned the mixer anyway. ⚖️ bench only.
- **Training longer.** sk_lean5_s2 ran sk_lean3's recipe to 10,000 iterations, and its six checkpoints from 5000 on are one policy within noise (Day 11). ❌
- **Checkpoint averaging.** 21 late checkpoints of sk_lean3 averaged into the calmest policy measured: wobble 10.4°, yaw rate halved, better on mjlab, Newton and PyBullet (Day 11). ✅ in simulation.

::: field Field notes: the mixer, as a decision
**Use the mixer when** the observation already separates the tasks: one balance channel, one heading channel. Exploration noise on one does not disturb the other, and a push recovery costs half the slew penalty of the same recovery written as two wheel commands. **Use per-wheel when** the tasks do not split that way. **What goes wrong:** per-wheel re-learns the mixer with high-frequency energy in the difference channel, and the simulator did not penalise it. **Evidence:** bench only, "the one with mixer is better". Per-wheel was never tested without the wider network.
:::

We got sidetracked a bit, so a regroup. We started with three worries and the ablation answered them: the simulator ranks on the long-delay axis, the observation is not the ceiling, and the expensive piece was the estimator. Then the plant turned out wrong in three places no gate saw, and fixing it was an era break. The lean MDP rebuilt the policy on the honest plant and lean3 passed every gate, latch included. The chase then tried width, spacing, the action, length and averaging, and the simulator's favourite at the end was the averaged policy. What is still open is the question we started with: does the simulator rank policies the way the robot does?

### The simulator did not rank them the way the bench did

Back to worry 1, this time on the axis the bench complained about. These are the four policies that went on the robot during the chase:

| Policy | What the simulation said | What the robot said |
|---|---|---|
| sk_lean3 model_4500 | Unremarkable: wobble 19.2°, in the middle of its own run's scatter | Best: "s3 4500 is still the best" |
| sk_lean4c model_18500 | Best shove gate of any policy, 0.956 | No better: "the one with mixer is better" |
| sk_lean5_s2 model_5500 | Calm: 20.9° mean, 3.0° at 77 mm / 12 ms | Bad: "it wobbles too much" |
| sk_lean3 average of 21 | Calmest measured, 10.4°, better on two engines | Lost to model_4500 |

The probe and the gates missed in both directions. The obvious rescue is a second engine, and Day 15 built one: Newton agreed with MuJoCo bin for bin on the long-delay weakness. But two engines agreeing is not the bench agreeing. Both share the plant, and the plant is rigid where the robot is not.

So the honest summary of lock-in has two halves. On the long-delay bin, the simulator's ordering transferred three times. On wobble, it did not transfer at all. My untested guess is the same one as on Day 11: policies that look calm in simulation make small corrections near upright, and on hardware small corrections disappear into backlash, stiction and compliance, which a twitchier policy like model_4500 punches through.

::: field Field notes: a simulator metric earns its weight on the bench
**Trust a sim metric when** it has predicted a bench behaviour before you saw it. ✅ The 36-44 ms bin: three hits (Day 14). ❌ The wobble probe: two misses (Day 11). **What goes wrong:** model_5500 was exported partly on the strength of a survival gate the bench did not agree with. **Test:** before optimising a sim number, write down which bench result it should predict, then check. A third engine checks the engine, not the plant.
:::

The ranking that matters most stopped transferring exactly where the plant is least honest. That leaves a short list of things the loop has not closed.

### What is still open

Some of these are open in my notes and stay open here.

- **The 7.3 to 9.7 Hz bench wobble is unexplained.** The suspects are the compliances Day 16 lists as missing from the plant: four-bar slop, the tyre sidewall, servo backlash.
- **The critic rework (report 3.8) is unresolved.** The curves showed the critic degrading as training ran on. The rework greatly raised explained variance and steadied the curves, and the bench results after it are not better. sk_lean4c, the run labelled "fix the critic", is the same story at smaller scale: stable value loss, no better on the robot. Why healthier curves did not make a better robot is still under investigation.
- **The delay range.** The bench wobbles at 40 to 45 ms; training covers 3 to 30. Widening it is untried, and any result would be judged by a probe that has missed twice.
- **What differs between model_4500 and a policy that wobbles.** A capture of each standing still (pitch, gyro, both action channels) would show the oscillation frequency and amplitude. There are no hardware videos or bench plots in the notes, so every bench verdict on this page is a sentence, not a trace.
- **The repo is not public.** The plant is pinned at `robot_solution@769171a` on an internal server, so the commits and paths cited here cannot be followed from outside.

The project's own summary of all this, from my Chinese report, is that the hard part of RL on a real robot is not the algorithm but the gap between simulation and the machine, and that making the physical model right paid more than any change to the reward or the network. Every result on this page was about one robot doing one thing: balance and hold heading.

## Pitfalls

- **Testing "does it work" instead of "does it rank" (beats 1 and 5).** Every flashed policy balanced, which said nothing about lock-in. The symptom is a simulator favourite that the bench calls no better, as with sk_lean4c and the averaged policy.
- **Fixing a plant number in one place (beat 2).** The IMU height had three copies. The symptom is two engines that disagree under a green parity gate.
- **Shipping the simulator's favourite (beats 4 and 5).** The calmest policy in three simulators lost on the bench. Any new set of weights, an average included, goes through the latch probe and then onto the robot.
- **Reading healthy curves as a bench result (beat 6).** The critic rework improved explained variance and not the robot. Compare every training change against the bench, not only against its curves.

<!-- quiz -->

## Next

You might ask, what happens when the robot has more than one thing to do? Everything here was one robot and one skill: balance and hold heading. Even then the curriculum's spacing decided whether heading was learned at all, because sk_lean4 found it could earn 0.65 per step by balancing and ignoring the rest. A biped that walks, stands, turns its head and later skates needs several behaviours from one policy, and the hard one never gets learned if the easy one pays first. How do we order the lessons? That is [Day 19](../day19/).

## Sources

- `notes/the-worries-of-simulation-and-how-to-diagnose-them.md` ([Notion](https://app.notion.com/p/3e467249ddbf81bcac22fa33a907b346)): the three worries, their tests and verdicts, the nine-arm table, "the real coupling is the firmware's signal processing".
- Probation report ([Notion](https://app.notion.com/p/3f367249ddbf80d890eef6f59636b9c5)) and the Chinese 试用期报告 ([Notion](https://app.notion.com/p/3f467249ddbf8166aff6caa48edf6ffa)): sections 3.2, 3.5, 3.7 and 3.8, the open items, section 4.1, and the week 1-9 timeline.
- `artifacts/removing-more-made-it-better.html`: the ladder behind the arm table, the verdicts and the caveats.
- `artifacts/the-wobble-chase.html` (copied here as [The Wobble Chase](../assets/embeds/the-wobble-chase.html), embedded on [Day 11](../day11/)): the run lineage, the claims board, the bench verdicts, Newton as a judge, the open questions.
- `artifacts/the-floating-centre-of-mass.html`: the 85 mm decree, the moment ledger, 1.71 against 2.07 Hz, the re-baselined gates, the ring-down test (1.5 to 3.1 Hz against 7.3-9.7 Hz).
- `artifacts/wlbot-plant-map.html`: the IMU height written three times, the two hip laws, era breaks, the provenance tags.
- `artifacts/one-plant-two-engines.html`: oracle, trainer and judge, and what was built.
- `artifacts/yd15-hardware-findings.html` and `artifacts/station-keeping-policy-runner.html`: the first flash, the latch and the 2 V acceptance (Days 13 and 17).
- `artifacts/rl-toys-defect-register.html` (embedded on [Day 10](../day10/)): the state of the training code before the retrain.
- `artifacts/rundoctor-sk-lean4.html` (embedded on [Day 10](../day10/)) and `artifacts/the-sim2sim2real-verdict.html` (embedded on [Day 14](../day14/)).
- J. Tan, T. Zhang, E. Coumans, A. Iscen, Y. Bai, D. Hafner, S. Bohez and V. Vanhoucke, "Sim-to-Real: Learning Agile Locomotion For Quadruped Robots", RSS 2018 ([arXiv:1804.10332](https://arxiv.org/abs/1804.10332)).
