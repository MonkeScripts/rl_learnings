---
day: 5
minutes: 60
widgets: [pg-nudge]
quiz:
  - kind: why
    q: "A value-based agent scores each button and presses the argmax. Why does a policy-gradient agent output probabilities through a softmax instead?"
    choices:
      - "A softmax network trains faster than one with a linear output."
      - "A softmax policy can never get stuck in a local maximum."
      - "The environment only accepts probabilities as actions."
      - "An argmax jumps and has no gradient; probabilities move smoothly."
    answer: 3
    explain: "Climbing $J(\\theta)$ needs a policy that changes a little when $\\theta$ changes a little. An argmax is flat almost everywhere and then flips the whole policy when one score passes another, say 0.22 against 0.23, so there is no slope to climb. A softmax moves every probability smoothly with the weights, and sampling from it gives exploration for free. (Beat 1: a policy we can nudge.)"
  - kind: whatif
    q: "A task pays +1 per step, so the whole-episode return $R(\\tau)$ is always positive. You weight every action's log-prob gradient by $R(\\tau)$ instead of by the return from that step on. What goes wrong?"
    choices:
      - "Every action is pushed up; the gradient stays unbiased but gets far noisier."
      - "Nothing changes; $R(\\tau)$ and $G_t$ are equal at every step, so the update is identical."
      - "Early rewards leak into late actions; the gradient becomes biased and points the wrong way on average."
      - "Every log-prob is pushed up at once; the softmax saturates and the policy stops exploring."
    answer: 0
    explain: "$R(\\tau)$ is one number for the whole episode, so it cannot tell the good actions inside it from the bad ones, and here it is never negative: the action that caused the fall gets pushed up too. An action at step 300 is also credited with rewards from steps 0 to 299 that it could not have caused. Those terms average to zero, so the gradient stays unbiased, but the noise is what stalls learning. (Beats 4 and 5: REINFORCE, then credit from here on.)"
  - kind: numbers
    q: "Each iteration, 1024 parallel robots run 128 steps each at 100 Hz. Plain policy gradient takes one gradient step on that batch and throws it away. How many samples is that per gradient step, and how much time does each robot spend producing it?"
    choices:
      - "1024 samples, 0.128 s."
      - "131,072 samples, 128 s."
      - "131,072 samples, 1.28 s."
      - "4,600 samples, 10 s."
    answer: 2
    explain: "$1024 \\times 128 = 131{,}072$ samples, and 128 steps at 100 Hz is 1.28 s for each robot, all for one optimiser step that takes about a millisecond. The data is only valid for the policy that collected it, so after one step it is stale. Getting many steps out of one batch is what PPO later makes legal. (Beat 6: the gradient is very noisy.)"
  - kind: numbers
    q: "A softmax policy over two buttons A and B pressed A, which it gives probability 0.2. What is the gradient of $\\log \\pi(A \\mid s)$ with respect to the logits $z_A$ and $z_B$?"
    choices:
      - "$+0.2$ and $-0.8$"
      - "$+0.8$ and $-0.8$"
      - "$+0.8$ and $-0.2$"
      - "$+1$ and $0$"
    answer: 1
    explain: "$\\partial \\log \\pi(a \\mid s) / \\partial z_b = \\mathbb{1}[b = a] - \\pi(b \\mid s)$. For A that is $1 - 0.2 = 0.8$, and for B it is $0 - 0.8 = -0.8$. The less likely the button we pressed, the bigger the push: had A been at 0.9, it would get only 0.1. (Beat 1: a policy we can nudge.)"
  - kind: numbers
    q: "The noise of an averaged gradient falls like $1/\\sqrt{m}$ for $m$ episodes per update. To make the estimate 4 times steadier, how many times more episodes per update do you need?"
    choices:
      - "2 times"
      - "4 times"
      - "16 times"
      - "64 times"
    answer: 2
    explain: "$1/\\sqrt{m}$ drops by a factor of 4 when $m$ grows by $4^2 = 16$. So a 4 times steadier needle costs 16 times the playing for one step, and the data is still only good for that one step. That is why more episodes is the honest fix and the expensive one. (Beat 6: the gradient is very noisy.)"
  - kind: whatif
    q: "In PyTorch you write the REINFORCE loss as `log_prob * G`, without the minus sign, and call `optimizer.step()`. What does the policy learn?"
    choices:
      - "To make high-return episodes less likely: it descends $J$."
      - "The same policy, since the sign only flips the loss curve."
      - "Nothing, since the gradient of a log-probability is zero."
      - "The same policy, only slower because the loss is negative."
    answer: 0
    explain: "Optimisers minimise, and we want to climb $J(\\theta)$, so the loss must be the negative. Without the minus, each step makes the actions of good episodes less likely, and the policy carefully learns to fail. I would expect the score to sink below a random policy's and stay there. (Beat 4: REINFORCE: play, score, nudge.)"
  - kind: why
    q: "The probability of an episode is a product of the start-state odds, the policy's probabilities and the environment's dynamics. Why can its gradient be estimated without a model of the dynamics?"
    choices:
      - "Because the dynamics can be learned from the reward signal as it trains."
      - "Because the dynamics do not depend on $\\theta$, so they drop out."
      - "Because the dynamics are always deterministic inside a simulator."
      - "Because the dynamics cancel out when returns are standardised."
    answer: 1
    explain: "Taking the log turns the product into a sum: $\\log \\mu(s_0) + \\sum_t \\log \\pi_\\theta(a_t \\mid s_t) + \\sum_t \\log P(s_{t+1} \\mid s_t, a_t)$. Only the policy terms depend on $\\theta$, so the start-state and dynamics terms vanish from the gradient. The physics only has to be played, never differentiated. (Beat 3: taking the physics out of the gradient.)"
  - kind: whatif
    q: "While training, a policy-gradient agent always presses its most likely button instead of sampling from its probabilities. What goes wrong?"
    choices:
      - "The log-probabilities become undefined and the training crashes."
      - "Nothing: sampling only matters once the agent is deployed."
      - "Learning speeds up, since no step is wasted on the worse buttons."
      - "It only ever tries one action, so it never learns another is better."
    answer: 3
    explain: "The sampling is the exploration. A policy that always presses its favourite only ever collects evidence about that one action, so the gradient can never find out that the other button would have done better. Sample while training; take the most likely action only to evaluate or deploy. (Beat 1: a policy we can nudge.)"
---

**Goal:** optimise a stochastic policy directly, by gradient ascent on its expected return $J(\theta)$, and train one on CartPole with REINFORCE.

## Where we left off

Day 4 ended on a wheel motor. DQN acts by taking the argmax over a few buttons, and a motor that takes any voltage in ±8 V has no buttons to take the max over. So we have to learn the policy itself: a network that looks at the state and says what to do, with no table of scores in between.

People wanted this long before anyone had a wheeled-leg robot. In 1992 Ronald Williams published a family of algorithms he called REINFORCE, for networks whose outputs are random choices rather than fixed answers. In 1999 Richard Sutton, David McAllester, Satinder Singh and Yishay Mansour proved the policy gradient theorem, which says the same direction can be computed for any differentiable policy without a model of the world. That theorem is the root of everything from Day 5 to Day 9, PPO included.

Their first attempt was the obvious one: play, see how it went, and make whatever you did more likely if it went well.

## The picture

Think back to tuning PD gains by hand. Try $K_p = 50$ and it wobbles. Try $K_p = 55$ and it wobbles less. Conclude "more $K_p$", and go again. That is already a policy search: no value function, no model, just change the controller's numbers and keep what scored better.

It works for two gains. The policy that balances the wheeled-leg robot has about 4,600. Trying each one up and down is 9,200 trial runs for a single step, and every trial is a little bit lucky or unlucky, so even those comparisons are noisy. We need the direction for all 4,600 numbers at once, out of the episodes we already played. That is a gradient, and the first problem is that our policy, as DQN built it, does not have one.

## Step by step

We will get back to the voltage. For today the running example is CartPole, because it has two buttons and every number in it can be printed: four state numbers (cart position and velocity, pole angle and angular velocity), push left or push right, +1 for every step the pole stays up, at most 500 steps.

### A policy we can nudge

The obvious move is to keep DQN's head. The network outputs one score per button and we press the higher one.

Now here is the problem. Say during training "left" scores 0.22 and "right" scores 0.21, so we always push left. One gradient step later right scores 0.23. Nothing much changed in the weights, but the policy flipped completely: it now always pushes right. An argmax is flat almost everywhere and then jumps. There is no slope to climb, so there is nothing for a gradient to work with.

The fix is to make the network output probabilities instead. It still produces one number per button, the logit $z_a$, and a softmax turns those into a distribution:

$$
\pi_\theta(a \mid s) = \frac{e^{z_a}}{\sum_b e^{z_b}}, \qquad z = f_\theta(s)
$$

::: tip
$\theta$ is every weight in the network. $\pi_\theta(a \mid s)$ is the probability of pressing button $a$ in state $s$. A small change in $\theta$ now moves the probabilities a little, never all at once.
:::

We do not take the most likely button during training. We sample from the distribution. That gives exploration for free: no $\varepsilon$-greedy schedule to tune, the policy simply tries the less likely button now and then, and how often is something it learns. One more thing we will lean on later is how the log of that probability responds to the logits:

$$
\frac{\partial \log \pi_\theta(a \mid s)}{\partial z_b} = \mathbb{1}[b = a] - \pi_\theta(b \mid s)
$$

::: tip
For two buttons: the logit of the button we pressed goes up by $1 - p$, the other one goes down by its own probability. The less likely the button we pressed, the bigger the push.
:::

::: field
**Policy-based vs policy-gradient.** Both search for the policy directly, with no value table to read it off. Policy-based in general changes $\theta$ by any means that scores better: hill climbing, simulated annealing, evolution strategies, or $K_p = 50$ against 55 by hand. Policy-gradient is the subclass that changes $\theta$ by following $\nabla_\theta J(\theta)$. ✅ when the action is continuous or the policy has thousands of weights. ⚖️ Both are on-policy: the data has to come from the policy as it is now.
:::

So the policy can be nudged. Nudged towards what, though? We need one number that says how good $\theta$ is.

### A number to climb

The obvious score is the one the last episode printed. Play once, read the return, call that the quality of $\theta$.

But play again with exactly the same weights and you get a different number. The policy samples its actions, and the pole starts at a slightly different random tilt every time. One episode measures $\theta$ plus luck. The score we want is the average over all the ways an episode could go with these weights, each counted as often as it would happen:

$$
J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\big[R(\tau)\big] = \sum_{\tau} P(\tau; \theta)\, R(\tau), \qquad R(\tau) = r_1 + \gamma r_2 + \gamma^2 r_3 + \dots
$$

::: tip
$\tau$ is one whole episode, Day 1's tape. $R(\tau)$ is its discounted return from the start. $P(\tau; \theta)$ is how likely that tape is when this policy plays. $J(\theta)$ is the return we should expect, a weighted average of every return the policy could get.
:::

$J(\theta)$ is our North Star. Think of it as the height of a mountain over the space of weights: the gradient $\nabla_\theta J$ is the compass that points up the steepest slope, and training is walking where it points.

$$
\theta \leftarrow \theta + \alpha\, \nabla_\theta J(\theta)
$$

::: tip
Gradient ascent: take a step of size $\alpha$ uphill. The same as gradient descent on a loss, with the sign flipped, because here bigger is better.
:::

The crack is in the sum. It runs over every trajectory the policy could ever produce, and to get its gradient we would also have to differentiate $P(\tau;\theta)$, which contains the physics of the cart. We cannot enumerate the first and we do not have the second.

::: field
**Sampling is not needed because one episode is long.** One CartPole episode is at most 500 steps, which is finite. Sampling is needed because the space of episodes is effectively infinite: the policy is stochastic, so the same state can lead to different actions, and the environment can be stochastic too, so the same action can lead to different next states. Count the ways and you never finish. So we play some, and estimate.
:::

### Taking the physics out of the gradient

The obvious way to estimate $J$ is to play $m$ episodes and average their returns. That gives us the height of the mountain where we stand. It does not give us the slope, and the slope is what we need.

The trick is one line of calculus: $\nabla P = P\, \nabla \log P$. Put it inside the sum and the gradient becomes an average again, of something we can compute from a played episode:

$$
\nabla_\theta J(\theta) = \sum_\tau P(\tau;\theta)\, \nabla_\theta \log P(\tau;\theta)\, R(\tau) = \mathbb{E}_{\tau \sim \pi_\theta}\big[\nabla_\theta \log P(\tau;\theta)\, R(\tau)\big]
$$

Now look at what $P(\tau;\theta)$ is made of. An episode is a start state, then at every step the policy picks an action and the physics picks the next state:

$$
P(\tau;\theta) = \mu(s_0) \prod_{t} \pi_\theta(a_t \mid s_t)\, P(s_{t+1} \mid s_t, a_t)
$$

Take the log and the product becomes a sum. The start-state distribution $\mu$ and the physics $P(s_{t+1} \mid s_t, a_t)$ do not depend on $\theta$, so their gradient is zero and they drop out. Only the policy's own terms are left:

$$
\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\Big[\sum_{t} \nabla_\theta \log \pi_\theta(a_t \mid s_t)\, R(\tau)\Big]
$$

::: tip
For every action in the episode, take the direction that makes that action more likely, and scale it by how good the episode was. Good episodes pull their actions up, bad ones push theirs down. The physics never has to be differentiated, only played.
:::

That is the policy gradient theorem. I am no fan of derivations, but this one is worth its three lines: it is the reason we never need a model of the robot. We still have an expectation, though, and an expectation is something we cannot compute. We can only sample it.

### REINFORCE: play, score, nudge

The obvious estimate of an expectation is an average of samples. Play $m$ episodes with the current policy and average:

$$
\hat{g} = \frac{1}{m} \sum_{i=1}^{m} \sum_{t} \nabla_\theta \log \pi_\theta\big(a_t^{(i)} \mid s_t^{(i)}\big)\, R\big(\tau^{(i)}\big)
$$

::: tip
$\hat g$ is our estimate of the compass reading. With $m = 1$ it is one episode's worth of evidence. $\frac{1}{m}$ averages over episodes, and more episodes means a steadier needle.
:::

That is REINFORCE, also called Monte Carlo policy gradient, because it waits for whole episodes and uses what really happened. The loop is three lines of English: collect an episode with $\pi_\theta$, compute the return, then make every action taken more likely if the return was good and less likely if it was bad. In PyTorch the optimiser minimises, so we hand it the negative:

```python
policy_loss = []
for log_prob, w in zip(saved_log_probs, weights):
    policy_loss.append(-log_prob * w)      # minus: descent on this is ascent on J
policy_loss = torch.cat(policy_loss).sum()
optimizer.zero_grad()
policy_loss.backward()
optimizer.step()
```

`saved_log_probs` was stored while playing, one $\log \pi_\theta(a_t \mid s_t)$ per step, and `weights` is $R(\tau)$ for every step. Backpropagating through `log_prob` gives exactly $\nabla_\theta \log \pi_\theta$.

::: field
**Watch a random policy first.** Policy gradient can only amplify what sampling already stumbles into. With all weights at zero the CartPole policy is a coin toss and keeps the pole up for about 22 steps on average (22.2 over 500 episodes in a quick numpy run). That is enough good luck to amplify. If random actions never do the right thing, I would not expect REINFORCE to find it either.
:::

Now here is the problem. Look at what multiplies every action: $R(\tau)$, one number for the whole episode. CartPole pays +1 per step and never anything negative, so $R(\tau)$ is always positive. Every action ever taken is pushed up, including the one that tipped the pole over, just by less in short episodes than in long ones. And the push at step 300 is scaled by rewards from steps 0 to 299, which happened before that action and could not have been caused by it.

### Credit from here on, and a centre line

The first half of the fix is something Day 1 already said: $G_t$ sums future rewards, not past ones. An action at step $t$ cannot change anything that happened before $t$, so weight it only by the return from $t$ on:

$$
\hat{g} = \sum_{t} \nabla_\theta \log \pi_\theta(a_t \mid s_t)\, G_t, \qquad G_t = r_{t+1} + \gamma\, G_{t+1}
$$

Dropping the past rewards does not bias the estimate. For any fixed state the expected log-prob gradient is zero, because the probabilities always sum to one:

$$
\mathbb{E}_{a \sim \pi_\theta}\big[\nabla_\theta \log \pi_\theta(a \mid s)\big] = \sum_a \nabla_\theta \pi_\theta(a \mid s) = \nabla_\theta \sum_a \pi_\theta(a \mid s) = \nabla_\theta 1 = 0
$$

::: tip
Multiply a log-prob gradient by anything the action could not have influenced and, on average, you get zero. The past rewards were adding only noise. The same argument lets us subtract any baseline $b$ that does not depend on the action, which is the second half of the fix.
:::

$G_t$ is computed with the recursion from Day 1, walked backwards from the end of the episode, then standardised:

```python
returns = deque(maxlen=max_t)
for t in range(n_steps)[::-1]:
    disc_return_t = returns[0] if len(returns) > 0 else 0
    returns.appendleft(gamma * disc_return_t + rewards[t])

eps = np.finfo(np.float32).eps.item()
returns = torch.tensor(returns)
returns = (returns - returns.mean()) / (returns.std() + eps)
```

$$
\tilde{G}_t = \frac{G_t - \operatorname{mean}(G)}{\operatorname{std}(G) + \varepsilon}
$$

::: tip
Subtract the episode's average return and divide by its spread. Now about half the actions have a positive weight and half a negative one: better than this episode's usual gets pushed up, worse gets pushed down, and the numbers stay near ±1 whatever the reward scale.
:::

::: field
**The backward loop, line by line.**
- `for t in range(n_steps)[::-1]` walks from the last step to the first, so $G_{t+1}$ is always ready when $G_t$ needs it. One pass, $O(N)$, instead of re-summing the tail at every step.
- `returns[0]` is $G_{t+1}$, the return just computed, sitting at the front of the queue. Empty queue means the episode ended, so 0.
- `appendleft(gamma * G_next + rewards[t])` is $G_t = r_{t+1} + \gamma G_{t+1}$. Appending on the left keeps the list in time order, $t = 0$ first.
- The standardisation is a per-episode baseline plus a rescale. `eps` only guards against dividing by zero when every return is equal.
- Index trap: `rewards[t]` here is the reward returned by `step()` at $t$, which Day 1 called $R_{t+1}$. Same number, different index.
:::

Both halves show up clearly in a small numpy version of REINFORCE on CartPole (five seeds, 1500 episodes each). Weighting by $R(\tau)$ never got the running mean of 100 scores to 475 on any seed. Weighting by raw $G_t$ got there on all five, between episodes 741 and 1078. Standardised $G_t$ also got there on all five, between 777 and 913: not always first, but in a tighter band. That run uses Adam, as the notes do, and Adam's per-weight step size already hides most of the reward-scale problem, so the evidence for standardising is modest but real.

Standardising is still a crude centre line. The mean of this episode's returns is not "what usually happens from this state". It mixes the start of the episode, where a lot of reward is still to come, with the end, where almost none is. And every $G_t$ is still one sample of what could have happened.

### The gradient is very noisy

Two episodes from the same weights can last 30 steps and 300 steps. Each action's weight is one draw from that spread, so each episode's $\hat g$ points somewhere different. The same toy run measures it directly: freeze the policy, play 500 episodes, compute one gradient per episode, and compare each with the average of all 500. After 300 training episodes the median cosine between a single episode's gradient and the average was 0.66 with standardised $G_t$, 0.34 with raw $G_t$, and −0.20 with $R(\tau)$. For the naive estimator the typical single episode points slightly away from where the average says to go.

Play with the same effect on one state and two buttons. Every update samples 8 presses, each press returns a noisy $G$ that is always positive, and the logit moves by $\alpha$ times the average of $w \cdot \nabla \log \pi$. Twenty seeds run side by side, so the spread of the lines is the variance.

<pg-nudge mode="raw" alpha="0.08" noise="15"></pg-nudge>

The obvious fix is more episodes per update. The noise of an average falls like $1/\sqrt{m}$, so averaging 100 episodes makes the needle ten times steadier. It also costs 100 times the playing for one step, and the data is only good for one step: the moment $\theta$ moves, the episodes describe a policy we no longer are.

::: field
**On-policy means one use.** Plain policy gradient: collect a batch with $\pi_\theta$, take one gradient step, throw the batch away. On the wheeled-leg robot one batch is 1024 robots × 128 steps = 131,072 samples, 1.28 s of every robot's time at 100 Hz, for about a millisecond of optimisation. ❌ More data per step is the honest fix and the expensive one. PPO's bet is 320 gradient steps out of that one batch; Day 9 is about why that is allowed.
:::

That was six beats of machinery for one estimator, so let me regroup. We swapped DQN's argmax for a softmax we can nudge, wrote down $J(\theta)$ as the one number to climb, took the physics out of its gradient with the log-prob trick, and estimated it by playing: REINFORCE. Then we cut away the rewards each action could not have caused, and centred the rest so that half the actions get pushed down. What is left is noise. The weight on every action is still one roll of the dice, and the centre line is this episode's average rather than what usually happens from this state.

Which brings back the food for thought from Day 1: the football coach. A judge who watches every attempt could say "that one was better than your usual from here" or "worse", and that is exactly the centre line we are missing. It pays off on Day 7.

## Pitfalls

- **Taking the argmax while training (beat 1).** The sampling is the exploration. A policy that always presses its favourite button only ever sees one action per state, and nothing tells it the other one would have been better. Sample while training; take the most likely action only to evaluate or deploy.
- **The missing minus sign (beat 4).** Optimisers minimise. `loss = log_prob * G` without the minus is gradient descent on $J$: the policy carefully learns to drop the pole. I would expect the score to sink below the coin toss's 22 steps and stay there.
- **Weighting by the whole episode, or summing forwards (beat 5).** $R(\tau)$ on every step, or a loop that accidentally includes past rewards, still learns a bit, so nothing crashes. It just looks like the $R(\tau)$ runs above: slow, and stuck below 475.
- **Standardising what has no spread (beat 5).** An episode where every $G_t$ is equal standardises to all zeros, so it contributes no gradient at all, and `eps` only stops the division from blowing up. With very short episodes the episode mean is a poor centre line; I would expect early training on a hard task to stall here.
- **Reusing a batch for several steps (beat 6).** Two or three optimiser steps on the same episodes feels like free data. After the first step the stored log-probs belong to a policy that no longer exists, and nothing in REINFORCE corrects for it. Day 9's ratio is the fix.

<!-- quiz -->

## Next

You might ask, what happened to the voltage? Everything today ran on a softmax, and a softmax needs a list of buttons to put probabilities on. Exploration came from that list too: the policy sometimes pressed the button it liked less. CartPole's policy is a softmax over two buttons. The wheel wants a voltage. What does a stochastic policy over a continuous action look like, and where does its exploration come from? That is [Day 6](../day06/).

## Sources

- `notes/chapter-4-policy-gradient-with-pytorch.md` ([Notion](https://app.notion.com/p/28967249ddbf806faf39ed25ad9c527e)): my notes on Unit 4 of the [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit4/introduction), rewritten here. The objective $J(\theta)$, the policy-based vs policy-gradient split, the 0.22/0.23 argmax flip, the policy gradient theorem, the REINFORCE estimators and the `Policy` / `reinforce()` code come from the course. The North Star and mountain-and-compass readings, the "not based on one episode" point and the line-by-line table are mine.
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), preface "Actor critic (food for thought)": the judge, teacher and football coach.
- `notes/chapter-6-actor-critic-methods-with-robotics-environments.md` ([Notion](https://app.notion.com/p/28967249ddbf80a09441cbee5fca3995)): the same starting state leading to very different returns, and why bigger batches cost sample efficiency.
- `notes/deep-rl-hacks-schulman.md` ([Notion](https://app.notion.com/p/3e467249ddbf81039772e3df5492078f)): "watch a random policy", from John Schulman's *Nuts and Bolts of Deep RL Research* (2017). Write-up: [github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks).
- `artifacts/rl-presentation-plan.html`, Slide 4: robots learn a policy because a motor can take any value, so there is nothing to pick an argmax over.
- `artifacts/wlbot-learning-log-aug-28.html` and `artifacts/wlbot-learning-log-aug-30.html`: tuning PD gains by trial against 4,600 policy weights; on-policy as one use, 131,072 samples per gradient step, 1.28 s, and PPO's 320 steps.
- R. J. Williams, "Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning", *Machine Learning*, 1992.
- R. S. Sutton, D. McAllester, S. Singh and Y. Mansour, "Policy Gradient Methods for Reinforcement Learning with Function Approximation", NIPS 1999.
- R. Sutton and A. Barto, *Reinforcement Learning: An Introduction*, 2nd ed., 2018, chapter 13 (policy gradient methods, REINFORCE, baselines).
- [Gymnasium: CartPole](https://gymnasium.farama.org/environments/classic_control/cart_pole/) documentation.
