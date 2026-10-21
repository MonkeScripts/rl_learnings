---
day: 17
minutes: 60
widgets: [latency-budget]
quiz:
  - kind: why
    q: "A policy flashed to a microcontroller drives its motors straight to the voltage limit. Before suspecting the policy, you run 240 logged observations through the on-chip C code and through PyTorch, and the actions agree to 4e-7. Why do this check first?"
    choices:
      - "Of port, firmware and policy, only the port can be ruled out completely by one offline test."
      - "A numeric port error is the most common cause of saturation, so it is the likeliest answer."
      - "The replay also measures the action delay that the policy will fly under on the robot."
      - "Agreement shows the policy is safe to run, so the motors can be re-enabled next."
    answer: 0
    explain: "A rail can come from the port, the firmware or the weights. Once the chip computes what training computed, every later finding lands on the firmware or the policy, not on a typo in a matrix. Agreement says nothing about whether the policy is good, only that the chip runs it faithfully. (Beat 6: rule out the plumbing first.)"
  - kind: whatif
    q: "A policy trained at 100 Hz reads a four-frame observation stack, and its observation filters are tuned to the 10 ms step. It trained with 5-30 ms of random action delay and flies at 6-9 ms. Inference takes 1.4 ms, so you run the same weights at 200 Hz. What happens?"
    choices:
      - "It balances better, because a faster loop always rejects disturbances better."
      - "Nothing changes, because the network has no input that tells it the rate."
      - "It no longer fits: 1.4 ms of inference overruns the new 5 ms period."
      - "A new plant: half the history, mistimed filters, less delay than trained."
    answer: 3
    explain: "The rate is part of the plant the policy learned. The stack now spans 15 ms instead of 30, the filters respond at the wrong speed in seconds, and the delay moves further below the 5-30 ms it trained on. 1.4 ms fits a 5 ms period easily, so timing is not what breaks; meaning is. A different rate is a retrain, not a setting. (Beat 7: the rate is not a knob.)"
  - kind: numbers
    q: "On a microcontroller a 40 → 64 → 64 → 2 tanh MLP costs 169 µs for its 6,784 multiply-adds, 255 µs for its 128 tanh calls and 11 µs for 40 input divides, 435 µs in all. You widen the input to 140 (140 → 64 → 64 → 2). About how much arithmetic now?"
    choices:
      - "About 1,520 µs: every term scales by 140/40."
      - "About 620 µs: only layer one and divides grow."
      - "About 870 µs: multiply-adds and tanh double."
      - "About 435 µs: the hidden layers are unchanged."
    answer: 1
    explain: "Only the first layer sees the input: $140 \\times 64 + 64 \\times 64 + 64 \\times 2 = 13{,}184$ multiply-adds, so 169 µs becomes about 330. The divides go from 11 to about 39 µs. tanh runs on the 64 + 64 hidden units, so its 255 µs, the largest term, does not move: $330 + 255 + 39 \\approx 620$ µs. (Beat 3: where the 3 milliseconds go.)"
  - kind: numbers
    q: "You export a 40 → 64 → 64 → 2 MLP, with a bias on every layer, to C with float32 weights. How many bytes do the weights and biases take?"
    choices:
      - "6,914 bytes: one per parameter."
      - "27,136 bytes: $4 \\times 6{,}784$."
      - "27,656 bytes: $4 \\times 6{,}914$."
      - "13,828 bytes: $2 \\times 6{,}914$."
    answer: 2
    explain: "The weights are $40 \\cdot 64 + 64 \\cdot 64 + 64 \\cdot 2 = 6{,}784$ and the biases $64 + 64 + 2 = 130$, so 6,914 parameters at 4 bytes each. 27,136 forgets the biases, and 13,828 is what int16 would take. A network this small fits in RAM as plain C arrays, with no runtime or interpreter on the chip. (Beat 1: getting the network off the GPU.)"
  - kind: why
    q: "On a chip that also services interrupts, a recorder times 8,769 policy inferences: minimum 1,364 µs, median 3,075 µs. Why take the minimum, not the median, as the network's cost?"
    choices:
      - "The minimum is the case that the safety timeouts are designed around."
      - "The median includes cold-start runs that never happen during flight."
      - "Interruptions only ever add time, so the floor is nearest the cost."
      - "A median is only reliable with fewer than a thousand samples."
    answer: 2
    explain: "Every sample is the true cost plus whatever preempted it, and preemption never subtracts. So the distribution has a hard floor and a long tail, and the mean or median moves with load. The minimum over many samples is the best estimate of the work itself; say which instrument each number came from. (Beat 3: where the 3 milliseconds go.)"
  - kind: whatif
    q: "A chip has a single-precision float unit but no 16-bit vector instructions. Your three-layer MLP takes 435 µs of float arithmetic in plain C. You quantise it to int16 and run it through a library that interprets the graph node by node. What do you expect?"
    choices:
      - "Slower: int16 is no faster here, and requantising and interpreting add on top."
      - "About twice as fast, because int16 moves half as many bytes through memory."
      - "About the same speed, because a network this small is not compute-bound."
      - "Faster, but only once the tanh layers are replaced with lookup tables."
    answer: 0
    explain: "With an FPU and no 16-bit SIMD, an int16 multiply is at best as fast as a float one, and the quantise and requantise steps come on top. An interpreter's per-node overhead, invisible on a big model, is most of the work on three small layers. When this was measured it was about 3.5 times slower. Quantisation pays on chips with vector units and weights too big for fast memory. (Beat 2: quantise for speed, and watch it get slower.)"
  - kind: whatif
    q: "A balance loop runs at 500 Hz, so each tick has 2 ms. You call a policy whose median inference is 3 ms directly inside the tick, on every fifth tick. What happens?"
    choices:
      - "Fine: the policy runs only every fifth tick, so the average load fits."
      - "Each policy tick overruns its 2 ms, so balancing misses its deadline."
      - "Fine: the loop waits once for the policy, then stays on its schedule."
      - "The policy's output arrives stale, so a watchdog hands over to PD."
    answer: 1
    explain: "A missed deadline on an inverted pendulum is a fall, and averaging over five ticks does not help the one tick that overran. So the firmware runs the policy as a separate task one priority below the control tick, passes data through a timestamped mailbox, and lets a staleness check hand the wheels back to PD. The policy proposes; the firmware disposes. (Beat 4: the policy can never delay balancing.)"
  - kind: why
    q: "Your loader reads a 64×64 layer with its rows and columns swapped, and every shape check passes. Why does comparing your loader's outputs with a reference runtime on 512 observations catch it?"
    choices:
      - "The reference runtime rejects matrices stored in the wrong order."
      - "512 observations are enough to overflow the swapped layer."
      - "The swap changes the parameter count, which the check reports."
      - "A transposed square matrix keeps its shape; only outputs show it."
    answer: 3
    explain: "A square matrix read the wrong way round is still a valid 64×64 matrix, so everything downstream is self-consistent and the network is simply wrong, in that case by more than the size of its output. Only comparing numbers with something independent reaches it. Each gate of the ladder compares against something the previous one could not reach. (Beat 5: the verification ladder.)"
---

**Goal:** export a trained policy, get it running on a microcontroller inside its timing budget, and verify it step by step before trusting anything it does on the robot.

## Where we left off

Day 16 ended on the board: the delay range was set from the bench, but at deploy time the chip sets the delay, through inference time, publish latency and quantisation. The wheeled-leg actor trained with an action delay drawn from 5 to 30 ms, and on the robot it flies at 6 to 9. So what does it take to run the policy on the chip without changing the plant it was trained on?

Two groups hit pieces of this wall long before us. In 2017 Facebook and Microsoft released ONNX, a file format for a trained network's graph that any runtime can read, because every framework had its own and none of them ran on the target hardware. In 2018 Benoit Jacob and colleagues at Google showed how to run networks with integer arithmetic only, to make convolutional networks fast on phone CPUs, and integer quantisation has been the default advice for "make it fit on a small chip" ever since. In legged robotics, Hwangbo and colleagues ran an RL policy on ANYmal's own onboard computer in 2019, with a learned model of the actuators in the training loop so that the plant the policy saw in simulation was the one it would meet.

Our chip is an ESP32 at 240 MHz with a 32 KB instruction cache, sharing one core with a 500 Hz balance loop. The first attempt was the obvious one: get the network off the GPU, then make it smaller and faster.

## The picture

My notes on `.pt`, `.onnx` and `.engine` files use an analogy I still like. The `.pt` checkpoint is a Word document: easy to edit, but you need the whole Word application (PyTorch, Python, a gigabyte of libraries) to open it. ONNX is the PDF: frozen, readable almost anywhere. A compiled engine is a printed book: the fastest thing to read, printed for one reader only.

The obvious plan follows from it. Export the PDF, then print the book in the smallest type the reader can manage, because small type means fewer pages and fewer pages means faster reading.

It breaks in two places. Whether small type reads faster depends on the reader's eyes, and our reader turns out not to have the glasses for it. And a book printed by a machine can say something different from the document it came from, with every page still looking fine. The first problem comes before either of those, though: our reader cannot open a PDF at all.

## Step by step

### Getting the network off the GPU

A trained rsl_rl checkpoint holds the actor, the critic, the optimiser state and the observation normaliser. Only the actor ships. The critic and the GPU stay behind: what runs on the robot is a 40 → 64 → 64 → 2 tanh MLP, 6,784 multiply-adds per decision.

The obvious way to run it is the way it ran in training: load the `.pt`. That needs Python and PyTorch, and the robot is a microcontroller. The next obvious way is a runtime that reads ONNX on the chip. That brings an interpreter, a loader and tens of kilobytes of code onto a board whose RAM is the scarce resource.

What we did instead: a Python script reads the published actor and writes a C file with every weight baked in, three matrix loops with `tanhf` between them. No library, no interpreter, no build step beyond the C compiler. Weights are float32 forced into DRAM, 27,656 bytes, which is exactly $4 \times (40 \cdot 64 + 64 + 64 \cdot 64 + 64 + 64 \cdot 2 + 2)$. The code on the inference path is 382 bytes.

$$
\begin{aligned}
\text{MACs} &= \textstyle\sum_{\ell} n_{\ell-1}\, n_\ell \\
&= 40 \cdot 64 + 64 \cdot 64 + 64 \cdot 2 = 6{,}784
\end{aligned}
$$

::: tip
Each layer multiplies every input by every output once. The number to remember is that only the first layer sees the observation: widen the input and only that term grows.
:::

Two decisions travel with the export. The first is where the normaliser goes. Microduck's exporter bakes it into the ONNX, which is the rsl_rl and Open Duck habit. Our runner keeps it in C, outside the network, for a reason that turns up in beat 5. The second is the observation assembler: the firmware builds the 40 numbers in its own C code, so there are now two copies of `obs.py`, one in Python and one on the chip: the second copy Day 15 left open.

::: field Field notes: what the export has to carry
**Ship:** the actor only, plus the normaliser's means and scales. **Pin:** constants to what training believed, not to what you re-measure. Odometry uses the nominal wheel radius 0.019205 m, and the 10 ms step is baked into the assembler's filters. Re-measuring the wheel must not silently move the policy's sense of distance. **What goes wrong:** the C observation assembler is the last second copy of the plant code, and nothing makes it structural. SAF-9 in the rl_toys defect register: the host loader never asserted that observation normalisation was off, so a second normalisation could have been applied silently. **Still open:** the weights-generator script itself is not in my notes; the probation report only records that it exists, in `lean_deploy`.
:::

So the network runs, as plain C. On the profiler it takes 435 µs of arithmetic, against a 10 ms period. That looked slow enough to be worth fixing, and the textbook fix for slow is quantisation.

### Quantise for speed, and watch it get slower

The textbook says 16-bit integers are half the size of floats, move half the memory and run on cheaper arithmetic. So esp-ppq quantised the actor to int16 weights and activations, calibrated on real observations from a flight capture, and folded both tanh layers into 2049-entry lookup tables. esp-dl loads the graph and runs it node by node.

On the original ESP32 it was 3.5 times slower.

| Measure | Float C | int16 esp-dl |
|---|---|---|
| Arithmetic, hot cache | 435 µs | 1,201 µs |
| Inference window, minimum | 1,364 µs | 8,652 µs |
| Inference window, median | 3,075 µs | 10,722 µs |
| Policy interval, median | 10.0 ms | 11.0 ms |
| Intervals over 15 ms | 0 | 50 |
| Action age at the wheels, p99 | 8 ms | 13 ms |
| Worst error on motor command | 0.003 mV | 72.3 mV |

Half the int16 inferences took longer than the period they had to fit in, so the policy stopped running at the rate it trained at. Three causes, and none of them is a tuning problem. The ESP32 has a single-precision float unit and no 16-bit vector instructions, so an int16 multiply is at best as fast as a float one and carries quantise and requantise steps on top. esp-dl is an interpreter, and its per-node overhead, invisible on a big convolutional model, is most of the work on three matrix layers. And esp-dl brings tens of kilobytes of code through the same 32 KB instruction cache that the control tick, the motor commutation and the radio evict between every inference: a cold cache cost 929 µs on the float path and 7,451 µs on int16.

The one column int16 wins is memory, and it wins it in the wrong currency. Its graph sits in flash, which is 59% empty on this board.

<figure class="embed">
  <iframe src="../assets/embeds/float-against-int16.html?lang=en" title="Float against int16: the same actor two ways on an ESP32" loading="lazy" style="height:760px"></iframe>
  <figcaption>The full comparison: the bar chart against the 10 ms budget, then why the quantised one lost. It has its own 中文 toggle. <a href="../assets/embeds/float-against-int16.html?lang=en" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

Then the same experiment ran on the ESP32-S31 with Microduck's policy, a 61 → 512 → 256 → 128 → 14 ELU network with 196,864 multiply-adds at 50 Hz, and the answer flipped.

| Microduck actor on the ESP32-S31 | Mean latency | Fits 20 ms? |
|---|---|---|
| ESP-DL int16 | 4.2 ms | yes |
| Plain C float, weights in PSRAM | 9.9 ms | yes |
| Plain C float, weights in flash | 48.3 ms | no |

The S31 has the 16-bit vector kernels, and this network is a different shape of problem: 772 KB of float weights do not fit its 512 KB of internal SRAM, so plain C is bound by memory bandwidth, not by the FPU. ESP-DL's int16 weights are half the size and its kernels load them with SIMD. On-chip outputs match the float reference to an MAE of 0.0011.

::: field Field notes: int16 or float
**Quantise when** the chip has 16-bit SIMD and the float weights do not fit fast memory: Microduck on the S31, 4.2 against 9.9 ms. **Stay in float when** the chip has an FPU and no vector unit and the network is a few small layers: the wheeled robot on the ESP32, 1,201 against 435 µs. **What goes wrong:** quantisation adds a calibration range, a graph reader and rounding as new ways to be wrong (beat 5), so it has to buy something. **Status:** the robot went back to the float path, and esp-dl stays in the repository behind a switch. "No SIMD on the old ESP32" is the suspected cause, and the probation report still lists confirming it as an open item.
:::

So quantisation was the answer to a question we had not asked. The int16 graph would only ever have touched the matrix work, and on the float path that is not where the time goes.

### Where the 3 milliseconds go

If not the multiply-adds, then what? Two instruments measure the float network's cost, and they disagree by a factor of three. The flight recorder stamps every inference with its wall time: a median of 3,075 µs over 8,769 inferences. The console profiler runs the forward pass 200 times back to back and reports 435 µs.

The obvious reading is to average the recorder and call 3 ms the cost. But every timing sample on this chip is the true cost plus whatever interrupted it, and interruptions only ever add. The distribution has a hard floor and a long tail, so the mean is an average of interruptions and moves with load. The minimum over enough samples is the closest thing to the cost: 1,364 µs. Both instruments are floors, so the gap between them is real, and the five nested rows below take it apart.

<figure class="embed">
  <iframe src="../assets/embeds/where-the-3-milliseconds-go.html" title="Where the 3 milliseconds go: a to-scale decomposition of one inference" loading="lazy" style="height:900px"></iframe>
  <figcaption>Read it downward: period, publish latency, inference window, compute, arithmetic. The diagram scrolls sideways on a phone. <a href="../assets/embeds/where-the-3-milliseconds-go.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

$$
\begin{aligned}
t_{\text{arith}} &\approx N_{\text{MAC}}\, c_{\text{MAC}} + N_{\tanh}\, c_{\tanh} + N_{\text{in}}\, c_{\div} \\
&= 169 + 255 + 11 = 435\ \mu\text{s}
\end{aligned}
$$

::: tip
On this chip one tanh costs 1.99 µs, about 80 multiply-adds' worth. 128 tanh calls cost more than all 6,784 multiply-adds. And arithmetic is a third of a real inference: 929 µs of the 1,364 is time the arithmetic cannot account for, which I attribute to flash instruction-cache misses. That is an attribution, not a reading.
:::

So the levers, ranked against the real 1,364 µs: move the forward pass into RAM (up to 929 µs, about 340 bytes), approximate tanh in the code generator (255 µs, but decide the 2e-4 replay tolerance first), quantise to int16 (169 µs at best, and we saw what it cost). Neither of the first two has been tried yet.

Try your own network. The costs below come from the measurements on this page, one network per chip, so anything far from those networks is an extrapolation and the widget says so.

<latency-budget layers="40-64-64-2" hz="100" chip="esp32f" preempt="1"></latency-budget>

Switch the chip to int16 at 100 Hz and the bar crosses the period, the way the robot did. Load the 14-frame preset: the multiply-adds roughly double, from about 6,800 to 13,200, and it still fits easily. Then put Microduck on each S31 option.

::: field Field notes: timing a policy on a microcontroller
**Use the minimum, not the mean**, and report which instrument a number came from. **What goes wrong:** the profiler's first run fed the assembler an all-zero observation, and `tanhf` returns early for tiny arguments, so it timed the cheap branch and made a step read faster than the forward pass inside it. It now runs on the median-cost row of a real capture. **Still open:** the tanh approximation and the RAM experiment are both untested, and the RAM experiment is what would confirm or kill the cache attribution.
:::

One row in that decomposition is bigger than the compute: 1,711 µs of the median window is the policy being preempted by the 500 Hz control tick. That is not a bug to optimise away. It is on purpose.

### The policy can never delay balancing

The obvious place to run the policy is inside the control loop: read the IMU, run the network, write the motors. At 500 Hz the tick has 2,000 µs. A float inference at the median takes 3,075, so every policy step would make the balance loop miss its deadline, and a missed deadline on an inverted pendulum is a fall.

So the firmware splits them. The control tick runs at 500 Hz on core 1 at priority 20 and never waits for the policy. Every fifth tick it posts a sensor snapshot to a mailbox and moves on. The policy task sits on the same core at priority 19, so it only runs in the gaps the tick leaves. Its output comes back through the mailbox with a `t_ms` timestamp, and that timestamp is the staleness clock: an output older than 60 ms is presumed a dead feed and the PD law takes the wheels back.

Handing the wheels over is gated the same way. DISARMED, REFLEX, HOME, YAW, DISTURBED, HEIGHT and STALE each refuse or revoke a grant; a 500 ms ramp scales the voltage in from zero and a 6 V cap bounds it, whatever the network asks for. There is no fallback network. If the graph produces a non-finite action, the runner publishes nothing, STALE fires on the next tick and PD takes over. The `espdl_fb` counter is what tells that apart from a dead feed.

<figure class="embed">
  <iframe src="../assets/embeds/station-keeping-policy-runner.html" title="Station-keeping policy runner: task layout, observation, network, gates, verification and timing" loading="lazy" style="height:820px"></iframe>
  <figcaption>The whole runner. Section 1 is the swimlane (scroll it sideways on a phone), section 4 the gates, section 5 the verification ladder of the next beat. <a href="../assets/embeds/station-keeping-policy-runner.html" target="_blank" rel="noopener">Open full page</a></figcaption>
</figure>

The same separation shows up one level higher on Microduck, which runs one ONNX file per skill and switches between them with a rule-based multiplexer: walking and a forward roll never share a network, because 50% walk and 50% roll is not a behaviour.

::: field Field notes: the safety layer
**Rule:** the policy proposes and the firmware disposes. Rate, priority, staleness, ramp, cap and height gate live outside the network, where a bad network cannot argue with them. **What goes wrong:** the earlier host-loop path had them in the wrong places. SAF-2: NaN passed the exported C output clamp straight into the mixer. SAF-5: ±inf passed the firmware's NaN filter. SAF-1: the host actively defeated the firmware watchdog, so telemetry loss was undetectable. SAF-4: the authority ramp armed once and never re-armed. **Test:** feed the runner a NaN and confirm nothing reaches the motors and STALE fires.
:::

That layout keeps a bad policy from hurting the robot. It does not tell us whether the chip is computing the policy we trained, and a wrong network that stays inside the 6 V cap looks exactly like a bad one.

### The verification ladder

The obvious check is to flash it and see whether it balances. That check cannot tell a wrong port from a wrong policy, so the runner has four gates, each comparing against something the previous one could not reach.

| Gate | Compares | Tolerance | Caught |
|---|---|---|---|
| 1. ONNX replay | our reader against onnxruntime, 512 observations | 1e-5 | a square 64×64 layer that arrived untransposed: self-consistent downstream, 1.27 out on the action |
| 2. Golden replay | generated C (host gcc) against the numpy twin, 240 chained steps | 2e-4 action, 1e-3 V | passes at 3.3e-7 |
| 3. Quantisation grading | int16 against float across a whole real capture, split by out-of-range rows | 0 rows out of range | the calibration failure below |
| 4. On-device vectors | 32 observations graded on the ESP32 itself | 2e-4 against esp-ppq's integer twin, 6.7e-3 against float | the only gate that reaches the chip's own arithmetic |

Gate 1 is the one that sounds pointless until it fires. A square layer read with rows and columns swapped is still a valid 64×64 matrix, every shape check passes, and the network is wrong by more than the size of its output.

Gate 3 is where normalisation outside the graph pays off. Folding the normaliser into the first layer would hand the quantiser forty channels whose raw ranges span three orders of magnitude, all sharing one 16-bit scale. Even with that avoided, the calibration range decides which observations the graph can represent at all, and anything outside it is clipped.

::: field Field notes: grading a quantised network
**What went wrong (2026-09-09):** a step cap fed the calibrator the first 10 s of a 90 s run. It sized the range to ±0.25 for a run that reached 0.695, 4.8% of rows had a channel clipped (the action feedback and the gyro among them), the quantised net disagreed with the float one by up to 7 V, and the robot flew visibly worse. **Fix:** minmax over the whole window with the largest rows forced in, and the exporter prints the out-of-range count, which must be zero. After it: worst error 72.3 mV, 99th percentile 43 mV, against a 570 mV signal spread. **And the grader lied first:** an earlier version scored only a held-out tail, the quietest stretch of the run, and reported 1.16e-3 for a network that was 0.87 out where it mattered. Grade across the whole capture.
:::

Let me regroup, because that was five beats of plumbing. We exported the actor to plain C because the chip cannot carry a runtime. We tried int16 for speed and it was slower on the ESP32 and faster on the S31, because speed belongs to the chip. We found where the time actually goes, and that most of it is not arithmetic. We kept the policy below the balance loop and behind gates that do not trust it. And we built four gates that each catch a different way for the chip to compute something other than the network. Every one of them compares the chip with the network. None of them says the network will balance the robot.

### The first flash: holds at 40 mm, rails at 70 and 85

The first hardware run, `sk_head_yd15_r128_s0` on 2026-09-02, is the one Day 13 used for the latch. Here it is from the deployment side, as a debugging order. At 40 mm, crouched, it held: 138 of 138 samples owned, wobbling hard and swinging between −8 and +5 V. At 70 and 85 mm, the trained height, it railed on the first tick of ownership and PD took the wheels back, every time.

The obvious suspect is the port. It was ruled out first, and that is the point of beat 5: the C chain matched PyTorch to 4.1e-7 on the action over the 240-step golden replay, geometry and interface agreed between firmware and sim, and an offline probe of the actor had the right signs at upright. So the finding had to land on the firmware or the weights.

Then two wrong leads. The 70 mm shadow looked healthy at about 1 V, the trap Day 13 explains: `pos_err` had been cancelling the pitch term until takeover reset it. A pitch-trim sweep zeroed the shadow at −6°, and on takeover the policy railed the other way. It moved which rail, so it was not a static bias. Raising the staleness window from 60 to 200 ms changed nothing, which falsified "the eject is what prevents a hold".

The joint diagnosis found two confirmed causes.

1. **Firmware: the grant tick actuated a stale copy.** The control tick copied the policy mailbox before it processed the grant, so the episode reset never invalidated the tick-local copy. The arbiter drove one 2 ms tick of the pre-reset shadow output, then ejected it as stale. Four of five grants died in exactly one tick, whatever the staleness window. Fixed: the grant now invalidates the local copy.
2. **Policy: the prev_action self-latch** of Day 13. The static probe of the flashed weights settles at (+8.00, +1.04) V, which reproduces the pinned shadow with 0.000 V residual.

::: field Field notes: rule out the plumbing first
**Order:** numeric port, then firmware, then policy. A finding that lands on the policy after the port is verified is a training-side request, not a debugging session. **What shipped while the retrain landed:** the grant fix, a takeover cap and ramp (6 V, 0.5 s) so the latched rail cannot reach the motors, and the height gate set to the trained range 45 to 85 mm. **Retrain acceptance:** a static probe from `prev_action = ±1` in a neutral state stays below 2 V. **Still open:** on-robot parity is unscored, because the captures lack the arm edge the scorer needs; the next session should start the capture before arming.
:::

So the firmware bug is fixed and the latch needs a retrain. Which leaves the question of what to retrain for, because the board has now told us its delay, and it is not where training put it.

### The rate is not a knob, and faster is not better

The obvious move is to take the timing win and spend it: inference takes 1,364 µs at best, so run the same weights at 200 Hz and halve the delay.

The weights do not know how to be run at 200 Hz. The 10 ms step is baked into the assembler's filters, and the four-frame stack spans three intervals, so the network learned what "one frame ago" means in seconds. At 200 Hz the same weights see references drifting at half the intended rate over half the intended history. That is out of distribution, and a different rate is a retrain.

Faster inference at the same rate has the same problem in a quieter form. The actor trained with an action delay drawn from 5 to 30 ms, and the robot measures 6 to 9: it already flies at the fast edge of what it saw. Shaving 2 ms off inference moves it further off the training distribution, not towards its middle. And the output is held for all five ticks until the next inference, so with the policy in charge this really is a 100 Hz balance controller with no fast inner loop.

$$
\begin{aligned}
d_{\text{robot}} &= t_{\text{infer}} + t_{\text{publish}} + t_{\text{hold}} \\
d_{\text{robot}} &\in \operatorname{supp}\big(p_{\text{train}}(d)\big)
\end{aligned}
$$

::: tip
The delay the robot actually flies under is made of the chip's own timings. Whatever you do to the chip, that sum has to stay inside the range the policy trained on, preferably near the middle of it.
:::

This is what moved after the port. The ablation runs drew delay from 5 to 45 ms; for the ESP-DL port the window moved to 3 to 30 ms, and every trained policy's assumptions moved with it. The policy is pinned to the firmware's signal processing and timing, not to the simulator as such.

::: field Field notes: retrain for the board, not the bench
**Rule:** measure the deployed delay first (the recorder's `age_ms` column, per sample), then set the training window around it. **When:** after every change to the runtime, rate, priority or quantisation. **What goes wrong:** a policy tuned on a bench delay flies under a board delay. **Microduck:** the Jetson deploy loop runs at 50 Hz with the normaliser baked into the ONNX, and the measured bus delay is 60-120 ms, which is the 3-6 step ring training draws from. My notes on that path stop there; its timing has not been taken apart the way the ESP32's has.
:::

The policy now runs inside its budget on a verified port, behind gates that do not trust it, and the board has handed back a delay window and a latch. Both need a retrain.

## Pitfalls

- **Quantising because the textbook says so (beat 2).** On a chip with an FPU and no vector unit, int16 through an interpreter is slower. You will see it as a policy interval that slips from 10.0 to 11.0 ms and a p99 action age that climbs from 8 to 13 ms.
- **Timing with the mean, or with a toy input (beat 3).** The mean moves with load and the all-zero profiler input timed the cheap `tanhf` branch. Use the minimum over a real capture.
- **Running the policy inside the control tick (beat 4).** A 3 ms median inference in a 2 ms tick misses the balance deadline every policy step. Put it one priority below, behind a mailbox and a staleness clock.
- **Grading quantisation on a quiet tail or a short calibration window (beat 5).** 1.16e-3 on the tail was 0.87 where it mattered; 10 s of calibration clipped 4.8% of rows and cost up to 7 V. Grade across the whole capture and require zero out-of-range rows.
- **Trusting the shadow (beat 6).** A policy running but not driving sees a different observation from the one it gets at takeover. The 70 mm shadow read about 1 V and railed on the first tick.

<!-- quiz -->

## Next

You might ask, now that the policy runs, what was all of it for? The first flash showed that the policy's own feedback can latch it, and the board showed that its delay window was set on the bench. Fixing that is not a firmware patch: it means retraining with a new delay range, re-running the ablations on the new plant and re-gating every checkpoint before the robot sees it. What does that loop look like end to end on one robot? That is [Day 18](../day18/).

## Sources

- `artifacts/station-keeping-policy-runner.html` (primary): task layout, the 40-number observation, the int16 graph, handover gates, the four-gate verification ladder, measured timing, known limits. Embedded above.
- `artifacts/float-against-int16.html`: the float and int16 measurements on the ESP32 and the three causes. Embedded above, with a `?lang=` switch added so the Chinese page opens it in Chinese.
- `artifacts/where-the-3-milliseconds-go.html`: the five-level decomposition, the two instruments, minimum over mean, the lever ranking, the profiler fixture bug. Embedded above.
- `artifacts/yd15-hardware-findings.html`: the first flash, the shadow trap, the trim sweep, the joint diagnosis, the 2 V retrain acceptance.
- `artifacts/rl-presentation-plan.html`: Slide 14 and the ESP32-S31 benchmark table (`tools/compare_report.py`, 2026-09-10); the Microduck deploy loop.
- `artifacts/rl-toys-defect-register.html`: the hardware-safety group, SAF-1 to SAF-13. The whole register is on [Day 10](../day10/).
- Probation report, section 3.4 and open items ([Notion](https://app.notion.com/p/3f367249ddbf80d890eef6f59636b9c5)): `lean_deploy`, the C weights generator, ESP-DL slower on the ESP32 and faster on the S31, the SIMD hypothesis still to confirm.
- ".pt .onnx .engine" ([Notion](https://app.notion.com/p/2e967249ddbf8017aa1beee4f4999516)): the Word, PDF and printed-book analogy.
- `notes/microduck-takeaways.md` ([Notion](https://app.notion.com/p/3dc67249ddbf80a9a46bfe303aab4f37)): the 50 Hz Jetson deploy loop, the 61-512-256-128-14 actor, one ONNX per skill.
- `notes/design-insights-observations-actions-and-rewards.md`: the embedded cost of a deeper stack, about 6,800 → 13,200 MACs.
- `artifacts/one-plant-two-engines.html`: the normaliser baked into ONNX by rsl_rl and Open Duck; the C assembler as the last second copy of `obs.py`.
- `artifacts/the-split-loop.html`: "everyone who deploys has two loops".
- `artifacts/jumper-field-guide.html`: one policy per skill, rule-based switching.
- `notes/the-worries-of-simulation-and-how-to-diagnose-them.md`, `artifacts/removing-more-made-it-better.html`: the delay window moving from 5-45 ms to 3-30 ms for the ESP-DL port.
- Background: `artifacts/wlrobot-lock-map.html`, the dual-core firmware's locks and the 500 Hz control task the policy has to fit beside.
- B. Jacob et al., "Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference", CVPR 2018 ([arXiv:1712.05877](https://arxiv.org/abs/1712.05877)).
- J. Hwangbo et al., "Learning agile and dynamic motor skills for legged robots", Science Robotics, 2019 ([arXiv:1901.08652](https://arxiv.org/abs/1901.08652)).
- ONNX, Open Neural Network Exchange ([onnx.ai](https://onnx.ai/)).
