---
day: 2
minutes: 40
widgets: [value-grid]
quiz:
  - kind: why
    q: "When the rules of the world are known, you could estimate $V(s)$ by averaging many played-out returns from each state. Why use the Bellman equation instead?"
    choices:
      - "Averaged returns are wrong even with infinitely many playouts."
      - "Each value reuses the next state's value, so nothing is replayed."
      - "The Bellman equation removes the need for a discount $\\gamma$."
      - "It gives the exact $V$ after one single sweep over all the states."
    answer: 1
    explain: "Playouts are fine in the limit; they are just expensive and noisy, because the walk after the first step is replayed for every state that leads into it. The Bellman equation replaces that walk with the value of the next state, which already summarises everything after it. On a small grid that was the difference between 212,592 environment steps with errors of 0.2 and 2,600 lookups with none. (Beat 3: the value of a cell is one step plus the value of the next.)"
  - kind: whatif
    q: "In value iteration you replace $\\max_a$ with the plain average over the actions. What does the sweep converge to?"
    choices:
      - "The same $V^*$, only after more sweeps."
      - "Nothing: averaging is not a contraction, so it diverges."
      - "Zero everywhere, since good and bad moves cancel out."
      - "The value of the uniformly random policy, not the best one."
    answer: 3
    explain: "The average over the moves is exactly $\\sum_a \\pi(a \\mid s)$ for the uniform random policy, so the sweep becomes iterative policy evaluation. It still converges, because every sweep still shrinks the error by $\\gamma$, but to the score of a coin toss. The max is the part that chooses. (Beats 4 and 5: sweeping, then improving.)"
  - kind: numbers
    q: "Each sweep of policy evaluation shrinks the worst error by at least a factor $\\gamma$. With $\\gamma = 0.999$ and a starting worst error of 1000, how many sweeps does that guarantee need to get the error below 1?"
    choices:
      - "About 7."
      - "About 690."
      - "About 1000."
      - "About 6,900."
    answer: 3
    explain: "We need $1000 \\cdot 0.999^k < 1$, so $k > \\ln 1000 / (-\\ln 0.999) \\approx 6.91 / 0.0010 \\approx 6900$. The number of sweeps grows like the horizon $1/(1-\\gamma)$ times the log of the accuracy you want, because news travels back one step per sweep. At $\\gamma = 0.9$ the same calculation gives 66. (Beat 4: sweep until nothing moves.)"
  - kind: numbers
    q: "In state $s$ a policy picks each of two actions with probability 0.5. Action A pays −1 and lands in a state worth 4; action B pays +2 and ends the episode. With $\\gamma = 0.5$, what is $V(s)$?"
    choices:
      - "1.5"
      - "2"
      - "3"
      - "2.5"
    answer: 0
    explain: "One Bellman backup per action: A gives $-1 + 0.5 \\cdot 4 = 1$, and B gives $2 + 0.5 \\cdot 0 = 2$, because nothing follows a real end. The policy's average is $0.5 \\cdot 1 + 0.5 \\cdot 2 = 1.5$. 2 would be the max, which is what value iteration takes, and 2.5 forgets $\\gamma$. (Beat 3: the value of a cell is one step plus the value of the next.)"
  - kind: numbers
    q: "A policy picks left with probability 0.75 and right with 0.25. In state $s$, $Q(s, \\text{left}) = 4$ and $Q(s, \\text{right}) = 8$. What is $V(s)$ under this policy, and which action does the greedy policy pick?"
    choices:
      - "6, and greedy picks right."
      - "5, and greedy picks left."
      - "5, and greedy picks right."
      - "8, and greedy picks right."
    answer: 2
    explain: "$V$ is the policy's weighted average of the $Q$'s: $0.75 \\cdot 4 + 0.25 \\cdot 8 = 5$. The greedy policy ignores the odds and takes the bigger $Q$, which is right. 6 is the unweighted average. The gap between 5 and 8 is exactly what policy improvement cashes in. (Beat 2: Q commits to one move first.)"
  - kind: why
    q: "An agent knows $V(s)$ for every state but has no model of where each action leads. Why can it not pick a good action, when an agent that knows $Q(s, a)$ can?"
    choices:
      - "$V$ scores states; ranking moves needs to know where each one lands."
      - "$V$ is only defined for the optimal policy, not the current one."
      - "$V$ ignores the discount $\\gamma$, so it misjudges far rewards."
      - "$V$ can only be learned for terminal states, not ordinary ones."
    answer: 0
    explain: "$V(s)$ averages over all the moves the policy might make, good and bad mixed together. To turn it into a choice you look one step ahead for each action, and that needs $P(s' \\mid s, a)$. $Q(s, a)$ already commits to the move, so acting is just $\\arg\\max_a Q(s, a)$. (Beat 2: Q commits to one move first.)"
  - kind: whatif
    q: "Entering a goal state pays +10 and ends the episode. Your sweep updates the goal state like any other state, so its value is rebuilt from its neighbours. What goes wrong?"
    choices:
      - "Nothing, as long as $\\gamma$ is below 1."
      - "The +10 is counted again and again, inflating the nearby values."
      - "The goal's value drops to −10, so the agent learns to avoid it."
      - "The sweep stops after one pass, since the goal never changes."
    answer: 1
    explain: "After a real end nothing follows, so a terminal state's value must stay 0; the +10 is paid on the move into it. If the sweep gives the goal a value of its own, that value flows back into its neighbours, and the reward is collected once on entry and again through the goal's value. It is the same rule as `terminated`: after a real end, the future is zero. (Beat 3: the value of a cell is one step plus the value of the next.)"
  - kind: numbers
    q: "Value iteration starts from $V = 0$ everywhere and runs synchronous sweeps: each sweep computes every new value from the previous sweep's values. Every move costs −1, except the move into the goal, which pays +10, and the start is 5 moves from the goal. After which sweep does the start's value first include the goal's reward?"
    choices:
      - "After the 1st sweep."
      - "After the 4th sweep."
      - "After the 5th sweep."
      - "Only once the sweeps have converged."
    answer: 2
    explain: "Each sweep looks one step further ahead: after sweep $k$ a state's value accounts for at most $k$ moves. So for four sweeps the start only counts its −1's, and on sweep 5 the goal's +10 arrives. Good news travels one cell per sweep, which is why the number of sweeps grows with the horizon. (Beat 5: from judging the coin toss to finding the best move.)"
---

**Goal:** explain $V(s)$ and $Q(s,a)$, and why the Bellman recursion makes them cheap to compute when you know the rules of the world.

## Where we left off

Day 1 ended on a return we cannot compute when we need it: at step 50, $G_{50}$ needs every reward from step 51 onwards, and none of them have happened yet. Even when the episode does finish, the $G$ we get is one noisy sample of what could have happened. What we want is not one $G$ but a judgement of the situation itself: how good is it to be here?

The person who hit this wall first was Richard Bellman, at the RAND Corporation in the early 1950s. He was working on multistage decision problems: decide now, see what happens, decide again, with a payoff at every stage. By his own account he picked the name "dynamic programming" partly because the Secretary of Defense of the day hated the word "research", and "programming" sounded harmless. The book came out in 1957, with the principle that does all the work in this Day, and the phrase "curse of dimensionality", which comes back at the end of Day 3. In 1960 Ronald Howard turned it into an algorithm you could run: evaluate a policy, improve it, repeat.

Their first attempt was the obvious one. To know what a situation is worth, play it out and add up what you get.

## The picture

Think of the signposts on a hiking trail: "Summit 2 h" at every junction. Somebody had to put those numbers there.

The naive way to do it is to walk. Stand at junction 3, walk to the summit, check your watch. Do it a few times, because sometimes you take a wrong turn or stop for a photo, and write the average on the sign. Then go down to junction 2 and do it again.

That works, and it is how we will start. But look at what the person timing junction 2 does: they walk up to junction 3 and then the whole rest of the trail, which somebody already walked and timed. Most of the work is the same walk, done again. On a trail with ten junctions, the last kilometre gets walked ten times over. That is our first problem.

## Step by step

### Play it out and average

Back to the mouse grid from Day 1: a 4x3 grid, the mouse starts bottom left, the cheese is top right (+10, episode over), the trap is right under it (−10, episode over), and every other move costs −1. Bumping a wall means staying put. I have dropped the 20-step limit for today; Day 1's last beat showed that a cut is a different thing from an ending. The policy is still a coin toss over up, right, down and left, and $\gamma = 0.9$.

How good is the start cell? The obvious answer: play it out. Run the coin toss from the start until the episode ends, compute $G$, and do it again. One playout is useless on its own: a single $G$ from the start spreads by about 2.7 around its mean, the walk lasts about 29 steps on average and once took 151, and only about one walk in three finds the cheese; the other two end in the trap. So average many of them.

That average has a name. It is the value of the state under the policy:

$$
V_\pi(s) = \mathbb{E}_\pi\left[\, G_t \mid S_t = s \,\right] = \mathbb{E}_\pi\left[\, R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \dots \mid S_t = s \,\right]
$$

::: tip
$V_\pi(s)$ is the $G$ you get on average if you start in $s$ and then keep following $\pi$. The subscript matters: it is the value of the cell *for this policy*. A clumsy mouse and a clever one put different numbers on the same cell.
:::

To fill in the whole grid the naive way, do the same from every one of the 10 non-terminal cells. With 1000 playouts per cell, one run of this spends 212,592 environment steps, and the table is still off by up to 0.2: the cell left of the cheese comes out at −1.95. The start cell lands at −8.79. The true value, which we will compute properly in beat 4, is −8.84.

::: field
**$V$ on the robot.** Same definition, $\gamma = 0.999$: a perfect balancer's $V$ is about $\sum_k 0.999^k \approx 1000$ on the spot, and near 0 just before it falls. ✅ The bonus is bounded in [0, 1] with no fall penalty, so staying up is always worth at least as much as falling, and $V$ slopes gently between the two. ❌ A −100 fall penalty: early in training every episode ends in a fall, so in my own summary "the critic would not train effectively at the early stages, recording a huge loss at every turn". It spends itself fitting a cliff. The grid's −10 trap is that cliff in miniature; Day 7 trains a network to learn this $V$.
:::

So now every cell has a number, and the mouse at the start knows it is in a bad place: −8.84. What it does not know is which way to go to make it better.

### Q commits to one move first

$V$ scores the cell, not the move. Standing at the start, the mouse has four options, and $V(\text{start})$ is an average over all four of them, good and bad mixed together.

The obvious fix is to look at the neighbours: going up leads to a cell worth −8.46, going right to one worth −8.70, so go up. That works here, but only because we know where each move leads. Hold on to that; it is the crack this whole Day ends on.

The cleaner fix is to score the move directly. Start in $s$, commit to action $a$ for one step, then follow the policy as before:

$$
Q_\pi(s, a) = \mathbb{E}_\pi\left[\, G_t \mid S_t = s,\ A_t = a \,\right], \qquad V_\pi(s) = \sum_a \pi(a \mid s)\, Q_\pi(s, a)
$$

::: tip
TLDR from my notes: $V$ is the value of each square if you follow the policy; $Q$ is "if I'm here and take this action, what do I get?". $V$ is the policy's weighted average of the $Q$'s.
:::

For the start cell under the coin toss, the four $Q$'s are −8.61 (up), −8.83 (right), −8.96 (down) and −8.96 (left: bumping the wall wastes a step). Their plain average is the −8.84 from before. Even under a policy that has no idea what it is doing, $Q$ already points up.

Once $Q$ is known, choosing is trivial: take the move with the biggest $Q$.

$$
\pi(s) = \arg\max_a Q(s, a)
$$

::: field
**Learn only the value, act by argmax.** From my talk plan: "Some methods learn only the value and just pick whichever action scores highest." ✅ When there are a few buttons: left, right, jump, or the grid's four moves. ❌ When a motor takes any voltage in ±8 V: there is nothing to simply pick from, "that's why robots learn a policy". Day 4 learns $Q$ with a network and runs straight into this.
:::

But the price has gone up. The grid now has 40 numbers instead of 10, one per cell and move, and every one of them is still an average of playouts. Each playout from the start walks through the cell above it, and that cell is being estimated by its own pile of playouts too. We are timing the same trail over and over.

### The value of a cell is one step plus the value of the next

Circling back to the recursion from Day 1:

$$
G_t = R_{t+1} + \gamma G_{t+1}
$$

The return from here is the next reward plus the discounted return from the next state. Take the average of both sides. The average of $G_{t+1}$, given where we land, is just $V_\pi$ of the next state. That is the signpost trick: junction 2's time is the walk to junction 3 plus whatever junction 3's sign says.

$$
V_\pi(s) = \mathbb{E}_\pi\left[\, R_{t+1} + \gamma V_\pi(S_{t+1}) \mid S_t = s \,\right] = \sum_a \pi(a \mid s) \sum_{s'} P(s' \mid s, a)\left[\, r(s, a, s') + \gamma V_\pi(s') \,\right]
$$

::: tip
Pick a move with the policy's odds, see where the world sends you with $P(s' \mid s, a)$, collect the reward on the way, and add the discounted value of where you landed. Nothing after the first step is played out: $V_\pi(s')$ already carries it. This is the Bellman equation.
:::

Check it on the cell left of the cheese, whose value is −1.75 under the coin toss. Up bumps the wall: $-1 + 0.9 \cdot (-1.75) = -2.57$. Right is the cheese: $+10$, and the episode is over. Down: $-1 + 0.9 \cdot (-7.40) = -7.66$. Left: $-1 + 0.9 \cdot (-6.40) = -6.76$. The average of the four is −1.75. One step of arithmetic per move, and the rest of the trail never gets walked.

::: field
**Bellman is dynamic programming, like the Padovan recurrence.** $P(n) = P(n-2) + P(n-3)$: written as a plain recursive function, $P(30)$ makes 6,657 calls, because the same small cases get recomputed again and again; keep a table of answers and it takes 28 additions. The Bellman equation is the same move for values: store $V$ per state and reuse it instead of replaying the future.
:::

Now here is the problem. Padovan runs one way: $P(30)$ needs smaller cases, and the smallest ones are given. The grid does not. The start cell's value depends on the cell above it, whose value depends on the start cell, because the coin toss happily walks back down. Every one of the 10 unknowns is defined in terms of the others. How do we solve something that is circular?

### Sweep until nothing moves

With 10 cells, the obvious answer is algebra: it is 10 linear equations in 10 unknowns, so solve them. That works for a grid. It does not survive growth: solving a linear system costs roughly the cube of the number of states, and a million states is $10^{18}$.

The cheaper trick is to stop treating the equation as something to solve and start using it as an update. Guess $V = 0$ everywhere. Apply the right-hand side to every cell at once, using the old guesses for the neighbours. That gives a new table. Do it again.

$$
V_{k+1}(s) = \sum_a \pi(a \mid s) \sum_{s'} P(s' \mid s, a)\left[\, r(s, a, s') + \gamma V_k(s') \,\right]
$$

::: tip
$k$ counts sweeps. Each sweep rebuilds every cell from the previous sweep's table. This is iterative policy evaluation.
:::

Why should it settle? Every guess is wrong by some amount, and each sweep passes the error on only after multiplying it by $\gamma$. The rewards in the equation are exact; only the $V_k(s')$ term carries old error. So the worst error shrinks at least geometrically:

$$
\max_s \left| V_k(s) - V_\pi(s) \right| \le \gamma^k \max_s \left| V_0(s) - V_\pi(s) \right|
$$

::: tip
Each sweep keeps at most a fraction $\gamma$ of the worst error. At $\gamma = 0.9$, about 44 sweeps cut it by a factor of 100.
:::

Press One sweep a few times, then Sweep to convergence. The coin toss settles after 65 sweeps, stopping once the biggest change $\Delta$ is below $10^{-4}$. The start cell ends at −8.84, the same number the playouts were circling, for 2,600 lookups instead of 212,592 steps. Switch to the Q view to see the four $Q$'s behind each cell.

<value-grid gamma="0.9" mode="eval" view="v"></value-grid>

::: field
**Sweeps scale with the horizon.** ✅ The bound above is exact arithmetic: sweeps $\approx \ln(\text{accuracy wanted}) / (1-\gamma)$. At $\gamma = 0.9$, 44 sweeps for a factor 100. At the robot's $\gamma = 0.999$, about 4,600. It is Day 1's horizon in another costume: a reward has to travel back one step per sweep. The robot never runs sweeps, but one-step updates have the same habit of moving news one step at a time, and Day 8's GAE exists partly because of it.
:::

So now we can judge any policy cell by cell, cheaply. The trouble is the policy we judged: a coin toss that drifts into the trap more often than it finds the cheese. A perfect score for a bad policy is still a bad policy. We wanted the best way through the grid, not a precise grade for the worst one.

### From judging the coin toss to finding the best move

Beat 2 already handed us the fix. Under the coin toss, $Q$ at the start pointed up. So evaluate the coin toss, then in every cell switch to the move with the biggest $Q$:

$$
\pi'(s) = \arg\max_a Q_\pi(s, a) = \arg\max_a \sum_{s'} P(s' \mid s, a)\left[\, r(s, a, s') + \gamma V_\pi(s') \,\right]
$$

::: tip
Policy improvement: in every cell, take the move that looked best under the old policy. The new policy is never worse than the old one, and is strictly better somewhere unless the old one was already optimal.
:::

Evaluate the new policy, improve again, and stop when nothing changes. That is Howard's policy iteration. On the mouse grid it is almost an anticlimax: one improvement takes the start cell from −8.84 to 3.12, and the next round changes nothing.

The catch is the evaluation in the middle. Each round runs a full sweep-until-nothing-moves, 65 sweeps for the coin toss, before it is allowed to improve once. The impatient version folds the improvement into the sweep itself: instead of averaging over the policy's moves, take the best one every time.

$$
V_{k+1}(s) = \max_a \sum_{s'} P(s' \mid s, a)\left[\, r(s, a, s') + \gamma V_k(s') \,\right], \qquad \pi^*(s) = \arg\max_a Q^*(s, a)
$$

::: tip
Value iteration: every sweep evaluates and improves in one go. What it converges to is $V^*$, the value of the best policy, and the best policy is read off with an argmax at the end.
:::

Watch it run. For four sweeps the start cell just counts its −1's: −1, −1.9, −2.71, −3.44. On sweep 5 the cheese's news arrives (the start is five moves from the cheese) and it jumps to 3.12. Sweep 6 changes nothing. The good news travels one cell per sweep. The arrows are the greedy moves; at the start up and right tie, because both are on a shortest path.

<value-grid gamma="0.9" mode="opt" view="v"></value-grid>

Let me regroup, because that was five beats in a row. We wanted to judge a situation without waiting for the rest of the episode. Averaging playouts gave us the definition, $V_\pi(s) = \mathbb{E}[G_t \mid S_t = s]$, and $Q_\pi(s, a)$ added one committed move so the agent can choose. Playouts were slow and noisy, so the Bellman equation replaced the future with the value of the next state. The equation is circular, so we swept it until it stopped moving, which works because every sweep shrinks the error by $\gamma$. And putting a max into the sweep turned judging into improving: value iteration found the best route in 6 sweeps.

What is still open is in every equation since beat 3: $P(s' \mid s, a)$, and the reward $r(s, a, s')$. Each sweep asked, for every cell and every move, where the world sends you and what it pays. On the grid I wrote those rules myself, so the answer was one array lookup. The wheeled-leg robot has no such table. Nobody can tell us, for every one of its states and every voltage, where it will be 10 ms later.

## Pitfalls

- **Reading $V_\pi$ as "how good the cell is" (beat 1).** It is how good the cell is *for that policy*. The cell left of the cheese is worth −1.75 under the coin toss and 10 under the best policy. Comparing values from two different policies tells you about the policies, not the cells.
- **Updating the terminal cells (beat 3).** The reward for entering the cheese is paid on the move; after that nothing follows, so $V$ of a terminal cell must stay 0. If the sweep updates it like any other cell, it starts collecting value from its neighbours and the +10 gets counted again and again. It is the same rule as Day 1's `terminated`: after a real end, the future is zero.
- **Stopping after a fixed number of sweeps (beat 4).** 50 sweeps is plenty at $\gamma = 0.9$ and nowhere near enough at $\gamma = 0.999$. Stop on the biggest change $\Delta$, and remember that small $\Delta$ means "nearly settled", not "exact": with the bound above, the remaining error can be up to about $\Delta \cdot \gamma / (1-\gamma)$.
- **Mixing in-place and synchronous sweeps (beat 4).** Updating cells one at a time and reading the newest neighbours also converges, usually faster, but the table after sweep $k$ is a different table. If your numbers disagree with the widget after three sweeps but agree at convergence, that is why.
- **Trusting one arrow where there is a tie (beat 5).** At the start, up and right have the same $Q^*$, and `np.argmax` silently returns the first. The policy is not wrong, but "the" best move is a choice you made, not something the grid said.

<!-- quiz -->

## Next

You might ask, where did $P(s' \mid s, a)$ come from? On the grid I typed it in: four moves, walls, two terminal cells. Every sweep leaned on it, for every state, and value iteration only works because it can look one step ahead without taking the step. A robot does not hand us that: nobody can write down, for every tilt and wheel speed and voltage, where the wheeled-leg robot will be 10 ms later. All we get is what happens when we actually try. Can we learn $V$ and $Q$ from experience alone? That is [Day 3](../day03/).

## Sources

- `notes/chapter-2-introduction-to-q-learning.md` ([Notion](https://app.notion.com/p/28267249ddbf80e0972dfe7f9562a7a7)), first half: my notes on Unit 2 of the [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course/unit2/introduction), rewritten here. The definitions of $V$ and $Q$, the "V per square, Q per square and move" picture (redrawn as the widget's two views), the Bellman equation as "immediate reward plus discounted value of the next state", the "similar to Padovan" note and the TLDRs come from there.
- `notes/chapter-1-introduction.md` ([Notion](https://app.notion.com/p/28167249ddbf80e297c0e6660444bb18)), "Value based methods": the maze of state values, redrawn as the widget.
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), "Enter the critic": the $V$ / $Q$ definitions and their one-line reading, which return on Day 7.
- `artifacts/rl-presentation-plan.html`, Slide 4: "Some methods learn only the value and just pick whichever action scores highest", and why robots learn a policy instead.
- `artifacts/wlbot-learning-log-aug-30.html`: a perfect balancer's $V \approx 1000$, near 0 before a fall, the bounded bonus with no fall penalty, and my summary of why a −100 fall penalty hurts the critic.
- R. Bellman, *Dynamic Programming*, Princeton University Press, 1957; the naming story is from his autobiography, *Eye of the Hurricane*, World Scientific, 1984.
- R. A. Howard, *Dynamic Programming and Markov Processes*, MIT Press, 1960 (policy iteration).
- R. Sutton and A. Barto, *Reinforcement Learning: An Introduction*, 2nd ed., 2018, chapter 4 (policy evaluation, policy improvement, policy and value iteration).
- The one-in-three chance of finding the cheese is the exact hitting probability of the random walk, 0.34.
