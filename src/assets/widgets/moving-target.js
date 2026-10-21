// <moving-target k="1.3" c="25" mode="live"> : the wild goose chase vs aiming at a photograph (Day 4).
// A two-number toy of one DQN update. The prediction Q(s) is stepped towards the
// target y = r + γ·Q(s′). Because s and s′ look alike to the network, every step on
// Q(s) also drags Q(s′) along by k. Q(s′)'s own samples pull it back towards its true
// value at rate β. Live: y is built from the Q(s′) we just moved. Frozen: y is built
// from a copy of Q(s′) taken every C steps.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "移动的目标：追自己的尾巴 vs 瞄准一张照片",
        live: "实时目标",
        frozen: "冻结副本",
        k: "牵连 k：更新 Q(s) 时 Q(s′) 被带着走多少",
        c: "每 C 步重拍一次照片",
        q: "预测 Q(s)",
        y: "目标 y",
        truth: "真实值 10",
        retake: "重拍",
        run: "重新播放",
        final: "第 300 步的 Q(s)",
        moves: "目标移动次数",
        verdict: "结果",
        settled: "收敛到 10 附近",
        stale: "还停在旧照片上",
        osc: "振荡",
        away: "跑飞了",
        off: "超出图表",
        step: "步数",
        noteLive: (gk) =>
          `实时目标：每走一步，目标也跟着动。γk = ${gk}。` +
          (gk > 1.05 ? "目标比我们追得还快，越追越远。" : "这里 k 不大，追得上，只是目标一直在抖。"),
        noteFrozen: (C) =>
          `冻结副本：目标在 ${C} 步里一动不动，这段时间就是普通的回归。Q(s′) 被带偏的那一下，有 ${C} 步时间被它自己的样本拉回来，然后才进入目标。C 太大，照片就过时了。`,
      }
    : {
        title: "Moving target: the wild goose chase vs aiming at a photograph",
        live: "Live target",
        frozen: "Frozen copy",
        k: "Drag k: how far a step on Q(s) moves Q(s′)",
        c: "Retake the photograph every C steps",
        q: "prediction Q(s)",
        y: "target y",
        truth: "true value 10",
        retake: "retake",
        run: "Replay",
        final: "Q(s) at step 300",
        moves: "Times the target moved",
        verdict: "Outcome",
        settled: "settled near 10",
        stale: "still on an old photograph",
        osc: "oscillating",
        away: "ran away",
        off: "off the chart",
        step: "step",
        noteLive: (gk) =>
          `Live target: every step we take, the target takes one too. γk = ${gk}. ` +
          (gk > 1.05
            ? "The target runs away faster than we close in."
            : "With this little drag we still catch it, but the target never holds still."),
        noteFrozen: (C) =>
          `Frozen copy: the target holds still for ${C} steps, so each stretch is ordinary regression. The bump a step gives Q(s′) has ${C} steps to be pulled back by its own samples before it reaches the target. Make C too large and the photograph goes stale.`,
      };

  const N = 300, ALPHA = 0.5, BETA = 0.05, GAMMA = 0.9, R = 1, V = 10, SIG = 0.3;
  const Y_LO = -10, Y_HI = 30;

  // Deterministic noise so the two modes see the same minibatches.
  const noise = (() => {
    let s = 12345;
    const out = [];
    for (let i = 0; i < N; i++) {
      s = (s * 1103515245 + 12345) % 2147483648;
      const u1 = (s + 1) / 2147483649;
      s = (s * 1103515245 + 12345) % 2147483648;
      const u2 = (s + 1) / 2147483649;
      out.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    }
    return out;
  })();

  const simulate = (k, C, live) => {
    let q = 0, qn = 0, qf = 0, moves = 0, prevY = null;
    const qs = [], ys = [], retakes = [];
    for (let t = 0; t < N; t++) {
      if (!live && t % C === 0) {
        qf = qn;
        retakes.push(t);
      }
      const y = R + GAMMA * (live ? qn : qf);
      if (prevY !== null && Math.abs(y - prevY) > 1e-9) moves++;
      prevY = y;
      const e = y - q + SIG * noise[t];
      q += ALPHA * e;
      qn += ALPHA * k * e + BETA * (V - qn);
      qs.push(q);
      ys.push(y);
      if (!isFinite(q) || Math.abs(q) > 1e6) {
        for (let u = t + 1; u < N; u++) { qs.push(q > 0 ? 1e6 : -1e6); ys.push(ys[t]); }
        break;
      }
    }
    return { qs, ys, retakes, moves };
  };

  class MovingTarget extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        k: Number(this.getAttribute("k") ?? 1.3),
        C: Number(this.getAttribute("c") ?? 25),
        live: (this.getAttribute("mode") ?? "live") === "live",
        shown: N,
      };
      this.innerHTML = `
        <div class="widget moving-target">
          <p class="widget-title">${T.title}</p>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-bottom:.5rem">
            <span class="seg" role="group">
              <button type="button" data-live="1">${T.live}</button><button type="button" data-live="0">${T.frozen}</button>
            </span>
            <button type="button" class="button secondary" data-act="run">${T.run}</button>
          </div>
          <svg role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            <label>${T.k} <output data-o="k"></output><input type="range" data-k="k" min="0" max="2" step="0.05"></label>
            <label data-c-wrap>${T.c} <output data-o="C"></output><input type="range" data-k="C" min="5" max="200" step="5"></label>
          </div>
          <div class="readout">
            <div><small>${T.final}</small><b data-v="final"></b></div>
            <div><small>${T.moves}</small><b data-v="moves"></b></div>
            <div><small>${T.verdict}</small><b data-v="verdict" style="font-size:.9rem"></b></div>
          </div>
          <p class="note" data-v="note" aria-live="polite"></p>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.s.shown = N;
          this.render();
        });
      });
      this.querySelectorAll("[data-live]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.live = b.dataset.live === "1";
          this.play();
        })
      );
      this.querySelector('[data-act="run"]').addEventListener("click", () => this.play());
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    play() {
      clearInterval(this._timer);
      this.s.shown = 1;
      this._timer = setInterval(() => {
        this.s.shown = Math.min(N, this.s.shown + 6);
        this.render();
        if (this.s.shown >= N) clearInterval(this._timer);
      }, 30);
    }

    render() {
      const { k, C, live, shown } = this.s;
      const sim = simulate(k, C, live);
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 440;
      const H = narrow ? 250 : 290, padL = 30, padR = 10, padT = narrow ? 42 : 26, padB = 26;
      if (this._w !== W || this._h !== H) {
        this._w = W;
        this._h = H;
        this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      }
      const X = (t) => padL + (t / (N - 1)) * (W - padL - padR);
      const clampY = (v) => Math.min(Y_HI, Math.max(Y_LO, v));
      const Y = (v) => padT + ((Y_HI - clampY(v)) / (Y_HI - Y_LO)) * (H - padT - padB);
      const line = (arr, stepwise) => {
        let d = "";
        for (let t = 0; t < shown; t++) {
          const x = X(t).toFixed(1), y = Y(arr[t]).toFixed(1);
          if (t === 0) d += `M${x} ${y}`;
          else d += stepwise ? `H${x}V${y}` : `L${x} ${y}`;
        }
        return d;
      };
      const offAt = sim.qs.findIndex((v, t) => t < shown && (v > Y_HI || v < Y_LO));
      const yt = [-10, 0, 10, 20, 30];
      const xt = [0, 100, 200, 300];
      const legendY = narrow ? 14 : padT - 10;
      const lg = narrow
        ? [[padL, legendY, "accent", T.q, ""], [padL + (W - padL) / 2, legendY, "amber", T.y, ""], [padL, legendY + 16, "muted", T.truth, "4 3"]]
        : [[padL + 6, legendY, "accent", T.q, ""], [padL + 150, legendY, "amber", T.y, ""], [padL + 280, legendY, "muted", T.truth, "4 3"]];
      this.svg.innerHTML = `
        ${yt.map((v) => `<line x1="${padL}" x2="${W - padR}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--border)" stroke-width="${v === 0 ? 1 : 0.5}"/><text x="${padL - 5}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        ${xt.map((t) => `<text x="${X(Math.min(t, N - 1))}" y="${H - 8}" text-anchor="${t === 0 ? "start" : t === 300 ? "end" : "middle"}" font-size="11" fill="var(--muted)" font-family="var(--mono)">${t}</text>`).join("")}
        <text x="${(padL + W - padR) / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)">${T.step}</text>
        ${!live ? sim.retakes.filter((t) => t > 0 && t < shown).map((t) => `<line x1="${X(t)}" x2="${X(t)}" y1="${padT}" y2="${H - padB}" stroke="var(--amber)" stroke-opacity="0.25"/>`).join("") : ""}
        <line x1="${padL}" x2="${W - padR}" y1="${Y(V)}" y2="${Y(V)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"/>
        <path d="${line(sim.ys, !live)}" fill="none" stroke="var(--amber)" stroke-width="3" stroke-opacity="0.85" stroke-linejoin="round"/>
        <path d="${line(sim.qs, false)}" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round"/>
        ${offAt > 0 ? `<text x="${W - padR}" y="${narrow ? legendY + 16 : legendY}" text-anchor="end" font-size="11" fill="var(--bad)">↑↓ ${T.off}</text>` : ""}
        <g font-size="11" font-family="var(--sans)">
          ${lg.map(([x, y, c, label, dash]) => `<line x1="${x}" x2="${x + 18}" y1="${y - 4}" y2="${y - 4}" stroke="var(--${c})" stroke-width="2.2" ${dash ? `stroke-dasharray="${dash}"` : ""}/><text x="${x + 23}" y="${y}" fill="var(--text)">${label}</text>`).join("")}
        </g>`;

      const fin = sim.qs[N - 1];
      const tail = sim.qs.slice(N - 40);
      const spread = Math.max(...tail) - Math.min(...tail);
      let verdict;
      if (!isFinite(fin) || Math.abs(fin) > 100) verdict = T.away;
      else if (spread > 4) verdict = T.osc;
      else if (Math.abs(fin - V) < 1.5) verdict = T.settled;
      else verdict = T.stale;
      this.querySelector('[data-o="k"]').textContent = k.toFixed(2);
      this.querySelector('[data-o="C"]').textContent = String(C);
      this.querySelector('[data-v="final"]').textContent = Math.abs(fin) >= 1e5 ? (fin > 0 ? "> 1e5" : "< −1e5") : fin.toFixed(1);
      this.querySelector('[data-v="moves"]').textContent = `${sim.moves} / ${N - 1}`;
      const vEl = this.querySelector('[data-v="verdict"]');
      vEl.textContent = verdict;
      vEl.style.color = verdict === T.settled ? "var(--good)" : verdict === T.stale ? "var(--muted)" : "var(--bad)";
      const gk = (GAMMA * k).toFixed(2);
      this.querySelector('[data-v="note"]').textContent = live ? T.noteLive(Number(gk)) : T.noteFrozen(C);
      this.querySelector("[data-c-wrap]").style.opacity = live ? 0.45 : 1;
      this.querySelectorAll("[data-live]").forEach((b) =>
        b.setAttribute("aria-pressed", String((b.dataset.live === "1") === live))
      );
    }
  }
  customElements.define("moving-target", MovingTarget);
})();
