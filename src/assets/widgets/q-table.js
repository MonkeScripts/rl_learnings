// <q-table eps="0.1" episodes="500" seed="5" compare> : tabular Q-learning (and SARSA) on CliffWalking (Day 3).
// Without `compare` only the Q-learning panel is shown. Training is re-run from scratch with a
// seeded RNG whenever a slider moves, so the same settings always give the same table.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "Q 表探索器：悬崖行走（CliffWalking）",
        eps: "探索率 ε",
        episodes: "训练回合数",
        seed: "换一个随机种子",
        seedv: (n) => `种子 ${n}`,
        q: "Q-learning（异策略，目标用 max）",
        sarsa: "SARSA（同策略，目标用实际的下一个动作）",
        ret: "训练中的回报（最近 100 回合平均）",
        falls: "训练中掉下悬崖次数",
        path: "贪心路径",
        steps: (n) => `${n} 步到终点`,
        fell: "掉下悬崖",
        loop: "原地打转：表还在抖，多训练几回合或换个种子",
        none: "还没训练",
        cliff: "悬崖  −100，回到起点",
        actions: ["上", "右", "下", "左"],
        cellHead: (r, c) => `选中格子（第 ${r} 行，第 ${c} 列）的 Q 表行`,
        state: "动作",
        unseen: "没访问过",
        tap: "点任意格子，看它在 Q 表里的那一行。",
        split: (e, a) =>
          `在这个格子上，ε-greedy 以 ${(100 * (1 - e)).toFixed(0)}% 的概率利用：走表里最好的“${a}”；以 ${(100 * e).toFixed(0)}% 的概率探索：四个方向随便挑一个。`,
        fixed: "α = 0.5，γ = 1，每步 −1。颜色越深，max Q 越高（离终点越近、越安全）。",
      }
    : {
        title: "Q-table explorer: CliffWalking",
        eps: "Exploration ε",
        episodes: "Training episodes",
        seed: "New random seed",
        seedv: (n) => `seed ${n}`,
        q: "Q-learning (off-policy: target uses the max)",
        sarsa: "SARSA (on-policy: target uses the next action actually taken)",
        ret: "Return while training (mean of last 100)",
        falls: "Cliff falls while training",
        path: "Greedy path",
        steps: (n) => `${n} steps to the goal`,
        fell: "walks off the cliff",
        loop: "goes round in circles: the table is still jittering. More episodes, or a new seed",
        none: "not trained yet",
        cliff: "cliff  −100, back to start",
        actions: ["up", "right", "down", "left"],
        cellHead: (r, c) => `Q-table row for the selected cell (row ${r}, column ${c})`,
        state: "Action",
        unseen: "never visited",
        tap: "Tap any cell to see its row of the Q-table.",
        split: (e, a) =>
          `In this cell ε-greedy exploits with probability ${(100 * (1 - e)).toFixed(0)}%: it takes the table's best action, "${a}". With probability ${(100 * e).toFixed(0)}% it explores: any of the four directions.`,
        fixed: "α = 0.5, γ = 1, −1 per step. Darker cells have a higher max Q (closer to the goal, or safer).",
      };

  const ROWS = 4, COLS = 12, START = 36, GOAL = 47, NA = 4;
  const MOVES = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // up, right, down, left (Gymnasium order)
  const isCliff = (s) => s > START && s < GOAL;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  // mulberry32: small seeded RNG so a slider position always gives the same run.
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const move = (s, a) => {
    const r = clamp(Math.floor(s / COLS) + MOVES[a][0], 0, ROWS - 1);
    const c = clamp((s % COLS) + MOVES[a][1], 0, COLS - 1);
    return r * COLS + c;
  };
  const best = (Q, s, rand) => {
    let m = -Infinity, ties = [];
    for (let a = 0; a < NA; a++) {
      const v = Q[s * NA + a];
      if (v > m) { m = v; ties = [a]; } else if (v === m) ties.push(a);
    }
    return ties.length === 1 || !rand ? ties[0] : ties[Math.floor(rand() * ties.length)];
  };
  const act = (Q, s, eps, rand) => (rand() < eps ? Math.floor(rand() * NA) : best(Q, s, rand));

  // One full training run. algo "q" = Q-learning, "sarsa" = SARSA.
  function train(algo, eps, episodes, seed) {
    const rand = rng(seed);
    const Q = new Float64Array(ROWS * COLS * NA);
    const seen = new Uint8Array(ROWS * COLS);
    const rets = [];
    let falls = 0;
    for (let ep = 0; ep < episodes; ep++) {
      let s = START, a = act(Q, s, eps, rand), G = 0;
      for (let t = 0; t < 1000; t++) {
        let s2 = move(s, a), r = -1;
        if (isCliff(s2)) { r = -100; s2 = START; falls++; }
        const done = s2 === GOAL;
        const a2 = act(Q, s2, eps, rand);
        const future = done ? 0 : algo === "q" ? Q[s2 * NA + best(Q, s2)] : Q[s2 * NA + a2];
        Q[s * NA + a] += 0.5 * (r + future - Q[s * NA + a]); // alpha 0.5, gamma 1
        seen[s] = 1;
        G += r;
        if (done) break;
        s = s2; a = a2;
      }
      rets.push(G);
    }
    // Greedy path from the start, no exploration.
    const path = [START];
    let s = START, end = "goal";
    while (s !== GOAL) {
      if (!seen[s]) { end = "none"; break; }
      const n = move(s, best(Q, s));
      if (isCliff(n)) { path.push(n); end = "fell"; break; }
      if (path.includes(n)) { path.push(n); end = "loop"; break; }
      path.push(n); s = n;
    }
    const tail = rets.slice(-100);
    const mean = tail.length ? tail.reduce((x, y) => x + y, 0) / tail.length : NaN;
    return { Q, seen, path, end, mean, falls };
  }

  class QTable extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.compare = this.hasAttribute("compare");
      this.s = {
        eps: Number(this.getAttribute("eps") ?? 0.1),
        episodes: Number(this.getAttribute("episodes") ?? 500),
        seed: Number(this.getAttribute("seed") ?? 5),
        sel: START,
      };
      this.algos = this.compare ? ["q", "sarsa"] : ["q"];
      const panel = (k) => `
        <div data-panel="${k}" style="margin-top:.9rem">
          <p style="margin:0 0 .35rem;font-size:.85rem;font-weight:600;color:${k === "q" ? "var(--accent)" : "var(--accent-2)"}">${T[k]}</p>
          <svg role="img" aria-label="${T[k]}"></svg>
          <div class="readout">
            <div><small>${T.ret}</small><b data-v="ret"></b></div>
            <div><small>${T.falls}</small><b data-v="falls"></b></div>
            <div><small>${T.path}</small><b data-v="path" style="font-size:.85rem"></b></div>
          </div>
        </div>`;
      this.innerHTML = `
        <div class="widget q-table">
          <p class="widget-title">${T.title}</p>
          <div class="widget-controls">
            <label>${T.eps} <output data-o="eps"></output><input type="range" data-k="eps" min="0" max="0.5" step="0.01"></label>
            <label>${T.episodes} <output data-o="episodes"></output><input type="range" data-k="episodes" min="0" max="1000" step="10"></label>
          </div>
          <p class="note" style="margin-top:0">${T.fixed}</p>
          ${this.algos.map(panel).join("")}
          <p class="note" data-v="head" style="margin-top:1rem;color:var(--text);font-weight:500"></p>
          <div style="overflow-x:auto">
            <table data-v="qrow" style="width:100%;border-collapse:collapse;font-size:.85rem;margin-top:.35rem"></table>
          </div>
          <p class="note" data-v="split" aria-live="polite"></p>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-top:.75rem">
            <button type="button" class="button secondary" data-act="seed">${T.seed}</button>
            <span class="note" style="margin:0" data-v="seedv"></span>
          </div>
        </div>`;
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.retrain();
        });
      });
      this.querySelector('[data-act="seed"]').addEventListener("click", () => {
        this.s.seed++;
        this.retrain();
      });
      this.svgs = {};
      for (const k of this.algos) {
        const svg = this.querySelector(`[data-panel="${k}"] svg`);
        this.svgs[k] = svg;
        svg.addEventListener("click", (e) => {
          const box = svg.getBoundingClientRect();
          const { pad, cell } = this.geom(box.width);
          const c = Math.floor((e.clientX - box.left - pad) / cell);
          const r = Math.floor((e.clientY - box.top - pad) / cell);
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            this.s.sel = r * COLS + c;
            this.render();
          }
        });
        // Draw at the real pixel width so labels keep their size on phones.
        new ResizeObserver(() => this.draw(k)).observe(svg);
      }
      this.retrain();
    }

    geom(W) {
      const pad = 4;
      return { pad, cell: (W - 2 * pad) / COLS };
    }

    retrain() {
      const { eps, episodes, seed } = this.s;
      this.runs = {};
      for (const k of this.algos) this.runs[k] = train(k, eps, episodes, seed * 7919 + (k === "q" ? 0 : 1));
      this.render();
    }

    render() {
      for (const k of this.algos) this.draw(k);
      const { eps, episodes, sel, seed } = this.s;
      this.querySelector('[data-o="eps"]').textContent = eps.toFixed(2);
      this.querySelector('[data-o="episodes"]').textContent = episodes;
      this.querySelector('[data-v="seedv"]').textContent = T.seedv(seed);
      for (const k of this.algos) {
        const run = this.runs[k];
        const p = this.querySelector(`[data-panel="${k}"]`);
        p.querySelector('[data-v="ret"]').textContent = episodes ? run.mean.toFixed(1) : "–";
        p.querySelector('[data-v="falls"]').textContent = run.falls;
        p.querySelector('[data-v="path"]').textContent =
          run.end === "goal" ? T.steps(run.path.length - 1) : T[run.end];
      }
      // The selected cell's row of the Q-table, one column per action.
      const r = Math.floor(sel / COLS), c = sel % COLS;
      this.querySelector('[data-v="head"]').textContent = T.cellHead(r + 1, c + 1);
      const th = (x, extra = "") => `<th style="white-space:nowrap;text-align:left;padding:.35rem .45rem;border:1px solid var(--border);font-weight:500;${extra}">${x}</th>`;
      const td = (x, on) => `<td style="padding:.35rem .45rem;border:1px solid var(--border);font-family:var(--mono);${on ? "background:var(--accent-soft);font-weight:600;" : ""}">${x}</td>`;
      const special = isCliff(sel) || sel === GOAL;
      let rows = `<tr>${th(T.state, "color:var(--muted);font-size:.75rem")}${T.actions.map((a) => th(a)).join("")}</tr>`;
      for (const k of this.algos) {
        const { Q, seen } = this.runs[k];
        const b = best(Q, sel);
        rows += `<tr>${th(k === "q" ? "Q-learning" : "SARSA")}${T.actions
          .map((_, a) => td(special || !seen[sel] ? (a ? "" : T.unseen) : Q[sel * NA + a].toFixed(1), !special && seen[sel] && a === b))
          .join("")}</tr>`;
      }
      this.querySelector('[data-v="qrow"]').innerHTML = rows;
      const q = this.runs.q;
      this.querySelector('[data-v="split"]').textContent =
        special || !q.seen[sel] ? T.tap : T.split(eps, T.actions[best(q.Q, sel)]);
    }

    draw(k) {
      const svg = this.svgs[k], run = this.runs && this.runs[k];
      if (!run) return;
      const W = Math.round(svg.clientWidth) || 520;
      const { pad, cell } = this.geom(W);
      const H = Math.round(ROWS * cell + 2 * pad);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const color = k === "q" ? "var(--accent)" : "var(--accent-2)";
      const { Q, seen, path } = run;
      // max Q over visited, non-cliff cells sets the shading range
      let lo = Infinity, hi = -Infinity;
      const V = [];
      for (let s = 0; s < ROWS * COLS; s++) {
        V[s] = Q[s * NA + best(Q, s)];
        if (seen[s]) { lo = Math.min(lo, V[s]); hi = Math.max(hi, V[s]); }
      }
      const fs = clamp(cell * 0.42, 10, 13);
      let out = "";
      for (let s = 0; s < ROWS * COLS; s++) {
        const r = Math.floor(s / COLS), c = s % COLS;
        const x = pad + c * cell, y = pad + r * cell;
        let fill = "none", op = 1;
        if (isCliff(s)) { fill = "var(--bad)"; op = 0.22; }
        else if (seen[s] && hi > lo) { fill = color; op = 0.06 + 0.5 * ((V[s] - lo) / (hi - lo)); }
        out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" fill="${fill}" fill-opacity="${op.toFixed(2)}" stroke="var(--border)"/>`;
        // greedy arrow
        if (seen[s] && !isCliff(s) && s !== GOAL) {
          const a = best(Q, s), cx = x + cell / 2, cy = y + cell / 2, L = cell * 0.26;
          const dx = MOVES[a][1] * L, dy = MOVES[a][0] * L;
          const hx = -dy * 0.45, hy = dx * 0.45;
          out += `<path d="M${(cx - dx).toFixed(1)} ${(cy - dy).toFixed(1)}L${(cx + dx).toFixed(1)} ${(cy + dy).toFixed(1)}M${(cx + dx * 0.4 + hx).toFixed(1)} ${(cy + dy * 0.4 + hy).toFixed(1)}L${(cx + dx).toFixed(1)} ${(cy + dy).toFixed(1)}L${(cx + dx * 0.4 - hx).toFixed(1)} ${(cy + dy * 0.4 - hy).toFixed(1)}" stroke="var(--muted)" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
        }
      }
      // cliff label across the cliff cells
      out += `<text x="${(pad + 6 * cell).toFixed(1)}" y="${(pad + 3.5 * cell + fs * 0.35).toFixed(1)}" text-anchor="middle" font-size="${fs.toFixed(1)}" fill="var(--bad)">${T.cliff}</text>`;
      // greedy path
      if (path.length > 1) {
        const pts = path.map((s) => `${(pad + (s % COLS) * cell + cell / 2).toFixed(1)},${(pad + Math.floor(s / COLS) * cell + cell / 2).toFixed(1)}`).join(" ");
        out += `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${clamp(cell * 0.14, 2.5, 5).toFixed(1)}" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`;
      }
      for (const [s, lab] of [[START, "S"], [GOAL, "G"]]) {
        const x = pad + (s % COLS) * cell + cell / 2, y = pad + Math.floor(s / COLS) * cell + cell / 2;
        out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(cell * 0.32).toFixed(1)}" fill="var(--surface)" stroke="${color}" stroke-width="1.5"/><text x="${x.toFixed(1)}" y="${(y + fs * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fs.toFixed(1)}" font-weight="600" fill="var(--text)" font-family="var(--mono)">${lab}</text>`;
      }
      // selected cell
      const ss = this.s.sel;
      out += `<rect x="${(pad + (ss % COLS) * cell + 1).toFixed(1)}" y="${(pad + Math.floor(ss / COLS) * cell + 1).toFixed(1)}" width="${(cell - 2).toFixed(1)}" height="${(cell - 2).toFixed(1)}" fill="none" stroke="var(--amber)" stroke-width="2.5"/>`;
      svg.innerHTML = out;
      svg.style.cursor = "pointer";
    }
  }
  customElements.define("q-table", QTable);
})();
