---
day: 19
minutes: 60
widgets: [curriculum-timeline, recipe-tree]
quiz:
  - kind: why
    q: "A biped must walk on command and stand still when the command is zero. It spawns in its standing pose, so doing nothing already earns most of the pose reward. Why start with 2% of envs commanded to stand, rising to 25% later, instead of 25% from step zero?"
    choices:
      - "Standing needs more samples than walking, so it waits for a bigger batch."
      - "Standing is nearly free, so a big early share wins before any gait."
      - "Standing envs cost more to simulate, so they wait until learning settles."
      - "The standing reward is off early, so those envs would earn nothing yet."
    answer: 1
    explain: "Standing has almost no sample complexity; walking needs thousands of failed attempts, and PPO can only improve what the policy is currently trying. A quarter of the batch paid for outputting zeros is a quarter the network can satisfy before any gait exists. 2% keeps standing from being forgotten, and the rest is backfilled once walking is solid. (Beat 2: train the hard skill first.)"
  - kind: whatif
    q: "A walking policy's foot rewards pay only when the commanded speed is above 0.01, so at zero command the robot is paid to stand. Commands are drawn independently and uniformly: forward ±0.4 m/s, sideways ±0.3 m/s, turn ±1.0 rad/s. With no dedicated share of standing or turn-in-place commands, what do you expect?"
    choices:
      - "Every region gets data, since uniform draws cover the command space."
      - "Standing is learned best, since zero is the centre of every range."
      - "Turning saturates, and training stops on non-finite actions."
      - "Standing and spinning in place rarely come up, so neither is learned."
    answer: 3
    explain: "A command below 0.01 needs all three draws near zero at once, which almost never happens, and turning in place needs both linear speeds near zero, which happens a few percent of the time. The gate draws a boundary in the reward, but the policy only learns it where the batch visits. So the envs are split into buckets: some exact-zero, some turn-in-place, some forward-and-turn, the rest random. (Beat 3: gate the rewards on the command.)"
  - kind: numbers
    q: "A curriculum stage fires at 14,400 env steps per environment. Each iteration collects 24 steps per env and does 20 gradient updates. You double the rollout to 48 steps per env. At which iteration does the stage now fire, and after how many gradient updates?"
    choices:
      - "Iteration 300, after 6,000 updates."
      - "Iteration 600, after 12,000 updates."
      - "Iteration 300, after 12,000 updates."
      - "Iteration 1,200, after 24,000 updates."
    answer: 0
    explain: "$14{,}400 / 48 = 300$ iterations and $300 \\times 20 = 6{,}000$ updates, against 600 and 12,000 with 24 steps. The policy has seen the same experience per env but taken half as many optimiser steps. A schedule keyed on a counter changes meaning whenever the counter does, so check where each stage actually fired. (Beat 2: train the hard skill first, and the clock.)"
  - kind: numbers
    q: "Head tracking pays $r = \\exp(-e^2 / 2\\sigma^2)$ with $\\sigma = 0.5$, where $e$ is the error in radians. A policy ignores the head command and holds its head still. What does it score on a 0.05 rad command, and on a 1.1 rad one?"
    choices:
      - "0.951 and 0.089."
      - "0.995 and 0.298."
      - "0.995 and 0.089."
      - "0.951 and 0.298."
    answer: 2
    explain: "$e^{-0.0025/0.5} \\approx 0.995$ and $e^{-1.21/0.5} = e^{-2.42} \\approx 0.089$. At ±0.05 rad a clumsy policy is already nearly right, so a small range is a lesson it can pass, and the range widens as the gait forms. At 1.1 rad the bell is not flat and the gradient is there; what fails is a robot that falls over before it can collect it. (Beat 1: commands are difficulty knobs.)"
  - kind: why
    q: "A biped runs one network for walking while moving its head, but separate networks for walking and for a forward roll, switched by a small set of rules. Why not train one network for walking and rolling too?"
    choices:
      - "They cannot blend: half a walk and half a roll is not a behaviour."
      - "One network cannot hold two skills without a much larger hidden layer."
      - "Rolling needs a different simulator, so its data cannot share a batch."
      - "Rule-based switching runs faster on the robot than a bigger network."
    answer: 0
    explain: "Inside locomotion one network pays: it finds couplings nobody programmed, like shifting the hips when the heavy head yaws. Behaviours that must never mix get one policy each and a rule list that picks between them, with an unsafe state always going to a safe mode. (Beat 6: several skills on one robot.)"
  - kind: whatif
    q: "A walking policy's action-rate penalty is meant to ramp from −0.1 to −1.0 over the first 1,500 iterations. Instead you set −1.0 from iteration 0, while the policy cannot walk yet. What do you expect?"
    choices:
      - "Smoother gaits sooner, since jerk is punished before habits form."
      - "No change, since walking is learned from the speed reward anyway."
      - "Standing still becomes cheapest, and exploration collapses early."
      - "Training diverges, because this penalty outweighs every other term."
    answer: 2
    explain: "Charging for jerk before the robot can walk makes doing nothing the best strategy, and PPO's exploration shrinks to match. When a skating robot ran this from the first iteration, its action std fell from 1.0 to 0.3 within 100 iterations and gliding never appeared. Regularisers come after the skill they would tax. (Beat 2: train the hard skill first, and front-load it.)"
  - kind: whatif
    q: "A curriculum doubles a penalty weight in a single iteration at 500, 750 and 1,000, and you judge each stage by whether total reward dips and recovers within 100-200 iterations. You replace the steps with a smooth ramp to the same targets. What do you lose?"
    choices:
      - "Nothing: the run ends at the same weights, so it is the same run."
      - "Speed: a ramp always takes longer to reach the final difficulty."
      - "Stability: smooth changes let the policy overfit to each stage."
      - "The test: a stage that came too early becomes an undatable sag."
    answer: 3
    explain: "A step is a scheduled shock: a dip that recovers says the stage was on time, one that stays down says too early, and no dip says it could have come sooner. A ramp is kinder to the policy but has no moment where a dip can start, so the reading has nowhere to happen. Choose knowing which one you are giving up. (Beat 4: reading the boundaries, staircase or ramp.)"
  - kind: numbers
    q: "A hop is learned by feeding a recorded clip into the actions and the reward, faded out by $\\alpha(k) = \\operatorname{clip}\\left(\\frac{3000 - k}{2000}, 0, 1\\right)$ while a height reward takes over. How much does the clip still steer at iteration $k = 2{,}500$?"
    choices:
      - "0.75: three quarters left."
      - "0.25: a quarter left."
      - "0.50: half left."
      - "0: already gone."
    answer: 1
    explain: "$(3000 - 2500) / 2000 = 0.25$. $\\alpha$ is 1 until iteration 1,000, 0.5 at 2,000 and 0 from 3,000. Copying a clip caps out at the clip, and paying only for height has nothing to discover from, so the clip guides early and the outcome reward takes over: a curriculum on the help rather than on the task. (Beat 5: beyond walking, the same five slots refilled.)"
---

**Goal:** design a curriculum and a command distribution for a policy with several skills, read from the curves whether each stage came at the right time, and set up any new skill as the same RL problem with five slots refilled.

## Where we left off

Day 18 ended on one robot with one skill: balance and hold heading. Even there, sk_lean4 found it could earn 0.65 per step by balancing and ignoring the heading. A biped that walks, stands, turns its head and later skates needs several behaviours from one policy, and the hard one never gets learned if the easy one pays first. So how do we order the lessons?

People have been ordering lessons for networks for a while. In 1993 Jeffrey Elman trained a recurrent network on sentences with nested clauses and it failed on the full set; it only learned when training started with the simple sentences, or with a short memory that grew. He called the paper "the importance of starting small". In 2009 Yoshua Bengio and colleagues gave the idea its name, curriculum learning, and showed it speeding up training on shapes and language. For legged robots, Nikita Rudin and colleagues in 2021 trained thousands of simulated ANYmals with a game-style terrain curriculum: a robot that walked far enough was moved to harder ground, one that failed was moved back.

None of that stops anyone from starting where everyone starts. The slide I gave colleagues says it plainly: "If the task is too hard at the start, the robot never gets any reward to learn from." Their first attempt was the obvious one, and so was mine: throw the full task at the robot from step zero.

## The picture

Teaching someone to ride a bike, the obvious plan is to practise everything in every lesson: pedalling, steering, braking, and the track stand, balancing at a standstill. Same amount of each, from the first day.

It goes wrong in a specific way. The track stand looks like the easy one, so the learner "practises" it with both feet on the ground, collects the praise for not falling over, and never gets the speed that makes balance on a bike easy in the first place. Riding is the hard skill, and it needs nearly all the early practice. The easy part paid first, and the hard part had nothing to learn from. On a robot the first place this shows up is a command the policy cannot follow yet.

## Step by step

### Commands are difficulty knobs

Microduck is a 25 cm biped with 14 servos, trained in mjlab with 4096 envs × 24 steps per iteration for 50,000 iterations. Its policy takes three commands, each resampled on its own timer: a twist (forward ±0.4 m/s, sideways ±0.3 m/s, turn ±1.0 rad/s), a head pose for four neck and head joints, and a body pose. The head is 38% of the robot's mass.

The obvious thing is to sample every command over its full range from the first iteration. Ask for ±1.1 rad of head (about 63°) while the policy can barely walk, and it is being asked to throw 38% of its mass around before it knows how to balance. The note's account is that the head command then reads as noise and the weights behind the head-command slots never develop.

I am not fully sold on the note's reason for that. Head tracking is a Gaussian reward:

$$
r_{\text{head}} = \exp\!\left(-\frac{e^2}{2\sigma^2}\right), \qquad \sigma = 0.5
$$

::: tip
$e$ is the head's tracking error in radians. A head that ignores a 0.05 rad command still scores $e^{-0.005} = 0.995$; ignoring a 1.1 rad command scores 0.089. At 1.1 rad the bell is not flat, so the gradient is not literally invisible. What I would bet on instead, untested: a big head command knocks over a robot that cannot walk yet, the episode ends, and whatever the tracking term says, there is very little episode left to say it in.
:::

Either way the fix is the same. Start the head range at ±0.05 rad, about 3°, small enough that a clumsy policy roughly satisfies it, and widen it as the gait forms: ±0.17 at iteration 500, ±0.39 at 1000, ±0.72 at 1500, ±1.1 at 2000. The policy is then stretching a skill it has, not discovering one from scratch. Body pose tracking is switched off (weight 0) in this env, and its range still sits at ±0.005 instead of exactly zero, so those inputs keep varying. Day 13 showed what an input that never varies does: on the roller skates a 3° head command knocked over 98% of the robots.

Randomisation is a difficulty too, and gets the same treatment, but only where it changes the task itself. The trunk's centre of mass is randomised from ±3 mm, widening to ±15 mm by iteration 1500, because shifting the CoM moves the equilibrium the policy is still trying to find. Everything else is fixed from step zero: battery 6.5 to 8.2 V, action delay 3 to 6 steps, encoder bias ±0.86°, IMU misalignment ±6°, mass and inertia ±5%, joint friction ±10%. Those are moderate enough not to wreck early learning. Which dimensions to ramp was found by experience, not by a rule.

::: field Field notes: commands and DR as difficulty knobs
**Put in when:** a command or a randomisation changes what "balanced" means (head pose on a head that is 38% of the mass, CoM offset). **Leave it out when:** the range is moderate enough that an early policy survives it; Microduck keeps six DR dimensions fixed from step zero. **What goes wrong:** a difficulty you did not schedule. The roller cfg capped its own CoM randomisation at 10 mm on purpose, and the mjlab base template it builds on registers its own startup CoM shift of ±25 mm sideways and ±30 mm vertical, which the roller never removed. Which bodies that event moves was not checked, so its real size is unconfirmed. **Test:** list the events of the *built* env, not just your cfg file. ⚖️ A template's events come along with the template.
:::

So every command can now be learned. But a knob only sets how hard each lesson is, not who gets the practice. Standing is a command too, the zero one, and it is the easiest thing the robot can do.

### Train the hard skill first, and front-load it

Microduck's policy has to stand still whenever the command is zero, so some envs must be commanded to stand. The obvious split is the final one, 25% standing, from the start.

But standing is close to free. The robot spawns at HOME, and doing nothing already earns most of the pose and upright reward. A quarter of the batch paying for "output zeros" is a quarter of the batch the network can satisfy before any gait exists, and it will latch onto it. Walking is the hard part: alternating legs, single-leg support, foot clearance, all of it found through thousands of failed attempts. PPO learns from on-policy data, so it can only improve what the policy is currently trying. So Microduck starts at 98% walking and 2% standing, just enough not to forget, and backfills: 5% at iteration 500, 10% at 750, 15% at 1000, 20% at 1500, 25% at 2000.

The smoothness penalty is the same lesson from the reward side. `action_rate_l2` starts at −0.1 and ends at −1.0, because charging for jerk before the robot can walk makes doing nothing the cheapest strategy. The roller skates ran it at −1.0 from the first iteration; Day 6 has what that did (action std fell from 1.0 to 0.3 within 100 iterations, and glide never appeared). The head-bias penalty waits even longer: off until about iteration 600, then 1.0, 2.0 and 3.0 by iteration 1500, because fixing a drooping head is polish, not a skill.

And all of it finishes early. Every track is at its final value by iteration 2000 of 50,000, about 4% of the run. The curriculum's only job is to get the policy through the hard early exploration; the other 96% is consolidation at full difficulty, because a policy whose task is still changing at iteration 30,000 never settles.

That leaves the question of what "iteration 2000" means. Microduck keys every stage on env steps, counted per environment:

$$
\text{env steps} = k \times N_{\text{steps}}, \qquad N_{\text{steps}} = 24
$$

::: tip
$k$ is the iteration. The stage at 12,000 env steps lands at iteration 500 because each iteration collects 24 steps per env. Double the rollout to 48 and the same stage lands at iteration 250, after the same amount of experience per env but half as many gradient updates.
:::

The wheeled-leg robot learned the other half of this the hard way. Its CPU config said "ramp the pushes over 2.5M environment steps", which at 8 envs × 2048-step rollouts was 153 PPO updates. Ported literally to 4096 envs × 24 steps it was 25, and the policy met full-strength pushes before it could balance: episode length rose to 55 and fell back to 41. Its `RampCurriculum` now scales the push cap and the initial tilt from zero over a fraction of the run (`warmup_fraction: 0.5`), which survives a change of env count and rollout length. A per-env step count survives the first and not the second; a fraction survives both and moves when the run length moves. I do not know which clock is right in general. The optimiser counts updates, the policy counts experience, and the two notes pick different ones.

::: field Field notes: budget and clock
**Put in when:** one policy has an easy skill and a hard one. Give the hard one nearly all the early experience (98% walking) and backfill the easy one. **What goes wrong:** a penalty at full strength from step zero is also a tax on exploration (the roller's std collapse). A ramp keyed on a counter whose meaning changed: the wheeled robot's ramp finished in 25 updates. Day 10 has a second version: a config frozen at import time made a ramp meant to end at 50% of training end at 9.4%. **Test:** log the curriculum value itself (`Curriculum/*`) and check the iteration where each stage actually fired against the one you meant. ✅ Front-loading: everything done by 2000 of 50,000.
:::

So the policy walks first and learns to stand later. Now one network has to do both, and the rewards that teach one of them fight the other.

### Gate the rewards on the command

Walking needs the legs to leave HOME. A tight pose reward says "stay at HOME"; the velocity reward says "move". Add them up unconditionally and every step is a compromise between two terms pulling in opposite directions.

The obvious fix is a state machine: a standing controller, a walking controller and a switch. Day 12 already has Microduck's alternative, one network with the switch in the reward: the foot terms (air time, clearance, swing height) pay only when the command is above 0.01. The other half of the same gate is the pose term, which changes its tolerance with the command:

$$
\begin{aligned}
r_t &= \sum_i w_i\, g_i(c_t)\, r_i(s_t, a_t) \\
g_{\text{foot}}(c) &= \mathbb{1}\!\left[\,\lVert v^{\text{cmd}}_{xy}\rVert + \lvert \omega^{\text{cmd}}_z\rvert > 0.01\,\right]
\end{aligned}
$$

::: tip
$g_i$ is 0 or 1, computed from the command $c_t$ before the terms are summed. At zero command the foot terms switch off and pose tightens, so the robot is paid to stand; when a command arrives the gait terms switch on and pose loosens. Two modes, and they stop fighting over one std.
:::

A gate only helps if every region of the command space shows up in the batch. Sampled independently from uniform ranges, "turn in place" needs both linear speeds near zero at once, which the note estimates happens about 2% of the time. Not enough to learn spinning. So the 4096 envs are split into buckets: 2% exact-zero standing (the share that grows to 25%), 20% forward and turn only, 15% turn in place, and the rest fully random. The timers are staggered as well, twist every 3 to 8 s and head pose every 2 to 5 s, so the policy sees "keep walking while the head moves" and not only "everything changes at once". Within locomotion one policy covers the whole space and blends inside the network: (0.3, 0, 0.5) becomes a curved walk. Skills that must not blend get their own policy: walking and a forward roll are separate ONNX files, because nobody wants 50% roll.

The roller skates are Day 12's counterexample: a reward scaled by the command but blind to the error learned an on/off switch, and "coast" stopped exactly like "brake". A command means something only if some reward tells it apart.

::: field Field notes: rewards gated on the command
**Put in when:** one policy has modes that want opposite things (stand vs walk). Gate the terms on the command; switch a std rather than fight with one. **When not:** behaviours that must never blend (walk vs roll) get separate policies. **What goes wrong:** a command whose reward cannot tell it from its neighbour, and a gait clock that keeps running while the command is "stand" (Jumper's fix: zero it). **Test:** roll out at a few fixed commands and measure what the robot does. The roller's `Metrics/twist/error_vel_xy` read 0 for the whole run because its metrics function was empty, so only a rollout showed the on/off switch.
:::

So one network walks, stands and looks around, and six schedules move under it during the first 2000 iterations, sometimes four of them at the same boundary. How do we know a stage came at the right time?

### Reading the boundaries: staircase or ramp

Microduck's stages are hard jumps, not ramps. At iteration 749 the action-rate weight is −0.2; at 750 it is −0.4. The policy feels its smoothness penalty double in one tick, and it doubled at 500 as well.

![Terminal plot of Microduck's action-rate curriculum as a staircase from −0.1 to −1.0, stepping at iterations 500, 750, 1000, 1250 and 1500](../assets/img/day19/staircase.png)

*My own plot of the staircase. The terminal render places the step labels slightly off; the schedule in the widget below is the reference.*

The obvious reading of a curve that drops at a boundary is that something broke. Day 10's run doctor took that reading apart on this very run: every jump dips the curve on purpose, a healthy boundary recovers within 100 to 200 iterations, one that stays down came too early, and no dip means it could have come sooner. Here the same readings are a question about the schedule.

<curriculum-timeline mode="stair" it="750"></curriculum-timeline>

Pick the boundaries in turn; the readings are Day 10's. The three that are still below their pre-shock level 200 iterations later are 1000, 1500 and 2000, and all three widened the head range. So did 500, and it recovered, so I cannot pin it on the head. A heavier penalty lowers total reward by design, so a total-reward curve cannot settle this: the run doctor's rule is to check the raw `Metrics/*` behind the shocked term before calling it, and my notes do not have that check for these three. They stay open.

Now flip the toggle to the ramp. Spread the same targets over hundreds of iterations and the largest change per iteration falls from ×2 to well under 1%. That is kinder to the policy, and it is what the wheeled robot's `RampCurriculum` does. But it also takes away the boundary: there is no moment where a dip can start, so the dip-and-recover reading has nowhere to happen, and a stage that came too early just shows up as a slow sag nobody can date. A staircase is a test you schedule. Microduck never ran a ramp version, so I have no curve for it, only the trade.

A dip is also a clock for when a stage should come, and the roller skates got it wrong twice (Day 12): the action-rate raises at 250 and 500 landed on a skating skill still forming, and bearing drag at 750 landed just as wheel spin peaked.

::: field Field notes: reading a boundary
**Healthy, too aggressive, too timid:** Day 10's three readings. **Add a difficulty only after the skill it threatens has settled** (roller bearing drag: 750 ❌, 2000 ✅). **Failure signatures to tell apart from a scheduled dip:** total reward rising while tracking stays flat (the regularisers got cheaper, the robot is still and smooth); reward rising with `fell_over` rising (a high-reward transient that ends in a fall); `mean_std` below 0.1 within a few hundred iterations (exploration stopped). **What goes wrong:** a kill rule keyed on total reward fires on a scheduled dip (Day 14, sk_lean5_s0).
:::

That is a lot of machinery, so a regroup. Commands became difficulty knobs, so each one starts small enough to learn. The experience budget went to the hard skill first and the whole curriculum finished in the first 4%. Gating the rewards on the command let one network walk and stand without a state machine, and the command buckets made sure every region of the command space got data. The staircase made every stage a scheduled test, read by whether its dip recovers. All of it assumed one thing, though: that the skill is velocity tracking with extras. A jump, a dance or a bow has no velocity command to put on a curriculum.

### Beyond walking: the same five slots, refilled

The obvious move for a new skill is a new framework. My Jumper field guide's point is that you do not need one. A walking task has five slots, and every other skill refills them:

| Slot | Walking | Other skills |
|---|---|---|
| Goal | target speeds | a recording, a pose, a timeline of poses, or nothing |
| Observation | sensors, joint angles, last actions, the goal | adds a clock, or the next few frames of a recording |
| Reward | a bell-shaped score for matching the goal | closeness to a recording, or a measured result such as height |
| Episode start | standing | random points in a recording, mid-air, or where the previous skill ends |
| Episode end | a fall or a time limit | drifting from the recording, or landing |

Two rules hold for every skill: the critic may see true velocity and foot contacts while the actor sees only real sensors (Day 13), and before training you check what a motionless robot scores (52% of the walking reward on Jumper, Day 12). Then three questions about the skill pick one of four recipes.

<recipe-tree></recipe-tree>

The guide's own widget was a placeholder, so the three questions are my reading of its "use it when" column. The recipe the questions land on most often for a showy skill is the last one, and it is this Day's idea again. Copying a clip caps out at the clip: Jumper's imitation jump reached 0.159 m against the clip's 0.162 m. Paying only for height has nothing to discover from. So the clip is fed into the actions and the reward, and faded out as the height reward takes over, full until iteration 1,000 and gone by 3,000. The guide gives only those two points; if the fade is linear in between, it is

$$
\alpha(k) = \operatorname{clip}\!\left(\frac{3000 - k}{2000},\; 0,\; 1\right)
$$

::: tip
$\alpha$ is how much the clip still steers at iteration $k$: 1 until 1,000, 0.5 at 2,000, 0 from 3,000. The straight line between is my guess; the guide only says full and gone. It is a curriculum on the help instead of on the task: the training wheels come off on a schedule, and beak-throw keeps a 0.1 floor instead of taking them off completely.
:::

The clip has to steer the actions, not only the reward; with the clip in the reward alone, Jumper learned a crouch. And for anything timed, the network should not keep the clock itself. Day 13 has the dance that drifted to 126 BPM against 100: a script or the controller counts ticks of the 50 Hz loop (tick 250 is 5 s) and writes the current target into the input, like a karaoke screen highlighting the next word.

::: field Field notes: new skills
**Help that withdraws:** start episodes mid-move, or add a helper that withdraws once 60% of attempts succeed. ✅ Same idea as copy-then-fade. **Outcome rewards:** every number has a cheat; pay only for beating the episode's best. **What goes wrong:** a recording that disagrees with the simulator (replay it with no policy first: joint order, limits, floor height); a setting parsed but never applied (a backflip helper at weight 0 was skipped for two versions). **Open:** Jumper's posture policy already tracks twist, pitch, roll and height, so a command timeline could drive it. Nobody has tried this yet.
:::

So any skill is the same problem with the slots refilled. Some of them blend inside one network and some cannot, which leaves two questions for the robot: which policy runs right now, and which checkpoint of it do we ship?

### Several skills on one robot, and which checkpoint ships

The obvious answer to the first is one giant policy for everything. Inside locomotion that is what Microduck does, and it pays: nobody programmed the hip shift that keeps the CoM over the feet when the head yaws hard, the single network found it. A walk model and a head model blended 50/50 would not know about each other's effect on balance. But a roll and a walk cannot blend, so across skills the answer is one policy per skill and a small rule list on the robot: an unsafe state goes to a safe mode, a button enters its skill, and otherwise it walks. Handovers are cleaned up by the controller: ease the joints to the next skill's start pose first, start a recorded motion's clock on entry, and end gestures at the standing pose so the return to walking is in the data. In Jumper, "one sentence to a motion" is an AI agent following written playbooks with tests and a fixed list of control names. There is no text-to-motion model.

The obvious answer to the second is the last checkpoint. It is not necessarily the best: in one repo the guide lists, success fell from 100% to 8% by the last checkpoint. Pick checkpoints with a fixed test set, on fall rate and video, and replay them with the curriculum set to the checkpoint's iteration (Day 10). The Microduck note's rule of thumb is that for a 50,000-iteration run that plateaued by 5,000, anything from 10,000 on is probably comparable; the roller plateaued at 5,000 to 7,500, and later checkpoints ran the same stroke and fell less.

::: field Field notes: the one rule
"Next to every number you set, write down why and what you measured." Every number on this page has a reason next to it in my notes, which is why the ones without one (the three unrecovered boundaries, the fade shape, which clock to key on) are easy to find.
:::

The guide ends with a ladder of projects to try on Microduck, in order:

| Step | Project | Recipe |
|---|---|---|
| 1 | Lean, crouch or look around while walking | walking plus a command |
| 2 | A short head-and-body dance played from a script | command timeline |
| 3 | A fixed step rhythm that stops when told to stand | walking plus a clock |
| 4 | A nod or wave copied from three or four key poses | copy a recording |
| 5 | A small hop from a hand-made trajectory | copy, then fade |
| 6 | The highest hop it can manage | reward the outcome, paying only for new records |
| 7 | Switch between skills from a gamepad | one policy per mode |
| 8 | Playbooks and tests so an agent can add skills | agent workflow |

Every rung is the same five slots, trained with PPO, in a simulator, against a world that does not push back.

## Pitfalls

- **Full ranges from step zero (beat 1).** A head command the policy cannot follow yet, or a slot that is always exactly zero. The symptom is a tracking term that stays flat after its range has widened, or, on the roller, a 3° command later knocking over 98% of robots.
- **The easy skill gets the budget, or the tax arrives first (beat 2).** 25% standing or −1.0 action rate from the first iteration. The symptom is `mean_std` collapsing within a few hundred iterations and a robot that stands beautifully and never walks.
- **A clock that changed its meaning (beat 2).** A curriculum keyed on total samples, ported to more envs, finishes in 25 updates; episode length rises and falls back (55 → 41). Check where each stage actually fired.
- **A dip read as a failure, or a stuck dip read as noise (beat 4).** Total reward is supposed to fall when a penalty gets heavier. Judge the stage by whether it recovers within 100 to 200 iterations, on the raw metrics if the total cannot say, and never key a kill rule on total reward.
- **Shipping the last checkpoint (beat 6).** 100% to 8% in one repo. Pick on a fixed test set and video.

<!-- quiz -->

## Next

Every skill on this page was the same five slots refilled and trained with PPO in a simulator: one robot, a reward someone wrote, and a world that does not try to win. You might ask what lies outside that box. Another agent that learns back, as in self-play; a model of the world the robot can plan in; data collected once and learned from offline; language as the goal. That is the electives, which are not written yet: multi-agent and self-play first, then a map of the frontier. Until they appear, the way on leads back to the [course map](../).

## Sources

- `notes/microduck-takeaways.md` ([Notion](https://app.notion.com/p/3dc67249ddbf80a9a46bfe303aab4f37)): "Learning curriculum" (the six tracks, front-loading, env steps, train hard skills first, only CoM curricularised), "Rewards being conditional", "Command staggering and distribution", "Training introspection" (boundaries, failure signatures, `mean_std`), "Checkpoint selection".
- `artifacts/rl-presentation-plan.html`: Slide 12 and its curriculum timeline table.
- `artifacts/microduck-run-doctor.html`: the real reward curve and the six boundary readings in the widget, curriculum-aware expectation. Embedded on [Day 10](../day10/).
- `artifacts/jumper-field-guide.html` (primary for "beyond walking"): the five slots, the four recipes, who keeps the clock, the traps table, running skills on a robot, the Microduck ladder.
- `artifacts/roller-model-inquisition.html`: the inherited ±25 mm CoM event, the action-rate raises at 250 and 500, bearing drag at 750 and 2000, the on/off switch, coast vs brake, the empty metrics function.
- `artifacts/wlbot-learning-log-aug-30.html` (Session 3) and `notes/ppo-takeaways-clean.md`: `RampCurriculum`, `warmup_fraction: 0.5`, the ramp that finished in 25 updates.
- `images/microduck-takeaways/01.png`: my staircase plot.
- J. L. Elman, "Learning and development in neural networks: the importance of starting small", Cognition 48, 1993.
- Y. Bengio, J. Louradour, R. Collobert and J. Weston, "Curriculum Learning", ICML 2009.
- N. Rudin, D. Hoeller, P. Reist and M. Hutter, "Learning to Walk in Minutes Using Massively Parallel Deep Reinforcement Learning", CoRL 2021 ([arXiv:2109.11978](https://arxiv.org/abs/2109.11978)).
