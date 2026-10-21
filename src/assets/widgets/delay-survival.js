// <delay-survival view="seed0" show="both"> : survival over all delays vs the longest-delay bin (Day 16).
// Data: artifacts/removing-more-made-it-better.html, seed-0 ladder at model_4999 (3000 episodes,
// full DR, evaluator seed 12345) and the three-seed means for control and combo.
// Only the overall survival and the 36-44 ms held-delay bin are published, so only those two are drawn.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "存活率：全部延迟 vs 最长延迟分箱",
        views: { seed0: "种子 0（8 组）", seeds3: "3 个种子（control、combo）" },
        shows: { both: "全部", f4: "4 帧", f1: "1 帧" },
        x0: "全部回合（5–45 ms）",
        x0s: "全部延迟",
        x1s: "36–44 ms",
        x1: "36–44 ms 分箱",
        f4: "4 帧",
        f1: "1 帧",
        sel: "点一组看数字",
        drop: "从总体到尾部掉了",
        vsCtl: "尾部比 control 低",
        overall: "总体存活率",
        tail: "36–44 ms 分箱",
        arms: {
          control: "control：完整的 40 输入接口",
          nolpf: "nolpf：去掉 50 ms 低通",
          nolpf_jerk1: "nolpf_jerk1：低通换成 jerk 惩罚",
          gyroyaw: "gyroyaw：去掉航向估计器",
          noreg: "noreg：去掉 prev_action 噪声",
          h1: "h1：4 帧 → 1 帧，低通保留",
          h1_noreg: "h1_noreg：1 帧，去掉噪声，低通保留",
          combo: "combo：四样全删，10 个输入，无滤波",
        },
        note: "来源只公布了两个数：总体存活率和 36–44 ms 这一个分箱（延迟最长的四分位）。其余三个分箱不在资料里，所以没有画。",
      }
    : {
        title: "Survival: all delays vs the longest-delay bin",
        views: { seed0: "Seed 0 (8 arms)", seeds3: "3 seeds (control, combo)" },
        shows: { both: "All", f4: "4 frames", f1: "1 frame" },
        x0: "all episodes (5–45 ms)",
        x0s: "all delays",
        x1s: "36–44 ms",
        x1: "36–44 ms bin",
        f4: "4 frames",
        f1: "1 frame",
        sel: "Tap an arm for its numbers",
        drop: "Drop from overall to tail",
        vsCtl: "Tail below control",
        overall: "Overall survival",
        tail: "36–44 ms bin",
        arms: {
          control: "control: the full 40-input interface",
          nolpf: "nolpf: the 50 ms low-pass removed",
          nolpf_jerk1: "nolpf_jerk1: low-pass replaced by a jerk penalty",
          gyroyaw: "gyroyaw: the yaw estimator removed",
          noreg: "noreg: the prev_action noise removed",
          h1: "h1: 4 frames → 1, low-pass kept",
          h1_noreg: "h1_noreg: 1 frame, no noise, low-pass kept",
          combo: "combo: all four removed, 10 inputs, no filter",
        },
        note: "The source publishes two numbers per arm: overall survival and the 36–44 ms bin (the longest held-delay quartile). The other three bins are not in it, so they are not drawn.",
      };

  const DATA = {
    seed0: [
      { id: "control", f: 4, all: 0.976, tail: 0.936 },
      { id: "nolpf", f: 4, all: 0.979, tail: 0.933 },
      { id: "gyroyaw", f: 4, all: 0.973, tail: 0.925 },
      { id: "noreg", f: 4, all: 0.970, tail: 0.911 },
      { id: "nolpf_jerk1", f: 4, all: 0.965, tail: 0.891 },
      { id: "combo", f: 1, all: 0.970, tail: 0.912 },
      { id: "h1_noreg", f: 1, all: 0.923, tail: 0.797 },
      { id: "h1", f: 1, all: 0.911, tail: 0.757 },
    ],
    seeds3: [
      { id: "control", f: 4, all: 0.975, tail: 0.923 },
      { id: "combo", f: 1, all: 0.968, tail: 0.905 },
    ],
  };

  class DelaySurvival extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        view: DATA[this.getAttribute("view")] ? this.getAttribute("view") : "seed0",
        show: ["both", "f4", "f1"].includes(this.getAttribute("show")) ? this.getAttribute("show") : "both",
        sel: this.getAttribute("arm") || "h1",
      };
      this.innerHTML = `
        <div class="widget delay-survival">
          <p class="widget-title">${T.title}</p>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.6rem">
            <span class="seg" role="group">${Object.keys(T.views).map((k) => `<button type="button" data-view="${k}">${T.views[k]}</button>`).join("")}</span>
            <span class="seg" role="group">${Object.keys(T.shows).map((k) => `<button type="button" data-show="${k}">${T.shows[k]}</button>`).join("")}</span>
          </div>
          <svg role="img" aria-label="${T.title}"></svg>
          <div data-v="arms" style="display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.6rem"></div>
          <div class="readout">
            <div><small>${T.overall}</small><b data-v="all"></b></div>
            <div><small>${T.tail}</small><b data-v="tail"></b></div>
            <div><small>${T.drop}</small><b data-v="drop"></b></div>
            <div><small>${T.vsCtl}</small><b data-v="vs"></b></div>
          </div>
          <p class="note" data-v="desc" aria-live="polite"></p>
          <p class="note">${T.note}</p>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { this.s.view = b.dataset.view; this.render(); }));
      this.querySelectorAll("[data-show]").forEach((b) => b.addEventListener("click", () => { this.s.show = b.dataset.show; this.render(); }));
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    rows() {
      const all = DATA[this.s.view];
      return all.filter((r) => this.s.show === "both" || (this.s.show === "f4" ? r.f === 4 : r.f === 1));
    }

    render() {
      const all = DATA[this.s.view];
      const rows = this.rows();
      if (!rows.some((r) => r.id === this.s.sel)) this.s.sel = rows.length ? rows[rows.length - 1].id : "control";
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 440;
      const H = narrow ? 300 : 320, padT = 22, padB = 30;
      const padL = narrow ? 40 : 54, padR = narrow ? 86 : 170;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const yLo = 0.74, yHi = 1.0;
      const Y = (v) => padT + ((yHi - v) / (yHi - yLo)) * (H - padT - padB);
      const x0 = padL + 6, x1 = W - padR;
      const color = (r) => (r.f === 4 ? "var(--accent)" : "var(--bad)");
      const ticks = [0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
      // Right-hand labels: spread them so they do not overlap.
      const sorted = rows.slice().sort((a, b) => b.tail - a.tail);
      const minGap = 13;
      let last = -Infinity;
      const labY = {};
      sorted.forEach((r) => { let y = Math.max(Y(r.tail) + 4, last + minGap); labY[r.id] = y; last = y; });
      const overflow = last - (H - padB + 8);
      if (overflow > 0) sorted.forEach((r) => (labY[r.id] -= overflow));
      const ctl = all.find((r) => r.id === "control");
      let s = `
        ${ticks.map((v) => `<line x1="${padL}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--border)" stroke-dasharray="${v === 1 ? "" : "2 4"}"/><text x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" font-family="var(--mono)">${v.toFixed(2)}</text>`).join("")}
        <line x1="${x0}" x2="${x0}" y1="${padT}" y2="${H - padB}" stroke="var(--muted)"/>
        <line x1="${x1}" x2="${x1}" y1="${padT}" y2="${H - padB}" stroke="var(--muted)"/>
        <text x="${x0}" y="${H - 10}" text-anchor="start" font-size="11" fill="var(--muted)">${narrow ? T.x0s : T.x0}</text>
        <text x="${x1}" y="${H - 10}" text-anchor="end" font-size="11" fill="var(--muted)">${narrow ? T.x1s : T.x1}</text>
        <g font-size="11">
          <line x1="${padL}" x2="${padL + 18}" y1="10" y2="10" stroke="var(--accent)" stroke-width="2.5"/><text x="${padL + 22}" y="14" fill="var(--text)">${T.f4}</text>
          <line x1="${padL + 80}" x2="${padL + 98}" y1="10" y2="10" stroke="var(--bad)" stroke-width="2.5"/><text x="${padL + 102}" y="14" fill="var(--text)">${T.f1}</text>
        </g>`;
      rows.forEach((r) => {
        const on = r.id === this.s.sel;
        s += `<g data-arm="${r.id}" style="cursor:pointer" opacity="${on ? 1 : 0.55}">
          <line x1="${x0}" y1="${Y(r.all)}" x2="${x1}" y2="${Y(r.tail)}" stroke="${color(r)}" stroke-width="${on ? 3.5 : 1.8}"/>
          <circle cx="${x0}" cy="${Y(r.all)}" r="${on ? 5 : 3.5}" fill="${color(r)}"/>
          <circle cx="${x1}" cy="${Y(r.tail)}" r="${on ? 5 : 3.5}" fill="${color(r)}"/>
          <line x1="${x1 + 5}" x2="${x1 + 10}" y1="${Y(r.tail)}" y2="${labY[r.id] - 4}" stroke="var(--border)"/>
          <text x="${x1 + 12}" y="${labY[r.id]}" font-size="11" font-family="var(--mono)" fill="${on ? "var(--text)" : "var(--muted)"}" font-weight="${on ? 600 : 400}">${narrow ? r.id : r.id + " " + r.tail.toFixed(3)}</text>
        </g>`;
      });
      this.svg.innerHTML = s;
      this.svg.querySelectorAll("[data-arm]").forEach((g) => g.addEventListener("click", () => { this.s.sel = g.dataset.arm; this.render(); }));

      this.querySelector('[data-v="arms"]').innerHTML = rows
        .map((r) => `<button type="button" class="button secondary" data-pick="${r.id}" aria-pressed="${r.id === this.s.sel}" style="padding:.25rem .55rem;font-size:.78rem;font-family:var(--mono);${r.id === this.s.sel ? "border-color:var(--accent-2);color:var(--text)" : ""}">${r.id}</button>`)
        .join("");
      this.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => { this.s.sel = b.dataset.pick; this.render(); }));

      const r = all.find((x) => x.id === this.s.sel);
      this.querySelector('[data-v="all"]').textContent = r.all.toFixed(3);
      this.querySelector('[data-v="tail"]').textContent = r.tail.toFixed(3);
      this.querySelector('[data-v="drop"]').textContent = (r.all - r.tail).toFixed(3);
      this.querySelector('[data-v="vs"]').textContent = r.id === "control" ? "–" : (ctl.tail - r.tail).toFixed(3);
      this.querySelector('[data-v="desc"]').textContent = T.arms[r.id];
      this.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === this.s.view)));
      this.querySelectorAll("[data-show]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.show === this.s.show)));
    }
  }
  customElements.define("delay-survival", DelaySurvival);
})();
