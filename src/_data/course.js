// Single source of truth for the day sequence. Day pages live in src/<lang>/days/dayNN.md;
// a day without a page is listed as "coming soon".
module.exports = {
  stages: [
    {
      n: 1,
      en: { t: "Foundations", s: "From the loop to a network that scores actions" },
      zh: { t: "基础", s: "从交互循环到给动作打分的网络" },
      days: [1, 2, 3, 4],
    },
    {
      n: 2,
      en: { t: "The PPO story", s: "Policy optimisation, one problem at a time" },
      zh: { t: "PPO 的故事", s: "策略优化，一次解决一个问题" },
      days: [5, 6, 7, 8, 9],
    },
    {
      n: 3,
      en: { t: "Making it work", s: "Curves, knobs, rewards, observations, ablations" },
      zh: { t: "让它真正跑起来", s: "曲线、超参、奖励、观测与消融" },
      days: [10, 11, 12, 13, 14],
    },
    {
      n: 4,
      en: { t: "From simulator to robot", s: "Simulators, sim2real, deployment, two case studies" },
      zh: { t: "从仿真到真机", s: "仿真器、sim2real、部署与两个案例" },
      days: [15, 16, 17, 18, 19],
    },
  ],
  days: {
    1: { en: "The RL loop, MDPs and the return", zh: "强化学习循环、MDP 与回报" },
    2: { en: "Value functions and the Bellman equation", zh: "价值函数与贝尔曼方程" },
    3: { en: "Monte Carlo, TD and tabular Q-learning", zh: "蒙特卡洛、时序差分与表格 Q-learning" },
    4: { en: "Deep Q-Networks", zh: "深度 Q 网络（DQN）" },
    5: { en: "Policy gradients and REINFORCE", zh: "策略梯度与 REINFORCE" },
    6: { en: "Gaussian policies, exploration and the horizon", zh: "高斯策略、探索与时间跨度" },
    7: { en: "Rollouts, the critic and the advantage", zh: "轨迹片段、评论家与优势函数" },
    8: { en: "TD, GAE and the rollout buffer in code", zh: "TD、GAE 与代码里的经验缓冲区" },
    9: { en: "PPO: the ratio, the clip and the full loss", zh: "PPO：比率、裁剪与完整损失" },
    10: { en: "Reading training curves and debugging", zh: "读懂训练曲线与调试" },
    11: { en: "Hyperparameters that matter", zh: "真正重要的超参数" },
    12: { en: "Reward design: shaping, sigma and the critic", zh: "奖励设计：塑形、sigma 与评论家" },
    13: { en: "Observations, actions and partial observability", zh: "观测、动作与部分可观测性" },
    14: { en: "Ablation studies and evaluation", zh: "消融实验与评估方法" },
    15: { en: "Simulators for robot learning", zh: "机器人学习的仿真器" },
    16: { en: "Domain randomisation and the sim2real gap", zh: "域随机化与 sim2real 差距" },
    17: { en: "Deploying a policy to hardware", zh: "把策略部署到硬件" },
    18: { en: "Case study: the micro wheeled-leg robot", zh: "案例：微型轮足机器人" },
    19: { en: "Case study: Microduck and skills beyond walking", zh: "案例：Microduck 与行走之外的技能" },
  },
};
