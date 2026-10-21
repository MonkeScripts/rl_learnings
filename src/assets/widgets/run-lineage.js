// <run-lineage run="sk_lean3"> : the wobble chase run lineage, sk_lean to sk_lean5_s2, with the simulation's verdict
// next to the bench's for every run (Day 18). Data: the-wobble-chase.html (2026-09-15 to 09-20).
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const L = (en, zh) => (ZH ? zh : en);
  const T = {
    title: L("Run lineage: sk_lean to sk_lean5_s2", "run 谱系：从 sk_lean 到 sk_lean5_s2"),
    sim: L("sim", "仿真"),
    bench: L("bench", "台架"),
    hint: L("Tap a run. Lines show which run each one started from.", "点一个 run。连线表示每个 run 是从哪个 run 改出来的。"),
    f: {
      date: L("Date", "日期"), action: L("Action / net", "动作 / 网络"), iters: L("Iterations", "迭代"),
      sched: L("Heading / half slew / full slew on at", "航向 / 半 slew / 全 slew 开启于"),
      asked: L("Question it asked", "它要回答的问题"), simv: L("What the simulation said", "仿真怎么说"),
      benchv: L("What the robot said", "机器人怎么说"),
    },
    legend: L(
      "All runs: 1024 envs × 128 steps, seed 0, action delay 3–30 ms. Bench verdicts are my observations on the robot; a dash means there is no bench record for that run.",
      "所有 run：1024 个环境 × 128 步，种子 0，动作延迟 3–30 ms。台架结论是我在机器人上看到的；横线表示这个 run 没有台架记录。"
    ),
  };
  const V = {
    pass: ["var(--good)", L("pass", "通过")],
    fail: ["var(--bad)", L("fail", "不过")],
    mixed: ["var(--amber)", L("mixed", "有好有坏")],
    killed: ["var(--muted)", L("killed", "被停")],
    calm: ["var(--good)", L("calmest", "最平稳")],
    best: ["var(--good)", L("best", "最好")],
    nobetter: ["var(--amber)", L("no better", "没更好")],
    bad: ["var(--bad)", L("wobbles", "晃得厉害")],
    lost: ["var(--bad)", L("lost", "输了")],
    none: ["var(--border)", "—"],
  };
  // lane: 0 mixer main line, 1 per-wheel branch, 2 the sk_lean5 branch, 3 the averaged policy.
  const RUNS = [
    { id: "sk_lean", lane: 0, parent: null, date: "09-15", action: "mixer · 64×64", iters: "5000", sched: L("none", "无"),
      asked: L("Does a three-term reward work?", "三项奖励行不行？"),
      sim: "fail", simT: L("Survived (0.876 at 2500) but chattered: clean yaw rate 0.80.", "能活（2500 次时 0.876），但抖个不停：干净条件下 yaw rate 0.80。"),
      bench: "none", benchT: L("No bench record.", "没有台架记录。") },
    { id: "sk_lean2", lane: 0, parent: "sk_lean", date: "09-15", action: "mixer · 64×64", iters: "5000", sched: "750 / 1500 / 2250",
      asked: L("Does a ramped slew penalty fix the chatter?", "slew 惩罚逐步加上去，能不能治抖？"),
      sim: "mixed", simT: L("Chatter fixed (shove 0.933, clean yaw rate 0.262), but the latch probe FAILS at 2.74 V.", "抖治好了（推力条件 0.933，干净 yaw rate 0.262），但锁死探针 2.74 V，不过。"),
      bench: "none", benchT: L("No bench record.", "没有台架记录。") },
    { id: "sk_lean3", lane: 0, parent: "sk_lean2", date: "09-16", action: "mixer · 64×64", iters: "5000", sched: "250 / 500 / 1000",
      asked: L("Front-load the schedule.", "把课程前移。"),
      sim: "pass", simT: L("First clean gate PASS; latch fixed (0.21 V at model_4500). One row still fails: wobble at 77 mm / 30 ms, 13.5°.", "第一次干净关卡 PASS；锁死修好了（model_4500 为 0.21 V）。还剩一行不过：77 mm / 30 ms 下晃动 13.5°。"),
      bench: "best", benchT: L("model_4500 is the best policy on the bench: \"s3 4500 is still the best\".", "model_4500 是台架上最好的策略：“s3 4500 还是最好的”。") },
    { id: "sk_lean4", lane: 1, parent: "sk_lean3", date: "09-16", action: "per-wheel · 128×128", iters: "5000", sched: "250 / 500 / 1000",
      asked: L("Is the wobble a capacity limit?", "晃动是不是容量不够？"),
      sim: "fail", simT: L("0.65 reward per step against 1.0. Not gated until 09-20: it spins in place at 1.6 rad/s and never learned heading.", "每步奖励 0.65，满分 1.0。直到 09-20 才过关卡：原地以 1.6 rad/s 打转，从没学会航向。"),
      bench: "none", benchT: L("Never on the robot.", "没上过机。") },
    { id: "sk_lean4b", lane: 1, parent: "sk_lean4", date: "09-17", action: "per-wheel · 128×128", iters: L("20k, stopped at 14k", "20k，14k 时停"), sched: "500 / 1500 / 3000",
      asked: L("Does the wide net converge with time?", "宽网络多训一会儿会不会收敛？"),
      sim: "mixed", simT: L("Learned heading on the spaced schedule; clean gate PASS. But value loss climbed 175 → 1070 and the surrogate went negative by 11,000. Best at 10,000.", "课程拉开后学会了航向；干净关卡 PASS。但价值损失从 175 涨到 1070，到 11,000 次时代理目标变负。最好的在 10,000 次。"),
      bench: "none", benchT: L("Not tried on the robot.", "没在机器人上试。") },
    { id: "sk_lean4c", lane: 1, parent: "sk_lean4b", date: "09-18", action: "per-wheel · 128×128", iters: "20,000", sched: L("500 / 1500 / 3000, vf 0.5", "500 / 1500 / 3000，vf 0.5"),
      asked: L("Fix the critic.", "修 critic。"),
      sim: "pass", simT: L("Value loss stable at 700–800. model_18500 has the best shove gate of any policy: 0.956 / 0.146 / 0.64. Flat from 5000 to 18,500.", "价值损失稳定在 700–800。model_18500 的推力关卡是所有策略里最好的：0.956 / 0.146 / 0.64。从 5000 到 18,500 一直平。"),
      bench: "nobetter", benchT: L("No better than sk_lean3: \"the one with mixer is better\".", "不比 sk_lean3 好：“带混合器的那个更好”。") },
    { id: "sk_lean5_s0", lane: 2, parent: "sk_lean3", date: "09-18", action: "mixer · 64×64", iters: L("killed at 800", "800 次被停"), sched: "500 / 1000 / 2000",
      asked: L("Does sk_lean3 improve past 5000?", "sk_lean3 过了 5000 次还会变好吗？"),
      sim: "killed", simT: L("Killed by an alarm keyed on reward, which falls by design when a weight switches on. Episode length was rising.", "被一个盯着奖励的警报停掉，而权重一打开，奖励本来就会掉。当时回合长度还在涨。"),
      bench: "none", benchT: L("Never on the robot.", "没上过机。") },
    { id: "sk_lean5_s1", lane: 2, parent: "sk_lean3", date: "09-18", action: "mixer · 64×64", iters: L("killed at 50", "50 次被停"), sched: "500 / 1500 / 2500",
      asked: L("Same question.", "同一个问题。"),
      sim: "killed", simT: L("Killed to free the GPU for Newton.", "为了给 Newton 腾 GPU 停掉的。"),
      bench: "none", benchT: L("Never on the robot.", "没上过机。") },
    { id: "sk_lean5_s2", lane: 2, parent: "sk_lean3", date: "09-18", action: "mixer · 64×64", iters: "10,000", sched: "500 / 1500 / 2500",
      asked: L("Same question, run to 10,000.", "同一个问题，跑到 10,000 次。"),
      sim: "pass", simT: L("model_5000 beat sk_lean3's model_4999 on the mjlab gate, 0.948 against 0.927. Six checkpoints 5000–9999 scored 0.929–0.955: one policy within noise. The probe rated model_5500 calm.", "model_5000 在 mjlab 关卡上赢了 sk_lean3 的 model_4999，0.948 对 0.927。5000–9999 的六个检查点在 0.929–0.955 之间：噪声范围内是同一个策略。探针说 model_5500 很稳。"),
      bench: "bad", benchT: L("model_5500 on the robot: \"it wobbles too much\".", "model_5500 上机：“晃得太厉害”。") },
    { id: "lean3 avg", lane: 3, parent: "sk_lean3", date: "—", action: L("21 checkpoints averaged", "21 个检查点取平均"), iters: "3000–4999", sched: "—",
      asked: L("Does averaging late checkpoints give a calmer policy?", "把后期检查点平均一下，会不会更稳？"),
      sim: "calm", simT: L("The calmest policy measured: wobble 10.4°, yaw rate halved, better on mjlab, Newton and PyBullet. Latch PASS at 0.69 V.", "量过的最平稳的策略：晃动 10.4°，yaw rate 减半，mjlab、Newton、PyBullet 上都更好。锁死探针 0.69 V，通过。"),
      bench: "lost", benchT: L("Lost to model_4500 on the bench.", "台架上输给了 model_4500。") },
  ];

  class RunLineage extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const r0 = this.getAttribute("run");
      this.sel = RUNS.some((r) => r.id === r0) ? r0 : "sk_lean3";
      this.innerHTML = `
        <div class="widget run-lineage">
          <p class="widget-title">${T.title}</p>
          <p class="note" style="margin:0 0 .5rem">${T.hint}</p>
          <svg role="list" aria-label="${T.title}"></svg>
          <div data-v="detail" aria-live="polite"></div>
          <p class="note">${T.legend}</p>
        </div>`;
      this.svg = this.querySelector("svg");
      this.svg.addEventListener("click", (e) => {
        const g = e.target.closest("[data-run]");
        if (g) this.pick(g.dataset.run);
      });
      this.svg.addEventListener("keydown", (e) => {
        const g = e.target.closest("[data-run]");
        if (g && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          this.pick(g.dataset.run);
        }
      });
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    pick(id) {
      this.sel = id;
      this.render();
      const g = this.svg.querySelector(`[data-run="${CSS.escape(id)}"]`);
      if (g) g.focus({ preventScroll: true });
    }

    render() {
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 460;
      const rowH = 40, top = 26, H = top + RUNS.length * rowH + 4;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      this.svg.setAttribute("height", H);
      const laneX = (l) => 10 + l * 14;
      const textX = laneX(3) + 14;
      const pillW = narrow ? 64 : 84;
      const benchX = W - pillW / 2 - 2, simX = benchX - pillW - 6;
      const y = (i) => top + i * rowH + rowH / 2;
      const idx = Object.fromEntries(RUNS.map((r, i) => [r.id, i]));
      const pill = (cx, cy, key) => {
        const [col, label] = V[key];
        const none = key === "none";
        return `<rect x="${cx - pillW / 2}" y="${cy - 10}" width="${pillW}" height="20" rx="10" fill="${none ? "none" : col}" fill-opacity="${none ? 0 : 0.16}" stroke="${col}"/>
          <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="${narrow ? 10.5 : 11.5}" fill="${none ? "var(--muted)" : "var(--text)"}" font-family="var(--sans)">${label}</text>`;
      };
      // Lineage edges: down the parent's lane, then across into the child's lane.
      const edges = RUNS.filter((r) => r.parent)
        .map((r) => {
          const p = RUNS[idx[r.parent]];
          const x0 = laneX(p.lane), y0 = y(idx[r.parent]), x1 = laneX(r.lane), y1 = y(idx[r.id]);
          if (x0 === x1) return `M${x0} ${y0}V${y1}`;
          return `M${x0} ${y0}V${y1 - 8}Q${x0} ${y1} ${x0 + 8} ${y1}H${x1}`;
        })
        .map((d) => `<path d="${d}" fill="none" stroke="var(--border)" stroke-width="2"/>`)
        .join("");
      const rows = RUNS.map((r, i) => {
        const cy = y(i), on = r.id === this.sel;
        const col = r.lane === 1 ? "var(--accent-2)" : r.lane === 3 ? "var(--amber)" : "var(--accent)";
        return `<g data-run="${r.id}" tabindex="0" role="listitem" aria-label="${r.id}: ${T.sim} ${V[r.sim][1]}, ${T.bench} ${V[r.bench][1]}" style="cursor:pointer;outline:none">
          <rect x="0" y="${cy - rowH / 2 + 2}" width="${W}" height="${rowH - 4}" rx="6" fill="${on ? "var(--accent-2-soft)" : "transparent"}"/>
          <circle cx="${laneX(r.lane)}" cy="${cy}" r="${on ? 6 : 5}" fill="${col}" stroke="var(--surface)" stroke-width="2"/>
          <text x="${textX}" y="${cy - 2}" font-size="${narrow ? 12 : 13}" font-family="var(--mono)" fill="var(--text)" font-weight="${on ? 600 : 400}">${r.id}</text>
          <text x="${textX}" y="${cy + 12}" font-size="10.5" fill="var(--muted)" font-family="var(--sans)">${r.date}${narrow ? "" : " · " + r.action}</text>
          ${pill(simX, cy, r.sim)}${pill(benchX, cy, r.bench)}
        </g>`;
      }).join("");
      this.svg.innerHTML = `
        <text x="${simX}" y="14" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${T.sim}</text>
        <text x="${benchX}" y="14" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${T.bench}</text>
        ${edges}${rows}`;

      const r = RUNS[idx[this.sel]];
      const field = (k, v) => `<div><small style="display:block;color:var(--muted);font-size:.75rem">${T.f[k]}</small>${v}</div>`;
      this.querySelector('[data-v="detail"]').innerHTML = `
        <div style="background:var(--surface-2);border-radius:6px;padding:.7rem .8rem;margin-top:.5rem;display:grid;gap:.5rem">
          <b style="font-family:var(--mono)">${r.id}</b>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:.5rem;font-size:.85rem">
            ${field("date", r.date)}${field("action", r.action)}${field("iters", r.iters)}${field("sched", r.sched)}
          </div>
          <div style="font-size:.86rem">${field("asked", r.asked)}</div>
          <div style="font-size:.86rem;border-left:3px solid ${V[r.sim][0]};padding-left:.6rem">${field("simv", r.simT)}</div>
          <div style="font-size:.86rem;border-left:3px solid ${V[r.bench][0]};padding-left:.6rem">${field("benchv", r.benchT)}</div>
        </div>`;
    }
  }
  customElements.define("run-lineage", RunLineage);
})();
