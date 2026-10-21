---
day: 14
minutes: 60
widgets: [ablation-explorer]
quiz:
  - kind: why
    q: "Four parts of a policy's interface were tuned together. You remove each one in turn, train, and compare every arm with the control. Why can these single-removal arms not tell you, on their own, how much each part is worth?"
    choices:
      - "Each removal is measured against a design the other parts were built around."
      - "Single removals need more seeds than combined ones to reach significance."
      - "Removing one part also changes the learning rate the trainer settles on."
      - "The control was trained earlier, so its numbers come from older code."
    answer: 0
    explain: "Removing one part asks what this particular design does without it, and the answer depends on whether its partners can take over. If two parts overlap, each looks essential alone, and only an arm that removes them together shows whether the effects add up. In the ablation behind this day, the frame stack looked vital alone and nearly free once the filter went too. (Beats 1 and 2: one piece at a time, and the combined arm.)"
  - kind: numbers
    q: "Survival: control 0.976; filter removed 0.979; stack cut to one frame 0.911; both removed 0.970. How much does the stack's effect depend on the filter, $I = (y_{\\text{both}} - y_{\\text{filter off}}) - (y_{\\text{stack off}} - y_{\\text{control}})$?"
    choices:
      - "$I = -0.065$: the stack alone matters and the filter changes nothing."
      - "$I = -0.006$: the effects add up, so the singles were enough."
      - "$I = +0.056$: most of the stack's single effect was interaction."
      - "$I = +0.074$: removing both parts together improves the policy."
    answer: 2
    explain: "The stack costs $0.976 - 0.911 = 0.065$ with the filter on and $0.979 - 0.970 = 0.009$ with it off, so $I = -0.009 - (-0.065) = +0.056$. If $I$ were zero the parts would add and singles would be enough. Here the filter was carrying history the stack would otherwise carry, which only the combined arm could show. (Beat 2: the combined arm.)"
  - kind: numbers
    q: "Two policies survive 0.948 and 0.927, each measured on $n = 1000$ episodes. Counting episode noise only, what is the standard error of one reading near 0.93, and how big is the 0.021 gap in those terms?"
    choices:
      - "About 0.0008; the gap is 26 standard errors, a clear win."
      - "About 0.008; the gap is under two SEs of a difference, ~0.011."
      - "About 0.08; the gap is a quarter of one SE, pure noise."
      - "About 0.03; the gap is under one SE, so they are identical."
    answer: 1
    explain: "$\\sqrt{0.93 \\times 0.07 / 1000} \\approx 0.008$, and the difference of two independent readings has $\\sqrt{2} \\times 0.008 \\approx 0.011$, so 0.021 is under two of those. That counts only episode noise: the evaluator itself, the training seed and the choice of checkpoint all add more. One pair of checkpoints at under two standard errors is suggestive, not a ranking. (Beats 3 and 7: the evaluator, and how sure is sure.)"
  - kind: why
    q: "You evaluate one checkpoint three times with the same evaluator seed and get 0.974, 0.976 and 0.982. A new variant then scores 0.970 against the control's 0.976, one training seed each. Why can you not call the variant worse?"
    choices:
      - "Because 0.006 is under 1 % of the score, too small to matter."
      - "Because 0.970 falls inside the control's repeat range of 0.974-0.982."
      - "Because three repeats are too few to estimate any spread at all."
      - "Because 0.006 is inside the evaluator's own repeat spread of 0.008."
    answer: 3
    explain: "The same checkpoint moved by 0.008 between runs, so a gap smaller than that spread (a tie band of about 0.011) cannot be resolved at one seed. The threshold comes from repeating the evaluator, not from intuition. 0.970 is in fact below the 0.974-0.982 range, and three repeats give a rough but usable spread. In the real case three seeds per arm later showed the gap was real, about 0.007, which one seed could not have told you. (Beat 3: how big is nothing?)"
  - kind: whatif
    q: "Action delay is randomised per episode over 5-45 ms. You compare interface variants on overall survival only, with a tie band of ±0.011, and a weakened variant scores 0.970 against 0.976. What do you risk missing?"
    choices:
      - "Nothing, since a mean over 1000 episodes already weighs every delay."
      - "A gain on short-delay episodes, since a smaller input trains faster."
      - "A larger loss on long-delay episodes, averaged away by easy ones."
      - "A loss that shows only once the evaluator's seed is changed."
    answer: 2
    explain: "Most delay draws are easy, so the mean is dominated by episodes any variant survives. A weaker interface identifies the delay worse and loses most in the longest-delay bin; in the real ablation that bin fell 0.018 to 0.024 where the headline fell 0.006, and it predicted the bench three times. Find the metric that predicts your hardware, often the tail bin of whatever you randomise. (Beat 5: the mean hides the tail.)"
  - kind: whatif
    q: "Your kill rule stops a run if reward per step falls by 20 %. At iteration 500 a curriculum switches on a new penalty term, reward per step drops from 0.65 to 0.49, and episode length keeps rising. What happens?"
    choices:
      - "The rule kills a healthy run; it watches a number that falls by design."
      - "The rule correctly kills a run that has started to collapse."
      - "Nothing; a drop of that size is too small to cross the threshold."
      - "The rule waits, because episode length overrides reward in kill rules."
    answer: 0
    explain: "0.49 / 0.65 is about a 25 % drop, so the rule fires, but the drop is the new term being charged, not the policy getting worse; rising episode length says it is still learning. Key kill rules on a number that does not move by design, such as episode length or a gate, and write them down before launch. (Beat 6: write the prediction and the kill rule down first.)"
  - kind: numbers
    q: "Two arms, three training seeds each. All three seeds of arm A score above all three seeds of arm B. If the arms were really the same, how likely is that ordering by chance (one-sided)?"
    choices:
      - "1 in 6."
      - "1 in 8."
      - "1 in 9."
      - "1 in 20."
    answer: 3
    explain: "With no difference, every way of splitting the six scores into two groups of three is equally likely. There are $\\binom{6}{3} = 20$ splits and only one puts all of A on top, so about 1 in 20. That is the strongest statement three against three can ever make. (Beat 7: how sure is sure.)"
  - kind: whatif
    q: "Push strength ramps up over the first half of each run. You compare a 20,000-iteration run at iteration 5000 with a 5000-iteration run at its final checkpoint. What is wrong with the comparison?"
    choices:
      - "Nothing; both policies have trained on 5000 iterations of data."
      - "The long run is still at half push strength, so conditions differ."
      - "The long run has a higher learning rate, which the score ignores."
      - "Only the checkpoint's seed differs, and the evaluator fixes that."
    answer: 1
    explain: "At iteration 5000 the long run has been trained against half-strength pushes, while the short run has finished its ramp. Their survival numbers measure different curricula as much as different policies. Compare at matched iterations and matched stage, and look at several checkpoints, since checkpoints of one run scatter too. (Beat 4: seeds and checkpoints are noise too.)"
---

**Goal:** run ablations whose conclusions survive: combined arms next to the singles, a noise floor measured before any threshold is set, tail metrics next to the headline, and predictions written down before the run.

## Where we left off

Four interface pieces, each added for a good reason, and Day 13 ended on the number that undid our reading of them: removing the frame stack on its own cost 0.043 survival, removing it together with three others cost 0.007. A single removal measured the interaction, not the piece. So how do we run an ablation whose conclusions survive?

The word comes from surgery and neuroscience: take a piece out and see what stops working. Deep RL borrowed it, and then found out how easily it lies. In 2018 Peter Henderson and colleagues ran the same algorithm on the same task with ten random seeds, split them into two groups of five, and got two learning curves far enough apart to pass for two different algorithms. In 2021 Rishabh Agarwal and colleagues went back over published benchmark results and showed that with the three to five runs most papers could afford, a single point estimate hides so much uncertainty that some claimed improvements disappear once an interval is drawn around them. Day 10 had Schulman's version in three words: know your noise.

None of that stops anyone from starting where everyone starts. Their first attempt was the obvious one, and so was mine.

## The picture

Say you want to know what each ingredient does in a soup you have been tuning for months: salt, soy sauce, a stock cube, a spoon of miso. The obvious plan is to cook it four more times, leaving one out each time, and taste.

Leave out the salt and it tastes flat, so salt matters. Leave out the miso and it tastes flat, so miso matters too. Now leave all four out and add one pinch of salt, and it tastes almost the same as the original. All four were doing the same job, and each one was only "essential" because the others had been cut back to make room for it. Worse, taste the same bowl three times and you do not give it the same score. Leaving one out tests the pot, not the ingredient, and the taster has a wobble of their own. The first problem is the ingredient one: what does a single removal actually measure?

## Step by step

### Take one piece out at a time

The wheeled-leg robot's policy sees 40 inputs: ten channels stacked four frames deep, a 50 ms low-pass on the wheel odometry, and a heading fused by a yaw estimator with ten constants, a PI loop, a slip gate and a settle clock. Training also adds noise to the fed-back prev_action as a regulariser. A sibling firmware balances the same robot on six inputs and one action. That comparison was the worry: is all of this complexity paying for itself?

So, the obvious experiment. Keep the recipe fixed (1024 envs × 128 steps, 5000 iterations, γ = 0.999), delete one piece per arm, train, and evaluate every arm on the same 3000 episodes under full domain randomisation with evaluator seed 12345. Then compare each arm with the control.

| Arm (what came out) | Survival | Wobble sd | Reading |
|---|---|---|---|
| control (nothing) | 0.976 | 1.58° | reference |
| nolpf (the low-pass) | 0.979 | 2.46° (+56%) | keep the filter: it is shakier without |
| gyroyaw (the yaw estimator) | 0.973 | 1.99° | removable? |
| noreg (the prev_action noise) | 0.970 | 1.46° | removable? |
| h1 (4 frames → 1) | 0.911 | 1.54° | keep the stack: by far the worst |

That reads like a clean result: keep the low-pass, keep the stack, think about dropping the other two. Each verdict is a confident sentence about one piece.

But none of these arms asked a question about one piece. The four were tuned together. The stack depth was chosen with the filter already in place; the noise level was set for four frames of history. Deleting one asks "what does this particular design do without X", and the answer depends on what the other three were doing to cover for it. If two pieces overlap, each single removal looks cheap or dear depending on whether its partner can take over, and the singles alone cannot tell you which.

::: field Field notes: one change per arm
**Put in when:** always. An arm changes one thing, or names the set it changes. **What goes wrong:** commit `f94036f` removed the action mixer and widened the network to 128×128 in one change, and no later run separated the two. Every reading of those runs credits two causes at once. **Test:** before launching, write the arm as a diff of the control. If the diff has two lines that could each explain the result, it is two arms.
:::

So the singles need a partner: an arm that removes the pieces together, so that we can see whether their effects add up.

### The combined arm

The arm nobody wanted to run is the one that takes all four out: one frame, no filter, no estimator, no prev_action noise. Ten inputs, close to the sibling firmware's six. If the singles were additive, losing the stack alone already cost 0.065, so this arm should be at least that bad.

It came out at 0.970. Wobble 1.23°, calmer than the control.

When the combined arm disagrees with the singles, that disagreement is the result. Put the two pieces that matter most in a square:

|  | **Low-pass on** | **Low-pass off** |
|---|---|---|
| **4 frames** | control 0.976 (3 fresh samples + a summary of the deep past) | nolpf 0.979 (4 fresh samples, nothing beyond the window) |
| **1 frame** | h1 0.911 (the summary only, no fresh sample) | combo 0.970 (1 fresh sample, no memory) |

One step from the control in either direction is survivable. Moving down the left column is not. Moving diagonally lands almost where it started. Day 13 has the mechanism: the one-pole filter is a memory compressor, and four filtered frames are three raw samples plus an exponential summary of all history. At one frame the filtered channel is nearly all history and says almost nothing about now, which is why h1 is the worst arm in the ladder. The stack's "effect" was the effect of keeping a summary with no fresh sample.

The square has a number for this. Take the stack's effect with the filter on, and again with it off, and subtract:

$$
I = \big(y_{\text{combo}} - y_{\text{nolpf}}\big) - \big(y_{\text{h1}} - y_{\text{control}}\big) = (-0.009) - (-0.065) = +0.056
$$

::: tip
$I$ is how much removing the stack changes depending on whether the filter is there. If $I = 0$ the pieces add up and singles are enough. Here the stack costs 0.065 with the filter and 0.009 without it, so most of the single-removal number was the interaction. One honest caveat: the combo cell also lost the estimator and the noise, which cost 0.003 and 0.006 on their own, so this square is not a perfectly clean 2×2.
:::

That is an interaction, and the combined arm is the only way to see one. The next move after a disagreement is the one arm that separates the candidate mechanisms; my notes say ours was a single run and it settled the question.

<ablation-explorer metric="surv" seeds="1"></ablation-explorer>

Toggle the pieces. Seven of the sixteen on/off combinations were run, so most of the square's neighbours have no number: an ablation is a sample of the design space, not a map of it. Switch the metric between survival, the 36-44 ms bin and wobble and watch the ranking change.

::: field Field notes: singles and the combined arm
**Run when:** any time the pieces were tuned together, which is always. **Skip it when:** never; it is one extra run. **What it cost to skip:** single-arm readings said keep the low-pass and keep the stack. Both were about the interaction. Without the combined arm we would have recorded two confident conclusions with the wrong reasons attached, and never found the memory argument that explains all four cells. **A number to check:** my Insights page quotes the single stack removal as 0.043; the seed-0 table puts h1 0.065 below the control. I have not found which evaluation the 0.043 came from. The direction and the conclusion are the same either way.
:::

The whole reading of the square rests on one claim, though: that combo at 0.970 is "almost where it started". It is 0.006 below the control. Is 0.006 a difference or nothing?

### How big is nothing? Measure the evaluator first

The obvious answer is that the evaluator is fixed: same 3000 episodes, same seed 12345, so any difference between two numbers is a difference between two policies. I believed that until we evaluated one checkpoint three times at one seed and got 0.974, 0.976 and 0.982.

The evaluator itself moves by 0.008. So the threshold comes from the evaluator, not from intuition: same checkpoint, same seed, three runs, and the spread sets the tie band. We set it at about 0.011, and anything under that is unresolvable at one seed. combo's 0.006 is inside it.

Part of that spread is plain counting. Survival is a fraction of $n$ episodes, and a fraction has a standard error:

$$
\mathrm{SE}(\hat p) = \sqrt{\frac{\hat p\,(1-\hat p)}{n}}
$$

::: tip
How much a survival rate $\hat p$ measured on $n$ episodes would move if you drew a fresh batch of episodes. At $\hat p = 0.976$ and $n = 3000$ it is 0.0028. At $\hat p \approx 0.93$ and $n = 1000$ it is about 0.008, the figure in my Wobble Chase notes. Quadruple the episodes to halve it.
:::

The three repeats have a standard deviation of about 0.004, bigger than counting alone predicts at $n = 3000$, so something else in the evaluator varies between runs as well. My guess is non-deterministic GPU physics, but I have not tested it; the number is what matters, and the number was measured.

The same rule decides which metrics count at all. A tie band from intuition would have been far too tight on yaw RMSE, whose spread across the control's own checkpoints (0.212 to 0.262) is as large as any effect we were looking for. So yaw RMSE was dropped as a criterion.

::: field Field notes: let the evaluator set the threshold
**Test:** same checkpoint, same seed, three evaluation runs. Threshold = that spread. Ours: 0.974 / 0.976 / 0.982, so differences under ~0.011 are unresolvable at one seed. **What goes wrong:** too few episodes per cell. The default wobble probe runs 4 episodes per cell, and it made sk_lean5's model_9500 look like proof that longer training smooths the policy. At 12 episodes per cell it was scatter. ❌ A probe with no measured spread is a story, not a measurement.
:::

So the floor is measured, and combo sits inside it at one seed. But that floor is the noise of evaluating one checkpoint of one run. The run itself is a draw too: another training seed gives another policy.

### Seeds and checkpoints are noise too

The cheap fix for "is 0.006 real" is to train the two arms again with new seeds. Three seeds each:

| Run | Seed 0 | Seed 1 | Seed 2 | Mean | 36-44 ms bin, mean |
|---|---|---|---|---|---|
| control | 0.976 | 0.975 | 0.973 | 0.975 | 0.923 |
| combo | 0.970 | 0.964 | 0.971 | 0.968 | 0.905 |

The control's worst seed, 0.973, beats combo's best, 0.971. At one seed each, the 0.006 gap sat inside noise. At three seeds it does not, and the long-delay bin separates further. Switch the explorer above to "3 seeds" to see the dots. So combo is really a little worse: about 0.007 on the means.

Seeds are not the only draw. Within one run, late training is a random walk (Day 11): checkpoints 100 to 500 iterations apart differ by 6° of wobble and 0.3 of yaw-rate RMSE. sk_lean5_s2's six checkpoints from 5000 to 9999 survive between 0.929 and 0.955 at $n = 1000$, where one reading has a standard error near 0.008: those six are samples of one policy. Any comparison between two runs that rests on one checkpoint from each is a comparison of two draws.

And a draw has to be taken under the same conditions. A 20,000-iteration run is still at half push strength at iteration 5000, so its survival at 5000 is not comparable with a 5000-iteration run's survival at 5000. Matched iterations, matched push strength, or no comparison.

::: field Field notes: matched checkpoints, or no ranking
**Put in when:** comparing any two runs. Compare at matched iterations and matched curriculum stage, and look at several checkpoints, not one. **What goes wrong:** sk_lean5's model_5000 beat sk_lean3's model_4999 on the mjlab gate, 0.948 against 0.927, same recipe and seed. It is one pair of runs and one checkpoint each, and the bench later preferred sk_lean3. **Evidence that a difference is real:** three seeds where the worst of one beats the best of the other. ⚖️ Three seeds cost three runs; we only paid it for the arms we planned to act on.
:::

We got sidetracked a bit here, so a regroup. We started by removing one piece at a time and got four confident verdicts. The combined arm showed they were readings of an interaction. The evaluator's own spread told us that combo's 0.006 was invisible at one seed, and three seeds made it visible: combo really is about 0.007 worse. That leaves the question the survival column cannot answer. 0.007 of survival, spread over 3000 episodes, says nothing about where the lost robots fell, or whether that matters for the robot on the bench.

### The mean hides the tail

The headline is a mean over every episode the randomisation draws. Most draws are easy. The action delay is drawn per episode over 5 to 45 ms, and Day 13 showed why that is the hard part: identifying the delay takes several (action, response) pairs, and a weakened interface keeps fewer of them. So it behaves like a policy tuned for the average delay, and the average is wrong at the tail.

That is where the damage went. On the seed-0 ladder the 36-44 ms bin (the longest held-delay quartile) falls further than survival for every weakened arm: h1 to 0.757, nolpf_jerk1 to 0.891, combo to 0.912, against the control's 0.936. And this bin did something the headline never did: it predicted the bench. Combo (0.905 over three seeds) and the jerk-penalty arm (0.891) both drive further forward before recovering from a push, against the control's 0.923. The long-delay bin has now called a bench behaviour three times before we saw it.

So the rule: find the metric that predicts your hardware and weight decisions on it, not on the headline. A good place to look is the tail bin of whatever you randomise. Schulman's list says the same in general: look at the min, the max and the episode length, not just the mean.

But a metric earns that weight by predicting, not by looking relevant. The simulated wobble probe looked like the most relevant number we had, since the bench complaint was wobble. It missed in both directions. model_5500 was calm in simulation and wobbled on the robot; a 21-checkpoint weight average was the calmest policy we measured, halving simulated wobble, and lost on the bench to model_4500. My untested guess is that policies which look calm in simulation make small corrections that disappear into backlash, stiction and compliance on hardware. Either way the probe's record is two misses, and the bin's is three hits.

::: field Field notes: know what simulation cannot settle
**Rule:** a component whose time constant is longer than an episode cannot be evaluated by the episode, however faithfully it is modelled. **Evidence:** the yaw estimator's settle clock is 20 s and episodes are 10 s, so simulation teleports it into the settled state at reset and never tests the part we built it for. ⚖️ gyroyaw (0.973) reads as removable, on one seed. That is a hardware question, not a question for another seed.
:::

Three hits for the bin and two misses for the probe, and we only learned which was which after the bench. With nine arms and half a dozen metrics, some metric will always line up with what happened, after the fact. The only defence is to say what we expect before the run.

### Write the prediction and the kill rule down first

The sim2sim2real experiment is the one I ran this way from the start. The paper (arXiv 2606.02636v2) proposed learning a behaviour in an idealised simulator, freezing a forward model of the robot's kinematics, and retraining on the randomised plant with an imitation reward. The control was sk_lag_r128_s0: 0.870 survival on the honest plant at its last checkpoint, 0.886 at 4500. Before every launch the prediction and the kill rule went into the log, and an orchestrator killed stages on those rules, read from the training log's own scalars.

| Prediction, written before launch | Outcome |
|---|---|
| Ladder 1: B1 at or above the control at 5000 | killed at 1000: missed |
| Ladder 2: A2 survives the clean evaluation ≥ 0.9; gate passes | 0.975: confirmed |
| Ladder 2: B1 within 0.02 of the control at 5000, no beat expected | +0.014, everything ties: confirmed |
| Ladder 2: B1 − B0 ≥ 0.02 means the imitation term works | +0.010 and −0.003: inert |
| Ladder 2: the calibrated kernel rescues the ladder-1 model | killed at 1000: missed |
| B1S: a tie with the control | 0.832 against 0.877 at 3000: below control |

Two things in that table only exist because the rows were written first. "Inert" is a result: B1 and B0 differ only in the imitation term, and the threshold for "it works" was fixed at 0.02 before either ran, so a +0.010 cannot be talked up afterwards. And the misses are recorded as misses, not quietly re-read as "it needed more iterations".

<figure class="embed">
  <iframe src="../assets/embeds/sim2sim2real-verdict.html" title="The sim2sim2real Verdict: seven runs, pre-registered predictions and kill rules" loading="lazy" style="height:720px"></iframe>
  <figcaption>The full write-up. Section 6 has the training curves with the killed arms; section 8 has the predictions against the outcomes. <a href="../assets/embeds/sim2sim2real-verdict.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

The other half of the discipline is a check before training at all. When ladder 1 failed, we scored the frozen model directly: roll a known-good controller out on the plant and apply the imitation kernel at every step, exactly as the reward would. That is how Day 12's 7.5σ kernel was found. The check found both faults (a plant with no delay, and a kernel too narrow to be attainable) in minutes, before another five-hour run.

Day 10's run doctor does the same for a single run: sk_lean4's written-down 0.87 came in at 0.65, and `prediction_missed` recorded the miss as a miss.

::: field Field notes: pre-register, and key kill rules on the right number
**Put in when:** before every launch you intend to act on. Write the prediction, the tie band and the kill rule. **What goes wrong:** the sk_lean5_s0 kill alarm was keyed on reward, which falls by construction when a reward weight switches on, and it fired while episode length was rising. Its sibling sk_lean5_s2 shows the shape: when heading came on at iteration 500, reward per step fell from 0.65 to 0.49 while episode length kept climbing (841, 857, 889). A kill rule has to watch a number that does not move by design. **Test:** score a frozen model against a known-good controller before training on it. ✅ It caught both sim2sim2real faults in minutes.
:::

::: field Wrong turns worth remembering
- Two changes went into one commit (per-wheel action and 128×128), and no later run separated them.
- Runs were compared at different iteration counts and different push strengths.
- sk_lean4 was judged on its training reward and never gated for four days.
- A kill alarm keyed on reward, which falls by design when a weight switches on.
- A 4-episode wobble probe made model_9500 look like proof that longer training smooths the policy.
- "Per-wheel takes twice as long to learn heading" was concluded from sk_lean4 alone and reversed an hour later by sk_lean4b and 4c.
:::

So pre-registration fixes what we expected and the noise floor fixes what we can resolve. What is still missing is a number for how sure we are. "The worst seed beats the best seed" was read off by eye. How much does that actually say, with three seeds?

### A short statistics primer: how sure is sure

Every number on this page is a sample, and a sample wants an interval, not a point. Three tools cover what an ablation like ours needs, and they are worth running on the same six numbers: control 0.976 / 0.975 / 0.973 against combo 0.970 / 0.964 / 0.971.

**A confidence interval for one evaluation.** Beat 3's standard error gives it: $\hat p \pm 1.96\,\mathrm{SE}$ covers the true survival about 95% of the time if counting were the only noise. For the control at $n = 3000$ that is 0.976 ± 0.0055. Our measured evaluator spread says the real interval is a bit wider.

**A bootstrap over seeds.** Resample the seeds with replacement: draw three control seeds out of the three (repeats allowed), three combo seeds out of three, and take the difference of the means. Do that for every possible draw, which with three seeds is only $27 \times 27 = 729$ pairs, and look at the spread. I get a gap of 0.006 with a 95% percentile interval of 0.003 to 0.010, and not one of the 729 resamples comes out at or below zero. The catch: a bootstrap can only reshuffle the spread it has seen, and three seeds have not seen much. With three seeds it is optimistic.

**A rank argument.** If control and combo were the same policy-maker, every way of splitting the six numbers into two groups of three would be equally likely. There are

$$
\binom{6}{3} = 20
$$

splits, and only one of them puts all three control seeds above all three combo seeds.

::: tip
"Worst beats best" with three seeds each would happen by chance about 1 time in 20 (one-sided) if the arms were the same. That is the strongest statement three against three can ever make. A plain t-interval on the same numbers, which leans on a normal shape it cannot check with three points, just includes zero.
:::

So three seeds say "probably real, at about 1 in 20". What makes me believe it is that the long-delay bin agreed and then the bench agreed. Agarwal and colleagues recommend the same habits for benchmark suites: report interval estimates, use the interquartile mean rather than the mean or median of a handful of runs, and look at the whole distribution of scores. With one robot and one task, the part that carries over is the first one. The intervals, the bootstrap and the 1-in-20 are my own arithmetic on the logged values, not something the project reports.

::: field Field notes: a good score alone says nothing
**Where else this bites:** fitting the HD-1910 servo model. Unseeded parallel CMA-ES on a flat, stick-slip landscape lands somewhere different each run, and two fits on nearly identical data returned a torque constant of 0.47 and 0.91 at almost the same error. **Test:** run the same fit twice. If the scores match but a number does not, the data does not decide that number. Validate on data the fit never saw: the Kp 8 logs and load D were held out. ✅ The same rule as three seeds, applied to system identification.
:::

So we can now say how sure we are, about one robot in one simulator. Every interval on this page, every seed and every checkpoint was scored by the same engine, and an interval says nothing about whether that engine ranks policies the way the robot does.

## Pitfalls

- **Two changes in one arm (beat 1).** The run looks like a result and is two hypotheses. You will see it later, when someone asks which change did it and no run can say.
- **Singles without the combined arm (beat 2).** The symptom is a list of pieces that are each "essential", added up to more than the whole design can lose. If removing two pieces together costs less than either alone, the singles measured the interaction.
- **A tie band from intuition, or a probe too small to have one (beat 3).** A 4-episode probe or a one-seed difference under 0.011 will produce a confident story either way. Measure the repeat spread first.
- **Unmatched comparisons (beat 4).** Two runs compared at different iterations or different push strengths, or judged by training reward without a gate. sk_lean4's training reward looked like a slower learner; the gate showed a robot spinning in place.
- **A kill rule on a number that moves by design (beat 6).** Reward per step drops whenever a curriculum weight switches on. Key the rule on episode length or a gate, and record a missed prediction before deciding it was the pacing.

<!-- quiz -->

## Next

You might ask, how much of this ranking belongs to the robot and how much to MuJoCo? Every number so far came from one simulator: the nine arms, the noise floor, the seeds, the bin that predicted the bench three times, and the wobble probe that missed it twice. "Simulator lock-in" is a question of whether the ranking transfers, and only a second engine scoring the same plant can answer it. Which simulators, and how do we stop two copies of the plant drifting apart? That is [Day 15](../day15/).

## Sources

- `notes/ablation-studies-how-to-run-them.md` ([Notion](https://app.notion.com/p/3e467249ddbf8178842cdaf7995e1141)): combined arms, the evaluator as the threshold, the metric that predicts hardware, what simulation cannot settle, the checklist.
- `notes/the-worries-of-simulation-and-how-to-diagnose-them.md` ([Notion](https://app.notion.com/p/3e467249ddbf81bcac22fa33a907b346)): the nine-arm table, the three seeds, the 2×2, the long-delay argument and the caveats.
- `artifacts/removing-more-made-it-better.html` (primary): the same ablation with its "How should the ablation itself be run?" section; the explorer's data is its seed-0 ladder.
- `artifacts/the-wobble-chase.html`: checkpoint scatter, the standard error at $n = 1000$, matched iterations, the 4- vs 12-episode probe, bench verdicts against simulation, and "Wrong turns worth remembering".
- `artifacts/the-sim2sim2real-verdict.html`: pre-registered predictions, kill rules, scoring a frozen model against a known-good controller. Embedded above, with the chart redrawn at the page's width.
- `artifacts/rundoctor-sk-lean4.html`: the `prediction_missed` event at iteration 1200.
- `artifacts/hd-1910-calibration-layers.html`: held-out fits, unseeded CMA-ES, run fits twice.
- `notes/deep-rl-hacks-schulman.md`: "Know your noise", "Many seeds, many tasks", from John Schulman's "Nuts and Bolts of Deep RL" (2017). Write-up: [github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks).
- P. Henderson, R. Islam, P. Bachman, J. Pineau, D. Precup and D. Meger, "Deep Reinforcement Learning that Matters", AAAI 2018 ([arXiv:1709.06560](https://arxiv.org/abs/1709.06560)).
- R. Agarwal, M. Schwarzer, P. S. Castro, A. Courville and M. G. Bellemare, "Deep Reinforcement Learning at the Edge of the Statistical Precipice", NeurIPS 2021 ([arXiv:2108.13264](https://arxiv.org/abs/2108.13264)).
- B. Efron, "Bootstrap Methods: Another Look at the Jackknife", Annals of Statistics, 1979.
