---
day: 7
minutes: 50
widgets: [buffer-slicer]
quiz:
  - kind: why
    q: "Episodes on a balancing task last about 40 steps early in training and 1000 steps later. Why do PPO implementations collect a fixed 128 steps from each of many parallel robots, instead of one full episode per robot per update?"
    choices:
      - "An update arrives every 128 steps, and the batch stays one size however long episodes get."
      - "Consecutive steps in a short slice are nearly uncorrelated, like samples from a replay buffer."
      - "Only the steps shortly before a fall carry credit, so longer stretches would mostly be wasted."
      - "The policy gradient is unbiased only when every return is cut at the same fixed length."
    answer: 0
    explain: "One episode per robot means waiting up to 10 s of robot time for each verdict, and a batch that grows 25-fold as the policy improves. A fixed slice from every robot gives an update every 1.28 s at 100 Hz, always the same shape. The price is that episodes now run across buffers, and $G$ gets cut off at the end of each one. (Beat 2: chop the episode into rollouts.)"
  - kind: why
    q: "Two runs from the same state give returns $G$ of 900 and 700, because of different random pushes and masses. Why does an actor-critic train the policy on $A = G - V(s)$ rather than on $G$ itself?"
    choices:
      - "Subtracting $V$ makes every advantage positive, which keeps the gradient stable."
      - "Subtracting $V(s)$ removes the discount, so advantages are in plain reward units."
      - "Training on $G$ would make the actor and the critic learn the same quantity."
      - "A big $G$ may be an easy draw; $G - V(s)$ asks whether the action beat the usual from there."
    answer: 3
    explain: "$V(s)$ is the average return from that state, so $G - V(s)$ keeps only \"was this better or worse than usual here\". Whatever every action from $s$ would have got anyway cancels out. The average advantage is zero by construction, and the signal is in each sample's sign. (Beat 4: enter the critic, and the advantage.)"
  - kind: why
    q: "An episode can end in two ways: a fall, or a 10 s time limit with the robot still upright, and the robot cannot see the clock. Why does the return add the critic's $\\gamma V(s)$ at a time limit but nothing at a fall?"
    choices:
      - "Time limits are rare, so their error averages out, while falls are too frequent to bootstrap."
      - "After a time limit the robot had a real future that the cut threw away; after a fall nothing follows."
      - "The critic has never seen a fallen state, so its value there is undefined."
      - "Adding $V$ at a fall would push the return above the largest possible reward."
    answer: 1
    explain: "A time limit is an artificial cut through a future that would have gone on; the critic's estimate puts it back as one number. A fall really is the end, so the value after it is 0. Bootstrapping through a fall would make falling look cheaper than it is. (Beat 5: what V actually means.)"
  - kind: whatif
    q: "An implementation collects 128-step rollouts with $\\gamma = 0.999$ on episodes up to 1000 steps long. A bug starts the backward return sum from 0 at the end of every rollout, instead of from the critic's value of the last state. What goes wrong?"
    choices:
      - "Nothing much: with $\\gamma = 0.999$ the rewards beyond step 127 are too far away to matter."
      - "Only the steps just before a fall are affected, since those episodes end early anyway."
      - "Every rollout end looks like a fall, so a step's return mostly says where it sat in the buffer."
      - "The returns become biased upwards, so the policy grows overconfident in risky states."
    answer: 2
    explain: "At $\\gamma = 0.999$ a reward 128 steps out still keeps $0.999^{128} \\approx 0.88$ of its weight, so the missing tail is most of $G_t$. Step 0 now sums 128 rewards and step 127 sums one, whatever their actions did. On a small CartPole actor-critic this held evaluation to 121 to 265 out of 500 across five seeds, where the bootstrapped version scored 500 on all of them. (Beat 4: enter the critic, and the advantage.)"
  - kind: whatif
    q: "A rollout loop's done mask only handles time limits. When a robot falls, the return still adds $\\gamma V(s_{\\text{fall}})$ as if the episode went on. What would you expect the policy to learn?"
    choices:
      - "Nothing changes, because the reward for falling is already stored in the buffer."
      - "It becomes too cautious, because every fall is now counted twice in the return."
      - "Training crashes, because the fallen state's value is not a finite number."
      - "Falling looks cheaper than it is, so it takes tilts it cannot recover from."
    answer: 3
    explain: "A fall should end the sum, because nothing follows it. Adding the critic's estimate there hands the falling step a future worth something, so the cost of falling shrinks. I would expect a policy that takes risks it cannot recover from; it is the mirror image of treating a time limit as a fall. (Beat 5: what V actually means.)"
  - kind: whatif
    q: "A balancing robot runs at 100 Hz with $\\gamma = 0.999$. One reward term penalises yaw drift, which takes a couple of seconds to build up. You cut the rollout from 128 steps to 24. What would you expect for that term?"
    choices:
      - "It is learned faster, because the updates now arrive about five times as often."
      - "It may never be learned: its reward lands outside the window, so the critic must guess it."
      - "Nothing changes, because the bootstrapped return makes results independent of rollout length."
      - "Only the critic's loss goes up; the policy still sees the drift penalty directly."
    answer: 1
    explain: "With 24 real steps, about 976 of the roughly 1000-step horizon is the critic's guess, and a critic that has not learned yaw drift cannot pass it on. On one wheeled-leg robot the 24-step runs never learned yaw, and 128 steps on the same data budget took yaw error from 0.3–0.7 down to 0.11–0.27. Keep the rollout longer than the slowest reward you care about. (Beat 4: enter the critic, and the advantage.)"
  - kind: numbers
    q: "$\\gamma = 0.999$, a 128-step rollout (positions 0 to 127), and the robot does not fall inside it. For the step at position 50, how many real rewards go into its bootstrapped return, and what weight does the critic's value at the end of the rollout get?"
    choices:
      - "78 real rewards, and $0.999^{78} \\approx 0.925$."
      - "77 real rewards, and $1/e \\approx 0.37$."
      - "128 real rewards, and $0.999^{128} \\approx 0.88$."
      - "50 real rewards, and $0.999^{50} \\approx 0.95$."
    answer: 0
    explain: "The actions at positions 50 to 127 each earn one reward, which is 78 of them, summed directly. Everything after that is the critic's single number, discounted by $\\gamma^{78} = e^{78 \\ln 0.999} \\approx e^{-0.078} \\approx 0.925$. So even at step 50 most of the return's weight sits on the critic. (Beats 3 and 4: the two problems with G, and the critic.)"
  - kind: numbers
    q: "A robot earns +1 for every step it stays upright, $\\gamma = 0.998$, and time limits are bootstrapped, so the observation contains no clock. What should a perfect critic predict for a robot that will balance indefinitely, 100 steps before the time limit?"
    choices:
      - "About 100, the steps left in this episode."
      - "About 1000, the length of a full episode."
      - "About 500, the sum of $0.998^k$ over all $k$."
      - "About 0.998, one step's discounted reward."
    answer: 2
    explain: "$V$ is the expected discounted return from here as if the episode ran on, because the robot cannot see the clock and the cut is bootstrapped through. That is $\\sum_k 0.998^k = 1/(1-0.998) = 500$. It is not the tail of this episode: filling in the tail is a use of the critic, not its meaning. (Beat 5: what V actually means.)"
---

**Goal:** explain why PPO trains on short rollouts from many robots, and how a learned critic and the advantage $A = G - V$ turn a noisy return into a usable signal.

## Where we left off

Day 6 ended with an action that echoes for about 1000 steps, and with REINFORCE, which waits for the whole episode and then scores every one of those 1000 actions with one noisy $G$. At 100 Hz that is 10 s of robot time per verdict, per robot, and the verdict is shared by everything the robot did in those 10 s. Learning from 1000-step episodes in one piece will not work.

This wall is older than deep RL. In 1983 Andrew Barto, Richard Sutton and Charles Anderson balanced a pole on a cart with two learning elements, and the only feedback was a failure signal when the pole fell. One element chose the pushes. The other, which they called the adaptive critic, learned to predict failure, so that the pusher got a verdict at every step instead of once per fall. In 1992 Ronald Williams, writing down REINFORCE, showed that you can subtract a baseline from the return without biasing the gradient. In 2016 Mnih et al. at DeepMind ran many actors in parallel, each collecting a short segment of a few steps, filling in the rest of the future with a learned value, and updating one shared network (A3C).

Every one of them started where we are now, with the obvious approach: wait for the outcome, then hand the outcome to every action that came before it.

## The picture

Grade a football team on the final score. After 90 minutes it is 1–0, so every player and every pass gets "won". The next week the same passes, played the same way, end 0–1 because the keeper slipped in the 89th minute, and now they all get "lost". After a season the grades have averaged out to something, but it took a season, and nobody learned which pass was good.

That is the naive model: one score at the end, given to every decision. A real coach does two things the scoreboard cannot. They give feedback during the match, not after it, and they judge a pass against what a pass from that spot usually achieves. The first problem on the robot is the first of those: the scoreboard only updates every 10 s.

## Step by step

### One verdict for a thousand actions

Day 5's REINFORCE pushes every action by the return that followed it:

$$
\nabla_\theta J(\theta) \approx \sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t \mid s_t)\, G_t
$$

::: tip
For each step, make the action we took more likely in proportion to $G_t$, the discounted reward that followed it. Big $G$, big push.
:::

On CartPole that works: an episode is at most 500 steps and the pole falls fast. On the wheeled-leg robot an episode is 1000 steps, and three things go wrong at once.

First, the wait. Nothing can be updated until the episode ends, and the episode is 10 s of robot time. Worse, its length depends on how good the policy is. Early on episodes last about 40 steps, later 1000, so a batch of "one episode per robot" would change size by a factor of 25 as training goes well.

Second, credit assignment. The reward at step 900 is low because the robot fell. Which of the 900 earlier actions did it? With $\gamma = 0.999$ the fall still carries $0.999^{900} \approx 0.41$ of its weight back to step 0, so all 900 of them share the blame, the good ones included.

Third, the noise. Every step adds its own randomness: the exploration noise from Day 6, a push, a different mass and friction under domain randomisation. If those were independent from step to step, each with variance $\sigma^2$ in the reward, the return would collect all of them:

$$
\operatorname{Var}[G_t] \approx \sum_{k=0}^{\infty} \gamma^{2k} \sigma^2 = \frac{\sigma^2}{1-\gamma^2} \approx 500\,\sigma^2 \quad (\gamma = 0.999)
$$

::: tip
A return over a long horizon is a sum of hundreds of dice rolls. The longer the horizon, the more dice. Real rewards are correlated from step to step, so treat the 500 as an order of magnitude, not a measurement.
:::

The Hugging Face course puts the obvious fix plainly: average over a large number of trajectories and hope the noise cancels. It does, slowly, but every extra trajectory costs another 10 s of robot time, which is exactly the thing we were short of. We need the verdict to come sooner and in smaller pieces.

::: field
**Variable-length episodes make variable-size batches.** One episode per robot per update means the update size tracks the policy's skill: tiny batches early when it falls in 40 steps, huge ones late. A fixed-size slice of every robot's experience keeps every update the same shape no matter how the policy is doing.
:::

### Chop the episode into rollouts

So we stop waiting. Instead of one episode per robot, we let all 1024 robots run with the current policy for a fixed 128 steps each, write every step down, and train on that. One iteration is $128 \times 1024 = 131{,}072$ transitions, 1.28 s of robot time.

That batch is the rollout buffer, and a few things about it are less obvious than they sound.

- **A snippet is not an episode.** The 1024 robots run out of phase. Some are just starting, some are in the middle, some fall and reset halfway through the window. An episode can end inside a snippet and a new one start right after it.
- **Inside a snippet the steps are in order**, so we can still see how one action led to the next state. Only once every step has been scored do we shuffle them all together for training.
- **The buffer belongs to the current policy.** As soon as we update, we throw it away and collect 128 fresh steps with the new weights. That is what on-policy means in practice.
- **The robots are not reset when the buffer is thrown away.** The next buffer picks up wherever each robot is, so one 1000-step episode is cut across about eight iterations:

```text
episode:  |=================== 1000 steps ===================|
buffers:  |iter 1 |iter 2 |iter 3 |iter 4 |iter 5 |iter 6 |iter 7 |it 8|
            0-127  128-255 256-383   ...                  896-999 → reset
```

::: field
**What fills a buffer decides what it teaches.** A robot that stands perfectly still for 128 steps puts 128 identical transitions in the buffer and teaches nothing. The pushes and the random initial tilts are what put interesting transitions in there, and on the wheeled-leg robot a curriculum ramps both up over the first half of training so that early policies are not knocked over before they have learned anything.
:::

We now get a verdict every 1.28 s instead of every 10 s. But look at what the cut did to $G$, which was a sum over the whole future. The buffer cuts it off.

### The two problems with G

Circling back to the equation every Day so far has leaned on:

$$
G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \dots
$$

Let us say the rollout is 128 steps. 128 steps is the only number of steps we ever collect for one robot. For the step at position 50, the actions at positions 50 to 127 each earned a reward, so 78 real rewards are summed directly. But what about the rest? Ideally the robot balances forever and the episode never ends, so what about everything from step 128 to infinity?

That is the first problem. $G$ is a sum over the whole future, and we never have the whole future. The buffer holds 128 steps and the episode carries on after it, or was cut off by the 10 s timeout with the robot still standing. Day 1's "+ ?" used to appear once per timeout. Now it appears at the end of every snippet, 1024 times per iteration:

$$
G_t = \underbrace{\sum_{k=0}^{127-t} \gamma^k R_{t+k+1}}_{\text{in the buffer}} \; + \; \gamma^{128-t}\, \underbrace{G_{128}}_{\text{never recorded}}
$$

::: tip
The first part is real and we can add it up. The second part is everything the robot will do after the buffer ends. With $\gamma = 0.999$ it is not small: even at step 0 its weight is $0.999^{128} \approx 0.88$.
:::

The second problem is there even when we do have the future: $G$ is a single noisy sample of it. Two runs from the same state give two different $G$'s, because of the exploration noise, the random pushes, and a different mass and friction each time. Training on raw $G$ would mean chasing that noise. A big $G$ might mean the action was good, or it might mean the robot drew an easy mass and no pushes.

So the cut left us with a hole at the end of every snippet, and the sum we can compute is still a dice roll. Something has to fill in the future, and something has to tell a good action apart from a lucky draw.

### Enter the critic, and the advantage

Both of these require an additional agent to judge the value of a state, similar to the actor-critic setup we floated as food for thought on Day 1 and again on Day 5: the football coach.

The critic fixes both at once. It is a second network that looks at a state and predicts the return to expect from there, $V(s)$.

For the missing future, everything past the end of the buffer is replaced by the critic's single number, $V(s_{128})$:

$$
G_t \approx \sum_{k=0}^{127-t} \gamma^k R_{t+k+1} + \gamma^{128-t}\, V(s_{128})
$$

::: tip
Real rewards for as long as the buffer lasts, then one guess for everything after. Using an estimate to finish a sum is called bootstrapping. The critic stands in for the future we did not get to observe.
:::

Slide a step through the buffer below. Near the start most of the sum is real; near the end it is almost all the critic. Switch to a fall, or move to the last slice of the episode where the 10 s timeout lands, and watch what happens to the tail.

<buffer-slicer steps="128" episode="1000" gamma="0.999" iter="1" t="50" v="850"></buffer-slicer>

It is recursive, so $V(s_{128})$ has already factored in the other futures: the critic was trained on returns that were themselves finished by its own guesses.

For the noise, $V(s)$ is the average $G$ from that state, so subtracting it leaves only "was this action better or worse than usual here". Day 2's $V$ and $Q$ come back, with one new letter. I hate math, but it is this form:

$$
V^{\pi}(s) = \mathbb{E}[G_t \mid s_t = s], \qquad Q^{\pi}(s, a) = \mathbb{E}[G_t \mid s_t = s, a_t = a], \qquad A^{\pi}(s, a) = Q^{\pi}(s, a) - V^{\pi}(s)
$$

::: tip
$V$ is how good a situation is. $Q$ is how good a situation is if you commit to one action first. $A$ is the difference the action made.
:::

We never have $Q$ itself, but the $G$ we just built is one sample of it: this state, this action, then whatever followed. So instead of asking "was $G$ big" we ask "was $G$ bigger than what the critic expected", and that is what the policy actually trains on:

$$
A_t = G_t - V(s_t), \qquad \nabla_\theta J(\theta) \approx \sum_t \nabla_\theta \log \pi_\theta(a_t \mid s_t)\, A_t
$$

::: tip
Same push as REINFORCE, with $G_t$ swapped for $A_t$. Positive advantage: this action did better than usual for this state, so make it more likely and pull the mean towards it. Negative: push away.
:::

Picture the robot tilting. The critic expects +5 from here. One sampled action leads to a recovery worth +8: better than expected, do more of that. Another leads to a near-fall worth +2: worse than expected, do less. The gap between what happened and what was expected is the advantage.

<figure>
<svg viewBox="0 0 360 190" role="img" aria-label="A tilting robot with two branches: one action recovers for +8, another falls for +2; the critic's expectation of +5 is a dashed line between them" style="max-width:460px;width:100%;height:auto;display:block;margin:0 auto;color:var(--text)">
<g fill="none" stroke="currentColor" stroke-width="2"><circle cx="48" cy="140" r="12"/><g transform="rotate(16 48 140)"><rect x="42" y="84" width="12" height="56" rx="4"/></g></g>
<text x="4" y="176" font-size="14" fill="var(--muted)">state s: tilting</text>
<line x1="78" x2="350" y1="90" y2="90" stroke="var(--accent-2)" stroke-width="1.5" stroke-dasharray="6 4"/>
<text x="350" y="82" text-anchor="end" font-size="14" fill="var(--accent-2)">critic: V(s) = +5</text>
<path d="M76 104 C140 100, 170 46, 230 44" fill="none" stroke="var(--good)" stroke-width="2.5"/>
<path d="M76 116 C140 120, 170 138, 230 138" fill="none" stroke="var(--bad)" stroke-width="2.5"/>
<circle cx="232" cy="44" r="5" fill="var(--good)"/><circle cx="232" cy="138" r="5" fill="var(--bad)"/>
<text x="242" y="40" font-size="15" fill="var(--good)">+8 ✓ recovers</text>
<text x="242" y="60" font-size="14" fill="var(--muted)">A = 8 − 5 = +3</text>
<text x="242" y="142" font-size="15" fill="var(--bad)">+2 ✗ falls</text>
<text x="242" y="162" font-size="14" fill="var(--muted)">A = 2 − 5 = −3</text>
</svg>
<figcaption>Same state, two sampled actions. The critic's expectation is the line both are measured against.</figcaption>
</figure>

::: field
**The critic fixes both problems with G at once.** Same network, two roles: gap filler at the end of every buffer, and baseline subtracted at every step. The share it carries is not small. On the wheeled-leg robot the rollout was once 24 steps, which left about 976 of the 1000-step horizon to the critic's guess; the critic was guessing yaw drift it had never learned, so yaw never got learned. At 128 steps on the same data budget the yaw RMSE went from 0.3–0.7 to 0.11–0.27. That less of every target leaning on the critic is the reason is the mechanism I would bet on, but the repo only has the empirical result, not a clean ablation. Day 11 picks the rollout length properly.
:::

That leaves an awkward question about the one number doing most of the work. $V(s_{128})$ stands in for a future the critic has never seen whole: the buffer is 128 steps, the horizon is 1000. So what exactly is it a prediction of?

### What V actually means

My first answer was "the tail of the buffer": the rewards from step 128 to the end of this robot's episode. That has the picture inverted. Filling in the tail is a use of the critic, not its meaning.

$V(s)$ is the expected discounted return from state $s$ onwards, $R_{t+1} + 0.999 R_{t+2} + 0.999^2 R_{t+3} + \dots$, with an effective horizon of about 1000 steps. It is not "the remaining 872 steps of this episode", because the robot cannot see the clock: time since reset is not in its 36 observations, and the 10 s cutoff is bootstrapped through. So $V$ is the next ~1000 steps from here, weighted by $0.999^k$, as if the episode ran forever and was cut only by falling. A perfect balancer standing on the spot has $V \approx \sum_k 0.999^k \approx 1000$; one about to fall has $V$ near zero.

That gives a simple rule for where the critic fills in:

- **At the end of the buffer:** yes, with $V(s_{128})$.
- **At a timeout:** yes, with the value of the last state before the cut. The robot was still up and the future was real.
- **At a fall:** no. Nothing follows a fall, so there is nothing to estimate, and the value after it is 0.

How does a network learn a 1000-step quantity when it only ever sees 128 steps? By regression against targets that are partly its own guesses:

$$
L_V = \big(G_t^{\text{boot}} - V(s_t)\big)^2, \qquad G_t^{\text{boot}} = \sum_{k=0}^{127-t} \gamma^k R_{t+k+1} + \gamma^{128-t} V(s_{128})
$$

::: tip
The target is the real rewards in the window plus the critic's own estimate at the window's end. Each iteration it gets 128 more steps of truth, and consistency with itself carries that truth further back, one buffer at a time.
:::

Which is also why it is slow to become accurate early on. A critic that starts from random weights is bootstrapping from random guesses, and only the real rewards pull it towards the truth.

::: field
**A perfect critic makes the average advantage zero, and that is the point.** The critic is fitted to the average, so the advantages from one state average out to zero by construction. The signal is in the deviations. Say the mean action in some state is worth 840; the sampled 3.4 V got 845 and the sampled 2.6 V got 832. Both are measured against 840: +5 and −8. Each sample carries a sign, and the sign is the direction the exploration noise was there to produce. A bad critic adds its own error to every one of those signs, and the actor has to average that out over many more samples.
:::

Let me regroup. REINFORCE waited for whole episodes and handed one noisy verdict to a thousand actions. We stopped waiting and chopped the episodes into 128-step rollouts from 1024 robots, which gave a verdict every 1.28 s but cut $G$ off at the end of every snippet and left it as noisy as before. A critic fixed both: its $V(s_{128})$ fills in the missing future, and subtracting $V(s)$ turns $G$ into the advantage, "better or worse than usual here". And $V$ itself is not the tail of the buffer but the expected return over the whole horizon, learned from 128 real steps at a time plus its own guesses.

That last part is the crack. Every target the critic trains on, and every advantage the actor trains on, leans on $V$. With $\gamma = 0.999$ even step 0 hands 88 % of its return's weight to $V(s_{128})$. And $V$ is a network that started from random weights and learns from its own guesses.

## Pitfalls

- **Zeroing the future at the end of the buffer (beat 4).** If the backward walk starts from 0 instead of $V(s_{128})$, every snippet ends in a fake fall. A step's return then says where it sat in the buffer, not what its action did. On a small CartPole actor-critic this drops evaluation from 500 to a few hundred, and training-time episode length can still hit the target now and then, which makes it easy to miss.
- **Bootstrapping through a fall (beat 5).** The mirror image of Day 1's timeout bug. If the done mask only handles timeouts, a fall gets $\gamma V(s_{\text{fall}})$ added as if the robot had more future, and falling looks cheaper than it is. I would expect the policy to take tilts it cannot recover from.
- **Letting a return leak across a reset inside the buffer (beat 2).** Robot 37 falls at step 50 and is reset; the buffer records done there, and the return of step 49 must not include the new episode that begins at step 50. Forget the mask and an action just before a fall borrows the next episode's good start.
- **Reading a zero mean advantage as "nothing is being learned" (beat 5).** It is zero by construction. Look at the spread and the sign per sample, and at the critic's own curves (value loss, explained variance; Day 10), not at the average advantage.
- **A rollout shorter than the slowest reward (beat 4).** If yaw drift takes seconds to show up and the buffer is 0.24 s, the reward for a decision almost never lands in the same window as the decision, and the critic has to guess all of it. The 24-step runs on the wheeled-leg robot never learned yaw.

<!-- quiz -->

## Next

You might ask, why should we believe the critic? Everything this Day built leans on it: the tail of every snippet, the baseline under every step, the target it trains on. Unfortunately the critic is a network too, so it is wrong as well, and most wrong early on, exactly when the actor needs it most. How much should we trust a judge we know is wrong? That is [Day 8](../day08/).

## Sources

- `notes/chapter-6-actor-critic-methods-with-robotics-environments.md` ([Notion](https://app.notion.com/p/28967249ddbf80a09441cbee5fca3995)): my notes on Unit 6 of the [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit6/introduction), rewritten here. The variance argument against plain policy gradients, "more trajectories cost sample efficiency", the actor-critic split and the advantage $A = Q - V$ as the critic's signal come from the course.
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), "Why we chop episodes into rollouts", "The two problems with G" and "Enter the critic, and the advantage": the step-50 example, both problems with $G$, "the critic fixes both at once", "I hate math, but it is this form", and the V/Q/A reading.
- `artifacts/rl-presentation-plan.html`, Slides 6 and 7: snippets from many robots, an episode ending mid-snippet, the buffer thrown away after each update, and the +5 / +8 / +2 worked example.
- `artifacts/wlbot-learning-log-aug-30.html`, Session 2 (rollouts and bootstrapping, 1024 × 128 = 131,072 transitions, the 24-step critic that never learned yaw, the 840 / 845 / 832 perfect-critic example, robot 37 falling at step 50) and Session 3b ("what V means", the buffer-vs-episode diagram, where the critic fills in and where it does not, how it learns a full-episode quantity).
- `notes/ppo-takeaways-clean.md`, "How long should the rollout be": yaw RMSE 0.3–0.7 at 24 steps against 0.11–0.27 at 128.
- A. Barto, R. Sutton and C. Anderson, "Neuronlike adaptive elements that can solve difficult learning control problems", *IEEE Transactions on Systems, Man, and Cybernetics*, 1983.
- R. Williams, "Simple statistical gradient-following algorithms for connectionist reinforcement learning", *Machine Learning*, 1992.
- V. Mnih et al., "Asynchronous Methods for Deep Reinforcement Learning", ICML 2016 ([arXiv:1602.01783](https://arxiv.org/abs/1602.01783)).
- R. Sutton and A. Barto, *Reinforcement Learning: An Introduction*, 2nd ed., 2018, sections 13.4 and 13.5 (baselines, actor-critic).
- [Gymnasium: CartPole](https://gymnasium.farama.org/environments/classic_control/cart_pole/): the episode cap of 500 steps and the termination limits.
