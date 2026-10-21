---
day: 16
minutes: 60
widgets: [dr-grid, delay-survival]
quiz:
  - kind: why
    q: "A simulator draws an IMU mounting error uniformly within ±6° on a random axis, fresh every episode. The real sensor is mounted 5° off in pitch, always. A robot standing still cannot tell a tilted sensor from a tilted body. Why calibrate the 5° on the robot instead of trusting the ±6° draw to cover it?"
    choices:
      - "The range is too narrow: 5° sits near its edge, and widening it to ±10° would cover the offset."
      - "Nothing reveals the offset, so the policy learns the draw's mean, zero, and meets 5° as an edge case."
      - "Sensor noise is added after the mounting error in simulation, so the two cancel out during training."
      - "Mounting errors matter only while walking, and this draw is applied only while the robot stands."
    answer: 1
    explain: "Randomising a value buys adaptation only if the policy can infer it from what it observes, and a standing robot cannot. So the ±6° draw trains tolerance to the size of an offset, around a mean of zero. The real robot is the same 5° robot in every episode, at the edge of what the policy tolerates. A fixed bias is a measurement problem: calibrate it, and randomise only the residual. (Beat 5: only what the policy can infer, and never a bias.)"
  - kind: whatif
    q: "To speed up training, you pretrain a wheel-balancing robot on an idealised plant with no action delay, no Coulomb friction, no viscous damping and no battery sag. It never falls there. You then test it on the full plant, with real friction and 5-45 ms of random action delay. What do you expect?"
    choices:
      - "Slightly below the full-plant policy: gravity dominates, so only fine corrections are missing."
      - "Better than the full-plant policy, since it never learned to fight noise that is absent."
      - "It falls almost every episode, because friction and delay are part of what the task is."
      - "It fails only in the longest-delay episodes and matches the full-plant policy elsewhere."
    answer: 2
    explain: "With only gravity in the plant, the policy learns a reactive law for a robot that does not exist. Without Coulomb friction it learns voltage corrections too small to move a real wheel; without delay it never learns to predict across one. When this was tried, survival on the honest plant was 0.019. A support plant may drop noise and pushes, but it must keep the dynamics that define the task. (Beat 6: the shortcut, and what it may remove.)"
  - kind: numbers
    q: "An inverted pendulum's natural frequency scales as $\\sqrt{g/l}$, where $l$ is the centre-of-mass height above the axle. A plant file puts $l$ at 85 mm; weighing the parts shows it is 58.5 mm, where the pendulum's frequency is about 2.07 Hz. At what frequency did a policy trained on the 85 mm plant learn to balance?"
    choices:
      - "About 1.72 Hz: $2.07 \\times \\sqrt{58.5/85}$."
      - "About 3.01 Hz: $2.07 \\times 85/58.5$."
      - "About 1.42 Hz: $2.07 \\times 58.5/85$."
      - "About 2.50 Hz: $2.07 \\times \\sqrt{85/58.5}$."
    answer: 0
    explain: "$\\sqrt{58.5/85} \\approx 0.830$, so $2.07 \\times 0.830 \\approx 1.72$ Hz. A longer pendulum falls more slowly, so the trained policy expects more time to react than the real robot gives it. The 85 mm was never measured: it was a firmware constant read as physics, which is why every plant number gets a tag saying where it came from. (Beat 3: tag every number by where it came from.)"
  - kind: numbers
    q: "A friction scale is randomised around its measured value of 1.0, either uniformly on [0.7, 1.3] or as a Gaussian with mean 1.0 and σ = 0.15. The measurement turns out 20% high: the real robot sits at 0.80. Under each choice, how does the probability density at 0.80 compare with the density at 1.0?"
    choices:
      - "Uniform: the same. Gaussian: about 0.80 of it."
      - "Uniform: about 0.41 of it. Gaussian: the same."
      - "Uniform: the same. Gaussian: about 0.14 of it."
      - "Uniform: the same. Gaussian: about 0.41 of it."
    answer: 3
    explain: "Uniform puts the same density everywhere in its range, so 0.80 gets as much training as 1.0. The Gaussian gives $e^{-0.2^2 / (2 \\cdot 0.15^2)} = e^{-0.89} \\approx 0.41$ of its peak. The draw models uncertainty about one fixed value, so the question is coverage, and a Gaussian bets training time on the centre being right. (Beat 4: randomise around what you measured.)"
  - kind: numbers
    q: "A servo model gives motor torque as $\\tau = \\frac{k_t}{R}U - \\frac{k_t^2}{R}\\omega$. A fit finds $k_t^2/R = 0.143$ N·m per rad/s, and the gearbox's viscous friction is 0.016 N·m per rad/s. About what share of the servo's total velocity damping is electrical back-EMF?"
    choices:
      - "About 10%"
      - "About 50%"
      - "About 90%"
      - "About 99%"
    answer: 2
    explain: "$0.143 / 0.159 \\approx 0.90$. A spinning motor is also a generator, and its voltage fights the supply, so most of this servo's damping is electrical. A model that leaves back-EMF out and fits extra friction instead gets speed and settling wrong as soon as the supply voltage changes. (Beat 2: always measure the plant, the actuator first.)"
  - kind: why
    q: "In a servo model the firmware's gain $K$ and the motor constant $k_t/R$ only ever appear as the product $K \\cdot k_t/R$. Two fits on nearly the same data return $k_t$ = 0.47 and 0.91 with equal error. Why read $K$ from a register the hardware logs rather than let the optimiser fit both?"
    choices:
      - "Only the product is identifiable: every split scores the same, so fits land anywhere."
      - "The optimiser can only handle a few parameters before it stops converging within its budget."
      - "Register values are always more accurate than anything that is fitted from motion data."
      - "Fitting both overfits the training loads, so the model then fails on a held-out load."
    answer: 0
    explain: "Double $K$, halve $k_t/R$, and the torque is identical, so the score cannot tell the fits apart and two runs land at different points on the same ridge. Pin what the hardware reports, and the remaining unknowns each leave their own fingerprint. Then judge the fit on runs it never saw, with a gain and a load held out. (Beat 2: always measure the plant, the actuator first.)"
  - kind: whatif
    q: "A robot on the bench wobbles at 7 to 10 Hz. Its simulator has rigid links and a rigid tyre, and sweeping every plausible joint armature and servo stiffness puts the model's modes at 1.5 to 3.1 Hz and above 34 Hz, never in between. You widen the randomisation of armature and stiffness much further. What do you expect?"
    choices:
      - "Some draws now land at 7-10 Hz, so the policy learns to damp the wobble seen on the bench."
      - "The wider draws make the policy too cautious: it balances worse and the wobble stays."
      - "Training diverges, because the stiffest draws make the simulation numerically unstable."
      - "Still nothing at 7-10 Hz: the mode needs compliance the model lacks, not a better value."
    answer: 3
    explain: "Randomisation covers uncertainty in quantities the model has. If no setting of its parameters produces a mode in the band, the band is empty, not mistuned, and wider ranges only spread the draws over plants that are all wrong in the same way. The missing mechanism, such as flexing links, tyre sidewall or backlash, has to be added to the model. (Beat 7: what is still not in the plant.)"
  - kind: why
    q: "A simulator gives the policy pitch as true pitch plus white noise. On the robot, the firmware passes pitch through a complementary filter with a 0.5 s time constant before the policy sees it. The rigid-body physics match well. Why is the filter the gap to close first?"
    choices:
      - "Filtered pitch is more accurate than noisy pitch, so the robot is getting an easier task."
      - "The policy only acts on what it observes, and on the robot that signal lags the body."
      - "Filters matter only above the control rate, and the robot's loop runs slower than training's."
      - "The white noise in training is larger than the filter's lag, so the gap is already covered."
    answer: 1
    explain: "The policy never sees physics; it sees what the sensors and firmware produce, and it acts through the motor driver. A 0.5 s filter shifts every observation into the past in a way training never showed, and phase lag hurts most on a tall, slow pendulum. Perfect physics is out of reach anyway, so match the chain the policy actually touches. (Beat 1: match the sensor pipeline, not the physics.)"
---

**Goal:** measure the plant before randomising it, tag every number by where it came from, randomise only real uncertainty around measured values with a distribution that covers, and check that the policy can infer what it is randomised over.

## Where we left off

Day 15 ended with two engines that agree with each other and a robot on the bench that still wobbles at 7 to 10 Hz. Agreement between simulators had not predicted the bench; improving the plant had. Both engines share one plant, so the plant is what is wrong. How do we make the simulated robot close enough to the real one, and cover the rest with randomisation?

This wall is older than this robot. In 2017 Josh Tobin and colleagues at OpenAI trained an object detector on images with absurd random textures and lighting, and it worked on real camera images it had never seen: the real world was just one more variation. A year later Xue Bin Peng and colleagues did the same for dynamics, randomising mass, friction, damping and latency for a robot arm pushing a puck, and gave the policy a recurrent memory so it could work out which robot it was in. The same year Jie Tan and colleagues at Google got a Minitaur quadruped to walk from simulation, and the two things that mattered most were an accurate actuator model and simulated latency, with randomisation on top. In 2019 Jemin Hwangbo and colleagues gave up on modelling ANYmal's series-elastic actuators by hand and learned them from logged data.

Their first attempt was the obvious one: make the simulator more accurate.

## The picture

Say you are learning to drive in a simulator before taking a rental car abroad. The obvious plan is a perfect replica: model this exact car, its brakes, its tyres, the road.

You cannot. You do not know which car you will get, the brakes wear, the tyres were changed last month. So you practise in lots of slightly different cars instead, hoping the rental is one of them. But that only works if the cars you practise in are spread around a car that resembles the rental. Practise around the wrong car and the rental is the strange one at the edge of your experience, however many cars you drove. Practise on a car with no brakes at all, because brakes are hard to model, and you have learned nothing about stopping.

The first problem is the replica: if perfect physics is out of reach, what exactly has to match?

## Step by step

### Match the sensor pipeline, not the physics

The policy never sees physics. It sees the numbers the sensors produce, after the firmware has filtered them, and it acts through a servo or a motor driver that does what it does with the command. Perfect physics is impossible anyway: friction, shell flex and cable drag will never match. So the obvious ambition, a faithful world, aims at the wrong thing.

What can match is the chain the policy actually touches. Microduck's tables spell it out on both sides:

| Path | Real hardware | In training |
|---|---|---|
| Gyro and gravity | IMU on the trunk board | MuJoCo sensors, ±6° random-axis misalignment, noise (±0.03 on angular velocity), 0 to 1 step of delay |
| Joint positions | Dynamixel magnetic encoders | qpos, ±0.86° per-joint bias drawn once per env, noise, 0 to 1 step of delay |
| Command delay | USB to the Dynamixel bus, ~60 to 120 ms, measured | A ring buffer, 3 to 6 steps at 50 Hz |
| Actuator | XL330 firmware PD, 7.4 V LiPo that sags | BAM model: firmware PD → voltage (6.5 to 8.2 V, load-dependent sag) → back-EMF → current → torque → gearbox friction |

On the wheeled-leg robot the same rule went one step further, and Day 15's split loop is where it lives: the firmware's pitch and yaw filters run on every 2 ms substep, and the action delay is counted on that grid, so the policy sees the ESP32's signal rather than a tidier one.

::: field Field notes: match the pipeline
**Put in when:** always, for every input and every output. Make the observations look like the real sensors (noisy, delayed, biased, misaligned) and the actuator respond like the real one (voltage-limited, friction-loaded, delayed). **When not:** quantities the robot never measures. Base linear velocity has no sensor on Microduck, so it goes to the critic only. **What goes wrong:** the price of transliterating the firmware is that a policy gets pinned to that firmware's signal processing and timing. Day 17 shows what that costs when the runtime changes.
:::

So the target is the pipeline, and the pipeline is made of numbers: a delay, a filter constant, a torque constant. A datasheet will happily give you some of them. Are they right?

### Always measure the plant: the actuator first

At this size the actuator model is the biggest source of sim2real error. If the simulated servo is too strong, too fast or too frictionless, the policy learns a gait the real one cannot follow. So the leg servo, a Feetech HD-1910, went onto a pendulum rig: four loads, a Kp × Kd grid, four trajectories of 6 s, 192 logs at one voltage and 240 across two. A BAM (Rhoban's Better Actuator Models) simulator replays every log at 5 ms, and CMA-ES tunes its numbers until the replay matches.

The model is short. The firmware turns position error into a duty, the driver into volts, and the motor into torque:

$$
\tau_{\text{motor}} = \frac{k_t}{R}\,U \;-\; \frac{k_t^2}{R}\,\omega
$$

::: tip
The first term is the push: volts in, torque out. The second is the brake: a spinning motor is also a generator, and its voltage fights the supply. With the fitted numbers $k_t^2/R = 0.143$ N·m per rad/s, about nine times the mechanical viscous friction (0.016). Most of this servo's damping is electrical, so a model without back-EMF gets speed and settling wrong.
:::

The obvious next step is to let the optimiser find everything at once. That failed in an instructive way. The firmware gain and $k_t/R$ multiply, so doubling one and halving the other gives the same torque and the same score. Two fits on nearly identical data returned $k_t$ = 0.47 and 0.91, with armature 3.5× apart, at almost the same error.

The fix was to stop fitting what the hardware already reports. Register 60 logs the duty the firmware applies, so on the Kd 0 runs the gain is a straight line, read off with no simulator at all:

<figure>
  <a href="../assets/img/day16/fw_gain.png" target="_blank" rel="noopener"><img src="../assets/img/day16/fw_gain.png" alt="Left: duty from register 60 against Kp times position error for four Kp values and both voltages, all on one line of slope 0.169. Right: the error_gain_ratio the fitter returned when left free, 0.69, 0.85 and 1.60, against the measured 1.006."></a>
  <figcaption>Left: 370,000 samples, four Kp values, two voltages, one line of slope 0.169. Right: what the fitter returned for the same number when it was free. From my HD-1910 calibration notes.</figcaption>
</figure>

With both firmware gains pinned, armature agreed within 5% between runs and the stall torque matched the datasheet. And the fit is judged on runs it never saw: Kp 8 and a fourth load are held out.

<figure>
  <a href="../assets/img/day16/anatomy.png" target="_blank" rel="noopener"><img src="../assets/img/day16/anatomy.png" alt="A held-out lift-and-drop run at Kp 8, 7.25 V: measured arm, goal, the joint two-voltage model and the old 6 V model, with four features annotated: lag behind the goal, torque cut at 2 s, overshoot and decay, where it stops."></a>
  <figcaption>A validation run the fit never saw. The lag sets k<sub>t</sub>/R against gravity; after the torque cut only inertia and friction act. The joint two-voltage model scores 0.036 rad here, the old 6 V-only model 0.066.</figcaption>
</figure>

That old model is the other lesson. Fitted at one voltage, it was up to twice as bad at the other, because only the push grows with voltage: a strong motor with heavy friction and a weak motor with light friction look the same until the battery changes.

::: field Field notes: the actuator fit
**Put in when:** always, before any policy is trained on the actuator. **Do:** pick the control mode the model can describe (mode 4, error straight to PWM, not mode 0 with hidden ramps); read and pin every number the hardware reports; design tests so each unknown leaves its own fingerprint (loads for armature, torque-off for friction, a second voltage for motor vs friction); fit across the voltages the robot will see. **What goes wrong:** unseeded parallel CMA-ES on a flat, stick-slip landscape lands somewhere different every run, and BAM ignores the start values, so only the bounds matter. **Test:** run the fit twice. A number that moves while the score does not is not decided by the data.
:::

Even pinned, one number would not settle:

<figure>
  <a href="../assets/img/day16/kt_pinned_fits.png" target="_blank" rel="noopener"><img src="../assets/img/day16/kt_pinned_fits.png" alt="Six fits with kt pinned at 0.60. Left: fitted R from 2.7 to 4.1 ohm against a validation error that stays between 28 and 33 mrad. Right: fitted R against the share of motor torque lost to friction, scattered."></a>
  <figcaption>Six fits with k<sub>t</sub> pinned at 0.60: R spans 2.7 to 4.1 Ω while the validation error barely moves. Armature stays at 0.0015 to 0.0019 in all six. R needs a real ammeter.</figcaption>
</figure>

For simulation that matters less than it looks, since every fit replays the arm within about 0.02 to 0.04 rad. But the servo was the part we went looking at. The crack is the parts nobody looked at, because their numbers looked fine.

### Tag every number by where it came from

The wheeled-leg robot's base centre of mass was one of those. It was not measured. A firmware gain-schedule constant called L_COM held 85 mm, the base link's CoM was reverse-solved so that the whole robot came out at 85 mm, and the answer put 185.8 g of chassis 25.3 mm above the top of its own box, in empty air. It stayed there for eleven days.

The target was never reachable. 38 to 44% of the robot's mass sits on the axle and contributes no moment, so with the base's mass anywhere inside the body, the whole-robot CoM can only be 46 to 75 mm. The 85 mm was the boot height, `height_ref_mm`: the simulator read the constant's name rather than its role. A kitchen scale makes the impossibility concrete: on two supports the configured value would need a 292.6 g reading from a 185.8 g part.

It matters because a wheeled balancer is an inverted pendulum, and a longer pendulum falls more slowly:

$$
f_n \propto \sqrt{\frac{g}{l}}
$$

::: tip
$l$ is the CoM height above the axle. At the decreed 85 mm the plant's natural frequency was 1.71 Hz; with the base's mass inside its box (58.5 mm) it is about 2.07 Hz. A policy trained on the slow pendulum reacts too late on the real one.
:::

Nobody was careless. The value was coherent when written, against a 100 mm placeholder box; the commit that brought in the real CAD body made it impossible, and nothing compared the two. "Two numbers, two owners, one hard physical relationship, and no meeting point." So the fix is an assertion (the CoM must lie inside the body box), not more care. The replacement came from weighing the battery and servos and volume-weighting the other parts: 7.25 mm, bounded to −2.6 to +16.9 mm, and 57.0 mm for the whole robot.

The general habit is a tag on every number in the plant file. From the wheeled robot's provenance table:

| Tag | Example | What it lets you do |
|---|---|---|
| MEASURED | wheel radius 19.205 mm; base, leg, wheel masses 185.8 / 40.1 / 32 g; IMU height 40 mm | Randomise around it, narrowly |
| FROM CAD | link lengths 52.09 / 52.09 / 12.06 mm; thigh and rod masses (volume × 1.2 g/cm³) | Trust geometry, distrust masses |
| FIRMWARE | boot height 85 mm; the servo tick map | Keep in step with the firmware, never treat as physics |
| CONVENTION | closure stiffness, link inertias as thin rods | Know it is a choice |
| PLACEHOLDER | hip servo kp 50; hip armature 1e-3 kg·m² | Replace with an experiment before trusting any result that leans on it |

The hip armature is the uncomfortable one. Day 15 has how it was fitted to survival; here the point is that it sits above its own physics estimate of 3.1 to 6.0e-4, so it is gear friction folded into inertia. The IMU height had its own story beyond the three copies Day 15 found: the CAD and the ruler both measured the ESP32 board instead of the MPU6050 20 mm above it.

::: field Field notes: provenance and gates
**Put in when:** the first time a plant number is written. **What goes wrong:** a number adopted from another component (a firmware constant, a reward lever) gets solved against rather than measured, and survives because the thing it contradicts was a placeholder. **Fix:** an assertion that encodes the physical relationship. **When the fix breaks a gate:** the lower CoM made the robot topple faster in three open-loop gates. They were re-baselined by shortening the settle window from 0.5 s to 0.15 s, which is all the contact check claims to measure, never by widening the 2 mm and 2° bars. **And:** changing a plant number is an era break; earlier training numbers stop being comparable.
:::

The probation report counts the CoM correction as the single biggest fix: every result improved after it. But it did not explain the 7 to 10 Hz wobble, and I come back to that in beat 7. For now the tags have done their job. Some numbers are measured with a spread, some are placeholders, some will never be pinned. What do we do with the uncertainty that is left?

### Randomise around what you measured

This is where domain randomisation comes in: train on many slightly different robots, so the real one is just another variation. The obvious version is "randomise everything, widely". Gravity, link lengths, control rate, all of it, because more variety must mean more robustness.

It does not. Randomising gravity teaches the policy physics the robot will never meet, and that is paid for in performance in the real 9.81 m/s² world. Microduck randomises none of joint limits, link lengths, control frequency or gravity: they are known from CAD, or varying them creates physics the robot cannot exhibit. The wheeled robot hit the other failure. Every bench session that showed a gap became a new or wider axis, until "the list had stopped being a robustness tool and become system identification in disguise, with ranges that were guesses".

So three rules. Centre each range on the measured value. Size it to the real uncertainty. And choose the distribution on purpose, because the distribution decides where the training goes. The draw is not a model of how likely each plant is; it models your uncertainty about one fixed value you do not know. So the question is coverage:

$$
\begin{aligned}
&x \sim \mathcal{U}(a, b) \\
\text{or}\quad &\ln x \sim \mathcal{U}(\ln a, \ln b),\;\; p(x) \propto \frac{1}{x}
\end{aligned}
$$

::: tip
Uniform spends the same training on every part of the range. Log-uniform spends the same training per ratio, so a friction range spanning a decade gives the easy low end and the hard high end equal time. A Gaussian spends most of its training near the centre: a good deal when the centre is right, and a thin tail where the real robot sits when it is not.
:::

<dr-grid preset="foot" dist="uniform" real="1"></dr-grid>

Try it. With the foot-friction range and the real robot at the measured value, Gaussian puts 26% of draws within ±5% of it against uniform's 17%. Now say the measurement was 20% high and drag the real robot to 0.80×. Uniform still gives it 13% and the same density as anywhere else; Gaussian drops to 9%, and the density at the real robot is 0.41 of the density at the measured value. The case for a Gaussian is speed ("more time near the likely value"), which is a training-cost argument. If uniform needs 3000 iterations and Gaussian 2000, run 3000. You can always buy more iterations; you cannot buy back a fall on the bench because the real friction sat where the policy barely trained.

The slide version says "aim for the real robot to be the most likely sample". Read with the coverage rule, that means: centre the range on a good measurement, so that the real robot is in the middle of the population, not an edge case. It does not mean narrowing the draw onto your best guess.

Microduck's ranges are the worked example, in two layers. Startup events give each of the 4096 envs a fixed personality for the whole run: trunk CoM ±25 mm xy and ±30 mm z, encoder bias ±0.86°, mass and inertia ±5% in log space, foot friction 0.7× to 1.3×. Reset events add per-episode variation on top: CoM ±3 mm (curriculum up to ±15 mm), BAM friction scale and armature 0.9× to 1.1×. Voltage 6.5 to 8.2 V, delay 3 to 6 steps and IMU misalignment are always on. In mjlab the split is also mechanical: ranges are baked in when the env is built and values drawn per episode (Day 15's build-time trap).

::: field Field notes: which distribution, how wide
**Uniform by default; log-uniform for scale-like parameters** (friction, mass ratios). ❌ Gaussian as a speed-up. **Don't randomise** gravity, link lengths, joint limits, control rate. **Ramp what moves the equilibrium.** Only CoM is on a curriculum on Microduck: shifting it changes the balance point itself, which confuses a policy that has not learned balance yet. "An accumulating CoM randomiser once degraded every long run for months." **Watch for:** a list of axes that grows after every bench session. That is system identification with guessed ranges; go back and measure.
:::

So the draw is centred and covers. But a draw only buys robustness if the policy can tell, during an episode, which robot it got.

### Only what the policy can infer, and never a bias

A randomised parameter has two possible effects. If something in the observation reveals it, directly or by its effect over a few frames, the policy adapts per episode, and that is real robustness. If nothing reveals it, the policy learns the average parameter and pays at both tails of the range, which is usually where hardware sits. Day 13 worked this through for the wheeled robot's delay: drawn 5 to 45 ms per episode, it can only be identified by matching issued actions against responses that arrived, and that takes history.

Day 14's tail bin is the test for it, read here as a randomisation question. Bin the episodes by the delay they drew, and compare the longest-delay bin with the mean:

<delay-survival view="seed0" show="both" arm="h1"></delay-survival>

The one-frame arms that kept the low-pass, h1 and h1_noreg, lost 0.13 to 0.18 on the 36-44 ms bin against the control, far more than they lost overall. combo, one frame with no filter, lost only 0.024: one fresh sample still says something about now, where one filtered frame is mostly the past (Day 13, beat 3). The rule from all of it: bin the evaluation by the drawn value and compare the tail with the mean. A wide gap means the policy learned the mean instead of adapting.

The same reasoning breaks the zero-centred draw. Microduck's real IMU board is mounted about 5° off in pitch. The simulator draws misalignment up to ±6° on a random axis, and a standing robot cannot tell a tilted sensor from a tilted body, so the policy learns the average, which is zero. The real robot is the same 5° robot in every episode. ±6° trains tolerance to the magnitude; it does not correct the bias. That is calibrated in the runtime (`imu-pitch-offset`), not trained.

::: field Field notes: randomise or calibrate
**Randomise when** the policy can infer the value online, or you genuinely do not know it. **Narrow or fix when** nothing reveals it, or you have measured it: calibrate the nominal and randomise around the residual. **Systematic offsets** (mount bias, encoder zero) are measured on the robot. Encoder bias is the exception that fits: it is drawn once per env at startup and held, which matches a real servo's fixed offset until recalibration. **Test:** the tail bin against the mean.
:::

Let me regroup, because that was five beats. Perfect physics is out of reach, so we match the pipeline the policy touches. The pipeline is made of numbers, so we measure them: the actuator by fitting with what the hardware reports pinned, the CoM by weighing and an assertion. The tags say which numbers are still guesses. Around the measured ones we randomise only real uncertainty, with a distribution that covers, and only what the policy can infer; biases get calibrated instead. All of that makes the training plant honest, and honest is hard: PPO has to learn the behaviour and the robustness together. The obvious shortcut is to learn the behaviour on an easy plant first.

### The shortcut: pretrain on an idealised plant

That is the sim2sim2real idea, and Day 14 already walked through the experiment and its pre-registered predictions. Here only one point matters: what "idealised" is allowed to remove.

The first ladder removed every sim2real axis and also Coulomb friction, viscous damping and battery sag. The phase-A policy never fell on its own plant from iteration 200. On the honest plant it survived 0.019. Putting back only nominal friction, damping and sag already halved it, to 0.42 on the clean evaluation; adding the delay range removed the rest. The probation report puts the hardware reading next to it: the real loop carries 20 to 40 ms of delay and needs a predictive law, but the reference taught a reactive one; with no Coulomb friction it learned voltage micro-corrections that never move a real wheel.

The second ladder kept nominal friction, damping and sag and one held 12 ms delay, and removed only noise, pushes and randomisation. Then the pretrain transferred: warm-started from it, the honest-plant run reached the control's plateau in about 100 iterations instead of about 700, at the same final survival, with lateral drift halved. The imitation term on top added nothing measurable, so the recipe kept the two plants and dropped the forward model. The full write-up is the [sim2sim2real verdict on Day 14](../day14/).

::: field Field notes: the support plant
**Put in when:** you rerun training often on a plant whose belief keeps changing. The saving is on reruns (15 minutes instead of 5 hours); the first run costs no less. **The rule:** the support plant keeps the dynamics that define the task. On a wheeled inverted pendulum that is friction and a real action delay. **What goes wrong:** on a humanoid the bottleneck is discovering a gait, and an ideal reference can guide that. Here PPO from scratch finds balancing under full DR in about 700 iterations; there is no exploration bottleneck to unlock. **The catch:** the 12 ms came from the hardware log. The method did not say which dynamics were essential; the bench did.
:::

One more caveat, of a different kind. The probation report cites arXiv 2502.15649 for this approach; the verdict page tests arXiv 2606.02636v2. I have not reconciled the two references, so treat the citation as open.

So the honest plant is the one to train on, and the only things that make it easier are the ones that do not define the task. That leaves the question every list of randomised axes avoids: what is not in the plant at all?

### What is still not in the plant

Randomisation covers uncertainty in quantities the model has. It cannot cover a mechanism the model lacks. Four of those are open on this project, and they stay open here.

**Compliance.** After the CoM fix, a ring-down test (wheels welded to the world, tap the chassis) moved the body-rocking mode from 1.5 Hz to 3.1 Hz. The bench wobbles at 7.3 to 9.7 Hz. Sweeping the hip armature over its whole plausible range gives peaks at 3.1, 2.6 and 1.5 Hz, servo stiffness from 50 to 200 N·m/rad gives 3.06 Hz every time, and nothing lands between 3 and 34 Hz at any setting. The band is empty, not mistuned. Every link is rigid, backlash is a position deadband, the tyre is a rigid cylinder. The one measured datum, a 5 mm static sag under the robot's own weight, implies an effective stiffness about forty times softer than the model, and the plan blames most of it on four-bar slop. Compliance and backlash are not modelled. The Wobble Chase on Day 11 has the matching evidence from the policy side: policies that look calm in simulation make small corrections that may disappear into exactly these effects on hardware. That explanation is untested.

**The pitch filter's lag.** The firmware's pitch comes through a complementary filter with PITCH_TAU = 0.50 s. Training saw sensed pitch as truth plus offsets plus white noise, with no filter dynamics. The first hardware run names it the foremost carried gap, and phase lag hurts most on the taller 85 mm plant, which fits "fine at 40, unstable at 85". Modelling it is the single highest-value change the bench asked for, and it has not been done.

**What Microduck never simulated.** Cable drag, thermal throttling of a hot XL330, shell flex, floor variation beyond a friction scale. Those are found only by testing on hardware.

**Grounded DR.** Week 6 of the probation log fixed firmware inconsistencies between sim and hardware and made the DR parameters more realistic. That one line is all the description I have of how the ranges were grounded; the before and after ranges are not in my notes.

::: warn
The delay itself belongs on this list too. The training range was set from bench measurements of the firmware chain (11 to 13 ms, and about 20 ms-equivalent of phase on the real plant). But that chain changes the moment the policy moves onto a different runtime.
:::

## Pitfalls

- **Chasing physics instead of the pipeline (beat 1).** The simulated robot looks right in a viewer and the policy still fails, because the observation it trained on was unfiltered truth and the robot's is a 500 ms complementary filter.
- **A good fit score as proof (beat 2).** Two actuator fits with the same score and $k_t$ 0.47 vs 0.91. Run the fit twice, and hold out a gain and a load. A parameter on a bound means the true value is outside it.
- **A plant number solved from another component (beat 3).** A firmware constant, a reward lever or a "convention" adopted as a measurement. The symptom is a value that cannot be physically reached; the fix is an assertion. Re-baseline broken gates by shortening the window, never by widening the bar.
- **Gaussian or ever-wider ranges (beat 4).** Gaussian looks faster and leaves the real robot in a thin tail if the centre is off. A list of axes that grows after every bench session is system identification with guessed ranges.
- **Randomising what cannot be inferred, or a bias (beat 5).** Overall survival barely moves while the tail bin drops by 0.13 to 0.18. A zero-centred draw around a systematic 5° mount offset trains tolerance, not correction.

<!-- quiz -->

## Next

You might ask, where did the delay range come from? From the bench: the firmware chain measured at 11 to 13 ms, a per-episode draw of 5 to 45 ms that covers it, later 3 to 30 ms for the ESP-DL port. But once the policy runs on the chip, the board sets the delay: inference time, publish latency, quantisation. A policy trained on 5-30 ms flies at 6-9 ms. What does it take to run the policy on the chip without changing the plant it was trained on? That is [Day 17](../day17/).

## Sources

- `notes/microduck-takeaways.md` ([Notion](https://app.notion.com/p/3dc67249ddbf80a9a46bfe303aab4f37)), "Sim2Real" and "Domain randomization": the perception and actuation tables, the BAM chain, the 5° IMU bias, the two DR layers, what is not randomised, the CoM ramp.
- `notes/design-insights-observations-actions-and-rewards.md` ([Notion](https://app.notion.com/p/3e467249ddbf814ebe4bdb138d4c6b2e)), section 4: randomise only the inferable, uniform by default, log-uniform for scale-like parameters, the tail-bin test.
- RL Presentation Plan, Slide 13 and its Q&A tables (`artifacts/rl-presentation-plan.html`): the four sim2real takeaways, the DR ranges, the residual gaps.
- `artifacts/hd-1910-calibration-layers.html`: the HD-1910 pendulum rig, mode 4, the BAM model, back-EMF 0.143 against viscous 0.016, the free-gain trap (0.47 vs 0.91), register 60, the two-voltage lesson, the six kt-pinned fits. The three figures are from its `fig/` folder.
- `artifacts/the-floating-centre-of-mass.html`: the 25.3 mm floating CoM, the moment ledger, 46 to 75 mm reachable, 1.71 vs 2.07 Hz, the kitchen-scale reading, the window re-baseline, the ring-down at 3.1 Hz and the empty 3 to 34 Hz band.
- `artifacts/wlbot-plant-map.html`: the provenance table (MEASURED, FROM CAD, FIRMWARE, CONVENTION, PLACEHOLDER), the hip armature placeholder, the IMU height written three times.
- `artifacts/the-sim2sim2real-verdict.html`: ladder 1 at 0.019, the 12 ms support plant, ~100 vs ~700 iterations, "system identification in disguise".
- `artifacts/removing-more-made-it-better.html`: the seed-0 ladder and three-seed means behind the delay chart, "should this plant parameter be randomised?", the 5-45 to 3-30 ms move.
- `artifacts/manager-based-rl-env.html` (baked at construction vs drawn per episode), `artifacts/the-split-loop.html` (firmware filters at 500 Hz, the 2 ms delay grid), `artifacts/yd15-hardware-findings.html` (the τ ≈ 500 ms pitch filter as the foremost gap), `artifacts/constants-ledger.html` (PITCH_TAU 0.50 s), `artifacts/the-wobble-chase.html` (probe against bench).
- Probation report ([Notion](https://app.notion.com/p/3f367249ddbf80d890eef6f59636b9c5)) section 3.3 (the rejected ideal-reference approach, 20 to 40 ms delay), section 3.5 (the CoM fix), the W6 timeline row; Chinese report ([Notion](https://app.notion.com/p/3f467249ddbf8166aff6caa48edf6ffa)) section 4.1.
- J. Tobin, R. Fong, A. Ray, J. Schneider, W. Zaremba and P. Abbeel, "Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World", IROS 2017 ([arXiv:1703.06907](https://arxiv.org/abs/1703.06907)).
- X. B. Peng, M. Andrychowicz, W. Zaremba and P. Abbeel, "Sim-to-Real Transfer of Robotic Control with Dynamics Randomization", ICRA 2018 ([arXiv:1710.06537](https://arxiv.org/abs/1710.06537)).
- J. Tan, T. Zhang, E. Coumans, A. Iscen, Y. Bai, D. Hafner, S. Bohez and V. Vanhoucke, "Sim-to-Real: Learning Agile Locomotion For Quadruped Robots", RSS 2018 ([arXiv:1804.10332](https://arxiv.org/abs/1804.10332)).
- J. Hwangbo, J. Lee, A. Dosovitskiy, D. Bellicoso, V. Tsounis, V. Koltun and M. Hutter, "Learning agile and dynamic motor skills for legged robots", Science Robotics 2019 ([arXiv:1901.08652](https://arxiv.org/abs/1901.08652)).
