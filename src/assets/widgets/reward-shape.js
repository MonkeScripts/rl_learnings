// <reward-shape sigma="0.05" x="0.2"> : Gaussian vs L1 vs L2 reward shapes, plus a
// standing-score check (Day 12). Follows the widget contract in AGENTS.md.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "奖励形状：高斯、L1、L2",
        sigma: "σ（米）",
        x: "误差 x（米）",
        rew: "奖励 r(x)",
        slope: "斜率 |dr/dx|（对数坐标）",
        gauss: "高斯 exp(−(x/σ)²)",
        l1: "L1 −|x|/σ",
        l2: "L2 −(x/σ)²",
        dead: "死尾",
        flat: "平顶",
        rG: "高斯奖励",
        sG: "高斯斜率",
        sL1: "L1 斜率",
        rL2: "L2 惩罚",
        sFlat: (b) => `在平顶里：奖励 ≥ 0.96，“够好就是够好”。平顶宽 ±${b} 厘米。`,
        sUse: (p) => `在有用的那一段：斜率是峰值的 ${p}%，梯度能把它拉回来。`,
        sDead: (p) => `在死尾里：斜率只剩峰值的 ${p}，往哪边走奖励都一样。从这里恢复学不会。`,
        sHint: "L2 在这一点的惩罚已经出了图；它从不饱和。",
        title2: "站着不动能拿多少分",
        cmd: "指令速度（米/秒）",
        sv: "速度项 σ（米/秒）",
        wT: "跟踪项权重",
        wF: "站着也能拿的项（直立、姿态）",
        wG: "站着拿不到的项（步态）",
        shapes: ["高斯奖励（≥ 0）", "高斯 − 1（完美 = 0）", "L1 惩罚", "L2 惩罚"],
        of: "不动的机器人得分 ÷ 完美步行的得分",
        jumper: "Jumper 52%",
        note: "这里的项和权重是我编的玩具，不是 Jumper 的真实配置；真实的只有那个 52%。不动的机器人跟踪误差就等于指令速度。",
      }
    : {
        title: "Reward shape: Gaussian, L1, L2",
        sigma: "σ (m)",
        x: "Error x (m)",
        rew: "Reward r(x)",
        slope: "Slope |dr/dx| (log scale)",
        gauss: "Gaussian exp(−(x/σ)²)",
        l1: "L1 −|x|/σ",
        l2: "L2 −(x/σ)²",
        dead: "dead tail",
        flat: "flat top",
        rG: "Gaussian reward",
        sG: "Gaussian slope",
        sL1: "L1 slope",
        rL2: "L2 penalty",
        sFlat: (b) => `Inside the flat top: reward ≥ 0.96, "good enough is good enough". The top is ±${b} cm wide.`,
        sUse: (p) => `In the useful band: the slope is ${p}% of its peak, so the gradient can pull it back.`,
        sDead: (p) => `In the dead tail: the slope is ${p} of its peak. Every direction scores the same, so recovery from here is unlearnable.`,
        sHint: "The L2 penalty at this point is off the chart; it never saturates.",
        title2: "Standing-score check",
        cmd: "Commanded speed (m/s)",
        sv: "Tracking σ (m/s)",
        wT: "Tracking weight",
        wF: "Terms a parked robot still collects (upright, pose)",
        wG: "Terms a parked robot cannot collect (gait)",
        shapes: ["Gaussian bonus (≥ 0)", "Gaussian − 1 (perfect = 0)", "L1 penalty", "L2 penalty"],
        of: "Motionless robot's score ÷ a perfect walker's score",
        jumper: "Jumper 52%",
        note: "These terms and weights are a toy I made up, not Jumper's configuration; only the 52% is real. A motionless robot's tracking error is the whole command.",
      };

  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const X_MAX = 0.25;
  const PEAK_U = 2 / Math.sqrt(2) * Math.exp(-0.5); // max of 2u·e^(−u²), at u = 1/√2
  // Slope of the Gaussian in units of 1/σ, as a function of u = |x|/σ
  const gSlopeU = (u) => 2 * u * Math.exp(-u * u);
  // Where the slope falls below 1% of its peak (u > 1/√2), by bisection
  const deadU = (() => {
    let lo = 1 / Math.SQRT2, hi = 10;
    for (let i = 0; i < 60; i++) {
      const m = (lo + hi) / 2;
      if (gSlopeU(m) > 0.01 * PEAK_U) lo = m; else hi = m;
    }
    return lo;
  })();
  const FLAT_U = Math.sqrt(-Math.log(0.96)); // reward ≥ 0.96 inside |u| ≤ 0.2

  const sci = (v) => {
    if (v === 0) return "0";
    const a = Math.abs(v);
    if (a >= 0.01 && a < 1000) return v.toFixed(a < 1 ? 3 : 2);
    const e = Math.floor(Math.log10(a));
    return `${(v / 10 ** e).toFixed(1)}e${e}`;
  };

  class RewardShape extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        sigma: Number(this.getAttribute("sigma") ?? 0.05),
        x: Number(this.getAttribute("x") ?? 0.2),
        cmd: Number(this.getAttribute("cmd") ?? 0.4),
        sv: Number(this.getAttribute("sv") ?? 0.35),
        wT: Number(this.getAttribute("wt") ?? 2),
        wF: Number(this.getAttribute("wf") ?? 2),
        wG: Number(this.getAttribute("wg") ?? 1),
      };
      const range = (k, lab, min, max, step) =>
        `<label>${lab} <output data-o="${k}"></output><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}"></label>`;
      this.innerHTML = `
        <div class="widget reward-shape">
          <p class="widget-title">${T.title}</p>
          <svg data-svg="shape" role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            ${range("sigma", T.sigma, 0.01, 0.15, 0.005)}
            ${range("x", T.x, 0, X_MAX, 0.005)}
          </div>
          <div class="readout">
            <div><small>${T.rG}</small><b data-v="rG"></b></div>
            <div><small>${T.sG}</small><b data-v="sG"></b></div>
            <div><small>${T.sL1}</small><b data-v="sL1"></b></div>
            <div><small>${T.rL2}</small><b data-v="rL2"></b></div>
          </div>
          <p class="note" data-v="status" aria-live="polite"></p>
          <p class="widget-title" style="margin-top:1.4rem">${T.title2}</p>
          <div class="widget-controls">
            ${range("cmd", T.cmd, 0, 1, 0.05)}
            ${range("sv", T.sv, 0.1, 1, 0.01)}
            ${range("wT", T.wT, 0, 4, 0.5)}
            ${range("wF", T.wF, 0, 4, 0.5)}
            ${range("wG", T.wG, 0, 4, 0.5)}
          </div>
          <p class="note" style="margin-bottom:.4rem">${T.of}</p>
          <svg data-svg="stand" role="img" aria-label="${T.title2}"></svg>
          <p class="note">${T.note}</p>
        </div>`;
      this.svg = this.querySelector('[data-svg="shape"]');
      this.svg2 = this.querySelector('[data-svg="stand"]');
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.render();
        });
      });
      // Draw at the real pixel width so labels keep their size on phones.
      const ro = new ResizeObserver(() => this.render());
      ro.observe(this.svg);
      ro.observe(this.svg2);
      this.render();
    }

    render() {
      this.renderShape();
      this.renderStand();
    }

    renderShape() {
      const { sigma, x } = this.s;
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 440;
      const padL = 40, padR = 10, padT = 14, gap = 34, padB = 30;
      const h1 = narrow ? 150 : 180, h2 = narrow ? 120 : 140;
      const per = narrow ? 2 : 5;
      const legRows = Math.ceil(5 / per);
      const H = padT + h1 + gap + h2 + padB + legRows * 16;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const X = (v) => padL + ((v + X_MAX) / (2 * X_MAX)) * (W - padL - padR);
      const yLo = -3, yHi = 1.2;
      const Y1 = (v) => padT + ((yHi - clamp(v, yLo - 0.5, yHi)) / (yHi - yLo)) * h1;
      const top2 = padT + h1 + gap;
      const lMin = -8, lMax = 3; // log10 slope range
      const Y2 = (s) => top2 + ((lMax - clamp(Math.log10(Math.max(s, 1e-12)), lMin - 1, lMax)) / (lMax - lMin)) * h2;

      const N = 240;
      const path = (fn, Y) => {
        let d = "";
        for (let i = 0; i <= N; i++) {
          const xv = -X_MAX + (2 * X_MAX * i) / N;
          d += (i ? "L" : "M") + X(xv).toFixed(1) + " " + Y(fn(xv)).toFixed(1);
        }
        return d;
      };
      const G = (v) => Math.exp(-((v / sigma) ** 2));
      const L1 = (v) => -Math.abs(v) / sigma;
      const L2 = (v) => -((v / sigma) ** 2);
      const sG = (v) => gSlopeU(Math.abs(v) / sigma) / sigma;
      const sL1 = () => 1 / sigma;
      const sL2 = (v) => (2 * Math.abs(v)) / (sigma * sigma);

      const dx = deadU * sigma, fx = FLAT_U * sigma;
      const shade = (a, b, cls) =>
        a < b ? `<rect x="${X(a)}" y="${padT}" width="${X(b) - X(a)}" height="${top2 + h2 - padT}" fill="${cls}"/>` : "";
      const deadL = shade(-X_MAX, -dx, "var(--bad)"), deadR = shade(dx, X_MAX, "var(--bad)");
      const xticks = [-0.2, -0.1, 0, 0.1, 0.2];
      const yticks1 = [1, 0, -1, -2, -3];
      const yticks2 = [-8, -4, 0, 2];
      const legend = [
        [T.gauss, "var(--accent)", ""],
        [T.l1, "var(--accent-2)", "6 4"],
        [T.l2, "var(--muted)", "2 3"],
        [T.flat, "var(--accent-soft)", "box"],
        [T.dead, "var(--bad)", "box"],
      ];
      const legY = top2 + h2;
      this.svg.innerHTML = `
        <clipPath id="rs-c1"><rect x="${padL}" y="${padT}" width="${W - padL - padR}" height="${h1}"/></clipPath>
        <clipPath id="rs-c2"><rect x="${padL}" y="${top2}" width="${W - padL - padR}" height="${h2}"/></clipPath>
        <g opacity="0.12">${deadL}${deadR}</g>
        <rect x="${X(-fx)}" y="${padT}" width="${X(fx) - X(-fx)}" height="${top2 + h2 - padT}" fill="var(--accent-soft)"/>
        <text x="${padL}" y="${padT - 3}" font-size="11" fill="var(--muted)">${T.rew}</text>
        ${yticks1.map((v) => `<line x1="${padL}" x2="${W - padR}" y1="${Y1(v)}" y2="${Y1(v)}" stroke="var(--border)" stroke-width="${v === 0 ? 1.2 : 0.6}"/><text x="${padL - 5}" y="${Y1(v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        ${yticks2.map((v) => `<line x1="${padL}" x2="${W - padR}" y1="${Y2(10 ** v)}" y2="${Y2(10 ** v)}" stroke="var(--border)" stroke-width="0.6"/><text x="${padL - 5}" y="${Y2(10 ** v) + 4}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--mono)">1e${v}</text>`).join("")}
        <text x="${padL}" y="${top2 - 6}" font-size="11" fill="var(--muted)">${T.slope}</text>
        ${xticks.map((v) => `<text x="${X(v)}" y="${top2 + h2 + 14}" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        <g clip-path="url(#rs-c1)" fill="none">
          <path d="${path(L2, Y1)}" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="2 3"/>
          <path d="${path(L1, Y1)}" stroke="var(--accent-2)" stroke-width="1.8" stroke-dasharray="6 4"/>
          <path d="${path(G, Y1)}" stroke="var(--accent)" stroke-width="2.5"/>
        </g>
        <g clip-path="url(#rs-c2)" fill="none">
          <path d="${path(sL2, Y2)}" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="2 3"/>
          <path d="${path(sL1, Y2)}" stroke="var(--accent-2)" stroke-width="1.8" stroke-dasharray="6 4"/>
          <path d="${path(sG, Y2)}" stroke="var(--accent)" stroke-width="2.5"/>
        </g>
        <line x1="${X(x)}" x2="${X(x)}" y1="${padT}" y2="${top2 + h2}" stroke="var(--accent-2)" stroke-dasharray="2 3"/>
        <circle cx="${X(x)}" cy="${Y1(G(x))}" r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>
        <circle cx="${X(x)}" cy="${Y2(sG(x))}" r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>
        <g font-size="10.5">
          ${legend
            .map(([lab, col, dash], i) => {
              const x0 = narrow ? 6 : padL;
              const colW = (W - x0 - padR) / per;
              const lx = x0 + (i % per) * colW, ly = legY + 34 + Math.floor(i / per) * 16;
              const mark = dash === "box"
                ? `<rect x="${lx}" y="${ly - 9}" width="20" height="10" fill="${col}" opacity="${col === "var(--bad)" ? 0.18 : 1}"/>`
                : `<line x1="${lx}" x2="${lx + 20}" y1="${ly - 4}" y2="${ly - 4}" stroke="${col}" stroke-width="2" stroke-dasharray="${dash}"/>`;
              return `${mark}<text x="${lx + 25}" y="${ly}" fill="var(--text)">${lab}</text>`;
            })
            .join("")}
        </g>`;

      const fmt = (v, d) => v.toFixed(d);
      this.querySelector('[data-o="sigma"]').textContent = fmt(sigma, 3);
      this.querySelector('[data-o="x"]').textContent = fmt(x, 3);
      this.querySelector('[data-v="rG"]').textContent = sci(G(x));
      this.querySelector('[data-v="sG"]').textContent = sci(sG(x));
      this.querySelector('[data-v="sL1"]').textContent = sci(sL1());
      this.querySelector('[data-v="rL2"]').textContent = sci(L2(x));
      const u = Math.abs(x) / sigma;
      const frac = gSlopeU(u) / PEAK_U;
      let st;
      if (u <= FLAT_U) st = T.sFlat((fx * 100).toFixed(1));
      else if (u < deadU || u <= 1 / Math.SQRT2) st = T.sUse(Math.round(frac * 100));
      else st = T.sDead(sci(frac));
      if (L2(x) < yLo) st += " " + T.sHint;
      this.querySelector('[data-v="status"]').textContent = st;
    }

    renderStand() {
      const { cmd, sv, wT, wF, wG } = this.s;
      ["cmd", "sv"].forEach((k) => (this.querySelector(`[data-o="${k}"]`).textContent = this.s[k].toFixed(2)));
      ["wT", "wF", "wG"].forEach((k) => (this.querySelector(`[data-o="${k}"]`).textContent = this.s[k].toFixed(1)));
      const u = cmd / sv;
      // Tracking term for a parked robot (error = cmd) and for a perfect walker (error = 0).
      const shapes = [
        { park: wT * Math.exp(-u * u), best: wT },
        { park: wT * (Math.exp(-u * u) - 1), best: 0 },
        { park: -wT * u, best: 0 },
        { park: -wT * u * u, best: 0 },
      ];
      const W = Math.round(this.svg2.clientWidth) || 520;
      const padL = 6, padR = 6, rowH = 40, top = 8;
      const H = top + rowH * shapes.length + 22;
      this.svg2.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const lo = -1, hi = 1;
      const X = (p) => padL + ((clamp(p, lo, hi) - lo) / (hi - lo)) * (W - padL - padR);
      const rows = shapes
        .map((s, i) => {
          const parked = s.park + wF;
          const perfect = s.best + wF + wG;
          const ratio = perfect > 1e-9 ? parked / perfect : NaN;
          const y = top + i * rowH;
          const ok = Number.isFinite(ratio);
          const p = ok ? ratio : 0;
          const x0 = X(0), x1 = X(p);
          const col = p > 0.25 ? "var(--bad)" : "var(--accent)";
          const txt = ok ? `${Math.round(ratio * 100)}%` : "–";
          return `
            <text x="${padL}" y="${y + 12}" font-size="11.5" fill="var(--text)">${T.shapes[i]}</text>
            <text x="${W - padR}" y="${y + 12}" text-anchor="end" font-size="12" font-family="var(--mono)" fill="${col}" font-weight="600">${txt}</text>
            <rect x="${padL}" y="${y + 18}" width="${W - padL - padR}" height="12" rx="3" fill="var(--surface-2)"/>
            <rect x="${Math.min(x0, x1)}" y="${y + 18}" width="${Math.abs(x1 - x0)}" height="12" rx="3" fill="${col}" opacity="0.8"/>`;
        })
        .join("");
      const j = X(0.52);
      this.svg2.innerHTML = `
        ${rows}
        <line x1="${X(0)}" x2="${X(0)}" y1="${top + 14}" y2="${top + rowH * shapes.length}" stroke="var(--muted)"/>
        <line x1="${j}" x2="${j}" y1="${top + 14}" y2="${top + rowH * shapes.length}" stroke="var(--bad)" stroke-dasharray="3 3"/>
        <text x="${j}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="var(--bad)">${T.jumper}</text>
        <text x="${X(-1)}" y="${H - 6}" text-anchor="start" font-size="10" fill="var(--muted)" font-family="var(--mono)">−100%</text>
        <text x="${X(0)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="var(--mono)">0</text>
        <text x="${X(1)}" y="${H - 6}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--mono)">100%</text>`;
    }
  }
  customElements.define("reward-shape", RewardShape);
})();
