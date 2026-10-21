// <buffer-slicer steps="128" episode="1000" gamma="0.999" iter="1" t="50" v="850">
// A rollout window cut from one long episode (Day 7). Pick a step in the buffer and see
// which part of its return is real rewards and which part is the critic's V(s_end).
// Rewards and V are illustrative (about 0.85 per step), not logged data.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "轨迹片段切片器",
        len: "片段长度（每个环境）",
        iter: "第几次迭代（哪一段）",
        step: "缓冲区里的第 t 步",
        end: "这段里机器人",
        ends: ["一直站着", "中途摔倒"],
        episode: "一个回合",
        steps: "步",
        buffer: "缓冲区",
        past: "t 之前：不算",
        real: "真实奖励",
        tailLbl: "评论家的 V",
        fallLbl: "摔倒：0",
        nextEp: "重置后的新回合",
        G: "G_t 的估计",
        sumReal: (n) => `${n} 个真实奖励，打折后求和`,
        tailW: "尾巴的权重 γ^m",
        tailC: "评论家补上的尾巴",
        share: "G_t 里评论家的份额",
        seen: (n, h) => `看到了 ${n} 步，地平线约 ${h} 步`,
        noteRun: (t, n, end, m, w) =>
          `第 ${t} 步：缓冲区里它之后还有 ${n} 个真实奖励，直接加起来。第 ${end - 1} 步之后什么都没录，评论家用一个数 V(s_${end}) 顶上，乘以 γ^${m} = ${w}。`,
        noteFall: (t, e) =>
          `第 ${t} 步：机器人在第 ${e} 步摔倒。之后没有未来，所以不用评论家来补：尾巴就是 0。`,
        noteTimeout: (t, e) =>
          `第 ${t} 步：第 ${e} 步到了 10 秒的时间上限。这只是我们停了录像，机器人还站着，所以评论家照样补上尾巴。`,
        noteNew: (t, e) =>
          `第 ${t} 步属于第 ${e} 步重置后开始的新回合。它的回报和前一个回合无关，只从 ${t} 往后算。`,
        illus: "奖励和 V 是示意值（每步约 0.85），不是日志数据。",
      }
    : {
        title: "Rollout buffer slicer",
        len: "Rollout length (per env)",
        iter: "Iteration (which slice)",
        step: "Step t in the buffer",
        end: "In this slice the robot",
        ends: ["keeps balancing", "falls midway"],
        episode: "one episode",
        steps: "steps",
        buffer: "buffer",
        past: "before t: not in G",
        real: "real rewards",
        tailLbl: "critic's V",
        fallLbl: "fall: 0",
        nextEp: "new episode after reset",
        G: "Estimate of G_t",
        sumReal: (n) => `${n} real rewards, discounted sum`,
        tailW: "Tail weight γ^m",
        tailC: "Tail filled in by the critic",
        share: "Critic's share of G_t",
        seen: (n, h) => `${n} steps seen of a ~${h}-step horizon`,
        noteRun: (t, n, end, m, w) =>
          `Step ${t}: the buffer holds ${n} real rewards from here on, and we just add them up. Nothing was recorded after step ${end - 1}, so the critic stands in with one number, V(s_${end}), weighted by γ^${m} = ${w}.`,
        noteFall: (t, e) =>
          `Step ${t}: the robot falls at step ${e}. Nothing follows a fall, so there is nothing for the critic to fill in: the tail is 0.`,
        noteTimeout: (t, e) =>
          `Step ${t}: step ${e} hits the 10 s time limit. That is us stopping the tape while the robot is still up, so the critic fills in the tail anyway.`,
        noteNew: (t, e) =>
          `Step ${t} belongs to the new episode that started after the reset at step ${e}. Its return knows nothing about the old episode and only looks forward from ${t}.`,
        illus: "Rewards and V are illustrative (about 0.85 per step), not logged data.",
      };

  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  // Deterministic, slightly noisy reward around 0.85 per step.
  const noise = (i) => {
    const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
    return s - Math.floor(s) - 0.5;
  };

  class BufferSlicer extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        N: Number(this.getAttribute("steps") ?? 128),
        E: Number(this.getAttribute("episode") ?? 1000),
        g: Number(this.getAttribute("gamma") ?? 0.999),
        iter: Number(this.getAttribute("iter") ?? 1),
        t: Number(this.getAttribute("t") ?? 50),
        V: Number(this.getAttribute("v") ?? 850),
        fall: false,
      };
      this.innerHTML = `
        <div class="widget buffer-slicer">
          <p class="widget-title">${T.title}</p>
          <svg role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            <label>${T.iter} <output data-o="iter"></output><input type="range" data-k="iter" min="1" step="1"></label>
            <label>${T.step} <output data-o="t"></output><input type="range" data-k="t" min="0" step="1"></label>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem 1.2rem;align-items:center">
            <span style="font-size:.85rem;color:var(--muted)">${T.len}</span>
            <span class="seg" role="group"><button type="button" data-n="24">24</button><button type="button" data-n="128">128</button></span>
            <span style="font-size:.85rem;color:var(--muted)">${T.end}</span>
            <span class="seg" role="group"><button type="button" data-f="0">${T.ends[0]}</button><button type="button" data-f="1">${T.ends[1]}</button></span>
          </div>
          <div class="readout">
            <div><small data-v="nlabel"></small><b data-v="real"></b></div>
            <div><small>${T.tailC}</small><b data-v="tail"></b></div>
            <div><small>${T.G}</small><b data-v="G"></b></div>
            <div><small>${T.share}</small><b data-v="share"></b></div>
          </div>
          <p class="note" data-v="status" aria-live="polite"></p>
          <p class="note" data-v="seen"></p>
          <p class="note" style="font-size:.78rem">${T.illus}</p>
        </div>`;
      this.svg = this.querySelector("svg");
      this.inputs = {};
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        this.inputs[inp.dataset.k] = inp;
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.render();
        });
      });
      this.querySelectorAll("[data-n]").forEach((b) =>
        b.addEventListener("click", () => {
          const old = this.s.N;
          this.s.N = Number(b.dataset.n);
          // keep roughly the same place in the episode and in the buffer
          this.s.iter = Math.floor(((this.s.iter - 1) * old) / this.s.N) + 1;
          this.s.t = Math.round((this.s.t / old) * this.s.N);
          this.render();
        })
      );
      this.querySelectorAll("[data-f]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.fall = b.dataset.f === "1";
          this.render();
        })
      );
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    // The slice and where (if anywhere) the episode ends inside it.
    model() {
      const { N, E, iter, fall } = this.s;
      const iters = Math.ceil(E / N);
      const it = clamp(iter, 1, iters);
      const w0 = (it - 1) * N; // episode step at buffer position 0
      let end = null; // { pos, kind }
      if (fall) end = { pos: Math.floor(N * 0.7), kind: "fall" };
      if (w0 + N > E && (!end || E - w0 < end.pos)) end = { pos: E - w0, kind: "timeout" };
      const r = [];
      for (let i = 0; i < N; i++) {
        let v = 0.85 + 0.12 * noise(w0 + i);
        if (end && end.kind === "fall" && i < end.pos) v *= clamp((end.pos - i) / 20, 0.15, 1);
        r.push(clamp(v, 0, 1));
      }
      return { iters, it, w0, end, r };
    }

    // Return for buffer position t: real rewards up to the cut, then the tail.
    ret(m, t) {
      const { N, g, V } = this.s;
      const { end, r } = m;
      let stop = N, kind = "buffer";
      if (end && t < end.pos) {
        stop = end.pos;
        kind = end.kind;
      }
      let real = 0;
      for (let i = t; i < stop; i++) real += Math.pow(g, i - t) * r[i];
      const mExp = stop - t;
      const w = Math.pow(g, mExp);
      const tail = kind === "fall" ? 0 : w * V;
      const newEp = end && t >= end.pos;
      return { real, tail, w, mExp, stop, kind, n: stop - t, newEp };
    }

    render() {
      const s = this.s;
      const m = this.model();
      s.iter = m.it;
      s.t = clamp(s.t, 0, s.N - 1);
      this.inputs.iter.max = m.iters;
      this.inputs.iter.value = s.iter;
      this.inputs.t.max = s.N - 1;
      this.inputs.t.value = s.t;
      const R = this.ret(m, s.t);

      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 440;
      const padL = 8, padR = 8;
      const gY = narrow ? 170 : 160, gH = 18;
      const ly = gY + gH + 18;
      const H = ly + (R.newEp ? 26 : 8);
      if (this._w !== W || this._h !== H) {
        this._w = W;
        this._h = H;
        this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      }
      const inner = W - padL - padR;
      const mono = `font-family="var(--mono)"`;

      // Row 1: the whole episode, cut into slices.
      const eY = 22, eH = 14;
      const EX = (k) => padL + (k / s.E) * inner;
      let ep = `<text x="${padL}" y="${eY - 6}" font-size="11" fill="var(--muted)">${T.episode}: ${s.E} ${T.steps}</text>`;
      ep += `<rect x="${padL}" y="${eY}" width="${inner}" height="${eH}" rx="2" fill="var(--surface-2)" stroke="var(--border)"/>`;
      for (let k = 1; k < m.iters; k++) {
        const x = EX(k * s.N);
        ep += `<line x1="${x}" x2="${x}" y1="${eY}" y2="${eY + eH}" stroke="var(--border)"/>`;
      }
      const sx0 = EX(m.w0), sx1 = EX(Math.min(s.E, m.w0 + s.N));
      ep += `<rect x="${sx0}" y="${eY - 2}" width="${Math.max(2, sx1 - sx0)}" height="${eH + 4}" rx="2" fill="var(--accent)" opacity="0.85"/>`;
      ep += `<text x="${W - padR}" y="${eY - 6}" text-anchor="end" font-size="11" fill="var(--muted)" ${mono}>${m.w0}–${Math.min(s.E, m.w0 + s.N) - 1}</text>`;

      // Zoom lines from the slice down to the buffer.
      const bY = 78, bH = 46;
      const tailW = Math.round(inner * (narrow ? 0.22 : 0.17));
      const bx0 = padL, bx1 = padL + inner - tailW - 6;
      const BX = (i) => bx0 + (i / s.N) * (bx1 - bx0);
      let zoom = `<path d="M${sx0} ${eY + eH + 2} L${bx0} ${bY - 16} M${sx1} ${eY + eH + 2} L${bx1} ${bY - 16}" stroke="var(--border)" fill="none" stroke-dasharray="3 3"/>`;

      // Row 2: the buffer, one cell per step.
      let buf = `<text x="${bx0}" y="${bY - 6}" font-size="11" fill="var(--muted)">${T.buffer}: ${s.N} ${T.steps}</text>`;
      const cw = (bx1 - bx0) / s.N;
      for (let i = 0; i < s.N; i++) {
        let fill = "var(--muted)", op = 0.18;
        if (R.newEp) {
          if (i >= s.t) { fill = "var(--accent)"; op = 0.9; }
        } else if (i >= s.t && i < R.stop) { fill = "var(--accent)"; op = 0.9; }
        if (m.end && i >= m.end.pos && !R.newEp) op = Math.min(op, 0.18);
        const h = bH * m.r[i];
        buf += `<rect x="${(BX(i)).toFixed(2)}" y="${(bY + bH - h).toFixed(1)}" width="${Math.max(0.6, cw - (cw > 3 ? 1 : 0.3)).toFixed(2)}" height="${h.toFixed(1)}" fill="${fill}" opacity="${op}"/>`;
      }
      buf += `<line x1="${bx0}" x2="${bx1}" y1="${bY + bH}" y2="${bY + bH}" stroke="var(--border)"/>`;
      // Episode end inside the buffer.
      if (m.end) {
        const x = BX(m.end.pos);
        const col = m.end.kind === "fall" ? "var(--bad)" : "var(--accent-2)";
        const lbl = m.end.kind === "fall" ? (ZH ? "摔倒" : "fall") : (ZH ? "超时" : "timeout");
        buf += `<line x1="${x}" x2="${x}" y1="${bY - 2}" y2="${bY + bH + 4}" stroke="${col}" stroke-width="2"/>`;
        buf += `<text x="${x}" y="${bY + bH + 16}" text-anchor="middle" font-size="11" fill="${col}">${lbl}</text>`;
      }
      // Step marker.
      const tx = BX(s.t) + cw / 2;
      buf += `<path d="M${tx - 5} ${bY - 22} L${tx + 5} ${bY - 22} L${tx} ${bY - 15} Z" fill="var(--accent-2)"/>`;
      // Tail box: what the critic stands in for.
      const tX = bx1 + 6;
      const tailOn = R.kind !== "fall";
      const tailCol = tailOn ? "var(--accent-2)" : "var(--bad)";
      buf += `<rect x="${tX}" y="${bY}" width="${tailW}" height="${bH}" rx="3" fill="${tailOn ? "var(--accent-2-soft)" : "none"}" stroke="${tailCol}" stroke-dasharray="4 3"/>`;
      buf += `<text x="${tX + tailW / 2}" y="${bY + bH / 2 - 2}" text-anchor="middle" font-size="${narrow ? 10 : 11}" fill="${tailCol}" ${mono}>${tailOn ? `V(s_${R.stop})` : "0"}</text>`;
      buf += `<text x="${tX + tailW / 2}" y="${bY + bH / 2 + 12}" text-anchor="middle" font-size="10" fill="var(--muted)">${tailOn ? `→ ∞` : T.fallLbl}</text>`;

      // Row 3: the return, split into its two parts.
      const total = R.real + R.tail;
      const scaleMax = s.V / (1 - 0) + 1; // the bar is scaled to the critic's V
      const GX = (v) => padL + (v / scaleMax) * inner;
      let gb = `<text x="${padL}" y="${gY - 8}" font-size="11" fill="var(--text)">G<tspan font-size="9" dy="3">${s.t}</tspan><tspan dy="-3"> = </tspan><tspan fill="var(--accent)">${R.real.toFixed(1)}</tspan> + <tspan fill="var(--accent-2)">${R.tail.toFixed(1)}</tspan> = ${total.toFixed(1)}</text>`;
      gb += `<rect x="${padL}" y="${gY}" width="${inner}" height="${gH}" rx="3" fill="var(--surface-2)"/>`;
      gb += `<rect x="${padL}" y="${gY}" width="${Math.max(0, GX(R.real) - padL)}" height="${gH}" fill="var(--accent)"/>`;
      if (R.tail > 0) gb += `<rect x="${GX(R.real)}" y="${gY}" width="${Math.max(0, GX(total) - GX(R.real))}" height="${gH}" fill="var(--accent-2)" opacity="0.85"/>`;
      gb += `<rect x="${padL}" y="${ly - 9}" width="10" height="10" fill="var(--accent)"/><text x="${padL + 15}" y="${ly}" font-size="11" fill="var(--muted)">${T.real}</text>`;
      const lx2 = padL + (narrow ? inner * 0.5 : 150);
      gb += `<rect x="${lx2}" y="${ly - 9}" width="10" height="10" fill="var(--accent-2)" opacity="0.85"/><text x="${lx2 + 15}" y="${ly}" font-size="11" fill="var(--muted)">${T.tailLbl} × γ^${R.mExp}</text>`;
      if (R.newEp) gb += `<text x="${padL}" y="${ly + 18}" font-size="11" fill="var(--muted)">${T.nextEp}</text>`;

      this.svg.innerHTML = ep + zoom + buf + gb;

      // Readouts.
      this.querySelector('[data-o="iter"]').textContent = `${s.iter} / ${m.iters}`;
      this.querySelector('[data-o="t"]').textContent = s.t;
      this.querySelector('[data-v="nlabel"]').textContent = T.sumReal(R.n);
      this.querySelector('[data-v="real"]').textContent = R.real.toFixed(1);
      this.querySelector('[data-v="tail"]').textContent =
        R.kind === "fall" ? "0" : `${R.w.toFixed(3)} × ${s.V} = ${R.tail.toFixed(1)}`;
      this.querySelector('[data-v="G"]').textContent = total.toFixed(1);
      this.querySelector('[data-v="share"]').textContent = total > 0 ? `${Math.round((100 * R.tail) / total)} %` : "–";
      const status = R.newEp
        ? T.noteNew(s.t, m.end.pos)
        : R.kind === "fall"
        ? T.noteFall(s.t, R.stop)
        : R.kind === "timeout"
        ? T.noteTimeout(s.t, R.stop)
        : T.noteRun(s.t, R.n, s.N, R.mExp, R.w.toFixed(3));
      this.querySelector('[data-v="status"]').textContent = status;
      this.querySelector('[data-v="seen"]').textContent = T.seen(R.n, Math.round(1 / (1 - s.g)));
      this.querySelectorAll("[data-n]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.n) === s.N)));
      this.querySelectorAll("[data-f]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.f === "1") === s.fall)));
    }
  }
  customElements.define("buffer-slicer", BufferSlicer);
})();
