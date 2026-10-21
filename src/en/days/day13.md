---
day: 13
minutes: 60
widgets: [filter-memory, action-latch]
quiz:
  - kind: why
    q: "A balancing policy's frame includes a gyro, so the pitch rate is in every frame, and its own last action. Its actuator delay and the pushes it receives are unobserved and change per episode. What can four stacked frames give it that one frame cannot?"
    choices:
      - "The pitch rate, as stacked Atari frames recover motion."
      - "Lower sensor noise, by averaging each channel across frames."
      - "Several action-response pairs, from which delay and pushes show."
      - "Tolerance to a dropped frame, since three others remain."
    answer: 2
    explain: "Velocity was never hidden here, since the gyro is in every frame. What is hidden is the delay, the drawn mass and friction, and the push, and each shows only as a mismatch between what the policy did and what happened next. That takes several (action, response) pairs, and one frame holds one. Cut to one frame, a policy behaves as if every episode had the average delay and pays at the long-delay tail. (Beat 2: what the history is for.)"
  - kind: numbers
    q: "An input goes through a one-pole low-pass, $y_t = 0.8\\,y_{t-1} + 0.2\\,x_t$. What share of its weight falls on the newest four raw samples, and how many stacked raw frames would hold 95 % of it?"
    choices:
      - "About 59 %, and 14 frames."
      - "About 80 %, and 5 frames."
      - "About 41 %, and 20 frames."
      - "About 99 %, and 4 frames."
    answer: 0
    explain: "Unrolled, $y_t = 0.2 \\sum_k 0.8^k x_{t-k}$, so the first four weights sum to $1 - 0.8^4 = 0.59$ and the other $0.8^4 = 0.41$ sits further back. 95 % needs $0.8^K \\le 0.05$, so $K \\ge \\ln 0.05 / \\ln 0.8 \\approx 13.4$: 14 frames, 140 inputs at ten channels. One filtered slot buys reach that a stack pays for frame by frame. (Beat 3: a one-pole filter is a memory compressor.)"
  - kind: why
    q: "A balancing policy reads its pitch only through a one-pole low-pass, $y_t = 0.8\\,y_{t-1} + 0.2\\,x_t$, and sees one frame, with no stack. Why does it balance worse than a policy that reads the raw pitch in one frame?"
    choices:
      - "The filter amplifies sensor noise, since it sums many old samples."
      - "The filter saturates on large tilts, since its output is bounded."
      - "The filter makes the reading lead the true pitch, so it overcorrects."
      - "80 % of the reading is the past, so it cannot tell where pitch is now."
    answer: 3
    explain: "One reading of $y_t$ mixes 20 % of the current sample with 80 % of everything older, and with no earlier frame beside it the policy cannot pull the two apart. It acts on a picture that lags the robot. With four stacked frames the same filter is cheap: it costs one raw sample and buys a summary of the past next to three fresh ones. In the ablation the filtered single frame was the worst of nine arms. The filter lowers noise, never leaves the range of its inputs, and lags rather than leads. (Beat 3: a one-pole filter is a memory compressor.)"
  - kind: numbers
    q: "To undo $y_t = 0.8\\,y_{t-1} + 0.2\\,x_t$, a network computes $x_t = 5y_t - 4y_{t-1}$. If each filtered frame carries independent noise of standard deviation $s$, how noisy is the reconstructed $x_t$?"
    choices:
      - "$0.2\\,s$, because the filter lets through a fifth of each sample."
      - "About $6.4\\,s$, because $\\sqrt{5^2 + 4^2} = \\sqrt{41}$."
      - "$s$, because $5 - 4 = 1$ and the two noises cancel."
      - "$9\\,s$, because $5 + 4 = 9$ and the noises add up."
    answer: 1
    explain: "Independent noises add in quadrature, so the standard deviation is $\\sqrt{25 + 16}\\,s \\approx 6.4\\,s$. Undoing a filter means taking a weighted difference of nearby frames, and differences amplify noise. That is why removing the low-pass from a dithering encoder channel left survival alone and raised the wobble by 56 %. (Beat 4: inverting the filter amplifies the noise.)"
  - kind: why
    q: "A 12-bit wheel encoder dithers on a channel whose real signal moves slowly. You can low-pass that input, or leave it raw and penalise the action's second difference $a_t - 2a_{t-1} + a_{t-2}$. Why is the input filter the better place?"
    choices:
      - "At the input, noise looks unlike signal; at the action, jitter and fast fixes are one signal."
      - "A reward penalty acts only in training, so its effect is gone once the robot is deployed."
      - "No weight of the penalty is strong enough to remove high-frequency noise from the action."
      - "A filter costs nothing at run time, while every extra reward term slows training down."
    answer: 0
    explain: "At the input, dither is high-frequency content on a slow channel, so a filter can separate the two. At the action, dither-driven jitter and the fast corrections a delayed loop needs are the same signal, so a penalty that suppresses one suppresses the other. In the arms that tried it, the penalty beat the filter on wobble and lost on survival and the long-delay bin; at four times the weight the robot never balanced. (Beat 4: inverting the filter amplifies the noise.)"
  - kind: numbers
    q: "Hold the sensors still and a policy maps its last action to its next: $a_{n+1} = g\\,a_n + b$, with actions on ±1 scaled to ±8 V. With $b = 0.05$, where does it settle for $g = 0.5$ and for $g = 0.8$, and what happens once $g > 1$?"
    choices:
      - "0.4 V both times; $g$ only sets how fast it gets there."
      - "0.8 V and 4.0 V; past $g = 1$ it oscillates between the rails."
      - "0.1 V and 0.25 V; past $g = 1$ it finds a new fixed point."
      - "0.8 V and 2.0 V; past $g = 1$ it stays on the rail it starts near."
    answer: 3
    explain: "The fixed point solves $a^* = g\\,a^* + b$, so $a^* = b/(1-g)$: 0.1 and 0.25 in action units, 0.8 V and 2.0 V after scaling. As $g$ nears 1 the fixed point runs away, and past 1 the map amplifies its own output up to the clip, so ±8 V become the fixed points and the sensors stop mattering. That is the latch: a policy that trusts its own last action more than its sensors. (Beat 5: feeding back the last action helps, and can latch.)"
  - kind: whatif
    q: "Observations are normalised as $(x - \\mu)/(\\sigma + 0.01)$, with the statistics frozen after training. A head-angle command input was 0 throughout training. At deployment it receives 0.03 rad. What happens?"
    choices:
      - "Nothing, because the network learned to ignore an input that never mattered."
      - "It reads as 0.03, a small value that only nudges the first layer slightly."
      - "It reads as 3.0, fed into weights that never got a gradient, and can topple it."
      - "It is clipped back to zero, because it lies outside the range seen in training."
    answer: 2
    explain: "With $\\mu = 0$ and $\\sigma = 0$ the input is divided by 0.01, so 0.03 becomes 3.0. The weights behind it never received a gradient and are still random; a network learns to ignore an input only by seeing it change without consequence. Sample a small non-zero range for every slot in training, even at reward weight 0. (Beat 6: an input must mean the same thing in training and on the robot.)"
  - kind: whatif
    q: "In training, the environment clips the policy's action to $[-1, 1]$ before the motors see it, but stores the unclipped output in the next observation's previous-action slot. On the robot, the firmware feeds back the clipped value. What goes wrong?"
    choices:
      - "Nothing: the motors got clipped actions both times, so behaviour matches."
      - "That input ranges past ±1 in training but never on the robot: a shifted input."
      - "Only the reward changes, since it was computed on unclipped values."
      - "The robot's policy pushes harder to make up for the clip it lacks."
    answer: 1
    explain: "The motors saw the same clipped action in both worlds, but the observation did not: training fed back values past ±1, up to ±2 for a mean near the edge with a wide σ, and the robot never does. The policy now reads an input from a distribution it was not trained on. Clip before storing, so the observation and the reward both read the action the plant actually got. (Beat 6: an input must mean the same thing in training and on the robot.)"
---

**Goal:** design the policy's interface (the observation, the fed-back action, the history and the filters) so that what the policy needs to tell apart is still distinguishable by the time it reaches the network.

## Where we left off

Day 12's reward scores the true pitch, and the policy never sees the true pitch. It sees an IMU through a filter, four frames of it, with its own last action fed back. You might ask, what about the past? On Day 1 the Markov property was one cool trump card, and it came with a condition we have carried quietly since: *as long as the state carries everything that matters*. Day 4 bent it once for Pong, handing the network four frames "as if" they were the state. Today we open it on purpose and find out what that "as if" was hiding.

People hit this wall well before deep RL. In 1965 Karl Åström worked out optimal control for a Markov process you can only watch through noisy measurements, and showed that what you should act on is a probability distribution over the state, updated as each measurement comes in. In 1998 Leslie Kaelbling, Michael Littman and Anthony Cassandra gave the problem its RL name, the partially observable MDP, and called that distribution the belief state. Exact belief updates are hopeless for anything bigger than a toy. So when DeepMind's Atari agent arrived in 2013, it handed the network the last four screens. In 2015 Matthew Hausknecht and Peter Stone swapped the stack for an LSTM and made the Atari screen flicker to show when memory matters.

Their first attempt was the obvious one: give the network some of the past and let it work out the rest.

## The picture

A car's fuel gauge is damped so that it does not swing on every bump. That is a filter, and it works: the needle is calm. The obvious way to drive with it is to glance at it now and then and trust what it says.

Two things break. A single glance at a damped needle cannot tell "a quarter full and steady" from "was half full a minute ago and is leaking now", because the needle is partly showing the past. And if you watch the needle while pressing the throttle, part of what you see is your own driving. The first problem is the basic one: a reading is not the tank.

## Step by step

### The observation is not the state

Start with what the policy actually gets. On the robot it is 40 numbers: four frames, 10 ms apart, of these ten channels.

| Channel | Unit | Scale | Note |
|---|---|---|---|
| `pitch` | rad | 0.8 | Sensed angle, fused from accelerometer and gyro, mount offset included |
| `pos_err` | m | 0.25 | Distance from where the episode started, unbounded |
| `gyro` | rad/s | 5.0 | Pitch rate |
| `odom_vel` | m/s | 1.0 | Wheel odometry, low-passed at 50 ms |
| `gyro_z` | rad/s | 3.0 | Yaw rate |
| `cmd_vel`, `cmd_yaw_rate` | m/s, rad/s | 0.5, 1.5 | Hardwired 0 for station keeping |
| `yaw_err` | rad | 0.5 | Clamped at 45° |
| `prev_action[0]`, `prev_action[1]` | none | 1.0 | Its own last output, before scaling to volts |

The state is the whole simulator: every position and velocity, the mass and friction the randomisation drew for this robot, the push leaning on it right now, the lag sitting in the motors. That is Markov. The table is a window onto it. Two robots can show the same ten numbers this instant and do different things next instant, because one is heavier, or one is being pushed while the other is only leaning. From the policy's side, this is not an MDP. It is a POMDP, and in a POMDP the past matters again, because the past is the only way to guess what is hidden.

The textbook answer keeps a belief $b(s)$, a probability for every possible hidden state, and updates it after each action and observation:

$$
b'(s') \propto P(o \mid s') \sum_{s} P(s' \mid s, a)\, b(s)
$$

::: tip
Push the old belief through the dynamics to predict where the state went, then reweight each candidate by how well it explains what the sensors just said. Act on $b$, not on $o$.
:::

A distribution over mass × friction × wheel radius × push × motor state is not something you can write down, let alone update at 100 Hz. Nobody does that here. We hand-roll it: keep the last few frames, and call the stack the state.

$$
s_t \approx (f_{t-3}, f_{t-2}, f_{t-1}, f_t), \qquad f_t = (o_t, a_{t-1})
$$

::: tip
Each frame $f$ is what the sensors said plus what I did just before. PPO never checks what a state means physically. If the next stack is mostly predictable from this stack and the action, it is Markov enough, and everything since Day 1 still stands with "state" quietly meaning "the last four frames".
:::

The reward does not change. It is computed from the true simulator state, so it stays Markov; only the policy's view is partial. That asymmetry is also why the reward cannot be copied onto the robot: it wants quantities the robot does not measure.

::: field
**We hand-roll the window, the network hand-rolls the belief.** We choose what evidence to keep and for how long. The first layers of the 40 → 64 → 64 → 2 network learn whatever compressed reading of it helps, something like "this feels like a heavy robot being pushed forward", with no probabilities anywhere. **Test before anything else:** could *you* balance the robot from exactly these 40 numbers? If a person given the policy's inputs could not do the task, neither can the policy.
:::

On Day 4 the reason for stacking was easy: one Pong frame has no velocity in it. Look at the table again, though. Every frame already holds `gyro`, so one frame already gives the pitch rate. Then what is the history for?

### What the history is for, when velocity is already in the frame

I had this wrong at first, and believed four frames were there to show which way the body is falling. The gyro already says that. What one frame cannot show is anything that only appears as a mismatch between what I did and what happened next:

1. **The randomised physics.** Mass, friction, wheel radius and the motor constants are drawn per robot. "I commanded 0.3 and the pitch rate changed by this much" is a measurement of them, but only across frames. That is implicit system identification.
2. **Latency and motor lag.** The action delay is drawn per episode between 5 and 45 ms, at a 10 ms step, so an action shows up a frame or several later. With `prev_action` inside every frame, the policy can line up what it sent with what came back.
3. **The push.** A shove lasts 0.1 s, ten policy steps, and is not observed. The only sign of it is a tilt that evolves in a way my own actions do not explain.

All three need pairs of (action, response), and one frame holds one pair. The interface ablation shows it. With the stack cut to one frame, survival fell from 0.976 to 0.911, a loss of 0.065. On the longest-delay quartile, 36 to 44 ms, it fell from 0.936 to 0.757, a loss of 0.179. A policy that cannot tell one draw from another learns the average and pays at the tails, and the tail is usually where the hardware sits.

There is an explicit version of what the stack gives for free. Andrej Karpathy's Pong agent ("Pong from Pixels", 2016) fed the network the difference between the current frame and the previous one, $x_t - x_{t-1}$, so that motion was in the input rather than something to discover. A stack lets the first layer learn that difference itself: one weight of $+1$ on the newest frame and $-1$ on the one before. On our robot the gyro already is the pitch derivative, so the differences that matter are the ones between actions and responses, and only a stack keeps those.

That gives three places the belief can live, from most hand-made to most learned:

| Rung | Where the belief lives | Example |
|---|---|---|
| Explicit filter | Designed by hand | A Kalman filter (exact for linear-Gaussian), the firmware's complementary filter on pitch |
| Frame stacking | Learned by the MLP from a fixed window | This robot, Upkie, Atari DQN |
| Recurrent policy | Learned by an LSTM or GRU with unbounded memory | ANYmal, most "memory" papers |

::: field
**Randomise a parameter only if the policy can infer it.** **When:** something in the observation reveals it, directly or by its effect over a few frames, or you genuinely do not know the hardware value. **When not:** nothing reveals it, or you have measured it; calibrate the nominal and randomise around the residual. **What goes wrong:** robustness at the mean, fragility at both edges. The one-frame arms lost 0.13 to 0.18 survival on the longest-delay quartile while losing far less overall. **Test:** bin the evaluation by the drawn value and compare the tail bin with the mean. A wide gap means the policy learned the mean instead of adapting.
:::

Our interface uses two rungs of that ladder at once: a 50 ms low-pass on `odom_vel`, and the four-frame stack around it. They look like two ways of buying the same memory. Are they?

### A one-pole filter is a memory compressor

The odometry filter is one pole. At $\Delta t = 10$ ms and $\tau = 50$ ms the update is:

$$
y_t = 0.8\, y_{t-1} + 0.2\, x_t
$$

The obvious reading is that this filter does nothing a network could not undo. Two consecutive outputs give the raw value back exactly, $x_t = 5y_t - 4y_{t-1}$, so it throws nothing away. Apply that to the four-frame stack, though:

$$
x_t = 5y_t - 4y_{t-1}, \quad x_{t-1} = 5y_{t-1} - 4y_{t-2}, \quad x_{t-2} = 5y_{t-2} - 4y_{t-3}
$$

and $y_{t-3}$ is left over, because recovering $x_{t-3}$ would need $y_{t-4}$, which is outside the window. Four filtered frames are three raw samples plus $y_{t-3}$, and that last term is not a sample. Unroll the filter and it is a weighted average of the entire history:

$$
y_t = (1-a) \sum_{k \ge 0} a^k\, x_{t-k}, \qquad a = 1 - \frac{\Delta t}{\tau} = 0.8
$$

::: tip
The weights are $0.2, 0.16, 0.128, 0.102, \ldots$, and the first four sum to $1 - 0.8^4 = 0.59$. The rest, $a^K = 0.41$, sits further back than a $K = 4$ stack can reach. Holding 95 % of the weight by stacking needs $K \ge \ln 0.05 / \ln a \approx 13.4$, so 14 frames. The mean age of the weights is $a/(1-a) = 4$ steps: the filter reads about 40 ms late.
:::

So the filter is a memory compressor. One slot buys an unbounded span of the past, where raw history costs one slot per step, and charges all ten channels for it: 14 frames would be 140 inputs instead of 40. The price is resolution. Inside the summary every distinction is gone.

Slide $\tau$ and the stack depth below. The top panel is where the weight sits. The bottom panel runs an illustrative push through the same filter; pick a moment and it finds the other moment with the same filtered reading.

<filter-memory tau="50" frames="4" now="380"></filter-memory>

One filtered number reads the same on the way into a push and on the way out of it, while the true pitch is in two different places. With four frames that hardly matters, because three fresh samples sit next to the summary. With one frame there is nothing next to it. That is the h1 arm: filter on, stack depth 1, and the worst of the nine arms at 0.911. If the filter were only a reversible relabelling, one filtered frame would be no worse than one raw frame. One filtered frame is not a state; it is mostly history.

Then drag $\tau$ towards 500 ms, roughly the firmware's complementary filter on pitch, and watch where the weight goes.

::: field
**Filter or stack, decided in order.** 1. Need derivatives or delay identification? Stack; no filter substitutes. 2. Need span you cannot afford to stack? Filter that one channel. 3. Need denoising only? Filter it. 4. Stack depth 1? Never filter the channel you read current state from (our worst arm, 0.911). **Need more than one summary?** Try two or three filters at different time constants before widening the stack. **Still open:** the firmware's pitch arrives through a complementary filter with $\tau \approx 500$ ms, and training saw pitch as truth plus offsets plus white noise, with no filter dynamics. The bench report names that as the foremost carried gap. Whether modelling it fixes the 85 mm behaviour below is untested.
:::

So the odometry filter buys reach the stack cannot afford, and it is exactly invertible. Then why keep it? Take it out and the network can do its own inversion from raw frames, with one fewer constant for the firmware to mirror.

### Inverting the filter amplifies the noise

That was the worry, so we tested it. The `nolpf` arm removes the low-pass. Survival barely moved: 0.979 against 0.976. A filter supplying memory the task needed would have cost capability, so ours was not buying memory. What moved was the wobble: pitch standard deviation 2.46° against 1.58°, 56 % more.

The encoders are 12-bit, so a resting wheel dithers by about ±0.77 rad/s per tick. Any reconstruction of the raw value goes through $5y_t - 4y_{t-1}$, and independent noise on two frames combines as

$$
\sqrt{5^2 + 4^2} = \sqrt{41} \approx 6.4
$$

::: tip
Undoing a filter means taking a weighted difference of nearby frames, and differences amplify noise. The filtered channel hands the network a smooth reference; the raw one makes it build its own smoothing out of four taps, and PPO optimises return, which barely charges for jitter.
:::

So the filter's real job here is denoising. The obvious next move is to put that job in the reward instead. A reward term is training-only: nothing to deploy, no firmware constant to mirror. Two arms removed the filter and penalised the action's second difference:

$$
\text{jerk}_t = a_t - 2a_{t-1} + a_{t-2}
$$

::: tip
Near zero for a steady ramp, large for a reversal. A second difference rather than a bigger slew penalty, because slew charges for the steady corrective ramps that balancing is made of. Day 12 showed slew at weight 10 teaching the robot to be quiet instead of balanced.
:::

The denoising worked and the trade was bad. At weight 1.0 the wobble came out at 1.09°, better than the filter managed, and it cost survival (0.965 against 0.975) and the long-delay quartile (0.891 against 0.923). On the bench that arm drives further forward before recovering from a push. At weight 4.0 it never learned to balance and was killed at iteration 700 with an episode length of 62. Both weights failed the same way at different severities, which points at structure rather than a weight we failed to find.

::: field
**Denoise at the input, where noise still looks different from signal.** At the input the dither is high-frequency content on a channel whose real signal moves slowly, so a filter can separate them. At the action, dither-driven jitter and the fast corrections a long control loop needs are the same signal, and any penalty that suppresses one suppresses the other. **When to filter:** a channel with known sensor noise and a slow real signal. **When not:** at stack depth 1 on a state channel (above), or when you need the derivative from that channel. **What goes wrong if you move it to the reward:** better wobble numbers, worse disturbance response; the evaluator's long-delay bin caught it before the bench did.
:::

The stack's best trick, identifying the delay, works only because every frame carries the action the policy issued. That slot takes the policy's output and feeds it back into its input. That is a loop, and loops can do something none of the pieces above can.

### Feeding back the last action helps, and can latch

The reasons to feed `prev_action` back are real. **Put it in when** the action delay is longer than one policy step, or randomised: estimating the delay means comparing actions you issued against responses that arrived, which is impossible without seeing your own actions. Ours is drawn 5 to 45 ms at a 10 ms step. Also when the actuator has dynamics the policy has to anticipate.

Now here is the problem. Observation goes to action, and action goes back into the next observation. Hold everything else still and the policy becomes a map from its last action to its next one:

$$
a_{n+1} = \pi(o, a_n), \qquad a^* = \pi(o, a^*)
$$

::: tip
Iterate the map and it settles on a fixed point $a^*$, where the action predicts itself. If the map's slope with respect to its own last action stays below 1, there is one fixed point and every start returns to it. Steeper than 1, and the rails become fixed points: the policy stays wherever it started, whatever the sensors say.
:::

This happened on the bench. The first hardware run of `sk_head_yd15_r128_s0` balanced at 40 mm leg height, wobbly, and at 70 and 85 mm railed to full voltage on the first tick it owned the wheels, every time. The port was ruled out first: the C inference chain matches PyTorch to 4.1e-7 over a 240-step golden replay. A firmware bug was found and fixed (the grant tick drove one stale pre-reset output). The policy's own share was a static probe of the flashed weights. From `prev_action[0] = +1` the network returns +8 V regardless of pitch; at −15° it still gives +3.6 V. Iterating the feedback converges to (+8.00, +1.04) V, which reproduces the pinned +8 V of the captures with 0.000 V residual.

Try it on a toy. The slider $g$ stands for how much the policy leans on its own last action. It is not a weight in the yd15 network.

<action-latch g="0.5" b="0.05" pitch="0" start="1"></action-latch>

With $b = 0.05$ and $g = 0.5$ the probe reads 0.80 V and the output still moves with pitch. At $g = 0.8$ it reads 2.00 V, right on the bar. Past $g = 1$, start from +1 and you stay at +8 V; start from −1 and you stay at −8 V; the pitch sensitivity at the fixed point is zero. Nothing about the pitch input changed. The policy learned to trust its own output more than its sensors.

Two things suppress the latch, and they trade against each other. Noise on the `prev_action` channel in training, 0.15 action units for us, stops the policy treating its own output as reliable state. Frame history does the same job by giving it other memory to lean on. More history, less noise needed: at four frames, removing the noise moved the probe from 0.84 to 1.27 V; the one-frame arms sat at 2.08 V with the noise and 1.97 V without. My reading is that the noise flattens $g$ in the toy's terms, but that is a picture of the mechanism, not something the probe measured.

::: field
**prev_action: when, what goes wrong, test.** **Feed back the action before scaling, never the volts.** The volts have been through the firmware's ramp and the 6 V cap, and feeding them back puts the firmware's limiters inside the network's idea of what it just did. **Leave it out when** the delay is under one step and the actuator is effectively instant, or **when you cannot run the probe**: if you cannot test for the latch, do not open the loop. **What goes wrong:** a latch you will not see in sim. There the 8 V kick produces the pitch rate that unlatches it; a quiet PD-held robot never does. **Test:** fix a neutral observation, iterate `prev_action` to its fixed point from −1, 0 and +1, and read the worst $|U|$. The yd15 retrain acceptance is that it stays below 2 V. (control 0.84 V · noreg 1.27 V · h1 2.08 V)
:::

The latch came from the slot meaning something the policy took too seriously. There is a quieter failure in the same slot: what it carried in training was not what it carries on the robot.

### An input must mean the same thing in training and on the robot

The training env stored the raw policy output in the `prev_action` slot and clamped only the copy sent to the plant. At the initial $\sigma = e^{-1} \approx 0.368$, a mean-0.9 action exceeds 1.0 about 39 % of the time, and reaches ±2 at 3σ. So `prev_action` carried values up to ±2 in training and exactly ±1 on the robot: a distribution mismatch on 8 of the 40 inputs. The fix is to clamp before storing, so the observation and the reward both read the clipped action.

Why normalise at all? The inputs come in different units and very different sizes: angles in radians next to speeds and positions on other scales. Fed in raw, they stretch the loss surface into a long, narrow valley. A step small enough for the steep walls crawls along the floor, and a step large enough for the floor bounces from wall to wall. Rescale every input to a similar spread and the valley rounds out towards a bowl, where one step size suits every direction. Large raw inputs also make large first-layer pre-activations, which saturate a tanh and blow up that layer's gradients. So observations are normalised with running statistics:

$$
\tilde{x} = \frac{x - \mu}{\sigma + 0.01}
$$

::: tip
Mean 0, spread 1, with $\mu$ and $\sigma$ accumulated over the whole run and frozen into the firmware. It assumes every input varies. An input that was always 0 has $\sigma = 0$, so whatever later reaches it is multiplied by 100.
:::

The extreme case is an input whose training distribution has no spread at all. The Microduck roller only uses `cmd_x`. Its other 11 command inputs (vy, heading, four head, six body) were zero for the whole of training. Two things follow: any non-zero value is amplified a hundredfold, and the weights behind those inputs never received a gradient, so they are still random. In simulation a 3° head command knocks over 98 % of robots, and 0.3 rad knocks over all of them. A network learns to ignore an input by seeing it change without consequence; one it never saw change is simply untested. The fix is to sample a small non-zero range for every slot, even at reward weight 0; the walker uses ±0.05 rad on the head.

The same rule decides where an action limit lives. A clip in the env exists only in sim if the deployment loop does not clip, and then the robot receives commands the policy never trained with. The roller uses an `action_over_limit` penalty instead, and a penalty on the policy's output is learned into the network, so it ships inside the ONNX. Microduck's walker takes the same line for smoothness: no clip, no action filter, smoothness through reward terms. On the wheeled robot the opposite holds: the exported graph ends in a clip to $[-1, 1]$, so the training side has to clip too. Neither choice is right in general; the one that matches deployment is.

::: field
**Clip or penalty.** **Clip when** the robot will clip at the same place: a firmware limit, the graph's own output clamp. Then clip in sim at exactly that value. **Penalise when** the deployment loop passes the output through unclipped; the deterrent then travels with the weights. **What goes wrong:** a sim-only clip or a sim-only joint buffer teaches the policy to lean on a wall the robot does not have. **Footnote on what an input is measured against:** `pos_err` and `yaw_err` are relative to a datum latched at the start of the episode, and the firmware resets them when the policy takes the wheels. On yd15 the 70 mm shadow looked healthy (about 1 V) only because `pos_err` had grown under PD and was cancelling the pitch term; the reset at takeover removed the cancellation. As the datum ledger puts it: nothing the robot believes about the world changes, only what it is measured against.
:::

Every rule so far squeezes the actor's inputs down to what the robot can measure, and makes them mean the same thing on both sides. The critic never leaves the simulator. Does it have to obey the same rules?

### The critic may see more, and the clock goes in the input

No. The critic only exists during training, to judge states for the advantage, so it can read anything the simulator knows. On the wheeled robot the actor sees 32 or 40 inputs, depending on the task, and the critic 59 or 68: the same observation plus `PrivilegedState` and `PlantParams`. On Microduck the actor has 61 dimensions and the critic 72, adding true body velocity and the feet's height, air time, contact flags and contact forces, none of which the robot has a sensor for. Day 12 covered why this lowers variance without moving the optimum: the critic is the baseline, not the target.

The useful rule is the converse. **If the reward depends on an input, the critic needs it.** The roller's main reward is paid from wheel spin, and the critic predicts reward, so the critic gets `wheel_vel`; it cannot infer it from anything else, because wheels keep spinning in the air. The actor never sees it, because the robot has no wheel encoders.

The other thing that belongs in the input is a hidden variable we create ourselves: time. For a timed move, the network should not keep the clock. A phase it has to count internally is hidden state, and exploration noise washes it out within seconds: without a clock input one Microduck dance drifted to 126 BPM against a 100 BPM target. Either the controller sends the current pose as a command each tick (Microduck's command timeline), or the clock and the next few frames of the clip go in the observation (Jumper). Zero the gait clock when the command is "stand", or the clock keeps running under a robot that should be still.

::: field
**Asymmetric actor and critic.** **When:** always worth checking, since it costs nothing at deployment. **What to add:** whatever the reward reads, then plant parameters and true velocities. **What goes wrong:** a critic that cannot see what the reward pays for has to guess it, and the advantage carries that guess. **Clock rule:** if the task has a beat, something outside the network keeps it.
:::

Let me regroup, because that was seven beats. The state is Markov and the observation is not, so the policy acts in a POMDP, and we hand-roll the window while the network hand-rolls the belief. On this robot the history is for the randomised physics, the delay and the push, not for velocity, and the long-delay quartile is where a missing history shows. A one-pole filter compresses unbounded memory into one slot, at the cost of resolution, and ours mostly earns its place by denoising, which a reward penalty cannot do. Feeding back the last action makes the delay inferable and can latch the policy onto a rail. Every input has to mean the same thing in training and on the robot, inputs that never vary become amplifiers, and the critic is free to see more. What is still open is whether each piece earned its place: we have argued for every one, but the ablation that tested them also showed they do not come apart cleanly.

## Pitfalls

- **Filtering the state channel at stack depth 1 (beat 3).** One filtered frame is a summary with no fresh sample. Survival drops (0.911 in our ablation), and the long-delay bin drops nearly three times as far (0.757 against 0.936). Read only the headline number and you underestimate the damage.
- **Moving the filter's job into the reward (beat 4).** A jerk or slew penalty makes the wobble number look better and the disturbance response worse. If you only plot wobble, you will ship it.
- **Trusting shadow mode for prev_action (beat 5).** A policy running in shadow, not driving, sees a different observation from the one it gets at takeover: `pos_err` reset, `prev_action` latched. The yd15 shadow looked calm and railed on the first tick. Run the static probe instead.
- **Storing the unclipped action (beat 6).** Nothing crashes; the policy simply trains on a `prev_action` range the robot never produces. Check the slot's min and max in training against the robot's.
- **A command slot that was always zero (beat 6).** The policy is fine until the runtime sends that command, and then a few degrees knock it over. Sample every slot, even ones with reward weight 0.

<!-- quiz -->

## Next

You might ask, which of these pieces actually earned its place? The stack, the odometry filter, the yaw estimator and the `prev_action` noise: four interface pieces, each added for a good reason, each argued for on this page. Removing stacking alone cost 0.043; removing it together with three others cost 0.007. A single removal measured the interaction, not the piece. How do we run an ablation whose conclusions survive? That is [Day 14](../day14/).

## Sources

- `notes/design-insights-observations-actions-and-rewards.md` ([Notion](https://app.notion.com/p/3e467249ddbf814ebe4bdb138d4c6b2e)): the decision rules for prev_action, filter or stack, why not stack more, randomise only the inferable, and the hygiene checks (could you control it from this observation, running normalisation, frame differences).
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), "POMDP": the re-opened Markov card, the belief, calling the stack the state, "We hand-roll the window, the network hand-rolls the belief", the reward staying Markov.
- `notes/microduck-takeaways.md` ([Notion](https://app.notion.com/p/3dc67249ddbf80a9a46bfe303aab4f37)), "Observation space" and "Action space": the 61D actor and 72D critic, no action clipping, the per-env action delay.
- `notes/the-worries-of-simulation-and-how-to-diagnose-them.md` ([Notion](https://app.notion.com/p/3e467249ddbf81bcac22fa33a907b346)) and `notes/deep-rl-hacks-schulman.md` ([Notion](https://app.notion.com/p/3e467249ddbf81039772e3df5492078f)): the filter-as-memory summary, running-statistics normalisation, "could you control it from the observation". Write-up: [github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks).
- `artifacts/removing-more-made-it-better.html` (primary): the nine-arm interface ablation, the filter inverse and its four-frame reading, 41 % and 14 frames, √41, the jerk-penalty arms, the long-delay quartile, the prev_action probe numbers.
- `artifacts/wlbot-learning-log-aug-30.html`, Session 3b: MDP vs POMDP, what the history is for here (and the correction about velocity), the belief ladder.
- `artifacts/yd15-hardware-findings.html`: the first hardware run, the stale-shadow firmware bug, the prev_action latch at (+8.00, +1.04) V, the 70 mm shadow trap, the unmodelled τ ≈ 500 ms pitch filter, the 2 V retrain acceptance.
- `artifacts/station-keeping-policy-runner.html`: the 40-number observation table, prev_action fed back before scaling, the 6 V cap and 500 ms ramp.
- `artifacts/rl-toys-defect-register.html`, GPU-7: the unclipped action stored in prev_action, ±2 against ±1 on 8 of 40 inputs.
- `artifacts/roller-model-inquisition.html`: always-zero inputs as ×100 amplifiers, clip against penalty, the critic's `wheel_vel`.
- `artifacts/manager-based-rl-env.html`: actor 32/40 against critic 59/68. `artifacts/jumper-field-guide.html`: who keeps the clock, 126 against 100 BPM. `artifacts/the-datum-ledger.html`: what `pos_err` is measured against.
- K. J. Åström, "Optimal control of Markov processes with incomplete state information", *Journal of Mathematical Analysis and Applications*, 1965.
- L. P. Kaelbling, M. L. Littman and A. R. Cassandra, "Planning and acting in partially observable stochastic domains", *Artificial Intelligence*, 1998.
- V. Mnih et al., "Playing Atari with Deep Reinforcement Learning", 2013 ([arXiv:1312.5602](https://arxiv.org/abs/1312.5602)); M. Hausknecht and P. Stone, "Deep Recurrent Q-Learning for Partially Observable MDPs", 2015 ([arXiv:1507.06527](https://arxiv.org/abs/1507.06527)).
- A. Karpathy, "Deep Reinforcement Learning: Pong from Pixels", 2016 ([karpathy.github.io](https://karpathy.github.io/2016/05/31/rl/)): the frame-difference input.
