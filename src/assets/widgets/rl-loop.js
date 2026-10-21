// <rl-loop gamma="0.9" max-steps="20">
// A toy grid world walked one transition at a time: S_t -> A_t -> R_{t+1}, S_{t+1}.
// Highlights the active arrow of the agent-environment loop, logs each transition,
// and fills in G_t backwards once the episode ends. Random policy.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const COLS = 4, ROWS = 3;
  const START = [0, 2], CHEESE = [3, 0], TRAP = [3, 1];
  const R_STEP = -1, R_CHEESE = 10, R_TRAP = -10;
  const ACTIONS = [
    { s: "↑", d: [0, -1] },
    { s: "→", d: [1, 0] },
    { s: "↓", d: [0, 1] },
    { s: "←", d: [-1, 0] },
  ];
  const L = {
    en: {
      title: "The RL loop, one transition at a time",
      agent: "Agent",
      env: "Environment",
      step: "Step",
      run: "Run to end",
      reset: "Reset",
      gamma: "Discount γ",
      g0: "G₀ so far",
      t: "Step t",
      status: "Status",
      running: "running",
      term: "terminated",
      trunc: "truncated",
      legend: "Mouse = agent, yellow = cheese (+10), red = trap (−10), every move costs −1.",
      ph0: (s) => `The environment hands the agent the state Sₜ = ${s}.`,
      ph1: (a) => `The agent picks Aₜ = ${a}. The policy is a coin toss for now.`,
      ph2: (r, s) => `The environment answers with Rₜ₊₁ = ${r} and Sₜ₊₁ = ${s}.`,
      endT: (what) => `Episode over: ${what}. Now every Gₜ can be filled in, walking backwards from the end.`,
      endTr: (n) => `Time limit of ${n} steps. The episode was cut, not finished: each Gₜ is missing the rewards after the cut (the "+ ?").`,
      cheese: "found the cheese",
      trap: "walked into the trap",
      pending: "Gₜ needs rewards that have not happened yet, so the column stays empty until the episode ends.",
      start: "Press Step to walk the loop.",
    },
    zh: {
      title: "强化学习循环，一次走一步",
      agent: "智能体",
      env: "环境",
      step: "下一步",
      run: "跑到结束",
      reset: "重置",
      gamma: "折扣 γ",
      g0: "目前的 G₀",
      t: "步数 t",
      status: "状态",
      running: "进行中",
      term: "终止",
      trunc: "截断",
      legend: "老鼠是智能体，黄色是奶酪（+10），红色是陷阱（−10），每走一步扣 1 分。",
      ph0: (s) => `环境把状态 Sₜ = ${s} 交给智能体。`,
      ph1: (a) => `智能体选了动作 Aₜ = ${a}。现在的策略就是抛硬币。`,
      ph2: (r, s) => `环境回给它奖励 Rₜ₊₁ = ${r} 和新状态 Sₜ₊₁ = ${s}。`,
      endT: (what) => `回合结束：${what}。现在每个 Gₜ 都能从结尾往回算出来了。`,
      endTr: (n) => `到了 ${n} 步的时间上限。回合是被截断的，不是自然结束：每个 Gₜ 都少了截断之后的奖励（也就是那个“+ ?”）。`,
      cheese: "吃到了奶酪",
      trap: "掉进了陷阱",
      pending: "Gₜ 要用到还没发生的奖励，所以回合结束前这一列只能空着。",
      start: "点“下一步”，沿着循环走一圈。",
    },
  };
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const fmtS = (p) => `(${p[0]},${p[1]})`;
  const fmtR = (r) => (r > 0 ? "+" + r : r < 0 ? "−" + Math.abs(r) : "0");
  const fmtG = (g) => (g < 0 ? "−" + Math.abs(g).toFixed(2) : g.toFixed(2));
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };

  customElements.define(
    "rl-loop",
    class extends HTMLElement {
      connectedCallback() {
        if (this._built) return;
        this._built = true;
        this.t = L[document.documentElement.lang.startsWith("zh") ? "zh" : "en"];
        const t = this.t;
        const g0 = parseFloat(this.getAttribute("gamma"));
        this.gamma = Number.isFinite(g0) ? Math.min(1, Math.max(0, g0)) : 0.9;
        this.maxSteps = Math.max(3, parseInt(this.getAttribute("max-steps") ?? "20", 10) || 20);
        this.uid = Math.random().toString(36).slice(2, 8);

        const wrap = document.createElement("div");
        wrap.className = "widget";
        wrap.innerHTML = `
          <p class="widget-title">${t.title}</p>
          <div data-o="figs" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.75rem;align-items:center"></div>
          <p class="note" data-o="legend">${t.legend}</p>
          <p data-o="cap" style="min-height:2.6em;margin:0.6rem 0 0.4rem"></p>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center">
            <button type="button" class="button" data-b="step">${t.step}</button>
            <button type="button" class="button secondary" data-b="run">${t.run}</button>
            <button type="button" class="button secondary" data-b="reset">${t.reset}</button>
          </div>
          <div class="widget-controls">
            <label for="rg-${this.uid}">${t.gamma} <output class="num" data-o="g"></output>
              <input id="rg-${this.uid}" type="range" min="0" max="1" step="0.01" data-i="g"></label>
          </div>
          <div class="readout">
            <div><small>${t.t}</small><b data-o="tt"></b></div>
            <div><small>${t.g0}</small><b data-o="G0"></b></div>
            <div><small>${t.status}</small><b data-o="st"></b></div>
          </div>
          <div style="max-height:13rem;overflow:auto;margin-top:0.75rem;border:1px solid var(--border);border-radius:6px">
            <table style="width:100%;border-collapse:collapse;font:0.8rem var(--mono);text-align:center">
              <thead><tr style="position:sticky;top:0;background:var(--surface-2)">
                <th style="padding:0.3rem">t</th><th>S<sub>t</sub></th><th>A<sub>t</sub></th>
                <th>R<sub>t+1</sub></th><th>S<sub>t+1</sub></th><th>G<sub>t</sub></th></tr></thead>
              <tbody data-o="log"></tbody>
            </table>
          </div>
          <p class="note" data-o="pending"></p>`;
        this.appendChild(wrap);
        this.q = (s) => wrap.querySelector(s);
        this.buildLoop();
        this.buildGrid();
        const gIn = this.q('[data-i="g"]');
        gIn.value = this.gamma;
        gIn.addEventListener("input", () => {
          this.gamma = parseFloat(gIn.value);
          this.render();
        });
        this.q('[data-b="step"]').addEventListener("click", () => this.advance());
        this.q('[data-b="run"]').addEventListener("click", () => {
          let guard = 4 * this.maxSteps;
          while (!this.done && guard--) this.advance(true);
          this.render();
        });
        this.q('[data-b="reset"]').addEventListener("click", () => this.reset());
        this.reset();
      }

      // ---- drawing -------------------------------------------------------
      buildLoop() {
        const s = el("svg", { viewBox: "0 0 320 160", role: "img", "aria-label": `${this.t.agent} / ${this.t.env}` });
        const defs = el("defs", {}, s);
        for (const [id, col] of [["m", "var(--muted)"], ["a", "var(--accent)"]]) {
          const m = el("marker", { id: `${id}-${this.uid}`, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
          el("path", { d: "M0 0L10 5L0 10z", fill: col }, m);
        }
        const box = (y, label) => {
          el("rect", { x: 110, y, width: 100, height: 36, rx: 6, fill: "var(--surface-2)", stroke: "var(--border)" }, s);
          const tx = el("text", { x: 160, y: y + 22, "text-anchor": "middle", "font-size": 14, fill: "var(--text)" }, s);
          tx.textContent = label;
        };
        box(8, this.t.agent);
        box(116, this.t.env);
        const arrow = (d, lx, ly, label, anchor) => {
          const p = el("path", { d, fill: "none", "stroke-width": 2 }, s);
          const tx = el("text", { x: lx, y: ly, "text-anchor": anchor, "font-size": 14, "font-family": "var(--mono)" }, s);
          tx.textContent = label;
          return { p, tx };
        };
        this.arrows = {
          A: arrow("M210 26 H272 V134 H214", 278, 84, "Aₜ", "start"),
          S: arrow("M110 142 H40 V26 H106", 34, 84, "Sₜ₊₁", "end"),
          R: arrow("M110 126 H76 V40 H106", 82, 84, "Rₜ₊₁", "start"),
        };
        this.q('[data-o="figs"]').appendChild(s);
      }

      buildGrid() {
        const C = 40;
        const s = el("svg", { viewBox: `0 0 ${COLS * C + 2} ${ROWS * C + 2}`, role: "img", "aria-label": "grid" });
        s.style.maxWidth = "220px";
        s.style.margin = "0 auto";
        const gm = el("marker", { id: `i-${this.uid}`, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }, el("defs", {}, s));
        el("path", { d: "M0 0L10 5L0 10z", fill: "var(--accent-2)" }, gm);
        const g = el("g", { transform: "translate(1 1)" }, s);
        for (let r = 0; r < ROWS; r++)
          for (let c = 0; c < COLS; c++) {
            const p = [c, r];
            const fill = same(p, CHEESE) ? "var(--amber-soft)" : same(p, TRAP) ? "var(--bad)" : "var(--surface)";
            el("rect", { x: c * C, y: r * C, width: C, height: C, fill, "fill-opacity": same(p, TRAP) ? 0.25 : 1, stroke: "var(--border)" }, g);
            const lab = el("text", { x: c * C + 3, y: r * C + 10, "font-size": 7, fill: "var(--muted)", "font-family": "var(--mono)" }, g);
            lab.textContent = fmtS(p);
          }
        // cheese wedge
        const [cx, cy] = [CHEESE[0] * C + 20, CHEESE[1] * C + 22];
        el("path", { d: `M${cx - 11} ${cy + 8} L${cx + 11} ${cy + 8} L${cx + 11} ${cy - 6} Z`, fill: "var(--amber)" }, g);
        // trap cross
        const [tx, ty] = [TRAP[0] * C + 20, TRAP[1] * C + 22];
        el("path", { d: `M${tx - 9} ${ty - 9} L${tx + 9} ${ty + 9} M${tx + 9} ${ty - 9} L${tx - 9} ${ty + 9}`, stroke: "var(--bad)", "stroke-width": 3, "stroke-linecap": "round" }, g);
        // intended move arrow and the agent
        this.intent = el("path", { fill: "none", stroke: "var(--accent-2)", "stroke-width": 2, "stroke-dasharray": "3 2", "marker-end": `url(#i-${this.uid})` }, g);
        this.mouse = el("g", {}, g);
        el("circle", { cx: 0, cy: 0, r: 10, fill: "var(--accent-2)" }, this.mouse);
        el("circle", { cx: -7, cy: -8, r: 4, fill: "var(--accent-2)" }, this.mouse);
        el("circle", { cx: 7, cy: -8, r: 4, fill: "var(--accent-2)" }, this.mouse);
        el("circle", { cx: 0, cy: 3, r: 1.8, fill: "var(--surface)" }, this.mouse);
        this.C = C;
        this.q('[data-o="figs"]').appendChild(s);
      }

      // ---- the loop ------------------------------------------------------
      reset() {
        this.pos = START.slice();
        this.tStep = 0;
        this.phase = -1; // -1 idle, 0 observe, 1 act, 2 env answered
        this.rows = [];
        this.action = null;
        this.done = null; // null | "term" | "trunc"
        this.endWhat = "";
        this.caption = this.t.start;
        this.render();
      }

      advance(quiet) {
        if (this.done) return;
        const t = this.t;
        this.phase = this.phase === 2 || this.phase === -1 ? 0 : this.phase + 1;
        if (this.phase === 0) {
          this.action = null;
          this.caption = t.ph0(fmtS(this.pos));
        } else if (this.phase === 1) {
          this.action = ACTIONS[Math.floor(Math.random() * 4)];
          this.caption = t.ph1(this.action.s);
        } else {
          const s = this.pos.slice();
          const n = [s[0] + this.action.d[0], s[1] + this.action.d[1]];
          const next = n[0] < 0 || n[0] >= COLS || n[1] < 0 || n[1] >= ROWS ? s : n; // bump into a wall: stay put
          let r = R_STEP;
          if (same(next, CHEESE)) r = R_CHEESE;
          if (same(next, TRAP)) r = R_TRAP;
          this.rows.push({ t: this.tStep, s, a: this.action.s, r, s1: next });
          this.pos = next;
          this.tStep += 1;
          this.caption = t.ph2(fmtR(r), fmtS(next));
          if (same(next, CHEESE) || same(next, TRAP)) {
            this.done = "term";
            this.caption += " " + t.endT(same(next, CHEESE) ? t.cheese : t.trap);
          } else if (this.tStep >= this.maxSteps) {
            this.done = "trunc";
            this.caption += " " + t.endTr(this.maxSteps);
          }
        }
        if (!quiet) this.render();
      }

      render() {
        const t = this.t, g = this.gamma;
        this.q('[data-o="g"]').textContent = g.toFixed(2);
        this.q('[data-o="cap"]').textContent = this.caption;
        this.q('[data-o="tt"]').textContent = this.tStep;
        const G0 = this.rows.reduce((acc, row, i) => acc + Math.pow(g, i) * row.r, 0);
        this.q('[data-o="G0"]').textContent = fmtG(G0) + (this.done === "term" ? "" : " + ?");
        this.q('[data-o="st"]').textContent = this.done ? t[this.done] : t.running;
        this.q('[data-o="pending"]').textContent = this.done ? "" : t.pending;

        // backward pass for G_t, only once the episode is over
        const G = new Array(this.rows.length).fill(null);
        if (this.done) {
          let acc = 0;
          for (let i = this.rows.length - 1; i >= 0; i--) {
            acc = this.rows[i].r + g * acc;
            G[i] = acc;
          }
        }
        const tail = this.done === "trunc" ? " + ?" : "";
        this.q('[data-o="log"]').innerHTML = this.rows
          .map(
            (row, i) =>
              `<tr style="border-top:1px solid var(--border)"><td style="padding:0.25rem">${row.t}</td><td>${fmtS(row.s)}</td><td>${row.a}</td>` +
              `<td style="color:${row.r > 0 ? "var(--good)" : row.r < -1 ? "var(--bad)" : "inherit"}">${fmtR(row.r)}</td>` +
              `<td>${fmtS(row.s1)}</td><td>${G[i] === null ? "?" : fmtG(G[i]) + tail}</td></tr>`
          )
          .join("");
        const box = this.q('[data-o="log"]').closest("div");
        box.scrollTop = box.scrollHeight;

        // loop highlights
        const on = { 0: ["S"], 1: ["A"], 2: ["R", "S"] }[this.phase] || [];
        for (const [k, { p, tx }] of Object.entries(this.arrows)) {
          const a = on.includes(k);
          p.setAttribute("stroke", a ? "var(--accent)" : "var(--muted)");
          p.setAttribute("stroke-width", a ? 3 : 1.5);
          p.setAttribute("stroke-opacity", a ? 1 : 0.6);
          p.setAttribute("marker-end", `url(#${a ? "a" : "m"}-${this.uid})`);
          tx.setAttribute("fill", a ? "var(--accent)" : "var(--muted)");
          tx.setAttribute("font-weight", a ? 600 : 400);
        }
        this.arrows.S.tx.textContent = this.phase === 0 ? "Sₜ" : "Sₜ₊₁";

        // grid
        const C = this.C;
        const [x, y] = [this.pos[0] * C + 20, this.pos[1] * C + 24];
        this.mouse.setAttribute("transform", `translate(${x} ${y})`);
        if (this.phase === 1 && this.action) {
          const d = this.action.d;
          this.intent.setAttribute("d", `M${x + d[0] * 8} ${y - 4 + d[1] * 8} L${x + d[0] * 30} ${y - 4 + d[1] * 30}`);
          this.intent.style.display = "";
        } else this.intent.style.display = "none";
      }
    }
  );
})();
