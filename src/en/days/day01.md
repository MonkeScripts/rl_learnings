---
day: 1
minutes: 45
widgets: [rl-loop, gamma-horizon]
quiz:
  - kind: why
    q: "A balancing task pays up to +1 per step, and a good policy never falls. Why discount its return with $\\gamma < 1$ instead of just summing the rewards?"
    choices:
      - "So that the rewards collected earlier in the episode fade out."
      - "So that training runs faster, since smaller returns need fewer steps."
      - "Two balancers that never fall would both sum to infinity."
      - "Because a return without $\\gamma$ is undefined for continuous actions."
    answer: 2
    explain: "Without $\\gamma$ the sum $1 + 1 + 1 + \\dots$ never stops, so a good balancer and a slightly worse one both score infinity and cannot be compared. With $\\gamma < 1$ it is a geometric series bounded by $R_{\\max}/(1-\\gamma)$, and the far rewards, which we can predict least, also count least. Past rewards were never in $G_t$ to begin with. (Beat 5: the far future counts less.)"
  - kind: whatif
    q: "Episodes stop either at a fall or at a 10 s time limit, and the observation does not include the clock. Your loop sets the future to 0 at the time limit, exactly as after a fall. What goes wrong?"
    choices:
      - "Nothing: the time limit is part of the task, so it is a real end."
      - "The same upright state is worth nothing at 10 s and plenty at 3 s."
      - "$\\gamma$ silently becomes 1 on the last step of every episode."
      - "Rewards from before the time limit start counting in $G_t$."
    answer: 1
    explain: "A fall is a real end: no rewards follow. The time limit is us stopping the tape, and the rewards after it would have been there. The agent cannot see the clock, so zeroing the future at 10 s tells it that a perfectly good state is sometimes worthless, and the learning signal contradicts itself; that is why Gymnasium returns `terminated` and `truncated` separately. (Beat 6: two ways for an episode to end.)"
  - kind: numbers
    q: "A controller runs at 100 Hz with $\\gamma = 0.999$. A fall happens 900 steps after a decision. Roughly what weight does the fall get in that decision's return, and how far away is it in time?"
    choices:
      - "About 0.001, and 0.9 s away."
      - "About 0.41, and 9 s away."
      - "About 0.90, and 90 s away."
      - "About 0.37, and 10 s away."
    answer: 1
    explain: "$0.999^{900} = e^{900 \\ln 0.999} \\approx e^{-0.90} \\approx 0.41$, and 900 steps at 100 Hz is 9 s. A fall 9 s later still carries 41 % of its weight back to the decision: with this $\\gamma$ the agent really does care about things several seconds out. 0.37 is the weight at $k = 1000$, the effective horizon itself. (Beat 5: the far future counts less.)"
  - kind: numbers
    q: "A policy runs at 50 Hz with $\\gamma = 0.99$. What is its effective horizon $H = 1/(1-\\gamma)$, in steps and in seconds?"
    choices:
      - "100 steps, which is 2 s."
      - "100 steps, which is 0.5 s."
      - "50 steps, which is 1 s."
      - "1000 steps, which is 20 s."
    answer: 0
    explain: "$1/(1-0.99) = 100$ steps, and at 50 Hz each step is 20 ms, so 100 steps is 2 s. The same $\\gamma$ at 500 Hz would be only 0.2 s, which is why $\\gamma$ has to be chosen from physical time, not copied from a tutorial. By step $H$ a reward keeps about $e^{-1} \\approx 37$ % of its weight. (Beat 5: the far future counts less.)"
  - kind: numbers
    q: "An episode gives rewards 1, 2 and 4 on its three steps, then the agent falls and the episode terminates. With $\\gamma = 0.5$, what is the return $G_0$ from the first step?"
    choices:
      - "7"
      - "1.75"
      - "3"
      - "4"
    answer: 2
    explain: "Walk backwards with $G_t = R_{t+1} + \\gamma G_{t+1}$: after the fall the future is 0, so $G_2 = 4$, $G_1 = 2 + 0.5 \\cdot 4 = 4$ and $G_0 = 1 + 0.5 \\cdot 4 = 3$. Written out, that is $1 + 0.5 \\cdot 2 + 0.25 \\cdot 4$. 7 is the undiscounted sum, and 4 is the return one step later. (Beat 5: the far future counts less.)"
  - kind: why
    q: "The return $G_t$ used to judge a decision at step $t$ sums only the rewards after $t$. Why leave out the rewards earned before it?"
    choices:
      - "Because earlier rewards are already discounted to almost zero."
      - "Because storing every past reward would take far too much memory."
      - "Because the Markov property forbids looking at past rewards."
      - "Because a decision at $t$ cannot change what already happened."
    answer: 3
    explain: "Rewards before $t$ are already banked: nothing done at $t$ can change them, so they would only add the same constant to every choice. The return looks forward from the decision's own step. That is also why the episode score in the training logs is a different number from the $G_t$ the agent learns from. (Beat 4: the return adds up the future.)"
  - kind: whatif
    q: "A balancing policy observes only its tilt angle, with no angular velocity and no past frames. Nothing crashes. What goes wrong?"
    choices:
      - "Nothing: the tilt angle alone tells the policy which way to push."
      - "The reward can no longer be computed, so the training run stops."
      - "The discount $\\gamma$ has to be lowered to make up for the lost input."
      - "One tilt can mean falling or recovering, so the next step is unknown."
    answer: 3
    explain: "The Markov property needs the state to carry everything that matters for what happens next. A tilt of 5° on the way down and 5° on the way back up need different actions, and this observation cannot tell them apart. Nothing crashes; the policy just never gets good. Adding the velocity, or a few past frames, puts the missing piece back. (Beat 3: the past does not matter, as long as the state is good.)"
  - kind: why
    q: "A robot should balance in one place. Why is \"+1 for every step it has not fallen\" a poor reward for that?"
    choices:
      - "It pays the same for staying in place and for rolling away."
      - "It is positive, and only negative rewards can be learned."
      - "It changes every step, so the agent cannot predict it."
      - "It is too small to survive the discount $\\gamma$."
    answer: 0
    explain: "The agent does what it is paid for, not what we meant. A survival bonus pays for surviving anywhere, so drifting across the room scores exactly as well as holding the spot. If you care where, or how smoothly, the reward has to say so, for instance with a bonus for staying near the start. (Beat 2: we design the environment.)"
---

**Goal:** describe any control task as states, actions, rewards and a discounted return.

## Where we left off

Remember tuning PD gains to balance one robot? For the wheeled-leg robot that controller is $u = -K_p \cdot \text{pitch} - K_d \cdot \text{gyro}$: two numbers, chosen by hand, nudged up and down until it stopped falling. Now do that for every joint of a walking robot, in every movement it makes. Nobody tunes that by hand. The policy that balances the same wheeled-leg robot with reinforcement learning has about 4,600 numbers in it, and none of them were typed in by a person.

People hit this wall long before robots did. In 1957 Richard Bellman wrote sequential decision problems down as states, actions and a payoff at every step, and showed how to solve them when you already know the rules of the system. In 1992 Gerald Tesauro's TD-Gammon learned backgammon by playing against itself, paid only at the end of each game for winning or losing, and got to the level of strong human players. In 2013 a DeepMind team (Mnih et al.) trained one network to play seven Atari games straight from the screen pixels, with the game score as the only feedback.

Three very different problems, and the same first move each time, which is also the obvious one: stop writing the controller, and write down the loop it lives in instead.

## The picture

Hand a kid a game they have never seen. Nobody explains the rules. They press buttons, collect coins, run into an enemy and die, try again. After an afternoon they are good at it. That is the whole idea of RL in one scene: learn by interacting, with points as the only feedback.

So the naive model is "try things, keep what got points". It almost works for a robot. But look at what the kid was handed: a screen to look at, a controller with a few buttons, and a score in the corner. Somebody designed all three. The robot comes with none of them. Before any learning can happen, someone has to decide what the game even is, and on Day 1 that someone is us.

## Step by step

### Walking the loop once

Start with the game, because the pieces are easy to see there.

- The agent receives the state $S_0$ from the environment: the first frame of the game.
- Based on $S_0$ it takes the action $A_0$: it moves right.
- The environment moves to a new state $S_1$: a new frame.
- The environment hands back a reward $R_1$: we are not dead, $+1$.

Repeat that and the loop spits out a long chain of state, action, reward, next state:

$$
\tau = (S_0, A_0, R_1, S_1, A_1, R_2, S_2, A_2, R_3, \dots), \qquad A_t \sim \pi(\cdot \mid S_t)
$$

::: tip
$\tau$ (tau) is the trajectory, the tape of everything that happened. $\pi$ is the policy, the agent's brain: given the state, it says which action to take. Note the indexing: the reward for acting at $t$ arrives with the next state, so it is $R_{t+1}$.
:::

Step through it below. The policy is a coin toss, which is all we can afford before we know anything.

<rl-loop gamma="0.9" max-steps="20"></rl-loop>

Now swap the game for the wheeled-leg robot. The loop is identical, it just runs at 100 Hz: every 10 ms the policy reads a state, sends an action, and gets a reward. The crack is that none of these pieces came with the robot. A game designer gave the kid a screen, buttons and a score. Here we have a motor driver and an IMU.

### We design the environment

This might sound trivial, but it is the part that took me longest to accept: the environment of RL is wholly up to us. We decide what the agent can do, what it gets to see, and how it is paid.

For the wheeled-leg robot the first two are fairly mechanical:

- **Action:** two wheel voltages, each in $[-1, 1]$, scaled to $\pm 8$ V.
- **Observation:** 36 numbers: the IMU, the wheel speeds, the commands, and a short history of past frames.

The third is where it gets interesting. The obvious reward is "+1 for every step you have not fallen over". The problem is that it pays exactly the same for balancing on the spot and for balancing while rolling off across the room. The robot does what it is paid for, not what we meant. So the reward becomes our layer of perception: we take what we can measure and add our own metric of what counts as good.

```python
tip_pos = pos_err + l_com * sin(pitch)
tip_vel = ground_vel + l_com * pitch_rate * cos(pitch)

r =  1.0 * exp(-(tip_pos / 0.05)**2)      # position bonus
   - 0.1 * abs(tip_vel)                   # damping
   - 1.0 * norm(a - a_prev)**2            # slew
   - 0.3 * (gyro_z - cmd_yaw_rate)**2     # yaw
```

::: tip
Positive means favourable, negative means unfavourable. The only positive term asks for the tip of the robot to sit over the spot it started on; the other three charge for wobbling, for jerky voltage changes and for spinning when it was not told to.
:::

::: field
**The reward is the only feedback.** There is no label saying which voltage was right, only this one number per step. When a policy does something odd, read the reward before the network: it is usually doing exactly what this function pays for. Four terms, one positive, and every one of them was a decision. Day 12 takes it apart term by term.
:::

With the observation chosen, a quieter question is left over. At step 700 the agent has seen 700 frames. How many of them does it need to decide step 701?

### The past does not matter (as long as the state is good)

The obvious answer is "all of them, just in case". Feed the agent the whole history. At 100 Hz a 10 s episode is 1000 transitions, and the input grows with every step. No fixed-size network can take that, and most of it is useless anyway.

Think of a chess board in the middle of a game. You can pick a good next move from the board alone. You do not need to know how the pieces got there, because the position already carries everything that matters for what happens next.

<figure>
  <img src="../assets/img/day01/state-vs-observation.png" alt="Observation space slide: a chess board as a complete description of the state, a Mario frame as a partial observation">
  <figcaption>Left: a chess board is a full state, nothing is hidden. Right: a game frame is only an observation. Slide from the Hugging Face Deep RL Course, Unit 1.</figcaption>
</figure>

That is the Markov property, and it is one cool trump card for RL. The loop with this property is called a Markov decision process (MDP).

$$
P(S_{t+1} \mid S_t, A_t) = P(S_{t+1} \mid S_0, A_0, S_1, A_1, \dots, S_t, A_t)
$$

::: tip
Knowing the whole history tells you nothing more about the next state than knowing the current state and action. The present screens off the past.
:::

There is a catch in "as long as the state carries everything that matters". The robot's 36 numbers already include a few past frames, which is a hint that one IMU reading alone is not a complete state. We will lean on the Markov property for the next eleven days and re-open it on purpose on Day 13.

For now, take the payoff. If the past does not matter, then to judge how good a situation is we only need the reward right now plus the rewards we expect from here on. Hold on to that phrase, *expected future rewards*. It comes back in every Day that follows. The question is how to add them up.

### The return adds up the future

The obvious total is the one the game prints: the score for the whole episode. LunarLander, a standard Gymnasium task, does exactly that, and calls an episode solved at 200 points.

But the agent standing at step $t$ cannot change anything before $t$. Those rewards are already banked. What a decision at step $t$ can still affect is everything after it, so that is what we sum:

$$
G_t = R_{t+1} + R_{t+2} + R_{t+3} + \dots
$$

::: tip
$G_t$ is the return from step $t$: all the reward still to come. It does not include anything from before $t$.
:::

::: field
**$G_t$ sums future rewards, not past ones.** This tripped me up more than once. The episode score in the logs (`ep_rew_mean`) is the sum from step 0 to the end; the $G_t$ the agent learns from starts at its own step and looks forward. Two different numbers with similar names.
:::

Now here is the problem. A good balancer never falls. The position bonus pays up to 1 per step, forever, so its $G_t$ is $1 + 1 + 1 + \dots$, which is infinite. So is the $G_t$ of a slightly worse balancer that also never falls. Two infinities cannot tell us which policy is better. And even if the sum were finite, a reward 5000 steps from now is mostly a guess about what the world will look like then.

### The far future counts less

The obvious fix is a hard cut: only sum the next $N$ steps. That puts a cliff in the sum. A reward at step $N$ counts fully and the identical reward at $N+1$ counts for nothing, and $N$ is a number we pulled out of the air.

The smooth version is to shrink each reward a little more the further away it is. Pick a discount factor $\gamma$ between 0 and 1 and multiply the reward $k$ steps ahead by $\gamma^k$:

$$
G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \dots = \sum_{k=0}^{\infty} \gamma^k R_{t+k+1}
$$

::: tip
The next reward counts in full, the one after counts $\gamma$, then $\gamma^2$, and so on. Close to 1 means patient, close to 0 means only the next reward matters.
:::

That solves both halves of the problem at once. The uncertainty: far rewards, which we can predict least, count least. The divergence: if no reward is bigger than $R_{\max}$, the sum is a geometric series and stays finite.

$$
|G_t| \le \sum_{k=0}^{\infty} \gamma^k R_{\max} = \frac{R_{\max}}{1-\gamma}, \qquad H = \frac{1}{1-\gamma}, \qquad \gamma^{H} \approx e^{-1} \approx 0.37
$$

::: tip
$H$ is the effective horizon: roughly how many steps ahead the agent still cares about. By step $H$ a reward has lost about two thirds of its weight.
:::

For the robot, $\gamma = 0.999$ gives $H = 1000$ steps, which at 100 Hz is 10 s. A perfect balancer earning 1 per step therefore has a $G_t$ of about 1000, not infinity. Play with the numbers here, and watch what the same $\gamma$ means at a different control rate.

<gamma-horizon gamma="0.999" hz="100" k="900"></gamma-horizon>

There is one more way to write the sum that the next few Days will lean on hard. Pull out the first reward and what is left is the same sum, one step later:

$$
G_t = R_{t+1} + \gamma G_{t+1}
$$

So once an episode is over, every return can be computed backwards from the end. A three-step toy with $\gamma = 0.9$: rewards $1, 1, 0$, where the 0 is a fall. Then $G_2 = 0$, $G_1 = 1 + 0.9 \cdot 0 = 1.0$, $G_0 = 1 + 0.9 \cdot 1.0 = 1.9$. The fall at step 2 has lowered the return of step 0. That is credit assignment in miniature: every earlier step gets a share of the blame, shrinking by $\gamma$ per step. With $\gamma = 0.999$ the share 900 steps back is $0.999^{900} \approx 0.41$, still large. The grid widget above does the same backward walk when its episode ends.

::: field
**Choose $\gamma$ from physical time, not from a tutorial.** Convert $1/(1-\gamma)$ into seconds at your control rate and check it against the slowest thing the reward cares about. On the wheeled-leg robot a fall becomes unrecoverable in about half a second, but drifting off the spot takes seconds, so the horizon has to be longer than the drift: 0.999 at 100 Hz, about 10 s. The 0.99 that tutorials often use would be 100 steps, 1 s, at the same rate. Day 6 comes back to this when the horizon starts fighting the rollout length.
:::

So the sum runs to infinity on paper, and $\gamma$ keeps it finite. But the robot's episodes do not run to infinity. They stop at 45° of pitch or after 10 s, whichever comes first. Are those two endings the same thing?

### Two ways for an episode to end

Some tasks have a natural end. LunarLander finishes when the lander comes to rest (+100) or crashes (−100), and the next episode starts fresh. Those are episodic tasks. Others have no terminal state at all and would go on forever if we let them: a thermostat, a trading bot, or a robot whose whole job is to stand there and not fall. Those are continuing tasks.

<figure>
  <img src="../assets/img/day01/episodic-vs-continuing.png" alt="Type of tasks slide: Mario as an episodic task with a terminal state, stock trading as a continuing task with none">
  <figcaption>Episodic tasks have a terminal state, continuing ones do not. Slide from the Hugging Face Deep RL Course, Unit 1.</figcaption>
</figure>

Balancing is continuing at heart, and the obvious thing is to treat every stop as "the episode ended, nothing follows". That is right for one of the two stops and wrong for the other.

- **A fall (45° of pitch) is a real end.** The robot is on the floor, no more rewards come, and the return after it is 0.
- **The 10 s timeout is us stopping the tape.** The robot was upright and would have kept earning reward. We just stopped watching.

Gymnasium hands these back as two separate flags on every step, `terminated` and `truncated`, for exactly this reason. Written with the recursion from the last beat, a cut at step $T$ looks like this:

$$
G_t = \sum_{k=0}^{T-t-1} \gamma^k R_{t+k+1} + \gamma^{T-t} G_T, \qquad G_T = \begin{cases} 0 & \text{terminated} \\ \text{unknown} & \text{truncated} \end{cases}
$$

::: tip
The first part is the rewards we saw. The second part is everything after the cut. After a fall it is honestly zero. After a timeout it is a real number that we never got to see.
:::

::: field
**Vectorised environments step many seeded copies at once.** The wheeled-leg robot trains on 1024 copies in parallel. They run out of phase: some are just starting, some are mid-episode, some are falling, and each one resets on its own without waiting for the rest. So at almost every step some copy is hitting one of the two endings above, and getting the flags right is not an edge case.
:::

Let me regroup, because that was six beats in a row. We started with a loop of state, action, reward. We found that we design all three, that the Markov property lets the agent decide from the present alone, that the thing to maximise is the return $G_t$ of future rewards, that $\gamma$ keeps it finite and turns into a horizon in seconds, and that an episode can end for real or just be cut off.

What is still open is the awkward part of $G_t$ itself. It is built from rewards that have not happened yet. In the grid widget the $G_t$ column stays empty until the episode is over, and after a timeout it ends in "+ ?". One food for thought, which will pay off later: why not have a judge or a teacher that learns the environment alongside the agent and gives its own estimate of how things are going? It is like trying to score in football, but now with a coach watching.

## Pitfalls

- **A timeout treated as a fall (beat 6).** A hand-written loop that does `done = terminated or truncated` and sets the future to zero tells the agent that a perfectly good state near the time limit is worthless. SB3 handles the truncated flag for you; your own code has to do it on purpose.
- **$\gamma$ copied without converting to seconds (beat 5).** A $\gamma$ that worked at 50 Hz is a different horizon at 500 Hz. If the reward cares about something slower than $1/(1-\gamma)$ steps, the agent cannot see it, and I would expect it to ignore that term no matter how big its weight is.
- **Reading `ep_rew_mean` as $G_t$ (beat 4).** The training curve and LunarLander's 200 are undiscounted sums over whole episodes. The agent maximises the discounted return from each step. They usually rise together, but they are not the same number.
- **An observation that is not a state (beat 3).** If something that matters for the next step is missing from the observation, such as a velocity, the Markov property fails quietly. Nothing crashes; the policy just never gets good. Day 13 is about this.
- **Survival-only rewards (beat 2).** "+1 per step alive" pays for surviving anywhere. If you care where, or how smoothly, the reward has to say so.

<!-- quiz -->

## Next

You might ask, how is the agent supposed to use $G_t$ at all? At step 50 of an episode, $G_{50}$ needs every reward from step 51 onwards, and none of them have happened yet. We can wait for the episode to finish and walk backwards, but after a timeout part of it is never seen, and even a finished episode gives one noisy sample of what could have happened. So how do we judge a situation without playing the rest of the game out? That is [Day 2](../day02/).

## Sources

- `notes/chapter-1-introduction.md` ([Notion](https://app.notion.com/p/28167249ddbf80e297c0e6660444bb18)): my notes on Unit 1 of the [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit1/introduction), rewritten here. The loop walk-through, the reward hypothesis, the discounted return and the episodic/continuing split come from the course, and the two slides are theirs.
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), preface: "the environment is wholly up to us", the reward as a layer of perception, the actor-critic food for thought, and $\gamma = 0.999$ chosen from physics.
- `artifacts/rl-presentation-plan.html`, Slides 1 to 3: the PD-gains hook, the game walk-through, the chess-board Markov picture and "hold on to the phrase *expected future rewards*".
- `artifacts/wlbot-learning-log-aug-30.html`: wheeled-leg robot numbers (36 observations, two wheel voltages, the reward function, 45° / 10 s episode end, 1024 robots, the three-step $\gamma = 0.9$ toy, $0.999^{900} \approx 0.41$).
- `artifacts/manager-based-rl-env.html`: the robot's terminations, with `time_out` marked as truncation, not failure.
- R. Bellman, "A Markovian Decision Process", *Journal of Mathematics and Mechanics*, 1957; and *Dynamic Programming*, Princeton University Press, 1957.
- G. Tesauro, "Practical Issues in Temporal Difference Learning", *Machine Learning*, 1992; and "Temporal Difference Learning and TD-Gammon", *Communications of the ACM*, 1995.
- V. Mnih et al., "Playing Atari with Deep Reinforcement Learning", NIPS Deep Learning Workshop, 2013 ([arXiv:1312.5602](https://arxiv.org/abs/1312.5602)).
- R. Sutton and A. Barto, *Reinforcement Learning: An Introduction*, 2nd ed., 2018, chapter 3 (MDPs, returns, episodic and continuing tasks).
- [Gymnasium: LunarLander](https://gymnasium.farama.org/environments/box2d/lunar_lander/) and [Stable-Baselines3](https://stable-baselines3.readthedocs.io/) documentation.
