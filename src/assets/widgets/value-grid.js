// <value-grid gamma="0.9" mode="eval" view="v"> : Day 1's mouse grid, solved one sweep at a time (Day 2).
// mode="eval": iterative policy evaluation of the coin-toss policy (average over the four moves).
// mode="opt":  value iteration (best move). view="v" shows V as a heatmap, view="q" splits each cell into
// four triangles, one Q(s, a) per move. Sweeps are synchronous: every cell reads the previous sweep's V.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "网格上的价值迭代，一次扫一遍",
        sweep: "扫一遍",
        run: "扫到收敛",
        reset: "全部清零",
        gamma: "折扣 γ",
        modeEval: "评估抛硬币策略",
        modeOpt: "价值迭代（取最大）",
        viewV: "看 V",
        viewQ: "看 Q",
        k: "已扫遍数 k",
        delta: "本遍最大变化 Δ",
        vstart: "起点的 V",
        start: "起点",
        legend: "老鼠从左下角出发；黄色是奶酪（+10），红色是陷阱（−10），其余每走一步 −1。撞墙原地不动。这里去掉了第 1 天的 20 步时间上限。",
        noteEval: "每个格子的新 V = 四个动作的 r + γ·V(s′) 取平均：这是在给抛硬币的策略打分。",
        noteOpt: "每个格子的新 V = 四个动作的 r + γ·V(s′) 取最大：边评估边改进。",
        noteQ: "每个三角形是 Q(s, a) = r + γ·V(s′)，用的是当前这一遍的 V。V 就是这四个数的平均（评估）或最大值（价值迭代）。",
        fresh: "V 全是 0。按“扫一遍”。",
        moving: (k, d) => `第 ${k} 遍：最大的变化是 ${d}。描边的格子这一遍变了。`,
        done: (k) => `第 ${k} 遍之后几乎不再变化（Δ < 0.0001）：V 收敛了。`,
        arrows: "箭头：按当前 Q 贪心地走。",
      }
    : {
        title: "Value iteration on the grid, one sweep at a time",
        sweep: "One sweep",
        run: "Sweep to convergence",
        reset: "Reset to zero",
        gamma: "Discount γ",
        modeEval: "Evaluate the coin toss",
        modeOpt: "Value iteration (max)",
        viewV: "Show V",
        viewQ: "Show Q",
        k: "Sweeps k",
        delta: "Biggest change Δ",
        vstart: "V at the start",
        start: "start",
        legend: "The mouse starts bottom left. Yellow is the cheese (+10), red is the trap (−10), every other move costs −1, and bumping a wall means staying put. Day 1's 20-step limit is dropped here.",
        noteEval: "Each cell's new V is the average over the four moves of r + γ·V(s′): a score for the coin-toss policy.",
        noteOpt: "Each cell's new V is the best of the four moves' r + γ·V(s′): evaluating and improving at once.",
        noteQ: "Each triangle is Q(s, a) = r + γ·V(s′), built from the current V. V is the average of the four (evaluate) or the largest (value iteration).",
        fresh: "Every V starts at 0. Press One sweep.",
        moving: (k, d) => `Sweep ${k}: the biggest change was ${d}. Outlined cells moved this sweep.`,
        done: (k) => `After sweep ${k} nothing moves any more (Δ < 0.0001): V has converged.`,
        arrows: "Arrows: the greedy move under the current Q.",
      };

  const COLS = 4, ROWS = 3;
  const START = 8, CHEESE = 3, TRAP = 7; // index = row * COLS + col
  const TERMINAL = { [CHEESE]: 10, [TRAP]: -10 };
  const MOVES = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up, right, down, left
  const TOL = 1e-4, MAX_SWEEPS = 500;

  const next = (s, a) => {
    const c = (s % COLS) + MOVES[a][0], r = Math.floor(s / COLS) + MOVES[a][1];
    const n = c < 0 || c >= COLS || r < 0 || r >= ROWS ? s : r * COLS + c; // bump: stay put
    return { n, r: n in TERMINAL ? TERMINAL[n] : -1 };
  };
  const qOf = (V, s, g) => MOVES.map((_, a) => { const t = next(s, a); return t.r + g * V[t.n]; });

  class ValueGrid extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        g: Number(this.getAttribute("gamma") ?? 0.9),
        mode: this.getAttribute("mode") === "opt" ? "opt" : "eval",
        view: this.getAttribute("view") === "q" ? "q" : "v",
      };
      this.innerHTML = `
        <div class="widget value-grid">
          <p class="widget-title">${T.title}</p>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;margin-bottom:.75rem">
            <span class="seg" role="group"><button type="button" data-mode="eval">${T.modeEval}</button><button type="button" data-mode="opt">${T.modeOpt}</button></span>
            <span class="seg" role="group"><button type="button" data-view="v">${T.viewV}</button><button type="button" data-view="q">${T.viewQ}</button></span>
          </div>
          <svg role="img" aria-label="${T.title}"></svg>
          <p class="note">${T.legend}</p>
          <div class="widget-controls">
            <label>${T.gamma} <output data-o="g"></output><input type="range" data-k="g" min="0.5" max="1" step="0.01"></label>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center">
            <button type="button" class="button" data-act="sweep">${T.sweep}</button>
            <button type="button" class="button secondary" data-act="run">${T.run}</button>
            <button type="button" class="button secondary" data-act="reset">${T.reset}</button>
          </div>
          <div class="readout">
            <div><small>${T.k}</small><b data-v="k"></b></div>
            <div><small>${T.delta}</small><b data-v="d"></b></div>
            <div><small>${T.vstart}</small><b data-v="vs"></b></div>
          </div>
          <p class="note" data-v="status" aria-live="polite"></p>
          <p class="note" data-v="rule"></p>
        </div>`;
      this.svg = this.querySelector("svg");
      const inp = this.querySelector('input[data-k="g"]');
      inp.value = this.s.g;
      inp.addEventListener("input", () => { this.s.g = Number(inp.value); this.reset(); });
      this.querySelectorAll("[data-mode]").forEach((b) =>
        b.addEventListener("click", () => { this.s.mode = b.dataset.mode; this.reset(); }));
      this.querySelectorAll("[data-view]").forEach((b) =>
        b.addEventListener("click", () => { this.s.view = b.dataset.view; this.render(); }));
      this.querySelector('[data-act="sweep"]').addEventListener("click", () => { this.stop(); this.sweep(); this.render(); });
      this.querySelector('[data-act="run"]').addEventListener("click", () => this.run());
      this.querySelector('[data-act="reset"]').addEventListener("click", () => this.reset());
      this.reset();
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
    }

    reset() {
      this.stop();
      this.V = new Array(COLS * ROWS).fill(0);
      this.k = 0;
      this.d = null;
      this.changed = new Set();
      this.render();
    }

    sweep() {
      if (this.d !== null && this.d < TOL) return;
      const { g, mode } = this.s;
      const Vn = this.V.slice();
      let d = 0;
      this.changed = new Set();
      for (let s = 0; s < COLS * ROWS; s++) {
        if (s in TERMINAL) continue; // the episode is over there: V stays 0
        const q = qOf(this.V, s, g);
        Vn[s] = mode === "opt" ? Math.max(...q) : q.reduce((a, b) => a + b, 0) / q.length;
        const ch = Math.abs(Vn[s] - this.V[s]);
        if (ch > 5e-5) this.changed.add(s);
        d = Math.max(d, ch);
      }
      this.V = Vn;
      this.k++;
      this.d = d;
    }

    stop() {
      clearTimeout(this._timer);
      this._timer = null;
    }

    run() {
      this.stop();
      const tick = () => {
        this.sweep();
        this.render();
        if (this.d >= TOL && this.k < MAX_SWEEPS) this._timer = setTimeout(tick, this.k < 12 ? 220 : 25);
        else this._timer = null;
      };
      tick();
    }

    render() {
      const { g, mode, view } = this.s;
      const W = Math.round(this.svg.clientWidth) || 520;
      const cell = W / COLS, H = Math.round(cell * ROWS);
      if (this._w !== W) {
        this._w = W;
        this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      }
      const narrow = cell < 110;
      const fmt = (v, dp) => (Math.abs(v) < 0.005 ? "0" : v.toFixed(dp)).replace("-", "−");
      const tint = (v) => {
        const p = Math.min(1, Math.abs(v) / 10) * 55;
        return `color-mix(in srgb, ${v >= 0 ? "var(--good)" : "var(--bad)"} ${p.toFixed(0)}%, var(--surface))`;
      };
      let out = "";
      for (let s = 0; s < COLS * ROWS; s++) {
        const x = (s % COLS) * cell, y = Math.floor(s / COLS) * cell;
        const cx = x + cell / 2, cy = y + cell / 2;
        if (s in TERMINAL) {
          const fill = s === CHEESE ? "var(--amber-soft)" : "color-mix(in srgb, var(--bad) 30%, var(--surface))";
          const col = s === CHEESE ? "var(--amber)" : "var(--bad)";
          out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fill}" stroke="var(--border)"/>
            <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="17" font-weight="600" fill="${col}" font-family="var(--mono)">${s === CHEESE ? "+10" : "−10"}</text>`;
          continue;
        }
        const q = qOf(this.V, s, g);
        const best = Math.max(...q);
        if (view === "v") {
          out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${tint(this.V[s])}" stroke="var(--border)"/>
            <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="${narrow ? 14 : 18}" font-weight="500" fill="var(--text)" font-family="var(--mono)">${fmt(this.V[s], 2)}</text>`;
          if (this.k > 0) {
            // greedy moves: a small chevron at the edge the move goes through, clear of the number
            q.forEach((v, a) => {
              if (best - v > 1e-6) return;
              const [dx, dy] = MOVES[a];
              const tipX = cx + dx * (cell / 2 - 3), tipY = cy + dy * (cell / 2 - 3);
              const inset = narrow ? 9 : 12;
              const bX = cx + dx * (cell / 2 - inset), bY = cy + dy * (cell / 2 - inset);
              const w = narrow ? 4.5 : 6, px = -dy * w, py = dx * w; // perpendicular half-width
              out += `<polygon points="${tipX},${tipY} ${bX + px},${bY + py} ${bX - px},${bY - py}" fill="var(--accent-2)"/>`;
            });
          }
        } else {
          const corners = [[x, y], [x + cell, y], [x + cell, y + cell], [x, y + cell]];
          q.forEach((v, a) => {
            // triangle for move a: up uses the top edge (corners 0,1), right (1,2), down (2,3), left (3,0)
            const e1 = corners[a], e2 = corners[(a + 1) % 4];
            const isBest = this.k > 0 && best - v <= 1e-6;
            out += `<polygon points="${cx},${cy} ${e1[0]},${e1[1]} ${e2[0]},${e2[1]}" fill="${tint(v)}" stroke="var(--border)" stroke-width="${isBest ? 0 : 0.5}"/>`;
          });
          q.forEach((v, a) => {
            const [dx, dy] = MOVES[a];
            const isBest = this.k > 0 && best - v <= 1e-6;
            const tx = cx + dx * cell * (narrow ? 0.26 : 0.3), ty = cy + dy * cell * 0.31 + 4;
            out += `<text x="${tx}" y="${ty}" text-anchor="middle" font-size="${narrow ? 10 : 12}" font-weight="${isBest ? 700 : 400}" fill="${isBest ? "var(--text)" : "var(--muted)"}" font-family="var(--mono)">${fmt(v, narrow ? 1 : 2)}</text>`;
          });
          out += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="var(--border)"/>`;
        }
        if (s === START && !(view === "q" && narrow)) out += `<text x="${x + 4}" y="${view === "q" ? y + 11 : y + cell - 6}" font-size="10" fill="var(--muted)" font-family="var(--sans)">${T.start}</text>`;
        if (this.changed.has(s)) out += `<rect x="${x + 2}" y="${y + 2}" width="${cell - 4}" height="${cell - 4}" fill="none" stroke="var(--accent)" stroke-width="2" rx="3"/>`;
      }
      this.svg.innerHTML = out;

      this.querySelector('[data-o="g"]').textContent = g.toFixed(2);
      this.querySelector('[data-v="k"]').textContent = String(this.k);
      this.querySelector('[data-v="d"]').textContent = this.d === null ? "–" : this.d.toFixed(4);
      this.querySelector('[data-v="vs"]').textContent = fmt(this.V[START], 2);
      const st = this.querySelector('[data-v="status"]');
      st.textContent = this.k === 0 ? T.fresh : this.d < TOL ? T.done(this.k) : T.moving(this.k, this.d.toFixed(4));
      this.querySelector('[data-v="rule"]').textContent =
        (view === "q" ? T.noteQ : mode === "opt" ? T.noteOpt : T.noteEval) + (view === "v" && this.k > 0 ? " " + T.arrows : "");
      this.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
      this.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    }
  }
  customElements.define("value-grid", ValueGrid);
})();
