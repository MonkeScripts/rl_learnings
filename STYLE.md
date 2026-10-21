# House style: how every Day is written

Every Day page on this site is written the way `notes/ppo-takeaways-clean.md` tells "The PPO story". That note opens with its reason for existing:

> I wanted to believe that I am not a dumb person, so instead I blame PPO and RL for lacking a cohesive story that ties parts of the math to its mechanisms.

That sentence is the brief for the whole site. Each equation shows up because the story needs it at that point, and the reader should be able to say which problem it solved.

---

## 1. The narrative device

### The engine: problem, naive fix, failure, math

Every beat of the PPO story runs the same loop:

1. **A concrete situation** with numbers from a real setup: 1024 robots, 128 steps, γ = 0.999.
2. **The obvious thing to do.** Train on the whole episode. Train on raw G. Maximise ratio × advantage.
3. **Why the obvious thing breaks**, in words and in that same situation. "Two runs from the same state give two different G's."
4. **The smallest piece of math that fixes the break.** It gets a name only after the reader has felt the need for it.
5. **A plain reading of the math**, usually a 💡 callout or a one-line TLDR.
6. **The leftover crack.** The fix has a weakness, and that weakness becomes the next beat's problem.

Step 6 is what makes the transitions feel seamless. No section closes cleanly. Each one ends holding the thread the next one pulls.

### Beat map of the PPO story

| # | Section | Situation / naive view | What breaks | Concept introduced | Crack handed forward |
|---|---|---|---|---|---|
| 0 | Preface: Actor critic (food for thought) | The agent learns from reward alone | Nothing yet. A seed is planted: "why not also have a judge or a teacher" | Actor-critic as a football coach | Paid off in beat 5 |
| 1 | Why on-policy, and where the noise comes from | The policy has to explore and exploit | One deterministic action explores nothing | Gaussian policy: mean plus learned std. "The noise is the exploration." Shrinking std is exploitation; at deploy, take the mean | Actions have consequences, so how do we score them? |
| 2 | Consequences, rewards and the horizon | Actions affect the future, as in control ODEs | How far ahead do we look? | Return G, discount γ chosen from physics (0.999 ≈ 1000 steps ≈ 10 s, longer than the slowest thing we care about) | A 1000-step horizon is too long to learn from in one piece |
| 3 | Why we chop episodes into rollouts | Train on whole episodes | Huge variance, delayed feedback, no credit assignment | Rollout buffer: 128-step snippets from many envs, shuffled | The buffer cuts G off |
| 4 | The two problems with G | Sum the real rewards in the buffer | (a) no future past step 127; (b) G is one noisy sample | Names both problems explicitly | Something has to fill in the future and remove the noise |
| 5 | Enter the critic, and the advantage | "Both of these require an additional agent" (beat 0 pays off) | n/a. This beat is the fix | V(s) bootstraps the tail via V(s₁₂₈); A = G − V(s) asks "better than usual?"; V/Q/A defined, then read in one line | The critic is a network, so it is wrong too |
| 6 | Temporal difference: the critic is an estimate too | Trust V | V is only an estimate | TD error δₜ, and TD target as "a better estimate" (biased, low variance) | How much should we trust a critic we know is wrong? |
| 7 | Generalized Advantage Estimation | Pick either 1-step TD or full Monte Carlo | One has bias, the other variance | GAE recursion; λ as "a vote of confidence". Ulam's solitaire as the Monte Carlo origin story | The critic itself still needs training |
| 8 | Training the critic | n/a | n/a | The rsl_rl backward loop: collect forward, arithmetic backward, then regress | "We got sidetracked": time to regroup |
| 9 | Recap, and what the buffer actually holds | n/a | n/a | Recap of beats 4 to 8. Buffer rebuilt every iteration = on-policy in practice. Per-row contents. "There is only one policy" | With one policy edited in place, how do we update from stale data? |
| 10 | The ratio | Nudge each stored action by its advantage | After the first gradient step, the weights no longer match the data | Stored log-prob as the "old opinion"; r = π_θ / π_θold; L^CPI | Nothing stops us maximising it |
| 11 | Proximal: why we clip | Maximise r·A | One noisy batch drags all probability onto one action | Clipped surrogate; "Proximal is that rule made into maths" | The clip removes the reward for drifting, not the drift itself |
| 12 | Nothing forbids a big drift (inside 11) | Trust the clip | Drift can still happen | Log KL and clip fraction as checks | The policy loss is only one of three terms |
| 13 | The full loss and its parts | n/a | n/a | Value loss, entropy bonus (set to 0, and why), grad-norm clip, KL early stop | n/a |
| 14 | Good to know: TRPO | The rigorous way: a hard KL constraint | Second-order, awkward, hundreds of lines | KL divergence; TRPO vs PPO table | n/a (the road not taken) |
| 15 | Good to know: POMDP | Beat 2's "the past does not matter" | "Here is the crack in it": the policy sees sensors, not the state | POMDP, belief state, frame stacking. "We hand-roll the window, the network hand-rolls the belief" | Domain randomisation and sim-to-real |

Beat 15 shows the device at its best. The Markov assumption is laid down early as "one cool trump card", carried quietly for ten sections, then cracked open on purpose. The fix (call the stack the state) leaves everything built since beat 2 still standing.

---

## 2. Transition mechanics

### The patterns

| Pattern | What it does | Where in the PPO story |
|---|---|---|
| **The turn** ("Now here is the problem.", "But after the very first step...") | States the failure of what was just built, in one short sentence | Ratio → clip |
| **The question hand-off** ("With only one running policy, how do we update?") | The previous section's conclusion becomes the next section's question | Recap → ratio |
| **Circling back to the anchor** ("But circling back to our original equation:") | Re-shows a formula the reader already knows, so the new problem attaches to something familiar | Rollouts → two problems with G |
| **The planted seed** ("similar to the actor-critic setup we discussed earlier") | An idea floated early as "food for thought" turns out to be the fix later | Preface → critic |
| **The honest concession** ("Unfortunately it is difficult to find a good critic right away.") | Admits the fix is imperfect, which motivates the next refinement | Critic → TD → GAE |
| **The regroup** ("We got sidetracked a bit here.") | A recap after a run of technical beats, ending on the open question | After training the critic |
| **Naming after the fact** ("That is the ratio.", "Proximal is that rule made into maths.") | Mechanism first, name last | Ratio, clip |
| **Re-opening an assumption** ("You might ask, what about the past?") | Goes back to something the story leaned on and breaks it | MDP → POMDP |

### Exemplars (verbatim from `notes/ppo-takeaways-clean.md`)

**1. Circling back to the anchor, then making the problem concrete with a number.**

> But circling back to our original equation:
>
> [the G equation]
>
> Let us say the rollout is 128 steps. **128 steps is the only number of steps we ever collect (for one env).** For the step at position 50, **the 78 real rewards after it (positions 51–127) are summed directly.** But what about the rest? Ideally we train forever and wish for an episode to never end, so what about steps 129 to infinity?

**2. The planted seed pays off, and one fix covers two problems.**

> Both of these require an additional agent to judge the value of a state, similar to the actor-critic setup we discussed earlier.
>
> The critic fixes both at once.

**3. The honest concession that sets up the next concept.**

> Unfortunately it is difficult to find a good critic right away. It is introduced as a network as well, so it needs training too. As such, we cannot guarantee that $V^{\pi}(s)$ would always give us the perfect state value.

**4. The question hand-off, then the failure that creates the need.**

> With only one running policy, how do we update?
>
> [...]
>
> But **after the very first step** the weights are no longer the ones that collected the data. The **buffer still holds the old opinion for every action though, so we can ask the live weights how likely that same action is to them now and divide by what was written down. That is the ratio.**

**5. The turn, the runaway, and naming after the fact.**

> Now here is the problem. **If we just multiply the advantage by the ratio and maximise, nothing stops us.** [...]
>
> **Proximal is that rule made into maths.**

**6. Re-opening an assumption the story has relied on.**

> You might ask, what about the past? Up to now the story has leaned on one comfortable fact: RL is a Markov decision process, so the past does not matter. [...]
>
> Here is the crack in it.

### Rules for every section boundary

- The **last paragraph** of a section names what is still wrong or missing.
- The **first sentence** of the next section picks that up, by name or with a question.
- If a section has no crack to hand forward, it is a reference block. Move it to "Good to know" or the end of the Day, as the PPO note does with value loss, entropy and grad clipping.
- After 4 or more technical beats, add a regroup paragraph: what we had, which problems we solved, what is still open.

---

## 3. The user's voice

**Person and stance.** First person, "I" and "we". The writer is a practitioner who got stuck and worked it out, not a lecturer. Self-deprecating openers are fine: "As a fellow neanderthal", "I hate math, but it is this form:".

**Humour.** Dry, short, often at the field's expense:
- "These RL people really love such techniques."
- "Standard for gae_lambda is 0.95. Don't ask, I don't know how."
- "I think nobody uses this TRPO nonsense, but I could be wrong."
- "Basically TLDR: whack more to find out more."

Use at most one or two per section, and keep each to a single line. A joke never replaces the explanation.

**Skepticism.** Every estimate is treated as suspect until measured. "The critic cannot be fully trusted." "Not guaranteed to work." "Training curves lie a little and only the gates count." Contested choices say so: value clipping is "an option to test, not a requirement". Claims the writer has not tested are flagged: "That is the mechanism I would bet on, but the repo only has the empirical result."

**Numbers from the robot.** Abstract quantities get pinned to real ones: 0.37 of the action range, 128 of 1000 steps, 0.949ᵏ falls to 0.001 by k = 128, σ ≈ 0.242. A claim with a number from the wheeled-leg robot or the Microduck beats a general one.

**Sentence length.** Mostly medium, plain sentences. Long sentences carry mechanism. Short ones land a point: "The noise is the exploration." "It is not perfect." "One reading cannot tell you that. A short run of readings can."

**Math.**
- Intuition always comes before symbols. The section explains in words what the quantity must do, then shows the formula, then reads it back in a 💡 callout. Example: "V is how good a situation is. Q is how good a situation is if you commit to one action first. A is the difference the action made."
- Equations are in KaTeX, never images.
- Code follows the formula when the reader will implement it (the rsl_rl loop, `logratio.exp()`), with a numbered walk-through of what each phase touches.
- Show a derivation only when the story needs it. Otherwise give the intuition and a TLDR.

**Analogies.** Short, everyday, then dropped. Football coach for the critic, Ulam's solitaire for Monte Carlo, the epsilon-greedy GPS in a new city, the wild goose chase for moving targets, "the buffer remembers the old opinion". An analogy explains one mechanism and is not stretched across a whole Day. Anthropomorphic verbs are welcome where they help: the policy "pushes", a sample "retires itself", the buffer "remembers".

**Spelling and punctuation.** British spelling (behaviour, favourable, randomisation, maximise, normalised). Use colons and commas for asides. Avoid em dashes; the ones in the PPO preface come from quoted course text.

**Two registers.** The story register above is for Step by step. The Insights pages (`design-insights-...`, `the-worries-of-simulation-...`, `reward-design-...`) use a terse decision-rule register: "Put it in when / Leave it out when / What goes wrong / Test", with verdicts (✅ ❌ ⚖️) and evidence numbers. Field notes callouts keep that register.

**Not the user's voice.** Some notes, especially `microduck-takeaways.md`, contain pasted assistant output: "Your intuition is exactly right", "★ Insight" blocks, "Here's how it works:". Use the facts, but do not imitate that phrasing.

---

## 4. Day page template

The curriculum's sections stay, in the same order. Headers are kept for navigation, but each section opens by picking up the last one. The table below gives each section's job and the move it opens with.

| Section | Job in the story | Opening move | Closing move |
|---|---|---|---|
| **Title + Goal** | The promise | One line: what you can do by the end | n/a |
| **Where we left off** (context / history) | The hook | Callback to the crack the previous Day handed forward, then who hit this wall first (paper, year, what they were trying to do) | "Their first attempt was the obvious one." |
| **The picture** (analogy) | The naive model | The everyday analogy, told as the obvious first idea | Where the analogy breaks, which is the first problem |
| **Step by step** | The engine | Beats run the problem → naive fix → failure → math → plain reading → crack loop, 3 to 7 per Day | A regroup paragraph if there are 4 or more beats |
| ↳ **Field notes** callout | The story meets the robot | Placed inside Step by step, right after the beat it bears on, not gathered at the end | Hands back to the story in one sentence |
| **Pitfalls** | How the story goes wrong in practice | Each pitfall ties back to a beat ("Beat 3's fix fails if...") | n/a |
| **Quiz** | Did the thread hold? | 8 questions, answers collapsed | n/a |
| **Next** | The hand-off | One short paragraph that re-opens an assumption or names the crack, in the "You might ask..." form | Link to the next Day |
| **Sources** | n/a | Original notes (with Notion links), papers, courses | n/a |

### Skeleton

```markdown
# Day N: <Title>

**Goal:** <one line>

## Where we left off
<Pick up Day N-1's crack in 1 to 2 sentences.> <Who hit this wall first: paper, year,
the problem they had.> <Their obvious first attempt.>

## The picture
<The everyday analogy as the naive model.> <Where it breaks, which is our first problem.>

## Step by step

### <Beat 1 title, phrased as the problem or the fix>
<Concrete situation with a real number.> <Obvious fix.> <Why it fails, in that situation.>
<The math, introduced only now.>

$$ ... $$

> 💡 <One-line plain reading of each symbol or term.>

<The crack this leaves.>

> 🔧 **Field notes (from my robots)**
> <Decision-rule register: when, when not, what goes wrong, the evidence number.>
> <One sentence back to the story.>

### <Beat 2 title>
<First sentence picks up the crack.> ...

<Regroup paragraph if there are 4 or more beats: what we had, what we fixed, what is still open.>

## Pitfalls
- <Pitfall tied to a beat, with the symptom you would actually see in a curve.>
- ... (3 to 5)

## Quiz
<details><summary>1. Why: <why does the story need X?></summary> ... </details>
<details><summary>2. What if: <remove piece Y, what breaks?></summary> ... </details>
<details><summary>3. Numbers: <a calculation from the robot's settings></summary> ... </details>
... (8 in all; see the quiz rules)

## Next
You might ask, <the assumption this Day leaned on>? <The crack, in 2 to 3 sentences.>
That is Day N+1.

## Sources
- `notes/<file>.md` ([Notion](...))
- <Paper, year>
```

### Quiz rules

- 8 questions per day, mixing the three kinds (at least 2 of each):
  - **Why** checks the motivation: which failure made this piece necessary.
  - **What if** removes one piece and asks what breaks. It tests the thread backwards.
  - **Numbers** is a small calculation, e.g. "γλ = 0.949: how much weight does step 24 get?"
- **Answerable cold.** Someone coming back weeks later, without rereading the day, must be able to answer from the stem alone plus the concept. So:
  - The stem states every fact it needs: give the numbers, the setup and the definitions in one or two sentences. No "on FrozenLake you…", "in the story…", "the wheeled-leg robot's reward…" or "beat 3" unless the stem then says what matters about it.
  - Test the idea, not recall of the page: no question whose answer is a number or name you could only know from having read this day.
  - A robot example is fine when it is a self-contained scenario ("a policy outputs volts on ±8 V with σ = 0.2…").
- Choices are about the same length; the right one must not be the longest or most hedged. Spread the answer index across 0 to 3.
- Each explanation runs 2 to 4 sentences in the story voice, and ends with which beat it came from, so the reader knows where to look.

---

## 5. Do and don't

**Do**
- Open every section by picking up the crack the previous one left.
- Let the obvious approach fail on the page before giving the fix.
- Give a concept its name only after the reader has seen why it is needed.
- Follow every equation with a one-line plain reading.
- Pin abstractions to the user's real numbers and robots.
- Say what is contested, untested or a guess.
- Keep analogies short and local to one mechanism.
- Put Field notes beside the beat they bear on.
- Add a regroup paragraph after a long technical run.
- End the Day on a question the next Day answers.

**Don't**
- Open a section with a definition ("X is defined as...").
- Stack disconnected sections that could be read in any order.
- Use equations as images. Retype them in KaTeX.
- Put symbols before intuition, or derivations the story does not need.
- Write enthusiasm or filler ("powerful", "elegant", "let's dive in", "in this section we will").
- Imitate the pasted assistant phrasing in the notes ("Great question", "★ Insight", "Your intuition is exactly right").
- Close a section with a summary of what it just said. Close it with what is still wrong.
- Overuse the jokes. One dry line per section at most, and never in place of the explanation.
- Hedge everything. Be skeptical with reasons, and confident where the evidence is.

---

## 6. Rewrite example

### Before (`notes/chapter-3-deep-q-network-dqn.md`, "Fixed Q-Target to stabilize the training")

> When we want to calculate the TD error (aka the loss), we calculate the **difference between the TD target (Q-Target) and the current Q-value (estimation of Q)**.
>
> We **don't have any idea of the real TD target**. We need to estimate it. Using the Bellman equation, **we saw that the TD target is just the reward of taking that action at that state plus the discounted highest Q value for the next state.**
>
> However, the problem is that we are using the same parameters (weights) for estimating the TD target **and** the Q-value. Consequently, there is a significant correlation between the TD target and the parameters we are changing.
>
> The fix: Use a **separate network with fixed parameters** for estimating the TD Target. **Copy the parameters from our Deep Q-Network every C steps** to update the target network.

### After

> So the network now predicts Q, and we train it the way tabular Q-learning always did: compare the prediction with the TD target, which is the reward plus the discounted best Q of the next state, and step the weights to close the gap.
>
> Now here is the problem. We never had the real target, so we built it out of the network's own guess about the next state, and that guess comes from the same weights we are about to change. Every gradient step that pulls Q(s, a) towards the target also moves the target. It is a wild goose chase: the thing we are aiming at runs away about as fast as we approach it.
>
> The obvious fix is to stop the target moving. Keep a second copy of the network, freeze it, and build every target from the frozen copy.
>
> $$ y = r + \gamma \max_{a'} Q(s', a'; \theta^-) \qquad L(\theta) = \big(y - Q(s, a; \theta)\big)^2 $$
>
> > 💡 θ is the network we train. θ⁻ is a photograph of it taken C steps ago. The target only moves when we take a new photograph.
>
> Frozen forever would be wrong too, because the photograph would describe a network we stopped being long ago. So every C steps we copy θ into θ⁻ and carry on. TLDR: aim at a photograph, retake it every so often.
>
> That leaves one crack. The frozen copy still picks the next action with a max, and a max over noisy guesses is optimistic: whichever action happens to be overestimated wins. That is where Double DQN comes in.

**What changed:** the paragraph opens by picking up the previous one ("So the network now predicts Q"), the failure is shown before the fix, the math comes after the need, the symbols get a plain reading, the user's own "wild goose chase" and TLDR habit stay, and it ends by handing a crack to the next section.

---

## 7. Bilingual note: zh-CN

The Chinese page is **rewritten from the same beat map, not translated sentence by sentence**. The beats, numbers, equations and quiz stay identical. The prose is written fresh.

- **Keep the person and stance.** Use 我 / 我们. Keep the self-deprecation, adapted rather than translated: "I hate math, but it is this form:" → "我不喜欢数学，但公式长这样：". "As a fellow neanderthal" → "作为一个同样摸不着头脑的原始人".
- **Rebuild idioms.** Do not translate them word for word. "Wild goose chase" → "追着自己的尾巴跑" or "原地打转". "Whack more to find out more" → "多试几次，自然就知道了". "Don't ask, I don't know how." → "别问，我也不知道为什么。"
- **Transition phrases in Chinese.**
  - The turn: "问题来了。" / "但是，" / "可是第一步之后，"
  - The question hand-off: "那么，只有一个策略，我们怎么更新？"
  - Circling back: "回到最开始那个公式："
  - The concession: "可惜，" / "遗憾的是，"
  - The regroup: "扯远了，我们先回顾一下。"
  - Naming after the fact: "这就是比率（ratio）。" / "所谓 Proximal，就是把这条规则写成数学。"
  - Re-opening: "你可能会问：那过去呢？"
  - The TLDR line: "一句话总结：" / "说白了，"
- **Terminology.** On first use, give the Chinese term with the English in brackets, then use one form consistently: 优势函数（advantage）, 评论家网络（critic）, 时序差分（TD）, 广义优势估计（GAE）, 裁剪（clip）, 回合（episode）, 轨迹片段（rollout）. Keep code names (`gae_lambda`, `vf_coef`) and symbols in English. Keep one glossary for the whole site, aligned with the user's Chinese report wherever it already fixes a term.
- **Avoid translationese.** Split long English sentences into two or three Chinese clauses. Avoid stacked 的 chains and the passive 被 unless it is natural. Put the conclusion first where Chinese reads better that way.
- **Short sentences stay short.** "The noise is the exploration." → "噪声就是探索。" A punchline loses its force if it is padded.
- **Punctuation.** Full-width punctuation in Chinese prose, half-width inside formulas and code. Put a space between Chinese and Latin or numbers only where the site's typesetting needs it, and do it the same way everywhere.
- **Check.** A zh reader should be able to fill in the beat map's "crack handed forward" column from the Chinese text alone. If they cannot, the rewrite has lost the thread.
