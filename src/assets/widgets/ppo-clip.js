// <ppo-clip a="1" eps="0.2" r="1.3"> : PPO clipped surrogate explorer (Day 9).
// Reference implementation of the widget contract in AGENTS.md.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "PPO 裁剪目标探索器",
        adv: "优势 A",
        eps: "裁剪范围 ε",
        ratio: "比率 r = π_θ / π_θold",
        unclipped: "不裁剪：r·A",
        clipped: "PPO：min(r·A, clip(r)·A)",
        band: "信任区间",
        L: "目标 L",
        grad: "梯度 ∂L/∂r",
        kl: "近似 KL",
        push: (d) => (d > 0 ? "继续把 r 往上推" : "继续把 r 往下推"),
        flat: "被裁剪：梯度为 0，这个方向已经走得够远了",
        step: "执行 10 步梯度上升",
        reset: "把 r 重置为 1",
        clipOn: "裁剪开",
        clipOff: "裁剪关",
        cases: ["r 在区间内", "r < 1−ε", "r > 1+ε"],
        caseHead: ["情况", "A > 0", "A < 0"],
        cell: { use: "用 r·A，有梯度", flat: "被裁剪，梯度 0", fix: "用 r·A，往回拉" },
        noteOn: "裁剪开：r 一旦越过 1+ε（A>0）或 1−ε（A<0），奖励就不再增加，梯度停下。",
        noteOff: "裁剪关：没有任何东西阻止它，r 一直跑。这就是 L^CPI 的问题。",
        zeroA: "A = 0：这个动作和平常一样好，没有东西可学。",
      }
    : {
        title: "PPO clip explorer",
        adv: "Advantage A",
        eps: "Clip range ε",
        ratio: "Ratio r = π_θ / π_θold",
        unclipped: "No clip: r·A",
        clipped: "PPO: min(r·A, clip(r)·A)",
        band: "trust band",
        L: "Objective L",
        grad: "Gradient ∂L/∂r",
        kl: "Approx. KL",
        push: (d) => (d > 0 ? "Still pushing r up" : "Still pushing r down"),
        flat: "Clipped: zero gradient. It has already moved far enough this way",
        step: "Take 10 gradient steps",
        reset: "Reset r to 1",
        clipOn: "Clip on",
        clipOff: "Clip off",
        cases: ["r inside the band", "r < 1−ε", "r > 1+ε"],
        caseHead: ["Case", "A > 0", "A < 0"],
        cell: { use: "uses r·A, has gradient", flat: "clipped, gradient 0", fix: "uses r·A, pulls back" },
        noteOn: "Clip on: once r passes 1+ε (A>0) or 1−ε (A<0) there is no more reward for going further, so the gradient stops.",
        noteOff: "Clip off: nothing stops it and r keeps running. That is the problem with L^CPI.",
        zeroA: "A = 0: this action was exactly as good as usual, so there is nothing to learn.",
      };

  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const R_MAX = 2.5;

  // Objective and its derivative w.r.t. r for one sample.
  const objective = (r, A, eps, clipOn) => {
    const un = r * A;
    if (!clipOn) return { L: un, g: A, clipped: false };
    const cl = clamp(r, 1 - eps, 1 + eps) * A;
    const clipped = cl < un; // min picks the clipped (constant) branch
    return { L: Math.min(un, cl), g: clipped ? 0 : A, clipped };
  };
  // Row 0 inside, 1 below, 2 above; col 0 A>0, 1 A<0.
  const caseOf = (r, A, eps) => {
    const row = r < 1 - eps ? 1 : r > 1 + eps ? 2 : 0;
    return { row, col: A >= 0 ? 0 : 1 };
  };
  const CELL = [
    ["use", "use"],
    ["fix", "flat"],
    ["flat", "fix"],
  ];

  class PpoClip extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        A: Number(this.getAttribute("a") ?? 1),
        eps: Number(this.getAttribute("eps") ?? 0.2),
        r: Number(this.getAttribute("r") ?? 1.3),
        clipOn: true,
      };
      this.innerHTML = `
        <div class="widget ppo-clip">
          <p class="widget-title">${T.title}</p>
          <svg role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            <label>${T.adv} <output data-o="A"></output><input type="range" data-k="A" min="-2" max="2" step="0.05"></label>
            <label>${T.eps} <output data-o="eps"></output><input type="range" data-k="eps" min="0.05" max="0.5" step="0.01"></label>
            <label>${T.ratio} <output data-o="r"></output><input type="range" data-k="r" min="0" max="${R_MAX}" step="0.01"></label>
          </div>
          <div class="readout">
            <div><small>${T.L}</small><b data-v="L"></b></div>
            <div><small>${T.grad}</small><b data-v="g"></b></div>
            <div><small>${T.kl}</small><b data-v="kl"></b></div>
          </div>
          <p class="note" data-v="status" aria-live="polite"></p>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-top:.75rem">
            <span class="seg" role="group">
              <button type="button" data-clip="1">${T.clipOn}</button><button type="button" data-clip="0">${T.clipOff}</button>
            </span>
            <button type="button" class="button" data-act="step">${T.step}</button>
            <button type="button" class="button secondary" data-act="reset">${T.reset}</button>
          </div>
          <p class="note" data-v="clipnote"></p>
          <div style="overflow-x:auto;margin-top:.75rem">
            <table class="ppo-cases" style="width:100%;border-collapse:collapse;font-size:.85rem"></table>
          </div>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.render();
        });
      });
      this.querySelectorAll("[data-clip]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.clipOn = b.dataset.clip === "1";
          this.render();
        })
      );
      this.querySelector('[data-act="step"]').addEventListener("click", () => this.animate());
      this.querySelector('[data-act="reset"]').addEventListener("click", () => {
        this.trail = [];
        this.setR(1);
      });
      this.trail = [];
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    setR(r) {
      this.s.r = clamp(r, 0, R_MAX);
      this.querySelector('input[data-k="r"]').value = this.s.r;
      this.render();
    }

    // Plain gradient ascent on r for one sample: shows the runaway without the clip
    // and the stall at the band edge with it.
    animate() {
      if (this._busy) return;
      this._busy = true;
      const lr = 0.06;
      let i = 0;
      this.trail = [this.s.r];
      const tick = () => {
        const { g } = objective(this.s.r, this.s.A, this.s.eps, this.s.clipOn);
        this.setR(this.s.r + lr * g);
        this.trail.push(this.s.r);
        if (++i < 10 && this.s.r > 0 && this.s.r < R_MAX) setTimeout(tick, 90);
        else this._busy = false;
      };
      tick();
    }

    render() {
      const { A, eps, r, clipOn } = this.s;
      const W = Math.round(this.svg.clientWidth) || 520;
      const H = W < 440 ? 240 : 300, padL = 34, padR = 10, padT = 16, padB = 30;
      if (this._w !== W) {
        this._w = W;
        this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      }
      const yMax = Math.max(0.5, Math.abs(A) * R_MAX) * 1.05;
      const X = (v) => padL + (v / R_MAX) * (W - padL - padR);
      const Y = (v) => padT + ((yMax - v) / (2 * yMax)) * (H - padT - padB);
      const path = (fn) => {
        let d = "";
        for (let i = 0; i <= 200; i++) {
          const rv = (i / 200) * R_MAX;
          d += (i ? "L" : "M") + X(rv).toFixed(1) + " " + Y(fn(rv)).toFixed(1);
        }
        return d;
      };
      // Zero-gradient stretches of the clipped curve
      const flats = [];
      if (A > 0) flats.push([1 + eps, R_MAX]);
      if (A < 0) flats.push([0, 1 - eps]);
      const cur = objective(r, A, eps, clipOn);
      const ticks = [0, 0.5, 1, 1.5, 2, 2.5];
      this.svg.innerHTML = `
        <rect x="${X(1 - eps)}" y="${padT}" width="${X(1 + eps) - X(1 - eps)}" height="${H - padT - padB}" fill="var(--accent-soft)"/>
        <text x="${X(1 + eps) + 5}" y="${padT + 12}" text-anchor="start" font-size="11" fill="var(--accent)" font-family="var(--mono)">${T.band} [${(1 - eps).toFixed(2)}, ${(1 + eps).toFixed(2)}]</text>
        <line x1="${padL}" x2="${W - padR}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--border)"/>
        <line x1="${padL}" x2="${padL}" y1="${padT}" y2="${H - padB}" stroke="var(--border)"/>
        ${ticks.map((v) => `<line x1="${X(v)}" x2="${X(v)}" y1="${H - padB}" y2="${H - padB + 4}" stroke="var(--muted)"/><text x="${X(v)}" y="${H - padB + 16}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        <text x="${W - padR}" y="${H - 4}" text-anchor="end" font-size="11" fill="var(--muted)">r</text>
        <text x="${padL - 6}" y="${Y(0) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">0</text>
        <text x="${padL - 6}" y="${padT + 10}" text-anchor="end" font-size="11" fill="var(--muted)">L</text>
        <path d="${path((rv) => rv * A)}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>
        ${clipOn ? flats.map(([a, b]) => `<line x1="${X(a)}" x2="${X(b)}" y1="${Y(objective((a + b) / 2, A, eps, true).L)}" y2="${Y(objective((a + b) / 2, A, eps, true).L)}" stroke="var(--bad)" stroke-width="7" stroke-opacity="0.18" stroke-linecap="round"/>`).join("") : ""}
        ${clipOn ? `<path d="${path((rv) => objective(rv, A, eps, true).L)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>` : ""}
        ${this.trail.length > 1 ? this.trail.map((tv) => `<circle cx="${X(tv)}" cy="${Y(objective(tv, A, eps, clipOn).L)}" r="2.5" fill="var(--accent-2)" opacity="0.55"/>`).join("") : ""}
        <line x1="${X(r)}" x2="${X(r)}" y1="${padT}" y2="${H - padB}" stroke="var(--accent-2)" stroke-dasharray="2 3"/>
        <circle cx="${X(r)}" cy="${Y(cur.L)}" r="6" fill="var(--accent-2)" stroke="var(--surface)" stroke-width="2"/>
        <g font-size="11" font-family="var(--sans)">
          <line x1="${padL + 10}" x2="${padL + 34}" y1="${H - padB - 34}" y2="${H - padB - 34}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>
          <text x="${padL + 40}" y="${H - padB - 30}" fill="var(--muted)">${T.unclipped}</text>
          ${clipOn ? `<line x1="${padL + 10}" x2="${padL + 34}" y1="${H - padB - 16}" y2="${H - padB - 16}" stroke="var(--accent)" stroke-width="2.5"/><text x="${padL + 40}" y="${H - padB - 12}" fill="var(--text)">${T.clipped}</text>` : ""}
        </g>`;

      const fmt = (v) => (Math.abs(v) < 5e-4 ? "0.000" : v.toFixed(3));
      this.querySelector('[data-o="A"]').textContent = A.toFixed(2);
      this.querySelector('[data-o="eps"]').textContent = eps.toFixed(2);
      this.querySelector('[data-o="r"]').textContent = r.toFixed(2);
      this.querySelector('[data-v="L"]').textContent = fmt(cur.L);
      this.querySelector('[data-v="g"]').textContent = fmt(cur.g);
      // k3 estimator of KL(old || new) from one ratio: (r - 1) - log r
      this.querySelector('[data-v="kl"]').textContent = r > 0 ? fmt(r - 1 - Math.log(r)) : "∞";
      this.querySelector('[data-v="status"]').textContent =
        A === 0 ? T.zeroA : cur.g === 0 ? T.flat : T.push(cur.g);
      this.querySelector('[data-v="clipnote"]').textContent = clipOn ? T.noteOn : T.noteOff;
      this.querySelectorAll("[data-clip]").forEach((b) =>
        b.setAttribute("aria-pressed", String((b.dataset.clip === "1") === clipOn))
      );

      const c = caseOf(r, A, eps);
      const cell = (row, col) => {
        const on = clipOn && A !== 0 && row === c.row && col === c.col;
        const kind = CELL[row][col];
        const color = kind === "flat" ? "var(--bad)" : "var(--accent)";
        return `<td style="padding:.4rem .5rem;border:1px solid var(--border);${on ? `background:var(--accent-2-soft);font-weight:600;` : ""}"><span style="color:${color}">●</span> ${T.cell[kind]}</td>`;
      };
      this.querySelector(".ppo-cases").innerHTML =
        `<tr>${T.caseHead.map((h) => `<th style="text-align:left;padding:.4rem .5rem;border:1px solid var(--border);font-size:.75rem;color:var(--muted)">${h}</th>`).join("")}</tr>` +
        T.cases.map((name, row) => `<tr><th style="text-align:left;padding:.4rem .5rem;border:1px solid var(--border);font-weight:500">${name}</th>${cell(row, 0)}${cell(row, 1)}</tr>`).join("");
    }
  }
  customElements.define("ppo-clip", PpoClip);
})();
