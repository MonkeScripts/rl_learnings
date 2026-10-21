// <credit-window gamma="0.999" lambda="0.95" steps="128"> : the GAE credit window (γλ)^k against the rollout length (Day 11).
// Top: the advantage's weights (γλ)^k and the return's weights γ^k, with the buffer end marked.
// Bottom: for every buffer position, the share of its advantage weight that lies past the buffer end,
// i.e. the part that V(s_T) has to stand in for.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "信用窗口与轨迹长度",
        steps: "轨迹长度（每个环境的步数）",
        lam: "λ（对评论家之后的信任）",
        gam: "折扣 γ",
        k: "k（往后数的步数）",
        adv: "(γλ)^k：优势函数的权重",
        ret: "γ^k：回报的权重",
        end: (n) => `缓冲区在第 ${n} 步结束`,
        tail: "之后全靠 V(s_T)",
        lane: "各位置落在缓冲区外的优势权重",
        pos0: "位置 0",
        posN: (n) => `位置 ${n - 1}`,
        gl: "γλ",
        wT: "(γλ)^T",
        share: "平均有多少优势权重在缓冲区外",
        cover: "位置 0 的回报里，缓冲区装下的部分",
        envs: "131,072 行时的环境数",
        noteBad: "大部分优势都靠缓冲区末尾那一个 V(s_T)。评论家没学会的东西，策略也学不会。",
        noteMid: "窗口大部分在缓冲区内，靠近末尾的位置仍然靠评论家。",
        noteOk: "几乎每个位置的信用窗口都在缓冲区里。剩下的代价是：同样的数据量，机器人更少。",
      }
    : {
        title: "Credit window vs rollout length",
        steps: "Rollout length (steps per env)",
        lam: "λ (trust in what comes after)",
        gam: "Discount γ",
        k: "k (steps ahead)",
        adv: "(γλ)^k: weights in the advantage",
        ret: "γ^k: weights in the return",
        end: (n) => `buffer ends at step ${n}`,
        tail: "past here: V(s_T) only",
        lane: "Advantage weight past the end, by position",
        pos0: "position 0",
        posN: (n) => `position ${n - 1}`,
        gl: "γλ",
        wT: "(γλ)^T",
        share: "Mean advantage weight past the end",
        cover: "Return weight inside the buffer, position 0",
        envs: "Envs at 131,072 rows",
        noteBad: "Most advantages lean on the one V(s_T) at the end of the buffer. Whatever the critic has not learned, the policy cannot learn through it.",
        noteMid: "Most of the window fits, but positions near the end still lean on the critic.",
        noteOk: "Almost every position has its credit window inside the buffer. The price is fewer robots for the same data.",
      };

  const STEPS = [8, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512];
  const GAMMAS = [0.99, 0.995, 0.999];
  const K_MAX = 512;
  const pct = (v) => (v * 100 < 10 ? (v * 100).toFixed(1) : Math.round(v * 100)) + "%";

  class CreditWindow extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const steps = Number(this.getAttribute("steps") ?? 128);
      const g = Number(this.getAttribute("gamma") ?? 0.999);
      let si = STEPS.indexOf(steps);
      if (si < 0) si = STEPS.indexOf(128);
      this.s = {
        si,
        lam: Number(this.getAttribute("lambda") ?? 0.95),
        gamma: GAMMAS.includes(g) ? g : 0.999,
      };
      this.innerHTML = `
        <div class="widget credit-window">
          <p class="widget-title">${T.title}</p>
          <svg data-svg="w" role="img" aria-label="${T.title}"></svg>
          <div style="display:flex;flex-wrap:wrap;gap:.25rem 1rem;font-size:.78rem;color:var(--muted);margin:.35rem 0 0 34px">
            <span><span style="display:inline-block;vertical-align:middle;width:22px;border-top:2.5px solid var(--accent)"></span> ${T.adv}</span>
            <span><span style="display:inline-block;vertical-align:middle;width:22px;border-top:2px dashed var(--muted)"></span> ${T.ret}</span>
          </div>
          <svg data-svg="lane" role="img" aria-label="${T.lane}" style="margin-top:.4rem"></svg>
          <div class="widget-controls">
            <label>${T.steps} <output data-o="T"></output><input type="range" data-k="si" min="0" max="${STEPS.length - 1}" step="1"></label>
            <label>${T.lam} <output data-o="lam"></output><input type="range" data-k="lam" min="0.8" max="1" step="0.01"></label>
            <div style="display:grid;gap:.35rem;font-size:.85rem;color:var(--muted)">
              <span>${T.gam}</span>
              <span class="seg" role="group" style="width:max-content">
                ${GAMMAS.map((v) => `<button type="button" data-g="${v}">${v}</button>`).join("")}
              </span>
            </div>
          </div>
          <div class="readout">
            <div><small>${T.gl}</small><b data-v="gl"></b></div>
            <div><small>${T.wT}</small><b data-v="wT"></b></div>
            <div><small>${T.share}</small><b data-v="share"></b></div>
            <div><small>${T.cover}</small><b data-v="cover"></b></div>
            <div><small>${T.envs}</small><b data-v="envs"></b></div>
          </div>
          <p class="note" data-v="note" aria-live="polite"></p>
        </div>`;
      this.svg = this.querySelector('[data-svg="w"]');
      this.lane = this.querySelector('[data-svg="lane"]');
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.render();
        });
      });
      this.querySelectorAll("[data-g]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.gamma = Number(b.dataset.g);
          this.render();
        })
      );
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    render() {
      const { lam, gamma } = this.s;
      const Tn = STEPS[this.s.si];
      const x = gamma * lam;
      const W = Math.round(this.svg.clientWidth) || 520;
      const small = W < 440;
      const H = small ? 220 : 260, padL = 34, padR = 12, padT = 14, padB = 30;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const X = (k) => padL + (k / K_MAX) * (W - padL - padR);
      const Y = (v) => padT + (1 - v) * (H - padT - padB);
      const curve = (base) => {
        let d = "";
        for (let i = 0; i <= 256; i++) {
          const k = (i / 256) * K_MAX;
          d += (i ? "L" : "M") + X(k).toFixed(1) + " " + Y(Math.pow(base, k)).toFixed(1);
        }
        return d;
      };
      // Area under (γλ)^k past the buffer end: what V(s_T) stands in for.
      let tail = `M${X(Tn).toFixed(1)} ${Y(0)}`;
      for (let i = 0; i <= 120; i++) {
        const k = Tn + (i / 120) * (K_MAX - Tn);
        tail += `L${X(k).toFixed(1)} ${Y(Math.pow(x, k)).toFixed(1)}`;
      }
      tail += `L${X(K_MAX)} ${Y(0)}Z`;
      const ticks = small ? [0, 128, 256, 384, 512] : [0, 64, 128, 192, 256, 320, 384, 448, 512];
      const endRight = X(Tn) > W - 150;
      const wT = Math.pow(x, Tn);
      const w24 = Math.pow(x, 24);
      this.svg.innerHTML = `
        <rect x="${X(Tn)}" y="${padT}" width="${X(K_MAX) - X(Tn)}" height="${H - padT - padB}" fill="var(--accent-2-soft)"/>
        <path d="${tail}" fill="var(--bad)" fill-opacity="0.22"/>
        <line x1="${padL}" x2="${W - padR}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--border)"/>
        <line x1="${padL}" x2="${padL}" y1="${padT}" y2="${Y(0)}" stroke="var(--border)"/>
        ${[0, 0.5, 1].map((v) => `<text x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        ${ticks.map((k) => `<line x1="${X(k)}" x2="${X(k)}" y1="${Y(0)}" y2="${Y(0) + 4}" stroke="var(--muted)"/><text x="${X(k)}" y="${Y(0) + 16}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${k}</text>`).join("")}
        <text x="${W - padR}" y="${H - 2}" text-anchor="end" font-size="11" fill="var(--muted)">${T.k}</text>
        <path d="${curve(gamma)}" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>
        <path d="${curve(x)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
        <line x1="${X(Tn)}" x2="${X(Tn)}" y1="${padT}" y2="${Y(0)}" stroke="var(--accent-2)" stroke-width="2"/>
        <text x="${X(Tn) + (endRight ? -6 : 6)}" y="${Y(0.56)}" text-anchor="${endRight ? "end" : "start"}" font-size="11" fill="var(--accent-2)" font-family="var(--mono)">${T.end(Tn)}</text>
        <text x="${X(Tn) + (endRight ? -6 : 6)}" y="${Y(0.56) + 14}" text-anchor="${endRight ? "end" : "start"}" font-size="11" fill="var(--accent-2)">${T.tail}</text>
        <circle cx="${X(24)}" cy="${Y(w24)}" r="4" fill="var(--accent)"/>
        <text x="${X(24) + 7}" y="${Y(w24) - 6}" font-size="11" fill="var(--accent)" font-family="var(--mono)">k=24: ${w24.toFixed(2)}</text>`;

      // Lane: one bar per buffer position i, height = x^(T - i), the advantage weight past the end.
      const LH = small ? 92 : 100, lt = 18, lb = 18;
      this.lane.setAttribute("viewBox", `0 0 ${W} ${LH}`);
      const bw = (W - padL - padR) / Tn;
      let bars = "";
      for (let i = 0; i < Tn; i++) {
        const b = Math.pow(x, Tn - i);
        const h = b * (LH - lt - lb);
        bars += `<rect x="${(padL + i * bw).toFixed(2)}" y="${(LH - lb - h).toFixed(2)}" width="${Math.max(0.6, bw - (bw > 3 ? 1 : 0)).toFixed(2)}" height="${h.toFixed(2)}" fill="var(--bad)" fill-opacity="${(0.25 + 0.6 * b).toFixed(2)}"/>`;
      }
      this.lane.innerHTML = `
        <text x="${padL}" y="12" font-size="11" fill="var(--muted)">${T.lane}</text>
        <rect x="${padL}" y="${lt}" width="${W - padL - padR}" height="${LH - lt - lb}" fill="none" stroke="var(--border)"/>
        ${bars}
        <text x="${padL - 6}" y="${lt + 8}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">1</text>
        <text x="${padL - 6}" y="${LH - lb}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">0</text>
        <text x="${padL}" y="${LH - 4}" font-size="11" fill="var(--muted)" font-family="var(--mono)">${T.pos0}</text>
        <text x="${W - padR}" y="${LH - 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${T.posN(Tn)}</text>`;

      // Mean over positions of x^(T-i) = x(1 - x^T) / (T (1 - x)); at x = 1 every position leans fully on V(s_T).
      const share = x >= 1 ? 1 : (x * (1 - wT)) / (Tn * (1 - x));
      const cover = 1 - Math.pow(gamma, Tn);
      this.querySelector('[data-o="T"]').textContent = Tn;
      this.querySelector('[data-o="lam"]').textContent = lam.toFixed(2);
      this.querySelector('[data-v="gl"]').textContent = x.toFixed(4);
      this.querySelector('[data-v="wT"]').textContent = wT < 0.001 ? wT.toExponential(1) : wT.toFixed(3);
      this.querySelector('[data-v="share"]').textContent = pct(share);
      this.querySelector('[data-v="cover"]').textContent = pct(cover);
      this.querySelector('[data-v="envs"]').textContent = Math.round(131072 / Tn).toLocaleString("en-US");
      this.querySelector('[data-v="note"]').textContent = share > 0.35 ? T.noteBad : share > 0.12 ? T.noteMid : T.noteOk;
      this.querySelectorAll("[data-g]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.g) === gamma)));
    }
  }
  customElements.define("credit-window", CreditWindow);
})();
