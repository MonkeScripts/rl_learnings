# Learning RL · 学习强化学习

Reinforcement learning told as one continuous story, from the RL loop to a PPO policy balancing a real wheeled-leg robot on an ESP32. Each day ends on the problem the next day solves.

**[Read it in English →](https://monkescripts.github.io/rl_learnings/)** · **[中文版 →](https://monkescripts.github.io/rl_learnings/zh/)**

| Stage | Days | What it covers |
| --- | --- | --- |
| **01 · Foundations** | 1–4 | The RL loop, value functions, Q-learning, DQN |
| **02 · The PPO story** | 5–9 | Policy gradients → Gaussian policies → critic and advantage → GAE → PPO |
| **03 · Making it work** | 10–14 | Reading curves, hyperparameters, reward design, observations, ablations |
| **04 · From simulator to robot** | 15–19 | mjlab / Isaac Lab / Newton, sim2real, ESP32 deployment, two case studies |

Every day has the same parts: where we left off, an analogy, a step-by-step story where each fix leaves a crack for the next one, field notes from real robots, interactive widgets, pitfalls, and an eight-question quiz you can come back to without rereading the day. Progress and quiz scores stay in your browser.

## Develop

```bash
npm install
npm run serve     # http://localhost:8080/rl_learnings/
npm test
```

Content format, widget contract and voice rules: [AGENTS.md](AGENTS.md), [STYLE.md](STYLE.md). The day plan is in [CURRICULUM.md](CURRICULUM.md).

## Credits

Built from my own notes and experiments. Parts of Stage 1 and 2 are adapted from the [Hugging Face Deep RL Course](https://huggingface.co/learn/deep-rl-course), credited on each page where used.
