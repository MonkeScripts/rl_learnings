---
day: 15
minutes: 60
widgets: [env-step]
quiz:
  - kind: numbers
    q: "Physics steps every 2 ms and the policy acts at 100 Hz. What is the decimation, and how long is a latency of 3 slots in a delay line that is pushed on every physics tick?"
    choices:
      - "Decimation 2; 3 slots is 30 ms."
      - "Decimation 5; 3 slots is 6 ms."
      - "Decimation 50; 3 slots is 3 ms."
      - "Decimation 5; 3 slots is 30 ms."
    answer: 1
    explain: "Decimation is $f_{\\text{physics}} / f_{\\text{policy}} = 500 / 100 = 5$: five physics ticks per action. A ring pushed every tick counts in 2 ms slots, so 3 slots is 6 ms. A delay counted in policy steps could only say 0 or 10 ms, a large rounding for a robot whose real latency is a few milliseconds. (Beat 3: the split loop.)"
  - kind: numbers
    q: "A GPU solver spends about 14 µs of GPU time per environment per physics substep, summed over all environments, and one environment step is 5 substeps. Ignoring other overheads, roughly how many env-steps per second can the whole GPU deliver, against a trainer doing 52,000?"
    choices:
      - "About 71,000, faster than the trainer."
      - "About 2,800, a twentieth of the trainer."
      - "About 52,000, the same as the trainer."
      - "About 14,000, roughly a quarter of the trainer."
    answer: 3
    explain: "$1 / (5 \\times 14\\ \\mu\\text{s}) \\approx 14{,}300$ env-steps per second, about 3.6 times slower than 52,000. 71,000 forgets that one env-step is five substeps. At that rate a 1000-episode check takes minutes and a full training run most of a day, so the slower engine judges and the faster one trains. (Beat 1: three simulators, three jobs.)"
  - kind: why
    q: "A framework calls observation code once per policy step (100 Hz) and actuator code on every physics substep (500 Hz). The real robot's firmware filters its sensors at 500 Hz. Why put the simulated sensor filters in the actuator code?"
    choices:
      - "A filter depends on every sample; feeding it one in five changes its output."
      - "Actuator code runs on the GPU and observation code on the slower CPU."
      - "Observation code cannot add noise, so the sensor model must live elsewhere."
      - "Rewards are computed from observations and must not see filtered values."
    answer: 0
    explain: "Sensing shrinks: five truth samples go into the filters and one delayed reading comes out per policy step. That matches the firmware only if the filter sees all five, and the per-substep hook is the only place the framework calls that often. A sensor model living in an 'actuator' reads oddly; it is the framework's shape, not a bug. (Beat 3: the split loop.)"
  - kind: why
    q: "A balancing policy reads a few dozen floats (pitch, gyro, wheel speeds) and never sees an image. Why does a 15 GB photorealistic simulator buy it almost nothing over a plain physics engine?"
    choices:
      - "Rendering slows training so much that fewer robots fit on the GPU."
      - "Photorealistic simulators cannot model wheels or closed-chain legs."
      - "The renderer is outside the loop; contact, solver and motors decide transfer."
      - "Proprioceptive policies train on the CPU, where the renderer is unused."
    answer: 2
    explain: "Nothing the renderer draws reaches the policy, so it sits outside the loop that produces every training number. What decides whether a policy transfers is contact, constraint solving and the motor model, and the physics engine runs all three. A camera-based policy is where the renderer becomes essential; for proprioception the viewer is a debugging tool. (Beat 1: the biggest stack buys nothing.)"
  - kind: whatif
    q: "Two simulators run the same shared sensor code. A change to it adds a bug that biases the sensed pitch by 1°, the same in both. Your checks compare the two engines step by step and run a fixed-gain PD balancer in each, which stays up with pitch errors up to 3°. What do the checks report?"
    choices:
      - "A mismatch, since the bug shows up differently in each engine."
      - "A PD failure, since the balancer reads the same wrong pitch."
      - "A crash at reset, since shared code cannot read both engines."
      - "All green, since the engines agree and the PD still stays up."
    answer: 3
    explain: "Shared code makes the engines agree by construction, so a defect in it is shared too, and a check that compares them cannot see it. A 1° bias is inside what the PD tolerates. A trained policy is less forgiving: in the real case two such bugs passed every check and showed up only as a six-point survival drop in a 1000-episode eval of a strong checkpoint, which then became the acceptance check. (Beat 5: one plant, two engines.)"
  - kind: whatif
    q: "At 1024 environments each GPU kernel finishes its work in under 1 µs, but launching one costs several µs of CPU time, and a step issues about 2000 launches. You double to 2048 environments. Roughly what happens to the time per step?"
    choices:
      - "It barely changes; launches, not arithmetic, set the step time."
      - "It doubles, because every kernel now has twice the work."
      - "It halves, because larger kernels use the GPU more efficiently."
      - "It quadruples, because memory traffic grows with the square."
    answer: 0
    explain: "Each launch is a fixed handshake of a few microseconds whatever the job size, and the work itself is shorter than the handshake. Doubling the work per kernel adds little until the work outgrows the launch, so more robots is nearly free and fewer launches is the real fix: fuse kernels, and write branches as masks so the compiler can trace them. (Beat 4: the GPU waits on launches.)"
  - kind: whatif
    q: "The fall check runs once per policy step, after the last of 5 physics substeps. In one step the pitch passes the fall limit at substep 2 and is back inside it by substep 5. What does the episode record?"
    choices:
      - "A fall at substep 2, because the limit is checked on the physics clock."
      - "A fall at the end of the step, because the crossing is remembered."
      - "Nothing; the check only sees substep 5, where pitch is within the limit."
      - "A time-out, because the env marks partial falls as truncation."
    answer: 2
    explain: "Terminations are evaluated once per policy step, on the state at that moment, so anything between checks is invisible to them and the robot is scored as never having fallen. Whether that matters depends on how fast the plant can cross and come back. In any loop split across two rates, know which events are sampled and which are seen. (Beat 2: one env.step, in order.)"
  - kind: whatif
    q: "A simulator reads some parameters, including body mass, only when it compiles the robot's model file; everything else is re-applied at every reset. You double the mass in a run's config but do not recompile the model. What mass does the simulated robot have?"
    choices:
      - "Double, because the config is read again at every reset."
      - "The old mass, because the compiled model keeps its own value."
      - "Double after the first reset, the old mass before it."
      - "Four times, because randomisation scales it once more."
    answer: 1
    explain: "A build-time parameter is read once, when the model file is written; after that the live model carries its own value, and a reset re-applies only the per-reset terms. In the real case mass randomisation was a ratio against the config nominal applied to the compiled mass, so the config value even cancelled out of its own formula. Nothing errors, so add a test that compares the config with the compiled model. (Beat 6: building the body twice.)"
---

**Goal:** know how a manager-based env runs one step, how a 100 Hz policy and a 500 Hz plant share it, and how to keep one plant across two engines without the copies drifting apart.

## Where we left off

Day 14 ended with every number on the page scored by one engine, and a question only a second engine could answer: does the ranking belong to the robot, or to MuJoCo? To ask it at all we need to know what a simulator for robot learning is, which one does which job, and how the same plant gets into two of them.

For a long time the simulator was a CPU program that stepped one robot while the learner waited. Unity's ML-Agents gave the loop an owner, the "Academy", which collects observations, asks the policy, applies the action and resets when an episode ends. In 2019 Jemin Hwangbo and colleagues trained ANYmal in a CPU simulator and plugged a network learned from the real motors into the slot where the motor model goes. Then in 2021 Nikita Rudin and colleagues moved the whole loop onto the GPU with Isaac Gym, thousands of robots stepping at once, and their paper's title says what changed: learning to walk in minutes. Isaac Lab grew out of that line, and mjlab took Isaac Lab's manager-based API and put MuJoCo Warp under it. Newton is NVIDIA's newer GPU engine, which Isaac Lab's development branch is swapping in.

Their first attempt was the obvious one, and so was mine: get the biggest stack and do everything in it.

## The picture

Say you are learning a piano piece by touch, eyes closed. The obvious plan is to practise on the best instrument there is, in the best hall. But with your eyes closed, the hall and the lighting change nothing. What you learn is the key weight and the action under your fingers. The useful second purchase is not a better hall but a second keyboard, because a keyboard with an odd action teaches odd habits, and you only find them out on a different one.

Where it breaks: a pianist carries the same hands to both keyboards. A policy cannot. Everything between the network and the physics, the motors, the battery, the sensors and the firmware filters, has to be rebuilt inside each simulator, and two rebuilds drift. That comes later. The first problem is the hall: which simulator, for which job?

## Step by step

### The biggest stack buys nothing

The plan was to port the robot into the full Isaac Sim stack. That is a 15+ GB install that needs the Omniverse Kit runtime, particular driver versions and an MJCF-to-USD converter, on a headless training server. Then I asked what it buys. The policy reads a few dozen floats (pitch, gyro, wheel velocity) and never sees an image. Training runs with no screen at all. The renderer sits outside the loop that produces every training number. What decides whether a policy transfers between engines is contact, constraint solving and the motor model, and the physics engine runs all three. Isaac Sim becomes non-negotiable for a policy that looks through a camera. For proprioceptive control the viewer is a debugging tool, and Newton's web viewer, ViewerViser, does that over the same SSH tunnel as mjlab's.

So instead of one big simulator, three engines with three different jobs:

| Role | Engine | What it is for | Speed |
|---|---|---|---|
| Oracle | PyBullet + firmware PD | the firmware's gains must balance the simulated robot; reference trajectories; the only path to the real robot | one robot, CPU (PPO here: ~1,800 steps/s) |
| Trainer | mjlab on MuJoCo Warp | every policy, 1024 robots in parallel | 52,000 env-steps/s |
| Judge | Newton, Kamino solver | a different solver: a policy that passes on both is unlikely to lean on one engine's quirks | 14,000 env-steps/s |

The trainer and judge speeds are from the same RTX 5080. At the judge's rate a 1000-episode gate takes 3 minutes and a 5000-iteration training run about 17 hours, which settles who trains. My learning log quotes the move off PyBullet as roughly 1,800 to 350,000 steps per second; I think the two logs count steps differently, so compare the 52,000 with the 14,000 and not with the 350,000.

::: field Field notes: the PD gate is a trust check, not a baseline
**Run when:** before the first training run, and again after any plant change. **What it is:** the firmware's balance law, at the gains that hold up the real robot, must hold up the simulated one, in both PyBullet and MuJoCo. If it cannot, the simulation is wrong and nothing trained in it means anything. The number it produces is "does it stand", not a score PPO has to beat. **When not:** it is not a ranking tool. A PD law at fixed gains is forgiving, and beat 5 shows defects it cannot see.
:::

::: field Field notes: a new engine's first verdict is about its adapter
**What goes wrong:** Newton's first crossplay read 0 of 1000 surviving, and every cause was in my wrapper. Newton stores body velocity as (linear, angular), so the gyro channel was the body's sideways velocity. Kamino imports MJCF motors as PASSIVE, so nothing was actuated. The push wrench was written as (torque, force). The mass, friction and wheel-radius draws were never written into the model, which made Newton look easier than MuJoCo, 0.959 against 0.927. **Test:** before reading a judge's verdict, check that it is judging the same robot. ❌ An easier score on the second engine is a symptom, not a finding.
:::

One honest gap: Isaac Lab appears on this page only as a comparison. I never trained in it; the Newton wrapper drives the solver directly, because Isaac Lab's MJCF importer needs the full isaacsim runtime.

That settles who does what. But mjlab is a framework: we hand it a config and it owns the loop. What happens inside one `env.step()`, and where does our robot fit into it?

### Inside mjlab: one env.step, in order

The obvious way to read a framework is to read its config. `make_env_cfg()` reads three YAML files and merges them into one `ManagerBasedRlEnvCfg`: `sim_default.yaml` is the plant (geometry, motor constants, IMU, servo, solver settings), `randomization.yaml` is how wide each per-episode draw is, and `train_sk.yaml` is this run (reward weights and schedule, PPO, observation config, plus `sim:` and `rand:` overrides). mjlab turns that one object into six managers and calls their terms at fixed moments: actions, observations, rewards and terminations at the policy rate, commands on a timer, events at reset and per step. One more piece is not a manager at all: the actuator hook, which runs at 500 Hz.

<figure class="embed">
  <iframe src="../assets/embeds/manager-based-rl-env.html" title="How ManagerBasedRlEnv assembles the wheeled-leg task: config merge, six managers, the actuator hook" loading="lazy" style="height:720px"></iframe>
  <figcaption>The config merge, the six managers, the actuator hook and the build-time table. The diagram scrolls sideways on a phone. <a href="../assets/embeds/manager-based-rl-env.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

A list of managers still does not say when each one runs, and the order turns out to matter. Step through it:

<env-step task="wlbot"></env-step>

Three things in that order are easy to get wrong. Terminations are checked before rewards, so the reward of the last step of an episode is scored on the state that ended it. Resets happen after both, and the observation comes last, so an env that just reset hands PPO the reward from before its reset and the observation from after it. The wheeled-leg observation term keeps per-env step stamps to cope with exactly that. And terminations run once per policy step: if pitch passes the fall limit at substep 2 and recovers by substep 5, the check never sees it. Whether that matters for this robot is still open in my notes.

The embedded page lists the order in a tidier form, with events first and terminations after the observation. The widget follows the code instead: mjlab's `step()` runs terminations, rewards, step events, resets, commands and then observations. I read that from a newer local mjlab checkout than the 1.6.0 the robot's repo pins; the Split Loop's trimmed copy of the pinned version agrees on terminations, rewards, resets, observations.

Switch the widget to the stock velocity task for the version without my robot. mjlab ships it for the Unitree Go1 and G1, and it is the walkthrough to read first. Physics runs at 5 ms with decimation 4, so the policy acts at 50 Hz. The action is a joint position target per leg joint, and MuJoCo's own position actuators do the PD inside the physics step. The observation is base linear and angular velocity, projected gravity, joint positions and velocities, the last action, the command and a height scan, each with a little uniform noise added once at the policy rate. Rewards track the commanded twist with Gaussians (weight 2.0 each) and keep the body upright, under a few penalties. Episodes last 20 s, a twist is resampled every 3 to 8 s, and the robot is shoved every 1 to 3 s. Every piece of my robot's version has a counterpart there; mine is that task with a much heavier plant.

::: field Field notes: what the step order bakes in
**time_out is truncation, not failure.** The stock task even marks walking off the terrain as a time-out. Day 8's timeout bootstrap depends on this flag being right, and on the order above: by the time PPO sees the step, the observation has already been replaced by the reset one. **Ablate before construction.** The action delay range, filter coefficients, sensor noise and reward weights are read once when `ManagerBasedRlEnv(cfg)` is built, so an evaluation with `--clean` must pass its stripped configs into `make_env_cfg()`. Changing them on a built env does nothing. **The reward scores true pitch,** not the sensed pitch the policy sees.
:::

Every manager in that list runs at the policy rate. The motor law and the firmware filters need 500 Hz, and the only thing mjlab calls at 500 Hz is an actuator. So how do two rates share one step, and what does "500 Hz" even mean in one Python thread?

### The split loop: decimation 5

My first mental model was a pipeline of running components passing streams: policy, actuation pipeline, adapter, torque, mjlab, observations, adapter, sense pipeline, policy. It felt right and it was wrong. There is one Python thread. The pipelines are objects that hold state, a delay ring, filter states, a battery charge, and they do something only when a method is called on them. One function drives everything: `env.step(action)`, which rsl_rl calls once per policy step. The "stream" feeling comes from state that survives between calls. "Rate" means how often something is called, and each `sim.step()` advances simulated time by 2 ms however fast the GPU actually runs.

The two rates meet in one loop inside `step()`:

$$
\begin{aligned}
\text{decimation} &= \frac{f_{\text{physics}}}{f_{\text{policy}}} = \frac{500\ \text{Hz}}{100\ \text{Hz}} = 5 \\
\Delta t_{\text{policy}} &= 5 \times 2\ \text{ms} = 10\ \text{ms}
\end{aligned}
$$

::: tip
For every action the policy takes, the physics and the plant model tick five times. The stock Go1 task is the same loop with $200 / 50 = 4$.
:::

That loop works in two directions. **Actuation expands:** one command is held for five 2 ms ticks, and the torque differs on each, because back-EMF uses the wheel speed from 2 ms earlier and the battery sags with the current drawn. **Sensing shrinks:** five truth frames pass through the firmware's pitch and yaw filters, because a filter's output depends on every sample it saw, and the policy is shown one delayed frame per step. Latency follows from the expanding side. The delay ring is pushed on every tick, so a drawn latency of $d$ slots is

$$
\tau = d \times 2\ \text{ms}
$$

::: tip
Three slots is 6 ms, even though the policy only acts every 10 ms. mjlab's native observation delay counts in policy steps, so it could only say 0 or 10 ms. Real latencies on this robot are a few milliseconds, and rounding them to 10 is a large error for a balancing robot.
:::

Two more corrections to the first model: MuJoCo produces true state (qpos, qvel), not observations, which are ours to build; and rewards go to PPO, never into the observation ring.

<figure class="embed">
  <iframe src="../assets/embeds/the-split-loop.html" title="The Split Loop: how a 100 Hz policy and a 500 Hz plant share one env.step in mjlab" loading="lazy" style="height:760px"></iframe>
  <figcaption>The timeline figure, the mapping between the hand-written loop and mjlab's hooks, and how legged_gym, Isaac Lab and MuJoCo Playground own the same loop. English only. <a href="../assets/embeds/the-split-loop.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

::: field Field notes: work with the framework, not against it
**Put the 500 Hz plant in the 500 Hz hook.** The sense pipeline lives in the actuator's `update()` because that is the only per-substep entry point mjlab has. It reads oddly and it works. **When not:** if the wiring ever causes a real bug, the escape hatch is to override `step()` so the substep loop reads like the hand-written single-robot loop, which is Isaac Lab's "Direct" workflow done by hand. **Pattern across projects:** legged_gym fits in one readable loop because its plant is a PD law; Playground writes the step as a pure JAX function; we are a Direct-shaped env in a manager-only framework, and that mismatch is most of the friction. The richer the plant, the more it strains a framework's hooks. ⚖️ The friction costs readability, not correctness.
:::

That is the loop in simulated time, 2 ms per tick whatever the hardware does. In wall time the same tick at 1024 robots is something else, and when I profiled it the GPU was busy only 46% of the time.

### A thousand robots: the GPU waits on launches

The obvious reading of a slow GPU is too much work. One policy step took 20.5 ms of wall time, and the sense tick alone issued 280 GPU kernels per substep, 1400 per step, plus 275 from the actuation tick and 520 from the physics. Each kernel is a small program, and launching one is a handshake: the CPU describes the work, packs the arguments and sends it. The handshake takes a few microseconds whatever the size of the job. With 1024 robots each kernel runs over about a thousand numbers, which the GPU finishes in under a microsecond. The handshake is longer than the work, so more robots does not mean proportionally more throughput: the bottleneck is the number of instructions, not their size.

The fix for too many small kernels is to fuse them, and `torch.compile` does that if it can trace the function in one piece. What stopped it were lines where Python asks the GPU a question and waits:

```python
# before: ask the GPU, wait, build a variable-length index
if bool(self._pending.any()):
    ids = self._pending.nonzero()
    self.filter.reset(ids, ...)

# after: compute for everyone, keep it only where the mask says so
f.pitch = torch.where(m, seed_deg, f.pitch)
```

Graph breaks went from 12 to 0, the sense tick from 0.85 ms to 0.28 ms, and an iteration from 2.90 s to 2.57 s, 11% off. The next obvious tool, CUDA graphs, records the whole launch sequence and replays it with one call. It came out slower, 2.65 s: our ticks create fresh tensors every substep and reassign state, so before each replay PyTorch copies about 47 tensors back to their recorded addresses, and at 1024 robots the copies cost about what the launches did. It was measured, removed, and the reason left in a code comment.

<figure class="embed">
  <iframe src="../assets/embeds/launches-and-resets.html" title="Launches and Resets: why the GPU was idle half the time at 1024 environments" loading="lazy" style="height:760px"></iframe>
  <figcaption>The step budget, the CPU/GPU timeline, fusion, the CUDA-graph failure and the reset fix. The figures scroll sideways on a phone. <a href="../assets/embeds/launches-and-resets.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

::: field Field notes: measure one level deeper before editing
**What goes wrong:** both obvious targets were wrong. In the reset, the GPU-to-CPU round trip for the four-bar kinematics looked like the waste and cost 0.13 ms, 6% of the reset; the cost was in the indexed writes, and batching them took the reset from 2.12 ms to 1.81 ms. The CUDA graph looked like the tool for a launch-bound loop and lost to plain fusion. **Rule:** a host sync (`.any()`, `.nonzero()`, variable-shape indexing) inside a batched tick breaks the graph. Decide constant conditions once from the config. ✅ Masked `torch.where` everywhere. **Still open:** the GPU is still half idle, and the next lever is two experiments at once on one card.
:::

We got sidetracked a bit here, so a regroup. We dropped the big stack and split the work into an oracle, a trainer and a judge. Inside the trainer, one `env.step` runs an action, five plant-and-physics ticks, and then terminations, rewards, resets and the observation, in that order. Two rates share it because actuation expands and sensing shrinks, which is why latency lives on a 2 ms grid. And at 1024 robots the cost is launches, fixed by writing every branch as a mask. That mask style is also the answer to the worry I set aside in the picture: the plant itself, rebuilt once for the oracle and once for the trainer.

### One plant, two engines

Here is the fear in one sentence. You change the reward in one file and forget the other; the GPU trains for six hours on reward v2 while the CPU oracle still scores v1; every evaluation afterwards compares two different tasks, and nothing reports it. It was not hypothetical. Eight pieces of plant logic existed twice, as numpy for one robot and as torch for 1024: the observation, the reward, the two firmware estimators, the motor and battery and servo, the sensors, the randomisation and the delay lines. The GPU copies added up to 1,065 lines restating the CPU ones, held together by parity tests, so every change was two edits and a test run.

The original plan had been bigger still: one reward, one observation and one acting-and-sensing loop shared by all three engines. Working through mjlab and Newton showed how self-contained each framework is. mjlab builds its env from config classes and manager terms, and its trainer only works inside that structure. Forcing one training loop on top of it meant fighting the framework.

So what is really duplicated? It is tempting to call it numpy versus torch, or PyBullet versus MuJoCo. Neither is the real split. The numpy models already ran against MuJoCo, and every constant was already shared. The real split is one robot at a time versus a thousand at once:

```python
# one robot
pitch += gyro * dt
if acc_ok:
    pitch += (dt / (tau + dt)) * (acc_angle - pitch)

# any number of robots: acc_ok is a column of True/False, one per robot
pitch = pitch + gyro * dt
pull = (dt / (tau + dt)) * (acc_angle - pitch)
pitch = torch.where(acc_ok, pitch + pull, pitch)
```

With one robot the column has one row and the second version does exactly what the first does. What was missing was a batch dimension, not engine independence. So the plant became torch everywhere, state shaped `[n, ...]` with a device argument: n = 1 in float64 on the CPU for the oracle, n = 1024 in float32 on CUDA for the trainer. It is how Isaac Lab and mjlab write their own actuator and noise classes, and both test them at one env on the CPU. A ten-op motor tick costs 1.8 µs in numpy and 12.0 µs in length-1 torch, and the whole CPU env step got about twice as slow. That is the price of the oracle and the trainer running the identical code path, not just identical source. A parity test can only sample that agreement; one object on two devices makes it structural.

It went in as eleven commits, one model each, every one checked against the old code before its twin was deleted. Then step 9a, the sense pipeline, shipped two defects: the IMU lever-arm velocity added a second time, and zero pitch from the reset-time fallback. Both test suites, both PD gates and single-robot crossplay passed it. Only the 1000-episode GPU eval on a strong checkpoint caught them, as a six-point survival drop. The engines agreed with each other because they now shared the bug.

::: field Field notes: share only the plant, keep each engine's loop
**Share:** the actuation model, sensor noise and filters, the firmware estimators, the reward, the observation assembly, the delay lines and the randomisation draws. **Keep per engine:** the loop, the model file, the adapter that reads state into tensors and writes torques back. Everyone who deploys has two loops, a vectorised training loop and a single-robot deployment loop; the only choice is whether the second is a copy or shares the plant code. **Over-engineering test:** count real callers, not layers. Ours has four: mjlab, PyBullet, Newton and the firmware-parity tests. **Acceptance check:** the batched end-to-end eval against the previous commit (survival about 0.79, velocity error 0.115, yaw error 0.32), not a parity test. **What the field does:** most projects hand-copy the observation per target, and Upkie, whose reward shape we borrowed, added a Python backend kept in sync "by convention" that dropped the C++ path's IMU noise. **Still open:** the firmware's C observation assembler is the last second copy of the observation code.
:::

The longer write-up, with its six diagrams, the field survey and the commit table, is [One Plant, Two Engines](../assets/embeds/one-plant-two-engines.html) (opens as its own page).

Shared code covers everything between the policy and the physics. It does not cover the body each engine loads. That is still two files, generated twice, and the two engines were not even running the same law at the hip.

### Building the body twice

The body starts as the vendor's STEP assembly. A tool exports the parts, another reads the linkage pivots off the CAD into `geometry.json` (six pivot vectors, link lengths 52.03, 52.09 and 12.14 mm), and from there two generators write `wlbot.urdf` for PyBullet and `robot.xml` for MuJoCo. Both engines take the leg pose, spawn height and servo target from one kinematics object, so the obvious assumption is that the two files describe one robot.

The first place they part is the loop. Each leg is a four-bar, a closed chain, and URDF can only describe a tree. So in the URDF the closure is a comment, and PyBullet adds a point-to-point constraint after loading (maxForce 500, erp 1.0). MJCF writes it into the file as an equality connect, near rigid. The generators are asymmetric too: `gen_urdf` has a runtime caller, a fresh URDF per episode so PyBullet can randomise wheel radius, while `gen_mjcf` only runs at build time and the GPU env edits the compiled model in place.

The second place is the hip, and it is worse. PyBullet's hip servo is a position source, with a hard-coded `positionGain=0.3` that sits in no config file, no stiffness and no armature. MuJoCo's is a position actuator with kp 50 and a reflected inertia of 1e-3 on the joint, a value fitted to survival (1e-4 gave 0.55, 1e-3 gave 0.84) and above its own physics estimate. These are different laws, not two tunings of one. The wheel's reaction torque tilts the calf differently in each engine, while every gate from V0 to V4 stays green, because they compare settled poses and near-equilibrium trajectories. Only V5, a trained policy, exposed it.

::: field Field notes: build-time keys and run-time keys
**The line nothing marks:** some config keys are spent when the model files are generated (masses, the base box, geometry, the leg servo PD, the IMU body position); the rest are re-applied to the live model at every reset. An override on a build-time key reaches the merged dict and stops there. **Proof:** mass randomisation is a ratio against the config nominal, applied to the compiled mass, so the config value cancels out of its own formula. Doubling `masses.base` from 0.1858 to 0.3716 left PyBullet's base at 0.1858. **Same disease:** the IMU height was written three times, the config plus a literal in each generator; fixing only the config would have left CPU sim2sim on a 20 mm lever while the GPU trained on 40, and the parity gate could not see it. ⚖️ A rule of thumb for where a number goes: wrong on the real robot, the plant file; changed for an experiment, the train config. **Open:** a ~15-line validator that refuses build-time keys at run time is proposed, not built.
:::

With the plant shared and the model files checked, Newton could finally answer Day 14's question. The long-delay weakness from the ablations does not belong to MuJoCo: with the Kamino solver, sk_lean3's survival by held delay reads 0.946 / 0.916 / 0.883 against MuJoCo's 0.960 / 0.913 / 0.881, bin for bin. The one real engine difference it found was the knee: Kamino's loop joint gives 1 to 2 mm under load at touchdown, and at 83 mm of leg height and above the four-bar jumps toward its other assembly branch and the leg folds, so the Newton env holds the knee at its kinematic angle.

That is the second engine doing its job, and it leaves the uncomfortable half of the answer. My own notes put it in one line: agreement between simulators has not predicted the bench; improving the plant model has. Two engines agreeing only says they share a plant. It says nothing about whether that plant is the robot.

## Pitfalls

- **Trusting a new engine's first number (beat 1).** It is a verdict on the adapter. Newton read 0 of 1000 at first and then looked easier than MuJoCo because the randomisation draws were never written. Check that the judge is scoring the same robot before you read the score.
- **Ablating a built env (beat 2).** `--clean` or `--nominal` applied after `ManagerBasedRlEnv(cfg)` changes nothing that was baked: delay range, filters, noise, reward weights. The eval looks clean and is not.
- **Latency on the policy grid (beat 3).** A native observation delay counted in 10 ms policy steps cannot express the few milliseconds the robot actually has. The policy trains against the wrong delay and the long-delay bin is where you would see it.
- **A host sync in a batched tick (beat 4).** One `if bool(mask.any())` breaks the compiled graph and the step falls back to eager launches. The symptom is a GPU at half utilisation and an iteration time that does not move when you add work.
- **Overriding a build-time key (beat 6).** Masses, geometry and the hip PD are spent at generation time. The config says one thing, the model another, and no test compares the merged config with the compiled model.

<!-- quiz -->

## Next

You might ask: if two engines now agree, why does the robot on the bench still wobble? Agreement was the test I could run cheaply, and it passed. But both engines read the same plant file, so they can agree perfectly and both be wrong in the same way: a centre of mass in the wrong place, a motor law missing a friction term, a latency nobody measured. Two engines agree with each other and the bench still wobbles at 7-10 Hz. The plant both engines share is what is wrong. How do we make the simulated robot close enough to the real one, and cover the rest with randomisation? That is [Day 16](../day16/).

## Sources

- `artifacts/manager-based-rl-env.html` (primary): `make_env_cfg()` and the three YAML files, the six managers and their rates, the actuator hook, terminations, the build-time table. Embedded above, with its diagram and tables made to scroll at phone width.
- `artifacts/the-split-loop.html` (primary): decimation, actuation expands and sensing shrinks, the 2 ms latency grid, the first mental model and its corrections, four real callers, legged_gym, Isaac Lab manager-based vs Direct, MuJoCo Playground, the open termination question. Embedded above.
- `artifacts/launches-and-resets.html`: the 20.5 ms step budget, kernel launches, `torch.compile` and masked `torch.where`, the CUDA-graph failure, the reset fix. Embedded above, figures made to scroll at phone width.
- `artifacts/one-plant-two-engines.html` (primary): the drift fear, the eight duplicated models, the batch dimension, option B, the field survey, the eleven commits and step 9a. Linked above as a standalone page.
- `artifacts/wlbot-plant-map.html`: STEP to `geometry.json` to URDF and MJCF, the closure asymmetry, the two hip laws, the V0-V5 gates and what each cannot see, the IMU height written three times.
- `artifacts/wlbot-config-spine.html`: the three YAML files, the lifecycle line between build-time and run-time keys, the `masses` proof.
- `artifacts/the-wobble-chase.html`: Newton with the Kamino solver as a judge, the wrapper defects, the knee, the delay bins on both engines, 14,000 vs 52,000 env-steps per second.
- `artifacts/wlbot-learning-log-aug-30.html`, Session 1: the PD gate as a trust check, PyBullet as the oracle, the move from stable-baselines3 to MuJoCo Warp.
- `artifacts/rl-presentation-plan.html`, Slide 10 and its Q&A: the simulator roles and the Isaac Sim analysis (15+ GB, the policy never sees pixels, Newton's viewers).
- Probation report, section 3.2 ([Notion](https://app.notion.com/p/3f367249ddbf80d890eef6f59636b9c5)): oracle, trainer and judge; the original one-loop plan and why it was dropped; seeded crossplay; "work with each framework, not against it".
- `artifacts/the-floating-centre-of-mass.notes.md`: the 7-10 Hz bench wobble.
- `notes/chapter-5-unity-ml-agents.md` ([Notion](https://app.notion.com/p/28967249ddbf80fe8eabfe5bd45d4dc1)): the Academy as the owner of the loop.
- `notes/mjlab.md` and `notes/isaac-lab.md` are still empty Notion pages, so this day is written from the artifacts and from mjlab's source (`mjlab/envs/manager_based_rl_env.py`, `mjlab/tasks/velocity/velocity_env_cfg.py`).
- J. Hwangbo, J. Lee, A. Dosovitskiy, D. Bellicoso, V. Tsounis, V. Koltun and M. Hutter, "Learning agile and dynamic motor skills for legged robots", Science Robotics, 2019 ([arXiv:1901.08652](https://arxiv.org/abs/1901.08652)).
- N. Rudin, D. Hoeller, P. Reist and M. Hutter, "Learning to Walk in Minutes Using Massively Parallel Deep Reinforcement Learning", CoRL 2021 ([arXiv:2109.11978](https://arxiv.org/abs/2109.11978)).
- mjlab, [arXiv:2601.22074](https://arxiv.org/abs/2601.22074): "mjlab adopts the manager-based API introduced by Isaac Lab."
- MuJoCo Playground, [arXiv:2502.08844](https://arxiv.org/abs/2502.08844).
