// <curriculum-timeline mode="stair" it="750"> : Microduck's curriculum tracks, staircase vs ramp (Day 19).
// Schedules: notes/microduck-takeaways.md "Learning curriculum" (Slide 12 timeline).
// Reward curve and boundary numbers: the embedded data of artifacts/microduck-run-doctor.html,
// run 2026-09-14_17-56-13_velocity, Train/mean_reward, 5-iteration smoothing, iterations 0-2995.
// No ramp run was ever logged: in ramp mode the schedule is the same targets joined by straight lines,
// and the reward curve is shown greyed, not re-simulated.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "Microduck 课程时间线：阶梯还是斜坡",
        stair: "阶梯（实际用的）",
        ramp: "斜坡",
        it: "迭代",
        reward: "Train/mean_reward（真实曲线，纵轴从 80 起）",
        tracks: ["动作变化率惩罚权重", "站立环境比例", "头部命令范围 ±rad", "质心随机化 ±mm", "头部下垂惩罚权重"],
        at: (k) => `第 ${k} 次迭代时`,
        jump: "动作变化率权重的最大单次跳变",
        jumpStair: "×2（500 和 750 两处，如 −0.2 → −0.4）",
        jumpRamp: (p, k) => `每次迭代最多 ${p}%（约第 ${k} 次）`,
        share: "课程占整个 run",
        shareV: "2000 / 50000 = 4%",
        pick: "边界：",
        pre: "边界前",
        post: "前 25 次迭代",
        rec: "+150 到 +200 次迭代",
        ok: "掉下去，又回到边界前的水平之上：健康的边界。",
        notOk: "掉下去，200 次迭代后还在边界前之下。加重的惩罚本来就会压低总奖励，所以 Run Doctor 会先看原始 Metrics/* 再下结论；那一步的结果我的笔记里没有。",
        rampBoundary: "斜坡下这里没有边界，这只是阶梯原来跳的位置。",
        noteStair: "阶梯：每次跳变都会让总奖励掉一下。阴影是跳变后的 200 次迭代窗口；绿点是恢复了，琥珀色是没恢复。点一个边界看数字。",
        noteRamp: "斜坡：同样的目标点用直线连起来，分摊到几百次迭代里，没有哪一次迭代突然变重。代价是也没有边界可读：凹下去再回来的形状没有地方出现。Microduck 从没跑过斜坡版本，所以奖励曲线只能灰着摆在这里，不是新曲线。",
        changes: {
          500: "动作变化率 −0.1→−0.2 · 站立 2→5% · 头部范围 ×3.4 · 质心 ±3→5 mm",
          750: "动作变化率 −0.2→−0.4 · 站立 5→10%",
          1000: "动作变化率 −0.4→−0.6 · 站立 10→15% · 头部范围 ×2.3 · 质心 ±5→10 mm · 头部下垂 1→2",
          1250: "动作变化率 −0.6→−0.8",
          1500: "动作变化率 −0.8→−1.0 · 站立 15→20% · 头部范围 ×1.8 · 质心 ±10→15 mm · 头部下垂 2→3",
          2000: "站立 20→25% · 头部范围 ×1.5（到满量程）",
        },
      }
    : {
        title: "Microduck curriculum timeline: staircase or ramp",
        stair: "Staircase (what ran)",
        ramp: "Ramp",
        it: "iteration",
        reward: "Train/mean_reward (real curve, y axis from 80)",
        tracks: ["Action-rate penalty weight", "Standing envs", "Head command range ±rad", "CoM randomisation ±mm", "Head-bias penalty weight"],
        at: (k) => `At iteration ${k}`,
        jump: "Largest one-tick change in the action-rate weight",
        jumpStair: "×2 (at 500 and at 750, e.g. −0.2 → −0.4)",
        jumpRamp: (p, k) => `at most ${p}% per iteration (near ${k})`,
        share: "Share of the run under curriculum",
        shareV: "2,000 / 50,000 = 4%",
        pick: "Boundary:",
        pre: "pre-shock",
        post: "first 25 it",
        rec: "+150 to +200 it",
        ok: "Dipped and recovered above its pre-shock level: a healthy boundary.",
        notOk: "Dipped and still below pre-shock 200 iterations later. A heavier penalty lowers total reward by design, so the Run Doctor checks the raw Metrics/* before calling it; that check's result is not in my notes.",
        rampBoundary: "Under a ramp there is no boundary here; this is only where the staircase jumped.",
        noteStair: "Staircase: every jump dips total reward. Shading is the 200-iteration window after each jump; green dots recovered, amber did not. Pick a boundary to see its numbers.",
        noteRamp: "Ramp: the same targets joined by straight lines, spread over hundreds of iterations, so no single iteration gets suddenly heavier. The price is that there is no boundary to read: the dip-and-recover shape has nowhere to appear. Microduck never ran a ramp version, so the reward curve stays greyed here; it is not a new curve.",
        changes: {
          500: "action_rate −0.1→−0.2 · standing 2→5% · head range ×3.4 · CoM ±3→5 mm",
          750: "action_rate −0.2→−0.4 · standing 5→10%",
          1000: "action_rate −0.4→−0.6 · standing 10→15% · head range ×2.3 · CoM ±5→10 mm · head_bias 1→2",
          1250: "action_rate −0.6→−0.8",
          1500: "action_rate −0.8→−1.0 · standing 15→20% · head range ×1.8 · CoM ±10→15 mm · head_bias 2→3",
          2000: "standing 20→25% · head range ×1.5 (full)",
        },
      };

  // [iteration, value]. Env steps = iteration × 24.
  const TRACKS = [
    { pts: [[0, -0.1], [500, -0.2], [750, -0.4], [1000, -0.6], [1250, -0.8], [1500, -1.0]], fmt: (v) => v.toFixed(2) },
    { pts: [[0, 2], [500, 5], [750, 10], [1000, 15], [1500, 20], [2000, 25]], fmt: (v) => v.toFixed(1) + "%" },
    { pts: [[0, 0.05], [500, 0.17], [1000, 0.39], [1500, 0.72], [2000, 1.1]], fmt: (v) => v.toFixed(2) },
    { pts: [[0, 3], [500, 5], [1000, 10], [1500, 15]], fmt: (v) => v.toFixed(1) },
    { pts: [[0, 0], [600, 1], [1000, 2], [1500, 3]], fmt: (v) => v.toFixed(2) },
  ];
  const BOUNDS = [
    { it: 500, pre: 107.2, post: 103.2, rec: 111.7 },
    { it: 750, pre: 112.5, post: 109.7, rec: 117.6 },
    { it: 1000, pre: 119.0, post: 114.8, rec: 115.8 },
    { it: 1250, pre: 117.6, post: 115.7, rec: 120.8 },
    { it: 1500, pre: 121.1, post: 116.7, rec: 114.3 },
    { it: 2000, pre: 116.3, post: 112.7, rec: 110.3 },
  ];
  const REWARD = [0.1,0.5,1,1.7,2.3,2.9,3.7,4.6,5.6,7.5,9.7,12.3,16.1,19.3,26.2,31.2,47.8,70.1,78,81,77.3,76.8,73.1,75.8,77.7,84.2,92,89,90.3,90.1,85.9,85.5,85.7,89.8,95.8,96.6,96.8,94.8,93.7,90.8,92.3,93.8,97,100.1,99.1,94.5,94.9,95.8,93.7,93.8,95.1,99,101.8,101.2,98.5,96.3,96.8,96.9,97.9,100.4,102.2,99.5,98.9,99.7,99.2,100.5,101.6,100.7,104.4,101.8,103.9,101.3,101.6,102.1,103.7,104.3,102.2,102.3,102.8,104,103,103.2,102.7,104.8,103.7,103.8,104.5,105.2,103.3,106.1,101.9,104.5,106.2,105.1,106.9,107.5,107.1,106.6,107.4,106.5,108.1,104.4,103.1,102.2,101.8,100.5,99.3,96.9,99.5,101.6,103.4,103.8,102.3,105.9,107.3,107.4,106.8,108.6,108.7,111.3,109.6,108.3,111.1,110.6,110.5,109.3,110.6,107.7,110.6,109.7,109.9,110.5,111.7,111.4,111.8,111.8,112.6,111.2,113.8,111.4,111.7,114.6,112.4,114.2,113,113.3,112.8,112.8,112.4,111.8,112.1,109.1,112.5,108.3,107.6,107.3,105.5,106.5,105.8,105.1,106.5,110.9,110.6,112.8,112.5,113.1,114.8,116.7,115.4,115.2,115.6,117.5,117.1,117.2,118.8,117.7,118.5,119,116.9,118.2,116.2,117.2,116.8,117.1,118.7,118.4,118,116.6,119.3,118.3,117.3,118.7,118.5,119.1,119.1,118.5,119.3,119.2,118.2,119,119,117.3,116.6,111.6,113.8,110.8,111.6,110.2,109,108.2,108.3,109,111.4,108.6,112,110.3,112.7,111.6,112.4,113.2,114,114.2,115.5,113.7,114.1,114.6,114.7,112.7,116.2,115.1,115.1,114.8,115.5,115,115.2,117.2,117.6,115.4,115.5,116.7,115.8,116.4,117.2,117.8,118.6,117.8,116.9,115,119.8,116.6,118.4,115.6,116.1,115.7,115,115.4,114.7,113.7,114,113.3,112.9,115,116.7,117,114.9,115.8,118.2,117.5,117.6,118.8,119,118.3,117.9,119.5,119.3,120.8,121.7,121.2,121.1,122.5,119.9,121.2,118.7,119.6,121.1,122.6,121.1,121.2,121.3,121,122,121.8,119.9,121.2,123,121,122.7,120.7,120.6,120.3,120.6,117.6,118,116.1,112.9,115.7,113.4,111.5,110.8,111,109.6,111.4,111.1,113.6,112.2,111.2,111.9,111.1,113.3,112.7,112.8,114,114.3,114,114.7,113.8,112.9,115.7,112.4,114.4,113.7,114.5,113.5,113.7,111.5,113.2,114.4,115.4,115.8,115.1,115.6,114.6,115.2,115.4,114.2,116.2,116.3,116.2,116.3,116.7,114.9,116.4,117.2,114.8,116.5,114,116,114.9,115.6,114,114.6,113.8,114.4,114.1,115.1,113.3,116,113.4,112.5,110.3,115.5,114.5,112.9,114.3,113.3,113.4,114.4,113.3,115,114.4,115.5,115.8,113.8,115.9,115.2,117.1,114,116.6,116.4,117,116.4,114.9,116.2,114.4,114.5,116.4,117.3,116.3,115.3,115.2,115.3,114.8,112.3,111.9,112.9,110.7,111.3,109.4,105.4,108.1,106.8,105.6,108.3,108.9,108.3,107.8,107.9,106.8,108.9,108.3,108.8,108.6,108.9,110.2,109.4,109.3,110,109.8,111.1,110.1,111.6,110.8,110.7,110.2,109.9,110.5,110.5,111.1,111.4,108.5,109.1,109.2,109.5,109.4,108.3,108.2,109.8,108.6,108.9,107.8,108.2,109,107.8,111.6,110.3,110.4,109.4,110,110.5,108.3,110.7,109.5,111.8,110.4,109.3,111.4,113.6,111.1,109.8,111.1,111.7,112.7,113.2,111.7,110,112.1,113.1,112.7,112.4,113.4,112.6,114.1,114.4,114.4,112.5,113.3,114.3,114.2,114.3,113.1,113.3,113.5,114.3,114.5,112.3,113.5,114.4,114,112.3,113.3,114.2,112.2,114.2,113.9,112.8,113.1,110,111,111.2,113,112.7,112.8,110.4,114,112,113.2,112.9,111.7,113,114.9,114.1,112.5,113.6,112.6,113.7,113.4,114.1,111.5,112.9,113.5,113.6,112.9,111.3,112.2,113.4,111.8,111.9,112,111.8,112.7,110.8,110.2,112.7,112.4,111.2,110.6,111.6,112,112.2,113.3,110.7,114,114,113.3,113,112.5,112.2,113.3,113,113.3,111,112.1,112.7,112.6,112.3,114,112.7,112.5,114.2,112.9,114.2,112.9,114.1,115.5,114.5,115.3,114.4,114.9,116.1,114,112.4,112.6,112.1,111.2,113.8,114.2,114.1,113.3,114,113.4,112.6,114.3,114,113.9,114.3,114.6,115.3,114.8,114.5,116]; // every 5 iterations from 0
  const XMAX = 3000;

  const valueAt = (pts, k, ramp) => {
    let i = 0;
    while (i + 1 < pts.length && pts[i + 1][0] <= k) i++;
    if (!ramp || i + 1 >= pts.length) return pts[i][1];
    const [a, va] = pts[i], [b, vb] = pts[i + 1];
    return va + ((k - a) / (b - a)) * (vb - va);
  };
  // Largest relative per-iteration change of the action-rate weight under the ramp.
  const rampJump = (() => {
    const p = TRACKS[0].pts;
    let best = 0, at = 0;
    for (let i = 0; i + 1 < p.length; i++) {
      const slope = Math.abs(p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0]);
      const rel = slope / Math.abs(p[i][1]);
      if (rel > best) { best = rel; at = p[i][0]; }
    }
    return { pct: (best * 100).toFixed(1), at };
  })();

  class CurriculumTimeline extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.s = {
        ramp: this.getAttribute("mode") === "ramp",
        it: Math.max(0, Math.min(XMAX, Number(this.getAttribute("it") ?? 750))),
      };
      this.innerHTML = `
        <div class="widget curriculum-timeline">
          <p class="widget-title">${T.title}</p>
          <span class="seg" role="group">
            <button type="button" data-m="0">${T.stair}</button><button type="button" data-m="1">${T.ramp}</button>
          </span>
          <svg role="img" aria-label="${T.title}" style="margin-top:.75rem"></svg>
          <div class="widget-controls">
            <label>${T.it} <output data-o="it"></output><input type="range" min="0" max="${XMAX}" step="5" data-k="it"></label>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center">
            <small style="color:var(--muted)">${T.pick}</small>
            ${BOUNDS.map((b, i) => `<button type="button" class="button secondary" data-b="${i}" style="padding:.25rem .55rem;font-size:.8rem">${b.it}</button>`).join("")}
          </div>
          <p class="note" data-v="bnote" aria-live="polite"></p>
          <div class="readout" data-v="cards"></div>
          <p class="note" data-v="mnote"></p>
        </div>`;
      this.svg = this.querySelector("svg");
      const slider = this.querySelector("input[type=range]");
      slider.value = this.s.it;
      slider.addEventListener("input", () => { this.s.it = Number(slider.value); this.render(); });
      this.querySelectorAll("[data-m]").forEach((b) =>
        b.addEventListener("click", () => { this.s.ramp = b.dataset.m === "1"; this.render(); })
      );
      this.querySelectorAll("[data-b]").forEach((b) =>
        b.addEventListener("click", () => {
          this.s.it = BOUNDS[Number(b.dataset.b)].it;
          slider.value = this.s.it;
          this.render();
        })
      );
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    render() {
      const { ramp, it } = this.s;
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 480;
      const padL = narrow ? 8 : 12, padR = narrow ? 8 : 12;
      const laneH = narrow ? 24 : 28, labelH = 15, laneGap = 8;
      const lanesTop = 4;
      const lanesH = TRACKS.length * (labelH + laneH + laneGap);
      const rTop = lanesTop + lanesH + 18, rH = narrow ? 120 : 150;
      const H = rTop + rH + 26;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const X = (k) => padL + (k / XMAX) * (W - padL - padR);
      const xt = narrow ? [0, 1000, 2000, 3000] : [0, 500, 1000, 1500, 2000, 2500, 3000];
      let g = "";

      // Boundary guides through every panel
      BOUNDS.forEach((b) => {
        g += `<line x1="${X(b.it)}" x2="${X(b.it)}" y1="${lanesTop}" y2="${rTop + rH}" stroke="var(--border)" stroke-dasharray="2 3"/>`;
      });

      // Lanes
      TRACKS.forEach((tr, i) => {
        const y0 = lanesTop + i * (labelH + laneH + laneGap);
        const top = y0 + labelH, bot = top + laneH;
        const vs = tr.pts.map((p) => p[1]);
        const lo = Math.min(...vs), hi = Math.max(...vs);
        // Plot magnitude so every lane rises left to right
        const sgn = vs[vs.length - 1] < vs[0] ? -1 : 1;
        const Y = (v) => bot - ((sgn * v - Math.min(sgn * lo, sgn * hi)) / (hi - lo)) * laneH;
        let d = "";
        for (let k = 0; k <= XMAX; k += 5) {
          const v = valueAt(tr.pts, k, ramp);
          d += (k ? "L" : "M") + X(k).toFixed(1) + " " + Y(v).toFixed(1);
        }
        const cur = valueAt(tr.pts, it, ramp);
        g += `<text x="${padL}" y="${y0 + 11}" font-size="11" fill="var(--muted)">${T.tracks[i]}: ${tr.fmt(tr.pts[0][1])} → ${tr.fmt(tr.pts[tr.pts.length - 1][1])}</text>`;
        g += `<line x1="${padL}" x2="${W - padR}" y1="${bot}" y2="${bot}" stroke="var(--border)"/>`;
        g += `<path d="${d}" fill="none" stroke="${i === 0 ? "var(--accent)" : "var(--accent-2)"}" stroke-width="${i === 0 ? 2.5 : 1.8}" stroke-linejoin="round"/>`;
        g += `<circle cx="${X(it)}" cy="${Y(cur)}" r="3.5" fill="var(--text)"/>`;
      });

      // Reward panel
      // Zoomed to where the dips live; the climb from 0 is clipped at the bottom edge.
      const yMin = 80, yMax = 126;
      const RY = (v) => rTop + rH - ((Math.min(yMax, Math.max(yMin, v)) - yMin) / (yMax - yMin)) * rH;
      g += `<text x="${padL}" y="${rTop - 5}" font-size="11" fill="var(--muted)">${T.reward}</text>`;
      if (!ramp) {
        BOUNDS.forEach((b) => {
          g += `<rect x="${X(b.it)}" y="${rTop}" width="${X(b.it + 200) - X(b.it)}" height="${rH}" fill="var(--accent-soft)"/>`;
        });
      }
      [80, 100, 120].forEach((v) => {
        g += `<line x1="${padL}" x2="${W - padR}" y1="${RY(v)}" y2="${RY(v)}" stroke="var(--border)" stroke-opacity="${v > yMin ? 0.5 : 1}"/>`;
        g += `<text x="${W - padR}" y="${RY(v) - 3}" text-anchor="end" font-size="10" fill="var(--muted)" font-family="var(--mono)">${v}</text>`;
      });
      let rd = "";
      REWARD.forEach((v, i) => { rd += (i ? "L" : "M") + X(i * 5).toFixed(1) + " " + RY(v).toFixed(1); });
      g += `<path d="${rd}" fill="none" stroke="${ramp ? "var(--muted)" : "var(--text)"}" stroke-width="1.5" ${ramp ? 'stroke-dasharray="3 3" opacity="0.5"' : ""} stroke-linejoin="round"/>`;
      if (!ramp) {
        BOUNDS.forEach((b) => {
          const good = b.rec > b.pre;
          g += `<circle cx="${X(b.it + 175)}" cy="${RY(b.rec)}" r="4" fill="${good ? "var(--good)" : "var(--amber)"}" stroke="var(--surface)" stroke-width="1.5"/>`;
        });
      }
      xt.forEach((v) => {
        g += `<text x="${X(v)}" y="${rTop + rH + 15}" text-anchor="${v === 0 ? "start" : v === XMAX ? "end" : "middle"}" font-size="10" fill="var(--muted)" font-family="var(--mono)">${v}</text>`;
      });
      // Cursor
      g += `<line x1="${X(it)}" x2="${X(it)}" y1="${lanesTop}" y2="${rTop + rH}" stroke="var(--text)" stroke-opacity="0.55"/>`;
      this.svg.innerHTML = g;

      // Readouts
      this.querySelector('[data-o="it"]').textContent = `${it} (env step ${(it * 24).toLocaleString("en-US")})`;
      this.querySelectorAll("[data-m]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.m === "1") === ramp)));
      this.querySelector('[data-v="cards"]').innerHTML =
        TRACKS.map((tr, i) => `<div><small>${T.tracks[i]}</small><b>${tr.fmt(valueAt(tr.pts, it, ramp))}</b></div>`).join("") +
        `<div><small>${T.jump}</small><b style="font-size:.85rem">${ramp ? T.jumpRamp(rampJump.pct, rampJump.at) : T.jumpStair}</b></div>` +
        `<div><small>${T.share}</small><b style="font-size:.85rem">${T.shareV}</b></div>`;
      const b = BOUNDS.find((x) => x.it === it);
      const bn = this.querySelector('[data-v="bnote"]');
      if (!b) bn.textContent = "";
      else if (ramp) bn.textContent = `${b.it}: ${T.rampBoundary}`;
      else
        bn.innerHTML = `<b>${b.it}</b>: ${T.changes[b.it]}<br><span style="font-family:var(--mono)">${T.pre} ${b.pre} → ${T.post} ${b.post} → ${T.rec} ${b.rec}</span><br>${b.rec > b.pre ? T.ok : T.notOk}`;
      this.querySelector('[data-v="mnote"]').textContent = ramp ? T.noteRamp : T.noteStair;
    }
  }
  customElements.define("curriculum-timeline", CurriculumTimeline);
})();
