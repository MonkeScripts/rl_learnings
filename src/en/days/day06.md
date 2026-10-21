---
day: 6
minutes: 45
widgets: [gaussian-policy, gamma-horizon]
quiz:
  - kind: why
    q: "A policy-gradient method trains a controller whose action is a motor voltage. Why does the policy output a mean and a standard deviation and sample the voltage, instead of outputting one voltage per state?"
    choices:
      - "A motor driver needs a slightly noisy command to break static friction at low speed."
      - "Random voltages make the deployed controller robust to pushes and to modelling errors."
      - "A fixed voltage per state never tries an alternative, so there is nothing to compare and no log-probability."
      - "A neural network cannot output an unbounded continuous number unless it outputs a distribution."
    answer: 2
    explain: "The gradient weights each action by $\\nabla_\\theta \\log \\pi_\\theta(a \\mid s)$ times how much better than usual it did. A fixed voltage has no probability to take the log of, and every trial in a state is the same trial, so \"better than usual\" is zero every time. Sampling around the mean turns each step into a small experiment. At deploy time we take the mean and the noise is gone, so robustness is not the reason. (Beat 1: one action explores nothing.)"
  - kind: why
    q: "Q-learning can explore with an outside rule such as $\\varepsilon$-greedy. Why must a policy-gradient method, whose gradient is $\\mathbb{E}_{a \\sim \\pi_\\theta}[\\nabla_\\theta \\log \\pi_\\theta(a \\mid s)\\, A]$, explore with the policy's own sampling noise?"
    choices:
      - "The average is over actions $\\pi_\\theta$ itself drew; actions another rule picked make it point somewhere else."
      - "Outside noise is too large for a continuous action and would saturate the motor on most steps."
      - "Q-learning only works with discrete actions, so its exploration rule cannot be reused here."
      - "An outside exploration rule cannot be switched off at deploy time, but the policy's own noise can."
    answer: 0
    explain: "The subscript under the expectation is the whole point: the actions have to come from $\\pi_\\theta$, the policy being differentiated. Q-learning's update uses only the best next action, never the probability of the one taken, so it can learn from anyone's behaviour. A policy gradient cannot, and that is what on-policy means: the data, and the noise in it, must come from the policy as it is now. (Beat 2: whose noise? Why it has to be the policy's own.)"
  - kind: why
    q: "A Gaussian policy's standard deviation $\\sigma$ could shrink on a fixed schedule, like a decaying $\\varepsilon$. Why is it usually a learned parameter instead?"
    choices:
      - "A schedule would make the policy deterministic too early, before it is ready to deploy."
      - "A learned $\\sigma$ always grows over training, which keeps the policy exploring to the end."
      - "A schedule needs the total number of iterations, which is unknown when training starts."
      - "A schedule only knows the iteration count; a learned $\\sigma$ narrows when wide samples keep losing."
    answer: 3
    explain: "$\\sigma$ gets a gradient from the same experiments as the mean: $\\partial \\log \\pi / \\partial \\log \\sigma = \\varepsilon^2 - 1$. Once the mean is good, far samples mostly score below average and the update narrows $\\sigma$; while far samples still win, it stays wide. A schedule cannot tell those two situations apart. Shrinking is the exploit side, and nobody has to time it. (Beat 3: shrinking the noise is the exploit side.)"
  - kind: whatif
    q: "A balancing robot runs its policy at 100 Hz with $\\gamma = 0.999$. A bad action makes a fall unrecoverable within about 0.5 s; drifting off its spot costs reward about 3 s later. Someone changes $\\gamma$ to 0.99. What would you expect?"
    choices:
      - "It still balances, but a drift 3 s out keeps only about 5 % of its weight, so it wanders off."
      - "Nothing changes: over a 10 s episode, 0.99 and 0.999 both weight every step close to 1."
      - "It holds its spot but falls more: a fall 0.5 s out keeps only about 5 % of its weight."
      - "It both falls and wanders: the fall and the drift each keep under 10 % of their weight."
    answer: 0
    explain: "$1/(1-0.99) = 100$ steps, 1 s at 100 Hz. A fall 50 steps away still weighs $0.99^{50} \\approx 0.61$, so balancing stays visible. A drift 300 steps away weighs $0.99^{300} \\approx 0.05$ instead of $0.999^{300} \\approx 0.74$, so the position term mostly drops out of what the policy can see. The horizon has to be longer than the slowest thing the reward cares about. (Beat 5: actions have consequences, so how far ahead do we look?)"
  - kind: whatif
    q: "A Gaussian policy starts with $\\sigma = 1.0$. From iteration 0 you add a full-weight penalty on $|a_t - a_{t-1}|$, where $a_t$ is the sampled action actually sent to the motors. What would you expect to happen to exploration?"
    choices:
      - "Nothing: $\\sigma$ is a separate parameter from the mean, so the penalty cannot reach it."
      - "$\\sigma$ collapses early, because sampling noise is itself step-to-step change and is charged."
      - "$\\sigma$ grows, because the policy needs more exploration to find smooth actions."
      - "Only the deployed policy gets smoother; behaviour during training is unchanged."
    answer: 1
    explain: "Exploration noise is exactly the kind of change the penalty charges for, so the cheapest way to cut the penalty is to stop exploring. On one legged robot with such a penalty from the start, $\\sigma$ fell from 1.0 to 0.3 within 100 iterations and the behaviour the rewards were built for never appeared; tripling the entropy bonus did not hold it back. Ramp such penalties in after the skill forms. (Beat 4: how much exploration is left; the field note on smoothness penalties.)"
  - kind: numbers
    q: "A Gaussian policy has two independent action dimensions, each with $\\log\\sigma = -1.6$. Per dimension the entropy is $H = \\log\\sigma + 1.419$ nats. What total entropy does the logger report, and what does its sign mean?"
    choices:
      - "About $+0.36$ nats: the policy is still exploring widely."
      - "About $-0.36$ nats: $\\sigma \\approx 0.20$ is below 0.242, nothing is wrong."
      - "About $-3.2$ nats: the policy has collapsed and stopped exploring."
      - "It cannot be negative, so the logger has a sign bug."
    answer: 1
    explain: "Per dimension $-1.6 + 1.419 = -0.181$, and independent dimensions add, so the total is about $-0.36$. A Gaussian's differential entropy goes negative whenever $\\sigma < 1/\\sqrt{2\\pi e} \\approx 0.242$, and $e^{-1.6} \\approx 0.20$. The sign is not a diagnosis; a fast slide towards very negative values would be. (Beat 4: how much exploration is left, and why it goes negative.)"
  - kind: numbers
    q: "A policy runs at 50 Hz, and the slowest consequence the reward cares about shows up about 5 s after the action. Using $\\gamma = 1 - \\Delta t / T_{\\text{slow}}$, which $\\gamma$ do you pick, and how many steps is its horizon $1/(1-\\gamma)$?"
    choices:
      - "$\\gamma = 0.98$, a 50-step horizon."
      - "$\\gamma = 0.99$, a 100-step horizon."
      - "$\\gamma = 0.9999$, a 10 000-step horizon."
      - "$\\gamma = 0.996$, a 250-step horizon."
    answer: 3
    explain: "$\\Delta t = 1/50 = 0.02$ s, so $\\gamma = 1 - 0.02/5 = 0.996$ and $1/(1-\\gamma) = 250$ steps, which is 5 s at 50 Hz. 0.98 is a 1 s horizon and would miss the slow consequence; 0.9999 looks 200 s ahead for nothing. Pick $\\gamma$ in seconds, not in steps. (Beat 5: actions have consequences, so how far ahead do we look?)"
  - kind: numbers
    q: "For a Gaussian policy, $\\partial \\log \\pi / \\partial \\log \\sigma = \\varepsilon^2 - 1$, where $\\varepsilon$ is how many $\\sigma$ the sample landed from the mean. One sample lands at $\\varepsilon = 0.5$ with advantage $+1$; another at $\\varepsilon = 2$ with advantage $-1$. Which way do these two push $\\sigma$?"
    choices:
      - "Wider: the summed signal is $+3.75$, so $\\log\\sigma$ goes up."
      - "Unchanged: one advantage is $+1$ and the other $-1$, so they cancel."
      - "Narrower: the summed signal is $-3.75$, so $\\log\\sigma$ goes down."
      - "Wider: any sample beyond $1\\sigma$ always widens $\\sigma$."
    answer: 2
    explain: "Each sample contributes $(\\varepsilon^2 - 1) A$: $(0.25 - 1)(+1) = -0.75$ and $(4 - 1)(-1) = -3$, summing to $-3.75$. The near sample won and the far one lost, so the gradient says stop wasting far samples and narrows $\\sigma$. Had the far one won, the same arithmetic would widen it. (Beat 3: shrinking the noise is the exploit side.)"
---

**Goal:** explain how a continuous-control policy explores and then exploits, read its entropy without panicking, and pick $\gamma$ from the robot's physics.

## Where we left off

Day 5 ended with a softmax over two buttons and a wheel that wants a voltage. CartPole's policy explores for free: it puts a probability on "left" and a probability on "right", and every step is a draw. The wheeled-leg robot's motor takes any number in $\pm 8$ V. There is no list of buttons to put probabilities on, so what does a stochastic policy over a voltage even look like, and where does its exploration come from?

This wall is older than deep RL. In 1990 Vijaykumar Gullapalli built a "stochastic real-valued" unit that output a mean and a spread, drew its action from a normal distribution, and moved the mean towards actions that did better than expected. Two years later Ronald Williams showed that the same trick falls straight out of REINFORCE for Gaussian units, mean and standard deviation both learned. In 2015 and 2016 Schulman and colleagues trained TRPO on simulated robots with exactly that shape: a network for the mean, plus one free log standard deviation per action dimension, the same in every state. PPO and the robot's training code inherited it unchanged.

The obvious first attempt, and mine, is the one a control engineer makes: let the network output the voltage.

## The picture

Day 5's picture was tuning PD gains by hand, and it hides a detail. $K_p = 50$ wobbles, $K_p = 55$ wobbles less, so increase $K_p$: that conclusion needed two different trials. A single run at 50 tells you nothing about which way to go.

So the naive model of a policy is a very large PD law: state in, voltage out, tuned by trial. Day 5 replaced the trying-by-hand with a gradient, but the gradient still needs trials to compare. A network that maps each state to one voltage never tries anything else in that state, so there is no second trial to compare against. Somewhere, the policy itself has to do the wobbling.

## Step by step

### One action explores nothing

Put the robot in one state. The network says $U = 3.0$ V. Next time it meets the same state it says 3.0 V again, and the time after. Day 5's gradient needs $\nabla_\theta \log \pi_\theta(a \mid s)$, the log of the probability of the action taken, and "always 3.0 V" has no probability to take the log of. Even if we fake it, every trial in that state is the same trial, with the same reward, so "was this better than usual?" is zero every time. On a one-dimensional toy policy, a deterministic version sits at the same voltage for 300 iterations with an advantage spread of exactly 0.0000.

The fix is to perturb the output instead of the gains. The network outputs a mean action $\mu_\theta(s)$, a separate parameter holds a standard deviation $\sigma$, and the action is drawn around the mean:

$$
a = \mu_\theta(s) + \sigma \varepsilon, \quad \varepsilon \sim \mathcal{N}(0, 1), \qquad \log \pi_\theta(a \mid s) = -\frac{1}{2}\left(\frac{a - \mu_\theta(s)}{\sigma}\right)^2 - \log \sigma - \frac{1}{2}\log 2\pi
$$

::: tip
$\mu$ is the best guess. $\sigma$ is how far the policy is allowed to wander from it. The log-probability is a closed formula, so every sampled voltage comes with the number Day 5's gradient needs.
:::

The noise is the exploration. It is not there to make the robot random; it is there so the same state gets tried with slightly different actions. In a given state the mean says 3.0 V, the sample says 3.4 V, and the episode goes on. If that step turns out better than expected, the update says "in that state, make 3.4 more likely", which pulls the mean towards 3.4. Every sampled action is a tiny experiment, and with 1024 robots taking 128 steps each, that is 131 072 experiments per iteration. No noise, no experiments, no gradient.

::: field
**What the checkpoint actually holds.** On the wheeled-leg robot $\sigma$ is `distribution.std_param`: two numbers, one per wheel, not an output of the network and not different per state. Microduck does the same with 14 of them, one per joint. A state-dependent $\sigma$ is possible but harder to train, and for locomotion roughly uniform exploration is what you want anyway.
:::

That leaves a question about whose noise this is. The sample came out of the policy's own distribution. Could it just as well come from somewhere else?

### Whose noise? Why it has to be the policy's own

The obvious alternative is to keep the network deterministic and add the noise from outside: jiggle the voltage with some separate exploration rule, the way Day 3's $\varepsilon$-greedy GPS takes a random turn now and then. Or go further and keep one network for exploring and another for exploiting. That is Day 3's off-policy family: one policy acts, a different one is learned. Q-learning gets away with it because its update only uses the best next action, not the probability of the action that was taken.

The policy gradient cannot. Look at where the expectation lives:

$$
\nabla_\theta J(\theta) = \mathbb{E}_{a \sim \pi_\theta(\cdot \mid s)}\left[\nabla_\theta \log \pi_\theta(a \mid s)\, A\right]
$$

::: tip
The subscript under $\mathbb{E}$ is the whole point: the actions have to be drawn from $\pi_\theta$, the policy we are differentiating. If something else picked the voltage, $\log \pi_\theta$ is the log-probability of a draw that $\pi_\theta$ never made, and the average points somewhere else. $A$ stands for how much better than usual the action did; for now read it as Day 5's centred $G$, and Day 7 builds it properly.
:::

So we want an on-policy method. On-policy means the policy learns from its own most recent behaviour: the data we train on has to come from the policy as it is right now, and the noise in it has to be the policy's own $\sigma$. The moment we update the weights, the old data is technically stale. Hold on to that sentence; Day 8 ends on it and Day 9 is built around it.

For now the noise is ours and it is learned. But it starts loud. With $\sigma$ at its initial value the wheel gets about $\pm 3$ V of scatter on an 8 V range, which is a lot of wobble for a robot that is supposed to stand still. Who turns it down?

### Shrinking the noise is the exploit side

The obvious answer is a schedule: start wide and decay $\sigma$ by hand, the way $\varepsilon$ usually decays in Day 3's Q-learning. The problem is that a schedule knows only the iteration number. It cannot tell a state where precision pays off from one where the policy is still lost.

Nobody has to schedule it, because $\sigma$ gets a gradient from the same experiments as $\mu$:

$$
\frac{\partial}{\partial \log \sigma} \log \pi_\theta(a \mid s) = \varepsilon^2 - 1, \qquad \sigma_0 = e^{-1} \approx 0.37
$$

::: tip
A sample far from the mean has $\varepsilon^2 > 1$ and a sample close to it has $\varepsilon^2 < 1$. If the far ones keep scoring negative advantages and the near ones positive, the update shrinks $\sigma$; if the far ones win, it widens it.
:::

Early on, a wide sample is as likely to be good as bad, and $\sigma$ stays wide. As the mean gets good, wide samples mostly score below average and the gradient narrows $\sigma$ to stop wasting them. The std starts big at $e^{-1}$, about 0.37 of the action range (`log_std_init = -1`), and the policy shrinks it where being precise pays off. Shrinking is the exploit side of explore and exploit.

At the end we do not sample at all. We just take the mean, so the deployed policy is deterministic: the noise was scaffolding for learning, not part of the controller. Try it here. Press **Shrink σ** to watch explore turn into exploit, then switch to **Deploy**.

<gaussian-policy mu="0.2" sigma="0.37" volts="8"></gaussian-policy>

::: field
**Deploy the mean, and evaluate the mean.** The robot's evals run the mean action with no noise, over 1000 full episodes each: two pre-registered evals read 0.910 and 0.914 survival. The training curve's episode length is measured with the noise on, a different set of 1024 randomised robots every iteration, and wanders between 911 and 975 steps between iterations 1500 and 2999 without the policy changing much. Training curves lie a little and only the gates count.
:::

On the robot, "where" deserves some suspicion: with two state-independent numbers, $\sigma$ can only shrink on average over the states the robot visits, not state by state. And with 2 wheels, or Microduck's 14 joints, we need a single number that says how much exploring is left.

### How much exploration is left, and why it goes negative

The obvious number is $\sigma$ itself. That works for two wheels and gets awkward for fourteen joints, so every PPO logger prints the entropy of the action distribution instead. For a Gaussian it has a closed form, per action dimension:

$$
H = \ln\left(\sigma\sqrt{2\pi e}\right) = \log\sigma + 1.419, \qquad H = 0 \iff \sigma = \frac{1}{\sqrt{2\pi e}} \approx 0.242
$$

::: tip
Entropy is the log of how spread out the distribution is. Independent dimensions add, so the robot's total is the sum over both wheels. $\sigma_0 = 0.37$ gives $+0.42$ nats per wheel. With $n$ dimensions the total is $n(\log\bar\sigma + 1.419)$, where $\bar\sigma$ is the geometric mean of the $\sigma$s, so the logged total crosses zero when that mean crosses 0.242. On a 14-joint robot one joint can be very narrow while the total stays positive.
:::

Now here is the problem. In the discrete world of Day 5, entropy is never negative, and a log that shows $-0.5$ looks like a bug. It is not. This is a differential entropy, and it crosses zero at $\sigma \approx 0.242$ for no deeper reason than units: it is just the point where the bell gets narrower than $1/\sqrt{2\pi e}$. It is a tug-of-war. When the policy finds a good action it shrinks $\sigma$ to exploit, and entropy goes negative; when it meets a new state or a penalty it widens $\sigma$ to explore, and entropy goes positive. The sign itself means nothing.

PPO's loss has a knob that leans on this tug-of-war, the entropy bonus:

$$
L = L^{\text{policy}} + c_v L^{\text{value}} - c_H \, H
$$

::: tip
A positive `ent_coef` ($c_H$) pays the policy for staying uncertain. It is a constant upward pressure on $\sigma$, in every state, at every update. It never says "decrease".
:::

On the robot `ent_coef` is 0. The std is already learned, the downward pull comes from the policy loss itself, and we do not want the robot told to stay noisy. If a run ever shows the std diving while episode length is still low, this is the first knob. Typical values are 0.01 for discrete actions and often 0 for continuous control.

::: field
**Entropy crosses zero at σ ≈ 0.242, so watch the trend, not the sign.** A slow drift negative is a policy committing. A fast collapse is a policy that stopped exploring; rapid, large swings late in training are the instability sign. The Microduck notes give a rule of thumb for `mean_std`: from 1.0 down to about 0.2 to 0.4 for a healthy walker, and below 0.1 within a few hundred iterations means it converged too early. Day 10 reads these phases off real curves.
:::

::: field Field notes: a smoothness penalty is a tax on exploration
Any term that charges for the action changing between steps also charges the noise, because the noise is exactly that kind of change. Microduck on roller skates had an action-rate penalty at −1.0 from the first iteration: the std fell from 1.0 to 0.3 within 100 iterations and stayed there for 50k, and glide, the behaviour several rewards were built for, never appeared. Tripling the entropy bonus from 0.01 to 0.03 did not hold it back. On the wheeled-leg robot a slew weight of 10.0 produced a policy that was "quiet, not balanced": std 0.34 → 0.09 and episode length falling. Ramp such penalties in after the skill forms.
:::

So the policy can now try 3.4 V where its mean says 3.0 V, and it knows how much trying it has left. But was 3.4 V better? The answer does not come back at the next step.

### Actions have consequences: how far ahead do we look?

In RL our actions have consequences; they affect the future. That is the control-theory picture we started from, $\dot{x} = f(x, u)$: the voltage now sets the wheel's torque, which moves the pitch over the next few steps, which moves the robot's position over the next few seconds. Circling back to Day 1's central equation:

$$
G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \dots, \qquad H = \frac{1}{1-\gamma} \text{ steps}
$$

The obvious move is to copy $\gamma = 0.99$ from a tutorial. At 100 Hz that is a 100-step horizon, 1 s. The reward cares about two time scales. A fall becomes unrecoverable in about half a second, which a 1 s horizon sees. Drifting off the spot takes seconds, which it does not: a drift that costs reward 3 s after the decision weighs $0.99^{300} \approx 0.05$. I would expect such a policy to balance and wander, though nobody has run that arm on the robot.

So $\gamma$ is chosen from the physics, not the tutorial: the horizon has to be longer than the slowest thing we care about.

$$
\gamma = 1 - \frac{\Delta t}{T_{\text{slow}}}, \qquad \Delta t = 0.01\ \text{s},\ T_{\text{slow}} = 10\ \text{s} \;\Rightarrow\; \gamma = 0.999
$$

::: tip
Pick the slowest consequence in seconds, divide the control period by it, and subtract from 1. For the robot: 1000 steps, 10 s, the whole episode.
:::

With 0.999 the same drift 3 s out keeps $0.999^{300} \approx 0.74$ of its weight. Set $\gamma$ to 0.99 below and watch the weight at $k = 300$ fall from 0.74 to 0.05.

<gamma-horizon gamma="0.999" hz="100" k="300"></gamma-horizon>

::: field
**γ = 0.999 ≈ 1000 steps ≈ 10 s at 100 Hz, longer than the slowest thing we care about.** Schulman's nuts-and-bolts list says the same from the other side: for TD-style value estimates, $\gamma$ close to 1, such as 0.999, tends to be stable. And discount in exactly one place. The algorithm forms the discounted sum itself, so a reward that is already a discounted return gets discounted twice and stops being a function of the current state and action. Return-conditioned methods that divide by $\gamma$ instead blow up: $\gamma^{-T}$ at 0.99 over 1000 steps is about $2.3 \times 10^4$.
:::

Which leaves the 3.4 V experiment with a long echo. Its consequences arrive over the next 1000 steps, mixed with the consequences of every sample after it.

Five beats, all about one voltage, so let me regroup. A deterministic voltage explores nothing, so the policy outputs a mean and a learned $\sigma$ and samples around the mean: the noise is the exploration. The noise has to be the policy's own, because the gradient is an average over the policy's own draws, which is what on-policy means. $\sigma$ shrinks by itself where precision pays, which is the exploit side, and at deploy time we take the mean. Entropy tells us how much exploring is left, goes negative at $\sigma \approx 0.242$ without anything being wrong, and on the robot is left alone with `ent_coef = 0`. And $\gamma = 0.999$ makes the policy look 10 s ahead, past the slowest drift the reward cares about.

What is still open is how each experiment gets its score, when its consequences arrive over 1000 steps.

## Pitfalls

- **Evaluating with the noise on (beat 3).** The training curve's episode length includes the exploration noise and a fresh set of randomised robots every iteration. Compare checkpoints with the mean action over many full episodes, which is what the deployed robot runs.
- **Reading the entropy's sign (beat 4).** A Gaussian's entropy goes negative as soon as $\sigma < 0.242$. "Entropy went negative" is not a bug report; "entropy fell by 2 nats in 100 iterations while episode length stayed low" is.
- **A penalty that pays the policy to stop exploring (beat 4).** Action-rate, slew and jerk terms charge the noise too. If the std dives in the first hundred iterations right after you add one, suspect the penalty before the learning rate. Raising `ent_coef` did not rescue it on Microduck.
- **Storing the clipped action (beat 2).** The motor saturates at $\pm 1$, but the log-probability has to be of the action the Gaussian actually drew. SB3 stores the raw sample and clips only on the way to the env; a hand-written loop that stores `clip(a)` computes the gradient for a draw the policy never made.
- **$\gamma$ chosen in steps (beat 5).** Convert $1/(1-\gamma)$ to seconds and hold it against the slowest consequence the reward cares about. If it is shorter, I would expect that term to be ignored no matter how big its weight is.

<!-- quiz -->

## Next

You might ask, how does the 3.4 V experiment get its score? γ = 0.999 means an action echoes for about 1000 steps. REINFORCE waits for the whole episode and scores every action with one noisy $G$. Learning from 1000-step episodes in one piece will not work, and [Day 7](../day07/) cuts them up.

## Sources

- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)): PPO story beats 1 and 2 ("Why on-policy, and where the noise comes from", "Consequences, rewards and the horizon"), the unfinished "Off-policy vs On-policy" and the exploration/exploitation definitions in the preface, "Entropy bonus", and "Entropy flipping between positive and negative" under Tuning experiences. "The noise is the exploration", "shrinking is the exploit side" and "the horizon has to be longer than the slowest thing we care about" are from there.
- `artifacts/wlbot-learning-log-aug-30.html`, Session 2: the PD-tuning comparison, the 3.0 V / 3.4 V experiment, "every sampled action is a tiny experiment, 131 072 of them per iteration", `distribution.std_param`, the ±3 V of scatter, why `ent_coef` is 0, the slew-weight 10.0 failure (std 0.34 → 0.09), and the eval numbers.
- `artifacts/rl-presentation-plan.html`, Slide 5 (the policy network): mean = best guess, std = exploration, training samples, deployment takes the mean.
- `artifacts/removing-more-made-it-better.html`, bonus section "Two ways discounting goes wrong" and its gamma slider: $\gamma^{-T} \approx 2.3 \times 10^4$, and discounting in one place.
- `artifacts/roller-model-inquisition.html`: "a smoothness penalty is also a tax on exploration" (std 1.0 → 0.3 within 100 iterations, entropy bonus 0.01 → 0.03, glide never appeared).
- `notes/microduck-takeaways.md` ([Notion](https://app.notion.com/p/3dc67249ddbf80a9a46bfe303aab4f37)): the Gaussian log-probability, one scalar std per joint, and the `mean_std` rule of thumb.
- `notes/deep-rl-hacks-schulman.md` ([Notion](https://app.notion.com/p/3e467249ddbf81039772e3df5492078f)), from J. Schulman, "The Nuts and Bolts of Deep RL Research", Deep RL Bootcamp, 2017: watch entropy, compute it analytically for a Gaussian, and $\gamma$ near 0.999. Write-up: [github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks).
- The exploration/exploitation definitions follow Unit 1 of the [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit1/exp-exp-tradeoff), rewritten here.
- V. Gullapalli, "A stochastic reinforcement learning algorithm for learning real-valued functions", *Neural Networks*, 1990.
- R. J. Williams, "Simple statistical gradient-following algorithms for connectionist reinforcement learning", *Machine Learning*, 1992 (REINFORCE with Gaussian units).
- J. Schulman et al., "Trust Region Policy Optimization", ICML 2015 ([arXiv:1502.05477](https://arxiv.org/abs/1502.05477)), and "High-Dimensional Continuous Control Using Generalized Advantage Estimation", ICLR 2016 ([arXiv:1506.02438](https://arxiv.org/abs/1506.02438)): Gaussian policies with a network mean and state-independent log standard deviations.
- R. Sutton and A. Barto, *Reinforcement Learning: An Introduction*, 2nd ed., 2018, section 13.7 (policy parameterisation for continuous actions).
- [Stable-Baselines3 PPO](https://stable-baselines3.readthedocs.io/en/master/modules/ppo.html) (`log_std_init`, `ent_coef`) and [Gymnasium Pendulum](https://gymnasium.farama.org/environments/classic_control/pendulum/) documentation.
