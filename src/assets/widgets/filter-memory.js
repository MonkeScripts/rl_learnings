// <filter-memory tau="50" frames="4"> : one-pole low-pass as a memory compressor (Day 13).
// y_t = a*y_{t-1} + (1-a)*x_t with a = 1 - dt/tau, dt = 10 ms (the wheeled-leg robot's 0.8 at tau = 50 ms).
// Panel 1: where the filter's weight sits against a K-frame stack.
// Panel 2: an illustrative push, raw vs filtered pitch, and two moments with the same filtered reading.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "一阶低通滤波器：记忆、滞后与“一帧不是状态”",
        tau: "时间常数 τ",
        frames: "帧堆叠深度 K",
        cut: "截止频率",
        alpha: "系数 a",
        w1: "每一帧过去的数据在滤波输出里占多少权重（每格 10 ms）",
        inWin: "窗口内",
        outWin: "窗口外",
        beyond: (k) => `K = ${k} 帧之外的权重`,
        n95: "堆叠追上 95% 需要",
        nIn: (n) => `${n} 帧 · ${n * 10} 个输入`,
        lag: "平均滞后",
        w2: "一次推（示意信号，不是实测）：真实俯仰 vs 滤波后",
        raw: "真实俯仰",
        filt: "滤波后",
        now: "选一个时刻",
        same: (v, a, b, ta, tb) => `两个时刻滤波读数都是 ${v}°：${ta} ms 时真实俯仰 ${a}°，${tb} ms 时 ${b}°。同一个读数，两种处境。`,
        none: "这一刻的滤波读数在峰的另一侧找不到同值的时刻。",
        nofilt: "τ = 10 ms 时 a = 0：没有滤波，读数就是样本本身。同一个读数对应同一个俯仰角，方向由陀螺仪那一路给出。",
        ms: "ms",
        steps: "往回数的帧",
        t: "时间 (ms)",
      }
    : {
        title: "One-pole low-pass: memory, lag and why one frame is not a state",
        tau: "Time constant τ",
        frames: "Stack depth K",
        cut: "Cutoff",
        alpha: "Coefficient a",
        w1: "How much each past frame counts in the filtered output (10 ms per bar)",
        inWin: "inside the stack",
        outWin: "beyond it",
        beyond: (k) => `Weight beyond K = ${k} frames`,
        n95: "Stack depth to match 95%",
        nIn: (n) => `${n} frames · ${n * 10} inputs`,
        lag: "Mean lag",
        w2: "One push (illustrative signal, not a recording): true pitch vs filtered",
        raw: "true pitch",
        filt: "filtered",
        now: "Pick a moment",
        same: (v, a, b, ta, tb) => `Both moments read ${v}° filtered. True pitch is ${a}° at ${ta} ms and ${b}° at ${tb} ms. One reading, two situations.`,
        none: "No moment on the other side of the peak has this filtered reading.",
        nofilt: "At τ = 10 ms, a = 0: no filter, the reading is the sample. The same reading means the same pitch, and the gyro channel says which way it is going.",
        ms: "ms",
        steps: "frames back",
        t: "time (ms)",
      };

  const DT = 10; // ms, the policy step
  const N = 150; // samples in the push trace (1.5 s)
  const BARS = 40;
  // Illustrative push and recovery: a bump peaking at 120 ms with a small overshoot.
  const push = Array.from({ length: N }, (_, i) => {
    const s = (i * DT) / 120;
    return 6 * s * Math.exp(1 - s) - 1.2 * Math.max(0, Math.sin(Math.min(Math.PI, ((i * DT - 300) / 700) * Math.PI))) * (i * DT > 300 ? 1 : 0);
  });

  class FilterMemory extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        tau: Number(this.getAttribute("tau") ?? 50),
        frames: Number(this.getAttribute("frames") ?? 4),
        now: Number(this.getAttribute("now") ?? 380),
      };
      this.innerHTML = `
        <div class="widget filter-memory">
          <p class="widget-title">${T.title}</p>
          <div class="widget-controls">
            <label>${T.tau} <output data-o="tau"></output><input type="range" data-k="tau" min="10" max="1000" step="10"></label>
            <label>${T.frames} <output data-o="frames"></output><input type="range" data-k="frames" min="1" max="8" step="1"></label>
          </div>
          <p class="note" style="margin:.25rem 0 .4rem;color:var(--muted);font-size:.82rem">${T.w1}</p>
          <svg data-svg="w" role="img" aria-label="${T.w1}"></svg>
          <div class="readout">
            <div><small>${T.alpha} · ${T.cut}</small><b data-v="a"></b></div>
            <div><small data-v="beyondLbl"></small><b data-v="beyond"></b></div>
            <div><small>${T.n95}</small><b data-v="n95"></b></div>
            <div><small>${T.lag}</small><b data-v="lag"></b></div>
          </div>
          <p class="note" style="margin:1.1rem 0 .4rem;color:var(--muted);font-size:.82rem">${T.w2}</p>
          <svg data-svg="t" role="img" aria-label="${T.w2}"></svg>
          <div class="widget-controls">
            <label>${T.now} <output data-o="now"></output><input type="range" data-k="now" min="0" max="${(N - 1) * DT}" step="10"></label>
          </div>
          <p class="note" data-v="twin" aria-live="polite"></p>
        </div>`;
      this.svgW = this.querySelector('[data-svg="w"]');
      this.svgT = this.querySelector('[data-svg="t"]');
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.render();
        });
      });
      new ResizeObserver(() => this.render()).observe(this.svgW);
      this.render();
    }

    render() {
      const { tau, frames: K, now } = this.s;
      const a = Math.max(0, 1 - DT / tau);
      const W = Math.round(this.svgW.clientWidth) || 520;
      const small = W < 440;
      const fmt = (v, d = 1) => v.toFixed(d);

      // ---- Panel 1: weights (1-a) a^k
      {
        const H = small ? 170 : 190, padL = 30, padR = 8, padT = 22, padB = 30;
        this.svgW.setAttribute("viewBox", `0 0 ${W} ${H}`);
        const w = Array.from({ length: BARS }, (_, k) => (1 - a) * Math.pow(a, k));
        const wMax = Math.max(...w, 1e-9);
        const bw = (W - padL - padR) / BARS;
        const Y = (v) => padT + (1 - v / wMax) * (H - padT - padB);
        const bars = w
          .map((v, k) => `<rect x="${(padL + k * bw + 0.5).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${Math.max(1, bw - 1.5).toFixed(1)}" height="${(H - padB - Y(v)).toFixed(1)}" fill="${k < K ? "var(--accent)" : "var(--accent-2)"}" opacity="${k < K ? 1 : 0.55}"/>`)
          .join("");
        const xK = padL + K * bw;
        const ticks = [0, 10, 20, 30, 39];
        this.svgW.innerHTML = `
          <rect x="${padL}" y="${padT}" width="${xK - padL}" height="${H - padT - padB}" fill="var(--accent-soft)"/>
          ${bars}
          <line x1="${xK}" x2="${xK}" y1="${padT - 6}" y2="${H - padB}" stroke="var(--text)" stroke-dasharray="3 3"/>
          <text x="${xK + 4}" y="${padT - 8}" font-size="11" fill="var(--text)">K = ${K}</text>
          <line x1="${padL}" x2="${W - padR}" y1="${H - padB}" y2="${H - padB}" stroke="var(--border)"/>
          ${ticks.map((k) => `<text x="${padL + (k + 0.5) * bw}" y="${H - padB + 14}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${k}</text>`).join("")}
          <text x="${W - padR}" y="${H - 3}" text-anchor="end" font-size="11" fill="var(--muted)">${T.steps}</text>
          <g font-size="11">
            <rect x="${W - padR - (small ? 118 : 150)}" y="${padT - 2}" width="10" height="10" fill="var(--accent)"/>
            <text x="${W - padR - (small ? 104 : 136)}" y="${padT + 7}" fill="var(--muted)">${T.inWin}</text>
            <rect x="${W - padR - (small ? 118 : 150)}" y="${padT + 13}" width="10" height="10" fill="var(--accent-2)" opacity="0.55"/>
            <text x="${W - padR - (small ? 104 : 136)}" y="${padT + 22}" fill="var(--muted)">${T.outWin}</text>
          </g>`;
      }

      // ---- Readouts
      const beyond = Math.pow(a, K);
      const n95 = a === 0 ? 1 : Math.ceil(Math.log(0.05) / Math.log(a) - 1e-9);
      const fc = 1000 / (2 * Math.PI * tau);
      this.querySelector('[data-o="tau"]').textContent = `${tau} ms`;
      this.querySelector('[data-o="frames"]').textContent = `${K}`;
      this.querySelector('[data-v="a"]').textContent = `${fmt(a, 2)} · ${fc < 10 ? fmt(fc, 2) : fmt(fc, 1)} Hz`;
      this.querySelector('[data-v="beyondLbl"]').textContent = T.beyond(K);
      this.querySelector('[data-v="beyond"]').textContent = `${Math.round(beyond * 100)}%`;
      this.querySelector('[data-v="n95"]').textContent = T.nIn(n95);
      this.querySelector('[data-v="lag"]').textContent = `${Math.round((a / (1 - a)) * DT)} ms`;

      // ---- Panel 2: push trace
      {
        const H = small ? 200 : 230, padL = 30, padR = 8, padT = 14, padB = 30;
        this.svgT.setAttribute("viewBox", `0 0 ${W} ${H}`);
        const y = [];
        let acc = push[0];
        for (let i = 0; i < N; i++) {
          acc = a * acc + (1 - a) * push[i];
          y.push(acc);
        }
        const lo = -2, hi = 7;
        const X = (i) => padL + (i / (N - 1)) * (W - padL - padR);
        const Y = (v) => padT + ((hi - v) / (hi - lo)) * (H - padT - padB);
        const line = (arr) => arr.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join("");
        const i1 = Math.round(now / DT);
        // Twin: same filtered value on the other side of the filtered peak.
        let p = 0;
        for (let i = 1; i < N; i++) if (y[i] > y[p]) p = i;
        // Fractional index j where the filtered trace crosses y[i1] on the other side of the peak.
        let j = -1;
        if (a > 0 && i1 !== p) {
          const v = y[i1];
          const [s, e] = i1 < p ? [p, N - 1] : [0, p];
          for (let k = s; k < e; k++) {
            if ((y[k] - v) * (y[k + 1] - v) <= 0 && y[k] !== y[k + 1]) {
              j = k + (v - y[k]) / (y[k + 1] - y[k]);
              if (i1 > p) continue; // keep the last crossing before the peak
              break;
            }
          }
        }
        const at = (arr, f) => {
          const k = Math.min(N - 2, Math.floor(f));
          return arr[k] + (arr[k + 1] - arr[k]) * (f - k);
        };
        const mark = (i, col) => `
          <line x1="${X(i)}" x2="${X(i)}" y1="${padT}" y2="${H - padB}" stroke="${col}" stroke-dasharray="2 3"/>
          <circle cx="${X(i)}" cy="${Y(at(y, i))}" r="5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>
          <circle cx="${X(i)}" cy="${Y(at(push, i))}" r="4.5" fill="none" stroke="${col}" stroke-width="2"/>`;
        const tks = [0, 500, 1000, 1490];
        this.svgT.innerHTML = `
          <line x1="${padL}" x2="${W - padR}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--border)"/>
          <line x1="${padL}" x2="${padL}" y1="${padT}" y2="${H - padB}" stroke="var(--border)"/>
          ${[-2, 0, 2, 4, 6].map((v) => `<text x="${padL - 5}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}°</text>`).join("")}
          ${tks.map((t) => `<text x="${X(t / DT)}" y="${H - padB + 14}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${t === 1490 ? 1500 : t}</text>`).join("")}
          <text x="${W - padR}" y="${H - 3}" text-anchor="end" font-size="11" fill="var(--muted)">${T.t}</text>
          <path d="${line(push)}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>
          <path d="${line(y)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
          ${j >= 0 ? `<line x1="${X(Math.min(i1, j))}" x2="${X(Math.max(i1, j))}" y1="${Y(y[i1])}" y2="${Y(y[i1])}" stroke="var(--accent)" stroke-opacity="0.45"/>` : ""}
          ${mark(i1, "var(--accent-2)")}
          ${j >= 0 ? mark(j, "var(--bad)") : ""}
          <g font-size="11">
            <line x1="${W - padR - 110}" x2="${W - padR - 88}" y1="${padT + 6}" y2="${padT + 6}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>
            <text x="${W - padR - 82}" y="${padT + 10}" fill="var(--muted)">${T.raw}</text>
            <line x1="${W - padR - 110}" x2="${W - padR - 88}" y1="${padT + 22}" y2="${padT + 22}" stroke="var(--accent)" stroke-width="2.5"/>
            <text x="${W - padR - 82}" y="${padT + 26}" fill="var(--text)">${T.filt}</text>
          </g>`;
        this.querySelector('[data-o="now"]').textContent = `${i1 * DT} ms`;
        const twin = this.querySelector('[data-v="twin"]');
        if (a === 0) twin.textContent = T.nofilt;
        else if (j < 0) twin.textContent = T.none;
        else {
          const [ea, eb] = i1 < j ? [i1, j] : [j, i1];
          twin.textContent = T.same(fmt(y[i1]), fmt(at(push, ea)), fmt(at(push, eb)), Math.round(ea * DT), Math.round(eb * DT));
        }
      }
    }
  }
  customElements.define("filter-memory", FilterMemory);
})();
