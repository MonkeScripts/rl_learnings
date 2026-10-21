---
day: 12
minutes: 60
widgets: [reward-shape]
quiz:
  - kind: why
    q: "A balancing robot's reward is one Gaussian bonus capped at 1 plus three small penalties, each a tenth of the bonus or less. The episode ends when it falls. There is no alive bonus and no fall penalty. Why does the policy still try to stay up?"
    choices:
      - "The critic adds a survival bonus of its own to every state it sees."
      - "Each step upright nets zero or more, and a fallen robot collects nothing."
      - "The trainer counts the termination itself as a reward of −1."
      - "A discount near 1 makes it prefer long episodes whatever it earns."
    answer: 1
    explain: "A bounded, non-negative bonus is the alive incentive. An ended episode earns nothing more, so with up to a thousand steps of bonus on the table, falling can only lose. That holds only while the penalties sit below the bonus: let a per-step reward go negative and a short episode bleeds less than a long one, and the policy learns to dive. (Beat 3: what does doing nothing score?)"
  - kind: numbers
    q: "A position bonus is $\\exp(-(x/\\sigma)^2)$ with $\\sigma$ = 5 cm. What does it pay at 5 cm, 10 cm and 20 cm off the spot?"
    choices:
      - "$e^{-1} \\approx 0.37$, $e^{-4} \\approx 0.018$ and $e^{-16} \\approx 10^{-7}$."
      - "0.75, 0.5 and 0: a straight fall to zero at 20 cm."
      - "0.61, 0.14 and 0.0003."
      - "0.37, 0.14 and 0.05: a constant factor every 5 cm."
    answer: 0
    explain: "Put $x/\\sigma$ = 1, 2 and 4 into the exponent, squared: $e^{-1}$, $e^{-4}$, $e^{-16}$. The slope dies with the value, so at 20 cm every direction scores about the same and recovery from there is unlearnable. The third choice is the same curve written as $\\exp(-x^2/2\\sigma^2)$, which some libraries use: check the convention before you copy a σ. (Beat 2: flat top and dead tail.)"
  - kind: numbers
    q: "Per step a robot earns at most 1.0 from a bonus and pays $w\\,(\\Delta a)^2$ for changing its action. Balancing needs changes of about $\\Delta a = 0.4$ every step, and the episode ends when it falls. What does that penalty cost per step at $w = 10$ and at $w = 1$, and what does $w = 10$ teach?"
    choices:
      - "4.0 and 0.4; at $w = 10$ it balances with smaller corrections."
      - "0.16 and 0.016; neither is big enough to change anything."
      - "1.6 and 0.16; at $w = 10$ balancing loses each step, so it learns to fall."
      - "1.6 and 0.16; at $w = 10$ it still balances, only with a smoother voltage."
    answer: 2
    explain: "$10 \\times 0.4^2 = 1.6$, more than the whole bonus, so every step spent balancing nets about −0.6 and an early fall ends the losses. The policy learns to stop correcting and fall. At $w = 1$ the same change costs 0.16, about a sixth of the bonus, and balancing pays. The first choice forgets to square $\\Delta a$. Penalties are bids against the bonus: let one outbid it and doing nothing wins. (Beat 3: what does doing nothing score?)"
  - kind: whatif
    q: "To help a robot learn to roller-skate, you reward the average spin speed of its four wheels, read from the wheel encoders. Nothing else checks how it moves. What is the policy most likely to learn?"
    choices:
      - "Rolling forward on all four wheels, since that spins every wheel."
      - "Rolling slowly, since spinning faster makes it fall and lose reward."
      - "Standing still, since spinning wheels costs effort it cannot repay."
      - "Spinning lifted wheels in the air, where no balance is needed."
    answer: 3
    explain: "Wheel spin is a signature of skating, not the skill, and the policy produces the signature however is cheapest. A lifted wheel spins freely, one rolling blade can carry the four-wheel average while the other foot walks, and a forward fall spins all four. A signature makes a good check and a poor target. (Beat 4: every outcome number has a cheat.)"
  - kind: whatif
    q: "One policy both walks and stands. A gait term pays up to 3.0 per step for lifting the feet in a steady rhythm, and it is multiplied by 0 whenever the commanded speed is zero. A pose term pays up to 1.0 for holding the home stance; stepping in place costs it about 0.3. You delete the multiply. What does the policy do when told to stand?"
    choices:
      - "It marches in place, since stepping earns more than holding the pose."
      - "It stands still, since the pose term decides what a zero command does."
      - "It stops walking too, since the gait term no longer pays when moving."
      - "Nothing changes, since the multiply was never an input to the policy."
    answer: 0
    explain: "Without the gate the gait term pays in both modes. Standing at home scores 1.0 from pose; stepping in place scores 3.0 from the gait term plus 0.7 from pose, so marching wins by a wide margin. The gate is what gives one network two regimes without a state machine: it switches a term off where it should not pay. (Beat 5: gate on the command.)"
  - kind: numbers
    q: "A task pays 100 for a goal and nothing else. You add shaping $F = \\gamma\\Phi(s') - \\Phi(s)$ with $\\Phi = -$(ball-to-goal distance) and $\\gamma = 0.99$. One step knocks the ball from 20 units out to 15; another leaves it at 20. What does each step pay?"
    choices:
      - "5.00 and 0."
      - "5.15 and −0.20."
      - "5.15 and +0.20."
      - "4.85 and 0."
    answer: 2
    explain: "$0.99 \\times (-15) - (-20) = 5.15$, paid long before any goal. Left at 20, the step pays $(\\gamma - 1)\\Phi = -0.01 \\times (-20) = 0.2$: with $\\gamma < 1$ a parked state earns or costs $1 - \\gamma$ of its potential each step. It is a trickle, and the telescoping sum over the episode already counts it. (Beat 6: did you improve?)"
  - kind: why
    q: "Paying +0.1 per step for pointing a bicycle at its goal taught an agent to ride in circles. Adding $F = \\gamma\\Phi(s') - \\Phi(s)$ for any potential $\\Phi$ cannot change the optimal policy. Why the difference?"
    choices:
      - "The potential term is smaller, so it cannot outweigh the task reward."
      - "Shaping lowers every action's value in a state by the same $\\Phi(s)$."
      - "The potential term is only paid at the goal, so circles earn nothing."
      - "The +0.1 was paid too often; once per lap it would have been safe."
    answer: 1
    explain: "Summed over an episode, the shaping telescopes to $\\gamma^T\\Phi(s_T) - \\Phi(s_0)$, so a full circle nets zero, and $Q'(s,a) = Q(s,a) - \\Phi(s)$: the same amount comes off every action, so the best action stays best. A state reward for heading towards the goal is collected again on every lap, and nothing charges for the stretch pointing away. (Beat 6: did you improve?)"
  - kind: whatif
    q: "In PPO you give the critic, but not the actor, the true mass, friction and contact forces from the simulator. The reward is unchanged. What does that change about the policy you end up with?"
    choices:
      - "It optimises a new objective that includes the hidden physics."
      - "The actor learns to read the hidden physics through the critic."
      - "Nothing, because the policy gradient ignores privileged inputs."
      - "Not the optimum: advantages get less noisy, so learning is faster."
    answer: 3
    explain: "The reward fixes the target; the critic only estimates how much of it is coming, as the baseline in $A_t = r_t + \\gamma V(s_{t+1}) - V(s_t)$. A better estimate means lower-variance gradients and faster learning, not a different answer. The inputs do matter to training, which is why a critic needs whatever the reward is computed from. (Beat 7: the reward decides, the critic estimates.)"
---

**Goal:** write rewards whose gradients point the right way, block the hacks you have actually seen, and tell what the reward decides apart from what the critic decides.

## Where we left off

The knobs make PPO optimise faster and more steadily, but it optimises whatever the reward says. Day 11 ended on a number from Jumper: before any training, a robot that does not move at all already scores 52% of the walking reward. Every curve on Day 10's dashboard can be healthy while the run climbs towards standing still.

This is the oldest wall in applied RL. In 1998 Jette Randløv and Preben Alstrøm taught an agent to ride a simulated bicycle to a goal, and gave it a little extra reward for moving towards the goal to speed things up. It learned to ride in circles: every lap had a stretch that pointed at the goal, and nothing charged it for the stretch that pointed away. A year later Andrew Ng, Daishi Harada and Stuart Russell worked out which extra rewards are safe to add and which change the answer. In 2016 OpenAI's boat in the game CoastRunners found a lagoon where three targets respawned, and circled it forever, on fire and crashing into other boats, instead of finishing the race. It scored about 20% more than human players.

Every one of those started from the obvious move: pay for what looks like progress, and add a little more pay wherever the agent seems stuck.

## The picture

Writing a reward is like writing a bonus scheme for a new employee who will read only the letter of it. Pay a support desk per ticket closed and you get tickets closed without the problem being fixed. The obvious response is a longer contract: a clause for quality, a clause for speed, a clause for each trick you can imagine.

The analogy breaks in one important place. An employee already knows how to do the job; the bonus only tilts what they choose. The robot starts knowing nothing. The reward is not only the contract, it is also the only map it has for finding any job at all, so every clause also changes where the search goes. A longer contract is a smaller search space. That is our first problem.

## Step by step

### Reward everything you can think of

My first instinct with the balancing robot was to reward everything I could think of, including damping on each axis. It made things worse. Some versions would not even pass in simulation. Every term you add is another constraint, and a heavily constrained robot has nowhere to explore.

The reward the wheeled-leg robot ended up with is one short function, four terms, and only the first is positive:

$$
r = 1.0\, e^{-(p_{tip}/0.05)^2} \;-\; 0.1\,|v_{tip}| \;-\; 1.0\,\|a_t - a_{t-1}\|^2 \;-\; 0.3\,(\omega_z - \omega_z^{cmd})^2
$$

::: tip
$p_{tip}$ is where the centre of mass projects onto the ground, measured from the reset spot: $p_{tip} = p_{err} + 0.085 \sin(\text{pitch})$. One bonus for being near the spot, a small charge for the tip moving, a small charge for the voltage changing between steps, and a small charge for the wrong yaw rate.
:::

The bonus sits on the tip, not the wheels, for a reason only a balancing robot has. To roll left it must first roll the wheels right, so the body tips left, then chase the lean. A bonus on wheel position would punish the first move of every correct manoeuvre. The tip is what the robot moves in one step. It also folds attitude in for free: a pitch of 0.15 rad alone puts the tip 1.3 cm off, so there is no separate "stay upright" term.

There is no velocity term either, on purpose. The position error is the integral of wheel velocity since reset, so a term on velocity would put the derivative next to it, and $-k_1|p| - k_2|v|$ is the shape of a PD law. Choosing $k_2/k_1$ would be choosing the damping ratio by hand. The reward should say what, and leave how to the policy.

So: few terms, each saying an outcome. But each of them still has to turn an error into a number, and "5 cm off" can become a number in more than one way.

### Flat top and dead tail

Three shapes are on offer. An L2 penalty, $-x^2$, is what we use everywhere else in ML. An L1 penalty, $-|x|$, gives the same push at any distance. Or a Gaussian bonus:

$$
r(x) = \exp\!\big(-(x/\sigma)^2\big), \qquad \left|\frac{dr}{dx}\right| = \frac{2|x|}{\sigma^2}\, e^{-(x/\sigma)^2}
$$

::: tip
The reward is 1 on target and falls towards 0, never below. The slope is zero at the target, peaks at $|x| = \sigma/\sqrt{2}$, and dies again far out. $\sigma$ decides both how picky the term is and how far out it can still pull.
:::

The L2 penalty grows without bound, so one bad episode can dominate the batch and drown every other term. The L1 penalty pushes as hard at sensor noise as at a real error, and has a kink at zero. The Gaussian has a flat top, which means "good enough is good enough": with $\sigma$ = 5 cm, about ±1 cm scores 0.96 or more, and the policy stops fighting noise for the last millimetre. It is bounded, so the weights read as importance: Microduck's velocity tracking at 2.0 counts twice its pose term at 1.0, whatever the robot does.

Now here is the problem. The slope is near zero in two places, and only one of them is deliberate. The flat top is a tolerance band. The tail is not. With $\sigma$ = 5 cm, a robot that drifted 20 cm gets $e^{-16} \approx 10^{-7}$ whichever way it moves. It cannot see the target, so recovery from there is unlearnable.

<reward-shape sigma="0.05" x="0.2"></reward-shape>

Drag $\sigma$ and watch the bottom panel. On a log scale the Gaussian's slope falls off a cliff past about $2.5\sigma$ (the red band), while L1 stays flat and L2 keeps climbing. Early in training the dead tail can be a help: a robot that cannot walk yet earns about nothing from velocity tracking whatever it does, so the term stays out of the way while it learns to stand. Later it is a hole.

My notes list six ways out of the hole, none of which I have run against each other on the robot, so this table is a menu, not a ranking:

| Fix | How | Watch out |
|---|---|---|
| Two Gaussians | a sharp peak inside a broad basin, $w_1 e^{-(x/\sigma_1)^2} + w_2 e^{-(x/\sigma_2)^2}$ | two more knobs per quantity |
| dm_control `tolerance()` | 1 inside a band, smooth decay outside; sum two margins | the same idea, packaged |
| Curriculum | keep the robot close enough that one narrow Gaussian suffices (Rudin et al. 2022) | may never learn large recoveries |
| L1 or L2 | the gradient never dies | never saturates; can teach early termination |
| Hindsight relabelling (HER) | pretend the goal was where the agent ended up | off-policy and goal-conditioned; no fit for station-keeping |
| Potential-based shaping | pay the change in a score, $\gamma\Phi(s') - \Phi(s)$ | pays nothing for sitting at the goal (beat 6) |

::: field Field notes: calibrate σ to behaviour you call good
**Set σ from a controller you already trust, not from the data the term was fitted on.** In the sim2sim2real ladder an imitation kernel had its width set from a frictionless plant. A controller that survives 89% of honest episodes sat 7.5σ off and earned 0.04 of a possible 1, so the term paid nothing to the behaviour it was meant to reward. A temperature $\tau = \text{mse}/\ln 2$, chosen so the known-good controller earns about half credit, made it 0.67 while balancing against 0.33 before a fall.
**Compare σ with what a component fixes before you build it.** The yaw estimator corrects about 5° of drift per 10 s episode (0.5 dps × 10 s). The heading term's σ is 0.25 rad, about 14°. The correction lands well inside the flat top, and removing the estimator cost almost nothing. Test: error removed per episode against the σ of the term that scores it.
:::

So the Gaussian gives a bounded, readable bonus with a known blind spot. But "bounded and non-negative" has a second consequence we have not looked at yet: a robot can collect a bonus by not doing anything at all.

### What does doing nothing score?

On the wheeled-leg robot that consequence is what keeps it alive. The episode ends at 45° of pitch, and an ended episode collects nothing more. Every step upright is worth up to 1 minus small penalties, so a long episode always beats a short one. That is the alive incentive, and it needed no extra term.

It holds only while the penalties sit below the bonus. The run that proved it had the slew weight at 10. Do the arithmetic the policy did: a modest voltage change of 0.3 in one step costs $10 \times 0.3^2 = 0.9$, almost the whole bonus. Balancing needs corrections of that size all the time, so an honest balancer nets close to zero per step. The alternative it found was to hold the action still, pay no slew at all, and fall over in about 40 steps. Early in training it was not collecting the bonus anyway, so it lost nothing. The log calls the result "quiet, not balanced": std fell from 0.34 to 0.09, because sampling noise was being charged as slew too, and episode length shrank. At weight 1.0 the same change costs 0.09, a tenth of the bonus.

Penalties are bids against the bonus. If the lazy behaviour outbids the intended one, PPO finds the lazy one first, because it is closer to where a random policy starts.

$$
\text{bonus}_{max} \;>\; \sum_k w_k\, \text{penalty}_k \quad \text{at the action sizes the task needs}
$$

::: tip
Read the inequality off the numbers: bonus capped at 1, slew about 0.09, tip damping 0.01-0.05, yaw a few hundredths. Everything negative is a tenth of the positive or less.
:::

Jumper fails the same check from the other side. A walking reward is mostly bonuses, and a motionless robot collects the ones that do not need motion: upright, pose near home, and the tail of the tracking Gaussian. On Jumper that was 52% of what a perfect walker earns. The fix was to score perfect tracking as 0 and anything worse as negative, so a parked robot cannot collect the tracking term. Try it in the lower half of the widget above. The terms and weights there are a toy I made up, since my notes have only Jumper's 52%, not its configuration. Switch the tracking term from a bonus to a penalty and the parked score drops below zero.

The opposite mistake is just as quiet. "Scale rewards, don't shift them": a positive constant per step pays the agent to survive, and a negative one pays it to end the episode early. A reward that can go negative per step teaches a robot that falling stops the bleeding, and it dives on purpose.

::: field Field notes: the standing score, and smoothness taxes
**Compute what a motionless robot scores before training.** Jumper: 52% of the walking reward. For an imitation reward, set the tolerance from the clip so standing still scores near zero (Jumper: 0.006).
**A smoothness penalty is also a tax on exploration.** Microduck ramps `action_rate_l2` from −0.1 to −1.0 over six stages, because charging jerk before the robot can walk makes doing nothing the cheapest strategy. The roller skates ran it at −1.0 from the first iteration, and Day 6 showed what that did to exploration. In their final run the action-rate penalty (−3.6) was larger than the task reward (+1.0).
**Regularisers that block motion the task needs make "do nothing" optimal.** Microduck keeps `body_ang_vel` at −0.05 and `angular_momentum` at −0.02 because a 25 cm biped needs real rotation to walk.
:::

So the fix is to pay for the outcome and make sure the outcome requires doing something. Then the robot gets inventive about what counts as the outcome.

### Every outcome number has a cheat

The case for outcomes is strong. Every shaping term is a strategy hint, and in sim2real the strategy is exactly what does not transfer, because it is tuned to the simulator's plant. "Stay on the spot, face the right way" is defined by the task, so it transfers. The trouble is that an outcome has to be measured by some number, and the policy maximises the number.

Jumper's jump shows the round of patches one number needs. Pay for height and the robot stretches a leg up. So height became the lowest of the feet and the body, with at least 1 cm of rise required. Pay per jump and it does many small jumps, so the payout for a second jump was cancelled, and in the end it was paid only for beating the episode's best so far.

The roller skates show what happens when the number is a signature of the skill instead of the skill. Wheel spin was added as a bootstrap: walking on blades moves the body, but only rolling spins wheels. Once spin was paid for, the policy produced it however was cheapest. Wheels spinning in the air counted. One rolling blade carried the four-wheel average, so the other foot walked: a scooter stroke. And a forward fall spins all four wheels, so falling forward paid. A −10 fall penalty had covered that in March, and it was dropped when the task reward changed. A signature makes a good check and a poor target.

The same post-mortem found the sharpest version. Every task term was multiplied by the command and none compared the robot's speed with it. Skating costs roughly the same effort at any speed while its pay grows with the command, so below cmd_x ≈ 0.25 standing still paid more, and above it the policy skated at a fixed 0.40 m/s, whatever was asked. A reward scaled by the command but blind to the error produces a switch, not a throttle. A network learns as many behaviours as the reward tells apart.

So when do you add a term? When you have seen a specific hack, and only then. Reward Microduck for feet in the air and it finds four:

| Hack | What it does | Blocked by |
|---|---|---|
| Shuffle | never lifts a foot, tracks velocity perfectly | `air_time` (+3.0): no air time, no reward |
| Hover | holds one foot up forever | `air_time`'s window: past 0.3 s it stops counting |
| Skim | passes through 2 cm for an instant | `foot_swing_height` (−0.25): the peak is checked at landing |
| Low sweep | swings fast at the wrong height | `foot_clearance` (−2.0): height error × foot speed |

::: tip
No single term specifies a gait. A set of overlapping terms does, where each term's hack is another term's violation.
:::

::: field Field notes: whack-a-mole, and the checks that catch it
**Expect 2-5 rounds of hack and patch per new robot.** That is normal, not a sign the reward is wrong.
**A gated metric parked on its window edge is the policy taking the minimum that pays.** Day 10's air time, 0.1254 s against a floor of 0.125, is a design answer, not a bug: move the floor if you want a different gait.
**The sign-convention trap.** mjlab's base terms return ≥ 0 and take negative weights; Microduck's custom `*_penalty` functions already return ≤ 0 and take positive weights. Mix them up and a penalty is double-negated into a reward, and the robot farms violations. Day 10's sign audit is the check that catches it.
:::

Four foot terms, each blocking one hack. Now tell the robot to stand still. Every one of them is still asking for a gait.

### Gate on the command, not a state machine

A tight pose term says "stay near HOME". Walking requires leaving HOME. Left unconditional, the two terms play tug-of-war, and the robot is punished for doing what it was told whichever mode it is in.

The obvious fix is two policies and a state machine that switches between them. Microduck does it with one policy and a multiply. The three foot terms are scaled by whether the command is above a threshold:

```python
total_command = linear_norm + angular_norm
scale = (total_command > command_threshold).float()  # 0.0 or 1.0
reward *= scale  # the gate
```

and the pose term switches its own σ: tight when standing, loose when walking.

| Command | Active terms | Behaviour |
|---|---|---|
| moving (cmd > 0.01) | velocity tracking, foot terms, head tracking, loose pose | walk with a proper gait |
| idle (cmd ≈ 0) | pose (tight), upright, head tracking | stand still at HOME |

::: tip
The gate lives in the environment's reward code, not in the network. The policy only ever sees the summed scalar. It learns the mode boundary from the command values in its own observation: zero command and standing still pays, non-zero command and shuffling does not.
:::

::: field Field notes: gates
**Zero the gait clock when the command is "stand"** (Jumper). A clock that keeps ticking asks for steps the gate has switched off.
**A command means something only if some reward tells it apart.** The roller cfg meant cmd_x = 0 as "coast", but no term paid for keeping speed without pushing. From 0.44 m/s, "coast" and "brake" both stopped the robot in about 1.2 s. Under "brake" one robot rolled backward at 0.57 m/s, which the braking term paid as stopped.
:::

Gates switch terms on and off by context. Training also switches them on and off by time: a smoothness ramp, a heading term from iteration 500, a bootstrap that is supposed to fade. And a bootstrap that pays every step, like wheel spin, is the one that took over. We need a way to help the search that cannot become the objective.

### Did you improve?

A state reward asks "where are you?", and it gets farmed from the cheapest spot. Pollen's velstand env learned this when plain uprightness and height rewards were collected from sitting and lying poses. The bicycle was the same failure: a reward for heading towards the goal, collected on every lap.

Picture a hike paid by elevation gain. You earn for every metre climbed and pay for every metre descended. Standing on a summit earns nothing, and any round trip nets zero. The elevation is a potential $\Phi(s)$, any score you choose for a state, and the extra reward is its change:

$$
F(s, s') = \gamma\, \Phi(s') - \Phi(s), \qquad \sum_{t=0}^{T-1} \gamma^t F(s_t, s_{t+1}) = \gamma^T \Phi(s_T) - \Phi(s_0)
$$

::: tip
Summed over an episode, every middle term cancels and only the end and the start remain. Every path gets the same shaping bonus apart from where it finishes, so shaping cannot invent a new favourite behaviour. It only hands out reward earlier. Ng, Harada and Russell proved in 1999 that this form, and essentially only this form, leaves the optimal policy unchanged.
:::

A circle on the bicycle now nets zero. Velstand replaced its state rewards with two such terms, uprightness and trunk height. TLDR: a potential term asks "did you improve?", and standing still never improves.

Here it is with numbers, from Sophie Zhao's robot-soccer example. The task pays 100 for a goal and nothing else, and the potential is $\Phi(s) = -$(distance from ball to goal). Knock the ball from 20 units out to 15 with $\gamma = 0.99$, and that one step pays $0.99 \cdot (-15) - (-20) = 5.15$, long before any goal. Leave the ball at 20 and the step pays $(\gamma - 1)\,\Phi = 0.2$. That is the fine print on "standing still earns nothing": with $\gamma < 1$, a parked state earns or costs $1 - \gamma$ of its potential every step. It is a trickle, and the sum above already counts it.

Why can't the bonus move the optimum? Whatever the robot does next, the path out of $s$ picks up the same $-\Phi(s)$ on top of its own return, and the far end fades with $\gamma^T$. So every shaped action value is the old one minus a number that does not depend on the action:

$$
Q'(s, a) = Q(s, a) - \Phi(s)
$$

::: tip
Take the same amount off every action's score in a state, and the best action is still the best. Shaping reorders nothing; it moves the zero.
:::

Now pick the best potential there is: $\Phi(s) = V^*(s)$, what the state is worth when you play perfectly from it. Then $Q'(s, a) = Q^*(s, a) - V^*(s)$, which is zero for the best action and negative for every other. That is Day 7's advantage, sitting inside the reward. Eric Wiewiora showed in 2003 that, for Q-learning, shaping with $\Phi$ makes exactly the same updates as learning without shaping from a table that starts at $Q = \Phi$ instead of zero. A potential is a head start: a guess at each state's value, handed over before training begins. The closer the guess is to the true value, the less is left to learn, and learning the value of states is the critic's job, which comes back in the last beat.

Never improving by standing still is also the term's limit. A potential term can speed up a goal but cannot define one. A robot sitting perfectly on its spot gets zero shaping, which is awkward for station-keeping, where sitting on the spot is the whole task. And wheel spin could not simply be converted into a potential: it would still need a real travel reward underneath.

The roller post-mortem lists four ways to stop a bootstrap taking over, strongest first:

1. Make it potential-based, so it pays for progress and cannot move the optimum.
2. Make it something the real goal already requires. Rolling is required for travel by rolling; maximum spin is not.
3. Move it out of the reward, for example by starting some episodes already rolling.
4. Fade its weight to zero, then check the skill survives without it.

::: field Field notes: when terms switch on
**Add a difficulty after the skill it threatens has settled.** On the roller, bearing drag added at iteration 750, just as wheel spin peaked, pushed the policy into farming the heading reward; it now starts at 2000. The action-rate increases at 250 and 500 dropped mean reward from about 31 to 13, and it took until about iteration 7,500 to recover.
**Space the stages.** On the wheeled-leg robot, sk_lean4 (per-wheel actions, 128×128) switched heading, half slew and full slew on at iterations 250, 500 and 1000. It never learned heading: it balances and spins in place at 1.6 rad/s, forfeiting the 30% heading factor for about 0.65 of the reward per step. The same architecture on a 500 / 1500 / 3000 schedule (sk_lean4b) holds heading to 0.003 rad/s. A metric that steps down at a stage boundary and stays down means the stage came too early.
:::

So far every fix has been to the reward. But PPO has a second network reading the same reward, and it is tempting to fix things there instead.

### The reward decides, the critic estimates

The critic is where all the extra information goes. On Jumper it may see true velocity and foot contacts; on the wheeled-leg robot it is "plant-aware"; on the roller it gets the wheel speeds the robot has no encoders for. Hand the critic the whole state of the universe and you might expect the policy to learn something better.

It does not, and the reason is the line between the two. The reward defines the objective: "be on your spot, face the right way". It is the specification the policy maximises. The critic only estimates how much of that reward is coming from here, and the policy uses the estimate to build its advantage. A more accurate critic means lower-variance gradients, which means faster learning, not a different answer.

$$
A_t = \underbrace{r_t + \gamma V(s_{t+1})}_{\text{reward fixes the target}} - \underbrace{V(s_t)}_{\text{critic only estimates}}
$$

::: tip
Change $r$ and you change what is optimal. Change what $V$ can see and you change how noisy the estimate of "better than usual" is. Privileged observations sit in the second slot.
:::

That gives a rule for critic inputs: judge one against the reward. If the reward depends on it, the critic needs it. The roller's task reward is computed from wheel spin, wheels keep spinning in the air, and nothing else in the observation reveals that, so the critic needs `wheel_vel` even though the actor never sees it.

It also explains why a big fall penalty is a poor idea even though it is paid once. Early in training every episode ends in a fall, so every return is about −100 plus a little. The critic's targets are dominated by when the fall happened rather than by anything the action did, and the value loss is spent fitting a cliff instead of the gentle landscape the bonus makes. Not fatal, just worse, and redundant with the alive incentive the bounded bonus already gives.

Let me regroup. We started by rewarding everything and learned that every term narrows the search, so the wheeled-leg robot pays one bounded Gaussian and charges three small penalties. The Gaussian's flat top forgives noise and its dead tail hides the way home. A bounded bonus keeps the robot alive only while every penalty stays below it, and a motionless robot should score near zero. Outcomes beat strategies, but every outcome number has a cheat, so terms are added only to block a hack you saw, and gated on the command so standing and walking stop fighting. Potential shaping helps the search without moving the optimum, and the critic, however privileged, only changes how fast we get there. Everything here is about what the reward says. Nothing yet is about what the policy can see while it is being scored.

## Pitfalls

- **A σ copied from somewhere else (beat 2).** The same number means different curves under $e^{-(x/\sigma)^2}$ and $e^{-x^2/2\sigma^2}$, and a σ fitted to another plant or another controller can leave the behaviour you want in the dead tail. Symptom: a term that logs near zero for the policy you know is good.
- **A penalty that can reach the bonus (beat 3).** Symptom: action std collapsing in the first few hundred iterations while episode length falls. The robot has found "quiet and fall".
- **Paying a signature (beat 4).** Wheel spin, feet in the air, distance moved. Symptom: the term saturates while the skill you meant never shows, and no logged metric shows the gap. For a command-scaled task, roll out at a few fixed commands: the logs cannot show speed.
- **Mixing the two sign conventions (beat 4).** Symptom: an `Episode_Reward/<penalty>` above zero, and a robot that gets better at the violation. Nothing crashes.
- **A stage that lands while the skill is still forming (beat 6).** Symptom: a metric steps down at a schedule boundary and does not come back. Split the stage or move it later, never earlier.

<!-- quiz -->

## Next

So what is the reward actually measuring? The wheeled-leg robot's bonus is computed from the true pitch, the true tip position, the true yaw rate: the simulator's own state. The reward scores the true pitch. The policy never sees the true pitch: it sees an IMU through a filter, four frames of it, with its own last action fed back. You might ask, what about the past? Day 1's Markov trump card assumed the observation was the state, and [Day 13](../day13/) checks whether it still is.

## Sources

- `notes/reward-design-shaping-sigma-and-the-critic.md` ([Notion](https://app.notion.com/p/3e467249ddbf81ed905edc52fc744d58)): reward the outcome, not the strategy; scale and shape; the flat top and the dead tail with σ = 5 cm; the six fixes; the reward vs the critic.
- `notes/design-insights-observations-actions-and-rewards.md` ([Notion](https://app.notion.com/p/3e467249ddbf814ebe4bdb138d4c6b2e)), §5 and §6: the estimator vs σ rule, and checking whether an existing term already supplies a structure. `notes/the-worries-of-simulation-and-how-to-diagnose-them.md`: the 5° vs 14° arithmetic.
- `notes/microduck-takeaways.md` ([Notion](https://app.notion.com/p/3dc67249ddbf80a9a46bfe303aab4f37)), "Reward design", "Reward decomposition to tackle reward hacking" and "Rewards being conditional": the term table and weights, Gaussian vs L1 vs L2, the four foot hacks, the sign convention, the command gate.
- `notes/deep-rl-hacks-schulman.md` ([Notion](https://app.notion.com/p/3e467249ddbf81039772e3df5492078f)): scale, don't shift; sane magnitudes; shaped vs sparse. From John Schulman, "The Nuts and Bolts of Deep RL Research" (Deep RL Bootcamp, 2017). Write-up: [github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks).
- `artifacts/wlbot-learning-log-aug-28.html`, Session 3 (also in the Aug 30 log): the wheeled-leg robot's reward term by term, the tip bonus, the alive incentive, the −100 fall penalty, slew weight 10, "hand-building a PD controller into the reward".
- `artifacts/roller-model-inquisition.html`: the on/off skater, wheel spin as a signature, the loophole table, bootstraps taking over, potential-based shaping and the hike, critic inputs judged against the reward, the smoothness tax and stage timing.
- `artifacts/jumper-field-guide.html`: the 52% standing score, the jump-height cheats, the 0.006 imitation tolerance, the traps table (0.0017 for 37,500 iterations, the gait clock).
- `artifacts/rl-presentation-plan.html`, Slide 11 and its Q&A tables: "reward everything I could think of", keep it simple, add terms only for an observed hack, conditional rewards.
- `artifacts/microduck-run-doctor.html`: the penalty sign audit and the air-time window edge at 0.1254 s (both from Day 10).
- `artifacts/the-sim2sim2real-verdict.html`: the kernel at 7.5σ earning 0.04, and $\tau = \text{mse}/\ln 2$.
- `artifacts/the-wobble-chase.html`: sk_lean4's 250-iteration stage spacing, 0.65 per step, 1.6 rad/s, and the spaced schedules at 0.003 rad/s.
- `artifacts/removing-more-made-it-better.html`: why removing the yaw estimator cost almost nothing.
- J. Randløv and P. Alstrøm, "Learning to Drive a Bicycle using Reinforcement Learning and Shaping", ICML 1998.
- A. Y. Ng, D. Harada and S. Russell, "Policy Invariance under Reward Transformations: Theory and Application to Reward Shaping", ICML 1999.
- E. Wiewiora, "Potential-Based Shaping and Q-Value Initialization are Equivalent", JAIR 19, 2003.
- S. Zhao, ["Potential-Based Reward Shaping in Reinforcement Learning"](https://medium.com/@sophiezhao_2990/potential-based-reward-shaping-in-reinforcement-learning-05da05cfb84a), Medium, 2025: the robot-soccer example, $Q' = Q - \Phi$, and the $\Phi = V^*$ reading.
- J. Clark and D. Amodei, "Faulty Reward Functions in the Wild", OpenAI blog, 2016 (CoastRunners).
- M. Andrychowicz et al., "Hindsight Experience Replay", NeurIPS 2017.
- Y. Tassa et al., "DeepMind Control Suite", 2018 (`tolerance()`); N. Rudin et al., "Learning to Walk in Minutes Using Massively Parallel Deep Reinforcement Learning", CoRL 2022.
