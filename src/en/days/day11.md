---
day: 11
minutes: 55
widgets: [credit-window, random-walk]
quiz:
  - kind: why
    q: "PPO with GAE, $\\gamma = 0.999$ and $\\lambda = 0.95$: the advantage weight $(\\gamma\\lambda)^k$ is already down to 0.29 at $k = 24$, so a 24-step rollout holds most of every advantage. Yet a task whose error builds up over seconds learned far better with 128-step rollouts than 24. What is the most likely reason?"
    choices:
      - "Longer rollouts raise $\\gamma\\lambda$ itself, so every advantage reaches further ahead."
      - "At a fixed data budget, 128 steps means more robots per update and wider randomisation."
      - "Value targets look about 1000 steps ahead; at 24 steps each is mostly the critic's guess $V(s_T)$."
      - "Advantage normalisation is more accurate on long buffers, and that removes the slow drift."
    answer: 2
    explain: "With $\\gamma = 0.999$ the return the critic is fitted to looks about $1/(1-\\gamma) = 1000$ steps ahead. A 24-step buffer gives it 24 real rewards and then $V(s_T)$, the critic's own guess about a slow error it has never seen, so the error never reaches the targets. At 128 steps the targets carry five times more of the real future. It is the likely mechanism, not an ablated one. (Beat 2: how much of each target is a guess.)"
  - kind: numbers
    q: "A slow error takes about 1 s to build up. Robot A's policy runs at 100 Hz and robot B's at 50 Hz, and both use 24-step rollouts. How much time does each rollout cover?"
    choices:
      - "A: 0.24 s, B: 0.48 s; both are shorter than the 1 s error."
      - "A: 0.48 s, B: 0.24 s; only B is shorter than the 1 s error."
      - "Both cover 24 steps, which is the same span on any robot."
      - "A: 2.4 s, B: 4.8 s; both comfortably hold the 1 s error."
    answer: 0
    explain: "Steps divided by rate: 24 / 100 Hz = 0.24 s and 24 / 50 Hz = 0.48 s. The same step count is a different stretch of time on each robot, so a rollout length copied between control rates means something else. Holding 1 s takes 100 steps at 100 Hz. Count the rollout in seconds of the slowest consequence. (Beat 1: rollout length.)"
  - kind: numbers
    q: "Each PPO iteration collects 1024 robots × 128 steps, splits the buffer into minibatches of 4096 rows, and makes 10 passes over it. How many gradient steps is that per iteration, and how many times is each row used?"
    choices:
      - "32 gradient steps; each row is used once."
      - "1280 gradient steps; each row is used 128 times."
      - "10 gradient steps; each row is used 32 times."
      - "320 gradient steps; each row is used 10 times."
    answer: 3
    explain: "The buffer is 1024 × 128 = 131,072 rows, which is 32 minibatches of 4096. Ten passes over 32 minibatches is 320 steps, and each row sits in one minibatch per pass, so it is used ten times. Halving the count to 16 minibatches of 8192 gives 160 less noisy steps over the same data. (Beat 3: minibatches.)"
  - kind: whatif
    q: "Your trainer config sets the number of minibatches (32), not their size. You go from 1024 to 4096 robots, keeping 128 steps per robot and 10 passes. What silently changes?"
    choices:
      - "Nothing: 32 minibatches and 10 passes still give 320 steps."
      - "Each minibatch grows from 4096 to 16,384 rows, outside its tuned range."
      - "The gradient steps grow to 1280 per iteration, so updates overshoot."
      - "Each row is now used 40 times, so the policy overfits the buffer."
    answer: 1
    explain: "With the count fixed, the size follows the buffer: 4096 × 128 / 32 = 16,384 rows. The step count stays at 320, which is why nothing in the logs flags the change. Minibatch size has a working range for a given policy, and a default that landed at 24,576 rows once stalled a run for 400 iterations. Hold the size fixed when you change the robot count. (Beat 3: minibatches.)"
  - kind: whatif
    q: "A run reaches its plateau at iteration 5000 with a fixed learning rate of 5e-4. You let it run to 10,000, hoping the policy will settle into something calmer. What does the late training actually do?"
    choices:
      - "The weights wander with no direction, so late checkpoints are scattered draws."
      - "The weights converge, because the gradient shrinks to zero at the plateau."
      - "The policy diverges, because a fixed rate cannot react to the measured KL."
      - "The policy keeps improving slowly, at about the rate it had before 5000."
    answer: 0
    explain: "At the plateau the gradient is mostly noise, and a fixed step never shrinks, so each update is a step in a nearly random direction. Measured over late checkpoints, net displacement over path length matched the $1/\\sqrt{n}$ of a random walk in every run tried. A longer run is a longer walk; a step decayed towards zero, or an average of late checkpoints, is what would settle it. (Beat 4: training longer does not smooth the policy.)"
  - kind: numbers
    q: "You save the actor weights every 100 iterations over the last 4000 iterations of a run. If late training is a pure random walk, what should net displacement divided by the summed step lengths come out at?"
    choices:
      - "About 0.025, because $1/40$ for 40 steps."
      - "About 0.05, because $1/\\sqrt{400}$ for 400 steps."
      - "About 0.16, because $1/\\sqrt{40}$ for 40 steps."
      - "About 1.0, because every step adds to the distance."
    answer: 2
    explain: "A walk of $n$ independent equal steps ends about $\\sqrt{n}$ steps from its start, so the ratio is $\\sqrt{n}/n = 1/\\sqrt{n}$. 4000 iterations in steps of 100 is $n = 40$, and $1/\\sqrt{40} \\approx 0.158$. A walk with a direction would score near 1; a real 10,000-iteration run measured this way came out at 0.18. (Beat 4: training longer does not smooth the policy.)"
  - kind: why
    q: "An adaptive schedule multiplies the learning rate by 1.5 when the measured KL per update is below 0.005, and divides it by 1.5 when KL is above 0.02. Why does it not anneal the learning rate by itself late in training?"
    choices:
      - "It does: as the policy converges, KL falls and the rate falls with it."
      - "The clip range takes over from the schedule once the policy plateaus."
      - "The 1.5 factor is symmetric, so the rate can only drift around its start."
      - "Fading updates give small KL, and small KL is when it raises the rate."
    answer: 3
    explain: "The rule holds the policy change per update roughly constant. When the learning signal fades, a step at the old rate barely moves the policy, KL drops under 0.005, and the rate goes up to keep it moving. It fixes the step's size in distribution space, so it can never let the step go to zero; one run sat at its 1e-2 ceiling 13% of the time late on. (Beat 5: adaptive KL keeps pushing the learning rate up.)"
  - kind: whatif
    q: "Averaging the weights of 21 late checkpoints from one run, element by element, gave a calmer policy in simulation. You try the same with the final weights of two runs trained from different seeds. What do you expect?"
    choices:
      - "A policy between the two, about as good as either one."
      - "Usually garbage, since the nets order hidden units differently."
      - "A better policy, since averaging cancels each run's seed noise."
      - "The same policy as either run, since both seeds share a recipe."
    answer: 1
    explain: "Two networks can compute the same function with their hidden units in a different order, so an element-wise average blends neuron 5 of one with an unrelated neuron of the other. Late checkpoints of one run share an ancestor and sit in one basin, so each unit does the same job in all of them, and their mean lands near the middle of that basin. Average within a run, never across runs, and gate the result like a new policy. (Beat 6: averaging 21 checkpoints.)"
---

**Goal:** choose rollout length, minibatch size and the learning-rate schedule from evidence, know which of the robot's results settle each choice, and know what checkpoint scatter does to every comparison.

## Where we left off

A healthy dashboard says the run is learning, not that the settings are right. Day 10 ended there: rollout length, minibatch size and learning rate moved the result more than any curve showed. So which knobs matter, and how do we tune them with evidence?

The field found this out the expensive way. In his 2017 "Nuts and Bolts of Deep RL" talk, John Schulman's advice was to sweep every hyperparameter, and to be suspicious if the method is very sensitive to one, because then it is probably working through lucky dynamics rather than the mechanism you think. In 2021 Marcin Andrychowicz and colleagues at Google Brain trained more than 250,000 agents to find out which of PPO's many choices actually matter.

Their first attempt, and ours, was the obvious one: take the defaults the code ships with.

## The picture

From the PD side, this looks familiar. A controller has two gains. You turn one, watch the step response a second later, and keep the change if the robot stops wobbling. Hyperparameters look like the same kind of knob: turn rollout length, watch the curve, keep it if the curve goes up.

It breaks in two places. A PD gain shows up in the next step response; a rollout length shows up 3000 iterations later, through a critic and an optimiser, so by the time you see it you cannot tell which turn did it. And the needle moves on its own. Day 10 showed the training curve wobbling with nothing changed, and today we will see the final policy wobble with nothing changed too. The first problem is the knob that cost this project days, and why its default was wrong.

## Step by step

### Rollout length: the 24-step stall

mjlab's default for the wheeled-leg robot was 4096 robots with 24 steps each: 98,304 rows per update, 0.24 s of robot time per robot. That looks like plenty of data. The robot learned to balance and never learned to hold its heading. Yaw RMSE stayed at 0.3–0.7.

Moving to 1024 robots with 128 steps each, on the same data budget, took yaw RMSE to 0.11–0.27. So the obvious story is that the rollout has to contain the consequence of a decision. A wheel command shows up in pitch within a few steps. Yaw drift under a zero command builds over seconds. If the reward for a decision and the decision itself rarely land in the same snippet, the update cannot connect them.

But circling back to Day 8's estimator:

$$
\hat A_t = \sum_{k=0}^{T-t-1} (\gamma\lambda)^k\, \delta_{t+k}
$$

::: tip
The advantage at step $t$ is the critic's surprise one step at a time, summed forward, with each later surprise weighted by $(\gamma\lambda)^k$. That weight is the credit window: how far ahead a step's score still looks.
:::

On the robot $\gamma\lambda = 0.999 \times 0.95 = 0.949$. The weight is 0.29 at $k = 24$ and 0.001 at $k = 128$. So the advantage at any step is mostly decided within about 20 steps either way, and a 24-step window already holds most of it. Drag the rollout length down to 24 and back up to 128:

<credit-window gamma="0.999" lambda="0.95" steps="24"></credit-window>

The bottom lane is the part of each position's advantage weight that falls past the buffer end. That part never comes from real rewards: it is the single number $V(s_T)$ standing in for everything after. At 24 steps it averages 55% across the buffer. At 128 it is 15%.

Here is the crack. By the arithmetic, 24 steps did not cut much credit off the advantage. Something else about the short buffer was hurting.

::: field
**Count the rollout in seconds of the slowest consequence, not in steps.** 128 steps is 1.28 s on the wheeled-leg robot at 100 Hz; 24 steps was 0.24 s, shorter than the yaw drift it was supposed to correct. Microduck's recipe also runs 24 steps, but at 50 Hz, so 0.48 s, about one gait cycle, from 4096 robots. I have not run Microduck longer, so I cannot say what 24 costs it. ✅ Put the slowest reward term's time scale next to the rollout length before training. ❌ Do not copy a step count between robots with different control rates.
:::

### The second explanation: how much of each target is a guess

The advantage only looks 20 steps ahead. The value target does not. $\gamma = 0.999$ means the return the critic is fitted to looks about 1000 steps ahead, and the buffer holds only part of that:

$$
\text{target}_t \approx \underbrace{r_t + \gamma r_{t+1} + \dots + \gamma^{T-t-1} r_{T-1}}_{\text{real rewards in the buffer}} \;+\; \gamma^{T-t}\, V(s_T)
$$

::: tip
The real rewards cover the steps up to the buffer end. Everything after that, most of a 1000-step future, is the critic's own number. In the widget this is the dashed $\gamma^k$ curve, still at 0.88 at $k = 128$.
:::

Day 8 already did this count: at 24 steps, 24 real steps and 976 of the critic's guess, about yaw drift it had never learned. At 128 steps most positions have their whole credit window observed, and the critic's targets carry five times more of the actual future.

So there are two explanations for one result: the window did not fit the yaw time scale, and the value targets were mostly bootstrapped. That second one is the mechanism I would bet on, but the repo only has the empirical result, not a clean ablation of it. Nobody has run the experiment that would split them, so it is still open.

The obvious next move is to make the rollout longer still. The ceiling is a trade. At a fixed data budget of 131,072 rows, 256 steps means 512 robots: half the mass and friction draws, half the pushes, half the start states per update. The buffer becomes long and narrow instead of short and wide. At a fixed robot count it means twice as long per iteration and half as many updates per hour. 256 has not been tried here.

::: field
**The rollout-length procedure.** Start at the horizon of the slowest thing in the reward. Check the $(\gamma\lambda)^k$ window against it. Then sweep once: 64 / 128 / 256 at a fixed data budget, three seeds each, and let the gates decide. Every recipe number in this project that survived was found that way, not derived. ⚖️ Before reading the sweep, know how big a swing is pure noise. One fixed policy, fresh robots every iteration:
:::

<random-walk tab="scores" envs="1024"></random-walk>

Every dot there is the same policy, and the band is wide. A setting that moves the curve less than that, on one seed, has not been measured. The deterministic evals at 1000 episodes shrink the noise to about 0.008 in survival, which is why only they settle a sweep.

Rollout length decides what goes into the buffer. It says nothing about how the buffer is chopped up for the gradient, and that turned out to be a second knob with a default just as wrong.

### Minibatches: 320 noisy steps or 160 clean ones

The recipe splits the 131,072 rows into 32 minibatches of 4096 and makes 10 passes over the buffer, so 320 gradient steps per iteration. Halve the minibatch count to 16 and each minibatch holds 8192 rows. Each gradient is averaged over twice as many samples, so its direction is less noisy, and there are half as many of them: 160 per iteration. What stays the same is the data. Every row is still seen exactly ten times.

The obvious instinct is that bigger is better: less noise per step, and Schulman's own advice is "if nothing works, raise the batch size". The robot disagrees at both ends. mjlab's default at 4096 robots and 24 steps gave 24,576-row minibatches and 40 steps per update, and the run stalled at 45-step episodes for 400 iterations. Holding the minibatch at 4096 fixed it. The last crouched-era experiment went the other way, 128 minibatches of 1024 ("mb128"), and the log records it as unstable at 0.52.

$$
\text{gradient steps per iteration} = \text{epochs} \times \frac{\text{rows}}{\text{minibatch size}} = 10 \times \frac{131{,}072}{4096} = 320
$$

::: tip
At a fixed buffer, the minibatch size trades the number of steps against how clean each one is. A bigger minibatch does not make the step smaller: the learning rate sets that. It makes the direction less noisy.
:::

For a [64, 64] network the step count mattered more. And the shuffle is the point: 8000 consecutive steps from a few robots would all say the same thing; 8000 random rows from 1024 robots cancel each other's quirks.

::: field
**The minibatch window is roughly 2k–8k rows for this policy.** 4096 sits in it. ❌ 24,576 stalled (40 steps per update). ❌ 1024 was unstable. ✅ Hold the minibatch size fixed when you change the robot count or the rollout length, because the default count of minibatches silently changes the size. The overfitting worry points at the ten epochs, not the minibatch size, and that is what the clip is guarding. Schulman's "raise the batch size" is about the rollout batch, the data per update, not the minibatch.
:::

So with 128 steps and 4096-row minibatches the run climbs to its plateau in a few thousand iterations. The obvious way to get a better policy from there is to keep training.

### Training longer does not smooth the policy

sk_lean5_s2 took sk_lean3's recipe and ran it for 10,000 iterations instead of 5000: 7 h 46 min, no kill rule fired. From 5000 to the end, reward per step stayed between 0.97 and 1.00. Six checkpoints from 5000 to 9999 scored 0.929 to 0.955 in survival. The standard error at 1000 episodes is about 0.008, so those six are samples of one policy. sk_lean4c, a wider per-wheel run, was flat from 5000 to 18,500.

So the policy is not getting better. Is it at least settling? Take the actor weights at checkpoints 100 iterations apart over the last 40% of each run, and compare two lengths: the sum of the 100-iteration steps, and the distance from the first checkpoint to the last.

$$
\frac{\lVert w_n - w_0 \rVert}{\sum_{i=1}^{n} \lVert w_i - w_{i-1} \rVert} \;\approx\; \frac{1}{\sqrt{n}} \quad \text{for } n \text{ independent steps of equal size}
$$

::: tip
A walk with a direction ends up about as far away as it walked: the ratio is near 1. A walk with no direction ends up about $\sqrt{n}$ steps from where it started after $n$ steps, so the ratio falls as $1/\sqrt{n}$.
:::

| Run | Schedule | Net / summed steps | $1/\sqrt{n}$ |
|---|---|---|---|
| sk_push | fixed 5e-4 | 0.24 | 0.22 |
| sk_jerk2 | fixed 5e-4 | 0.23 | 0.22 |
| sk_lean2 | adaptive | 0.25 | 0.22 |
| sk_lean3 | adaptive | 0.21 | 0.22 |
| sk_lean5_s2 | adaptive | 0.18 | 0.16 |
| sk_lean4c (128×128) | adaptive | 0.12 | 0.11 |

All six match. After the plateau the weights wander with no direction. Try it: the walk below takes $n$ equal steps in random directions through 6404 dimensions, the size of the [64, 64] actor, and draws two of them.

<random-walk tab="weights" n="20"></random-walk>

Longer training only smooths a policy if the step size shrinks towards the end. A fixed 5e-4 never shrinks. A longer run is a longer walk. Switch the widget to "decay to 0" and the last checkpoints bunch up; that fix has not been tried on the robot. The schedule we actually used was adaptive, and that one should, in principle, slow down by itself.

### Adaptive KL keeps pushing the learning rate up

Since sk_lean2, the runs used rsl_rl's adaptive schedule with a KL target of 0.01. It adjusts after every minibatch, so 320 times per iteration: multiply the LR by 1.5 when KL is under 0.005, divide by 1.5 when it is over 0.02, clamp between 1e-5 and 1e-2. The logged value is the last of the 320.

The obvious reading is that this anneals for free: when the policy is near done, updates get small, and the LR would follow. It does the opposite. The rule holds the policy change per update constant. When the learning signal fades, a step at the old LR moves the policy less, KL drops under 0.005, and the rule raises the LR to keep it moving. sk_lean3's median LR in the second half was 6.7e-3, and it sat at the 1e-2 ceiling 13% of the time.

$$
\text{LR} \leftarrow \begin{cases} 1.5\,\text{LR} & \widehat{KL} < 0.005 \\ \text{LR} / 1.5 & \widehat{KL} > 0.02 \end{cases} \qquad 10^{-5} \le \text{LR} \le 10^{-2}
$$

::: tip
The schedule fixes the size of each step in distribution space, not in weight space. It can never let the step go to zero, because a step of zero is a KL of zero, and that is exactly when it pushes hardest.
:::

So I blamed the adaptive LR for the bad long runs. That claim was dropped. The adaptive 64×64 runs use 2.6 to 13 times the old learning rate and still move the weights no further per 100 iterations than the fixed runs: 0.085 to 0.100 against 0.119 and 0.126. The KL target caps each update. Both schedules walk; neither converges.

::: field
**Read the LR curve as a KL thermostat.** On Microduck, also adaptive with `desired_kl = 0.01`, the LR spikes when updates were too small and drops when they were too large. It typically drops at curriculum boundaries, because the reward landscape changed. An LR that crashes towards zero and stays there means every update overshoots, usually from reward cliffs made by tight Gaussian σ's. ⚖️ On the wheeled-leg robot, an LR riding the ceiling late in a run means the signal has faded, not that the run is healthy. ⚖️ Annealing the step over the last third of a run (decay the KL target or the LR ceiling) is the obvious fix, and it is untested.
:::

If the step never shrinks, every late checkpoint is a different point on the walk, and that has a cost we can measure. Checkpoints 100 to 500 iterations apart differ by 6° of wobble and 0.3 of yaw-rate RMSE. Any comparison between two runs that rests on one checkpoint from each is unreliable.

::: field
**Checkpoint scatter is the noise floor for every comparison between runs.** ❌ The wider net: 128×128 runs matched 64×64 on every gate, and the one wobble gain credited to width (13.5° to 9.2° at 30 ms) sits inside checkpoint scatter. The commit that widened the net also changed the action, so no run separates the two. ❌ A 4-episode wobble probe made sk_lean5 model_9500 look like proof that longer training smooths the policy; at 12 episodes per cell it was scatter. ⚖️ The mixer action (one balance channel, one heading channel) beats per-wheel commands on the bench. In simulation, per-wheel at 18,500 iterations scores as well as any mixer checkpoint. The per-wheel policy had re-learned the mixer anyway (left and right correlated at 0.86), but with 56% of its differential energy above 5 Hz.
:::

So the late checkpoints of one run are scattered points around wherever the walk is centred. You might ask: if they are noise around a centre, why not take the centre?

### Averaging 21 checkpoints

Take the 21 snapshots model_3000, model_3100, … model_4900 plus model_4999 from sk_lean3. For each of the 6404 actor weights, compute the mean across the 21 files. The result has the same shape and loads like any checkpoint. No training, no data:

```python
avg = {k: torch.stack([ckpt[k] for ckpt in checkpoints]).mean(0) for k in keys}
```

::: tip
Polyak averaging, or SWA: if the weights wander around the middle of a basin, their mean sits nearer the middle than any single one of them.
:::

It is not guaranteed to work. Averaging two unrelated networks usually gives garbage: two networks can compute the same function with their hidden units in a different order, so averaging blends neuron 5 of one with an unrelated neuron of the other. It can work here because late snapshots of one run share an ancestor and sit in the same basin, so each hidden unit does the same job in all of them. The members sit 0.16 of the weight norm from the 21-checkpoint average.

In simulation it worked very well:

| sk_lean3 | Members | Average of 6 | Average of 21 |
|---|---|---|---|
| Shove survival | 0.927–0.938 | 0.961 | 0.953 |
| Shove yaw-rate RMSE | 0.70–0.97 | 0.75 | 0.41 |
| Mean wobble at 40–45 ms (°) | 15.3–24.1 | 18.9 | 10.4 |

Half the wobble and half the yaw rate, on mjlab, Newton and PyBullet. The averaged policy also passed the latch probe at 0.69 V. Wide windows beat narrow ones in both runs averaged. It was the calmest policy measured.

On the bench it lost to model_4500, a single checkpoint that was unremarkable in simulation: 19.2° of wobble, in the middle of its own run's scatter.

::: field
**✅ Average late checkpoints of one converged run; ❌ never across runs.** Put the average through every gate and the latch probe, because it is a set of weights training never visited. ⚖️ The simulated wobble probe missed in both directions: it rated sk_lean5 model_5500 calm (it wobbles badly on the robot) and the average calmest of all (it lost to model_4500). One untested explanation fits both misses: policies that look calm in simulation make small corrections near upright, and on hardware small corrections can disappear into backlash, stiction, compliance and delay jitter, which a twitchier policy punches through. The probe's 4× friction rows are the nearest existing test and have not been run on these policies. The whole record is in [The Wobble Chase](../assets/embeds/the-wobble-chase.html).
:::

We got through a lot, so let me regroup. The 24-step default failed to teach yaw, and the $(\gamma\lambda)^k$ window alone does not explain why; the bootstrapped value targets probably do, but nobody has ablated it. The minibatch has a window, 2k–8k rows, and both mjlab's default and the opposite extreme fell outside it. Training longer is a random walk under both schedules, because neither shrinks the step, and the adaptive one even raises the LR when the signal fades. That makes single checkpoints unreliable, and averaging them gives the calmest policy in simulation, which then lost on the bench. The knobs did their job: PPO now optimises faster and more steadily. What it optimises was never in question on this page.

## Pitfalls

- **Copying a rollout length between robots (beat 1).** 24 steps is 0.48 s on Microduck and 0.24 s on the wheeled-leg robot. The symptom is a term that never improves while the others do: balance learned, yaw RMSE stuck at 0.3–0.7.
- **Reading $\lambda$ as the whole credit story (beat 2).** The advantage weight is below 0.1 by $k = 45$; the value target looks about 1000 steps ahead. Checking only $(\gamma\lambda)^k$ will say a short rollout is fine when the critic is mostly fitting its own guesses.
- **Changing the robot count and letting the minibatch follow (beat 3).** The default is a number of minibatches, not a size. 4096 robots × 24 steps silently made 24,576-row minibatches, and the curve sat flat at 45-step episodes for 400 iterations with nothing in the logs saying why.
- **Comparing runs by one checkpoint each (beat 5).** Checkpoints 100–500 iterations apart differ by 6° of wobble. If the difference you are celebrating is smaller than that, you measured the walk, not the change.
- **Trusting the averaged policy because the simulator loves it (beat 6).** It halved simulated wobble and lost on the bench. An average is a new policy: gate it, and then put it on the robot.

<!-- quiz -->

## Next

You might ask, optimises what? The knobs make PPO optimise faster and more steadily, but it optimises whatever the reward says. On Jumper a motionless robot already scored 52% of the walking reward. Is the reward asking for the behaviour we want? That is [Day 12](../day12/).

## Sources

- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), "Tuning experiences": "How long should the rollout be", "Minibatches", "Training longer does not smooth the policy by itself", "Checkpoint averaging", and the noise-floor paragraph of "The wobble".
- `artifacts/the-wobble-chase.html` (copied here as [The Wobble Chase](../assets/embeds/the-wobble-chase.html)): the claims board, the run lineage, sk_lean5_s2's checkpoints, the learning-rate table with net displacement against $1/\sqrt{n}$, the adaptive rule, the averaging table, the bench verdicts, the mixer reasons and the wrong turns.
- `artifacts/wlbot-learning-log-aug-30.html` (and the earlier `wlbot-learning-log-aug-28.html`), Session 2: "the critic stands in for the future we did not observe", 24 of 1000 steps observed, the 128 → 256 trade at a fixed data budget, the minibatch trade, and "How long should the rollout be".
- `notes/microduck-takeaways.md` ([Notion](https://app.notion.com/p/3dc67249ddbf80a9a46bfe303aab4f37)): Microduck's PPO settings (4096 × 24 at 50 Hz, 4 minibatches, 5 epochs, adaptive with `desired_kl = 0.01`) and the "learning rate dance".
- `notes/deep-rl-hacks-schulman.md` ([Notion](https://app.notion.com/p/3e467249ddbf81039772e3df5492078f)): sweep sensitivity, "know your noise", "if nothing works, raise the batch size"; from J. Schulman, "The Nuts and Bolts of Deep RL Research", Deep RL Bootcamp, 2017. Write-up: [github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks).
- `artifacts/jumper-field-guide.html`: the motionless robot scoring 52% of the walking reward.
- M. Andrychowicz et al., "What Matters in On-Policy Reinforcement Learning? A Large-Scale Empirical Study", ICLR 2021 ([arXiv:2006.05990](https://arxiv.org/abs/2006.05990)).
- P. Izmailov, D. Podoprikhin, T. Garipov, D. Vetrov and A. G. Wilson, "Averaging Weights Leads to Wider Optima and Better Generalization" (SWA), UAI 2018; B. Polyak and A. Juditsky, "Acceleration of Stochastic Approximation by Averaging", 1992.
