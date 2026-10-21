---
day: 4
minutes: 50
widgets: [moving-target]
quiz:
  - kind: why
    q: "DQN regresses $Q(s, a; \\theta)$ towards $y = r + \\gamma \\max_{a'} Q(s', a')$. Why does it compute $y$ with a frozen copy of the network instead of the live one?"
    choices:
      - "With the live net, every step towards $y$ also moves $y$."
      - "The frozen copy is a backup in case the training crashes."
      - "Two networks average out each other's noise, like an ensemble."
      - "The frozen copy picks the actions, so exploration stays steady."
    answer: 0
    explain: "$s'$ looks almost exactly like $s$ to the network, so a gradient step that pulls $Q(s, a)$ up drags $Q(s', a')$, and the target with it: a wild goose chase. The frozen copy is a photograph of the weights, retaken every $C$ steps, so the target holds still in between. It slows how fast an error in the target feeds back into itself. (Beat 2: the target moves with the weights.)"
  - kind: whatif
    q: "A DQN agent on a 50 Hz task drops its replay buffer and trains on each transition the moment it arrives, in order. The frozen target copy stays. What do you expect?"
    choices:
      - "Nothing changes, since the frozen copy already stabilises it."
      - "Faster training, because every sample is the freshest one."
      - "The max in the target stops being optimistic."
      - "Each update chases one moment and forgets the others."
    answer: 3
    explain: "At 50 Hz, 64 consecutive transitions are 1.28 s of one movement. Gradient descent assumes roughly independent samples; this is the opposite, so each update drags the whole network towards the current moment and it unlearns the rest. Sampling at random from a large buffer mixes old and new moments, which off-policy Q-learning allows. (Beat 3: consecutive samples are correlated.)"
  - kind: numbers
    q: "A network scores two actions that are both truly worth 50, and each guess is off by independent noise with standard deviation 2. On average, what does the max of the two guesses report?"
    choices:
      - "50.0: each guess is unbiased, so their max is too."
      - "48.9: the noise drags the max below the truth."
      - "51.1: the max keeps whichever guess ran high."
      - "54.0: the max lands two standard deviations high."
    answer: 2
    explain: "The expected maximum of two independent standard normals is $1/\\sqrt{\\pi} \\approx 0.56$, so the max reads $50 + 2 \\times 0.56 \\approx 51.1$. Each guess is unbiased, yet the max is not, because it always picks whichever guess happened to be high. That optimism goes into the target and gets learned. (Beat 4: a max over noisy guesses is optimistic.)"
  - kind: numbers
    q: "Rewards are at most 1 per step and $\\gamma = 0.99$. Your DQN logs a mean max Q of 250 while the return still looks fine. What does that tell you?"
    choices:
      - "Nothing yet: Q-values live on a different scale from returns."
      - "Q is above the honest ceiling of 100, so it is overestimating."
      - "The policy is about to beat the best return it has seen."
      - "Q is below the ceiling of 1000, so it is still healthy."
    answer: 1
    explain: "No honest $Q$ can exceed $R_{\\max}/(1-\\gamma) = 1/0.01 = 100$. A max Q of 250 means optimism in the target, or a target chasing itself, is being learned and copied forward. Log mean max Q next to the return: it often shows the divergence long before the return does. (Beat 4: a max over noisy guesses is optimistic.)"
  - kind: numbers
    q: "A task steps at 50 Hz, and each minibatch is the last 64 transitions in order. How much time does one minibatch cover?"
    choices:
      - "0.64 s"
      - "1.28 s"
      - "3.2 s"
      - "0.128 s"
    answer: 1
    explain: "64 steps at 20 ms each is 1.28 s, barely one movement of one episode. Every sample in it describes nearly the same state, so the minibatch carries far less information than its size suggests. A random draw from a buffer of many thousands of transitions spans many episodes instead. (Beat 3: consecutive samples are correlated.)"
  - kind: whatif
    q: "A Pong agent is given only the current frame as input, with no stack of earlier frames. What breaks?"
    choices:
      - "Nothing: the frame shows where the ball is, which is enough."
      - "The network is too small, since one frame has fewer pixels."
      - "It cannot see which way the ball moves, so it is not a state."
      - "The score can no longer be read off the screen."
    answer: 2
    explain: "One frame is a position without a velocity: the same picture fits a ball coming towards you and one going away, and the right action depends on which. The next frame is not predictable from it, so the Markov property quietly fails. Stacking the last four frames lets the network read motion from their differences. (Beat 5: one frame cannot show motion.)"
  - kind: why
    q: "Double DQN lets the online network pick the next action and the frozen copy score it. Why split the job between two networks?"
    choices:
      - "So the frozen copy gets trained as often as the online one."
      - "So the target needs only one forward pass per sample instead of two."
      - "So exploration comes from the two networks disagreeing with each other."
      - "So the noise that picks an action is not the noise that scores it."
    answer: 3
    explain: "A max over noisy guesses picks whichever guess happened to be high and then reports that same high guess. If the online net picked $a'$ only because its guess was lucky, the frozen copy's guess for $a'$ has no reason to be lucky too. The cost is one extra forward pass of the online net on $s'$. (Beat 4: a max over noisy guesses is optimistic.)"
  - kind: whatif
    q: "A task has a 500-step time limit that a good policy reaches every episode. Your replay buffer stores done = terminated or truncated, so the target is $y = r$ at the limit. What happens?"
    choices:
      - "Q is dragged down at the states where the policy is best."
      - "Nothing, because the frozen copy repairs the final targets."
      - "Q climbs above its ceiling, since the future is skipped."
      - "The buffer fills up faster and starts dropping old data."
    answer: 0
    explain: "A timeout is not a real end: the agent was doing fine and the rewards would have kept coming. Storing it as done tells the target the future is worth 0 exactly at the states a good policy reaches, so they are learned as worse than they are. Only `terminated` should zero the future. (Beat 3: consecutive samples are correlated.)"
---

**Goal:** scale Q-learning with a neural network, and stabilise it with a frozen target copy, a replay buffer and Double DQN.

## Where we left off

Day 3 ended on a Q-table with one cell per state-action pair, and the wheeled robot's state is ten continuous channels: no table is big enough. Chop each channel into 10 bins, which is coarse for a pitch angle, and the table already has $10^{10}$ rows per action. Almost all of them would never be visited, and the ones that are would learn nothing from their neighbours.

People wanted a function instead of a table long before deep learning. Gerald Tesauro's TD-Gammon (1992) already used a small network to judge backgammon positions. But for Q-learning the combination had a bad name: in 1997 John Tsitsiklis and Benjamin Van Roy showed that TD learning with function approximation can diverge, and practitioners knew the nonlinear case could be worse. In 2013 a DeepMind team (Mnih et al.) got Q-learning with a convolutional network to play seven Atari games from pixels. In 2015 the same group published the version in *Nature* that played 49 games with one architecture and one set of hyperparameters, and the fix that made the difference between the two papers is the subject of beat 2.

Their first attempt was the obvious one: keep Q-learning exactly as it was, and let a network stand in for the table.

## The picture

A Q-table is a phone book. To know how good a position is, you look it up, and if the position is not in the book, you know nothing. An experienced chess player does not work that way. They glance at a board they have never seen and say "this looks like positions that went well for me". That is generalisation, and it is what a network buys us: similar states get similar values, so one lesson spreads to the neighbours.

So the naive model is "replace the lookup with a judgement". The catch is that generalisation cuts both ways. When the player corrects their opinion of one position, their opinion of every similar position shifts too. On the robot, two states 10 ms apart look almost identical to a network. And in Q-learning the next state is exactly the one we use to check ourselves.

## Step by step

### Let a network guess Q

Start with what the table did. For every state it held one number per action, and acting meant reading the row and taking the best one, epsilon-greedy as on Day 3. A network can do the same job: feed it the state, and it returns one Q-value per action in a single forward pass.

For Atari the state is a stack of four 84×84 grayscale frames, the network is a few convolutional layers followed by fully connected ones, and the output is a short vector: Q for LEFT, Q for RIGHT, Q for SHOOT. For CartPole, the small task this page keeps returning to, the state is four numbers and the network is a 4-64-64-2 MLP. When the network is first initialised, these estimates are terrible. The hope is that training makes them less so.

The obvious way to train it is to keep Day 3's update and swap the table for the weights $\theta$. Recall the tabular rule:

$$
Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha \left[ R_{t+1} + \gamma \max_a Q(S_{t+1}, a) - Q(S_t, A_t) \right]
$$

There is no cell to overwrite any more, so we turn the bracket into a loss and let gradient descent shrink it:

$$
y = r + \gamma \max_{a'} Q(s', a'; \theta), \qquad L(\theta) = \big(y - Q(s, a; \theta)\big)^2
$$

::: tip
$y$ is the TD target: the reward we saw plus the discounted best guess for the next state. The bracket from Day 3, the TD error, is now squared and minimised. It is supervised regression, with a label we made up ourselves.
:::

That last phrase is where it goes wrong. In supervised learning the label comes from outside and holds still. Here $y$ contains $Q(s', a'; \theta)$, built from the same weights we are about to change.

### The target moves with the weights

So the network now predicts Q, and we train it the way tabular Q-learning always did: compare the prediction with the TD target and step the weights to close the gap.

Now here is the problem. We never had the real target, so we built it out of the network's own guess about the next state, and that guess comes from the same weights we are about to change. Every gradient step that pulls $Q(s, a)$ towards the target also moves the target, because $s'$ looks so much like $s$. It is a wild goose chase: the thing we are aiming at runs away about as fast as we approach it, and if one step drags $Q(s')$ along by more than it moves $Q(s)$, faster.

The obvious fix is to stop the target moving. Keep a second copy of the network, freeze it, and build every target from the frozen copy.

$$
y = r + \gamma \max_{a'} Q(s', a'; \theta^-), \qquad L(\theta) = \big(y - Q(s, a; \theta)\big)^2
$$

::: tip
$\theta$ is the network we train. $\theta^-$ is a photograph of it taken a while ago. The target only moves when we take a new photograph.
:::

Frozen forever would be wrong too, because the photograph would describe a network we stopped being long ago. So every $C$ steps we copy $\theta$ into $\theta^-$ and carry on. Below is a two-number toy of one update. The step on $Q(s)$ drags $Q(s')$ along by $k$, and $Q(s')$'s own samples slowly pull it back. Start in "Live target" with $k = 1.3$ and watch the chase run off, then switch to the frozen copy. Push $C$ up to 200 to see the photograph go stale.

<moving-target k="1.3" c="25" mode="live"></moving-target>

In the toy, the frozen copy does not change where the chase ends: with a small $k$ both modes settle on the same value, and the live one gets there sooner. What the photograph changes is how fast an error in the target feeds back into itself. Live, a bump in $Q(s')$ reaches the target on the very next step. Frozen, it has $C$ steps to be corrected by other samples first. That is the mechanism the 2015 paper gives: a delay between an update and its effect on the targets.

::: field
**Fixed Q-target, my TLDR.** Create a separate network with fixed weights to compute the TD target. Compare the original network's Q against it, take a gradient step, and every so often copy the weights across. Aim at a photograph, retake it every so often.
**Put it in:** always, for anything that bootstraps from its own network. **What goes wrong without it:** in a small CartPole DQN run over 3 seeds, $C = 1$ sent the median max Q to about $9 \times 10^9$ on a task where nothing can honestly exceed 100, and all 3 seeds evaluated at 9 or 10. With $C = 500$: 96.8 and 319. **What goes wrong with too large a $C$:** progress stalls on a stale photograph; the toy shows it at $C = 200$.
:::

So the target now holds still between photographs. But look at what we are regressing on. At step 4000 and step 4001 the cart has moved 20 ms. We are fitting a still target with samples that are all the same moment.

### Consecutive samples are correlated

The obvious way to feed the network is the order the world hands us transitions: act, store, train on the last few, repeat. In CartPole a minibatch of 64 consecutive transitions is about 1.3 s of one cart doing one thing. On the robot at 100 Hz it would be 0.64 s of one lean.

Gradient descent assumes its samples are roughly independent. These are the opposite. Each update drags all of the weights towards the current moment, and because the network generalises, it unlearns what it knew about other moments. Train on the first level of a game, move to the second, and it forgets how to play the first. That has a name, catastrophic forgetting, and it is the same generalisation that made the network worth having in the first place.

The fix is to break the order. Keep a replay buffer $\mathcal{D}$ of the last $N$ transitions, and train on random minibatches drawn from all of it:

$$
L(\theta) = \mathbb{E}_{(s, a, r, s') \sim U(\mathcal{D})} \Big[ \big( r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta) \big)^2 \Big]
$$

::: tip
Store every transition as it happens. When training, shuffle the deck: a minibatch mixes moments from many episodes, and every transition gets used many times instead of once.
:::

Why is training on old transitions allowed at all? Because Q-learning is off-policy, which Day 3 set up. The target uses the max over next actions, not the action the old policy took next, so a transition from 30,000 steps ago is still a fair sample of how the world responds to $(s, a)$. One more thing goes into each stored row: whether the episode really ended. The DQN paper sets $y = r$ when the episode terminates. As on Day 1, a timeout is not a termination, so only `terminated` zeroes the future.

::: field
**A replay buffer that genuinely refills is what off-policy buys.** DQN and SAC keep old transitions for a long time and sample them over and over, mixed with new ones. PPO cannot, because its ratio only makes sense for actions whose old opinion is close to the current one; data from a thousand iterations ago has no usable old opinion (Day 9). **Size:** larger than you think, and plan memory for it; Schulman's notes quote the DQN recipe as a 1M-frame buffer. **Be patient:** DQN converges slowly and has a long warm-up. **Evidence from the same CartPole runs:** with only the last 64 transitions to sample from, the mean evaluation over 3 seeds fell from 319 to 189.
:::

That settles the inputs to the loss. But look again at the target: the frozen copy still picks the next action with a max, and its guesses are noisy.

### A max over noisy guesses is optimistic

Early in training the network has not seen enough of each action, or of the neighbouring states, to know which is best. Its Q-values are mostly noise. The obvious move, and the one in every equation so far, is to trust the max anyway.

Take CartPole's two actions, both truly worth 50, with guesses off by noise of standard deviation 2. Each guess is unbiased. The max is not: it always picks whichever guess happened to come out high, and on average it reads about 51.1. That optimism goes into $y$, gets learned into $Q(s, a)$, and $Q(s, a)$ is the next-state value in somebody else's target. Non-optimal actions that are regularly over-scored make the learning complicated, and the false positive keeps getting copied forward.

$$
\mathbb{E}\Big[\max_{a'} \big(Q^*(s', a') + \epsilon_{a'}\big)\Big] \ge \max_{a'} Q^*(s', a')
$$

::: tip
The max of noisy guesses is, on average, higher than the max of the true values. The same draw of noise both chooses the action and scores it.
:::

The fix is to make choosing and scoring two different draws. We already have two networks, so use both: the online network picks the next action, and the frozen copy says what it is worth.

$$
y = r + \gamma \, Q\big(s', \arg\max_{a'} Q(s', a'; \theta); \theta^-\big)
$$

::: tip
The online net votes for an action. The photograph scores that action. If the online net picked $a'$ only because its own guess was lucky, the photograph's guess for $a'$ has no reason to be lucky too.
:::

That is Double DQN. Here is how the two networks split the work:

| Network | Role in $Q(s, a)$ | Role in the target $y$ | Updated |
|---|---|---|---|
| Online ($\theta$) | Computes the current $Q(s, a; \theta)$ | Selects the best next action $a'$ | Every step, by gradient descent |
| Target ($\theta^-$) | Not used | Evaluates $Q(s', a'; \theta^-)$ for that $a'$ | Every $C$ steps, copied from $\theta$ |

::: field
**Check the ceiling before the curve.** With reward at most $R_{\max}$ per step, no honest Q exceeds $R_{\max}/(1-\gamma)$: 100 for CartPole at $\gamma = 0.99$. Log the mean max Q next to the return. **Put Double DQN in when:** that number creeps above the ceiling, or keeps rising after the return has stopped. **Cost:** one extra forward pass of the online net on $s'$. **Watch out:** SB3's `DQN` has no Double flag; its target is the max of the frozen copy. **Evidence from the same CartPole runs:** Double DQN lowered the median final max Q from 96.8 to 89.7, but its evaluations (184, 500, 132) are too spread out for 3 seeds to say whether it played better. Prioritized Experience Replay and Dueling DQN are the next two refinements in the course; I have not used either, so they stay names here.
:::

Three fixes in a row, all about the loss: two for its target, one for its samples. Go back to the input, though. The Markov property from Day 1 came with a condition: as long as the state carries everything that matters. What exactly is $s$ here?

### One frame cannot show motion

The obvious state for Atari is the screen. Grayscale it and shrink it, since the colours add nothing: 210×160×3 becomes 84×84×1, and part of the screen can be cropped if it holds nothing useful. That cuts the input a lot.

Now look at one Pong frame. The ball is in the middle. Is it coming towards you or going away? One frame cannot say, and the right action depends on it. The frame is a position without a velocity, so the next frame is not predictable from it, and the Markov property quietly fails.

The fix is to hand the network a short stretch of time: stack the last four frames into one 84×84×4 input. With more frames you can see that the ball is going to the right. Then hand the network the stack as if it were the state, and keep that "as if" in mind.

$$
s_t = (x_{t-3}, \, x_{t-2}, \, x_{t-1}, \, x_t)
$$

::: tip
The state is no longer what the sensor sees now. It is what the sensor saw over the last four steps, oldest first. Motion is the difference between them, and the network can read it.
:::

::: field
**Frame stacking captures motion; my robot uses it too.** The wheeled-leg policy that runs on the ESP32 sees 40 numbers (Day 1's 36 were the August training recipe): 4 frames of 10 channels, with the two previous-action slots inside each frame, so stacking and action history are one mechanism. **When a stack, when a filter:** a stack keeps resolution, so it gives derivatives and lets the policy match issued actions to arriving responses. A filter gives reach at a fixed price: matching 95 % of our odometry filter's weight by stacking would need 14 frames, 140 inputs instead of 40. **Reset:** fill the stack with copies of the first frame, never zeros. Day 13 comes back to why calling the stack the state works, and where it does not.
:::

Five beats on one network, so a quick regroup. We let a network stand in for the Q-table and turned the Q-learning update into a regression loss. The label in that loss was built from the network itself, so we froze a copy and retook it every $C$ steps. The samples came in order, so we stored them and replayed them at random, which off-policy learning allows. The max in the target was optimistic, so we let the online net choose and the frozen copy score. And one frame was not a state, so we stacked four.

What none of this touched is the last line of the network: one output per button, and acting means taking the argmax. Every fix above assumed there is a short list of actions to take the max over.

## Pitfalls

- **"Sync every step" that is not every step (beat 2).** In SB3, `target_update_interval` counts environment steps and the sync runs between them. With the RL Zoo's CartPole settings (`train_freq=256`, `gradient_steps=128`), interval 1 still freezes the target for a burst of 128 gradient steps. An ablation that does not remove the frozen copy will tell you the frozen copy does not matter.
- **A max Q above the ceiling (beat 4).** The return can look fine while Q climbs past $R_{\max}/(1-\gamma)$. In the CartPole runs with $C = 1$, the divergence was obvious from max Q long before anything else. Log it.
- **A timeout stored as a fall (beat 3).** If the buffer row stores `terminated or truncated` as done, every transition at the 500-step limit is told the future is worth 0. In CartPole a good policy hits the limit every episode, so I would expect that to drag Q down exactly where the policy is best.
- **A buffer that is really a queue (beat 3).** A small buffer, or one sampled from the end, puts you back in correlated minibatches. Sampling from only the last 64 transitions cost the CartPole runs 130 points of mean evaluation (319 to 189).
- **A stack filled with zeros at reset (beat 5).** Four frames of zeros followed by one real frame look like a huge sudden motion. Fill the stack with copies of the first frame.

<!-- quiz -->

## Next

You might ask, why not just put DQN on the robot? Every beat above leaned on the network's last layer: one Q-value per button, and the action is whichever scores highest. That works for LEFT, RIGHT and SHOOT, or for CartPole's two pushes. A wheel motor takes any voltage in ±8 V, so there is nothing to take the max over. So we stop scoring buttons and learn the policy itself. That is [Day 5](../day05/).

## Sources

- `notes/chapter-3-deep-q-network-dqn.md` ([Notion](https://app.notion.com/p/28267249ddbf80f39edbddb99d6d0848)): my notes on Unit 3 of the [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit3/introduction), rewritten here. The architecture, the Atari preprocessing and frame stacking, the two phases of sampling and training, experience replay and catastrophic forgetting, fixed Q-targets and Double DQN come from the course. The wild goose chase, the fixed-Q-target TLDR and the Online vs Target table are mine.
- `STYLE.md` section 6: the rewrite of the fixed-Q-target section ("aim at a photograph, retake it every so often") that beat 2 uses.
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), the buffer recap: off-policy replay buffers that genuinely refill, and why PPO cannot have one. The POMDP section: frame stacking as "the same trick the old Atari agents used", filling the stack with the first frame at reset.
- `artifacts/station-keeping-policy-runner.html`: the deployed robot observation, 40 numbers as 4 frames of 10 channels, with the action slots inside each frame.
- `notes/design-insights-observations-actions-and-rewards.md` ([Notion](https://app.notion.com/p/3e467249ddbf814ebe4bdb138d4c6b2e)), "Filter or stack?": the 14-frame, 140-input comparison.
- `notes/deep-rl-hacks-schulman.md` ([Notion](https://app.notion.com/p/3e467249ddbf81039772e3df5492078f)), Q-learning tips: large buffers, the 1M-frame DQN recipe, long warm-up. Write-up: [github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks).
- `artifacts/rl-presentation-plan.html`, Slide 4: "a robot's motors can take any value, not just a few buttons, so there's nothing to simply pick from".
- J. Tsitsiklis and B. Van Roy, "An Analysis of Temporal-Difference Learning with Function Approximation", *IEEE Transactions on Automatic Control*, 1997.
- L.-J. Lin, "Self-Improving Reactive Agents Based on Reinforcement Learning, Planning and Teaching", *Machine Learning*, 1992 (experience replay).
- V. Mnih et al., "Playing Atari with Deep Reinforcement Learning", 2013 ([arXiv:1312.5602](https://arxiv.org/abs/1312.5602)); and "Human-level control through deep reinforcement learning", *Nature*, 2015.
- H. van Hasselt, "Double Q-learning", NIPS 2010; H. van Hasselt, A. Guez and D. Silver, "Deep Reinforcement Learning with Double Q-learning", AAAI 2016.
- [Gymnasium: CartPole](https://gymnasium.farama.org/environments/classic_control/cart_pole/) and [Stable-Baselines3 DQN](https://stable-baselines3.readthedocs.io/en/master/modules/dqn.html).
