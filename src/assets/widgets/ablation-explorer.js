// <ablation-explorer metric="surv" seeds="1" arm="control"> : the nine-arm interface ablation of the wheeled-leg robot (Day 14).
// Toggle which of the four interface pieces are removed and see where that arm lands, next to every other arm,
// with the evaluator's noise floor drawn as a band. Data: removing-more-made-it-better.html (seed 0, n = 3000).
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "消融浏览器：轮足机器人的九组接口消融",
        pieces: "删掉哪些部件",
        piece: { stack: "帧堆叠（4 帧 → 1 帧）", lpf: "里程计低通（50 ms）", est: "航向估计器", noise: "上一动作噪声" },
        metric: "看哪个指标",
        metrics: { surv: "存活率", bin: "36–44 ms 档", wob: "晃动 sd" },
        seeds: "种子",
        seed1: "1 个种子",
        seed3: "3 个种子",
        band: "评估器噪声带 ±0.011（单种子）",
        sep: "3 个种子：control 最差的高于 combo 最好的，差别是真的",
        repeats: "同一检查点重评 3 次",
        notRun: (k) => `没跑过。16 种开关组合里只测了 7 种，这一种（删掉 ${k} 个部件）没有数据，也就没有数字可看。`,
        surv: "存活率",
        dSurv: "相对 control",
        bin: "36–44 ms 档",
        wob: "晃动 sd",
        inside: "存活率在噪声带内，单个种子分不出它和 control",
        edge: "存活率正好压在噪声带边上，一个种子说不清",
        outside: "存活率在噪声带外，这个差别是真的",
        ref: "参照组",
        never: "从没站稳（第 700 次迭代被停，回合长度 62）",
        jerk: "低通换成 jerk 惩罚",
        noFloor: "这个指标没有测过重复评估的散布，所以这里不画噪声带。",
        seedNote: "3 个种子只跑了 control 和 combo。control 最差的种子 0.973 仍高于 combo 最好的 0.971。",
        seedBin: "这个档只有 3 个种子的均值：control 0.923，combo 0.905。",
        names: { control: "control", nolpf: "nolpf", gyroyaw: "gyroyaw", h1: "h1", noreg: "noreg", h1_noreg: "h1_noreg", combo: "combo", jerk1: "nolpf_jerk1", jerk4: "nolpf_jerk4" },
        removed: "删掉了",
        none: "什么都没删",
        mean: "均值",
      }
    : {
        title: "Ablation explorer: the wheeled-leg robot's nine arms",
        pieces: "Pieces removed",
        piece: { stack: "Frame stack (4 → 1)", lpf: "Odometry low-pass (50 ms)", est: "Yaw estimator", noise: "prev_action noise" },
        metric: "Metric",
        metrics: { surv: "Survival", bin: "36–44 ms bin", wob: "Wobble sd" },
        seeds: "Seeds",
        seed1: "1 seed",
        seed3: "3 seeds",
        band: "evaluator noise floor ±0.011 (one seed)",
        sep: "three seeds: the control's worst beats combo's best, so the gap is real",
        repeats: "one checkpoint, evaluated 3 times",
        notRun: (k) => `Not run. Only 7 of the 16 on/off combinations were measured, and this one (${k} removed) is not among them, so there is no number to show.`,
        surv: "Survival",
        dSurv: "vs control",
        bin: "36–44 ms bin",
        wob: "Wobble sd",
        inside: "survival is inside the noise floor, so one seed cannot tell it apart from the control",
        edge: "survival sits right on the edge of the noise floor, so one seed cannot settle it",
        outside: "survival is outside the noise floor, so this difference is real",
        ref: "the reference",
        never: "never balanced (killed at iteration 700, episode length 62)",
        jerk: "low-pass swapped for a jerk penalty",
        noFloor: "No repeat spread was measured for this metric, so no band is drawn.",
        seedNote: "Only control and combo got three seeds. The control's worst seed, 0.973, still beats combo's best, 0.971.",
        seedBin: "For this bin only the three-seed means exist: control 0.923, combo 0.905.",
        names: { control: "control", nolpf: "nolpf", gyroyaw: "gyroyaw", h1: "h1", noreg: "noreg", h1_noreg: "h1_noreg", combo: "combo", jerk1: "nolpf_jerk1", jerk4: "nolpf_jerk4" },
        removed: "removed",
        none: "nothing removed",
        mean: "mean",
      };

  const PIECES = ["stack", "lpf", "est", "noise"];
  // Seed 0, model_4999, eval n = 3000, seed 12345, full domain randomisation.
  const ARMS = [
    { id: "control", rm: [], surv: 0.976, bin: 0.936, wob: 1.58 },
    { id: "nolpf", rm: ["lpf"], surv: 0.979, bin: 0.933, wob: 2.46 },
    { id: "gyroyaw", rm: ["est"], surv: 0.973, bin: 0.925, wob: 1.99 },
    { id: "noreg", rm: ["noise"], surv: 0.97, bin: 0.911, wob: 1.46 },
    { id: "h1", rm: ["stack"], surv: 0.911, bin: 0.757, wob: 1.54 },
    { id: "h1_noreg", rm: ["stack", "noise"], surv: 0.923, bin: 0.797, wob: 1.85 },
    { id: "combo", rm: ["stack", "lpf", "est", "noise"], surv: 0.97, bin: 0.912, wob: 1.23 },
    { id: "jerk1", rm: ["lpf"], jerk: true, surv: 0.965, bin: 0.891, wob: 1.09 },
    { id: "jerk4", rm: ["lpf"], jerk: true, dead: true },
  ];
  const SEEDS = { control: { surv: [0.976, 0.975, 0.973], bin: 0.923 }, combo: { surv: [0.97, 0.964, 0.971], bin: 0.905 } };
  const REPEATS = [0.974, 0.976, 0.982];
  const FLOOR = 0.011;
  const RANGE = { surv: [0.9, 0.99], bin: [0.74, 0.95], wob: [1.0, 2.6] };
  const key = (rm) => PIECES.filter((p) => rm.includes(p)).join("+");

  class AblationExplorer extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const start = ARMS.find((x) => x.id === this.getAttribute("arm")) || ARMS[0];
      this.s = {
        rm: [...start.rm],
        sel: start.id,
        metric: this.getAttribute("metric") || "surv",
        seeds: this.getAttribute("seeds") === "3" ? 3 : 1,
      };
      this.innerHTML = `
        <div class="widget ablation-explorer">
          <p class="widget-title">${T.title}</p>
          <p class="note" style="margin:0 0 .4rem">${T.pieces}</p>
          <div class="ae-chips" style="display:flex;flex-wrap:wrap;gap:.4rem">
            ${PIECES.map((p) => `<button type="button" class="ae-chip" data-p="${p}" style="font:inherit;font-size:.85rem;padding:.35rem .65rem;border:1px solid var(--border);border-radius:999px;background:none;color:var(--text);cursor:pointer">${T.piece[p]}</button>`).join("")}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center;margin:.75rem 0 .25rem">
            <span class="seg" role="group" aria-label="${T.metric}">
              ${Object.keys(T.metrics).map((m) => `<button type="button" data-m="${m}">${T.metrics[m]}</button>`).join("")}
            </span>
            <span class="seg" role="group" aria-label="${T.seeds}">
              <button type="button" data-s="1">${T.seed1}</button><button type="button" data-s="3">${T.seed3}</button>
            </span>
          </div>
          <svg role="img" aria-label="${T.title}"></svg>
          <div class="readout">
            <div><small>${T.surv}</small><b data-v="surv"></b></div>
            <div><small>${T.bin}</small><b data-v="bin"></b></div>
            <div><small>${T.wob}</small><b data-v="wob"></b></div>
          </div>
          <p class="note" data-v="status" aria-live="polite"></p>
          <p class="note" data-v="foot"></p>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll(".ae-chip").forEach((b) =>
        b.addEventListener("click", () => {
          const p = b.dataset.p;
          const rm = this.s.rm.includes(p) ? this.s.rm.filter((x) => x !== p) : [...this.s.rm, p];
          this.s.rm = rm;
          const hit = ARMS.find((a) => !a.jerk && key(a.rm) === key(rm));
          this.s.sel = hit ? hit.id : null;
          this.render();
        })
      );
      this.querySelectorAll("[data-m]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.metric = b.dataset.m;
          this.render();
        })
      );
      this.querySelectorAll("[data-s]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.seeds = Number(b.dataset.s);
          this.render();
        })
      );
      this.svg.addEventListener("click", (e) => {
        const g = e.target.closest("[data-arm]");
        if (!g) return;
        const a = ARMS.find((x) => x.id === g.dataset.arm);
        this.s.sel = a.id;
        this.s.rm = [...a.rm];
        this.render();
      });
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    render() {
      const { rm, sel, metric, seeds } = this.s;
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 460;
      const rowH = 26, padT = narrow ? 34 : 28, padB = 30, labelW = narrow ? 84 : 104, padR = 14;
      const H = padT + ARMS.length * rowH + padB;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const zoom = seeds === 3 && metric === "surv";
      const [lo, hi] = zoom ? [0.955, 0.99] : RANGE[metric];
      const X = (v) => labelW + ((v - lo) / (hi - lo)) * (W - labelW - padR);
      const rowY = (i) => padT + i * rowH + rowH / 2;
      const ctrl = ARMS[0];
      const ticks = zoom ? [0.96, 0.97, 0.98, 0.99] : metric === "wob" ? [1.0, 1.5, 2.0, 2.5] : metric === "surv" ? [0.9, 0.92, 0.94, 0.96, 0.98] : [0.75, 0.8, 0.85, 0.9, 0.95];
      const fmtT = (v) => (metric === "wob" ? v.toFixed(1) + "°" : v.toFixed(2));
      let s = "";
      // Noise floor for survival only: control ± 0.011, plus the three repeat evaluations.
      if (metric === "surv") {
        const x0 = X(ctrl.surv - FLOOR), x1 = X(ctrl.surv + FLOOR);
        s += `<rect x="${x0}" y="${padT - 4}" width="${x1 - x0}" height="${ARMS.length * rowH + 8}" fill="var(--accent-soft)"/>`;
        s += `<text x="${x1}" y="${padT - 10}" text-anchor="end" font-size="11" fill="var(--accent)" font-family="var(--mono)">${T.band}</text>`;
      }
      ticks.forEach((v) => {
        s += `<line x1="${X(v)}" x2="${X(v)}" y1="${padT - 4}" y2="${H - padB + 4}" stroke="var(--border)" stroke-dasharray="${v === ticks[0] ? "" : "2 3"}"/>`;
        s += `<text x="${X(v)}" y="${H - padB + 18}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${fmtT(v)}</text>`;
      });
      const ctrlV = seeds === 3 && metric === "surv" ? 0.975 : seeds === 3 && metric === "bin" ? SEEDS.control.bin : ctrl[metric];
      if (ctrlV != null) s += `<line x1="${X(ctrlV)}" x2="${X(ctrlV)}" y1="${padT - 4}" y2="${H - padB + 4}" stroke="var(--muted)" stroke-width="1.2"/>`;
      ARMS.forEach((a, i) => {
        const y = rowY(i);
        const on = a.id === sel;
        const col = on ? "var(--accent-2)" : "var(--muted)";
        s += `<g data-arm="${a.id}" style="cursor:pointer">`;
        s += `<rect x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}" fill="${on ? "var(--accent-2-soft)" : "transparent"}"/>`;
        s += `<text x="4" y="${y + 4}" font-size="${narrow ? 11 : 12}" fill="${on ? "var(--text)" : "var(--muted)"}" font-family="var(--mono)" font-weight="${on ? 600 : 400}">${T.names[a.id]}</text>`;
        if (a.dead) {
          s += `<text x="${labelW}" y="${y + 4}" font-size="11" fill="var(--bad)">${narrow ? "✕ " + T.never.split(" (")[0].split("（")[0] : "✕ " + T.never}</text>`;
        } else if (seeds === 3 && SEEDS[a.id] && metric === "surv") {
          const vals = SEEDS[a.id].surv;
          vals.forEach((v, k) => (s += `<circle cx="${X(v)}" cy="${y + (k - 1) * 7}" r="3.2" fill="none" stroke="${col}" stroke-width="1.6"/>`));
          const m = vals.reduce((p, c) => p + c, 0) / vals.length;
          s += `<path d="M${X(m)} ${y - 6}L${X(m) + 6} ${y}L${X(m)} ${y + 6}L${X(m) - 6} ${y}Z" fill="${col}"/>`;
        } else if (seeds === 3 && SEEDS[a.id] && metric === "bin") {
          const m = SEEDS[a.id].bin;
          s += `<path d="M${X(m)} ${y - 6}L${X(m) + 6} ${y}L${X(m)} ${y + 6}L${X(m) - 6} ${y}Z" fill="${col}"/>`;
        } else if (a[metric] < lo) {
          s += `<text x="${labelW + 2}" y="${y + 4}" font-size="11" fill="var(--muted)" font-family="var(--mono)">◂ ${a[metric].toFixed(3)}</text>`;
        } else {
          const v = a[metric];
          s += `<circle cx="${X(v)}" cy="${y}" r="${on ? 6 : 4.5}" fill="${col}" opacity="${seeds === 3 && !on ? 0.45 : 1}" stroke="var(--surface)" stroke-width="1.5"/>`;
        }
        s += `</g>`;
      });
      // The evaluator's repeats sit on the control row, as small ticks.
      if (metric === "surv" && seeds === 1) {
        REPEATS.forEach((v) => (s += `<line x1="${X(v)}" x2="${X(v)}" y1="${rowY(0) - 9}" y2="${rowY(0) + 9}" stroke="var(--accent)" stroke-width="2"/>`));
        if (!narrow) s += `<text x="${X(ctrl.surv - FLOOR) - 8}" y="${rowY(0) + 4}" text-anchor="end" font-size="11" fill="var(--accent)">${T.repeats} →</text>`;
      }
      this.svg.innerHTML = s;

      // Controls state
      this.querySelectorAll(".ae-chip").forEach((b) => {
        const on = rm.includes(b.dataset.p);
        b.setAttribute("aria-pressed", String(on));
        b.style.background = on ? "var(--accent)" : "none";
        b.style.color = on ? "var(--bg)" : "var(--text)";
        b.style.borderColor = on ? "var(--accent)" : "var(--border)";
      });
      this.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === metric)));
      this.querySelectorAll("[data-s]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.s) === seeds)));

      // Readout
      const a = ARMS.find((x) => x.id === sel);
      const put = (k, t) => (this.querySelector(`[data-v="${k}"]`).textContent = t);
      const sign = (d) => (d >= 0 ? "+" : "−") + Math.abs(d).toFixed(3);
      let status;
      if (!a) {
        put("surv", "–"); put("bin", "–"); put("wob", "–");
        status = T.notRun(rm.length);
      } else if (a.dead) {
        put("surv", "–"); put("bin", "–"); put("wob", "–");
        status = ZH ? `${T.names[a.id]}：${T.jerk}，${T.never}。` : `${T.names[a.id]}: ${T.jerk}, ${T.never}.`;
      } else {
        const three = seeds === 3 && SEEDS[a.id];
        const sv = three ? SEEDS[a.id].surv.reduce((p, c) => p + c, 0) / 3 : a.surv;
        const bv = three ? SEEDS[a.id].bin : a.bin;
        const sc = three ? 0.975 : ctrl.surv, bc = three ? SEEDS.control.bin : ctrl.bin;
        const tag = three ? ` ${T.mean}` : "";
        const dS = sv - sc;
        put("surv", a.id === "control" ? sv.toFixed(3) + tag : `${sv.toFixed(3)}${tag} (${sign(dS)})`);
        put("bin", a.id === "control" ? bv.toFixed(3) + tag : `${bv.toFixed(3)}${tag} (${sign(bv - bc)})`);
        const pct = Math.round(((a.wob - ctrl.wob) / ctrl.wob) * 100);
        put("wob", a.id === "control" ? `${a.wob.toFixed(2)}°` : `${a.wob.toFixed(2)}° (${pct >= 0 ? "+" : "−"}${Math.abs(pct)}%)`);
        const what = a.jerk ? T.jerk : a.rm.length ? `${T.removed}: ${a.rm.map((p) => T.piece[p]).join(", ")}` : T.none;
        const verdict = a.id === "control" ? T.ref : three ? T.sep : Math.abs(Math.abs(dS) - FLOOR) < 5e-4 ? T.edge : Math.abs(dS) < FLOOR ? T.inside : T.outside;
        status = ZH ? `${T.names[a.id]}（${what}）：${verdict}。` : `${T.names[a.id]} (${what}): ${verdict}.`;
      }
      put("status", status);
      put("foot", metric === "surv" ? (seeds === 3 ? T.seedNote : "") : seeds === 3 && metric === "bin" ? T.seedBin + " " + T.noFloor : T.noFloor);
    }
  }
  customElements.define("ablation-explorer", AblationExplorer);
})();
