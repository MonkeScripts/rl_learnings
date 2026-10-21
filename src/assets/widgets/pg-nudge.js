// <pg-nudge mode="raw" alpha="0.08" noise="15"> : a two-button softmax policy nudged by G (Day 5).
// One state, two buttons. Each press is a one-step episode that pays a noisy return G
// (always positive, like CartPole's +1 per step). Every update samples a batch of 8 presses
// and moves the logit by alpha * mean(w * grad log pi(a)), with w = G or w = G - mean(G).
// Twenty seeds are run side by side so the spread of the lines is the variance.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "被 G 推着走的两键策略",
        mode: "权重 w",
        raw: "原始 G",
        base: "G − 批均值",
        alpha: "学习率 α",
        noise: "G 的噪声（标准差）",
        resample: "换 20 个种子重跑",
        yLab: "P(右)",
        xLab: "更新次数",
        better: "右键更好：平均 G 50，左键 40",
        mean: "最终 P(右) 均值",
        spread: "20 次之间的离散度",
        wrong: "最后偏向更差那个键",
        of: (n) => `${n} / 20 次`,
        noteRaw: "原始 G 永远是正的：不管按了哪个键，那个键的概率都被往上推，只是好键推得多一点。方向平均下来是对的，单次却很吵。",
        noteBase: "减去批均值后，比平常好的按键被往上推，比平常差的被往下推。期望方向没变，噪声小了很多。",
      }
    : {
        title: "A two-button policy nudged by G",
        mode: "Weight w",
        raw: "raw G",
        base: "G − batch mean",
        alpha: "Learning rate α",
        noise: "Noise in G (std)",
        resample: "Rerun with 20 new seeds",
        yLab: "P(right)",
        xLab: "updates",
        better: "Right is better: mean G 50, left 40",
        mean: "Mean final P(right)",
        spread: "Spread across 20 runs",
        wrong: "Ended preferring the worse button",
        of: (n) => `${n} of 20 runs`,
        noteRaw: "Raw G is always positive, so whichever button was pressed gets pushed up, the better one just a bit more. On average the direction is right; any single update is loud.",
        noteBase: "With the batch mean subtracted, presses that did better than usual are pushed up and the rest are pushed down. Same direction on average, far less noise.",
      };

  const N_UPD = 60, BATCH = 8, RUNS = 20, G_L = 40, G_R = 50;

  // Small seeded RNG so a given seed always draws the same lines.
  const mulberry = (a) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = (rnd) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

  function simulate(seed, mode, alpha, noise) {
    const rnd = mulberry(seed);
    let th = 0;
    const ps = [];
    for (let k = 0; k <= N_UPD; k++) {
      const p = 1 / (1 + Math.exp(-th));
      ps.push(p);
      if (k === N_UPD) break;
      const a = [], G = [];
      for (let i = 0; i < BATCH; i++) {
        const right = rnd() < p;
        a.push(right);
        G.push((right ? G_R : G_L) + noise * gauss(rnd));
      }
      const m = G.reduce((s, v) => s + v, 0) / BATCH;
      let g = 0;
      for (let i = 0; i < BATCH; i++) {
        const w = mode === "raw" ? G[i] : G[i] - m;
        g += w * (a[i] ? 1 - p : -p); // d/dθ log π(a), with π(right) = sigmoid(θ)
      }
      th = Math.max(-8, Math.min(8, th + (alpha * g) / BATCH));
    }
    return ps;
  }

  class PgNudge extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        mode: this.getAttribute("mode") === "base" ? "base" : "raw",
        alpha: Number(this.getAttribute("alpha") ?? 0.08),
        noise: Number(this.getAttribute("noise") ?? 15),
        seed: 1,
      };
      this.innerHTML = `
        <div class="widget pg-nudge">
          <p class="widget-title">${T.title}</p>
          <svg role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            <label>${T.alpha} <output data-o="alpha"></output><input type="range" data-k="alpha" min="0.01" max="0.2" step="0.01"></label>
            <label>${T.noise} <output data-o="noise"></output><input type="range" data-k="noise" min="0" max="30" step="1"></label>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center">
            <span class="seg" role="group" aria-label="${T.mode}">
              <button type="button" data-mode="raw">${T.raw}</button><button type="button" data-mode="base">${T.base}</button>
            </span>
            <button type="button" class="button secondary" data-act="resample">${T.resample}</button>
          </div>
          <div class="readout">
            <div><small>${T.mean}</small><b data-v="mean"></b></div>
            <div><small>${T.spread}</small><b data-v="spread"></b></div>
            <div><small>${T.wrong}</small><b data-v="wrong"></b></div>
          </div>
          <p class="note" data-v="note"></p>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.update();
        });
      });
      this.querySelectorAll("[data-mode]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.mode = b.dataset.mode;
          this.update();
        })
      );
      this.querySelector('[data-act="resample"]').addEventListener("click", () => {
        this.s.seed += RUNS;
        this.update();
      });
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.update();
    }

    update() {
      const { mode, alpha, noise, seed } = this.s;
      this.runs = Array.from({ length: RUNS }, (_, i) => simulate(seed + i, mode, alpha, noise));
      this.render();
    }

    render() {
      if (!this.runs) return;
      const W = Math.round(this.svg.clientWidth) || 520;
      const H = W < 440 ? 230 : 280, padL = 40, padR = 12, padT = 22, padB = 34;
      if (this._w !== W) {
        this._w = W;
        this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      }
      const X = (k) => padL + (k / N_UPD) * (W - padL - padR);
      const Y = (p) => padT + (1 - p) * (H - padT - padB);
      const line = (ps) => ps.map((p, k) => (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(p).toFixed(1)).join("");
      const yt = [0, 0.5, 1], xt = [0, 20, 40, 60];
      this.svg.innerHTML = `
        <rect x="${padL}" y="${Y(0.5)}" width="${W - padL - padR}" height="${Y(0) - Y(0.5)}" fill="var(--bad)" opacity="0.06"/>
        ${yt.map((v) => `<line x1="${padL}" x2="${W - padR}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--border)"${v === 0.5 ? ' stroke-dasharray="3 4"' : ""}/><text x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        ${xt.map((v) => `<text x="${X(v)}" y="${H - padB + 16}" text-anchor="${v === N_UPD ? "end" : v === 0 ? "start" : "middle"}" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        <text x="${W - padR}" y="${H - 2}" text-anchor="end" font-size="11" fill="var(--muted)">${T.xLab}</text>
        <text x="${padL}" y="${padT - 8}" font-size="11" fill="var(--muted)">${T.yLab} · ${T.better}</text>
        ${this.runs.slice(1).map((ps) => `<path d="${line(ps)}" fill="none" stroke="var(--accent)" stroke-width="1.2" opacity="0.35"/>`).join("")}
        <path d="${line(this.runs[0])}" fill="none" stroke="var(--accent-2)" stroke-width="2.2"/>`;

      const fin = this.runs.map((ps) => ps[ps.length - 1]);
      const mean = fin.reduce((s, v) => s + v, 0) / RUNS;
      const sd = Math.sqrt(fin.reduce((s, v) => s + (v - mean) ** 2, 0) / RUNS);
      const wrong = fin.filter((v) => v < 0.5).length;
      this.querySelector('[data-o="alpha"]').textContent = this.s.alpha.toFixed(2);
      this.querySelector('[data-o="noise"]').textContent = String(this.s.noise);
      this.querySelector('[data-v="mean"]').textContent = mean.toFixed(2);
      this.querySelector('[data-v="spread"]').textContent = "± " + sd.toFixed(2);
      this.querySelector('[data-v="wrong"]').textContent = T.of(wrong);
      this.querySelector('[data-v="note"]').textContent = this.s.mode === "raw" ? T.noteRaw : T.noteBase;
      this.querySelectorAll("[data-mode]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.mode === this.s.mode))
      );
    }
  }
  customElements.define("pg-nudge", PgNudge);
})();
