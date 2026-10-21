// <recipe-tree example="-1"> : three questions to the four recipes for a new skill (Day 19).
// Recipes and their numbers: artifacts/jumper-field-guide.html ("Pick a recipe").
// That guide's own widget was a placeholder; the three questions here are a reading of its
// "Use it when" column, not a copy of the original.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "选配方：三个问题，四种结果",
        yes: "是",
        no: "否",
        reset: "重来",
        examples: "从 Microduck 阶梯里挑一个技能：",
        q: [
          { s: "是带花样的行走吗？", l: "在行走之上加一个命令就能描述它吗？比如边走边侧倾、下蹲、四处张望。" },
          { s: "姿态写得出来吗？", l: "有录下来的动作、几个关键姿态，或者一条手搓的轨迹吗？" },
          { s: "片段本身就是目标吗？", l: "还是你想要比片段更多：跳得更高、更远，片段只是个起点？" },
        ],
        leaves: [
          { s: "行走 + 一个命令", core: "加第二个命令，配它自己的跟踪奖励。", jumper: "姿态（posture）、五条腿走路", comm: "坐下/站起、踩高跷、10 拍舞", detail: "把完美跟踪记为 0，任何偏差记为负，停着不动的机器人就拿不到这份奖励。Jumper 上一个一动不动的机器人，能拿到行走奖励的 52%。" },
          { s: "奖励结果", core: "直接为那个数付钱，然后把它的作弊路子一条条堵上。", jumper: "摆荡（swing）、无参考跳跃", comm: "起身、踢、翻滚、大多数跳跃", detail: "每个数都有作弊办法。Jumper 的跳跃把高度定义为双脚和躯干中最低的那个，要求至少升高 1 cm，第二跳不再付钱；只为刷新本回合最好成绩付钱。" },
          { s: "照抄录像", core: "奖励和片段的接近程度，回合从片段里的随机位置开始。", jumper: "舞蹈、手势", comm: "装死（playdead）", detail: "容差按片段来定，让站着不动只拿到接近 0 的分（Jumper：0.006）。照抄的上限就是片段：模仿跳跃跳到 0.159 m，片段本身是 0.162 m。" },
          { s: "先抄，再淡出", core: "把片段同时喂进动作和奖励，然后随着结果奖励上升把它淡出。", jumper: "无参考跳跃：1000 次迭代前满额，3000 次时归零", comm: "beak-throw：淡到 0.1 的下限", detail: "片段必须引导动作，不能只进奖励；只放进奖励，得到的是一个下蹲。高度奖励要等淡出开始才放出来。" },
        ],
        lab: { core: "核心做法", jumper: "Jumper", comm: "Microduck 社区", detail: "最要紧的一点" },
        ex: [
          { s: "边走边侧倾、下蹲", a: [1] },
          { s: "能跳多高跳多高", a: [0, 0] },
          { s: "照三四个关键姿态点头", a: [0, 1, 1] },
          { s: "照手搓轨迹的小跳", a: [0, 1, 0] },
        ],
      }
    : {
        title: "Pick a recipe: three questions, four outcomes",
        yes: "Yes",
        no: "No",
        reset: "Start over",
        examples: "Or pick a skill from the Microduck ladder:",
        q: [
          { s: "Walking with a twist?", l: "Can a second command on top of walking describe it: lean, crouch, look around while walking?" },
          { s: "Can you write the poses?", l: "Do you have a recording, a few key poses, or a hand-made trajectory?" },
          { s: "Is the clip the goal?", l: "Or do you want more than the clip: higher, further, with the clip only as a start?" },
        ],
        leaves: [
          { s: "Walking plus a command", core: "Add a second command with its own tracking reward.", jumper: "posture, five-legged walking", comm: "sit/stand, stilts, the 10-beat dance", detail: "Score perfect tracking as 0 and anything worse as negative, so a parked robot cannot collect the reward. A motionless Jumper scored 52% of the walking reward." },
          { s: "Reward the outcome", core: "Pay that number, then close its cheats one by one.", jumper: "swing, reference-free jump", comm: "stand-up, kick, roll, most jumps", detail: "Every number has a cheat. Jumper's jump measured height as the lowest of the feet and body, required 1 cm of rise and paid nothing for a second jump; it pays only for beating the episode's best." },
          { s: "Copy a recording", core: "Reward closeness to the clip and start episodes at random points in it.", jumper: "dances, gestures", comm: "playdead", detail: "Set the tolerance from the clip so standing still scores near zero (0.006 on Jumper). Copying caps out at the clip: the imitation jump reached 0.159 m against the clip's 0.162 m." },
          { s: "Copy, then fade", core: "Feed the clip into the actions and the reward, then fade it out as the outcome reward rises.", jumper: "reference-free jump: full until iteration 1,000, gone by 3,000", comm: "beak-throw: fades to a 0.1 floor", detail: "The clip must steer the actions, not only the reward; reward alone produced a crouch. Hold the height reward back until the fade starts." },
        ],
        lab: { core: "Core move", jumper: "Jumper", comm: "Microduck community", detail: "The detail that matters most" },
        ex: [
          { s: "Lean or crouch while walking", a: [1] },
          { s: "The highest hop it can manage", a: [0, 0] },
          { s: "A nod copied from key poses", a: [0, 1, 1] },
          { s: "A small hop from a hand-made trajectory", a: [0, 1, 0] },
        ],
      };

  // Node graph. Answers: 1 = yes, 0 = no.
  const NEXT = [
    { 1: { leaf: 0 }, 0: { q: 1 } },
    { 0: { leaf: 1 }, 1: { q: 2 } },
    { 1: { leaf: 2 }, 0: { leaf: 3 } },
  ];
  const walk = (answers) => {
    let q = 0;
    const path = [0];
    for (const a of answers) {
      const n = NEXT[q][a];
      if (n.leaf !== undefined) return { path, leaf: n.leaf };
      q = n.q;
      path.push(q);
    }
    return { path, leaf: null };
  };
  const ANSWERS_FOR_LEAF = [[1], [0, 0], [0, 1, 1], [0, 1, 0]];

  // Rough wrap by character budget (CJK characters count double).
  const wrap = (s, px, fs) => {
    const cw = (ch) => (/[　-鿿＀-￯]/.test(ch) ? fs : fs * 0.56);
    const words = ZH ? Array.from(s) : s.split(" ");
    const lines = [];
    let line = "", w = 0;
    for (const word of words) {
      const piece = ZH ? word : (line ? " " : "") + word;
      const pw = Array.from(piece).reduce((t, c) => t + cw(c), 0);
      if (w + pw > px && line) {
        lines.push(line);
        line = ZH ? word : word;
        w = Array.from(line).reduce((t, c) => t + cw(c), 0);
      } else {
        line += piece;
        w += pw;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  class RecipeTree extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const ex = Number(this.getAttribute("example") ?? -1);
      this.answers = ex >= 0 && T.ex[ex] ? T.ex[ex].a.slice() : [];
      this.innerHTML = `
        <div class="widget recipe-tree">
          <p class="widget-title">${T.title}</p>
          <svg role="img" aria-label="${T.title}"></svg>
          <div data-v="panel" aria-live="polite" style="margin-top:.75rem"></div>
          <p class="note" style="margin-top:.9rem">${T.examples}</p>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.4rem">
            ${T.ex.map((e, i) => `<button type="button" class="button secondary" data-ex="${i}" style="padding:.3rem .6rem;font-size:.8rem">${e.s}</button>`).join("")}
          </div>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll("[data-ex]").forEach((b) =>
        b.addEventListener("click", () => { this.answers = T.ex[Number(b.dataset.ex)].a.slice(); this.render(); })
      );
      this.svg.addEventListener("click", (e) => {
        const n = e.target.closest("[data-node]");
        if (!n) return;
        const [kind, idx] = n.dataset.node.split(":");
        const i = Number(idx);
        if (kind === "leaf") this.answers = ANSWERS_FOR_LEAF[i].slice();
        else {
          const { path } = walk(this.answers);
          const pos = path.indexOf(i);
          if (pos >= 0) this.answers = this.answers.slice(0, pos);
        }
        this.render();
      });
      this.svg.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-node]")) {
          e.preventDefault();
          e.target.closest("[data-node]").dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      });
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    render() {
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 480;
      const fs = narrow ? 11.5 : 12.5;
      const gap = narrow ? 34 : 60, pad = 2;
      const colW = (W - 2 * pad - gap) / 2;
      const rowH = narrow ? 64 : 62, nodeH = narrow ? 48 : 44;
      const H = 4 * rowH + 4;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const { path, leaf } = walk(this.answers);
      const qx = pad, lx = pad + colW + gap;
      const rowY = (r) => 4 + r * rowH;
      // Question q sits on row q; leaf i on row i.
      const onPath = (q) => path.includes(q);
      const edgeOn = (from, ans) => {
        const pos = path.indexOf(from);
        return pos >= 0 && this.answers[pos] === ans;
      };
      const node = (x, y, w, h, label, kind, i, active, current) => {
        const lines = wrap(label, w - 16, fs).slice(0, 2);
        const ty = y + h / 2 - ((lines.length - 1) * (fs + 2)) / 2 + fs * 0.35;
        return `<g data-node="${kind}:${i}" role="button" tabindex="0" style="cursor:pointer" aria-label="${label}">
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${kind === "leaf" ? 8 : 4}" fill="${active ? (kind === "leaf" ? "var(--accent-soft)" : "var(--accent-2-soft)") : "var(--surface-2)"}" stroke="${current ? "var(--accent)" : active ? "var(--accent-2)" : "var(--border)"}" stroke-width="${current ? 2.5 : 1.2}"/>
          ${lines.map((l, k) => `<text x="${x + w / 2}" y="${ty + k * (fs + 2)}" text-anchor="middle" font-size="${fs}" fill="var(--text)" ${kind === "leaf" ? 'font-weight="600"' : ""}>${l}</text>`).join("")}
        </g>`;
      };
      const lbl = (x, y, t, on) => `<text x="${x}" y="${y}" font-size="10.5" fill="${on ? "var(--accent)" : "var(--muted)"}" text-anchor="middle" font-family="var(--mono)">${t}</text>`;
      const line = (d, on) => `<path d="${d}" fill="none" stroke="${on ? "var(--accent)" : "var(--border)"}" stroke-width="${on ? 2.5 : 1.3}"/>`;
      let g = "";
      const mid = (r) => rowY(r) + nodeH / 2;
      // Edges: q0 yes -> leaf0; q0 no -> q1; q1 no -> leaf1; q1 yes -> q2; q2 yes -> leaf2; q2 no -> leaf3
      const horiz = (r, ans, txt) => {
        const on = edgeOn(r, ans);
        return line(`M${qx + colW} ${mid(r)} H${lx}`, on) + lbl(qx + colW + gap / 2, mid(r) - 5, txt, on);
      };
      const down = (r, ans, txt) => {
        const on = edgeOn(r, ans);
        const x = qx + colW / 2;
        return line(`M${x} ${rowY(r) + nodeH} V${rowY(r + 1)}`, on) + `<text x="${x + 6}" y="${rowY(r) + nodeH + (rowH - nodeH) / 2 + 4}" font-size="10.5" fill="${on ? "var(--accent)" : "var(--muted)"}" font-family="var(--mono)">${txt}</text>`;
      };
      g += horiz(0, 1, T.yes) + down(0, 0, T.no);
      g += horiz(1, 0, T.no) + down(1, 1, T.yes);
      g += horiz(2, 1, T.yes);
      {
        const on = edgeOn(2, 0);
        const x = qx + colW / 2;
        g += line(`M${x} ${rowY(2) + nodeH} V${mid(3)} H${lx}`, on) + lbl(qx + colW + gap / 2, mid(3) - 5, T.no, on);
      }
      for (let q = 0; q < 3; q++) g += node(qx, rowY(q), colW, nodeH, T.q[q].s, "q", q, onPath(q), leaf === null && path[path.length - 1] === q);
      for (let i = 0; i < 4; i++) g += node(lx, rowY(i), colW, nodeH, T.leaves[i].s, "leaf", i, leaf === i, leaf === i);
      this.svg.innerHTML = g;

      const panel = this.querySelector('[data-v="panel"]');
      if (leaf === null) {
        const q = path[path.length - 1];
        panel.innerHTML = `<p style="margin:0 0 .5rem"><b>${T.q[q].s}</b> ${T.q[q].l}</p>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button type="button" class="button" data-a="1">${T.yes}</button>
            <button type="button" class="button secondary" data-a="0">${T.no}</button>
            ${this.answers.length ? `<button type="button" class="button secondary" data-a="r">${T.reset}</button>` : ""}
          </div>`;
      } else {
        const L = T.leaves[leaf];
        panel.innerHTML = `<p style="margin:0 0 .4rem;font-weight:600">${L.s}</p>
          <div class="readout" style="margin-top:.25rem">
            <div><small>${T.lab.core}</small>${L.core}</div>
            <div><small>${T.lab.jumper}</small>${L.jumper}</div>
            <div><small>${T.lab.comm}</small>${L.comm}</div>
          </div>
          <p class="note"><b>${T.lab.detail}:</b> ${L.detail}</p>
          <div style="margin-top:.6rem"><button type="button" class="button secondary" data-a="r">${T.reset}</button></div>`;
      }
      panel.querySelectorAll("[data-a]").forEach((b) =>
        b.addEventListener("click", () => {
          if (b.dataset.a === "r") this.answers = [];
          else this.answers.push(Number(b.dataset.a));
          this.render();
        })
      );
    }
  }
  customElements.define("recipe-tree", RecipeTree);
})();
