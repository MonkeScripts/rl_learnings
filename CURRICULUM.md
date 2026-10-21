# RL Study Guide: Curriculum Plan

Numbered days grouped into stages, bilingual (EN + zh-CN), published at monkescripts.github.io/rl_learnings.

- 19 core days in 4 stages, plus 2 elective days.
- The whole guide is one story, told the way `notes/ppo-takeaways-clean.md` tells "The PPO story" (see `STYLE.md`). Each day ends on a problem it could not solve, and the next day opens by picking it up. That line is the **Hand-off** on every day below.
- Stage 2 uses the PPO story itself as its spine: `artifacts/wlbot-learning-log-aug-30.html` (Sessions 2 and 3b), the beat map in `STYLE.md` and the PPO arc of `artifacts/rl-presentation-plan.html` (Slides 3-9). From Day 5 the running example is the balancing wheeled-leg robot, as Slide 5 does.
- All Notion content is cleared for public use, including the probation report (Probation target / 试用期报告) and the wheeled-leg and Microduck work.
- All paths are relative to `/home/heshaoliang/rl-study-guide/`.

## What changed in this revision

The day order was changed so that each ending motivates the next problem. Old artifact notes and earlier plans use the old numbers; this table maps them.

| New | Old | Title | Why it moved |
|---|---|---|---|
| 1-5 | 1-5 | Foundations, then policy gradients | Unchanged |
| 6 | 9 (first half) | Gaussian policies, exploration and the horizon | The PPO story introduces the noise and γ *before* rollouts (beats 1-2). REINFORCE on CartPole leaves exactly that question open |
| 7 | 6 | Rollouts, the critic and the advantage | Beats 3-5 |
| 8 | 7 | TD, GAE and the rollout buffer | Beats 6-9 |
| 9 | 8 + 9 (TRPO/KL half) | PPO: the ratio, the clip and the full loss | Beats 10-14. TRPO is the "Good to know" road not taken |
| 10-16 | 10-16 | Practical deep RL, simulators, DR | Unchanged numbers, rewritten hand-offs |
| 17 | 19 | Deploying a policy to hardware | DR ends on "the board sets the delay"; deployment answers it, and the first flash (yd15) motivates the case study's retrain |
| 18 | 17 | Case study: the micro wheeled-leg robot | Now the whole loop seen end to end, after every piece is in place |
| 19 | 18 | Case study: Microduck, curriculum, commands and skills beyond walking | Ends the guide looking outward (Jumper's "five slots"), which hands off to the electives |

## Day page template

The full rules are in `STYLE.md`, section 4. Sections, in order:

1. **Title + Goal**: one line.
2. **Where we left off**: picks up the previous day's hand-off, then who hit this wall first (paper, year).
3. **The picture**: the everyday analogy as the naive model, and where it breaks.
4. **Step by step**: 3 to 7 beats, each running problem, naive fix, failure, math (KaTeX), plain reading, leftover crack. **Field notes** callouts and **Interactive pieces** sit inside, next to the beat they serve.
6. **Pitfalls**: 3-5, each tied to a beat.
7. **Quiz**: Why / What if / Numbers, answers collapsed.
8. **Next**: the hand-off in "You might ask..." form, linking the next day.
9. **Sources**: notes (with Notion links), artifacts, papers, courses. Material adapted from the Hugging Face Deep RL Course is credited on the page (see Content provenance).

Each day below lists: **Picks up**, **Goal**, **Story** (the beat chain), **Sources**, **Field notes**, **Interactive pieces**, **Gaps**, **Hand-off**.

---

## Stage 1: Foundations (Days 1-4): from the loop to a network that scores actions

### Day 1: The RL loop, MDPs and the return
- **Picks up:** the classical-control section the reader already knows: "Remember tuning PD gains to balance one robot? Now do that for every joint in every movement" (Slide 1).
- **Goal:** Describe any control task as states, actions, rewards and a discounted return, and run your first agent.
- **Story:** walk the loop once with a game (S0, A0, S1, R1) → "we design the environment: what the agent can do, see and is paid for" → the Markov property, laid down as the trump card the guide will re-open on Day 13 → the return G sums *future* rewards → an infinite sum can diverge and the far future is uncertain → discount γ → episodic vs continuing tasks.
- **Sources:** `notes/chapter-1-introduction.md` (Hugging Face course, rewrite); Preface of `notes/ppo-takeaways-clean.md`; `artifacts/rl-presentation-plan.html` Slides 1-3 (game walk-through, chess-board Markov picture, "hold on to the phrase *expected future rewards*").
- **Field notes:**
  - G_t sums *future* rewards, not past ones.
  - Discounting exists because long-horizon predictions are uncertain and the sum could diverge.
  - Teaser for Day 6: choose γ from physical time (0.999 at 100 Hz is about 10 s).
  - Vectorised envs step many seeded copies in parallel.
- **Interactive pieces:** RL loop stepper on a toy grid (click to advance S, A, R; redraw of `images/chapter-1-introduction/01.png`). γ to horizon calculator (γ and control rate in, effective steps 1/(1-γ) and seconds out); reused on Day 6.
- **Gaps:** No history section (Bellman 1957, TD-Gammon, Atari 2013). The formulas are now KaTeX in the note but have not been rendered.
- **Hand-off:** G needs rewards we have not seen yet. How do we judge a situation without playing the rest of the game out?

### Day 2: Value functions and the Bellman equation
- **Picks up:** "judge a situation without playing it out".
- **Goal:** Explain V(s) and Q(s,a), and why the Bellman recursion makes them cheap to compute.
- **Story:** play it out many times and average (expensive) → name the average: V(s), the expected G → Q commits to one action first → the recursion V(s) = r + γV(s'), dynamic programming like the Padovan recurrence → policy evaluation and value iteration sweep the grid.
- **Sources:** `notes/chapter-2-introduction-to-q-learning.md` (first half; Hugging Face course, rewrite).
- **Field notes:**
  - Bellman as dynamic programming, like the Padovan recurrence.
  - TLDR: "V = value of each square if you follow the policy; Q = if I'm here and take this action, what do I get?"
  - Slide 4 line, planted here: "some methods learn only the value and pick the highest-scoring action" (paid off on Day 4).
- **Interactive pieces:** GridWorld value-iteration stepper with V as a heatmap after each sweep (replaces `images/chapter-1-introduction/11.png` and `images/chapter-2-introduction-to-q-learning/04.png`). V vs Q grid toggle (redraw of `chapter-2.../05.png`).
- **Gaps:** The notes have no code. Policy iteration and value iteration need a short new section. Almost no own field notes on this day.
- **Hand-off:** Every sweep needs the transition model P(s'|s,a) for every state. A robot does not hand us that. Can we learn V and Q from experience alone?

### Day 3: Monte Carlo, TD and tabular Q-learning
- **Picks up:** "learn from experience alone".
- **Goal:** Train a Q-table with epsilon-greedy and explain off-policy vs on-policy.
- **Story:** Monte Carlo: wait for the episode to end, then average → slow and noisy → TD(0): bootstrap from the next state's guess; the TD error δ (planted seed, paid off on Day 8) → Q-learning: act epsilon-greedy, learn from the best next action (off-policy) → SARSA learns from the action it actually took (on-policy) → CliffWalking shows the difference.
- **Sources:** `notes/chapter-2-introduction-to-q-learning.md` (second half; Hugging Face course, rewrite). `images/chapter-2.../13.png` (own screenshot of the TD-error reading).
- **Field notes:**
  - Driving in a new city with an epsilon-greedy GPS, but updating from the best road at the next intersection.
  - SARSA penalises risky exploration, so it suits safety-critical settings. Q-learning targets the true optimum.
- **Interactive pieces:** epsilon-greedy Q-table explorer on the 2x3 cheese maze (redraws of `chapter-2.../14.png`, `16.png`, `19.png`). CliffWalking path viewer, SARSA vs Q-learning.
- **Gaps:** No code in the notes. CliffWalking is new.
- **Hand-off:** The Q-table has one cell per state-action pair. The wheeled robot's state is ten continuous channels; no table is big enough.

### Day 4: Deep Q-Networks
- **Picks up:** "no table is big enough", so let a network predict Q.
- **Goal:** Scale Q-learning with a neural net and stabilise it with replay, a target network and Double DQN.
- **Story:** the network predicts Q → the TD target moves with the weights (wild goose chase; the rewrite example in `STYLE.md` section 6) → freeze a copy, refresh every C steps → consecutive samples are correlated → replay buffer → a max over noisy guesses is optimistic → Double DQN → one frame cannot show motion → frame stacking (seed for Day 13).
- **Sources:** `notes/chapter-3-deep-q-network-dqn.md` (Hugging Face course, rewrite).
- **Field notes:** the wild goose chase; the user's TLDR of fixed Q-targets; the Online vs Target table; frame stacking captures motion (Day 13 returns to it).
- **Interactive pieces:** DQN architecture diagram (redraw of `chapter-3.../01.png`). "Aim at a photograph" animation of the moving target vs frozen target (replaces the cowboy figure `chapter-3.../07.png`).
- **Gaps:** PER and Dueling DQN are a one-line stub. Context: DQN Atari 2015.
- **Hand-off:** DQN acts by taking the argmax over a few buttons. A wheel motor takes any voltage in ±8 V, so there is nothing to take the max over (Slide 4). We have to learn the policy itself.

## Stage 2: Policy optimisation (Days 5-9): the PPO story

Spine: `notes/ppo-takeaways-clean.md` beats 0-14, `artifacts/wlbot-learning-log-aug-30.html` (Session 2 builds PPO from a PD background; Session 3b adds what V means, `compute_returns`, the three phases and the ratio/TRPO decoding) and `artifacts/rl-presentation-plan.html` Slides 3-9 with their bridge lines. Keep the beats in this order and split them across days only at the cracks the story already has.

### Day 5: Policy gradients and REINFORCE
- **Picks up:** "learn the policy itself".
- **Goal:** Optimise a stochastic policy directly with gradient ascent on J(θ).
- **Story:** J(θ) as the North Star (mountain height; ∇J the compass) → the gradient is an expectation over trajectories we cannot enumerate, so sample → log-prob trick and the policy gradient theorem → REINFORCE on CartPole → the backward return loop and standardisation → the gradient is very noisy → planted seed (PPO story beat 0): "why not also have a judge, like a football coach?"
- **Sources:** `notes/chapter-4-policy-gradient-with-pytorch.md` (Hugging Face course, rewrite); Preface "Actor critic (food for thought)" in `notes/ppo-takeaways-clean.md`; Slide 4 ("robots learn a policy because motors are continuous").
- **Field notes:** sampling is needed because the space of trajectories is effectively infinite, not because one episode is; the policy-based vs policy-gradient table; the line-by-line table of the backward loop and standardisation.
- **Interactive pieces:** gradient-variance plot, with and without return standardisation. Policy gradient picture (redraw of `chapter-4.../02.png`, `03.png`).
- **Gaps:** The derivation section the notes promise does not exist. The code uses the old gym API.
- **Hand-off:** CartPole's policy is a softmax over two buttons. The wheel wants a voltage. What does a stochastic policy over a continuous action look like, and where does its exploration come from?

### Day 6: Gaussian policies, exploration and the horizon
- **Picks up:** "a stochastic policy over a voltage".
- **Goal:** Explain how a continuous-control policy explores and exploits, and pick γ from the robot's physics.
- **Story (beats 1-2):** one deterministic action explores nothing → output a mean and a learned std, sample around the mean: the noise is the exploration → shrinking std is exploitation; deploy the mean (Slide 5) → entropy measures how much exploration is left, and a Gaussian's entropy can go negative → actions have consequences, so how far ahead do we look? → γ from physical time.
- **Sources:** `notes/ppo-takeaways-clean.md` beats 1-2 and "Entropy flipping between positive and negative"; `artifacts/wlbot-learning-log-aug-30.html` Session 2 ("every sampled action is a tiny experiment"); Slide 5 and its training vs deployment flow; the gamma slider and bonus section of `artifacts/removing-more-made-it-better.html`.
- **Field notes:**
  - The std starts at exp(-1), about 0.37 of the action range; the deployed policy uses the mean.
  - ent_coef = 0 on the robot, because the std is already learned.
  - Entropy crosses zero at σ ≈ 0.242, so watch the trend, not the sign.
  - γ = 0.999 ≈ 1000 steps ≈ 10 s at 100 Hz, longer than the slowest thing we care about.
  - Sidebar from `artifacts/roller-model-inquisition.html`: an action-rate penalty is also a tax on exploration (std 1.0 → 0.3 within 100 iterations, and glide never appeared). Pointer to Day 10's σ phases.
- **Interactive pieces:** Gaussian policy sampler: sliders for mean and std, sampled actions on the ±1 range, entropy readout that crosses zero at 0.242. Gamma slider (port or iframe the one in `artifacts/removing-more-made-it-better.html`), plus the Day 1 calculator.
- **Gaps:** The Off-policy vs On-policy subsection in the source is unfinished. It is needed here to say why the noise has to come from the current policy.
- **Hand-off:** γ = 0.999 means an action echoes for about 1000 steps. REINFORCE waits for the whole episode and scores every action with one noisy G. Learning from 1000-step episodes in one piece will not work.

### Day 7: Rollouts, the critic and the advantage
- **Picks up:** "1000-step episodes in one piece will not work".
- **Goal:** Explain the rollout buffer and why a learned critic and the advantage A = G - V cut the variance.
- **Story (beats 3-5):** train on whole episodes → credit assignment fails (Slide 6) → record 128-step snippets from 1024 robots, shuffle them; an episode can end mid-snippet; the buffer belongs to the current policy and is thrown away → circling back to G: (a) no future past step 127, (b) G is one noisy sample → the seed from Day 5 pays off: the critic V(s) bootstraps the tail with V(s₁₂₈) and A = G - V asks "better than usual?" → the +5 / +8 / +2 worked example (Slide 7) → what V really means (Session 3b).
- **Sources:** `notes/chapter-6-actor-critic-methods-with-robotics-environments.md` (Hugging Face course, rewrite); `notes/ppo-takeaways-clean.md` "Why we chop episodes into rollouts", "The two problems with G", "Enter the critic, and the advantage"; Slides 6-7; `artifacts/wlbot-learning-log-aug-30.html` Session 3b ("what V means", the buffer-vs-episode diagram).
- **Field notes:**
  - The critic fixes both problems with G at once.
  - V is the expected discounted return over about 1000 steps, not "the tail of the buffer". The buffer is a 128-step slice of 1024 out-of-phase episodes. The critic fills in at the buffer end and at timeouts, but not at falls.
  - Robots are not reset when the buffer is thrown away, so each rollout starts mid-episode.
  - A robot standing still for 128 steps teaches nothing: pushes and random tilts fill the buffer with useful transitions.
- **Interactive pieces:** buffer slicer: 1024 out-of-phase episodes with a 128-step window; click a step to see which rewards are real and which are bootstrapped. Advantage branch figure (Slide 7: tilting robot, +8 and +2 branches, +5 dashed line) as SVG. Actor-critic flow (redraw of `chapter-6.../01.png`, `05.png`).
- **Hand-off:** Unfortunately the critic is a network too, so it is wrong as well. How much should we trust a judge we know is wrong?

### Day 8: TD, GAE and the rollout buffer in code
- **Picks up:** "how much to trust a wrong critic".
- **Goal:** Build the advantage estimator PPO actually uses and know exactly what the buffer holds.
- **Story (beats 6-9):** the TD error δ from Day 3 comes back: a better, biased estimate → 1-step TD (bias) vs Monte Carlo (variance; Ulam's solitaire) → GAE: λ as a vote of confidence → the critic still needs training → rsl_rl `compute_returns` line by line: the telescoping proof that the sum of δ's is G_boot - V, returns = advantages + values, not_done masking, timeout bootstrapping → the three phases: collect (old values stored), backward arithmetic, update; values are not refreshed between epochs → regroup: buffer rebuilt every iteration = on-policy; there is only one policy.
- **Sources:** `notes/ppo-takeaways-clean.md` "Temporal difference", "Generalized Advantage Estimation", "Training the critic", "Recap, and what the buffer actually holds"; `artifacts/wlbot-learning-log-aug-30.html` Session 3b (`compute_returns`, telescoping proof, three phases); Schulman et al. 2016 (GAE).
- **Field notes:** the (γλ)^k = 0.949^k credit window falls to 0.001 by k = 128; "Standard for gae_lambda is 0.95. Don't ask, I don't know how."; advantage-only normalisation.
- **Interactive pieces:** (γλ)^k credit-window plot with a rollout-length marker (reused on Day 11). `compute_returns` stepper on a 6-step toy buffer, showing δ, A and returns filling in backwards.
- **Gaps:** None in content. The Aug 30 log's Unicode math must be retyped in KaTeX.
- **Hand-off:** With only one running policy, how do we update? After the first gradient step the weights no longer match the data that is in the buffer.

### Day 9: PPO: the ratio, the clip and the full loss
- **Picks up:** "the data is stale after one step".
- **Goal:** Derive the clipped surrogate objective, write PPO from scratch, and know why trust regions exist.
- **Story (beats 10-14):** the buffer still holds the old log-prob, the "old opinion" → ratio r = π_θ / π_θold and L^CPI (importance sampling) → nothing stops us maximising it: one noisy batch drags all probability onto one action → the clip (overhauling your sport technique overnight, Slide 8); "Proximal is that rule made into maths" → six cases of when it clips → the clip removes the reward for drifting, not the drift: log KL and clip fraction → the full loss: value loss, entropy bonus (0, and why), grad-norm clip, KL early stop and adaptive KL → Good to know: TRPO's hard KL leash → recap: Act, Collect, Judge, Update (Slide 9).
- **Sources:** `notes/chapter-8-ppo.md` (Hugging Face course, rewrite); `notes/ppo-takeaways-clean.md` "The ratio" through "KL early stopping" and "Trust regions, KL and TRPO"; original PPO takeaways page (Notion `28a67249ddbf80cda601dacbc9d8cf80`), "Actual implementation"; `artifacts/wlbot-learning-log-aug-30.html` Session 3b ("the PPO guide decoded", KL as a monitor, schedule="fixed"); Slides 8-9; Schulman et al. 2015 (TRPO) and 2017 (PPO).
- **Field notes:**
  - "The clip never traps the policy on the wrong side. It only removes the reward for running away on the right side."
  - "I think nobody uses this TRPO nonsense, but I could be wrong."
  - Adaptive KL raises the LR as the signal fades (evidence on Day 11).
- **Interactive pieces:** clip explorer: sliders for advantage sign, ratio and ε, with L^CLIP and its gradient plotted (rebuild of the unrecoverable artifact `de1b44ef`; also replaces the six-case figure `chapter-8.../07.png`). Four-box cycle (Act, Collect, Judge, Update) revealed one box at a time.
- **Gaps:** The original page's implementation section needs a diff against the clean copy. The TRPO vs PPO table is only in the original page. The clip explorer must be rebuilt.
- **Hand-off:** The clip removes the reward for drifting, not the drift. And with 1024 freshly randomised robots per iteration, the episode-length curve wobbles by about 60 steps on its own. How do we tell a healthy run from a broken one?

## Stage 3: Making it work in practice (Days 10-14)

### Day 10: Reading training curves and debugging
- **Picks up:** "the curve wobbles on its own".
- **Goal:** Have a checklist for "why isn't it learning?", a health dashboard you trust, and a way to read a run instead of staring at it.
- **Story:** the wobble has three sources: sampled actions, a new set of 1024 randomised robots every iteration, small samples → only deterministic 1000-episode evals count → the health dashboard (entropy, approx KL, explained variance, min/max return) → reading a run is a six-step loop: context (diff env.yaml), expect, observe, compare, diagnose, decide; trackers only cover "observe" → a scheduled reward dip is not an alarm → penalty sign audit and inert terms → σ thresholds depend on the phase → the training env itself can lie: "two patterns, not sixty bugs" → advisor, not operator.
- **Sources:** `notes/deep-rl-hacks-schulman.md`; `notes/ppo-takeaways-clean.md` "The wobble", "Training health dashboard"; original PPO page "Metrics" and "ML utils"; `artifacts/microduck-run-doctor.html` (primary: the RunDoctor write-up); `artifacts/rundoctor-sk-lean4.html` (a real dashboard); `artifacts/rundoctor-milestone-2-playbook.html` (summarise only: rule set v1.1, golden counts, calibration); `artifacts/rl-toys-defect-register.html`; `artifacts/jumper-field-guide.html` (traps table); sidebars from `artifacts/launches-and-resets.html`, `artifacts/where-the-3-milliseconds-go.html` and `artifacts/wlbot-config-spine.html`.
- **Field notes:**
  - The hack-to-practice map ("Know your noise", "Look beyond the mean").
  - "The value is in the flags that don't fire." An alert on every dip gets muted within a day.
  - σ phases on Microduck: exploration (σ < 0.5 at 468), commitment (< 0.3 at 791), consolidation (< 0.2 from 1358). σ 0.16 is healthy at 40k and premature at 300.
  - `angular_momentum` was exactly 0 for 50k iterations; a turning reward logged 0.0017 for 37,500 iterations; a helper at weight 0 was skipped for two versions. Plot every term early.
  - Air time converged to 0.1254 s against a floor of 0.125: the policy takes the shortest step that pays.
  - Faithful replay: `play` resets `common_step_counter`, so the curriculum does not rewind with the checkpoint.
  - Calibration: entropy is under 10% of its start by iteration 200 on every run, good or bad, so entropy_collapse was disabled. sk_lean's late_decline fired at 3318, with peak_passed as an early heads-up at 2099. "My expectations were wrong, not the rules."
  - sk_lean4's pre-registered reward_per_step ≥ 0.87 by 1200 came in at 0.65 (`prediction_missed`).
  - The defect register: every GPU episode spawned 57.3 mm in the air; odometry advanced twice per step; the curriculum ramp finished at 9.4% of training instead of 50%. The gates passed because none exercised the training path end to end.
  - Pitfall box: build-time keys (masses, geometry) silently ignore run-time overrides (config spine).
  - Profiling sidebar: "measure one level deeper before editing"; use the minimum, not the mean, for timing.
- **Interactive pieces:** `microduck-run-doctor.html` (embed: live charts from embedded JSON). `rundoctor-sk-lean4.html` (embed: static-mode dashboard with curriculum boundaries shaded). `rl-toys-defect-register.html` (embed or link: filterable findings). New: "label this curve" quiz using the run doctor's embedded curves.
- **Gaps:** Context: Schulman's 2017 "Nuts and Bolts" talk. The playbook is mostly an engineering log, so only its numbers belong here.
- **Hand-off:** A healthy dashboard says the run is learning, not that the settings are right. Rollout length, minibatch size and learning rate moved the result more than any curve showed. Which knobs matter, and how do we tune them with evidence?

### Day 11: Hyperparameters that matter
- **Picks up:** "which knobs matter".
- **Goal:** Tune rollout length, minibatch size and the LR schedule with evidence, not folklore.
- **Story:** rollout length 24 → 128 took yaw RMSE from 0.3-0.7 to 0.11-0.27 → why: the slowest reward term's horizon and the (γλ)^k window → minibatches: the 2k-8k window → training longer does not smooth the policy: late training is a random walk → adaptive KL keeps pushing the LR up → checkpoints 100-500 iterations apart differ by 6° of wobble → averaging 21 checkpoints halves simulated wobble but lost to model_4500 on the bench (the crack).
- **Sources:** `notes/ppo-takeaways-clean.md` "How long should the rollout be", "Minibatches", "Training longer does not smooth the policy", "Checkpoint averaging"; `artifacts/the-wobble-chase.html` (primary evidence); `artifacts/wlbot-learning-log-aug-28.html` / `aug-30` Session 2 (the minibatch trade, choosing rollout length).
- **Field notes:**
  - Procedure for rollout length: start at the horizon of the slowest reward term, check the (γλ)^k window, then sweep 64/128/256 with 3 seeds.
  - The minibatch window is 2k-8k for a [64,64] net; 24,576 stalled and 128 was unstable.
  - Net displacement over summed step length matches 1/√n in all six runs. Adaptive KL hit the 1e-2 LR ceiling 13% of the time on sk_lean3.
  - A wider net (128x128) did not escape the wobble; its one gain sits inside checkpoint scatter.
  - The mixer action beats per-wheel: the per-wheel policy re-learned the mixer (L/R correlation 0.86) with 56% of differential energy above 5 Hz.
  - Averaging 21 checkpoints (model_3000 to model_4999) works in sim because they share a basin.
- **Interactive pieces:** (γλ)^k widget from Day 8 with a rollout-length slider. Random-walk simulator (net displacement / path length vs 1/√n). Wobble chase dot plot (link to `the-wobble-chase.html` as a standalone deep dive).
- **Gaps:** No clean ablation separates the two explanations for the rollout-length gain (the user flags this). No plots exist in the notes; the wobble chase has the data.
- **Hand-off:** The knobs make PPO optimise faster and more steadily, but it optimises whatever the reward says. On Jumper a motionless robot already scored 52% of the walking reward. Is the reward asking for the behaviour we want?

### Day 12: Reward design: shaping, sigma and the critic
- **Picks up:** "a motionless robot scores 52%".
- **Goal:** Write rewards whose gradients point the right way, block the hacks you have seen, and tell the reward apart from the critic.
- **Story:** reward everything you can think of → every term narrows what the robot may try, so keep it simple → check what doing nothing scores before training → bounded Gaussian terms: "good enough is good enough", but dead tails → penalties must stay below the bonus → reward the outcome, not the strategy, and every outcome number has a cheat → add a term only to block an observed hack (shuffle, hover, skim) → the sign-convention trap → gate rewards on the command instead of a state machine → potential-based shaping asks "did you improve?" → reward schedules need stage spacing → a privileged critic lowers variance without moving the optimum.
- **Sources:** `notes/reward-design-shaping-sigma-and-the-critic.md`; `notes/microduck-takeaways.md` "Reward design" and "Reward decomposition"; `artifacts/roller-model-inquisition.html` (primary post-mortem); `artifacts/jumper-field-guide.html` (standing-score check, outcome cheats, traps); Slide 11 and its Q&A tables (terms and weights, Gaussian vs L1/L2, hack-blocking terms, conditional rewards); `artifacts/wlbot-learning-log-aug-28.html` Session 3 (the reward term by term); `artifacts/microduck-run-doctor.html` (penalty sign audit, window edge); `artifacts/the-sim2sim2real-verdict.html` (kernel temperature); `artifacts/the-wobble-chase.html` (stage spacing); `artifacts/removing-more-made-it-better.html` (estimator vs σ rule); Ng et al. 1999; Andrychowicz et al. 2017 (HER).
- **Field notes:**
  - Gaussian dead tails: with σ = 5 cm, a robot 20 cm off gets about 1e-7.
  - Calibrate a kernel to the behaviour you call good: a good controller sat 7.5σ off and earned 0.04; τ = mse/ln 2 fixed it.
  - "The moment a penalty can reach the bonus, doing nothing becomes a competitive strategy." Slew weight 10 led to quiet-and-fall.
  - Jump height = the lowest of feet and body, 1 cm rise required, pay only for beating the episode's best.
  - Each term's hack is another term's violation: air_time, swing height, clearance. Expect 2-5 rounds of whack-a-mole per robot.
  - Double negation turns a penalty into a reward; the penalty audit catches it.
  - A reward scaled by the command but blind to the error produces a switch, not a throttle (the on/off skater). A signature makes a good check and a poor target.
  - 250-iteration stage spacing let sk_lean4 forfeit the 30% heading factor (0.65 per step); spaced stages held heading to 0.003 rad/s.
  - Before building an estimator, compare the error it removes with the reward σ: the yaw estimator fixed ~5° of drift against a 14° σ.
- **Interactive pieces:** Gaussian σ slider showing reward and slope vs error, with the dead tail shaded, beside L1 and L2. Potential-shaping "hike paid by elevation gain" toy. Standing-score check: pick weights, see what a motionless robot earns.
- **Gaps:** The six-fix comparison table has no runnable examples.
- **Hand-off:** The reward scores the true pitch. The policy never sees the true pitch: it sees an IMU through a filter, four frames of it, with its own last action fed back. You might ask, what about the past? Day 1's Markov trump card assumed the observation was the state.

### Day 13: Observations, actions and partial observability
- **Picks up:** the Markov assumption, re-opened on purpose (PPO story beat 15).
- **Goal:** Design the interface (obs, action feedback, history, filters) so that what the policy needs is still distinguishable.
- **Story:** the state is Markov, the observation is not → POMDP and the belief state → what the history is actually for here: the randomised physics, latency and motor lag, unseen pushes (not velocity: the gyro is already in each frame) → the belief ladder: filter, frame stack, recurrent policy → a one-pole filter is a memory compressor → inverting it amplifies noise → feeding back the last action helps, and can latch → inputs that never vary become amplifiers → clip vs penalty, and train/deploy must match → the critic may see more than the actor → for timed moves, the clock goes in the input.
- **Sources:** `notes/design-insights-observations-actions-and-rewards.md`; `notes/ppo-takeaways-clean.md` "POMDP"; `notes/microduck-takeaways.md` "Observation space", "Action space"; `artifacts/wlbot-learning-log-aug-30.html` Session 3b (MDP vs POMDP, belief ladder); `artifacts/removing-more-made-it-better.html` (primary: filter math and decision rules); `artifacts/yd15-hardware-findings.html` (the latch); `artifacts/station-keeping-policy-runner.html` (observation table, prev_action before scaling); `artifacts/roller-model-inquisition.html`; `artifacts/manager-based-rl-env.html` (actor/critic widths); `artifacts/rl-toys-defect-register.html` (prev_action clipping mismatch); `artifacts/jumper-field-guide.html` (clock input); footnote: `artifacts/the-datum-ledger.html` (pos_err is relative to a latched datum).
- **Field notes:**
  - "We hand-roll the window, the network hand-rolls the belief."
  - 41% of the filter's weight lies beyond a 4-frame window; matching 95% by stacking takes 14 frames (140 inputs vs 40).
  - Filter on at stack depth 1 was the worst arm (0.911): never filter the channel you read current state from at depth 1.
  - Inverting y_t = 0.8y_{t-1} + 0.2x_t amplifies 12-bit encoder dither by √41 ≈ 6.4; nolpf wobble rose 56%.
  - Feed back prev_action before scaling, never the volts. From prev_action = +1 the yd15 net returned +8 V regardless of pitch; the latch test is a static probe from ±1 that must stay below 2 V.
  - Unclipped actions went into prev_action: ±2 in training vs ±1 on the robot, on 8 of 40 inputs.
  - An always-zero input has std 0 and becomes a x100 amplifier; a 3° head command knocked over 98% of robots. Sample a small non-zero range for every command slot.
  - A penalty on the policy output ships inside the ONNX; a clip in the env stays behind in sim.
  - Asymmetric widths: actor 32/40 vs critic 59/68 on the wheeled robot; 61D actor / 72D critic on Microduck. If the reward depends on an input, the critic needs it.
  - Without a clock input a dance drifted to 126 BPM vs 100.
- **Interactive pieces:** one-pole filter memory-weight visualiser with "frames needed to match it". prev_action latch iterator: iterate the feedback and watch it converge to (+8.00, +1.04) V. Observation table excerpt from `manager-based-rl-env.html`.
- **Gaps:** Karpathy's frame-difference trick is cited but not explained.
- **Hand-off:** Four interface pieces, each added for a good reason. Removing stacking alone cost 0.043; removing it together with three others cost 0.007. A single removal measured the interaction, not the piece. How do we run an ablation whose conclusions survive?

### Day 14: Ablation studies and evaluation methodology
- **Picks up:** "a single removal measured the interaction".
- **Goal:** Run ablations whose conclusions survive: combined arms, noise floors, tail metrics, pre-registration.
- **Story:** remove one piece at a time → interactions hide the effect → add combined arms → measure the evaluator's own noise floor → seeds and checkpoint scatter are noise too → the mean hides the tail; the long-delay quartile is the metric that predicted the bench → write the prediction and the kill rule down before the run → wrong turns worth remembering → a short statistics primer.
- **Sources:** `notes/ablation-studies-how-to-run-them.md`; evaluation sections of `notes/the-worries-of-simulation-and-how-to-diagnose-them.md`; `artifacts/removing-more-made-it-better.html` (primary); `artifacts/the-wobble-chase.html` (scatter, confounds); `artifacts/the-sim2sim2real-verdict.html` (pre-registration, kill rules); `artifacts/rundoctor-sk-lean4.html` (`prediction_missed`); sidebar: `artifacts/hd-1910-calibration-layers.html` (held-out fits, run fits twice); Agarwal et al. 2021.
- **Field notes:**
  - The evaluator's repeat spread (0.974/0.976/0.982) means differences under ~0.011 are unresolvable at one seed; a 0.006 gap only separated at 3 seeds. Survival SE at n = 1000 is about 0.008.
  - Checkpoints 100-500 iterations apart differ by 6° of wobble, so a single-checkpoint comparison between runs is unreliable.
  - The long-delay bin predicted the bench three times.
  - Wrong turns: two changes in one commit; comparing runs at different iterations or push strengths; judging by training reward without a gate; a kill alarm keyed on reward that falls by design; a 4-episode probe.
  - Score a frozen model against a known-good controller before training on it; it caught both sim2sim2real faults in minutes.
  - Unseeded parallel CMA-ES lands somewhere different each run; a good score alone says nothing.
- **Interactive pieces:** ablation explorer: toggle stack / filter / estimator / prev_action noise and see survival, wobble and the long-delay bin, with the noise floor drawn as a band (built from the nine-arm table in `removing-more-made-it-better.html`). `the-sim2sim2real-verdict.html` chart (embed).
- **Gaps:** A generic statistics primer (confidence intervals, bootstrap over seeds) must be written fresh.
- **Hand-off:** Every number so far came from one simulator. "Simulator lock-in" is a question of whether the ranking transfers, and only a second engine scoring the same plant can answer it. Which simulators, and how do we stop two copies of the plant drifting apart?

## Stage 4: From simulator to robot (Days 15-19)

### Day 15: Simulators for robot learning (mjlab, Isaac Lab, Newton)
- **Picks up:** "a second engine scoring the same plant".
- **Goal:** Know how a manager-based env runs one step, how a 100 Hz policy and a 500 Hz plant share it, and how to keep one plant across two engines.
- **Story:** install the biggest stack (Isaac Sim, 15+ GB) → it buys nothing: the policy never sees pixels → three roles: PyBullet + firmware PD as the oracle (the PD gate is a trust check on the sim, not a baseline), mjlab as the trainer (1024 envs), Newton/Kamino as the judge → inside mjlab: `make_env_cfg` merges three YAMLs into one `ManagerBasedRlEnvCfg`; six managers and their rates; the exact order inside one `env.step` → the split loop: decimation 5; actuation expands, sensing shrinks; latency on a 2 ms grid → at 1024 envs the GPU is bound by kernel launches, not compute → one plant, two engines: the real split is one robot vs a thousand, so add a batch dimension and use mask style → building the model: STEP to geometry to URDF/MJCF; the closure asymmetry; two engines with different hip laws → build-time vs run-time keys → the crack: agreement between simulators has not predicted the bench; improving the plant has.
- **Sources:** `artifacts/manager-based-rl-env.html` (primary: env anatomy); `artifacts/the-split-loop.html` (primary: loop ownership, also legged_gym, Isaac Lab manager-based vs Direct, Playground/Brax); `artifacts/one-plant-two-engines.html` (primary: shared plant, Isaac Lab/mjlab/Playground/Upkie patterns); `artifacts/launches-and-resets.html` (GPU vectorisation model); `artifacts/wlbot-plant-map.html` (two diagrams and the URDF vs MJCF closure); `artifacts/wlbot-config-spine.html` (deep dive); `artifacts/the-wobble-chase.html` (Newton as judge); Slide 10 and its Isaac Sim analysis; `artifacts/wlbot-learning-log-aug-30.html` Session 1 (PD gate, oracle); probation report 3.2 (Notion `3f367249ddbf80d890eef6f59636b9c5`); optional: `artifacts/step-to-geometry-json.html`, `artifacts/wlbot-plant-pipeline.html` (older revision); `notes/chapter-5-unity-ml-agents.md` as a "history of sim toolkits" sidebar.
- **Field notes:**
  - Work with each framework, not against it: the sense pipeline lives in the actuator hook's `update()` because that is the only 500 Hz entry point.
  - Share only the plant (actuator model, sensor noise, filter, reward, obs assembly) and keep each engine's own loop. "Everyone who deploys has two loops"; the choice is copy vs share.
  - mjlab produces true state, not observations; rewards go to PPO, never into the obs ring. Native mjlab obs delay counts in 10 ms steps, too coarse for balancing.
  - time_out is truncation, not failure. `--clean` ablations must be passed before construction, because delay range, filters, noise and weights are baked in.
  - torch.compile fusion with host syncs replaced by masked `torch.where`: 12 graph breaks to 0, 2.90 → 2.57 s per iteration. CUDA graphs were slower (2.65 s) because tensors move between calls.
  - The step 9a defects (IMU lever-arm velocity added twice, zero pitch in a reset fallback) passed both test suites, both PD gates and crossplay; only the 1000-episode GPU eval caught them (six points of survival).
  - PyBullet's hip is a position source and MuJoCo's a PD with reflected inertia: "different laws, not two tunings of one". Every V0-V4 gate stayed green; only a trained policy (V5) exposed it.
  - Newton runs 14k env-steps/s vs mjlab's 52k: train on mjlab, judge on Newton. Crossplay eval uses a seeded RNG.
  - Over-engineering test: the number of real callers, not the number of layers.
- **Interactive pieces:** `manager-based-rl-env.html` (embed). `the-split-loop.html` timeline (embed). `launches-and-resets.html` (embed). `one-plant-two-engines.html` (standalone page, linked). New: `env.step` stepper that walks events → action → five substeps (actuator compute, MuJoCo, sense tick) → reward → obs → termination → command.
- **Gaps (re-assessed, much smaller):** The env anatomy, decimation, GPU vectorisation, the shared plant and URDF/MJCF are now covered by artifacts, but `notes/mjlab.md` and `notes/isaac-lab.md` are still empty, so the day prose must be written from the artifacts. Isaac Lab appears only as a comparison, with no hands-on. Newton/Kamino is covered only inside the wobble chase. Every artifact is about the wlbot; a short generic walkthrough (the stock velocity task) is needed for readers without that robot. Internal repo paths and branch names in the artifacts need review before going public.
- **Hand-off:** Two engines agree with each other and the bench still wobbles at 7-10 Hz. The plant both engines share is what is wrong. How do we make the simulated robot close enough to the real one, and cover the rest with randomisation?

### Day 16: Domain randomisation and the sim2real gap
- **Picks up:** "the shared plant is what is wrong".
- **Goal:** Measure the plant, decide what to randomise, how wide and with which distribution, and make sure the policy can infer it.
- **Story:** chase perfect physics → impossible; match the real sensor pipeline instead → always measure the plant: the actuator (HD-1910 BAM fit), the centre of mass, the delay → tag every number by where it came from → randomise around what you measured, only real uncertainty, with a distribution that covers → a randomised parameter must be inferable, and inference needs history → systematic bias is not fixed by zero-centred noise → the shortcut: pretrain on an idealised plant (sim2sim2real): it fails unless the support plant keeps the dynamics that define the task → what is still unmodelled.
- **Sources:** `notes/microduck-takeaways.md` "Sim2Real", "Domain randomization"; randomisation sections of `notes/design-insights-observations-actions-and-rewards.md`; Slide 13 and the Q&A observation/actuation sim2real tables and DR ranges; `artifacts/hd-1910-calibration-layers.html` (fills the BAM gap); `artifacts/the-floating-centre-of-mass.html`; `artifacts/the-sim2sim2real-verdict.html`; `artifacts/wlbot-plant-map.html` (provenance table); `artifacts/manager-based-rl-env.html` (baked vs per-episode table); `artifacts/wlbot-config-spine.html` (mass DR); `artifacts/the-split-loop.html` (firmware filter at 500 Hz); `artifacts/removing-more-made-it-better.html` (inferability); `artifacts/the-wobble-chase.html` (probe vs bench); `artifacts/yd15-hardware-findings.html` (unmodelled filter lag); latency sidebar from `artifacts/float-against-int16.html`; probation report 3.3 (rejected arXiv 2502.15649 approach), the grounded-DR week (W6) and ZH report 4.1; footnote: PITCH_TAU and "measured vs configured" from `artifacts/constants-ledger.html`.
- **Field notes:**
  - "Match the real sensor pipeline, not the physics."
  - At this robot's size the actuator model is the biggest source of sim2real error. Back-EMF (kt²/R = 0.143) is about 9x the viscous friction. Parameters that multiply trade off: two fits gave kt 0.47 vs 0.91 at the same score. Single-voltage fits are up to 2x worse at the other voltage.
  - The base CoM was reverse-solved from a gain-schedule constant and sat 25.3 mm above the body box for eleven days (natural frequency 1.71 vs ~2.07 Hz). The fix is an assertion, not more care. Re-baseline a gate by shortening the window, never by widening the bar.
  - Tag every number MEASURED, CAD, FIRMWARE, CONVENTION or PLACEHOLDER. Hip armature 1e-3 was fitted to survival and is a placeholder.
  - Use uniform or log-uniform for coverage, not Gaussian; aim for the real robot to be the most likely sample. Don't randomise gravity or link lengths.
  - The 5-45 ms delay draw cost one-frame arms 0.13-0.18 on the long-delay quartile.
  - Zero-centred IMU DR cannot fix a systematic ~5° mount bias; calibrate it on the robot.
  - The ideal-plant ladder survived 0.019 on the honest plant: "idealised" must keep friction and a real action delay. A clean-plant pretrain plus an honest warm start reached the plateau in ~100 instead of ~700 iterations.
  - Measured bus delay 60-120 ms on Microduck. The τ ≈ 500 ms complementary-filter pitch lag is the top unmodelled gap on the wheeled robot.
  - The CoM fix was real but did not explain the 7-10 Hz bench wobble; the remaining suspect is missing compliance (four-bar slop, tyre sidewall, backlash).
- **Interactive pieces:** DR robot grid around "measured" (Slide 13 visual) with a uniform / log-uniform / Gaussian toggle showing where the real robot falls. Delay-binned survival chart, 1-frame vs 4-frame (data from `removing-more-made-it-better.html`). `the-sim2sim2real-verdict.html` chart (embed). HD-1910 figures (`artifacts/hd-1910-calibration-layers/fig/`).
- **Gaps:** Compliance and backlash are not modelled. Grounded DR (W6) has only the probation report's description.
- **Hand-off:** The delay range was set from the bench, but at deploy time the board sets the delay: inference time, publish latency, quantisation. A policy trained on 5-30 ms flies at 6-9 ms. What does it take to run the policy on the chip without changing the plant it was trained on?

### Day 17: Deploying a policy to hardware
- **Picks up:** "the board sets the delay".
- **Goal:** Export a trained policy, run it on an MCU or edge GPU within its timing budget, and verify it before trusting it.
- **Story:** export to ONNX and a C header → quantise for speed → on the original ESP32, int16 was 3.5x slower and could not hold 100 Hz; on the ESP32-S31 the answer flips → where the 3 ms go → the task layout: the policy can never delay balancing → the verification ladder → the first flash: holds at 40 mm, rails to ±8 V at 70 and 85 mm → rule out the plumbing first → two causes: a stale grant-tick output and the policy's own prev_action latch → the rate is not a knob, and faster is not better.
- **Sources:** `artifacts/station-keeping-policy-runner.html` (primary); `artifacts/float-against-int16.html`; `artifacts/where-the-3-milliseconds-go.html`; `artifacts/yd15-hardware-findings.html`; Slide 14 and the S31 benchmark table; `artifacts/rl-toys-defect-register.html` safety group (SAF-1..13); probation report 3.4 (lean_deploy, C weights file); Notion ".pt .onnx .engine" (`2e967249ddbf8017aa1beee4f4999516`); the deploy loop in `notes/microduck-takeaways.md` (50 Hz on Jetson); embedded-cost part of `notes/design-insights-observations-actions-and-rewards.md`; sidebars: `artifacts/one-plant-two-engines.html` (normaliser baked into ONNX; the C obs assembler is the last second copy), `artifacts/the-split-loop.html` ("two loops"), `artifacts/jumper-field-guide.html` (one policy per skill, clean handovers); background link: `artifacts/wlrobot-lock-map.html`.
- **Field notes:**
  - ESP32: float 435 µs vs int16 1,201 µs arithmetic; the int16 inference window (10,722 µs) overran the 10 ms period. No 16-bit SIMD, per-node interpreter overhead and I-cache thrash. int16 wins only memory, in the wrong currency.
  - ESP32-S31 (Microduck): ESP-DL int16 4.2 ms vs C float in PSRAM 9.9 ms vs flash 48.3 ms, against a 20 ms budget at 50 Hz; 196,864 MACs; ESP-DL MAE 0.0011.
  - 128 tanh calls (255 µs) cost more than all 6,784 MACs (169 µs). The 929 µs gap is attributed to flash I-cache misses, not measured. Use the minimum, not the mean.
  - 14 frames vs 4 roughly doubles the MACs, from about 6800 to 13200.
  - A 500 Hz control tick at priority 20, a 100 Hz policy at 19, a mailbox and a staleness clock. No fallback network: a non-finite action means no publish, STALE fires and PD takes over.
  - Keep normalisation outside the quantised graph. Calibrating on the first 10 s of a 90 s run clipped 4.8% of rows and the net disagreed by up to 7 V; grade across the whole capture.
  - An untransposed square 64x64 layer is self-consistent downstream but 1.27 wrong; ONNX replay against onnxruntime catches it.
  - The C port matched PyTorch to 4.1e-7 before any policy finding was trusted. The 70 mm "healthy shadow" was a trap.
  - The rate is not a knob: the same weights at 200 Hz are out of distribution. Trained on 5-30 ms, measured 6-9 ms, so faster inference moves further off the training distribution.
  - The delay window moved from 5-45 ms to 3-30 ms after the port, so retrain for it.
- **Interactive pieces:** `where-the-3-milliseconds-go.html` nested to-scale zoom (embed). `float-against-int16.html` bar chart (embed, EN/ZH toggle). `station-keeping-policy-runner.html` swimlane (full embed). New: latency budget calculator (layer sizes, tanh count, rate, chip → fits or not). The Day 13 latch iterator, now on the yd15 numbers.
- **Gaps:** The weights-generator script is not in the notes. The tanh approximation and the RAM experiment are untested. The Jetson deploy path for Microduck is thin.
- **Hand-off:** The policy runs, and the first flash showed that its own feedback can latch it. Fixing that meant retraining, re-ablating and re-gating the whole project. What does that loop look like end to end on one robot?

### Day 18: Case study: the micro wheeled-leg robot
- **Picks up:** "the whole loop on one robot".
- **Goal:** Follow a real project from the fears it started with, through the ablations, plant fixes and wobble chase, to the bench.
- **Story:** the three worries (simulator lock-in, firmware coupling, the interface) → the nine-arm ablation answers them → the plant was wrong in ways no gate saw (CoM, IMU height, hip law) → the lean MDP produced lean3 → chasing the wobble: wider nets, stage spacing, mixer vs per-wheel, checkpoint averaging → sim probes did not rank policies the way the bench did → what is still open.
- **Sources:** `notes/the-worries-of-simulation-and-how-to-diagnose-them.md`; probation report 3.5, 3.7, 3.8 and the W4-W9 timeline; `artifacts/removing-more-made-it-better.html`; `artifacts/the-wobble-chase.html`; `artifacts/the-floating-centre-of-mass.html`; `artifacts/wlbot-plant-map.html`; `artifacts/one-plant-two-engines.html` (oracle/trainer/judge, what was built); `artifacts/the-sim2sim2real-verdict.html`; `artifacts/yd15-hardware-findings.html`; `artifacts/rl-toys-defect-register.html` (state before the retrain); `artifacts/rundoctor-sk-lean4.html`; `artifacts/station-keeping-policy-runner.html`.
- **Field notes:**
  - Simulator lock-in is a claim about whether the *ordering* transfers.
  - The real coupling was to the firmware's signal processing.
  - Every arm plateaued near 0.97, so the binding constraint is the DR width and pushes, not the observation.
  - Revised: the CoM was 25.3 mm off and the correction was real, but it did not explain the 7-10 Hz bench wobble (mode moved 1.5 → 3.1 Hz). The old note "a too-high CG was the main cause of wobble" must be corrected on the page.
  - The IMU height was written three times; fixing only the config would have put CPU sim2sim on a 20 mm lever while the GPU trained on 40 mm. Changing a plant number is an era break.
  - Lean MDP (fewer terms, front-loaded curriculum) produced lean3.
  - Averaging 21 checkpoints won in three simulators and lost to model_4500 on the bench. The simulated wobble probe missed in both directions.
  - Open: the critic rework raised explained variance but did not improve the bench.
- **Interactive pieces:** sortable nine-arm results table with "which arm would you ship?" (data from `removing-more-made-it-better.html`). Run lineage timeline sk_lean → sk_lean5_s2 (from `the-wobble-chase.html`). Project timeline page (W1-W9, from the probation report).
- **Gaps:** No hardware videos or bench plots in the notes. The 3.8 critic rework is unresolved. The 7-10 Hz wobble is unexplained. The repo (robot_solution@769171a) is not public.
- **Hand-off:** One robot, one skill: balance and hold heading. A biped that walks, stands, turns its head and later skates needs several behaviours from one policy, and the hard one never gets learned if the easy one pays first. How do we order the lessons?

### Day 19: Case study: Microduck: curriculum, commands and skills beyond walking
- **Picks up:** "how do we order the lessons".
- **Goal:** Design a curriculum and command distribution for a multi-skill policy, read it from the curves, and set up any new skill as the same RL problem with five slots refilled.
- **Story:** throw the full task at the robot from step zero → it never gets reward to learn from → commands as difficulty knobs → train the hard skill first → front-load the curriculum → gate rewards on the command so one policy walks and stands → a staircase schedule shocks the policy; a healthy boundary dips and recovers → commands mean something only if a reward tells them apart → beyond velocity tracking: goal, observation, reward, episode start, episode end, refilled; four recipes; who keeps the clock; several skills on one robot → the 8-step project ladder.
- **Sources:** `notes/microduck-takeaways.md` "Learning curriculum", conditional rewards, "Command staggering and distribution", network design, terminations, checkpoint selection, wandb introspection; `artifacts/jumper-field-guide.html` (primary for "beyond walking"); `artifacts/roller-model-inquisition.html` (command design, coast vs brake, bearing-drag timing); `artifacts/microduck-run-doctor.html` (curriculum-aware expectation); `artifacts/rundoctor-sk-lean4.html` (reading boundaries); Slide 12 and the curriculum timeline table; `artifacts/wlbot-learning-log-aug-28.html` Session 3 (curriculum keyed to gradient updates); `images/microduck-takeaways/01.png` (own staircase plot).
- **Field notes:**
  - Rewards are gated on the command, so there is no state machine.
  - Train the hard skill first: 98% walking early, standing from 2% to 25%. Front-load: every track done by iteration 2000 of 50,000 (about 4%).
  - Key the curriculum on env steps (iteration x 24). Only CoM is curricularised. RampCurriculum warmup 0.5, from the wheeled robot.
  - A metric stepping down exactly at a stage boundary means the stage came too early; a healthy boundary dips and recovers in 100-200 iterations.
  - The staircase doubled the smoothness penalty in one tick (-0.2 → -0.4 at iteration 750).
  - 15% of commands are turn-in-place buckets.
  - Add a difficulty only after the skill it threatens has settled. A template's events come with the template (an inherited ±25 mm CoM shift).
  - Imitation caps at the clip (0.159 m vs 0.162 m). Copy-then-fade: the clip must steer the actions, not only the reward; fade full until 1,000, gone by 3,000.
  - The last checkpoint can get worse (100% → 8% in one repo). "Next to every number you set, write down why and what you measured."
  - Failure signatures: reward up with tracking flat; fell_over rising; mean_std below 0.1.
- **Interactive pieces:** curriculum timeline (Slide 12 visual, drawn from the Q&A table) with a ramp vs staircase toggle. Recipe decision tree, 3 questions to 4 recipes (redraw of the placeholder widget in `jumper-field-guide.html` as clickable SVG). `microduck-run-doctor.html` (linked from Day 10).
- **Gaps:** The raw W&B data is partly covered by the run doctor's embedded JSON; a full export would still help. Jumper repo paths are internal.
- **Hand-off:** Every skill here is the same five slots refilled and trained with PPO in a simulator. You might ask what lies outside that box: other agents, models of the world, offline data, language. That is the electives.

## Electives (optional)

- **E1: Multi-agent RL and self-play.** Source: `notes/chapter-7-ai-vs-ai.md`. Field note: the two-vacuum example of non-stationarity. Images: the video frames (`images/chapter-7-ai-vs-ai/01.png`, `03.png`) and the MA-POCA diagram (`05.png`) are redrawn, not republished. Hand-off: back to Day 19, or E2.
- **E2: The frontier map.** Source: `notes/more-rl-types.md` (model-based, offline, generalisation, RLHF, Decision Transformers, LLMs in RL, Godot RL). The own insight is the Decision Transformer return-to-go pitfall (γ^-T ≈ 2.3e4 at γ 0.99 over 1000 steps), which is the bonus section of `artifacts/removing-more-made-it-better.html` with its gamma slider. A reading list, not a lesson. The ELLM figure (`images/more-rl-types/01.png`) is Du et al. 2023: credit it or redraw it.

---

## Interactive pieces: build list

Existing artifacts that are already interactive (static JS, no backend): `microduck-run-doctor.html` (Day 10), `rundoctor-sk-lean4.html` (10, 19), `rl-toys-defect-register.html` (10), `removing-more-made-it-better.html` gamma slider (6, E2), `the-sim2sim2real-verdict.html` chart (14, 16), `float-against-int16.html` and `removing-more-made-it-better.html` EN/ZH toggles.

New widgets to build (static JS, no backend):

| Widget | Day | Replaces image |
|---|---|---|
| RL loop stepper | 1 | `chapter-1.../01.png` |
| γ to horizon calculator | 1, 6 | n/a |
| GridWorld value iteration, V vs Q toggle | 2 | `chapter-1.../11.png`, `chapter-2.../04.png`, `05.png` |
| Epsilon-greedy Q-table explorer, CliffWalking paths | 3 | `chapter-2.../14.png`, `16.png`, `19.png` |
| Moving vs frozen target | 4 | `chapter-3.../07.png` |
| Gaussian policy sampler with entropy | 6 | n/a |
| Buffer slicer (real vs bootstrapped rewards) | 7 | n/a |
| `compute_returns` stepper, (γλ)^k window | 8, 11 | n/a |
| Clip explorer (rebuild of `de1b44ef`) | 9 | `chapter-8.../07.png` |
| Random-walk simulator | 11 | n/a |
| Gaussian σ slider vs L1/L2, standing-score check | 12 | n/a |
| One-pole filter memory, prev_action latch iterator | 13, 17 | n/a |
| Ablation explorer with noise band | 14 | n/a |
| `env.step` stepper | 15 | n/a |
| DR grid around "measured", delay-binned survival | 16 | n/a |
| Latency budget calculator | 17 | n/a |
| Nine-arm sortable table, run lineage, project timeline | 18 | n/a |
| Curriculum timeline, recipe decision tree | 19 | `images/microduck-takeaways/01.png` (kept too), Jumper placeholder |

## Artifact gallery: placement and preparation

| Artifact | Featured on | Placement | Prep before publishing |
|---|---|---|---|
| `wlbot-learning-log-aug-30.html` | 6-9, 13 (also 1, 10-12, 19) | Standalone "The PPO story, as it happened" page; its beats become the Stage 2 prose | Strip the `<!-- frame-runtime -->` block (~40 KB). Retype Unicode math in KaTeX. Use HSL's lines; do not imitate Claude's phrasing |
| `rl-presentation-plan.html` | 1, 5-9, 12, 15, 16, 17, 19 | Ported into day prose; Q&A tables become reference tables | Rewrite speaker-note framing as prose. Export the 中文 tab too |
| `removing-more-made-it-better.html` | 13, 14, 18 (also 6, 12, 16, E2) | Standalone + iframe of the gamma section | Move `<title>` into `<head>` |
| `the-wobble-chase.html` | 11, 14, 18 (also 12, 15, 16) | Standalone deep dive, linked from several days | None |
| `microduck-run-doctor.html` | 10 (also 6, 12, 19) | Embed | None |
| `rundoctor-sk-lean4.html` | 10 (also 18, 19) | Embed | Dark mode follows `prefers-color-scheme` only |
| `rundoctor-milestone-2-playbook.html` | 10 | Summarised (golden counts, calibration); not embedded | n/a |
| `rl-toys-defect-register.html` | 10 (also 13, 16, 17, 18) | Embed or link | None |
| `jumper-field-guide.html` | 19 (also 10, 12, 13, 17) | Ported + standalone | Redraw the decision-tree placeholder. Export the 中文 tab. Remove the stray `git push` string from the source doc |
| `roller-model-inquisition.html` | 12 (also 6, 13, 16, 19) | Standalone | Re-export if the doc passes rev 46 |
| `manager-based-rl-env.html` | 15 (also 13, 16) | Embed | None |
| `the-split-loop.html` | 15 (also 16, 17) | Embed | Review internal paths; the artifact is private on claude.ai |
| `one-plant-two-engines.html` | 15 (also 17, 18) | Standalone | Tidy the wrapper `<title>` |
| `launches-and-resets.html` | 15 (also 10) | Embed | None |
| `wlbot-plant-map.html` | 15, 16, 18 | Excerpt: two diagrams + provenance table | Trim repo paths |
| `wlbot-config-spine.html` | 15, 16, 10 | Linked deep dive | None |
| `hd-1910-calibration-layers.html` | 16 (also 14, 15) | Standalone at `hd-1910-calibration-layers/index.html` next to `fig/` | Keep the 7 figures together |
| `the-floating-centre-of-mass.html` | 16, 18 (also 15) | Standalone | None |
| `the-sim2sim2real-verdict.html` | 16, 14 (also 12, 18) | Embed | Chart does not recolour on a live theme toggle |
| `station-keeping-policy-runner.html` | 17 (also 13, 16) | Full embed | None |
| `float-against-int16.html` | 17 (also 16) | Embed | Move `<title>` into `<head>` |
| `where-the-3-milliseconds-go.html` | 17 (also 10) | Embed | None |
| `yd15-hardware-findings.html` | 17 (also 13, 16, 18) | Embed | None |
| `step-to-geometry-json.html` | 15 (optional) | Appendix link | Needs CJK fallback fonts |
| `wlbot-plant-pipeline.html` | 15 (optional) | Link, labelled "older revision" | n/a |
| `constants-ledger.html` | 16 | One-line footnote (PITCH_TAU, "measured vs configured") | n/a |
| `the-datum-ledger.html` | 13 | One-line footnote (pos_err is relative to a latched datum) | n/a |
| `wlbot-learning-log-aug-28.html` | n/a | History only; superseded by Aug 30 | n/a |

**Not used:** `the-0x7ff-stall.html`, `two-cores-one-cache.html` (Panthera arm firmware, off-topic; Two Cores' "one change per build, long enough runs" could be a single cross-reference on Day 14), `the-null-hint-crash.html` (retired stub: do not publish), `wlrobot-lock-map.html` (firmware concurrency; at most a background link on Day 17).

## Content provenance

### The user's original work (publish, in the user's voice)

- Notes: `ppo-takeaways-clean.md` (the PPO story; its preface quotes some course text, which keeps its credit), the original PPO takeaways page, `reward-design-shaping-sigma-and-the-critic.md`, `design-insights-observations-actions-and-rewards.md`, `the-worries-of-simulation-and-how-to-diagnose-them.md`, `ablation-studies-how-to-run-them.md`, `microduck-takeaways.md` (facts only: it contains pasted assistant output, see `STYLE.md` section 3), `insights.md` (becomes the Field notes index).
- `deep-rl-hacks-schulman.md` is the user's map of Schulman's talk: credit John Schulman's "Nuts and Bolts of Deep RL" (2017).
- Probation report (EN/ZH) and the W1-W9 timeline: cleared. Mine 3.2-3.8 and section 4 into Days 10 and 15-18 and a "Project timeline" page. The ZH report fixes Chinese terms for the site glossary. The Panthera arm, hardware weeks 1-3 and HR items are skipped as off-topic, not for privacy.
- All 28 RL artifacts listed above: the projects, data, numbers and decisions are the user's. The artifacts were written with Claude, so when their text moves into day pages it is rewritten in the house style. The two learning logs are HSL-Claude dialogues: HSL's lines are the user's voice; Claude's explanations supply facts, not phrasing.
- Own images: `images/chapter-2.../13.png`, `images/microduck-takeaways/01.png`, the HD-1910 figures, and the Unity screenshots of the user's own runs (`chapter-5.../03.png`, `04.png`).

### Adapted from the Hugging Face Deep RL Course (rewrite and credit)

- Text: `chapter-1-introduction.md`, `chapter-2-introduction-to-q-learning.md`, `chapter-3-deep-q-network-dqn.md`, `chapter-4-policy-gradient-with-pytorch.md`, `chapter-6-actor-critic-methods-with-robotics-environments.md`, `chapter-8-ppo.md` are largely course text; `chapter-5-unity-ml-agents.md` and `chapter-7-ai-vs-ai.md` partly; `more-rl-types.md` almost entirely. Days 1-5, 7 and 9 and the electives draw on them.
- Rule: never copy course prose. Rewrite each section from the beat map in the user's voice (the before/after in `STYLE.md` section 6 is the model). Every page that draws on the course carries a credit line: "Parts of this page are adapted from the Hugging Face Deep RL Course (Thomas Simonini, Omar Sanseviero), huggingface.co/learn/deep-rl-course", with the chapter linked. Check the licence of the course repository (huggingface/deep-rl-class) before reusing any figure as-is, and record it in a site-wide `CREDITS.md`.
- Other third-party: PPO, TRPO, GAE, DQN, Ng 1999, HER and Agarwal 2021 are cited as papers. The Unity ML-Agents architecture diagrams come from Unity's documentation. The ELLM figure is Du et al. 2023.

### Images: the options

79 images are downloaded with `index.json` (alt text, source, LaTeX, redraw flag). Five ways to handle them, in order of preference:

1. **Formulas (49) become KaTeX** and the PNG is dropped. This is done in the notes. It has not been rendered, because node is not installed; run KaTeX once in CI before publishing.
2. **Slide-text images** (Hugging Face slides that are mostly words: `chapter-1.../02, 03, 06, 08, 09`, `chapter-2.../17, 18, 20`, `chapter-4.../05`): drop them and put the content in prose or a table.
3. **Diagrams worth keeping are redrawn as inline SVG** in the site's own tokens (light and dark): `chapter-1.../01, 07, 11`; `chapter-2.../05, 14, 16, 19`; `chapter-3.../01, 07`; `chapter-4.../02, 03`; `chapter-5.../01, 02`; `chapter-6.../01, 05`; `chapter-7.../01, 03, 05`; `chapter-8.../07`; `more-rl-types/01`. About 20 redraws, and many become the interactive widgets above.
4. **Any remaining course figure** is either linked out to the course page or shown with a caption credit, and only if the licence check allows it.
5. **New figures for the robot story** are drawn as SVG from data the notes already hold: the 13 visuals the presentation plan names (loop, chess board, policy vs value panels, training vs deployment flow, snippet buffer, +8/+2/+5 branches, four-box cycle, foot hacks, curriculum ramp, DR grid, latency bars) and the staircase curriculum (from the alt text of `microduck-takeaways/01.png`). Real robot photos and videos are the user's own and fill Day 18's "no hardware videos" gap.

Watch the source tags: `index.json` marks some images "own" that are not. `chapter-1.../01.png` and `11.png` match course figures, `chapter-8.../07.png` is the PPO paper/course clipping table, `chapter-5.../01.png` and `02.png` are Unity/course diagrams, `chapter-7.../01, 02, 03, 05` are video frames, and `more-rl-types/01.png` is from Du et al. 2023. Treat all of them as third-party: redraw or credit them.

## Cross-cutting gaps

2. **Stage 1 has almost no own voice.** Days 2-4 are course material with a few field notes; they need the most rewriting and the most new analogies.
3. **The clip explorer** (`de1b44ef`) is unrecoverable and must be rebuilt for Day 9.
4. **History sections and quizzes** (3 per day) are not in any note and must be written fresh, in EN and zh-CN.
5. **Open findings the site should present as open:** the rollout-length explanation (Day 11), the critic rework 3.8 and the 7-10 Hz bench wobble (Day 18), the 929 µs attribution (Day 17), PER/Dueling DQN (Day 4).
6. **Day 15** is now well covered by artifacts, but it still has no generic walkthrough or Isaac Lab hands-on, and the mjlab/Isaac Lab notes are empty.
7. **zh-CN sources:** the Docs exports (Jumper, presentation plan, Roller) are English tabs only; export the 中文 tabs where they exist. Only some HTML artifacts have an EN/ZH toggle.
8. **Public review:** internal repo paths, branch names and private claude.ai links in the artifacts need a pass before the site goes public.
