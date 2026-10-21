---
day: 3
minutes: 50
widgets: [q-table]
quiz:
  - kind: why
    q: "Monte Carlo learns $V$ from complete returns $G_t$, with no model. Why does TD replace that target with $R_{t+1} + \\gamma V(S_{t+1})$?"
    choices:
      - "Because $R_{t+1} + \\gamma V(S_{t+1})$ is always closer to the truth."
      - "Because Monte Carlo needs the transition model and TD does not."
      - "So it can update after every step instead of at the episode's end."
      - "So that the discount $\\gamma$ can be dropped from the update."
    answer: 2
    explain: "Monte Carlo needs the whole of $G_t$, so it waits for the end, and after a timeout the tail is never seen at all. Writing $G_t = R_{t+1} + \\gamma G_{t+1}$ and swapping $G_{t+1}$ for our current guess lets us update after one step. The price is bias, since early on $V(S_{t+1})$ is mostly wrong; in return the target carries one reward's worth of noise instead of a whole episode's, and neither method needs $P$. (Beats 1 and 2: Monte Carlo, then TD.)"
  - kind: whatif
    q: "A Q-table starts at all zeros, the only reward is +1 at a distant goal, and the agent acts greedily from the first episode ($\\varepsilon = 0$, ties broken at random). What happens?"
    choices:
      - "It repeats the first route that ever paid and stops exploring."
      - "It learns faster, because no step is wasted on random actions."
      - "It finds the best route, only more slowly than with $\\varepsilon$."
      - "The update divides by zero and the table fills with NaN."
    answer: 0
    explain: "An all-zero table has no opinion, so the agent wanders until one lucky run pays. From then on that one positive cell wins every comparison, and greedy follows the first route that paid without ever testing another. $\\varepsilon$ is what keeps the other actions being tried: on slippery FrozenLake, greedy from zero reached the goal 3 to 9 % of the time, against 72 to 76 % with $\\varepsilon$ decaying from 1. (Beat 3: score the actions, not the squares.)"
  - kind: numbers
    q: "$V(s) = 2$. The agent gets reward $R = 1$ and lands in $s'$ with $V(s') = 4$. With $\\gamma = 0.5$ and $\\alpha = 0.1$, what are the TD error $\\delta$ and the new $V(s)$?"
    choices:
      - "$\\delta = 3$, and $V(s)$ becomes 2.3."
      - "$\\delta = 1$, and $V(s)$ becomes 2.1."
      - "$\\delta = 1$, and $V(s)$ becomes 3."
      - "$\\delta = -1$, and $V(s)$ becomes 1.9."
    answer: 1
    explain: "The TD target is $1 + 0.5 \\cdot 4 = 3$, so $\\delta = 3 - 2 = 1$: the old guess was too low. The update moves only a fraction $\\alpha$ of the way, $2 + 0.1 \\cdot 1 = 2.1$. Jumping straight to 3 would be $\\alpha = 1$, trusting one noisy step completely. (Beat 2: learn after every step.)"
  - kind: numbers
    q: "After action $a$ in $s$ the agent gets $R = -1$. The next state's Q-values are 2 and 6, and $\\varepsilon$-greedy then picks the action worth 2. With $\\gamma = 1$, what target does Q-learning use, and what does SARSA use?"
    choices:
      - "Both use 5."
      - "Q-learning 1, SARSA 5."
      - "Q-learning 5, SARSA 3."
      - "Q-learning 5, SARSA 1."
    answer: 3
    explain: "Q-learning assumes it will act greedily next: $-1 + 1 \\cdot \\max(2, 6) = 5$. SARSA uses the action it actually takes next: $-1 + 1 \\cdot 2 = 1$. 3 would be the plain average of the two next values. Same experience, two different targets, and that difference is the whole of off-policy versus on-policy. (Beats 4 and 5: the best next action, then the one you took.)"
  - kind: numbers
    q: "A state is ten continuous channels. Chop each into 10 bins for a Q-table. With 1024 simulated robots each stepping at 100 Hz and perfect coverage, roughly how long until every state has been visited once?"
    choices:
      - "About 27 hours."
      - "About 1.6 minutes."
      - "About 10 seconds."
      - "About 3 years."
    answer: 0
    explain: "Ten channels with 10 bins each give $10^{10}$ states. 1024 robots at 100 Hz make 102,400 transitions per second, so $10^{10} / 102{,}400 \\approx 97{,}700$ s, about 27 hours. That is one visit per state with perfect coverage, which random exploration never gives, and each cell needs many visits to average out the noise: no table is big enough. (Beat 3: score the actions, not the squares.)"
  - kind: whatif
    q: "SARSA trains with $\\varepsilon = 0.1$ on a grid whose shortest path runs along a cliff edge that costs −100. What if you switch its target to Q-learning's, the best next action instead of the one it will take?"
    choices:
      - "Nothing: both targets settle on the same path here."
      - "Its greedy path moves onto the edge, and it falls more in training."
      - "Its greedy path moves further from the edge, to be extra safe."
      - "It stops exploring, because the max removes the $\\varepsilon$ step."
    answer: 1
    explain: "SARSA learns the value of what it actually does, including the one step in ten that is random, and next to a cliff that random step is a fall, so it learns to keep its distance. With the max in the target it learns the value of a perfect driver, who hugs the edge for the shortest path, while the agent that is still exploring keeps slipping off. On CliffWalking that was 175 falls per training run against SARSA's 53. (Beats 4 and 5: the best next action, then the one you took.)"
  - kind: why
    q: "Q-learning explores with $\\varepsilon$-greedy, yet it learns the values of always acting greedily. Why is that possible?"
    choices:
      - "Because $\\varepsilon$-greedy acts greedily most of the time anyway."
      - "Because the random steps average out to zero over many episodes."
      - "Because $\\varepsilon$ is set to 0 once training has finished."
      - "Because its target uses the best next action, not the one taken."
    answer: 3
    explain: "The target $R_{t+1} + \\gamma \\max_a Q(S_{t+1}, a)$ assumes greedy behaviour from the next state on, whatever the agent actually does next. The behaviour policy explores and the target policy is greedy, which is what off-policy means. It converges to the optimal values as long as every action keeps getting tried. (Beat 4: learn from the best next action.)"
  - kind: whatif
    q: "A task pays +1 per step, and episodes are cut off by a time limit. You train with Monte Carlo, summing $G_t$ only up to the cut. What goes wrong?"
    choices:
      - "Nothing: Monte Carlo is unbiased whatever the episode length."
      - "States near the cut look better than they really are."
      - "States near the cut look worse than they really are."
      - "The update cannot run, since $G_t$ is undefined at the cut."
    answer: 2
    explain: "The rewards after a timeout would have been there, but a Monte Carlo return just stops counting at the cut. A state 10 steps before the limit gets a return of about 10, far below what it is really worth. TD does not have this problem, because it bootstraps through the cut with its own estimate of the missing tail. (Beat 1: play it out, then average.)"
---

**Goal:** train a Q-table with $\varepsilon$-greedy, and explain why Q-learning and SARSA learn different paths along the same cliff.

## Where we left off

Day 2's sweeps needed the transition model $P(s' \mid s, a)$ for every state, and the robot does not hand us that. Nobody gives us a table of "from this tilt, at this voltage, the next tilt is...". What we do get is the robot itself, or a simulator of it: we can act, and watch what happens. So can we learn $V$ and $Q$ from experience alone?

People were trying to before the field had a name. In 1959 Arthur Samuel's checkers program at IBM tuned its evaluation of a board by comparing it with its own evaluation a few moves later, which is the idea of this whole Day in one line. In 1988 Richard Sutton wrote it down properly and called it temporal-difference learning; Day 1's TD-Gammon was its first big win. In 1989 Chris Watkins, in his PhD thesis *Learning from Delayed Rewards*, gave the version that learns action values while exploring, Q-learning. In 1994 Gavin Rummery and Mahesan Niranjan published the on-policy variant that Sutton later named SARSA.

Their first attempt was the obvious one.

## The picture

A weather forecaster says on Monday that it will rain on Saturday. How do you grade that forecast? The obvious way: wait for Saturday, look out of the window, and score Monday against what actually happened. Sutton's 1988 paper opens with exactly this forecaster.

That works, and it needs no model of the weather at all, which is what we were after. But look at what it costs. Monday's forecast gets one grade a week, and only after Saturday has been and gone. And that grade comes from one Saturday, which might have been a fluke. The forecaster learns slowly, and from noise. That is our first problem.

## Step by step

### Play it out, then average

Day 2 defined $V(s)$ as the expected return from $s$. An expectation is an average, and we cannot compute it without $P$, but we can sample it: start in $s$, play the episode out, compute $G_t$ backwards from the end the way Day 1 did, and remember it. Do that many times and average.

Keeping every $G$ ever seen is wasteful, so the running average gets written as a nudge. Each time we finish an episode, move the old estimate a fraction $\alpha$ of the way towards the return we just saw:

$$
V(S_t) \leftarrow V(S_t) + \alpha \big[ G_t - V(S_t) \big]
$$

::: tip
$G_t - V(S_t)$ is how wrong we were. $\alpha$ is how much of that we believe from one episode. This is Monte Carlo: learn from returns that actually happened.
:::

The course's mouse makes it concrete. It starts with every value at 0, plays one episode of 10 steps, and collects $1 + 0 + 0 + 0 + 0 + 0 + 1 + 1 + 0 + 0 = 3$. With $\alpha = 0.1$ the start state's value becomes $0 + 0.1 \cdot (3 - 0) = 0.3$. No model of the maze was needed, only the tape.

Now put it on the robot and both halves of the forecaster's problem come back. The update for step 0 has to wait until the episode ends: at 100 Hz that is up to 1000 steps, 10 s, for one nudge. When the episode ends on the 10 s timeout, Day 1 showed the tape ends in "+ ?", so the $G_t$ we would train on is not even complete. And even a complete $G_t$ is one sample: two runs from the same state give two different $G$'s, because of the exploration noise and the random pushes. We are waiting a long time for a noisy grade.

### Learn after every step

The forecaster's fix is to stop waiting for Saturday. On Tuesday there is a new forecast, made with one more day of information. Grade Monday against Tuesday.

Circling back to Day 1's recursion:

$$
G_t = R_{t+1} + \gamma G_{t+1}
$$

The first term arrives one step later. The second is the whole problem: it is everything after that. But we already have something that claims to know it, our own current estimate $V(S_{t+1})$. Swap it in, and the target is available after a single step:

$$
V(S_t) \leftarrow V(S_t) + \alpha \big[ \underbrace{R_{t+1} + \gamma V(S_{t+1})}_{\text{TD target}} - V(S_t) \big]
$$

Using our own guess to build our own target is called bootstrapping. The bracket gets its own name, because it comes back for the rest of this guide:

$$
\delta_t = R_{t+1} + \gamma V(S_{t+1}) - V(S_t)
$$

::: tip
$\delta_t$ is the TD error: the surprise. The TD target mixes one real reward with our guess for the rest, so it is a better estimate than the old $V(S_t)$, which had no real reward in it at all. $\delta_t > 0$: the old guess was too low, push it up. $\delta_t < 0$: it was too high, push it down.
:::

This is TD(0). Let us take a moment to appreciate the recursion doing the work here: Day 2 used it to sweep a known model, and now it lets us learn without one.

It is not free. Early on $V(S_{t+1})$ is mostly wrong, so the target is biased, and we are partly learning from our own mistakes. What we get for that is a target that moves after every step and carries one reward's worth of noise instead of a thousand. Hold on to $\delta_t$: on Day 8 it comes back as the building block of the robot's advantage estimate.

::: field
**Monte Carlo or TD: the robot uses a dial between them.** Low `gae_lambda`: pure 1-step TD, low variance, high bias. High `gae_lambda`: Monte Carlo, high variance, zero bias. The wheeled-leg robot sits at $\gamma\lambda = 0.949$, so each target is in practice the next couple of dozen real rewards plus the critic's guess for everything after. **Timeouts are bootstrapped, falls are not.** rsl_rl adds $\gamma V(s)$ into the reward at a timeout step, so Day 1's "+ ?" gets filled with the critic's estimate; after a fall the future is 0. Day 8 has the code.
:::

So now we can score a square after every step. But a value for each square does not say which way to go. To pick an action from $V$ you would look one step ahead for every action and ask where it lands, and "where it lands" is $P(s' \mid s, a)$ again, the thing we just learned to do without.

### Score the actions, not the squares

The way round it is to learn the value of each action directly. Day 2's $Q(s, a)$ is exactly that: the return if I am here and take this action, then carry on. With a handful of states and actions it fits in a table, one row per state and one column per action. The course's mouse lives in a 2 × 3 maze: a small cheese (+1), a big pile (+10), poison (−10) and empty squares, so its table has 6 rows, 4 columns and 24 cells. Before training, all 24 are zero.

Acting from a table needs no model. Look up the row, take the biggest entry:

$$
\pi(s) = \arg\max_a Q(s, a)
$$

The obvious way to train it is to always act like that, greedily, and update as we go. Here is the problem. The first time the mouse steps right onto the small cheese, that one cell turns positive, and from then on it wins every comparison. The mouse goes for the +1 every episode and never wanders far enough to find the +10. Greedy exploits the first thing it finds.

The fix is to be greedy most of the time, not all of the time. With probability $\varepsilon$ take a random action, otherwise take the best one in the table:

$$
A_t = \begin{cases} \text{random} & \text{prob. } \varepsilon \\ \arg\max_a Q(S_t, a) & \text{prob. } 1 - \varepsilon \end{cases}
$$

::: tip
$\varepsilon$ is the exploration rate. Start it near 1, when the table knows nothing and every random step is information, and shrink it as the table gets better. At the end, set it to 0 and just take the best action.
:::

On FrozenLake, the slippery 4 × 4 grid, the gap is not subtle. Train a Q-table with greedy actions from an all-zero start and it reaches the goal in 3 to 9 % of evaluation episodes, depending on the seed. Train the same table with $\varepsilon$ decaying from 1 to 0.01 and it reaches the goal 72 to 76 % of the time.

Below is the table for CliffWalking, today's other grid: 48 states, 4 actions, 192 cells. It starts untrained. Drag the episodes up and watch the arrows, the greedy choice in each cell, settle into a route. Tap a cell to see its row of the table.

<q-table eps="0.1" episodes="0"></q-table>

One honest note on this grid: every step costs −1, so a cell that is still 0 looks better than any cell that has been tried. That makes the empty table optimistic, and here even $\varepsilon = 0$ explores: both methods still find the 13-step path with it. The cheese maze and FrozenLake pay nothing until the end, so they get no such help.

::: field
**$\varepsilon$ here, the std later.** Same job, different action space. The robot's Gaussian policy starts with a std of $e^{-1} \approx 0.37$ of the action range and shrinks it where precision pays: shrinking is the exploit side of explore and exploit. **Deploy at $\varepsilon = 0$**: the robot runs the mean, never a sample. **What goes wrong:** decay too fast and you freeze a half-filled table. FrozenLake with the whole decay squeezed into 2,000 episodes instead of 20,000: 31 %. Day 6 does the continuous version.
:::

So we have a table and a way to act. We do not yet have a rule to fill it in. TD(0) updated $V$ from $V(S_{t+1})$, but a row of $Q$ has four numbers in it. Which one is "the value of the next state"?

### Learn from the best next action

The obvious answer: the best one. If the next state is worth anything, it is worth what its best action is worth. That turns TD(0) into Q-learning:

$$
\begin{gathered} Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha \big[ y_t - Q(S_t, A_t) \big] \\ y_t = R_{t+1} + \gamma \max_{a} Q(S_{t+1}, a) \end{gathered}
$$

::: tip
Same shape as TD(0). The target $y_t$ is the reward we got plus the value of acting perfectly from the next state onwards, according to the table as it is now.
:::

The first step on CliffWalking, with $\alpha = 0.5$ and $\gamma = 1$: from the start the agent goes up, pays −1, and lands where every $Q$ is still 0. The target is $-1 + 1 \cdot 0 = -1$, and the cell becomes $0 + 0.5 \cdot (-1 - 0) = -0.5$. One cell, one step, no model.

Notice what just happened. The agent picked its action with $\varepsilon$-greedy, but the target assumes that from the next state it will act greedily. Two policies are in play: one that acts and explores (the behaviour policy), and one that the table is learning the value of (the target policy). When those differ, the method is off-policy. We can have one policy on exploration and another on exploitation, and the table still converges to the values of acting perfectly, no matter how sloppy the exploration was, as long as every action keeps getting tried.

::: field
**The $\varepsilon$-greedy GPS.** New city. You mostly drive the route the GPS says is best, and now and then you try a side street ($\varepsilon$). At every light you update your estimate of the trip as the time to the next junction plus the GPS's best time from there, even when you are about to take the side street again. **Use when:** you want the best route and the exploring is cheap, as in a simulator. **What goes wrong:** the estimate is for a driver who never takes side streets. You are not that driver yet.
:::

That last line is the crack. The target pretends we will act greedily from the next state, but 10 % of the time we will not. On most squares that hardly matters. Next to a cliff it is the difference between −1 and −100.

### Learn from the action you actually took

So stop pretending. Before updating, pick the next action the way we really will, with $\varepsilon$-greedy, and use that action's value in the target:

$$
\begin{gathered} Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha \big[ y_t - Q(S_t, A_t) \big] \\ y_t = R_{t+1} + \gamma Q(S_{t+1}, A_{t+1}) \end{gathered}
$$

::: tip
The update reads $S_t, A_t, R_{t+1}, S_{t+1}, A_{t+1}$, which is where the name comes from: SARSA. It learns the value of the policy that is actually exploring, mistakes included.
:::

The behaviour policy and the target policy are now the same one, so this is on-policy: it learns from its own behaviour, as it is right now. Watch what that does next to a cliff. Both panels below are trained with the same $\varepsilon = 0.1$, the same $\alpha$ and the same number of episodes.

<q-table compare eps="0.1" episodes="500"></q-table>

Q-learning's greedy path runs along the cliff edge, 13 steps, the shortest route there is. SARSA's goes up to the top row and round, 17 steps. Neither is a bug. Q-learning learned the value of a perfect driver, and a perfect driver hugs the edge. SARSA learned the value of a driver who slips one time in ten, and that driver should stay away from it. While training, SARSA is the one that does better: averaged over 10 training runs, the last 100 training episodes return −26 for SARSA and −50 for Q-learning, and Q-learning falls off 175 times per run against SARSA's 53. Now drag $\varepsilon$ down towards 0. The slip stops mattering, and the two paths move together.

SARSA is also the jumpier of the two. Its target depends on which random action comes next, so with $\alpha = 0.5$ its table never quite stops moving: over 40 seeds, Q-learning found the 13-step path every time, while SARSA gave 17 steps in 32 of them, 19 in 3, and a greedy path that loops in the other 5. Press the seed button a few times and you will meet one.

::: field
**SARSA or Q-learning.** ⚖️ **SARSA when** the exploring happens where mistakes cost: real hardware, or anywhere a fall during training is a fall. It pays for its own exploration and keeps away from the edge. **Q-learning when** exploring is free and you will act greedily later: it targets the true optimum. **The robot** explores only in simulation, on 1024 copies that can fall for nothing, and deploys the mean with no noise at all, which is the Q-learning bargain. PPO itself is on-policy for a different reason (Day 5).
:::

Time to regroup. We started without $P$. Monte Carlo got rid of it by playing episodes out and averaging, but it waits until the end and grades with one noisy sample. TD(0) bootstraps from its own guess and learns after every step, with the TD error $\delta_t$ as the surprise. To choose actions without $P$ we moved from $V$ to a table of $Q$, and acting greedily on that table exploits the first thing it finds, so $\varepsilon$-greedy keeps it trying. Q-learning updates towards the best next action and learns the optimal values off-policy. SARSA updates towards the action it will actually take and learns the values of what it does.

What is still open is the table. Every method today keeps one cell per state-action pair and fills each cell by visiting it. CliffWalking has 192 cells, FrozenLake 64. The robot has not shown up today at all, and there is a reason for that.

## Pitfalls

- **Bootstrapping through a real end (beats 2 and 4).** At a terminal state the future is 0, and the target must be $R_{t+1}$ alone. Code that adds $\gamma \max_a Q(S_{t+1}, a)$ there is reading a row that is never updated; the opposite mistake, zeroing the future at a timeout, is Day 1's pitfall again.
- **`np.argmax` on an all-zero row (beat 3).** It returns the first maximum, so an untrained row always means action 0, which is "left" on FrozenLake. Break ties at random, or your "greedy" agent is a left-turn agent.
- **$\varepsilon$ decayed before the table is filled (beat 3).** The return curve flattens early and stays there. Squeezing FrozenLake's whole decay into 2,000 episodes drops the greedy goal rate from about 72 % to 31 %.
- **Judging Q-learning by its training curve (beat 5).** On CliffWalking its training return is worse than SARSA's (−50 against −26) even though its greedy path is the shorter one, because the curve includes the exploration. Evaluate with $\varepsilon = 0$ separately before calling one method better.
- **Monte Carlo on truncated episodes (beat 1).** A $G_t$ summed up to a timeout is missing its tail, so every state near the time limit looks worse than it is. TD bootstraps through the cut; plain Monte Carlo cannot.

<!-- quiz -->

## Next

You might ask, why did the robot sit out the whole of today? Every method here kept one cell per state-action pair and filled each cell by visiting it, and the table was the one thing we never questioned. The wheeled robot's state is ten continuous channels. Chop each into just 10 bins and the table already has $10^{10}$ rows, most of which no robot will ever visit. This is the curse of dimensionality Bellman named in 1957: no table is big enough. That is [Day 4](../day04/).

## Sources

- `notes/chapter-2-introduction-to-q-learning.md` ([Notion](https://app.notion.com/p/28267249ddbf80e0972dfe7f9562a7a7)), second half: my notes on Unit 2 of the [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit2/introduction), rewritten here. Monte Carlo vs TD, the mouse-and-cheese examples (the $G_t = 3$, $V(S_0) = 0.3$ update and the 2 × 3 maze), the Q-table, $\varepsilon$-greedy, the Q-learning algorithm and the off-policy/on-policy split come from the course. The driving-in-a-new-city table and the TD-error reading (`images/chapter-2-introduction-to-q-learning/13.png`) are my own.
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)): the TD target as "a better estimate", "appreciate our DP and recursive approach", "one network on exploration and another on exploitation", on-policy as learning from the policy's own most recent behaviour, the shrinking std as exploitation, and the `gae_lambda` row of the knob table.
- `artifacts/wlbot-learning-log-aug-30.html`: timeout bootstrapping in rsl_rl ($\gamma V(s)$ added to the reward at timeout steps), $\gamma\lambda = 0.949$, 1024 robots at 100 Hz, and "two runs from the same state give two different G's".
- `artifacts/station-keeping-policy-runner.html`: the deployed observation, four frames of ten channels.
- A. L. Samuel, "Some Studies in Machine Learning Using the Game of Checkers", *IBM Journal of Research and Development*, 1959.
- R. S. Sutton, "Learning to Predict by the Methods of Temporal Differences", *Machine Learning*, 1988 (the weather forecaster is from its introduction).
- C. J. C. H. Watkins, *Learning from Delayed Rewards*, PhD thesis, University of Cambridge, 1989; C. Watkins and P. Dayan, "Q-learning", *Machine Learning*, 1992.
- G. A. Rummery and M. Niranjan, "On-line Q-learning using connectionist systems", Cambridge University Engineering Department, technical report CUED/F-INFENG/TR 166, 1994.
- R. Sutton and A. Barto, *Reinforcement Learning: An Introduction*, 2nd ed., 2018, chapters 5 and 6 (Example 6.6 is the cliff).
- Gymnasium: [FrozenLake](https://gymnasium.farama.org/environments/toy_text/frozen_lake/) and [CliffWalking](https://gymnasium.farama.org/environments/toy_text/cliff_walking/) documentation.
