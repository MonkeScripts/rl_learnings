// <ppo-cycle shown="1"> : PPO's four-box cycle, Act -> Collect -> Judge -> Update, revealed one box at a time (Day 9).
// Follows the widget contract in AGENTS.md; modelled on ppo-clip.js.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "PPO 的循环：一次揭开一格",
        next: "下一格",
        all: "全部显示",
        reset: "从头开始",
        repeat: "重复",
        repeatSub: "机器人上约 3000 次",
        hint: "点“下一格”，按顺序走一遍。",
        done: "一圈走完。丢掉缓冲区，用漂移后的策略再来一次。",
        boxes: [
          { name: "行动 Act", sub: "策略在 1024 台机器人上采样 a~N(μ,σ)",
            detail: "行动：当前这一套权重驱动每一台机器人。噪声就是探索：每一步都是围绕均值做的一次小实验。" },
          { name: "收集 Collect", sub: "每台 128 步，进缓冲区：131,072 行",
            detail: "收集：每一行记下观测、采样出的动作、它的对数概率（旧看法）、奖励、价值估计和 done 标志。" },
          { name: "评判 Judge", sub: "评论家 + GAE：每行的优势和回报",
            detail: "评判：倒着走一遍，把存下的奖励和价值算成 δ、优势和评论家的目标。不调用任何网络。" },
          { name: "更新 Update", sub: "320 步裁剪过的梯度，然后扔掉缓冲区",
            detail: "更新：10 个 epoch × 32 个 4096 的小批量。比率对着旧看法算，裁剪在 1 ± 0.1。然后整个缓冲区丢掉，漂移后的策略重新上场。" },
        ],
      }
    : {
        title: "The PPO cycle, one box at a time",
        next: "Next box",
        all: "Show all",
        reset: "Start over",
        repeat: "Repeat",
        repeatSub: "about 3000 times on the robot",
        hint: "Press “Next box” to walk the loop in order.",
        done: "One lap done. Throw the buffer away and go again with the drifted policy.",
        boxes: [
          { name: "Act", sub: "the policy samples a ~ N(μ, σ) in 1024 robots",
            detail: "Act: the live weights drive every robot. The noise is the exploration: each step is a small experiment around the mean." },
          { name: "Collect", sub: "128 steps each into the buffer: 131,072 rows",
            detail: "Collect: each row keeps the observation, the sampled action, its log-prob (the old opinion), the reward, the value and the done flag." },
          { name: "Judge", sub: "critic + GAE: an advantage and a return per row",
            detail: "Judge: one backward pass turns the stored rewards and values into δ, the advantage and the critic's target. No network is called." },
          { name: "Update", sub: "320 clipped gradient steps, then discard the buffer",
            detail: "Update: 10 epochs × 32 minibatches of 4096. The ratio is taken against the old opinion and clipped at 1 ± 0.1. Then the whole buffer is thrown away and the drifted policy goes back out." },
        ],
      };

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const isCJK = (ch) => /[　-鿿＀-￯]/.test(ch);
  // Rough text width: CJK glyphs are square, Latin about 0.56 em in IBM Plex Sans.
  const width = (s, px) => [...s].reduce((w, ch) => w + (isCJK(ch) ? px : ch === " " ? 0.3 * px : 0.56 * px), 0);
  // Greedy wrap. Latin breaks at spaces, CJK can break between any two characters.
  // Full-width punctuation never starts a line.
  const NO_START = /^[，。：；、！？）]/;
  const wrap = (text, maxPx, px, maxLines = 4) => {
    const tokens = text.match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+|\s+/g) || [];
    const lines = [];
    let cur = "";
    for (const tok of tokens) {
      const trial = cur + tok;
      if (cur && width(trial.trimEnd(), px) > maxPx && !/^\s+$/.test(tok) && !NO_START.test(tok)) {
        lines.push(cur.trim());
        cur = tok.trimStart();
      } else cur = trial;
    }
    if (cur.trim()) lines.push(cur.trim());
    if (lines.length > maxLines) {
      lines.length = maxLines;
      lines[maxLines - 1] += "…";
    }
    return lines;
  };

  class PpoCycle extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.shown = Math.max(0, Math.min(4, Number(this.getAttribute("shown") ?? 1)));
      this.innerHTML = `
        <div class="widget ppo-cycle">
          <p class="widget-title">${T.title}</p>
          <svg role="img" aria-label="${T.title}"></svg>
          <p class="note" data-v="detail" aria-live="polite" style="min-height:3.2em"></p>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-top:.75rem">
            <button type="button" class="button" data-act="next">${T.next}</button>
            <button type="button" class="button secondary" data-act="all">${T.all}</button>
            <button type="button" class="button secondary" data-act="reset">${T.reset}</button>
            <span class="num" data-v="count" style="color:var(--muted);font-size:.85rem"></span>
          </div>
        </div>`;
      this.svg = this.querySelector("svg");
      this.querySelector('[data-act="next"]').addEventListener("click", () => { this.shown = Math.min(4, this.shown + 1); this.render(); });
      this.querySelector('[data-act="all"]').addEventListener("click", () => { this.shown = 4; this.render(); });
      this.querySelector('[data-act="reset"]').addEventListener("click", () => { this.shown = 0; this.render(); });
      // Draw at the real pixel width so labels keep their size on phones.
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    render() {
      const W = Math.round(this.svg.clientWidth) || 520;
      const narrow = W < 440;
      const titlePx = narrow ? 14 : 15, subPx = narrow ? 11.5 : 12.5, lineH = subPx + 4;
      const colGap = narrow ? 34 : Math.min(130, W * 0.16);
      const boxW = Math.min(narrow ? 999 : 240, (W - colGap - 4) / 2);
      const innerW = boxW - 20;
      const subs = T.boxes.map((b) => wrap(b.sub, innerW, subPx));
      const nLines = Math.max(...subs.map((s) => s.length));
      const boxH = 14 + titlePx + 8 + nLines * lineH + 10;
      const rowGap = 72;
      const H = 2 + boxH * 2 + rowGap + 2;
      if (this._w !== W || this._h !== H) {
        this._w = W; this._h = H;
        this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      }
      const x0 = (W - (boxW * 2 + colGap)) / 2;
      const xs = [x0, x0 + boxW + colGap, x0 + boxW + colGap, x0];
      const ys = [2, 2, 2 + boxH + rowGap, 2 + boxH + rowGap];
      const cx = (i) => xs[i] + boxW / 2;
      const cy = (i) => ys[i] + boxH / 2;

      const box = (i) => {
        const b = T.boxes[i];
        const on = i < this.shown;
        const current = on && i === this.shown - 1 && this.shown < 4;
        const stroke = current ? "var(--accent)" : "var(--border)";
        const fill = current ? "var(--accent-soft)" : on ? "var(--surface-2)" : "none";
        const head = `<text x="${xs[i] + 10}" y="${ys[i] + 14 + titlePx - 2}" font-size="${titlePx}" font-weight="600" fill="${on ? "var(--text)" : "var(--muted)"}" font-family="var(--sans)"><tspan font-family="var(--mono)" fill="var(--accent)">${i + 1}</tspan>  ${on ? esc(b.name) : "?"}</text>`;
        const sub = on
          ? subs[i].map((ln, k) => `<text x="${xs[i] + 10}" y="${ys[i] + 14 + titlePx + 8 + subPx + k * lineH}" font-size="${subPx}" fill="var(--muted)" font-family="var(--sans)">${esc(ln)}</text>`).join("")
          : "";
        return `<rect x="${xs[i]}" y="${ys[i]}" width="${boxW}" height="${boxH}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${current ? 2 : 1.2}" ${on ? "" : 'stroke-dasharray="5 4"'}/>${head}${sub}`;
      };

      // Arrow k runs from box k to box k+1 (clockwise), shown once box k+1 is revealed.
      const arrow = (k) => {
        const visible = k < 3 ? this.shown > k + 1 : this.shown === 4;
        if (!visible) return "";
        let x1, y1, x2, y2;
        if (k === 0) { x1 = xs[0] + boxW + 4; x2 = xs[1] - 6; y1 = y2 = cy(0); }
        else if (k === 1) { x1 = x2 = cx(1); y1 = ys[1] + boxH + 4; y2 = ys[2] - 6; }
        else if (k === 2) { x1 = xs[2] - 4; x2 = xs[3] + boxW + 6; y1 = y2 = cy(2); }
        else { x1 = x2 = cx(3); y1 = ys[3] - 4; y2 = ys[0] + boxH + 6; }
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--accent)" stroke-width="2" marker-end="url(#ppoc-head)"/>`;
      };

      // Centre label sits between the two vertical arrows; wrap it to that gap.
      const rep = wrap(T.repeatSub, cx(1) - cx(0) - 28, subPx, 2);
      const midY = ys[0] + boxH + rowGap / 2 - ((rep.length - 1) * lineH) / 2;
      const repeat = this.shown === 4
        ? `<text x="${W / 2}" y="${midY - 2}" text-anchor="middle" font-size="${titlePx}" font-weight="600" fill="var(--accent)" font-family="var(--sans)">↻ ${T.repeat}</text>` +
          rep.map((ln, k) => `<text x="${W / 2}" y="${midY + subPx + 2 + k * lineH}" text-anchor="middle" font-size="${subPx}" fill="var(--muted)" font-family="var(--sans)">${esc(ln)}</text>`).join("")
        : "";

      this.svg.innerHTML = `
        <defs><marker id="ppoc-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>
        ${[0, 1, 2, 3].map(arrow).join("")}
        ${[0, 1, 2, 3].map(box).join("")}
        ${repeat}`;

      const d = this.querySelector('[data-v="detail"]');
      d.textContent = this.shown === 0 ? T.hint : this.shown === 4 ? T.boxes[3].detail + (ZH ? "" : " ") + T.done : T.boxes[this.shown - 1].detail;
      this.querySelector('[data-v="count"]').textContent = `${this.shown} / 4`;
      this.querySelector('[data-act="next"]').disabled = this.shown === 4;
    }
  }
  customElements.define("ppo-cycle", PpoCycle);
})();
