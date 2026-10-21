---
day: 8
minutes: 50
widgets: [gae-stepper]
quiz:
  - kind: why
    q: "In actor-critic, the one-step TD error $\\delta_t = r_t + \\gamma V(s_{t+1}) - V(s_t)$ is already an advantage estimate, and a low-variance one. Why not train the policy on it alone?"
    choices:
      - "Computing $\\delta_t$ needs the whole episode, which the rollout buffer does not have."
      - "It uses one real reward and hands the rest to the critic, so the critic's errors go straight in."
      - "$\\delta_t$ ignores the reward and only compares two outputs of the critic."
      - "It is too slow: it needs a separate network call for every step of the update."
    answer: 1
    explain: "$\\delta_t$ is low variance because it contains only one random reward, but everything past that reward is the critic's guess, and the critic is a network we know is wrong. A critic that is wrong in a consistent way gives a consistently wrong advantage, and no amount of data averages that out. That is bias. (Beat 2: one step, or all the way to the end.)"
  - kind: why
    q: "The other extreme is $\\hat A_t = G_t - V(s_t)$: sum every real reward to the end of the rollout, and use the critic only as the baseline. Its bias is small. Why is it not the default either?"
    choices:
      - "$G_t$ is one sampled future: the noise of every later step lands in it, so variance is high."
      - "It needs the critic at every step of the rollout, which is too expensive to run."
      - "It is biased towards the start of the rollout, where more rewards are summed."
      - "It cannot be computed when an episode ends with a fall inside the rollout."
    answer: 0
    explain: "Every term in $G_t$ is real, so the critic's mistakes mostly stop mattering, but it is one hand of solitaire: the exploration noise, pushes and randomised physics of every later step all land in it. Two runs from the same state give two different $G$'s. One step trusts the critic too much; this end trusts the noise too much. (Beat 2: one step, or all the way to the end.)"
  - kind: why
    q: "PPO code normalises the advantages in each batch to zero mean and unit spread, but leaves the critic's regression targets (the returns) in raw reward units. Why not normalise both?"
    choices:
      - "Returns are always positive, so normalising them would flip the sign of half of them."
      - "Normalising the returns as well would make the advantage estimates biased."
      - "The critic's loss is computed before the advantages, so the order rules it out."
      - "The policy only needs a relative signal; the critic must predict real values to bootstrap from."
    answer: 3
    explain: "The policy wants \"better or worse than usual, and by how much relative to this batch\", which normalised advantages give it. The critic's output is used next iteration to finish the returns at the end of every buffer, so it has to stay in reward units. Normalise the returns and the critic learns a number whose scale changes every batch. (Beat 4: training the critic, compute_returns line by line.)"
  - kind: whatif
    q: "A GAE backward loop multiplies both the bootstrap term and the recursion by `not_done`, which is 0 at a fall. You delete it. A robot falls at step 50 and is reset, upright, at step 51. What goes wrong?"
    choices:
      - "Nothing: the fall's reward is still in the buffer, so the advantage still sees it."
      - "The loop crashes, because `values[51]` belongs to a different episode."
      - "Step 50 bootstraps from the reset robot, and the next episode's rewards leak back into earlier steps."
      - "Only the critic's targets change; the policy's advantages stay the same."
    answer: 2
    explain: "`not_done` zeroes both the bootstrap and the recursion at a fall, so the sum stops where the episode stopped. Without it, $\\delta_{50}$ adds $\\gamma V(s_{51})$, the value of a freshly reset upright robot, and the running advantage carries the new episode back across the boundary. The actions that led into the fall can then look fine or even good. (Beat 4: training the critic, compute_returns line by line.)"
  - kind: whatif
    q: "Every step the robot stays upright earns +1, and an episode ends at a fall or at a time limit. A loop cuts both with the same done flag and never adds $\\gamma V(s)$ for the state where the time limit hit. What happens to the last steps before every time limit?"
    choices:
      - "They are told the future is worth nothing, so an upright robot gets negative advantages."
      - "Nothing much: time limits are rare enough that the error averages out over a batch."
      - "Their advantages come out too high, because the critic's value is counted twice there."
      - "The loop crashes, because the stored next observation already belongs to the reset."
    answer: 0
    explain: "A time limit cuts off a future that was real: the robot was still up. Treat it as a fall and the steps before it look as if they led to the end. rsl_rl folds $\\gamma V(s)$ of the timed-out state into its reward before the loop runs, then cuts it like a fall. On a small toy buffer, leaving that out drops the advantage at the timeout step from 0.22 to $-6.80$. (Beat 4: training the critic, compute_returns line by line.)"
  - kind: whatif
    q: "GAE computes $\\hat A_t = \\sum_k (\\gamma\\lambda)^k \\delta_{t+k}$. You set $\\lambda = 0$. What do the advantages become, and what is the risk?"
    choices:
      - "The full Monte Carlo return minus $V$; the risk is high variance."
      - "All zero, because every $\\delta$ is multiplied by 0."
      - "The same as before, since $\\gamma$ still discounts the future."
      - "Just $\\delta_t$; whatever the critic gets wrong goes straight in."
    answer: 3
    explain: "At $\\lambda = 0$ only the $k = 0$ term survives, so $\\hat A_t = \\delta_t$: one real reward, then the critic's word for everything after. Low variance, but a critic that is systematically wrong makes every advantage wrong the same way. $\\lambda = 1$ is the other end, $G_t - V(s_t)$. (Beat 3: GAE, λ as a vote of confidence.)"
  - kind: numbers
    q: "With $\\gamma = 0.999$ and $\\lambda = 0.95$, what weight does $\\delta_{t+24}$ get in the GAE advantage $\\hat A_t = \\sum_k (\\gamma\\lambda)^k \\delta_{t+k}$, and around which $k$ has the weight fallen to 0.001?"
    choices:
      - "0.95, and $k = 24$."
      - "About 0.3, and $k \\approx 128$."
      - "About 0.98, and $k \\approx 1000$."
      - "About 0.03, and $k \\approx 60$."
    answer: 1
    explain: "$\\gamma\\lambda = 0.999 \\times 0.95 \\approx 0.949$. Then $0.949^{24} = e^{24 \\ln 0.949} \\approx e^{-1.26} \\approx 0.29$, and $0.949^{128} \\approx e^{-6.7} \\approx 0.001$. So the advantage at any step is mostly decided within a couple of dozen steps, and a 128-step rollout holds almost the whole credit window. (Beat 3: GAE, λ as a vote of confidence.)"
  - kind: numbers
    q: "$\\gamma = 0.9$ and $\\lambda = 0.5$. The TD errors are $\\delta_t = 1$, $\\delta_{t+1} = 2$ and $\\delta_{t+2} = -4$, and the episode ends with a fall right after step $t+2$. What is the GAE advantage $\\hat A_t$?"
    choices:
      - "$-1.00$: the plain sum of the three errors."
      - "$+1.00$: only $\\delta_t$ counts."
      - "$+1.09$, with weights 1, 0.45 and 0.2025."
      - "$-0.44$, with weights 1, 0.9 and 0.81."
    answer: 2
    explain: "$\\gamma\\lambda = 0.45$, so $\\hat A_t = 1 + 0.45 \\times 2 + 0.45^2 \\times (-4) = 1 + 0.9 - 0.81 = 1.09$. The fall stops the sum, so nothing after $t+2$ enters. Discounting by $\\gamma$ alone gives $-0.44$, which trusts the far errors more than $\\lambda$ allows. (Beat 3: GAE, λ as a vote of confidence.)"
---

**Goal:** build the advantage estimator PPO actually uses, line by line, and say exactly what the rollout buffer holds when the update starts.

## Where we left off

Day 7 ended on an awkward admission: the critic is a network too, so it is wrong as well. We lean on it twice in every step, once to stand in for the future past the end of the buffer and once as the baseline we subtract, so the question is how much to trust a judge we know is wrong.

People asked this long before there were neural critics. In 1988 Richard Sutton showed that a prediction can learn from the next prediction instead of waiting for the final outcome. He called it temporal-difference learning, and his paper already had a knob, $\lambda$, for how far to look ahead before trusting the guess. In 2015 John Schulman and colleagues at Berkeley were training simulated robots to walk and run with policy gradients, and the noise in their gradient estimates was what made it so hungry for data. Their paper on Generalized Advantage Estimation (published at ICLR in 2016) took Sutton's $\lambda$ and put it inside the advantage.

Before that knob, the choice was the obvious one, and it had only two options: trust the guess after one step, or ignore it and wait for the real outcome.

## The picture

Back to the football coach from Day 1. After every pass he tells you how the match is going: "from here, we win by two". A player has two obvious ways to use him.

Take his word after every touch. You hear right away whether your pass helped. But if he is a bad judge you learn his mistakes, and nothing you do will ever correct them. Or ignore him until the final whistle. The score is real, but it is one match, decided by eighty other touches, a lucky deflection and the rain, so it says very little about your pass.

The first is quick and wrong in a consistent way. The second is honest and noisy. A sensible player does neither: they trust the scoreboard for what they actually saw happen in the next few touches, and the coach for the rest. That leaves two questions the analogy cannot answer. How do we even measure how wrong the coach is? And how many touches is "a few"?

## Step by step

### The critic checks itself one step later

Day 7 gave us the advantage, $A = G - V(s_t)$, where $G$ is the real rewards up to the end of the buffer plus the critic's $V(s_{128})$ for everything after. The critic itself has an awkward problem: nobody ever hands it the true value to compare against. The true $V(s_t)$ is the average return over every future that could follow $s_t$, and we have one of them.

The obvious fix is to wait for that one future and compare against it. That is Monte Carlo from Day 3: slow, and one sample.

But one step after $s_t$ the critic has learned something. It has seen one real reward, and it has a fresh guess for the state it landed in. So compare the two guesses. This is the TD error from Day 3, back again:

$$
\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)
$$

::: tip
What I got, plus what the critic says the next state is worth, minus what it said this state was worth. $r_t + \gamma V(s_{t+1})$ is the TD target. It is a better estimate than $V(s_t)$ because one of its terms is a real reward. (Indexing from here on follows the code: $r_t$ is the reward stored in row $t$ of the buffer, the one Day 1 called $R_{t+1}$.)
:::

Let us take a moment to appreciate the recursion. $V(s_{t+1})$ is a guess too, but it is a guess made one real step closer to the truth, so the difference between the two is an error we can learn from. With a perfect critic, $\delta_t$ averages to zero. If it does not, the critic is wrong, and $\delta_t$ tells us by how much, one step at a time.

A small note: this estimate is biased but low variance. Only one random reward is in it, which keeps it quiet. Everything after that one reward is the critic's word, which is where the bias comes from.

And $\delta_t$ is already an advantage estimate in its own right: "did this step go better than the critic expected?" It looks one reward ahead and hands the rest of the future to a judge we just agreed is wrong. Is that a good deal?

### One step, or all the way to the end

Line up the two obvious answers.

**One step.** $\hat A_t = \delta_t$. One real reward, then the critic. If the critic undervalues an upright robot, every advantage built this way inherits that mistake, and since the critic's mistakes are systematic, more data does not average them away. That is bias.

**All the way.** Add up every real reward to the end of the buffer and only then call the critic, $\hat A_t = G_t - V(s_t)$. Every term is real, so the critic's mistakes mostly stop mattering. But this is one future: the exploration noise, the random pushes and the randomised mass and friction all land in $G_t$. Two runs from the same state give two different $G$'s. That is variance.

This end has an origin story. Ulam was recovering from an illness and playing solitaire, and he wanted the probability of winning a particular layout. Counting every combination was hopeless; dealing out a hundred games, counting the wins and averaging was easy. Because it relies on repeated random trials, like the tables in a casino, the method got the code name "Monte Carlo". A Monte Carlo return is the same idea: do not compute the value of a state, play it out and average. Basically TLDR: whack more to find out more. The catch is the "more": one rollout is one hand of solitaire.

In between sit all the $n$-step versions: take $n$ real rewards, then hand the rest to the critic.

$$
\hat A_t^{(n)} = r_t + \gamma r_{t+1} + \dots + \gamma^{n-1} r_{t+n-1} + \gamma^n V(s_{t+n}) - V(s_t)
$$

::: tip
$n = 1$ is $\delta_t$, the critic almost everywhere. $n = \infty$ is $G_t - V(s_t)$, the critic only as a baseline. Small $n$ means bias, large $n$ means variance.
:::

::: field
**Leaning on the critic too early has a cost I can point to.** With 24-step rollouts on the wheeled-leg robot, only 24 of the roughly 1000 steps the return depends on were ever observed, and the other 976 were the critic's guess. The critic was guessing yaw drift it had never learned, so yaw never got learned. Going to 128 steps took yaw RMSE from 0.3–0.7 down to 0.11–0.27 on the same data budget. ⚖️ That is the empirical result; which mechanism caused it was never isolated with a clean ablation. Day 11 picks this up.
:::

So pick an $n$. But any $n$ is the hard cut from Day 1 again: the rewards before step $n$ count in full, everything after it goes to the critic wholesale, and $n$ is a number we pulled out of the air.

### GAE: λ as a vote of confidence

Day 1 got rid of the hard cut by shrinking smoothly instead of cutting. The same move works here. Instead of picking one $n$, average all of them, giving each longer estimate a little less weight than the one before. Schulman et al. show that this average collapses into something much simpler: a discounted sum of the TD errors.

$$
\hat A_t = \sum_{k=0}^{\infty} (\gamma\lambda)^k \, \delta_{t+k} = \delta_t + \gamma\lambda \, \hat A_{t+1}
$$

::: tip
Each step's advantage is its own surprise, $\delta_t$, plus a decayed share of the next step's advantage. $\gamma$ is the same discount as before. $\lambda$ is new: a vote of confidence in the future advantages. At $\lambda = 0$ only $\delta_t$ is left and the critic answers for everything after one step. At $\lambda = 1$ we get the full Monte Carlo version (the next beat shows why).
:::

| | Name | What it sets | Low | High |
|---|---|---|---|---|
| `gamma` | discount factor | how far ahead the task cares | short-sighted agent | long-term agent |
| `gae_lambda` | GAE parameter | the mix of TD and Monte Carlo | 1-step TD: low variance, high bias | Monte Carlo: high variance, no bias |

These RL people really love such techniques: when one estimate is too noisy and the other is too trusting, discount between them.

When I first read about `gae_lambda` I thought it was a fixed split, 95 % real reward and 5 % critic. It is powers. The weight $(\gamma\lambda)^k$ depends on the distance $k$ from the step being scored, not on where that step sits in the buffer. Scoring step 10, the $\delta$ at step 11 counts with weight $\gamma\lambda$, the one at step 30 with $(\gamma\lambda)^{20}$. Every step sees the same shape: nearby rewards trusted, distant ones handed to the critic.

::: field
**The robot's credit window is $(\gamma\lambda)^k = 0.949^k$.** With $\gamma = 0.999$ and $\lambda = 0.95$ the weight falls to 0.3 by $k = 24$ and to 0.001 by $k = 128$. So the advantage at any step is mostly decided by the next 20 or so steps, and a 128-step rollout holds nearly the whole window. Standard for `gae_lambda` is 0.95. Don't ask, I don't know how. Nobody in this project has moved it; $\gamma$ and the rollout length did all the damage. ✅ Leave it at 0.95. Check the window against the rollout length instead (Day 11).
:::

Look at what every term in that sum is made of, though: $V(s_t)$, $V(s_{t+1})$, $V(s_{t+2})$, all the way down. The advantage is now a careful blend of real rewards and critic guesses, but the critic is still the untrained network we started with. What do we train it towards?

### Training the critic: compute_returns line by line

Let us settle how we would train the critic. Code adapted from rsl_rl, which is what the wheeled-leg robot trains with:

```python
advantage = 0
for step in reversed(range(128)):                       # 127 → 0
    next_values = last_values if step == 127 else values[step + 1]
    not_done    = 1.0 - dones[step]
    delta       = rewards[step] + not_done * γ * next_values - values[step]   # TD error
    advantage   = delta + not_done * γ * λ * advantage                        # GAE recursion
    returns[step] = advantage + values[step]                                  # critic target
advantages = returns - values                            # then normalised
```

The `delta` line is beat 1. The `advantage` line is beat 3's recursion. It runs backwards only because each step's advantage needs the next step's: it is a running sum, so you start from the end. The new line is `returns`, and it is the critic's target. Why should "advantage plus value" be anything the critic wants?

Write the sum out with $\lambda = 1$ and watch it telescope:

$$
\begin{aligned}
\delta_t &= r_t + \gamma V(s_{t+1}) - V(s_t) \\
\gamma\,\delta_{t+1} &= \gamma r_{t+1} + \gamma^2 V(s_{t+2}) - \gamma V(s_{t+1}) \\
\gamma^2 \delta_{t+2} &= \gamma^2 r_{t+2} + \gamma^3 V(s_{t+3}) - \gamma^2 V(s_{t+2}) \\
&\;\;\vdots \\
\textstyle\sum &= \underbrace{r_t + \gamma r_{t+1} + \dots + \gamma^{n} V(s_{\text{end}})}_{G_{\text{boot}}} - V(s_t)
\end{aligned}
$$

::: tip
Every intermediate $V$ cancels against the line below it. What is left is the discounted real rewards plus the critic's guess at the tail (the bootstrap), minus the critic's guess at the start (the baseline). With $\lambda < 1$ the later $\delta$'s are shrunk, so they no longer cancel fully and more of the intermediate $V$'s stay in: the "trust the critic more" end of the dial.
:::

So $\hat A_t \approx G_{\text{boot}} - V(s_t)$, and adding $V(s_t)$ back gives the return the critic should have predicted, for free, out of a loop we were running anyway. At $\lambda = 1$ that target is the bootstrapped Monte Carlo return. At $\lambda = 0$ it is $r_t + \gamma V(s_{t+1})$, the one-step TD target. At 0.95 it is the blend, which Sutton called TD($\lambda$). The critic then regresses onto it:

$$
L_V = \big(V(s_t) - \text{returns}_t\big)^2
$$

::: tip
The critic is trained by plain regression onto a target that is mostly real rewards and partly its own earlier opinion. On the robot this loss is weighted by `vf_coef = 0.25` inside the one combined loss.
:::

Two details in the loop decide whether it is right or quietly wrong.

- **`not_done` cuts at a fall.** It zeroes both the bootstrap and the recursion, so nothing leaks across an episode boundary. A robot that falls at step 50 is reset at step 51, and the upright robot at 51 has nothing to do with the decisions before the fall. This is Day 7's rule in code: the critic fills in at the end of the buffer and at timeouts, never after a fall.
- **A timeout is bootstrapped before the loop runs.** Day 1's `truncated` comes back here. rsl_rl adds $\gamma V(s)$ into the reward at every timeout step, using the value of the state the robot timed out in, because the real next observation has already been replaced by the reset one. The step is then cut like a fall, but the future the cut threw away has been put back as one number.

Step through it on a six-step toy buffer. $\gamma$ is 0.9 here so the weights visibly shrink in six steps; the robot's 0.999 would make them look flat. Try the fall, then turn off the mask.

<gae-stepper lambda="0.95" gamma="0.9"></gae-stepper>

::: field
**Normalise the advantages, never the returns.** The last line normalises `advantages` only. `returns` stays in raw units, which is why the robot's critic outputs sit in the 0–1000 range (a perfect balancer is worth about $\sum 0.999^k \approx 1000$) while the policy sees advantages of order 1. The policy only needs to know better or worse than usual, and by how much relative to the batch; the critic needs the actual number.
:::

When I first read this loop I asked: "the new values are updated, so all is good; the critic just needs to look up?" Half of that is right. The loop does only look values up. But which critic wrote them, and when does the critic actually change?

### Three phases: collect, arithmetic, update

The critic changes in only one of the three phases, and it is the last one.

1. **Collect (forward, steps 0 → 127).** At every step the critic is called on the observation and its prediction is stored, `values[step]` $= V(s_t)$, next to the reward, the done flag, the action and its log-probability. After step 127 it is called once more on the final observation to get `last_values`. All of these come from the old critic, the weights that existed before this iteration's update.
2. **Backward pass (127 → 0).** Pure arithmetic over the stored arrays. No network is called and nothing is updated. It reads `values[step + 1]` and `values[step]` from the buffer, computes $\delta$, accumulates the advantage, and writes `returns[step]`. That is the "look up": the critic's whole contribution to this pass is the numbers it wrote during collection.
3. **Update (320 gradient steps).** The buffer is $1024 \times 128 = 131\,072$ rows, cut into 32 shuffled minibatches of 4096 and passed over 10 times. Now the critic changes: its loss is $(V_{\text{new}}(s_t) - \text{returns}_t)^2$, with the returns fixed by the backward pass and held for all 10 epochs. The stored values are not refreshed between epochs either. They stay the old critic's predictions.

Next iteration the updated critic writes new values, the backward pass makes new targets, and the critic chases them. That is the bootstrap loop. The regression target is never "sum the rewards until the robot falls". It is the window's real rewards plus the critic's own guess at the window's end, and consistency with itself, one iteration at a time, is what eventually makes the critic right about a 1000-step episode it never sees whole.

::: field
**The critic is slow early, and it has its own curves.** Because it learns by agreeing with itself, it starts out confidently wrong, and the advantages built on it in the first iterations are noisy. `value_loss` and `explained_variance` are the critic's curves; the reward curve is the policy's. Day 10 reads them.
:::

The critic is not the only network that moves in phase 3, though. The policy takes those same 320 steps.

We got sidetracked a bit here, so let me regroup. We were talking about $G$ and its two problems from Day 7: the buffer cannot hold the whole future, and $G$ is one noisy sample. A critic fixed both, and today we faced the fact that the critic is an estimate too. The TD error measures how wrong it is one step at a time. One step trusts it too much and a whole rollout trusts the noise too much, so GAE blends them with $\lambda$. And one backward loop produces both the advantages the policy trains on and the returns the critic trains on.

That also settles what the buffer holds. Per step, per robot, rsl_rl stores:

- the observation (the 36-vector)
- the action taken: the sampled one, noise included, not the mean
- the log-probability the policy gave that action at the time (the "old opinion")
- the mean and std the policy output
- the reward and the done flag
- the critic's value estimate

The backward pass adds two computed columns, the advantage and the return. A minibatch is a random set of rows from that table, and each row carries everything the update needs. The table is emptied and rebuilt from scratch every iteration, not topped up: collect 128 fresh steps from every robot, run all the epochs, throw the whole thing away. The robots are not reset when it is thrown away, so the next buffer picks up wherever each robot is, mid-episode for most of them. That is what on-policy means in practice: the only data ever in the buffer was produced by the current version of the policy.

And there is only one policy: one set of weights, edited in place. We never copy it anywhere. The buffer just remembers what the policy thought at the time it acted, and that memory starts going stale with the first gradient step.

## Pitfalls

- **Dropping `not_done` (beat 4).** Nothing crashes. The advantages just carry the next episode's rewards back across every fall, and the steps leading into a fall can look good because the reset robot is upright. On a small toy buffer, step 2's advantage goes from $-5.55$ to $+4.06$. I would expect the policy to learn to avoid falls much more slowly, but I have not measured that.
- **A timeout treated as a fall (beat 4, and Day 1).** If the timeout step is cut without the $\gamma V(s)$ folded into its reward, the last steps before every timeout are told the future is worth nothing. On the same toy buffer, the advantage at the timeout step drops from 0.22 to $-6.80$, and the robot is perfectly upright there.
- **Normalising the returns along with the advantages (beat 4).** The policy wants a relative signal, the critic wants the real value. Normalise `returns` and the critic learns a number that changes scale every iteration, so its bootstrap at the end of the next buffer is in the wrong units.
- **Reading λ as a fixed split (beat 3).** $\lambda = 0.95$ is not "95 % reward, 5 % critic". It is a decay with distance, so whether the rollout is long enough depends on where $(\gamma\lambda)^k$ has died out, not on $\lambda$ alone.
- **A rollout shorter than the credit window (beats 2 and 3).** If $(\gamma\lambda)^k$ is still large at the end of the buffer, most steps lean on the critic's bootstrap, and anything the critic has not learned yet cannot be learned through it. That was the 24-step yaw failure.

<!-- quiz -->

## Next

You might ask, which policy is the buffer actually about? It was written by the policy as it was at collection time, but there is only one policy, edited in place, and phase 3 takes 320 gradient steps on it. The stored log-probabilities and advantages describe weights that stop existing after the first of those steps. With only one running policy, how do we update? After the first gradient step the weights no longer match the data that is in the buffer, and that is [Day 9](../day09/).

## Sources

- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), "Temporal difference: the critic is an estimate too", "Generalized Advantage Estimation", "Training the critic", "Recap, and what the buffer actually holds", and "How long should the rollout be": the TD target as "a better estimate", λ as a vote of confidence, Ulam's solitaire, "whack more to find out more", "Don't ask, I don't know how", the rsl_rl loop and its three phases, the buffer's per-row contents and "there is only one policy".
- `artifacts/wlbot-learning-log-aug-30.html`, Sessions 2 and 3b: `compute_returns` and the telescoping proof, `not_done` masking and timeout bootstrapping, advantage-only normalisation, the three phases, "λ is recursive, not a fixed 95/5 split", the 24-step critic failure, $0.949^k$, 32 × 4096 minibatches, 10 epochs, `vf_coef = 0.25`.
- R. Sutton, "Learning to Predict by the Methods of Temporal Differences", *Machine Learning*, 1988.
- J. Schulman, P. Moritz, S. Levine, M. Jordan, P. Abbeel, "High-Dimensional Continuous Control Using Generalized Advantage Estimation", ICLR 2016 ([arXiv:1506.02438](https://arxiv.org/abs/1506.02438)).
- N. Metropolis, "The Beginning of the Monte Carlo Method", *Los Alamos Science*, special issue, 1987 (Ulam's solitaire).
- R. Sutton and A. Barto, *Reinforcement Learning: An Introduction*, 2nd ed., 2018, chapters 6, 7 and 12 (TD, $n$-step returns, TD($\lambda$)).
- [rsl_rl](https://github.com/leggedrobotics/rsl_rl) (`RolloutStorage.compute_returns`, timeout bootstrapping in `PPO.process_env_step`) and [CleanRL](https://github.com/vwxyzjn/cleanrl) `ppo.py`.
