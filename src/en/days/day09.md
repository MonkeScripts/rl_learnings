---
day: 9
minutes: 60
widgets: [ppo-clip, ppo-cycle]
quiz:
  - kind: why
    q: "PPO stores each sampled action's log-probability while collecting a batch, then takes many gradient steps on that batch (say 32 minibatches × 10 epochs). Why does the update need the stored number?"
    choices:
      - "It is the entropy bonus, so it has to be stored for every step."
      - "The critic regresses onto it to learn the value of each state."
      - "After the first step the live weights are not the ones that sampled; the ratio divides by it."
      - "Actions were sampled with noise, and the log-prob subtracts that noise back out."
    answer: 2
    explain: "Plain policy gradient gets one gradient step out of a batch and throws it away. PPO takes 320, so from the second step on it is learning from data another version of itself collected. Dividing the live probability by the stored one says how far each action has moved since, and that importance weight is what makes the reuse legal. (Beat 1: the buffer remembers the old opinion.)"
  - kind: why
    q: "Maximising $r_t A_t$ for many epochs on one batch can move the policy too far. Why does PPO clip the ratio inside the objective rather than just lowering the learning rate?"
    choices:
      - "One learning rate applies to every row, yet some rows have barely moved while others went too far."
      - "A smaller learning rate makes the ratio undefined once the first epoch is over."
      - "Lowering the shared learning rate also slows the critic, which then stops learning."
      - "Clipping is cheaper to compute than changing the learning rate at every step."
    answer: 0
    explain: "Too small a learning rate and training crawls; too large and it is unstable; one epoch and the batch is wasted again. The trouble is per row, so the fix is per row: once a sample has moved far enough the way its advantage wants, the objective goes flat and stops paying for more. Proximal is that rule made into maths. (Beat 2: nothing stops us.)"
  - kind: why
    q: "PPO's clip makes a row's gradient zero once its ratio leaves $[1-\\epsilon, 1+\\epsilon]$ in the direction its advantage wants. Why do people still log the approximate KL between the old and new policy?"
    choices:
      - "The clip only works for discrete actions, so continuous policies need KL instead."
      - "KL is the loss term that trains the critic, so it has to be logged anyway."
      - "The clip is applied only in the first epoch, and KL covers the later ones."
      - "The clip removes the reward for drifting, not the drift: big steps still carry ratios far out."
    answer: 3
    explain: "A row's gradient goes to zero only after its ratio has crossed the line; nothing undoes the step that took it there. A hot learning rate jumps past $\\epsilon$ in one step, and all rows share one network, so a push on one state also moves rows that are already clipped. On a toy policy with $\\epsilon = 0.1$ and a hot learning rate, ratios still reached 2.5. KL and the clip fraction are how you see it. (Beat 4: nothing forbids a big drift.)"
  - kind: whatif
    q: "To tidy the code you replace the PPO objective with only its clipped term, $\\text{clip}(r, 1-\\epsilon, 1+\\epsilon)\\,A$, and drop the $\\min$. What breaks?"
    choices:
      - "Nothing. The $\\min$ was only there for numerical stability."
      - "A bad action that became more likely ($A < 0$, $r > 1+\\epsilon$) gets zero gradient, so nothing pulls it back."
      - "The policy can now run away without limit, exactly like $L^{CPI}$."
      - "The ratio can no longer be computed, because the stored log-prob is clipped too."
    answer: 1
    explain: "The clipped term alone is flat outside the band in both directions, whatever the sign of $A$. That is right for the side the advantage wants and wrong for the other: a bad action that drifted up, or a good one that drifted down, gets no gradient to undo the mistake. The $\\min$ is what picks the unclipped $r \\cdot A$ in exactly those two cases. (Beat 3: the min, and the one-way ratchet.)"
  - kind: whatif
    q: "A PPO implementation recomputes the \"old\" log-probabilities with the current weights at the start of every minibatch, instead of storing them at collection time. What do the logs show, and what does PPO become?"
    choices:
      - "The clip fraction jumps to 1 and training stalls, because every row is out of the band."
      - "The approx KL explodes, because old and new policies are compared at different states."
      - "Nothing visible changes; storing them was only a memory optimisation."
      - "Every ratio is 1, clip fraction sits at 0, and it is plain policy gradient run 10 times."
    answer: 3
    explain: "If the old and new log-probs come from the same weights, $r = 1$ on every row, so the clip never fires and the $\\min$ never matters. Nothing crashes; the only sign is `clip_frac` and `approx_kl` stuck at exactly 0. What is left is an unguarded policy gradient run over the same batch many times. (Beat 1: the buffer remembers the old opinion.)"
  - kind: whatif
    q: "You train a Gaussian policy with $L^{CPI} = \\mathbb{E}[r_t A_t]$, no clip, for 10 epochs on each noisy batch. What would you expect to happen to the policy?"
    choices:
      - "It learns the same as PPO would, only a little more slowly."
      - "$\\sigma$ grows without limit, because wider policies make any $r$ larger."
      - "The mean jumps onto what one batch favoured and $\\sigma$ collapses, so exploration dies."
      - "The ratios stay near 1, because the advantages average out to zero."
    answer: 2
    explain: "For a row with a positive advantage, the fastest way to grow $r$ is to move $\\mu$ onto that action and shrink $\\sigma$, because a narrow Gaussian has a huge density at its centre. Nothing in $L^{CPI}$ says when to stop. On a one-dimensional toy starting at $\\sigma \\approx 0.37$, ten epochs on one batch drove $\\sigma$ to 0.098 and the KL from 0 to 18. (Beat 2: nothing stops us.)"
  - kind: numbers
    q: "PPO with $\\epsilon = 0.1$. A row's stored log-prob is $-1.20$; the live weights now give $-1.05$ for the same action, and its advantage is $+0.8$. What is $r$, and what does this row contribute to the gradient?"
    choices:
      - "$r \\approx 1.16 > 1.1$ with $A > 0$: clipped at $0.88$, so the gradient is zero."
      - "$r \\approx 1.16$: the clip only acts when $A < 0$, so the row is still pushed up."
      - "$r = 0.15$, the log-prob difference, below $0.9$, so the row is pulled back up."
      - "$r = e^{-0.15} \\approx 0.86$: less likely now, so the $\\min$ keeps $r \\cdot A$."
    answer: 0
    explain: "$r = \\exp(\\log\\pi_\\theta - \\log\\pi_{\\theta_{old}}) = \\exp(-1.05 + 1.20) = e^{0.15} \\approx 1.16$. With $A > 0$ and $r > 1 + \\epsilon = 1.1$ the clipped branch $1.1 \\times 0.8 = 0.88$ is smaller than $1.16 \\times 0.8 \\approx 0.93$, so the $\\min$ picks it and the row retires itself. With $\\epsilon = 0.2$ the same row would still be inside the band and still pushing. (Beats 2 and 3: the clip and its cases.)"
  - kind: numbers
    q: "PPO with $\\epsilon = 0.2$. A row has advantage $A = -1$, and its ratio has drifted up to $r = 1.3$. Which branch does $\\min\\big(rA,\\ \\text{clip}(r, 0.8, 1.2)\\,A\\big)$ pick, and what does the gradient do?"
    choices:
      - "The clipped branch, $-1.2$: the row is flat and contributes no gradient."
      - "The unclipped branch, $-1.3$: the gradient pushes $r$ back down."
      - "The clipped branch, $-1.2$: the gradient pushes $r$ further up."
      - "Neither: rows with a negative advantage are skipped by the clip."
    answer: 1
    explain: "$rA = -1.3$ and $1.2 \\times (-1) = -1.2$; the $\\min$ takes $-1.3$, the unclipped one. That is a mistake in progress, a bad action that became more likely, and the unclipped branch keeps its gradient so the policy is pulled back. The clip only goes flat on the side the advantage wanted. (Beat 3: the min, and the one-way ratchet.)"
---

**Goal:** derive the clipped surrogate objective from the failure it fixes, read the whole PPO update line by line, and know what KL is still watching for.

## Where we left off

With only one running policy, how do we update? Day 8 ended on exactly that: after the first gradient step the weights no longer match the data that is in the buffer. We have 131,072 rows from 1024 robots, every one stamped with an advantage, and a policy that changes the moment we touch it.

People hit this wall as soon as they tried to make policy gradients efficient. In 2002 Sham Kakade and John Langford showed that a greedy policy update can make a policy worse, and proposed *conservative policy iteration*: mix the new policy in a little at a time. The surrogate objective in this Day is still named after it. In 2015 John Schulman and colleagues turned the idea into TRPO, which put a hard limit on how far one update may move the policy and trained neural networks to swim, hop and walk in simulation. Two years later, at OpenAI, Schulman's group replaced that machinery with four lines of clipping and called it Proximal Policy Optimization. Their paper used $\epsilon = 0.2$; the wheeled-leg robot uses 0.1.

All three start from the same move, which is also the obvious one: keep using the old data, and correct for the fact that it is old.

## The picture

Think of filming one training session and then fixing your technique from the tape. The obvious plan is to watch it, fix everything it shows, watch it again, fix some more, and do that ten times before the next session.

It breaks twice. After the first round of fixes you are no longer the player on the tape, so the tape slowly describes someone else. And if you overhaul your whole technique overnight, you usually get worse; small adjustments, practised, are what get you better. The buffer is our tape. The first problem is how to keep learning from a recording of a player we have already stopped being.

## Step by step

### The buffer remembers the old opinion

Start with the version from Day 5. For each stored action, nudge the network so that the action becomes more likely in that state if its advantage was positive, and less likely if it was negative:

$$
L^{PG}(\theta) = \mathbb{E}_t\left[\log \pi_\theta(a_t \mid s_t)\, A_t\right]
$$

Take one gradient step, throw the batch away, collect a new one. That is honest, and very wasteful: 1.28 s of 1024 robots for about a millisecond of optimisation. So the obvious move is to reuse the batch. Split it into 32 minibatches of 4096, take one step per minibatch, and go over the whole buffer 10 times. That is 320 gradient steps out of one batch of data.

But after the very first step the weights are no longer the ones that collected the data. The buffer still holds the old opinion for every action though: the log-probability the policy gave the sampled action at the time. So we can ask the live weights how likely that same action is to them now, and divide by what was written down. That is the ratio.

$$
r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{old}}(a_t \mid s_t)}, \qquad L^{CPI}(\theta) = \mathbb{E}_t\left[r_t(\theta)\, A_t\right]
$$

::: tip
Same network at two moments in time. $r > 1$: the action has become more likely since we collected it. $r < 1$: less likely. $r = 1$: nothing has moved, which is exactly what happens on the first minibatch of epoch 1, where $L^{CPI}$ and $L^{PG}$ have the same gradient. Weighting old samples by this ratio is importance sampling: it is what makes the reuse legal.
:::

For the robot's Gaussian policy this is concrete. The stored action was sampled from $\mathcal{N}(\mu_{old}, \sigma_{old})$. After some gradient steps the network gives $\mathcal{N}(\mu_{new}, \sigma_{new})$ for the same 36 observations, and $r$ is the ratio of the two densities at the stored action. In code it is a subtraction and an exponential:

```python
# log-probs are stored during rollout, recomputed during update
logratio = newlogprob - b_logprobs[mb_inds]
ratio    = logratio.exp()
```

::: field
**Store the log-prob of the sampled action, at collection time.** The action in the buffer is the noisy sample, not the mean, and its log-prob comes from the weights that drove the robot. Recompute either after the update starts and every ratio is 1: the clip below never fires, and nothing in the logs looks wrong except a clip fraction stuck at 0.
:::

So the ratio lets us squeeze 320 steps out of one buffer. Now look at what we are asking the optimiser to do with it: make $r \cdot A$ as large as possible. Nothing says how large is too large.

### Nothing stops us

Now here is the problem. If we just multiply the advantage by the ratio and maximise, nothing stops us. For a row with a positive advantage, $L^{CPI}$ says: make $r$ as big as you can. For a Gaussian the fastest way to do that is to shove $\mu$ onto that action and collapse $\sigma$, because a narrow Gaussian sitting on a point has an enormous density there. Do that for 320 steps and the policy piles all its probability onto whatever a single noisy batch happened to favour. The batch was one sample of a noisy process, and it is only trustworthy while the policy is still near the version that collected it.

On a one-dimensional toy policy that starts at the robot's $\sigma = e^{-1} \approx 0.37$, this happens fast. Ten epochs of $L^{CPI}$ over a single batch of 256 noisy samples drive $\sigma$ down to 0.098 and the KL between old and new policy from 0 to 18. After 30 batches $\sigma$ ends at 0.023, with the mean parked where the reward is almost zero. It stopped exploring, and every new noisy batch drags it somewhere else.

The obvious fix is a smaller learning rate, or fewer epochs. Too small and training crawls; too large and it is unstable again; one epoch and we are back to wasting the batch. The learning rate is one number for every row, and the trouble is per row: some samples have barely moved, and others have already moved far further than one batch can justify. What we want is a rule inside the objective: once a sample has moved far enough in the direction its advantage wants, stop paying for more.

Proximal is that rule made into maths.

$$
L^{CLIP}(\theta) = \mathbb{E}_t\left[\min\Big(r_t(\theta)\, A_t,\ \operatorname{clip}\big(r_t(\theta), 1-\epsilon, 1+\epsilon\big)\, A_t\Big)\right]
$$

::: tip
Clip the ratio to a band around 1, here $[0.9, 1.1]$, and take the worse of the clipped and unclipped versions. Once an action has been pushed as far as one batch is allowed to push it, the objective goes flat and that row stops contributing.
:::

Try it. Turn the clip off and take ten gradient steps: $r$ keeps running, which is $L^{CPI}$. Turn it back on and the same steps stall at the edge of the band.

<ppo-clip a="1" eps="0.1" r="1"></ppo-clip>

Flip the advantage negative and the picture mirrors, but not exactly. The clip is not symmetric, and the $\min$ is the reason. Why take the worse of the two at all?

### The min, and the one-way ratchet

Clipping alone would make the objective flat outside the band on both sides, whatever the advantage says. The $\min$ is what decides which side is allowed to go flat. Walk the cases with $\epsilon = 0.1$:

| Where $r$ is | $A > 0$ (good action) | $A < 0$ (bad action) |
|---|---|---|
| inside $[0.9, 1.1]$ | $r \cdot A$, gradient pushes $r$ up | $r \cdot A$, gradient pushes $r$ down |
| below 0.9 | $r \cdot A$, gradient pushes it back up | flat at $0.9\,A$, gradient 0 |
| above 1.1 | flat at $1.1\,A$, gradient 0 | $r \cdot A$, gradient pulls it back down |

::: tip
Two of the six cells are flat, and both are "you already moved far enough the way the advantage wanted". The other off-band cells are a mistake in progress: a good action that became less likely, or a bad action that became more likely. There the unclipped $r \cdot A$ is the smaller of the two, the $\min$ picks it, and the gradient pulls the policy back.
:::

The clip never traps us on the wrong side, it only stops us running away on the right side. That is also why the $\min$ makes $L^{CLIP}$ a pessimistic bound: it never scores a move as better than the unclipped objective would. The six-case table in the Hugging Face course is these same six cells written as rows; the widget above highlights the cell you are in.

Optimisers minimise, so the code flips the sign and the $\min$ becomes a $\max$:

```python
pg_loss1 = -mb_advantages * ratio
pg_loss2 = -mb_advantages * torch.clamp(ratio, 1 - clip_coef, 1 + clip_coef)
pg_loss  = torch.max(pg_loss1, pg_loss2).mean()  # max of -x = min of x
```

::: field
**The clip never traps the policy on the wrong side. It only removes the reward for running away on the right side.** On the wheeled-leg robot $\epsilon = 0.1$, half the paper's 0.2, and the update makes 10 passes over each buffer. Ten epochs over the same data is only safe because of this clip: it is the guard on the overfitting instinct, not the minibatch size. I have not tested 0.2 on this robot, so I cannot say what it would cost. It is the only piece of PPO that is actually PPO's own.
:::

So the picture is one network drifting away from the opinions the buffer remembers, every sample retiring itself once its ratio leaves the band. But "once" is doing a lot of work in that sentence. A sample retires only after it has crossed the line.

### Nothing forbids a big drift

The clip removes the reward for drifting, not the drift itself. The gradient of a row goes to zero after its ratio has left the band; nothing undoes the step that took it there. A hot enough learning rate jumps far past $\epsilon$ in one step. And all rows share one network, so a push on one state also moves the actions of rows that are already clipped. On the same one-dimensional toy, with $\epsilon = 0.1$ and a deliberately hot learning rate, the clipped run still ends with ratios up to 2.5.

So we measure how far the policy actually went. The measure is the KL divergence between the old and the new action distributions:

$$
D_{KL}(p \,\|\, q) = \sum_x p(x) \log \frac{p(x)}{q(x)}
$$

::: tip
How different distribution $q$ is from the reference $p$. Zero when they are identical, positive otherwise, and not symmetric: swapping $p$ and $q$ gives a different number.
:::

We never compute the full sum. Every row already has a ratio, and the average of one cheap expression of it estimates the KL from old to new:

$$
\widehat{KL} = \mathbb{E}_t\big[(r_t - 1) - \log r_t\big]
$$

::: tip
Zero when $r = 1$, positive for any other $r$, and small for small moves. It is what CleanRL logs as `approx_kl`. Next to it sits `clip_frac`: the share of rows whose ratio is outside the band.
:::

The two lines read together. Rising KL means the learning rate is too hot for the clip to cover. A clip fraction near 1 means most of the batch is doing nothing and the remaining epochs are wasted. Two responses build on them. KL early stopping abandons the remaining epochs once `approx_kl` passes a target: blunt, but a good backstop. An adaptive learning rate goes further: rsl_rl's `schedule="adaptive"` raises the LR when KL is below half the target and lowers it when KL is above double.

::: field
**KL is a monitor, not a constraint.** The Aug 30 recipe runs `schedule="fixed"`, so on the wheeled-leg robot KL is pure diagnostic. As a rule of thumb from Schulman, about 0.01 per update is a small step and about 10 is far too big. Microduck runs adaptive with `desired_kl = 0.01`. **Adaptive KL raises the LR as the signal fades:** it holds the change per update constant, so late in a run it keeps the policy moving. sk_lean3's LR sat at its 1e-2 ceiling 13 % of the time. Day 11 has the evidence.
:::

So far every piece has been about the policy's half of the loss. But PPO trains the critic in the same optimiser step, and the loss we actually call `backward()` on has three terms.

### The full loss: one backward pass, three terms

The critic shares the update loop with the policy, and the two losses are added. A third term rewards the policy for keeping its action distribution wide:

$$
L^{CLIP+VF+S}(\theta) = \mathbb{E}_t\Big[L^{CLIP}_t(\theta) - c_1 \big(V_\theta(s_t) - V_t^{targ}\big)^2 + c_2\, S[\pi_\theta](s_t)\Big]
$$

::: tip
Maximise the clipped surrogate, minus a regression error for the critic, plus an entropy bonus $S$. $V^{targ}$ is the return from Day 8's backward pass, fixed for all 10 epochs. $c_1$ is `vf_coef` and $c_2$ is `ent_coef`.
:::

In code, the whole minibatch step, CleanRL style:

```python
_, newlogprob, entropy, newvalue = agent.get_action_and_value(
    b_obs[mb], b_actions[mb])
logratio = newlogprob - b_logprobs[mb]
ratio = logratio.exp()
approx_kl = ((ratio - 1) - logratio).mean()   # monitor only

adv = b_advantages[mb]
adv = (adv - adv.mean()) / (adv.std() + 1e-8) # normalise advantages only
pg_loss = torch.max(-adv * ratio,
                    -adv * torch.clamp(ratio, 1 - clip_coef, 1 + clip_coef)).mean()
v_loss = 0.5 * ((newvalue - b_returns[mb]) ** 2).mean()
loss = pg_loss + vf_coef * v_loss - ent_coef * entropy.mean()

optimizer.zero_grad()
loss.backward()
nn.utils.clip_grad_norm_(agent.parameters(), max_grad_norm)  # cap size
optimizer.step()
```

1. **Policy term.** The clipped surrogate from the last two beats, with the sign flipped.
2. **Value term.** Squared error between the live critic and the stored return. `vf_coef` is the weight on the critic's half, so it is basically how fast the critic learns relative to the actor. 0.5 is the common default. If actor and critic share a trunk, this coefficient also decides how much the value signal distorts the shared layers, one more reason separate networks are easier to reason about.
3. **Entropy term.** Subtracted from the loss, so the optimiser is paid for staying uncertain. Day 6 covered why it is 0 on the robot.
4. **Gradient norm clip.** After `backward()`, the whole gradient vector is rescaled if its norm exceeds `max_grad_norm` (0.5). Direction kept, size capped, so one freak minibatch cannot take a huge step. It sits between backward and the optimiser step, so it is not part of the objective.

::: field
**Wheeled-leg robot: `ent_coef = 0`, `vf_coef = 0.25`, `max_grad_norm = 0.5`.** Entropy is off because $\sigma$ is learned anyway, and we do not want the robot to be told to stay noisy. Some implementations also clip the value update the way the policy is clipped. That is contested: the ablation literature finds it does not reliably help and sometimes hurts. Treat it as an option to test, not a requirement.
:::

That is four patches around one idea: the clip, the KL monitor, the early stop and the gradient cap all exist to keep each update near the policy that collected the data. There was a rigorous version of that idea before any of them.

### Good to know: TRPO, the road not taken

TRPO says the quiet part out loud. Maximise $L^{CPI}$, but only over policies whose KL from the old one stays under a fixed $\delta$:

$$
\max_\theta\ \mathbb{E}_t\left[r_t(\theta)\, A_t\right] \quad \text{subject to} \quad \mathbb{E}_t\Big[D_{KL}\big(\pi_{\theta_{old}}(\cdot \mid s_t) \,\|\, \pi_\theta(\cdot \mid s_t)\big)\Big] \le \delta
$$

::: tip
A leash on the whole distribution, held outside the objective. Inside the leash, be as greedy as you like.
:::

It comes with a monotonic improvement guarantee, which is genuinely reassuring theory. It is also awkward: the constrained problem needs second-order information, solved with conjugate gradients and a line search, and it does not compose well with parameter sharing or most of what modern training code does. Not what you want in a loop with a 1024-env GPU simulator. The PPO paper tried the middle road too, a KL penalty with an adaptive weight, and the clipped version came out ahead in their benchmarks.

| | **TRPO** | **PPO** |
|---|---|---|
| mechanism | Hard KL constraint outside the objective | Clip the ratio inside the objective |
| optimiser | Conjugate gradient + line search | Plain SGD / Adam |
| guarantee | Monotonic improvement | None, empirically fine |
| code | Hundreds of lines | About four |

I think nobody uses this TRPO nonsense, but I could be wrong.

Let me regroup, because that was a long run. Day 8 left us with a buffer full of advantages and a policy that goes stale after one step. The stored log-prob gave us the ratio, which made reusing the buffer legal. $L^{CPI}$ turned out to be unbounded, and the clip, through the $\min$, removes the reward for running away without ever trapping us on the wrong side. The clip does not forbid drift, so KL and clip fraction watch for it, and the full loss trains the critic in the same step. Put together, that is the whole loop:

<ppo-cycle shown="1"></ppo-cycle>

Act, Collect, Judge, Update, then throw the buffer away and go again with the drifted policy, about 3000 times for the wheeled-leg robot. Every piece of PPO now has a place on that loop. What we do not have yet is a way to tell, from the outside, whether a lap made the robot better.

## Pitfalls

- **A ratio stuck at 1 (beat 1).** If the old log-prob is recomputed after the update starts, or taken for the mean instead of the sampled action, every $r$ is 1. `clip_frac` sits at exactly 0 and `approx_kl` at 0, and PPO quietly becomes plain policy gradient run 10 times on the same data.
- **The sign flipped on the min (beat 3).** `torch.min` of the negated terms instead of `torch.max` turns the pessimistic bound into an optimistic one. It keeps paying good actions to run away and freezes bad actions that drifted up: the opposite of both halves of the ratchet. Nothing crashes. I would expect the run to look like a hot learning rate.
- **Reading the clip as a guarantee (beat 4).** A rising `approx_kl` with the clip in place means the learning rate is outrunning it. A `clip_frac` near 1 means most of each epoch is doing nothing; more epochs will not help.
- **A discrete-action entropy bonus on a continuous robot (beat 5).** `ent_coef = 0.01` comes from tutorials with a few buttons. On a Gaussian policy it pays $\sigma$ to stay wide, and I would expect a robot that never quite stops shaking.
- **Expecting adaptive KL to settle (beat 4).** It holds the change per update constant, so when the signal fades it raises the LR. A late policy trained this way keeps moving. Day 11 picks this up.

<!-- quiz -->

## Next

You might ask, how do we know any of this is working? The clip removes the reward for drifting, not the drift, so the only way to see a bad update is to read the logs. On the wheeled-leg robot, between iterations 1500 and 2999 the mean episode length wanders between 911 and 975 while the policy barely changes. And with 1024 freshly randomised robots per iteration, the episode-length curve wobbles by about 60 steps on its own. How do we tell a healthy run from a broken one? That is [Day 10](../day10/).

## Sources

- Parts of this page are adapted from the Hugging Face Deep RL Course (Thomas Simonini, Omar Sanseviero), [huggingface.co/learn/deep-rl-course](https://huggingface.co/learn/deep-rl-course/unit8/introduction), Unit 8: PPO. My notes on it are `notes/chapter-8-ppo.md` ([Notion](https://app.notion.com/p/28a67249ddbf8021b887e0d7fbe4d4b4)), rewritten here: the step-size dilemma, the ratio and $L^{CPI}$, the clipped objective, the six cases and the final actor-critic loss. Their six-case figure is replaced by the clip explorer.
- `notes/ppo-takeaways-clean.md` ([Notion](https://app.notion.com/p/3cd67249ddbf8169abf5ff90e26a2a55)), "The ratio" through "KL early stopping", and "Trust regions, KL and TRPO": the old opinion, "Proximal is that rule made into maths", the one-way ratchet, the full loss, the TRPO vs PPO table.
- The original PPO takeaways page ([Notion](https://app.notion.com/p/28a67249ddbf80cda601dacbc9d8cf80)), "Actual implementation" and "Metrics": the CleanRL code for the ratio, the clipped loss, value clipping, entropy, gradient clipping, early stopping and `approx_kl`.
- `artifacts/wlbot-learning-log-aug-30.html`, Session 2 (`ppo.py:262-267`, clip 0.1, 10 epochs, the knobs of the recipe) and Session 3b ("the PPO guide decoded": one-use data, importance sampling, $L^{CPI}$ unbounded, TRPO's KL leash, KL as a monitor, `schedule="fixed"`), and the wobble numbers.
- `artifacts/rl-presentation-plan.html`, Slides 8 and 9: the sport-technique analogy and the four-box cycle.
- `notes/microduck-takeaways.md`: Microduck's adaptive schedule with `desired_kl = 0.01`. `artifacts/the-wobble-chase.html`: sk_lean3's LR at the 1e-2 ceiling. `notes/deep-rl-hacks-schulman.md`: the KL rule of thumb, from John Schulman's "Nuts and Bolts of Deep RL" (2017). Write-up: [github.com/williamFalcon/DeepRLHacks](https://github.com/williamFalcon/DeepRLHacks).
- S. Kakade and J. Langford, "Approximately Optimal Approximate Reinforcement Learning", ICML 2002.
- J. Schulman, S. Levine, P. Moritz, M. Jordan and P. Abbeel, "Trust Region Policy Optimization", ICML 2015 ([arXiv:1502.05477](https://arxiv.org/abs/1502.05477)).
- J. Schulman, F. Wolski, P. Dhariwal, A. Radford and O. Klimov, "Proximal Policy Optimization Algorithms", 2017 ([arXiv:1707.06347](https://arxiv.org/abs/1707.06347)).
- M. Andrychowicz et al., "What Matters in On-Policy Reinforcement Learning? A Large-Scale Empirical Study", ICLR 2021; L. Engstrom et al., "Implementation Matters in Deep Policy Gradients: A Case Study on PPO and TRPO", ICLR 2020 (value clipping and the other code-level details).
- S. Huang et al., "The 37 Implementation Details of Proximal Policy Optimization", ICLR Blog Track 2022, and [CleanRL](https://github.com/vwxyzjn/cleanrl)'s `ppo.py`; J. Schulman, "Approximating KL Divergence", 2020 (the $(r - 1) - \log r$ estimator).
