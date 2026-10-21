// <gae-stepper lambda="0.95" gamma="0.9"> : steps rsl_rl's compute_returns backwards through a 6-step toy buffer (Day 8).
// Shows delta_t, the (gamma*lambda)^k weights each step puts on the deltas after it, and the running advantage.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "compute_returns 逐步倒推",
        lam: "λ（对评论家之后的信任）",
        fall: "第 3 步摔倒",
        off: "不摔",
        on: "摔倒",
        mask: "用 not_done 截断",
        step: "往回走一步",
        run: "一直走到第 0 步",
        reset: "重来",
        rows: { t: "t", r: "r", v: "V", d: "done", delta: "δ", A: "A", ret: "ret" },
        lane1: (t) => `第 ${t} 步对后面各个 δ 的权重 (γλ)^k`,
        lane2: "δ（柱）与优势 A（点）",
        last: "末值",
        idle: "从第 5 步开始：缓冲区的最后一步，后面只有 last_values = V(s₆)。",
        done0: "走完了。returns = A + V 就是评论家的训练目标。",
        gl: "γλ",
        cur: "当前步",
        leak: "没有 not_done：第 2 步的优势把下一个回合的奖励也算进来了。",
        cut: "第 3 步是摔倒：not_done = 0，后面的 δ 一个都不算，V(s₄) 也不算。",
      }
    : {
        title: "compute_returns, stepped backwards",
        lam: "λ (trust in what comes after)",
        fall: "Fall at step 3",
        off: "No fall",
        on: "Fall",
        mask: "Cut with not_done",
        step: "Step back once",
        run: "Run to step 0",
        reset: "Reset",
        rows: { t: "t", r: "r", v: "V", d: "done", delta: "δ", A: "A", ret: "ret" },
        lane1: (t) => `Weights (γλ)^k that step ${t} puts on the δ's after it`,
        lane2: "δ (bars) and the advantage A (dots)",
        last: "last",
        idle: "Start at step 5: the end of the buffer, where only last_values = V(s₆) follows.",
        done0: "Done. returns = A + V is the critic's training target.",
        gl: "γλ",
        cur: "current step",
        leak: "No not_done: step 2's advantage now includes rewards from the next episode.",
        cut: "Step 3 is a fall: not_done = 0, so none of the later δ's count, and neither does V(s₄).",
      };

  // The toy buffer: one robot, six steps. Values are a critic we know is a bit wrong.
  const R = [1, 1, 0.8, 0.2, 1, 1];
  const V = [7.2, 7.0, 6.6, 5.5, 7.4, 7.8];
  const LAST = 8.0;
  const N = R.length;
  const sub = (i) => String(i).split("").map((c) => "₀₁₂₃₄₅₆₇₈₉"[c]).join("");

  class GaeStepper extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        lam: Number(this.getAttribute("lambda") ?? 0.95),
        gamma: Number(this.getAttribute("gamma") ?? 0.9),
        fall: false,
        mask: true,
        cur: N, // next step to compute is cur - 1; N means nothing computed yet
      };
      this.innerHTML = `
        <div class="widget gae-stepper">
          <p class="widget-title">${T.title}</p>
          <svg role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            <label>${T.lam} <output data-o="lam"></output><input type="range" data-k="lam" min="0" max="1" step="0.01"></label>
            <div style="display:grid;gap:.35rem;font-size:.85rem;color:var(--muted)">
              <span>${T.fall}</span>
              <span class="seg" role="group" style="width:max-content">
                <button type="button" data-fall="0">${T.off}</button><button type="button" data-fall="1">${T.on}</button>
              </span>
              <label style="display:flex;gap:.4rem;align-items:center"><input type="checkbox" data-k="mask"> ${T.mask}</label>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center">
            <button type="button" class="button" data-act="step">${T.step}</button>
            <button type="button" class="button secondary" data-act="run">${T.run}</button>
            <button type="button" class="button secondary" data-act="reset">${T.reset}</button>
          </div>
          <div class="readout">
            <div><small>${T.cur}</small><b data-v="t"></b></div>
            <div><small>δ</small><b data-v="delta"></b></div>
            <div><small>A</small><b data-v="A"></b></div>
            <div><small>${T.gl}</small><b data-v="gl"></b></div>
          </div>
          <p class="note" data-v="eq" style="font-family:var(--mono);color:var(--text)"></p>
          <p class="note" data-v="status" aria-live="polite"></p>
          <div style="overflow-x:auto;margin-top:.75rem">
            <table class="gae-table" style="width:100%;border-collapse:collapse;font-size:.76rem;font-family:var(--mono)"></table>
          </div>
        </div>`;
      this.svg = this.querySelector("svg");
      const lamIn = this.querySelector('input[data-k="lam"]');
      lamIn.value = this.s.lam;
      lamIn.addEventListener("input", () => {
        this.s.lam = Number(lamIn.value);
        this.render();
      });
      const maskIn = this.querySelector('input[data-k="mask"]');
      maskIn.checked = this.s.mask;
      maskIn.addEventListener("change", () => {
        this.s.mask = maskIn.checked;
        this.render();
      });
      this.querySelectorAll("[data-fall]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.fall = b.dataset.fall === "1";
          this.render();
        })
      );
      this.querySelector('[data-act="step"]').addEventListener("click", () => {
        if (this.s.cur > 0) this.s.cur--;
        this.render();
      });
      this.querySelector('[data-act="run"]').addEventListener("click", () => this.run());
      this.querySelector('[data-act="reset"]').addEventListener("click", () => {
        clearTimeout(this._timer);
        this.s.cur = N;
        this.render();
      });
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    run() {
      clearTimeout(this._timer);
      const tick = () => {
        if (this.s.cur <= 0) return;
        this.s.cur--;
        this.render();
        this._timer = setTimeout(tick, 380);
      };
      if (this.s.cur === 0) this.s.cur = N;
      tick();
    }

    // The nine lines, over the whole buffer. Only steps >= cur are shown as computed.
    compute() {
      const { lam, gamma, fall, mask } = this.s;
      const done = R.map((_, i) => (fall && i === 3 ? 1 : 0));
      const r = R.map((x, i) => (fall && i === 3 ? 0 : x));
      const delta = new Array(N), A = new Array(N), ret = new Array(N);
      let adv = 0;
      for (let t = N - 1; t >= 0; t--) {
        const next = t === N - 1 ? LAST : V[t + 1];
        const nd = mask ? 1 - done[t] : 1;
        delta[t] = r[t] + nd * gamma * next - V[t];
        adv = delta[t] + nd * gamma * lam * adv;
        A[t] = adv;
        ret[t] = adv + V[t];
      }
      // Weights step t puts on delta_{t+k}: (gamma*lam)^k until (and including) the step that ends the episode.
      const weights = (t) => {
        const w = new Array(N).fill(null);
        let x = 1;
        for (let k = t; k < N; k++) {
          w[k] = x;
          if (mask && done[k]) break;
          x *= gamma * lam;
        }
        return w;
      };
      return { done, r, delta, A, ret, weights };
    }

    render() {
      const { lam, gamma, fall, mask, cur } = this.s;
      const c = this.compute();
      const shown = (t) => t >= cur;
      const W = Math.round(this.svg.clientWidth) || 520;
      const small = W < 440;
      const padL = small ? 8 : 16, padR = small ? 8 : 16;
      const top1 = 18, h1 = small ? 70 : 78; // weights lane
      const hb = h1 - 18; // tallest weight bar, leaving room for its label under the lane title
      const top2 = top1 + h1 + 34, h2 = small ? 120 : 150; // delta / A lane
      const H = top2 + h2 + 26;
      if (this._w !== W || this._h !== H) {
        this._w = W;
        this._h = H;
        this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      }
      const cols = N + 1; // six steps plus the last_values column
      const cw = (W - padL - padR) / cols;
      const cx = (i) => padL + cw * (i + 0.5);
      const bw = Math.min(cw * 0.55, 34);

      // Lane 1: weights for the step currently being scored.
      const focus = cur < N ? cur : null;
      const w = focus === null ? null : c.weights(focus);
      const lane1 = w
        ? w
            .map((x, k) =>
              x === null
                ? ""
                : `<rect x="${cx(k) - bw / 2}" y="${top1 + h1 - x * hb}" width="${bw}" height="${x * hb}" fill="var(--accent)" opacity="${k === focus ? 0.9 : 0.45}"/>
                   <text x="${cx(k)}" y="${top1 + h1 - x * hb - 4}" text-anchor="middle" font-size="11" fill="var(--text)" font-family="var(--mono)">${x.toFixed(2)}</text>`
            )
            .join("")
        : "";

      // Lane 2: delta bars and A dots on a shared scale.
      const vals = [];
      for (let t = 0; t < N; t++) if (shown(t)) vals.push(c.delta[t], c.A[t]);
      const m = Math.max(1, ...vals.map(Math.abs)) * 1.1;
      const Y = (v) => top2 + h2 / 2 - (v / m) * (h2 / 2);
      let bars = "", dots = "", line = "";
      const pts = [];
      for (let t = 0; t < N; t++) {
        if (!shown(t)) {
          bars += `<rect x="${cx(t) - bw / 2}" y="${Y(0) - 1}" width="${bw}" height="2" fill="var(--border)"/>`;
          continue;
        }
        const d = c.delta[t];
        bars += `<rect x="${cx(t) - bw / 2}" y="${Math.min(Y(0), Y(d))}" width="${bw}" height="${Math.max(1, Math.abs(Y(d) - Y(0)))}" fill="var(--accent-2)" opacity="0.55"/>`;
        pts.push([cx(t), Y(c.A[t])]);
        dots += `<circle cx="${cx(t)}" cy="${Y(c.A[t])}" r="${t === cur ? 6 : 4.5}" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`;
      }
      // Join A dots only within an episode (not across the fall when it is masked).
      for (let i = 1; i < pts.length; i++) {
        const tLeft = cur + i - 1;
        if (mask && c.done[tLeft]) continue;
        line += `<line x1="${pts[i - 1][0]}" y1="${pts[i - 1][1]}" x2="${pts[i][0]}" y2="${pts[i][1]}" stroke="var(--accent)" stroke-width="1.5" opacity="0.6"/>`;
      }
      const fallMark =
        fall
          ? `<line x1="${(cx(3) + cx(4)) / 2}" x2="${(cx(3) + cx(4)) / 2}" y1="${top1 - 6}" y2="${top2 + h2}" stroke="var(--bad)" stroke-dasharray="4 3" stroke-width="1.5"/>
             <text x="${(cx(3) + cx(4)) / 2 + 4}" y="${top2 + h2 - 4}" font-size="11" fill="var(--bad)">${ZH ? "摔倒" : "fall"}</text>`
          : "";
      const cursor =
        focus !== null
          ? `<rect x="${cx(focus) - cw / 2 + 1}" y="${top1 - 14}" width="${cw - 2}" height="${top2 + h2 - top1 + 14}" fill="var(--accent-2-soft)" opacity="0.6" rx="4"/>`
          : "";
      const stepLabels = Array.from({ length: cols }, (_, i) =>
        `<text x="${cx(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${i === N ? "var(--muted)" : "var(--text)"}" font-family="var(--mono)">${i === N ? (small ? "s" + sub(6) : T.last + " s" + sub(6)) : "t=" + i}</text>`
      ).join("");

      this.svg.innerHTML = `
        ${cursor}
        <text x="${padL}" y="${top1 - 4}" font-size="11" fill="var(--muted)">${focus === null ? T.lane1("t") : T.lane1(focus)}</text>
        <line x1="${padL}" x2="${W - padR}" y1="${top1 + h1}" y2="${top1 + h1}" stroke="var(--border)"/>
        ${lane1}
        <text x="${padL}" y="${top2 - 8}" font-size="11" fill="var(--muted)">${T.lane2}</text>
        <line x1="${padL}" x2="${W - padR}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--border)"/>
        ${bars}${line}${dots}
        <rect x="${cx(N) - bw / 2}" y="${top2 + 6}" width="${bw}" height="${h2 - 12}" fill="none" stroke="var(--muted)" stroke-dasharray="3 3" rx="3"/>
        <text x="${cx(N)}" y="${top2 + h2 / 2 + 4}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${LAST.toFixed(1)}</text>
        ${fallMark}
        ${stepLabels}`;

      // Readouts and the equation for the step just computed.
      const gl = gamma * lam;
      this.querySelector('[data-o="lam"]').textContent = lam.toFixed(2);
      this.querySelector('[data-v="gl"]').textContent = gl.toFixed(3);
      this.querySelectorAll("[data-fall]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.fall === "1") === fall)));
      const eq = this.querySelector('[data-v="eq"]');
      const status = this.querySelector('[data-v="status"]');
      if (focus === null) {
        this.querySelector('[data-v="t"]').textContent = "–";
        this.querySelector('[data-v="delta"]').textContent = "–";
        this.querySelector('[data-v="A"]').textContent = "–";
        eq.textContent = "";
        status.textContent = T.idle;
      } else {
        const t = focus;
        const nd = mask ? 1 - c.done[t] : 1;
        const next = t === N - 1 ? LAST : V[t + 1];
        const nextA = t === N - 1 ? 0 : c.A[t + 1];
        this.querySelector('[data-v="t"]').textContent = String(t);
        this.querySelector('[data-v="delta"]').textContent = c.delta[t].toFixed(2);
        this.querySelector('[data-v="A"]').textContent = c.A[t].toFixed(2);
        eq.innerHTML =
          `δ${sub(t)} = ${c.r[t].toFixed(1)} + ${nd}·${gamma}·${next.toFixed(1)} − ${V[t].toFixed(1)} = ${c.delta[t].toFixed(2)}<br>` +
          `A${sub(t)} = δ${sub(t)} + ${nd}·${gl.toFixed(3)}·${nextA.toFixed(2)} = ${c.A[t].toFixed(2)}<br>` +
          `returns${sub(t)} = A${sub(t)} + V${sub(t)} = ${c.ret[t].toFixed(2)}`;
        status.textContent =
          fall && !mask && t <= 2 ? T.leak : fall && mask && t === 3 ? T.cut : t === 0 ? T.done0 : "";
      }

      // The buffer as a table, columns filling in from the right.
      const cell = (t, v, hi) =>
        `<td style="padding:.3rem .25rem;border:1px solid var(--border);text-align:right;${t === focus ? "background:var(--accent-2-soft);" : ""}${hi ? "" : "color:var(--muted);"}">${v}</td>`;
      const row = (name, fn, comp, lastCell = "") => // last column: s6 / last_values
        `<tr><th style="text-align:left;padding:.3rem .3rem;border:1px solid var(--border);font-weight:500;white-space:nowrap">${name}</th>${Array.from({ length: N }, (_, t) => cell(t, comp && !shown(t) ? "·" : fn(t), !comp || shown(t))).join("")}${lastCell === null ? "" : `<td style="padding:.3rem .25rem;border:1px solid var(--border);text-align:right;color:var(--muted)">${lastCell}</td>`}</tr>`;
      this.querySelector(".gae-table").innerHTML =
        row(T.rows.t, (t) => t, false, "6") +
        row(T.rows.r, (t) => c.r[t].toFixed(1), false) +
        row(T.rows.v, (t) => V[t].toFixed(1), false, LAST.toFixed(1)) +
        row(T.rows.d, (t) => c.done[t], false) +
        row(T.rows.delta, (t) => c.delta[t].toFixed(2), true) +
        row(T.rows.A, (t) => c.A[t].toFixed(2), true) +
        row(T.rows.ret, (t) => c.ret[t].toFixed(2), true);
    }
  }
  customElements.define("gae-stepper", GaeStepper);
})();
