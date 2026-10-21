// <dr-grid preset="foot" dist="uniform" real="1"> : domain randomisation around a measured value (Day 16).
// Draws a population of sampled robots for one plant parameter, shows where the real robot
// sits in that population, and how much of the training lands near it.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "围绕实测值做域随机化",
        presets: { foot: "足底摩擦 0.7–1.3×（Microduck）", decade: "库仑摩擦，一个数量级（示意）" },
        dists: { uniform: "均匀", log: "对数均匀", gauss: "高斯" },
        real: "真机 / 实测值",
        measured: "实测值",
        realLbl: "真机",
        covered: "真机在范围内？",
        yes: "是",
        no: "否：在范围外",
        near: "离真机 ±5% 以内的样本",
        dens: "真机处密度 / 实测值处密度",
        resample: "重新抽样",
        robots: "这一批 24 台仿真机器人（高亮 = 离真机 ±5% 以内）",
        axis: "摩擦倍率（相对实测值）",
        note: {
          uniform: "均匀：范围内每一处都一样多。真机只要落在范围里，就有同样多的训练。",
          log: "对数均匀：每个倍数区间的样本一样多，低摩擦那头更密。适合跨一个数量级的尺度类参数。",
          gauss: "高斯（σ = 半宽 / 2，这是本组件自己的选择）：样本挤在实测值附近。实测值准，这很划算；实测值偏了，真机就落在稀薄的尾巴上。",
        },
        presetNote: {
          foot: "范围来自 Microduck 的启动事件 foot_friction：0.7× 到 1.3× 名义值。",
          decade: "轮足机器人抽的是一个数量级的对数均匀库仑摩擦。端点不在我的笔记里，这里取 0.316× 到 3.16×，只作示意。",
        },
      }
    : {
        title: "Randomise around the measured value",
        presets: { foot: "Foot friction 0.7–1.3× (Microduck)", decade: "Coulomb friction, one decade (illustrative)" },
        dists: { uniform: "Uniform", log: "Log-uniform", gauss: "Gaussian" },
        real: "Real robot / measured",
        measured: "measured",
        realLbl: "real",
        covered: "Real robot inside the range?",
        yes: "yes",
        no: "no: outside",
        near: "Draws within ±5% of the real robot",
        dens: "Density at real / at measured",
        resample: "Draw again",
        robots: "This batch of 24 simulated robots (highlighted = within ±5% of the real one)",
        axis: "friction scale (relative to measured)",
        note: {
          uniform: "Uniform: every part of the range gets the same training. If the real robot is anywhere inside, it is covered as well as the measured value.",
          log: "Log-uniform: equal draws per ratio, so the low-friction end is denser. Made for scale-like parameters spanning a decade.",
          gauss: "Gaussian (σ = half-width / 2, the widget's own choice): draws crowd the measured value. Cheap when the measurement is right; when it is off, the real robot sits in a thin tail.",
        },
        presetNote: {
          foot: "Range from Microduck's foot_friction startup event: 0.7× to 1.3× nominal.",
          decade: "The wheeled-leg robot draws Coulomb friction log-uniform over a decade. The endpoints are not in my notes; 0.316× to 3.16× here is for illustration only.",
        },
      };

  const PRESETS = {
    foot: { lo: 0.7, hi: 1.3, logSpace: false, rmin: 0.5, rmax: 1.6 },
    decade: { lo: 0.316, hi: 3.16, logSpace: true, rmin: 0.2, rmax: 5 },
  };
  const N = 600;
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const erf = (x) => {
    const s = Math.sign(x); x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496735) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

  class DrGrid extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const preset = PRESETS[this.getAttribute("preset")] ? this.getAttribute("preset") : "foot";
      const dist = ["uniform", "log", "gauss"].includes(this.getAttribute("dist")) ? this.getAttribute("dist") : "uniform";
      this.s = { preset, dist, real: Number(this.getAttribute("real") ?? 1), seed: 7 };
      this.innerHTML = `
        <div class="widget dr-grid">
          <p class="widget-title">${T.title}</p>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.6rem">
            <span class="seg" role="group">${Object.keys(PRESETS).map((k) => `<button type="button" data-p="${k}">${T.presets[k]}</button>`).join("")}</span>
            <span class="seg" role="group">${Object.keys(T.dists).map((k) => `<button type="button" data-d="${k}">${T.dists[k]}</button>`).join("")}</span>
          </div>
          <svg data-svg="hist" role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            <label>${T.real} <output data-o="real"></output><input type="range" data-k="real" min="0" max="1000" step="1"></label>
          </div>
          <div class="readout">
            <div><small>${T.covered}</small><b data-v="cov"></b></div>
            <div><small>${T.near}</small><b data-v="near"></b></div>
            <div><small>${T.dens}</small><b data-v="dens"></b></div>
          </div>
          <p class="note" data-v="note" aria-live="polite"></p>
          <p class="note" style="margin-top:.9rem">${T.robots}</p>
          <svg data-svg="grid" role="img" aria-label="${T.robots}"></svg>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-top:.6rem">
            <button type="button" class="button secondary" data-act="resample">${T.resample}</button>
          </div>
          <p class="note" data-v="pnote"></p>
        </div>`;
      this.hist = this.querySelector('[data-svg="hist"]');
      this.grid = this.querySelector('[data-svg="grid"]');
      this.slider = this.querySelector('input[data-k="real"]');
      this.slider.addEventListener("input", () => { this.s.real = this.fromSlider(Number(this.slider.value)); this.render(); });
      this.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => {
        this.s.preset = b.dataset.p; this.s.real = 1; this.syncSlider(); this.render();
      }));
      this.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => { this.s.dist = b.dataset.d; this.render(); }));
      this.querySelector('[data-act="resample"]').addEventListener("click", () => { this.s.seed++; this.render(); });
      this.syncSlider();
      new ResizeObserver(() => this.render()).observe(this.hist);
      this.render();
    }

    // Slider is linear in log(real/measured) between the preset's rmin and rmax.
    fromSlider(v) { const P = PRESETS[this.s.preset]; return Math.exp(Math.log(P.rmin) + (v / 1000) * (Math.log(P.rmax) - Math.log(P.rmin))); }
    syncSlider() {
      const P = PRESETS[this.s.preset];
      this.s.real = Math.min(P.rmax, Math.max(P.rmin, this.s.real));
      this.slider.value = Math.round(1000 * (Math.log(this.s.real) - Math.log(P.rmin)) / (Math.log(P.rmax) - Math.log(P.rmin)));
    }

    // Sampler, density and CDF for the current preset and distribution.
    model() {
      const P = PRESETS[this.s.preset], d = this.s.dist;
      const L = Math.log(P.lo), H = Math.log(P.hi);
      if (d === "uniform") return {
        draw: (u) => P.lo + u() * (P.hi - P.lo),
        pdf: (x) => (x >= P.lo && x <= P.hi ? 1 / (P.hi - P.lo) : 0),
        cdf: (x) => Math.min(1, Math.max(0, (x - P.lo) / (P.hi - P.lo))),
      };
      if (d === "log") return {
        draw: (u) => Math.exp(L + u() * (H - L)),
        pdf: (x) => (x >= P.lo && x <= P.hi ? 1 / (x * (H - L)) : 0),
        cdf: (x) => (x <= 0 ? 0 : Math.min(1, Math.max(0, (Math.log(x) - L) / (H - L)))),
      };
      // Gaussian centred on the measured value (1.0), sigma = half-width / 2,
      // in linear space for the narrow preset and in log space for the decade.
      if (!P.logSpace) {
        const sd = (P.hi - P.lo) / 4;
        return {
          draw: (u) => { let x; do { x = 1 + sd * Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u()); } while (x <= 0); return x; },
          pdf: (x) => Math.exp(-0.5 * ((x - 1) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI)),
          cdf: (x) => Phi((x - 1) / sd),
        };
      }
      const sd = (H - L) / 4;
      return {
        draw: (u) => Math.exp(sd * Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u())),
        pdf: (x) => (x <= 0 ? 0 : Math.exp(-0.5 * (Math.log(x) / sd) ** 2) / (x * sd * Math.sqrt(2 * Math.PI))),
        cdf: (x) => (x <= 0 ? 0 : Phi(Math.log(x) / sd)),
      };
    }

    render() {
      const P = PRESETS[this.s.preset], m = this.model(), real = this.s.real;
      const u = mulberry(this.s.seed * 7919 + (this.s.preset === "foot" ? 1 : 2) * 131 + ["uniform", "log", "gauss"].indexOf(this.s.dist) * 17);
      const xs = Array.from({ length: N }, () => m.draw(u));

      // Histogram panel, x axis in log scale so both presets read the same way.
      const W = Math.round(this.hist.clientWidth) || 520;
      const H = W < 440 ? 190 : 220, padL = 12, padR = 12, padT = 26, padB = 34;
      this.hist.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const a = Math.log(P.rmin), b = Math.log(P.rmax);
      const X = (v) => padL + ((Math.log(v) - a) / (b - a)) * (W - padL - padR);
      const bins = Math.max(18, Math.min(48, Math.floor((W - padL - padR) / 11)));
      const counts = new Array(bins).fill(0);
      xs.forEach((v) => {
        const k = Math.floor(((Math.log(v) - a) / (b - a)) * bins);
        if (k >= 0 && k < bins) counts[k]++;
      });
      const cmax = Math.max(...counts, 1);
      const bw = (W - padL - padR) / bins, base = H - padB;
      const Y = (c) => base - (c / cmax) * (base - padT);
      const ticks = this.s.preset === "foot" ? [0.5, 0.7, 1, 1.3, 1.6] : [0.2, 0.316, 1, 3.16, 5];
      const nearLo = real * 0.95, nearHi = real * 1.05;
      const inside = real >= P.lo && real <= P.hi;
      const rx = X(real), mx = X(1);
      const rLabelAnchor = rx > W - 60 ? "end" : rx < 60 ? "start" : "middle";
      this.hist.innerHTML = `
        <rect x="${X(P.lo)}" y="${padT}" width="${X(P.hi) - X(P.lo)}" height="${base - padT}" fill="var(--accent-soft, rgba(127,127,127,.08))" opacity=".6"/>
        <rect x="${X(nearLo)}" y="${padT}" width="${Math.max(2, X(nearHi) - X(nearLo))}" height="${base - padT}" fill="var(--accent-2)" opacity=".16"/>
        ${counts.map((c, i) => c ? `<rect x="${(padL + i * bw + 1).toFixed(1)}" y="${Y(c).toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${(base - Y(c)).toFixed(1)}" fill="var(--accent)" opacity=".75"/>` : "").join("")}
        <line x1="${padL}" x2="${W - padR}" y1="${base}" y2="${base}" stroke="var(--border)"/>
        ${ticks.map((v) => `<line x1="${X(v)}" x2="${X(v)}" y1="${base}" y2="${base + 4}" stroke="var(--muted)"/><text x="${X(v)}" y="${base + 16}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}×</text>`).join("")}
        <text x="${W - padR}" y="${H - 3}" text-anchor="end" font-size="11" fill="var(--muted)">${T.axis}</text>
        <line x1="${mx}" x2="${mx}" y1="${padT - 4}" y2="${base}" stroke="var(--text)" stroke-dasharray="3 3"/>
        <text x="${mx - 4}" y="${padT - 8}" text-anchor="end" font-size="11" fill="var(--text)">${T.measured}</text>
        <line x1="${rx}" x2="${rx}" y1="${padT - 4}" y2="${base}" stroke="var(--accent-2)" stroke-width="2.5"/>
        <circle cx="${rx}" cy="${base}" r="5" fill="var(--accent-2)" stroke="var(--surface)" stroke-width="2"/>
        <text x="${rx + (rLabelAnchor === "end" ? -4 : 4)}" y="${padT - 8}" text-anchor="${rLabelAnchor === "middle" ? "start" : rLabelAnchor}" font-size="11" font-weight="600" fill="var(--accent-2)">${T.realLbl} ${real.toFixed(2)}×</text>`;

      // Robot grid: the first 24 draws, each a small wheeled robot with its value.
      const GW = Math.round(this.grid.clientWidth) || W;
      const cols = GW < 440 ? 4 : GW < 700 ? 6 : 8, rows = Math.ceil(24 / cols);
      const cw = GW / cols, ch = 64;
      this.grid.setAttribute("viewBox", `0 0 ${GW} ${rows * ch}`);
      let g = "";
      for (let i = 0; i < 24; i++) {
        const v = xs[i], cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch;
        const hit = v >= nearLo && v <= nearHi;
        const col = hit ? "var(--accent-2)" : "var(--muted)";
        // Body tilt hints at the sample's distance from the real robot.
        const tilt = Math.max(-25, Math.min(25, Math.log(v / real) * 40));
        g += `<g transform="translate(${cx.toFixed(1)} ${cy})">
          <rect x="${-cw / 2 + 3}" y="2" width="${cw - 6}" height="${ch - 6}" rx="6" fill="${hit ? "var(--accent-2)" : "none"}" fill-opacity="${hit ? 0.12 : 0}" stroke="var(--border)"/>
          <g transform="translate(${(-cw / 2 + 17).toFixed(1)} 34) rotate(${tilt.toFixed(1)})"><rect x="-6" y="-22" width="12" height="18" rx="2" fill="none" stroke="${col}" stroke-width="1.6"/><line x1="0" y1="-4" x2="0" y2="2" stroke="${col}" stroke-width="1.6"/></g>
          <circle cx="${(-cw / 2 + 17).toFixed(1)}" cy="40" r="6" fill="none" stroke="${col}" stroke-width="1.6"/>
          <text x="${(cw / 2 - 8).toFixed(1)}" y="38" text-anchor="end" font-size="11" font-family="var(--mono)" fill="${hit ? "var(--text)" : "var(--muted)"}">${v.toFixed(2)}×</text>
        </g>`;
      }
      this.grid.innerHTML = g;

      // Readouts computed exactly from the distribution, not from the sample.
      const pNear = m.cdf(nearHi) - m.cdf(nearLo);
      const dRatio = m.pdf(1) > 0 ? m.pdf(real) / m.pdf(1) : 0;
      this.querySelector('[data-o="real"]').textContent = real.toFixed(2) + "×";
      const cov = this.querySelector('[data-v="cov"]');
      cov.textContent = inside ? T.yes : T.no;
      cov.style.color = inside ? "var(--good)" : "var(--bad)";
      this.querySelector('[data-v="near"]').textContent = (100 * pNear).toFixed(1) + "%";
      this.querySelector('[data-v="dens"]').textContent = dRatio.toFixed(2);
      this.querySelector('[data-v="note"]').textContent = T.note[this.s.dist];
      this.querySelector('[data-v="pnote"]').textContent = T.presetNote[this.s.preset];
      this.querySelectorAll("[data-p]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === this.s.preset)));
      this.querySelectorAll("[data-d]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.d === this.s.dist)));
    }
  }
  customElements.define("dr-grid", DrGrid);
})();
