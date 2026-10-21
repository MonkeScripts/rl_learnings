// <gaussian-policy mu="0" sigma="0.37" volts="8"> : Gaussian policy sampler (Day 6).
// Samples actions a = mu + sigma * eps on the normalised [-1, 1] range, shows the differential
// entropy ln(sigma * sqrt(2 pi e)) and where it crosses zero (sigma = 0.242), animates the
// shrinking std (explore -> exploit), and switches to deployment, where the action is the mean.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "高斯策略采样器",
        mu: "均值 μ（最佳猜测）",
        sigma: "标准差 σ（探索）",
        train: "训练：采样",
        deploy: "部署：取均值",
        shrink: "让 σ 收缩",
        resample: "重新采样",
        scatter: "散布 ±σ",
        entropy: "熵 H（每个动作维度）",
        rail: "落到限幅外",
        sent: "发出的动作",
        axisA: "动作 a（归一化，±1 = ±V 伏）",
        axisS: "σ（对数刻度）",
        zero: "H = 0",
        start: "exp(−1)",
        density: "π(a | s)",
        noteTrain: (s, v) => `训练时每一步都采样 a = μ + σ·ε。σ = ${s}，大约是 ±${v} V 的散布。每个采样动作都是一次小实验。`,
        noteDeploy: (m, v) => `部署时不再采样。每一步都发出 μ = ${m}（${v} V），σ 不再起作用。噪声只是学习用的脚手架。`,
        neg: "熵是负的。对连续动作来说这很正常，只说明 σ 小于 0.242。看趋势，不看正负。",
        pos: "熵是正的：σ 大于 0.242。符号本身没有意义。",
      }
    : {
        title: "Gaussian policy sampler",
        mu: "Mean μ (best guess)",
        sigma: "Std σ (exploration)",
        train: "Train: sample",
        deploy: "Deploy: mean",
        shrink: "Shrink σ",
        resample: "Resample",
        scatter: "Scatter ±σ",
        entropy: "Entropy H (per action)",
        rail: "Past the rail",
        sent: "Action sent",
        axisA: "action a (normalised, ±1 = ±V volts)",
        axisS: "σ (log scale)",
        zero: "H = 0",
        start: "exp(−1)",
        density: "π(a | s)",
        noteTrain: (s, v) => `Training samples a = μ + σ·ε at every step. σ = ${s} is about ±${v} V of scatter. Every sampled action is a tiny experiment.`,
        noteDeploy: (m, v) => `Deployed: no sampling. Every step sends μ = ${m} (${v} V) and σ is ignored. The noise was scaffolding for learning.`,
        neg: "Entropy is negative. For a continuous action that is normal: it only says σ is below 0.242. Watch the trend, not the sign.",
        pos: "Entropy is positive: σ is above 0.242. The sign by itself means nothing.",
      };

  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const H0 = 0.5 * Math.log(2 * Math.PI * Math.E); // 1.419
  const S_ZERO = 1 / Math.sqrt(2 * Math.PI * Math.E); // 0.242
  const S_MIN = 0.02, S_MAX = 1.5;
  const A_MAX = 1.6; // x range of the action plot
  const N = 48;

  // Box-Muller standard normals
  const randn = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  // Normal CDF (Abramowitz-Stegun 7.1.26 via erf)
  const erf = (x) => {
    const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a);
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
    return s * y;
  };
  const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

  class GaussianPolicy extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        mu: clamp(Number(this.getAttribute("mu") ?? 0), -1, 1),
        sigma: clamp(Number(this.getAttribute("sigma") ?? Math.exp(-1)), S_MIN, S_MAX),
        volts: Number(this.getAttribute("volts") ?? 8),
        deploy: false,
      };
      this.eps = Array.from({ length: N }, randn);
      this.innerHTML = `
        <div class="widget gaussian-policy">
          <p class="widget-title">${T.title}</p>
          <svg role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            <label>${T.mu} <output data-o="mu"></output><input type="range" data-k="mu" min="-1" max="1" step="0.01"></label>
            <label>${T.sigma} <output data-o="sigma"></output><input type="range" data-k="sigma" min="${Math.log10(S_MIN)}" max="${Math.log10(S_MAX)}" step="0.005"></label>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center">
            <span class="seg" role="group">
              <button type="button" data-mode="0">${T.train}</button><button type="button" data-mode="1">${T.deploy}</button>
            </span>
            <button type="button" class="button" data-act="shrink">${T.shrink}</button>
            <button type="button" class="button secondary" data-act="resample">${T.resample}</button>
          </div>
          <div class="readout">
            <div><small>${T.scatter}</small><b data-v="scatter"></b></div>
            <div><small>${T.entropy}</small><b data-v="H"></b></div>
            <div><small>${T.rail}</small><b data-v="rail"></b></div>
            <div><small>${T.sent}</small><b data-v="sent"></b></div>
          </div>
          <p class="note" data-v="note" aria-live="polite"></p>
          <p class="note" data-v="sign"></p>
        </div>`;
      this.svg = this.querySelector("svg");
      this.inMu = this.querySelector('input[data-k="mu"]');
      this.inS = this.querySelector('input[data-k="sigma"]');
      this.inMu.addEventListener("input", () => { this.s.mu = Number(this.inMu.value); this.render(); });
      this.inS.addEventListener("input", () => { this.s.sigma = Math.pow(10, Number(this.inS.value)); this.render(); });
      this.querySelectorAll("[data-mode]").forEach((b) =>
        b.addEventListener("click", () => { this.s.deploy = b.dataset.mode === "1"; this.render(); })
      );
      this.querySelector('[data-act="resample"]').addEventListener("click", () => {
        this.eps = Array.from({ length: N }, randn);
        this.render();
      });
      this.querySelector('[data-act="shrink"]').addEventListener("click", () => this.shrink());
      this.syncInputs();
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    syncInputs() {
      this.inMu.value = this.s.mu;
      this.inS.value = Math.log10(this.s.sigma);
    }

    // Explore -> exploit: sigma decays geometrically while fresh samples keep coming.
    shrink() {
      if (this._busy) return;
      this._busy = true;
      this.s.deploy = false;
      let i = 0;
      const tick = () => {
        this.s.sigma = Math.max(0.04, this.s.sigma * 0.9);
        this.eps = this.eps.map((e, j) => (j % 4 === i % 4 ? randn() : e));
        this.syncInputs();
        this.render();
        if (++i < 30 && this.s.sigma > 0.04) setTimeout(tick, 70);
        else this._busy = false;
      };
      tick();
    }

    render() {
      const { mu, sigma, volts, deploy } = this.s;
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 440;
      const padL = 34, padR = 12;
      const topH = narrow ? 150 : 180, gap = narrow ? 60 : 62, botH = narrow ? 112 : 128;
      const H = topH + gap + botH + 40;
      if (this._w !== W) {
        this._w = W;
        this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      }
      const fs = 11;
      const mono = 'font-family="var(--mono)"';
      // ---- top panel: density and samples on the action axis
      const t0 = 8, base = t0 + topH - 26; // baseline of the density
      const dotY = base + 14;
      const X = (a) => padL + ((a + A_MAX) / (2 * A_MAX)) * (W - padL - padR);
      // Height of the bell grows as 1/sigma, capped so a tight policy still fits.
      const peakFrac = Math.min(1, 0.16 / sigma);
      const amp = (base - t0 - 6) * peakFrac;
      let d = "";
      const M = 240;
      for (let i = 0; i <= M; i++) {
        const a = -A_MAX + (2 * A_MAX * i) / M;
        const z = (a - mu) / sigma;
        const y = base - amp * Math.exp(-0.5 * z * z);
        d += (i ? "L" : "M") + X(a).toFixed(1) + " " + y.toFixed(1);
      }
      const ticksA = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5];
      const samples = this.eps.map((e) => mu + sigma * e);
      const dots = deploy
        ? this.eps.map((_, j) => `<circle cx="${X(mu)}" cy="${dotY + (j % 3) * 4}" r="3" fill="var(--accent-2)" opacity="0.5"/>`).join("")
        : samples
            .map((a, j) => {
              const out = Math.abs(a) > 1;
              const ax = clamp(a, -A_MAX, A_MAX);
              return `<circle cx="${X(ax).toFixed(1)}" cy="${dotY + (j % 3) * 4}" r="3" fill="${out ? "var(--bad)" : "var(--accent-2)"}" opacity="0.75"/>`;
            })
            .join("");
      // Label beside the peak, on whichever side has room.
      const lab = (y) => (mu > 0.3 ? `x="${X(mu) - 8}" text-anchor="end"` : `x="${X(mu) + 8}"`) + ` y="${y}"`;
      const bell = deploy
        ? `<line x1="${X(mu)}" x2="${X(mu)}" y1="${base}" y2="${t0 + 4}" stroke="var(--accent)" stroke-width="3"/>
           <text ${lab(t0 + 14)} font-size="${fs}" fill="var(--accent)" ${mono}>a = μ</text>`
        : `<path d="${d}L${X(A_MAX)} ${base}L${X(-A_MAX)} ${base}Z" fill="var(--accent)" fill-opacity="0.12"/>
           <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2"/>
           <line x1="${X(mu - sigma)}" x2="${X(mu + sigma)}" y1="${base - amp * 0.6065}" y2="${base - amp * 0.6065}" stroke="var(--accent)" stroke-dasharray="3 3"/>
           <text ${lab(Math.max(t0 + 12, base - amp - 6))} font-size="${fs}" fill="var(--accent)" ${mono}>${T.density}</text>`;
      const top = `
        <rect x="${X(-A_MAX)}" y="${t0}" width="${X(-1) - X(-A_MAX)}" height="${base - t0}" fill="var(--bad)" fill-opacity="0.07"/>
        <rect x="${X(1)}" y="${t0}" width="${X(A_MAX) - X(1)}" height="${base - t0}" fill="var(--bad)" fill-opacity="0.07"/>
        <line x1="${X(-1)}" x2="${X(-1)}" y1="${t0}" y2="${base}" stroke="var(--bad)" stroke-opacity="0.5" stroke-dasharray="2 3"/>
        <line x1="${X(1)}" x2="${X(1)}" y1="${t0}" y2="${base}" stroke="var(--bad)" stroke-opacity="0.5" stroke-dasharray="2 3"/>
        <line x1="${padL}" x2="${W - padR}" y1="${base}" y2="${base}" stroke="var(--border)"/>
        ${bell}
        <line x1="${X(mu)}" x2="${X(mu)}" y1="${base}" y2="${base + 5}" stroke="var(--accent)" stroke-width="2"/>
        ${dots}
        ${ticksA.map((v) => `<text x="${X(v)}" y="${dotY + 26}" text-anchor="middle" font-size="${fs}" fill="var(--muted)" ${mono}>${v}</text>`).join("")}
        <text x="${(padL + W - padR) / 2}" y="${dotY + 40}" text-anchor="middle" font-size="${fs}" fill="var(--muted)">${T.axisA.replace("V", volts)}</text>`;

      // ---- bottom panel: entropy against sigma (log x)
      const b0 = t0 + topH + gap, b1 = b0 + botH;
      const hMin = -3, hMax = 1.0;
      const SX = (s) => padL + ((Math.log10(s) - Math.log10(S_MIN)) / (Math.log10(S_MAX) - Math.log10(S_MIN))) * (W - padL - padR);
      const HY = (h) => b0 + ((hMax - h) / (hMax - hMin)) * (b1 - b0);
      let e = "";
      for (let i = 0; i <= 120; i++) {
        const s = Math.pow(10, Math.log10(S_MIN) + (i / 120) * (Math.log10(S_MAX) - Math.log10(S_MIN)));
        e += (i ? "L" : "M") + SX(s).toFixed(1) + " " + HY(Math.log(s) + H0).toFixed(1);
      }
      const Hcur = Math.log(sigma) + H0;
      const ticksS = [0.02, 0.05, 0.1, 0.242, 0.5, 1];
      const bottom = `
        <line x1="${padL}" x2="${W - padR}" y1="${HY(0)}" y2="${HY(0)}" stroke="var(--border)"/>
        <line x1="${padL}" x2="${padL}" y1="${b0}" y2="${b1}" stroke="var(--border)"/>
        ${[1, 0, -1, -2, -3].map((v) => `<text x="${padL - 6}" y="${HY(v) + 4}" text-anchor="end" font-size="${fs}" fill="var(--muted)" ${mono}>${v}</text>`).join("")}
        <text x="${padL + 4}" y="${b0 - 6}" font-size="${fs}" fill="var(--muted)">H = ln(σ√(2πe))</text>
        <path d="${e}" fill="none" stroke="var(--accent)" stroke-width="2"/>
        <line x1="${SX(S_ZERO)}" x2="${SX(S_ZERO)}" y1="${b0}" y2="${b1}" stroke="var(--muted)" stroke-dasharray="2 3"/>
        <line x1="${SX(Math.exp(-1))}" x2="${SX(Math.exp(-1))}" y1="${HY(-1 + H0) - 9}" y2="${HY(-1 + H0) + 9}" stroke="var(--accent-2)"/>
        ${narrow ? "" : `<text x="${SX(Math.exp(-1)) + 6}" y="${HY(-1 + H0) + 22}" font-size="${fs}" fill="var(--accent-2)" ${mono}>${T.start}</text>`}
        ${ticksS.map((v) => `<line x1="${SX(v)}" x2="${SX(v)}" y1="${b1}" y2="${b1 + 4}" stroke="var(--muted)"/><text x="${SX(v)}" y="${b1 + 16}" text-anchor="middle" font-size="${fs}" fill="${v === 0.242 ? "var(--text)" : "var(--muted)"}" ${mono}>${v}</text>`).join("")}
        <text x="${W - padR}" y="${b1 + 30}" text-anchor="end" font-size="${fs}" fill="var(--muted)">${T.axisS}</text>
        <circle cx="${SX(sigma)}" cy="${HY(Hcur)}" r="6" fill="${deploy ? "var(--muted)" : "var(--accent-2)"}" stroke="var(--surface)" stroke-width="2"/>`;

      this.svg.innerHTML = top + bottom;

      // ---- readouts
      const pRail = deploy ? (Math.abs(mu) > 1 ? 1 : 0) : 1 - (Phi((1 - mu) / sigma) - Phi((-1 - mu) / sigma));
      this.querySelector('[data-o="mu"]').textContent = `${mu.toFixed(2)} (${(mu * volts).toFixed(1)} V)`;
      this.querySelector('[data-o="sigma"]').textContent = `${sigma.toFixed(3)} (log σ ${Math.log(sigma).toFixed(2)})`;
      this.querySelector('[data-v="scatter"]').textContent = deploy ? "0 V" : `±${(sigma * volts).toFixed(2)} V`;
      const hEl = this.querySelector('[data-v="H"]');
      hEl.textContent = `${Hcur >= 0 ? "+" : "−"}${Math.abs(Hcur).toFixed(3)}`;
      hEl.style.color = Hcur >= 0 ? "var(--good)" : "var(--amber, var(--bad))";
      this.querySelector('[data-v="rail"]').textContent = `${(100 * pRail).toFixed(1)} %`;
      const a0 = deploy ? mu : clamp(samples[0], -1, 1);
      this.querySelector('[data-v="sent"]').textContent = `${a0 >= 0 ? "+" : "−"}${Math.abs(a0 * volts).toFixed(2)} V`;
      this.querySelector('[data-v="note"]').textContent = deploy
        ? T.noteDeploy(mu.toFixed(2), (mu * volts).toFixed(1))
        : T.noteTrain(sigma.toFixed(2), (sigma * volts).toFixed(1));
      this.querySelector('[data-v="sign"]').textContent = Hcur < 0 ? T.neg : T.pos;
      this.querySelectorAll("[data-mode]").forEach((b) =>
        b.setAttribute("aria-pressed", String((b.dataset.mode === "1") === deploy))
      );
    }
  }
  customElements.define("gaussian-policy", GaussianPolicy);
})();
