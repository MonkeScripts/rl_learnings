// <action-latch g="0.5" b="0.05" pitch="0" start="1"> : iterate a toy policy that sees its own last action (Day 13).
// Toy map, not the yd15 network: a_next = clip(g*a_prev + k*pitch + b, -1, 1), volts U = 8 * a.
// g stands for how much the policy leans on its own last action. Above g = 1 the map has two rails as
// stable fixed points and the policy goes deaf to pitch.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "上一步动作回灌：迭代到不动点",
        g: "对上一步动作的依赖 g",
        pitch: "俯仰角（固定）",
        b: "偏置 b",
        start: "prev_action 从哪里开始",
        x: "上一步动作 a",
        y: "新动作",
        fp: "到达的不动点",
        probe: "锁死探针：中性观测下从 −1、0、+1 出发的最大 |U|",
        sens: "不动点处对俯仰的灵敏度",
        bar: "验收线 2 V",
        pass: "通过",
        fail: "不通过",
        latched: (v) => `从 −1 和 +1 出发停在不同的地方：这次停在 ${v} V。它记住的是自己上一步做了什么，不是俯仰。俯仰小幅变化时，输出纹丝不动。`,
        sat: "只有一个不动点，而且它在电压轨上，从哪里出发都停在那里。俯仰很大时这只是饱和；俯仰为 0 时，这就是探针不通过。",
        ok: "只有一个不动点：从哪里出发都会回到同一个电压，俯仰一变它也跟着变。",
        slow: "还没收敛：g 接近 1 时，每一步只把误差缩小一点点。",
        diag: "a = 新动作",
        map: "策略",
        iter: "迭代",
        toy: "示意模型：a′ = clip(g·a + 0.1·俯仰 + b, −1, 1)，U = 8·a。不是 yd15 的网络。",
      }
    : {
        title: "prev_action fed back: iterate to the fixed point",
        g: "Reliance on its last action g",
        pitch: "Pitch (held fixed)",
        b: "Bias b",
        start: "Start prev_action at",
        x: "last action a",
        y: "new action",
        fp: "Fixed point reached",
        probe: "Latch probe: worst |U| from −1, 0, +1 at a neutral observation",
        sens: "Pitch sensitivity at the fixed point",
        bar: "bar 2 V",
        pass: "pass",
        fail: "fail",
        latched: (v) => `Starts at −1 and +1 end in different places; this one sits at ${v} V. It remembers what it did, not the pitch, and small pitch changes no longer move it. The robot has gone deaf to pitch.`,
        sat: "One fixed point, and it sits on the rail: every start ends there. At a large pitch that is plain saturation; at zero pitch it is the probe failing.",
        ok: "One fixed point: every start comes back to the same voltage, and it still moves with pitch.",
        slow: "Not settled yet: with g near 1 each step only shrinks the error a little.",
        diag: "a = new action",
        map: "policy",
        iter: "iterate",
        toy: "Toy model: a′ = clip(g·a + 0.1·pitch + b, −1, 1), U = 8·a. Not the yd15 network.",
      };

  const K = 0.1; // action units per degree of pitch
  const VMAX = 8; // volts at |a| = 1
  const clamp = (x) => Math.max(-1, Math.min(1, x));
  const step = (a, g, pitch, b) => clamp(g * a + K * pitch + b);
  const settle = (a0, g, pitch, b, n = 400) => {
    let a = a0;
    for (let i = 0; i < n; i++) a = step(a, g, pitch, b);
    return a;
  };

  class ActionLatch extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        g: Number(this.getAttribute("g") ?? 0.5),
        pitch: Number(this.getAttribute("pitch") ?? 0),
        b: Number(this.getAttribute("b") ?? 0.05),
        start: Number(this.getAttribute("start") ?? 1),
      };
      this.innerHTML = `
        <div class="widget action-latch">
          <p class="widget-title">${T.title}</p>
          <svg role="img" aria-label="${T.title}"></svg>
          <div class="widget-controls">
            <label>${T.g} <output data-o="g"></output><input type="range" data-k="g" min="0" max="1.6" step="0.01"></label>
            <label>${T.pitch} <output data-o="pitch"></output><input type="range" data-k="pitch" min="-10" max="10" step="0.5"></label>
            <label>${T.b} <output data-o="b"></output><input type="range" data-k="b" min="-0.2" max="0.2" step="0.01"></label>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center">
            <span style="font-size:.85rem;color:var(--muted)">${T.start}</span>
            <span class="seg" role="group">
              <button type="button" data-s="-1">−1</button><button type="button" data-s="0">0</button><button type="button" data-s="1">+1</button>
            </span>
          </div>
          <div class="readout">
            <div><small>${T.fp}</small><b data-v="fp"></b></div>
            <div><small>${T.sens}</small><b data-v="sens"></b></div>
            <div><small>${T.probe}</small><b data-v="probe"></b></div>
          </div>
          <p class="note" data-v="status" aria-live="polite"></p>
          <p class="note" style="color:var(--muted);font-size:.8rem">${T.toy}</p>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll("input[type=range]").forEach((inp) => {
        inp.value = this.s[inp.dataset.k];
        inp.addEventListener("input", () => {
          this.s[inp.dataset.k] = Number(inp.value);
          this.render();
        });
      });
      this.querySelectorAll("[data-s]").forEach((btn) =>
        btn.addEventListener("click", () => {
          this.s.start = Number(btn.dataset.s);
          this.render();
        })
      );
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    render() {
      const { g, pitch, b, start } = this.s;
      const W = Math.round(this.svg.clientWidth) || 520;
      const small = W < 440;
      // Square cobweb on the left, iterate trace on the right (stacked below on phones).
      const side = small ? W - 40 : Math.min(300, W * 0.5);
      const H = small ? side + 30 + 130 : side + 40;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const ox = 32, oy = 10;
      const X = (a) => ox + ((a + 1) / 2) * (side - 10);
      const Y = (a) => oy + ((1 - a) / 2) * (side - 10);
      const mapPath = Array.from({ length: 81 }, (_, i) => {
        const a = -1 + i / 40;
        return (i ? "L" : "M") + X(a).toFixed(1) + " " + Y(step(a, g, pitch, b)).toFixed(1);
      }).join("");
      // Cobweb from the chosen start
      let a = start, cob = `M${X(a).toFixed(1)} ${Y(-1).toFixed(1)}`;
      const trace = [a];
      for (let i = 0; i < 30; i++) {
        const n = step(a, g, pitch, b);
        cob += `L${X(a).toFixed(1)} ${Y(n).toFixed(1)}L${X(n).toFixed(1)} ${Y(n).toFixed(1)}`;
        a = n;
        trace.push(a);
      }
      const fp = settle(start, g, pitch, b);
      const fpShort = trace[trace.length - 1];
      const settled = Math.abs(fp - fpShort) < 0.01;

      // Iterate trace panel: U over 30 iterations
      const tx = small ? ox : ox + side + 28;
      const ty = small ? oy + side + 24 : oy;
      const tw = (small ? W - 8 : W - 8) - tx;
      const th = small ? 110 : side - 10;
      const TX = (i) => tx + (i / 30) * tw;
      const TY = (u) => ty + ((VMAX - u) / (2 * VMAX)) * th;
      const tpath = trace.map((v, i) => (i ? "L" : "M") + TX(i).toFixed(1) + " " + TY(v * VMAX).toFixed(1)).join("");

      this.svg.innerHTML = `
        <rect x="${X(-1)}" y="${Y(1)}" width="${X(1) - X(-1)}" height="${Y(-1) - Y(1)}" fill="none" stroke="var(--border)"/>
        <line x1="${X(0)}" x2="${X(0)}" y1="${Y(1)}" y2="${Y(-1)}" stroke="var(--border)"/>
        <line x1="${X(-1)}" x2="${X(1)}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--border)"/>
        ${[-1, 0, 1].map((v) => `<text x="${X(v)}" y="${Y(-1) + 14}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text><text x="${X(-1) - 5}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v}</text>`).join("")}
        <text x="${X(1)}" y="${Y(-1) + 26}" text-anchor="end" font-size="11" fill="var(--muted)">${T.x}</text>
        <path d="M${X(-1)} ${Y(-1)}L${X(1)} ${Y(1)}" stroke="var(--muted)" stroke-dasharray="4 4"/>
        <text x="${X(-0.92)}" y="${Y(0.86)}" text-anchor="start" font-size="11" fill="var(--muted)">${T.diag} (- - -)</text>
        <path d="${cob}" fill="none" stroke="var(--accent-2)" stroke-width="1.3" opacity="0.85"/>
        <path d="${mapPath}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
        <text x="${X(-0.95)}" y="${Y(step(-0.95, g, pitch, b)) - 6}" font-size="11" fill="var(--accent)">${T.map}</text>
        <circle cx="${X(start)}" cy="${Y(-1)}" r="4" fill="var(--accent-2)"/>
        <circle cx="${X(fp)}" cy="${Y(fp)}" r="6" fill="${Math.abs(settle(-1, g, pitch, b) - settle(1, g, pitch, b)) > 0.01 ? "var(--bad)" : "var(--good)"}" stroke="var(--surface)" stroke-width="2"/>
        <line x1="${tx}" x2="${tx + tw}" y1="${TY(0)}" y2="${TY(0)}" stroke="var(--border)"/>
        <line x1="${tx}" x2="${tx}" y1="${ty}" y2="${ty + th}" stroke="var(--border)"/>
        <line x1="${tx}" x2="${tx + tw}" y1="${TY(2)}" y2="${TY(2)}" stroke="var(--bad)" stroke-dasharray="3 3" opacity="0.6"/>
        <line x1="${tx}" x2="${tx + tw}" y1="${TY(-2)}" y2="${TY(-2)}" stroke="var(--bad)" stroke-dasharray="3 3" opacity="0.6"/>
        <text x="${tx + tw}" y="${TY(2) - 4}" text-anchor="end" font-size="11" fill="var(--bad)">±2 V</text>
        ${[-8, 0, 8].map((u) => `<text x="${tx - 5}" y="${TY(u) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${u}</text>`).join("")}
        <text x="${tx + tw}" y="${ty + th + 14}" text-anchor="end" font-size="11" fill="var(--muted)">${T.iter} → · U (V)</text>
        <path d="${tpath}" fill="none" stroke="var(--accent-2)" stroke-width="2"/>`;

      // Readouts
      const fmtV = (v) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2) + " V";
      this.querySelector('[data-o="g"]').textContent = g.toFixed(2);
      this.querySelector('[data-o="pitch"]').textContent = `${pitch.toFixed(1)}°`;
      this.querySelector('[data-o="b"]').textContent = b.toFixed(2);
      this.querySelector('[data-v="fp"]').textContent = fmtV(fp * VMAX);
      // Local sensitivity: nudge the pitch and re-settle from the fixed point itself.
      const d = ((settle(fp, g, pitch + 0.05, b) - settle(fp, g, pitch - 0.05, b)) / 0.1) * VMAX;
      this.querySelector('[data-v="sens"]').textContent = `${Math.abs(d) < 0.005 ? "0.00" : d.toFixed(2)} V/°`;
      const worst = Math.max(...[-1, 0, 1].map((s0) => Math.abs(settle(s0, g, 0, b) * VMAX)));
      const pass = worst < 2;
      this.querySelector('[data-v="probe"]').innerHTML = `${worst.toFixed(2)} V <span style="font-size:.8rem;color:${pass ? "var(--good)" : "var(--bad)"}">${pass ? T.pass : T.fail} · ${T.bar}</span>`;
      const multi = Math.abs(settle(-1, g, pitch, b) - settle(1, g, pitch, b)) > 0.01;
      this.querySelector('[data-v="status"]').textContent = !settled
        ? T.slow
        : multi
        ? T.latched(fmtV(fp * VMAX).replace(" V", ""))
        : Math.abs(fp) > 0.999
        ? T.sat
        : T.ok;
      this.querySelectorAll("[data-s]").forEach((btn) => btn.setAttribute("aria-pressed", String(Number(btn.dataset.s) === start)));
    }
  }
  customElements.define("action-latch", ActionLatch);
})();
