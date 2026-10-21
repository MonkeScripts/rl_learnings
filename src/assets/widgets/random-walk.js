// <random-walk n="20" envs="1024"> : two kinds of wobble that are not learning (Day 11).
// "Weights": late training as a random walk. Net displacement / path length against 1/sqrt(n),
// with a fixed step or a step decayed to zero, and the average of the checkpoints.
// "Scores": one fixed policy measured on fresh randomised robots every iteration. How big a swing is pure noise?
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "随机游走：不是学习的那种晃动",
        tabW: "权重",
        tabS: "分数",
        n: "检查点间隔数 n（每段 100 次迭代）",
        sched: "步长",
        fixed: "固定",
        decay: "衰减到 0",
        avg: "显示检查点平均",
        again: "再走一次",
        many: "走 200 次取平均",
        start: "起点",
        end: "终点",
        mean: "平均",
        proj: "6404 维权重中的两个方向（玩具模型）",
        path: "路径总长",
        net: "净位移",
        ratio: "净位移 / 路径长",
        pred: "随机游走预测",
        spread: "成员到平均的距离 / 单步",
        many200: (m, p) => `200 次游走：平均比值 ${m}，预测 ${p}`,
        noteFixed: "比值贴着 1/√n：走了很多步，但没有方向。sk_lean3 实测 0.21，1/√n 是 0.22。",
        noteDecay: "步长衰减后，最后几个检查点挤在一起，彼此可比。这是没试过的修法，不是实测结果。",
        envs: "每次迭代的机器人数",
        pf: "每个回合摔倒的概率",
        resample: "换一批机器人",
        iter: "迭代",
        len: "平均回合长度",
        truth: "真实均值（策略没变）",
        dot: "一次迭代的平均回合长度",
        band: "±2 个标准误",
        swing: "300 次迭代里的最大−最小",
        seDot: "每个点的标准误",
        seEval: "1000 回合评估的存活率标准误",
        noteS: "每个点都是同一个策略。单个种子、单条曲线上，比这条带子还小的改动是看不见的。玩具模型：摔倒时刻均匀分布，没有拟合到机器人上。",
      }
    : {
        title: "Random walk: wobble that is not learning",
        tabW: "Weights",
        tabS: "Scores",
        n: "Checkpoint gaps n (100 iterations each)",
        sched: "Step size",
        fixed: "Fixed",
        decay: "Decay to 0",
        avg: "Show the checkpoint average",
        again: "New walk",
        many: "Average 200 walks",
        start: "start",
        end: "end",
        mean: "average",
        proj: "Two of 6404 weight directions (toy)",
        path: "Path length",
        net: "Net displacement",
        ratio: "Net / path",
        pred: "Random walk predicts",
        spread: "Member to average / one step",
        many200: (m, p) => `200 walks: mean ratio ${m}, predicted ${p}`,
        noteFixed: "The ratio sits on 1/√n: plenty of motion, no direction. sk_lean3 measured 0.21 against 0.22.",
        noteDecay: "With the step decayed, the last checkpoints bunch up and become comparable. This fix is untested on the robot; it is not a measured result.",
        envs: "Robots per iteration",
        pf: "Chance an episode ends in a fall",
        resample: "New robots",
        iter: "iteration",
        len: "mean episode length",
        truth: "true mean (policy fixed)",
        dot: "one iteration's mean episode length",
        band: "±2 standard errors",
        swing: "Max − min over 300 iterations",
        seDot: "Standard error of one dot",
        seEval: "Survival SE, 1000-episode eval",
        noteS: "Every dot is the same policy. A change smaller than this band, read off one curve on one seed, is invisible. Toy: falls happen at a uniform random time; not fitted to the robot.",
      };

  const DIM = 6404; // actor weights of the [64, 64] policy
  const ENVS = [256, 1024, 4096];
  const ITERS = 300, STEPS = 128, EP = 1000;

  // Small seeded PRNG so "New walk" is reproducible within a session.
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const stepSizes = (n, decay) => Array.from({ length: n }, (_, i) => (decay ? 1 - i / n : 1));

  // One walk in D dimensions. Returns full-D stats plus a 2-D projection for drawing.
  function walk(n, decay, r, keepPath, D = DIM) {
    const s = stepSizes(n, decay);
    const pos = new Float64Array(D);
    const pts = keepPath ? [[0, 0]] : null;
    const sum = keepPath ? new Float64Array(D) : null;
    const all = keepPath ? [] : null;
    let pathLen = 0;
    const v = new Float64Array(D);
    for (let i = 0; i < n; i++) {
      let nrm = 0;
      for (let d = 0; d < D; d++) { v[d] = gauss(r); nrm += v[d] * v[d]; }
      nrm = Math.sqrt(nrm);
      for (let d = 0; d < D; d++) pos[d] += (s[i] * v[d]) / nrm;
      pathLen += s[i];
      if (keepPath) {
        // Scale the projection so a step looks like a step: each coordinate carries ~1/sqrt(D) of it.
        pts.push([pos[0] * Math.sqrt(D / 2), pos[1] * Math.sqrt(D / 2)]);
        all.push(Float64Array.from(pos));
      }
    }
    let net = 0;
    for (let d = 0; d < D; d++) net += pos[d] * pos[d];
    net = Math.sqrt(net);
    let spread = 0, mean2 = null;
    if (keepPath) {
      // Checkpoints are positions 1..n (the start is the plateau, not a saved member).
      for (const p of all) for (let d = 0; d < D; d++) sum[d] += p[d] / n;
      for (const p of all) {
        let q = 0;
        for (let d = 0; d < D; d++) q += (p[d] - sum[d]) ** 2;
        spread += Math.sqrt(q) / n;
      }
      mean2 = [sum[0] * Math.sqrt(D / 2), sum[1] * Math.sqrt(D / 2)];
    }
    return { pathLen, net, pts, mean: mean2, spread, s };
  }

  class RandomWalk extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const envs = Number(this.getAttribute("envs") ?? 1024);
      this.s = {
        tab: this.getAttribute("tab") === "scores" ? "S" : "W",
        n: Number(this.getAttribute("n") ?? 20),
        decay: false,
        avg: true,
        seed: 7,
        ei: Math.max(0, ENVS.indexOf(envs)),
        pf: 0.07,
        sseed: 3,
      };
      this.innerHTML = `
        <div class="widget random-walk">
          <p class="widget-title">${T.title}</p>
          <span class="seg" role="group" style="margin-bottom:.6rem">
            <button type="button" data-tab="W">${T.tabW}</button><button type="button" data-tab="S">${T.tabS}</button>
          </span>
          <svg role="img" aria-label="${T.title}"></svg>
          <div data-pane="W">
            <div class="widget-controls">
              <label>${T.n} <output data-o="n"></output><input type="range" data-k="n" min="4" max="80" step="1"></label>
              <div style="display:grid;gap:.35rem;font-size:.85rem;color:var(--muted)">
                <span>${T.sched}</span>
                <span class="seg" role="group" style="width:max-content">
                  <button type="button" data-decay="0">${T.fixed}</button><button type="button" data-decay="1">${T.decay}</button>
                </span>
                <label style="display:flex;gap:.4rem;align-items:center"><input type="checkbox" data-k="avg"> ${T.avg}</label>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:.6rem">
              <button type="button" class="button" data-act="again">${T.again}</button>
              <button type="button" class="button secondary" data-act="many">${T.many}</button>
            </div>
            <div class="readout">
              <div><small>${T.path}</small><b data-v="path"></b></div>
              <div><small>${T.net}</small><b data-v="net"></b></div>
              <div><small>${T.ratio}</small><b data-v="ratio"></b></div>
              <div><small>${T.pred}</small><b data-v="pred"></b></div>
              <div><small>${T.spread}</small><b data-v="spread"></b></div>
            </div>
            <p class="note" data-v="many" aria-live="polite"></p>
            <p class="note" data-v="noteW"></p>
          </div>
          <div data-pane="S">
            <div style="display:flex;flex-wrap:wrap;gap:.25rem 1rem;font-size:.78rem;color:var(--muted);margin:.35rem 0 0 40px">
              <span><span style="display:inline-block;vertical-align:middle;width:15px;height:9px;background:var(--accent-soft);border:1px solid var(--accent)"></span> ${T.band}</span>
              <span><span style="display:inline-block;vertical-align:middle;width:22px;border-top:2px dashed var(--text)"></span> ${T.truth}</span>
              <span><span style="display:inline-block;vertical-align:middle;width:6px;height:6px;border-radius:50%;background:var(--accent-2)"></span> ${T.dot}</span>
            </div>
            <div class="widget-controls">
              <div style="display:grid;gap:.35rem;font-size:.85rem;color:var(--muted)">
                <span>${T.envs}</span>
                <span class="seg" role="group" style="width:max-content">
                  ${ENVS.map((e, i) => `<button type="button" data-e="${i}">${e}</button>`).join("")}
                </span>
              </div>
              <label>${T.pf} <output data-o="pf"></output><input type="range" data-k="pf" min="0.02" max="0.3" step="0.01"></label>
            </div>
            <button type="button" class="button" data-act="resample">${T.resample}</button>
            <div class="readout">
              <div><small>${T.swing}</small><b data-v="swing"></b></div>
              <div><small>${T.seDot}</small><b data-v="seDot"></b></div>
              <div><small>${T.seEval}</small><b data-v="seEval"></b></div>
            </div>
            <p class="note">${T.noteS}</p>
          </div>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          if (inp.dataset.k === "n") this.newWalk(false);
          else this.newScores(false);
        });
      });
      const avg = this.querySelector('input[data-k="avg"]');
      avg.checked = this.s.avg;
      avg.addEventListener("change", () => { this.s.avg = avg.checked; this.render(); });
      this.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { this.s.tab = b.dataset.tab; this.render(); }));
      this.querySelectorAll("[data-decay]").forEach((b) => b.addEventListener("click", () => { this.s.decay = b.dataset.decay === "1"; this.newWalk(false); }));
      this.querySelectorAll("[data-e]").forEach((b) => b.addEventListener("click", () => { this.s.ei = Number(b.dataset.e); this.newScores(false); }));
      this.querySelector('[data-act="again"]').addEventListener("click", () => this.newWalk(true));
      this.querySelector('[data-act="resample"]').addEventListener("click", () => this.newScores(true));
      this.querySelector('[data-act="many"]').addEventListener("click", () => this.manyWalks());
      this.newWalk(false, true);
      this.newScores(false, true);
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    newWalk(reseed, quiet) {
      if (reseed) this.s.seed++;
      this.w = walk(this.s.n, this.s.decay, rng(this.s.seed * 7919 + this.s.n), true);
      this.querySelector('[data-v="many"]').textContent = "";
      if (!quiet) this.render();
    }

    manyWalks() {
      const r = rng(this.s.seed * 104729 + 17);
      let m = 0;
      for (let i = 0; i < 200; i++) {
        const w = walk(this.s.n, this.s.decay, r, false, 512); // the ratio has settled by 512 dimensions
        m += w.net / w.pathLen / 200;
      }
      this.querySelector('[data-v="many"]').textContent = T.many200(m.toFixed(3), this.pred().toFixed(3));
    }

    pred() {
      const s = stepSizes(this.s.n, this.s.decay);
      return Math.sqrt(s.reduce((a, v) => a + v * v, 0)) / s.reduce((a, v) => a + v, 0);
    }

    // A fixed policy: each robot's episode ends in a fall with probability pf, at a uniform random step;
    // otherwise it times out at 1000. Each iteration averages the episodes that end in its 128-step window.
    newScores(reseed, quiet) {
      if (reseed) this.s.sseed++;
      const r = rng(this.s.sseed * 31337 + this.s.ei * 101 + Math.round(this.s.pf * 1000));
      const pf = this.s.pf, envs = ENVS[this.s.ei];
      const mu = pf * (EP / 2) + (1 - pf) * EP;
      const ex2 = pf * (EP * EP) / 3 + (1 - pf) * EP * EP;
      const sd = Math.sqrt(ex2 - mu * mu);
      const m = Math.max(1, Math.round((envs * STEPS) / mu));
      const dots = [];
      for (let i = 0; i < ITERS; i++) {
        let tot = 0;
        for (let j = 0; j < m; j++) tot += r() < pf ? r() * EP : EP;
        dots.push(tot / m);
      }
      this.sc = { dots, mu, se: sd / Math.sqrt(m), seEval: Math.sqrt(((1 - pf) * pf) / 1000) };
      if (!quiet) this.render();
    }

    render() {
      const tab = this.s.tab;
      this.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === tab)));
      this.querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== tab));
      const W = Math.round(this.svg.clientWidth) || 520;
      if (tab === "W") this.drawWalk(W);
      else this.drawScores(W);
    }

    drawWalk(W) {
      const H = W < 440 ? 280 : 320, pad = 16;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const { pts, mean, pathLen, net, spread, s } = this.w;
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 2);
      const sc = Math.min(W - 2 * pad, H - 2 * pad - 20) / span;
      const X = (v) => W / 2 + (v - cx) * sc;
      const Y = (v) => (H + 14) / 2 - (v - cy) * sc;
      const d = pts.map((p, i) => (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1)).join("");
      const a = pts[0], b = pts[pts.length - 1];
      const tail = pts.slice(-Math.max(3, Math.round(pts.length / 4)));
      this.svg.innerHTML = `
        <defs><marker id="rw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent-2)"/></marker></defs>
        <text x="${pad}" y="14" font-size="11" fill="var(--muted)">${T.proj}</text>
        <path d="${d}" fill="none" stroke="var(--muted)" stroke-width="1.4" stroke-opacity="0.8"/>
        ${pts.slice(1).map((p, i) => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="${(1.6 + 1.6 * s[i]).toFixed(1)}" fill="var(--muted)"/>`).join("")}
        ${tail.map((p) => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="3.2" fill="none" stroke="var(--accent)" stroke-width="1.2"/>`).join("")}
        <line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="var(--accent-2)" stroke-width="2.2" marker-end="url(#rw-arrow)"/>
        <circle cx="${X(a[0])}" cy="${Y(a[1])}" r="6" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>
        <text x="${X(a[0]) + 9}" y="${Y(a[1]) + 4}" font-size="11" fill="var(--text)">${T.start}</text>
        <text x="${X(b[0]) + 9}" y="${Y(b[1]) + 4}" font-size="11" fill="var(--accent-2)">${T.end}</text>
        ${this.s.avg ? `<rect x="${X(mean[0]) - 6}" y="${Y(mean[1]) - 6}" width="12" height="12" transform="rotate(45 ${X(mean[0])} ${Y(mean[1])})" fill="var(--good)" stroke="var(--surface)" stroke-width="1.5"/><text x="${X(mean[0]) + 10}" y="${Y(mean[1]) - 8}" font-size="11" fill="var(--good)">${T.mean}</text>` : ""}`;
      this.querySelector('[data-o="n"]').textContent = this.s.n;
      this.querySelector('[data-v="path"]').textContent = pathLen.toFixed(1);
      this.querySelector('[data-v="net"]').textContent = net.toFixed(2);
      this.querySelector('[data-v="ratio"]').textContent = (net / pathLen).toFixed(3);
      this.querySelector('[data-v="pred"]').textContent = this.pred().toFixed(3);
      this.querySelector('[data-v="spread"]').textContent = spread.toFixed(2);
      this.querySelector('[data-v="noteW"]').textContent = this.s.decay ? T.noteDecay : T.noteFixed;
      this.querySelectorAll("[data-decay]").forEach((bt) => bt.setAttribute("aria-pressed", String((bt.dataset.decay === "1") === this.s.decay)));
    }

    drawScores(W) {
      const H = W < 440 ? 240 : 280, padL = 40, padR = 10, padT = 22, padB = 36;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const { dots, mu, se, seEval } = this.sc;
      const lo = Math.floor((Math.min(...dots, mu - 3 * se) - 5) / 10) * 10;
      const hi = Math.min(1000, Math.ceil((Math.max(...dots, mu + 3 * se) + 5) / 10) * 10);
      const X = (i) => padL + (i / (ITERS - 1)) * (W - padL - padR);
      const Y = (v) => padT + ((hi - v) / (hi - lo)) * (H - padT - padB);
      const step = (hi - lo) > 120 ? 50 : (hi - lo) > 50 ? 20 : 10;
      const yt = [];
      for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) yt.push(v);
      this.svg.innerHTML = `
        <text x="${padL}" y="12" font-size="11" fill="var(--muted)">${T.len}</text>
        <rect x="${padL}" y="${Y(mu + 2 * se)}" width="${W - padL - padR}" height="${Y(mu - 2 * se) - Y(mu + 2 * se)}" fill="var(--accent-soft)"/>
        <line x1="${padL}" x2="${padL}" y1="${padT}" y2="${H - padB}" stroke="var(--border)"/>
        <line x1="${padL}" x2="${W - padR}" y1="${H - padB}" y2="${H - padB}" stroke="var(--border)"/>
        ${yt.map((v) => `<text x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        ${[0, 100, 200, 300].map((i) => `<text x="${X(Math.min(i, ITERS - 1))}" y="${H - padB + 15}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${i}</text>`).join("")}
        <text x="${W - padR}" y="${H - 2}" text-anchor="end" font-size="11" fill="var(--muted)">${T.iter}</text>
        ${dots.map((v, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="1.8" fill="var(--accent-2)" fill-opacity="0.75"/>`).join("")}
        <line x1="${padL}" x2="${W - padR}" y1="${Y(mu)}" y2="${Y(mu)}" stroke="var(--text)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
      this.querySelector('[data-o="pf"]').textContent = this.s.pf.toFixed(2);
      this.querySelector('[data-v="swing"]').textContent = (Math.max(...dots) - Math.min(...dots)).toFixed(0);
      this.querySelector('[data-v="seDot"]').textContent = se.toFixed(1);
      this.querySelector('[data-v="seEval"]').textContent = seEval.toFixed(3);
      this.querySelectorAll("[data-e]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.e) === this.s.ei)));
    }
  }
  customElements.define("random-walk", RandomWalk);
})();
