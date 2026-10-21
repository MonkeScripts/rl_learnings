// <gamma-horizon gamma="0.999" hz="100" k="100">
// Discount factor -> effective horizon in steps and seconds, the weight gamma^k at a chosen
// step k, and the decay curve gamma^k with the 1/(1-gamma) point marked.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const L = {
    en: {
      title: "Discount factor to horizon",
      gamma: "Discount γ",
      hz: "Control rate",
      k: "Look k steps ahead",
      horizon: "Effective horizon 1/(1−γ)",
      seconds: "Horizon in seconds",
      weight: "Weight γᵏ",
      half: "Weight halves after",
      steps: "steps",
      note: (H, g) =>
        `At step 1/(1−γ) the weight has fallen to about 1/e ≈ 0.37. If every reward is at most 1, G can never exceed ${H} (that is 1/(1−γ) again), so the sum stays finite for γ = ${g}.`,
      axis: "steps ahead (k)",
    },
    zh: {
      title: "折扣因子与时间跨度",
      gamma: "折扣 γ",
      hz: "控制频率",
      k: "往后看 k 步",
      horizon: "有效跨度 1/(1−γ)",
      seconds: "换算成秒",
      weight: "权重 γᵏ",
      half: "权重减半需要",
      steps: "步",
      note: (H, g) =>
        `到第 1/(1−γ) 步时，权重大约掉到 1/e ≈ 0.37。如果每一步奖励最多是 1，那么 G 永远不会超过 ${H}（又是 1/(1−γ)），所以 γ = ${g} 时这个和是有限的。`,
      axis: "往后的步数 (k)",
    },
  };

  const fmtGamma = (g, x) => {
    const d = Math.min(5, Math.max(2, Math.ceil(x - 1e-9) + 1));
    return g.toFixed(d).replace(/0+$/, "").replace(/\.$/, "");
  };
  const fmtNum = (v) => {
    if (v >= 100) return Math.round(v).toLocaleString("en-US");
    if (v >= 10) return v.toFixed(1);
    return v.toFixed(2);
  };
  const fmtWeight = (w) => (w >= 0.001 ? w.toFixed(3) : w.toExponential(1));
  const fmtSec = (s0) => { const s = +s0.toPrecision(6); return fmtSecRaw(s); };
  const fmtSecRaw = (s) => (s >= 100 ? Math.round(s) : s >= 10 ? s.toFixed(1) : s.toFixed(2)) + " s";
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (parent) parent.appendChild(n);
    return n;
  };

  customElements.define(
    "gamma-horizon",
    class extends HTMLElement {
      connectedCallback() {
        if (this._built) return;
        this._built = true;
        const t = L[document.documentElement.lang.startsWith("zh") ? "zh" : "en"];
        this.t = t;
        const g0 = Math.min(0.9999, Math.max(0.9, parseFloat(this.getAttribute("gamma")) || 0.999));
        const hz0 = Math.min(1000, Math.max(10, parseFloat(this.getAttribute("hz")) || 100));
        const k0 = Math.max(0, parseInt(this.getAttribute("k") ?? "100", 10) || 0);
        const uid = Math.random().toString(36).slice(2, 8);

        const wrap = document.createElement("div");
        wrap.className = "widget";
        wrap.innerHTML = `
          <p class="widget-title">${t.title}</p>
          <div class="widget-controls">
            <label for="g-${uid}">${t.gamma} <output class="num" data-o="g"></output>
              <input id="g-${uid}" type="range" min="1" max="4" step="0.01" data-i="g"></label>
            <label for="h-${uid}">${t.hz} <output class="num" data-o="hz"></output>
              <input id="h-${uid}" type="range" min="10" max="1000" step="10" data-i="hz"></label>
            <label for="k-${uid}">${t.k} <output class="num" data-o="k"></output>
              <input id="k-${uid}" type="range" min="0" step="1" data-i="k"></label>
          </div>
          <div class="readout">
            <div><small>${t.horizon}</small><b data-o="H"></b></div>
            <div><small>${t.seconds}</small><b data-o="Hs"></b></div>
            <div><small>${t.weight}</small><b data-o="w"></b></div>
            <div><small>${t.half}</small><b data-o="half"></b></div>
          </div>
          <div data-o="svg"></div>
          <p class="note" data-o="note"></p>`;
        this.appendChild(wrap);
        this.q = (s) => wrap.querySelector(s);
        this.inG = this.q('[data-i="g"]');
        this.inHz = this.q('[data-i="hz"]');
        this.inK = this.q('[data-i="k"]');
        this.inG.value = -Math.log10(1 - g0);
        this.inHz.value = hz0;
        this.k = k0;
        this.buildSvg();
        this.inG.addEventListener("input", () => this.update());
        this.inHz.addEventListener("input", () => this.update());
        this.inK.addEventListener("input", () => {
          this.k = parseInt(this.inK.value, 10);
          this.update();
        });
        this.update();
      }

      buildSvg() {
        const W = 320, H = 170;
        this.box = { W, H, l: 34, r: 12, t: 12, b: 34 };
        const s = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": this.t.weight });
        s.style.color = "var(--text)";
        const b = this.box;
        el("line", { x1: b.l, y1: H - b.b, x2: W - b.r, y2: H - b.b, stroke: "var(--border)" }, s);
        el("line", { x1: b.l, y1: b.t, x2: b.l, y2: H - b.b, stroke: "var(--border)" }, s);
        for (const y of [0, 0.5, 1]) {
          const py = this.py(y);
          el("line", { x1: b.l - 3, y1: py, x2: b.l, y2: py, stroke: "var(--muted)" }, s);
          const tx = el("text", { x: b.l - 6, y: py + 3.5, "text-anchor": "end", "font-size": 10, fill: "var(--muted)" }, s);
          tx.textContent = y.toString();
        }
        this.xticks = el("g", {}, s);
        const ax = el("text", { x: (b.l + W - b.r) / 2, y: H - 4, "text-anchor": "middle", "font-size": 10, fill: "var(--muted)" }, s);
        ax.textContent = this.t.axis;
        this.area = el("path", { fill: "var(--accent)", "fill-opacity": 0.12, stroke: "none" }, s);
        this.curve = el("path", { fill: "none", stroke: "var(--accent)", "stroke-width": 2 }, s);
        this.hLine = el("line", { stroke: "var(--accent)", "stroke-dasharray": "3 3" }, s);
        this.hDot = el("circle", { r: 4, fill: "var(--accent)" }, s);
        this.hLab = el("text", { "font-size": 10, fill: "var(--accent)" }, s);
        this.hLab.textContent = "1/(1−γ)";
        this.kLine = el("line", { stroke: "var(--accent-2)", "stroke-dasharray": "2 2" }, s);
        this.kDot = el("circle", { r: 4, fill: "var(--surface)", stroke: "var(--accent-2)", "stroke-width": 2 }, s);
        this.kLab = el("text", { "font-size": 10, fill: "var(--accent-2)", "text-anchor": "middle" }, s);
        this.q('[data-o="svg"]').appendChild(s);
      }

      py(y) {
        const b = this.box;
        return b.t + (1 - y) * (b.H - b.t - b.b);
      }

      update() {
        const t = this.t;
        const x = parseFloat(this.inG.value);
        const g = 1 - Math.pow(10, -x);
        const hz = parseFloat(this.inHz.value);
        const Hs = 1 / (1 - g);
        const kMax = Math.max(10, Math.ceil(4 * Hs));
        this.inK.max = kMax;
        this.k = Math.min(this.k, kMax);
        this.inK.value = this.k;
        const k = this.k;
        const w = Math.pow(g, k);
        const half = Math.log(0.5) / Math.log(g);

        const gs = fmtGamma(g, x);
        this.q('[data-o="g"]').textContent = gs;
        this.q('[data-o="hz"]').textContent = `${hz} Hz`;
        this.q('[data-o="k"]').textContent = `${k} (${fmtSec(k / hz)})`;
        this.q('[data-o="H"]').textContent = `${fmtNum(Hs)} ${t.steps}`;
        this.q('[data-o="Hs"]').textContent = fmtSec(Hs / hz);
        this.q('[data-o="w"]').textContent = fmtWeight(w);
        this.q('[data-o="half"]').textContent = `${fmtNum(half)} ${t.steps}`;
        this.q('[data-o="note"]').textContent = t.note(fmtNum(Hs), gs);

        // Curve: domain 0..max(3H, 1.1k)
        const b = this.box;
        const dom = Math.max(3 * Hs, 1.1 * k, 10);
        const px = (kk) => b.l + (kk / dom) * (b.W - b.l - b.r);
        let d = "";
        const N = 120;
        for (let i = 0; i <= N; i++) {
          const kk = (i / N) * dom;
          d += (i ? "L" : "M") + px(kk).toFixed(1) + " " + this.py(Math.pow(g, kk)).toFixed(1);
        }
        this.curve.setAttribute("d", d);
        this.area.setAttribute("d", `${d}L${px(dom).toFixed(1)} ${this.py(0)}L${b.l} ${this.py(0)}Z`);

        const hx = px(Hs), hy = this.py(Math.pow(g, Hs));
        Object.entries({ x1: hx, x2: hx, y1: this.py(0), y2: hy }).forEach(([a, v]) => this.hLine.setAttribute(a, v));
        this.hDot.setAttribute("cx", hx);
        this.hDot.setAttribute("cy", hy);
        this.hLab.setAttribute("x", hx + 6);
        this.hLab.setAttribute("y", hy - 6);

        const kx = px(k), ky = this.py(w);
        Object.entries({ x1: kx, x2: kx, y1: this.py(0), y2: ky }).forEach(([a, v]) => this.kLine.setAttribute(a, v));
        this.kDot.setAttribute("cx", kx);
        this.kDot.setAttribute("cy", ky);
        this.kLab.setAttribute("x", Math.min(Math.max(kx, b.l + 14), b.W - b.r - 14));
        this.kLab.setAttribute("y", Math.max(ky - 8, b.t + 8));
        this.kLab.textContent = "k";

        // x ticks at 0, H, 2H, 3H, labelled in seconds
        this.xticks.replaceChildren();
        for (let i = 0; i <= 3; i++) {
          const kk = i * Hs;
          if (kk > dom) break;
          const X = px(kk);
          el("line", { x1: X, y1: this.py(0), x2: X, y2: this.py(0) + 3, stroke: "var(--muted)" }, this.xticks);
          const tx = el("text", { x: X, y: this.py(0) + 13, "text-anchor": "middle", "font-size": 10, fill: "var(--muted)" }, this.xticks);
          tx.textContent = i === 0 ? "0" : fmtSec((kk) / hz);
        }
      }
    }
  );
})();
