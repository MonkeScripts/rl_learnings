// <env-step task="wlbot|stock"> : walks one mjlab ManagerBasedRlEnv.step() in the order the code runs it (Day 15).
// Two clocks: the policy step (100 Hz on the wlbot) and the physics substeps (500 Hz, decimation 5).
// The order follows mjlab's manager_based_rl_env.py step(): action, decimation x (actuator compute,
// MuJoCo step, actuator update), terminations, rewards, step events, resets, commands, observations.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "一次 env.step()，按代码顺序走一遍",
        tasks: { wlbot: "轮足机器人（wlbot）", stock: "mjlab 自带速度任务（Go1）" },
        back: "上一步",
        next: "下一步",
        play: "自动播放",
        pause: "暂停",
        reset: "从头开始",
        policy: (hz) => `策略 · ${hz} Hz`,
        physics: (hz) => `物理 · ${hz} Hz`,
        after: "之后：仿真时间不动",
        ms: "ms",
        clockP: "策略时钟",
        clockS: "物理时钟",
        torques: "已算的力矩",
        frames: "进观测环的帧",
        framesStock: "传感器读数",
        stockSense: "观测时读一次",
        stepOf: (i, n) => `第 ${i} / ${n} 步`,
        sub: (k, n) => `子步 ${k} / ${n}`,
        rate: { p: "策略频率", s: "物理频率", r: "仅对结束的环境", c: "按计时器" },
        short: { act: "动作", term: "终止", rew: "奖励", evt: "事件", reset: "重置", cmd: "指令", obs: "观测", c: "算", m: "MJ", u: "感" },
        cpIn: "a_t 进来", cpHeld: "a_t 保持中", cpScore: "给第 t 步打分", cpOut: "o_t+1 出去",
        legend: "每个子步分三格：算 = 执行器 compute，MJ = MuJoCo 积分，感 = 执行器 update。点任意一格可以跳过去。",
      }
    : {
        title: "One env.step(), in the order the code runs it",
        tasks: { wlbot: "Wheeled-leg robot (wlbot)", stock: "Stock mjlab velocity task (Go1)" },
        back: "Back",
        next: "Next",
        play: "Play",
        pause: "Pause",
        reset: "Start over",
        policy: (hz) => `policy · ${hz} Hz`,
        physics: (hz) => `physics · ${hz} Hz`,
        after: "after: sim time stops",
        ms: "ms",
        clockP: "Policy clock",
        clockS: "Physics clock",
        torques: "Torques computed",
        frames: "Frames into obs ring",
        framesStock: "Sensor reads",
        stockSense: "once, at obs",
        stepOf: (i, n) => `Step ${i} of ${n}`,
        sub: (k, n) => `substep ${k} of ${n}`,
        rate: { p: "policy rate", s: "physics rate", r: "finished envs only", c: "on a timer" },
        short: { act: "act", term: "term", rew: "rew", evt: "evt", reset: "reset", cmd: "cmd", obs: "obs", c: "c", m: "MJ", u: "u" },
        cpIn: "a_t arrives", cpHeld: "a_t held", cpScore: "scoring step t", cpOut: "o_t+1 leaves",
        legend: "Each substep has three cells: c = actuator compute, MJ = MuJoCo step, u = actuator update. Tap any cell to jump to it.",
      };

  // Per-task text. Each phase: { key, rate, name, body, code }.
  const TASKS = {
    wlbot: {
      dec: 5, dt: 2, hz: 100, phz: 500,
      act: ZH
        ? { name: "动作 manager", body: "策略输出 [U, u_y]，先裁剪到 [-1, 1]，再由 pipeline.mix() 混成左右两路电压，然后只是存起来。这一步不产生力矩。", code: "action_manager.process_action(a) → WheelVoltageAction → pipeline.mix()" }
        : { name: "Action manager", body: "The policy's [U, u_y] is clipped to [-1, 1], and pipeline.mix() mixes it into left and right volts and only stores them. No torque yet.", code: "action_manager.process_action(a) → WheelVoltageAction → pipeline.mix()" },
      c: ZH
        ? { name: "执行器 compute", body: "WheelVoltageActuator.compute() 调 pipeline.tick(ω)：存着的电压推进 2 ms 一格的延迟环，电池压降，电机定律给出力矩。五个子步电压不变，力矩每次都不一样：反电动势用的是 MuJoCo 2 ms 前给出的轮速。", code: "scene.write_data_to_sim() → actuator.compute() → pipeline.tick(ω)" }
        : { name: "Actuator compute", body: "WheelVoltageActuator.compute() calls pipeline.tick(ω): the held volts go into the 2 ms delay ring, the battery sags, the motor law gives a torque. The volts are the same for all five substeps; the torque is not, because back-EMF uses the wheel speed MuJoCo produced 2 ms earlier.", code: "scene.write_data_to_sim() → actuator.compute() → pipeline.tick(ω)" },
      m: ZH
        ? { name: "MuJoCo 积分 2 ms", body: "MuJoCo Warp 在 1024 个世界里同时积分 2 ms。它给出的是真实状态（qpos、qvel、四元数），不是观测。观测要我们自己造。", code: "sim.step()" }
        : { name: "MuJoCo steps 2 ms", body: "MuJoCo Warp integrates 2 ms in all 1024 worlds at once. What comes out is true state (qpos, qvel, the quaternion), not observations. Observations are ours to build.", code: "sim.step()" },
      u: ZH
        ? { name: "执行器 update（感知节拍）", body: "WheelVoltageActuator.update() 读出真实状态，调 sense.tick()：固件的俯仰和航向滤波、编码器低通、传感器噪声，然后往观测环里推一帧。感知住在“执行器”里，因为这是框架里唯一每个子步都会调用的钩子。", code: "scene.update(dt) → actuator.update() → sense.tick(truth)" }
        : { name: "Actuator update (the sense tick)", body: "WheelVoltageActuator.update() reads the true state and calls sense.tick(): the firmware's pitch and yaw filters, the encoder low-pass, sensor noise, then one frame into the observation ring. Sensing lives in an 'actuator' because that is the only hook the framework calls every substep.", code: "scene.update(dt) → actuator.update() → sense.tick(truth)" },
      term: ZH
        ? { name: "终止 manager", body: "fell_over（俯仰或横滚超过摔倒角）、runaway（轮速超过 125 rad/s）、pos_runaway（位置误差超过护栏），以及 time_out。time_out 是截断，不是失败。每个策略步只查一次：子步 2 越界、子步 5 又回来的情况，它看不到。", code: "reset_buf = termination_manager.compute()" }
        : { name: "Termination manager", body: "fell_over (pitch or roll past the fall angle), runaway (wheel speed over 125 rad/s), pos_runaway (position error past the guard), and time_out. time_out is truncation, not failure. Checked once per policy step: a pitch that crosses the limit at substep 2 and recovers by substep 5 is never seen.", code: "reset_buf = termination_manager.compute()" },
      rew: ZH
        ? { name: "奖励 manager", body: "StationKeepReward 用真实俯仰（不是传感器读到的）、里程计位置误差和航向误差算乘积形式的奖励，并从共享的 DomainRandomizer 读课程进度。奖励交给 PPO，策略永远看不到它，它也不进观测环。", code: "reward_buf = reward_manager.compute(dt)" }
        : { name: "Reward manager", body: "StationKeepReward scores true pitch (not the sensed one), the odometry position error and the yaw error as a product, and reads the curriculum level from the shared DomainRandomizer. The reward goes to PPO. The policy never sees it and it never enters the obs ring.", code: "reward_buf = reward_manager.compute(dt)" },
      evt: ZH
        ? { name: "事件（step 模式）", body: "push 自己管每个环境的计时：到点就在随机偏移点上施加水平推力，持续一段时间后清掉。curriculum 把推力上限和初始状态散布从 0 拉到满。", code: "event_manager.apply(mode=\"step\")" }
        : { name: "Events (step mode)", body: "push keeps its own per-env timer: when it fires it applies a horizontal force at a random offset point, holds it, and clears it when it expires. curriculum ramps the push cap and the init-state spread from 0 to full.", code: "event_manager.apply(mode=\"step\")" },
      reset: ZH
        ? { name: "重置结束的环境", body: "只对刚终止或超时的环境：ResetRobot 重新抽域随机化参数（质量、摩擦、轮径、电机常数、电池电压），写进 MuJoCo 模型，摆初始姿态，重置舵机和两条流水线（重抽动作延迟、清空延迟环、重新锁定电池电压）。", code: "_reset_idx(env_ids) → ResetRobot, actuator.reset(env_ids)" }
        : { name: "Reset finished envs", body: "Only for envs that just terminated or timed out: ResetRobot draws new DR parameters (masses, friction, wheel radii, motor constants, battery), writes them into the MuJoCo model, sets the initial pose, and resets the servo and both pipelines (a new action delay, an empty delay ring, a re-latched battery).", code: "_reset_idx(env_ids) → ResetRobot, actuator.reset(env_ids)" },
      cmd: ZH
        ? { name: "指令 manager", body: "速度和偏航角速度指令保持 2 到 4 秒，到时重抽。训练配置里两个范围都是 [0, 0]，所以指令永远是“站着别动”。", code: "command_manager.compute(dt)" }
        : { name: "Command manager", body: "A velocity and yaw-rate command, held for 2 to 4 s, then resampled. Both ranges are [0, 0] in the training configs, so the command is always 'stay still'.", code: "command_manager.compute(dt)" },
      obs: ZH
        ? { name: "观测 manager", body: "StationKeepObs 调 sense.observe()：从观测环里取一帧带延迟的读数，堆叠、缩放，得到 actor 的 [1024, 40]；critic 再加上特权状态和对象参数，68 维。刚重置的环境，这里拿到的是重置后的观测，而上面的奖励是重置前的。", code: "obs_buf = observation_manager.compute()" }
        : { name: "Observation manager", body: "StationKeepObs calls sense.observe(): one delayed frame from the ring, stacked and scaled, gives the actor's [1024, 40]; the critic adds privileged state and plant parameters for 68. For an env that just reset, this is the post-reset observation, while the reward above was scored before the reset.", code: "obs_buf = observation_manager.compute()" },
    },
    stock: {
      dec: 4, dt: 5, hz: 50, phz: 200,
      act: ZH
        ? { name: "动作 manager", body: "JointPositionAction：策略输出乘以缩放，加到默认关节角上，变成 12 个关节的目标位置。", code: "action_manager.process_action(a) → JointPositionAction" }
        : { name: "Action manager", body: "JointPositionAction: the policy output is scaled and added to the default joint pose, giving a position target for each of the 12 joints.", code: "action_manager.process_action(a) → JointPositionAction" },
      c: ZH
        ? { name: "执行器 compute", body: "Go1 用的是 BuiltinPositionActuator：这里只把目标位置写进 MuJoCo 的 ctrl。PD 律本身在 MuJoCo 的执行器里，下一格才算。", code: "action_manager.apply_action(); scene.write_data_to_sim()" }
        : { name: "Actuator compute", body: "The Go1 uses BuiltinPositionActuator, so this only writes the position targets into MuJoCo's ctrl. The PD law itself lives in MuJoCo's own actuator and runs in the next cell.", code: "action_manager.apply_action(); scene.write_data_to_sim()" },
      m: ZH
        ? { name: "MuJoCo 积分 5 ms", body: "物理步长 5 ms。MuJoCo 的位置执行器在这里把目标变成力矩，接触、关节、地形一起积分。", code: "sim.step()" }
        : { name: "MuJoCo steps 5 ms", body: "The physics timestep is 5 ms. MuJoCo's position actuators turn the targets into torques here, and contacts, joints and terrain are integrated together.", code: "sim.step()" },
      u: ZH
        ? { name: "scene.update", body: "刷新各实体的数据缓存。没有固件滤波，没有子步级的传感器模型：噪声到观测那一步才加，而且只加一次。", code: "scene.update(dt)" }
        : { name: "scene.update", body: "Refreshes each entity's data buffers. No firmware filter and no per-substep sensor model: noise is added once, at the observation.", code: "scene.update(dt)" },
      term: ZH
        ? { name: "终止 manager", body: "time_out（20 s 回合）、fell_over（姿态偏离超过 70°）、out_of_terrain_bounds。最后这个也标成 time_out=True：走出地图算截断，不算失败。", code: "reset_buf = termination_manager.compute()" }
        : { name: "Termination manager", body: "time_out (20 s episodes), fell_over (orientation past 70°), out_of_terrain_bounds. The last one is also flagged time_out=True: walking off the map is truncation, not failure.", code: "reset_buf = termination_manager.compute()" },
      rew: ZH
        ? { name: "奖励 manager", body: "track_linear_velocity（权重 2.0）、track_angular_velocity（2.0）、upright（1.0）、pose（1.0），再加 dof_pos_limits（−1.0）、action_rate_l2（−0.1）等惩罚。跟踪项都是高斯形。", code: "reward_buf = reward_manager.compute(dt)" }
        : { name: "Reward manager", body: "track_linear_velocity (weight 2.0), track_angular_velocity (2.0), upright (1.0), pose (1.0), plus penalties such as dof_pos_limits (−1.0) and action_rate_l2 (−0.1). The tracking terms are Gaussians.", code: "reward_buf = reward_manager.compute(dt)" },
      evt: ZH
        ? { name: "事件（interval 模式）", body: "push_robot 每 1 到 3 秒直接改一次机身速度。摩擦、编码器偏置、质心偏移是 startup 事件，只在开始时抽一次。", code: "event_manager.apply(mode=\"interval\")" }
        : { name: "Events (interval mode)", body: "push_robot sets the base velocity every 1 to 3 s. Foot friction, encoder bias and CoM offset are startup events, drawn once at the start.", code: "event_manager.apply(mode=\"interval\")" },
      reset: ZH
        ? { name: "重置结束的环境", body: "reset_base 在 ±0.5 m、全偏航范围内随机摆放机身；reset_robot_joints 把关节放回默认姿态。", code: "_reset_idx(env_ids)" }
        : { name: "Reset finished envs", body: "reset_base places the body within ±0.5 m and any yaw; reset_robot_joints puts the joints back at the default pose.", code: "_reset_idx(env_ids)" },
      cmd: ZH
        ? { name: "指令 manager", body: "twist 指令每 3 到 8 秒重抽：lin_vel_x、lin_vel_y 在 ±1 m/s，ang_vel_z 在 ±0.5 rad/s，10% 的环境站着不动。指令也是课程旋钮，后面会放宽。", code: "command_manager.compute(dt)" }
        : { name: "Command manager", body: "The twist command is resampled every 3 to 8 s: lin_vel_x and lin_vel_y in ±1 m/s, ang_vel_z in ±0.5 rad/s, 10% of envs standing. The command is also a curriculum knob and widens later.", code: "command_manager.compute(dt)" },
      obs: ZH
        ? { name: "观测 manager", body: "sim.sense() 之后读 base_lin_vel、base_ang_vel、projected_gravity、joint_pos、joint_vel、上一步动作、指令和高度扫描，每项加一次均匀噪声。全部按策略频率，一次。", code: "sim.sense(); obs_buf = observation_manager.compute()" }
        : { name: "Observation manager", body: "After sim.sense(): base_lin_vel, base_ang_vel, projected_gravity, joint_pos, joint_vel, the last action, the command and a height scan, each with uniform noise added once. All of it at the policy rate, once.", code: "sim.sense(); obs_buf = observation_manager.compute()" },
    },
  };
  const POST = ["term", "rew", "evt", "reset", "cmd", "obs"];

  const build = (task) => {
    const P = TASKS[task];
    const s = [{ key: "act", k: 0, rate: "p" }];
    for (let k = 1; k <= P.dec; k++) for (const part of ["c", "m", "u"]) s.push({ key: part, k, rate: "s" });
    for (const key of POST) s.push({ key, k: P.dec, rate: key === "reset" ? "r" : key === "cmd" ? "c" : "p" });
    return s;
  };

  class EnvStep extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.task = this.getAttribute("task") === "stock" ? "stock" : "wlbot";
      this.i = 0;
      this.innerHTML = `
        <div class="widget env-step">
          <p class="widget-title">${T.title}</p>
          <span class="seg" role="group" style="flex-wrap:wrap">
            <button type="button" data-task="wlbot">${T.tasks.wlbot}</button><button type="button" data-task="stock">${T.tasks.stock}</button>
          </span>
          <svg role="img" aria-label="${T.title}" style="margin-top:.75rem"></svg>
          <p class="note" style="margin-top:.3rem">${T.legend}</p>
          <div class="readout">
            <div><small>${T.clockP}</small><b data-v="cp"></b></div>
            <div><small>${T.clockS}</small><b data-v="cs"></b></div>
            <div><small>${T.torques}</small><b data-v="tq"></b></div>
            <div><small data-v="frl">${T.frames}</small><b data-v="fr"></b></div>
          </div>
          <div style="margin-top:.75rem;border:1px solid var(--border);border-radius:6px;padding:.7rem .8rem;background:var(--bg)">
            <div style="display:flex;flex-wrap:wrap;gap:.4rem .8rem;align-items:baseline">
              <small data-v="pos" style="color:var(--muted);font-family:var(--mono)"></small>
              <b data-v="name"></b>
              <small data-v="rate" style="font-family:var(--mono);padding:.05rem .4rem;border-radius:4px"></small>
            </div>
            <p data-v="body" style="margin:.45rem 0 .4rem" aria-live="polite"></p>
            <code data-v="code" style="display:block;font-family:var(--mono);font-size:.78rem;color:var(--muted);overflow-wrap:anywhere"></code>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin-top:.75rem">
            <button type="button" class="button secondary" data-act="back">◀ ${T.back}</button>
            <button type="button" class="button" data-act="next">${T.next} ▶</button>
            <button type="button" class="button secondary" data-act="play">${T.play}</button>
            <button type="button" class="button secondary" data-act="reset">${T.reset}</button>
          </div>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll("[data-task]").forEach((b) =>
        b.addEventListener("click", () => {
          this.stop();
          this.task = b.dataset.task;
          this.i = 0;
          this.render();
        })
      );
      const go = (d) => {
        const n = build(this.task).length;
        this.i = Math.max(0, Math.min(n - 1, this.i + d));
        this.render();
      };
      this.querySelector('[data-act="back"]').addEventListener("click", () => { this.stop(); go(-1); });
      this.querySelector('[data-act="next"]').addEventListener("click", () => { this.stop(); go(1); });
      this.querySelector('[data-act="reset"]').addEventListener("click", () => { this.stop(); this.i = 0; this.render(); });
      this.querySelector('[data-act="play"]').addEventListener("click", () => {
        if (this._timer) return this.stop();
        const n = build(this.task).length;
        if (this.i >= n - 1) this.i = 0;
        this.querySelector('[data-act="play"]').textContent = T.pause;
        this._timer = setInterval(() => {
          if (this.i >= build(this.task).length - 1) return this.stop();
          go(1);
        }, 900);
      });
      this.svg.addEventListener("click", (e) => {
        const g = e.target.closest("[data-i]");
        if (!g) return;
        this.stop();
        this.i = Number(g.dataset.i);
        this.render();
      });
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    disconnectedCallback() { this.stop(); }

    stop() {
      if (this._timer) clearInterval(this._timer);
      this._timer = null;
      const b = this.querySelector('[data-act="play"]');
      if (b) b.textContent = T.play;
    }

    render() {
      const P = TASKS[this.task];
      const steps = build(this.task);
      const cur = steps[this.i];
      const W = Math.round(this.svg.clientWidth) || 560;
      const narrow = W < 460;
      const H = 150;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const labW = narrow ? 64 : 92;
      const postW = narrow ? 64 : 112;
      const gap = narrow ? 10 : 18;
      const x0 = labW, x1 = W - postW - gap;
      const span = P.dec * P.dt;
      const X = (t) => x0 + (t / span) * (x1 - x0);
      const yP = 18, hP = 26, yS = 64, hS = 30, yAx = 110;
      const on = (j) => j === this.i;
      const done = (j) => j < this.i;
      const fillFor = (j, base) => (on(j) ? "var(--accent-2)" : done(j) ? base : "var(--surface-2)");
      let out = "";
      // lane labels
      out += `<text x="${labW - 8}" y="${yP + hP / 2 + 4}" text-anchor="end" font-size="11" fill="var(--text)">${T.policy(P.hz)}</text>`;
      out += `<text x="${labW - 8}" y="${yS + hS / 2 + 4}" text-anchor="end" font-size="11" fill="var(--text)">${T.physics(P.phz)}</text>`;
      if (narrow) {
        // stack the label on two lines
        out = `<text x="${labW - 6}" y="${yP + 11}" text-anchor="end" font-size="10.5" fill="var(--text)">${ZH ? "策略" : "policy"}</text><text x="${labW - 6}" y="${yP + 24}" text-anchor="end" font-size="10.5" fill="var(--muted)" font-family="var(--mono)">${P.hz} Hz</text>`
          + `<text x="${labW - 6}" y="${yS + 13}" text-anchor="end" font-size="10.5" fill="var(--text)">${ZH ? "物理" : "physics"}</text><text x="${labW - 6}" y="${yS + 26}" text-anchor="end" font-size="10.5" fill="var(--muted)" font-family="var(--mono)">${P.phz} Hz</text>`;
      }
      // policy lane: the held action spans the whole step
      const actOn = on(0), actDone = this.i > 0;
      out += `<g data-i="0" style="cursor:pointer"><rect x="${X(0)}" y="${yP}" width="${X(span) - X(0)}" height="${hP}" rx="4" fill="${actOn ? "var(--accent-2)" : actDone ? "var(--accent-2-soft)" : "var(--surface-2)"}" stroke="var(--border)"/>`;
      out += `<text x="${X(0) + 6}" y="${yP + hP / 2 + 4}" font-size="11" fill="${actOn ? "var(--bg)" : "var(--text)"}" font-family="var(--mono)">${T.short.act}: a_t ${ZH ? "保持" : "held"}</text></g>`;
      // physics lane: dec substeps, each split into c / MJ / u
      steps.forEach((st, j) => {
        if (st.rate !== "s") return;
        const t0 = (st.k - 1) * P.dt;
        const third = P.dt / 3;
        const off = st.key === "c" ? 0 : st.key === "m" ? 1 : 2;
        const a = X(t0 + off * third) + (off === 0 ? 1 : 0.5), b = X(t0 + (off + 1) * third) - (off === 2 ? 1 : 0.5);
        const base = st.key === "m" ? "var(--accent-soft)" : "var(--accent-2-soft)";
        out += `<g data-i="${j}" style="cursor:pointer"><rect x="${a}" y="${yS}" width="${Math.max(1, b - a)}" height="${hS}" fill="${fillFor(j, base)}" stroke="var(--border)" stroke-width="0.6"/>`;
        if (b - a > 13) out += `<text x="${(a + b) / 2}" y="${yS + hS / 2 + 4}" text-anchor="middle" font-size="${narrow ? 9 : 10}" fill="${on(j) ? "var(--bg)" : "var(--muted)"}" font-family="var(--mono)">${T.short[st.key]}</text>`;
        out += `</g>`;
      });
      // axis
      out += `<line x1="${X(0)}" x2="${X(span)}" y1="${yAx}" y2="${yAx}" stroke="var(--border)"/>`;
      for (let k = 0; k <= P.dec; k++) {
        const t = k * P.dt;
        out += `<line x1="${X(t)}" x2="${X(t)}" y1="${yAx}" y2="${yAx + 4}" stroke="var(--muted)"/>`;
        out += `<text x="${X(t)}" y="${yAx + 16}" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="var(--mono)">${t}</text>`;
      }
      out += `<text x="${X(span)}" y="${yAx + 30}" text-anchor="end" font-size="10" fill="var(--muted)">${T.ms}</text>`;
      // sim-time cursor
      const tNow = cur.rate === "s" ? (cur.k - 1) * P.dt + (cur.key === "u" ? P.dt : cur.key === "m" ? P.dt / 2 : 0) : this.i === 0 ? 0 : span;
      out += `<line x1="${X(tNow)}" x2="${X(tNow)}" y1="${yP - 6}" y2="${yAx}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3"/>`;
      // post block at t = span, stacked
      const px = W - postW, bh = (yAx - yP + 4) / POST.length;
      out += `<line x1="${X(span)}" x2="${px}" y1="${yP + hP / 2}" y2="${yP + hP / 2}" stroke="var(--border)" stroke-dasharray="2 3"/>`;
      steps.forEach((st, j) => {
        const pi = POST.indexOf(st.key);
        if (st.rate === "s" || pi < 0) return;
        const y = yP - 2 + pi * bh;
        const base = st.key === "rew" ? "var(--amber-soft, var(--accent-soft))" : "var(--accent-2-soft)";
        out += `<g data-i="${j}" style="cursor:pointer"><rect x="${px}" y="${y}" width="${postW}" height="${bh - 2}" rx="3" fill="${fillFor(j, base)}" stroke="var(--border)" stroke-width="0.6"/>`;
        out += `<text x="${px + postW / 2}" y="${y + bh / 2 + 2}" text-anchor="middle" font-size="${narrow ? 9.5 : 10.5}" fill="${on(j) ? "var(--bg)" : "var(--text)"}" font-family="var(--mono)">${T.short[st.key]}</text></g>`;
      });
      out += `<text x="${px + postW / 2}" y="${yAx + 16}" text-anchor="middle" font-size="10" fill="var(--muted)">${narrow ? (ZH ? "之后" : "after") : T.after}</text>`;
      this.svg.innerHTML = out;

      // readouts
      const kDone = cur.rate === "s" ? cur.k - (cur.key === "u" ? 0 : 1) : this.i === 0 ? 0 : P.dec;
      const tqDone = cur.rate === "s" ? cur.k : this.i === 0 ? 0 : P.dec;
      this.querySelector('[data-v="cp"]').textContent =
        this.i === 0 ? T.cpIn : cur.rate === "s" ? T.cpHeld : cur.key === "obs" ? T.cpOut : T.cpScore;
      const tShow = cur.rate === "s" ? (cur.key === "u" ? cur.k * P.dt : (cur.k - 1) * P.dt) : this.i === 0 ? 0 : span;
      this.querySelector('[data-v="cs"]').textContent =
        cur.key === "m" ? `${(cur.k - 1) * P.dt} → ${cur.k * P.dt} ${T.ms}` : `${tShow} / ${span} ${T.ms}`;
      this.querySelector('[data-v="tq"]').textContent = `${tqDone} / ${P.dec}`;
      if (this.task === "wlbot") {
        this.querySelector('[data-v="frl"]').textContent = T.frames;
        this.querySelector('[data-v="fr"]').textContent = `${kDone} / ${P.dec}`;
      } else {
        this.querySelector('[data-v="frl"]').textContent = T.framesStock;
        this.querySelector('[data-v="fr"]').textContent = cur.key === "obs" ? "1" : T.stockSense;
      }
      const ph = P[cur.key];
      this.querySelector('[data-v="pos"]').textContent = T.stepOf(this.i + 1, steps.length) + (cur.rate === "s" ? " · " + T.sub(cur.k, P.dec) : "");
      this.querySelector('[data-v="name"]').textContent = ph.name;
      const rateEl = this.querySelector('[data-v="rate"]');
      const rateTxt = cur.rate === "s" ? `${P.phz} Hz · ${T.rate.s}` : cur.rate === "p" ? `${P.hz} Hz · ${T.rate.p}` : T.rate[cur.rate];
      rateEl.textContent = rateTxt;
      rateEl.style.background = cur.rate === "s" ? "var(--accent-soft)" : "var(--accent-2-soft)";
      this.querySelector('[data-v="body"]').textContent = ph.body;
      this.querySelector('[data-v="code"]').textContent = ph.code;
      this.querySelectorAll("[data-task]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.task === this.task)));
      this.querySelector('[data-act="back"]').disabled = this.i === 0;
      this.querySelector('[data-act="next"]').disabled = this.i === steps.length - 1;
    }
  }
  customElements.define("env-step", EnvStep);
})();
