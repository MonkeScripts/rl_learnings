// <latency-budget layers="40-64-64-2" tanh="128" hz="100" chip="esp32f" preempt="1"> :
// does a small MLP fit its control period on a given chip? (Day 17)
// Every cost is derived from one measured network per chip (see COST below); anything else is an extrapolation.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "延迟预算：这个网络塞得进控制周期吗",
        layers: "层宽（输入-隐藏…-输出）",
        tanh: "tanh 调用次数",
        auto: "按隐藏层自动",
        hz: "策略频率",
        chip: "芯片和运行方式",
        preempt: "算上 500 Hz 控制节拍的抢占",
        presets: "预设",
        p: ["轮足 40-64-64-2 @100 Hz", "堆 14 帧 140-64-64-2", "Microduck 61-512-256-128-14 @50 Hz"],
        chips: {
          esp32f: "ESP32 · 浮点 C（DRAM 权重）",
          esp32i: "ESP32 · int16 esp-dl",
          s31dl: "ESP32-S31 · ESP-DL int16",
          s31c: "ESP32-S31 · 浮点 C（PSRAM 权重）",
        },
        seg: { mac: "乘加", tanh: "tanh", div: "40 次除法", cache: "冷缓存", pre: "节拍抢占" },
        period: "周期",
        est: "估计推理时间",
        head: "余量",
        macs: "乘加次数",
        w: "权重大小",
        ext: "离实测网络多远",
        fits: (p) => `塞得进：用掉周期的 ${p}%。`,
        tight: (p) => `能跑，但用掉周期的 ${p}%：中位数再被抢占一点就会溢出。`,
        over: (p) => `塞不进：估计是周期的 ${p}%。策略间隔会滑过周期，和 ESP32 上的 int16 一样。`,
        near: "离实测网络很近，估计可信。",
        far: (x) => `乘加数是实测网络的 ${x} 倍：这是外推，当猜测看。`,
        noSram: "浮点权重放不进 S31 最大的一块内部 SRAM（360,448 B），所以只能走 PSRAM。",
        sramOk: "浮点权重放得进内部 SRAM，但这种情况没测过：PSRAM 的单次乘加成本可能偏高。",
        espBig: "ESP32 的实测权重只有 27,656 B 放在 DRAM。大得多的权重未必放得下，放到 flash 会慢很多（S31 上 flash 比 PSRAM 慢 4.9 倍）。",
        bad: "层宽写成 40-64-64-2 这种格式，至少两层。",
        caption:
          "成本怎么来的：ESP32 浮点，6,784 次乘加 169 µs → 0.0249 µs/次；128 次 tanhf 255 µs → 1.99 µs/次；40 次除法 11 µs；冷缓存差 929 µs（推断，不是直接读数）。ESP32 int16：热缓存 1,201 µs ÷ 6,784 → 0.177 µs/次（含查表 tanh 和逐节点开销，没法再拆）；冷缓存 7,451 µs。抢占：中位窗口减最小值，浮点 1,711 µs，int16 2,070 µs。S31：196,864 次乘加，ESP-DL 4.201 ms → 0.0213 µs/次，PSRAM 浮点 9.914 ms → 0.0504 µs/次，都含 ELU，单核 320 MHz，没有控制节拍。S31 浮点的 tanh 按 ESP32 的 1.99 µs × 240/320 ≈ 1.49 µs 估：这是猜的。",
      }
    : {
        title: "Latency budget: does this network fit the period?",
        layers: "Layer widths (in-hidden…-out)",
        tanh: "tanh calls",
        auto: "auto from hidden layers",
        hz: "Policy rate",
        chip: "Chip and runtime",
        preempt: "Include preemption by the 500 Hz control tick",
        presets: "Presets",
        p: ["Wheeled-leg 40-64-64-2 @100 Hz", "14 frames 140-64-64-2", "Microduck 61-512-256-128-14 @50 Hz"],
        chips: {
          esp32f: "ESP32 · float C (weights in DRAM)",
          esp32i: "ESP32 · int16 through esp-dl",
          s31dl: "ESP32-S31 · ESP-DL int16",
          s31c: "ESP32-S31 · float C (weights in PSRAM)",
        },
        seg: { mac: "multiply-adds", tanh: "tanh", div: "40 divides", cache: "cold cache", pre: "tick preemption" },
        period: "Period",
        est: "Estimated inference",
        head: "Headroom",
        macs: "Multiply-adds",
        w: "Weights",
        ext: "Distance from the measured net",
        fits: (p) => `Fits: ${p}% of the period.`,
        tight: (p) => `Runs, but at ${p}% of the period: a little more preemption and the median overruns.`,
        over: (p) => `Does not fit: the estimate is ${p}% of the period. The policy interval slips past it, as int16 did on the ESP32.`,
        near: "Close to the measured network, so the estimate is solid.",
        far: (x) => `${x}× the measured network's multiply-adds: an extrapolation. Treat it as a guess.`,
        noSram: "The float weights do not fit the S31's largest internal SRAM block (360,448 B), so PSRAM it is.",
        sramOk: "The float weights would fit internal SRAM, which was never measured: the PSRAM per-MAC cost may be pessimistic here.",
        espBig: "The measured ESP32 weights were 27,656 B in DRAM. Much larger weights may not fit, and from flash they run far slower (on the S31, flash was 4.9× slower than PSRAM).",
        bad: "Write the widths like 40-64-64-2, at least two layers.",
        caption:
          "Where the costs come from: ESP32 float, 6,784 MACs in 169 µs → 0.0249 µs each; 128 tanhf calls in 255 µs → 1.99 µs each; 40 divides 11 µs; cold-cache gap 929 µs (inferred, not read off an instrument). ESP32 int16: 1,201 µs hot ÷ 6,784 → 0.177 µs per MAC, with the LUT tanh and per-node overhead folded in because one network cannot split them; cold cache 7,451 µs. Preemption is median window minus minimum: 1,711 µs float, 2,070 µs int16. S31: 196,864 MACs, ESP-DL 4.201 ms → 0.0213 µs each, float from PSRAM 9.914 ms → 0.0504 µs each, both with ELU folded in, single core at 320 MHz, no control tick. S31 float tanh is the ESP32's 1.99 µs × 240/320 ≈ 1.49 µs: a guess.",
      };

  // Per-chip costs in µs, each derived from the user's measurements (caption above).
  const COST = {
    esp32f: { mac: 169 / 6784, tanh: 255 / 128, div: 11, cache: 929, pre: 1711, bytes: 4, refMacs: 6784 },
    esp32i: { mac: 1201 / 6784, tanh: 0, div: 0, cache: 7451, pre: 2070, bytes: 2, refMacs: 6784 },
    s31dl: { mac: 4201 / 196864, tanh: 0, div: 0, cache: 0, pre: 0, bytes: 2, refMacs: 196864 },
    s31c: { mac: 9914 / 196864, tanh: (255 / 128) * (240 / 320), div: 0, cache: 0, pre: 0, bytes: 4, refMacs: 196864 },
  };
  const PRESETS = [
    { layers: "40-64-64-2", tanh: 128, hz: 100, chip: "esp32f" },
    { layers: "140-64-64-2", tanh: 128, hz: 100, chip: "esp32f" },
    { layers: "61-512-256-128-14", tanh: 0, hz: 50, chip: "s31dl" },
  ];
  const RATES = [25, 50, 100, 200, 500];
  const COLORS = { mac: "var(--accent)", tanh: "var(--accent-2)", div: "var(--muted)", cache: "var(--amber, #b8860b)", pre: "var(--border)" };

  const parse = (s) => {
    const n = String(s).split(/[^0-9]+/).filter(Boolean).map(Number);
    return n.length >= 2 && n.every((v) => v > 0 && v <= 4096) ? n : null;
  };
  const macsOf = (L) => L.slice(1).reduce((s, w, i) => s + L[i] * w, 0);
  const paramsOf = (L) => L.slice(1).reduce((s, w, i) => s + L[i] * w + w, 0);
  const hiddenOf = (L) => L.slice(1, -1).reduce((s, w) => s + w, 0);
  const fmtUs = (us) => (us >= 1000 ? (us / 1000).toFixed(us >= 10000 ? 1 : 2) + " ms" : Math.round(us) + " µs");
  const fmtN = (n) => n.toLocaleString("en-US");

  class LatencyBudget extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const layers = this.getAttribute("layers") ?? "40-64-64-2";
      this.s = {
        layers,
        tanh: this.hasAttribute("tanh") ? Number(this.getAttribute("tanh")) : hiddenOf(parse(layers) || [40, 64, 64, 2]),
        autoTanh: !this.hasAttribute("tanh"),
        hz: Number(this.getAttribute("hz") ?? 100),
        chip: COST[this.getAttribute("chip")] ? this.getAttribute("chip") : "esp32f",
        pre: (this.getAttribute("preempt") ?? "1") !== "0",
      };
      this.innerHTML = `
        <div class="widget latency-budget">
          <p class="widget-title">${T.title}</p>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin-bottom:.5rem">
            <small style="color:var(--muted)">${T.presets}</small>
            ${T.p.map((t, i) => `<button type="button" class="button secondary" data-p="${i}" style="padding:.3rem .6rem;font-size:.8rem">${t}</button>`).join("")}
          </div>
          <div class="widget-controls">
            <label>${T.layers}<input type="text" data-k="layers" inputmode="numeric" spellcheck="false" style="font:inherit;font-family:var(--mono);padding:.35rem .5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"></label>
            <label>${T.tanh} <output data-o="tanh"></output><input type="range" data-k="tanh" min="0" max="1024" step="1"></label>
            <label>${T.hz}<select data-k="hz" style="font:inherit;padding:.35rem .5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)">${RATES.map((r) => `<option value="${r}">${r} Hz</option>`).join("")}</select></label>
            <label>${T.chip}<select data-k="chip" style="font:inherit;padding:.35rem .5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)">${Object.keys(COST).map((c) => `<option value="${c}">${T.chips[c]}</option>`).join("")}</select></label>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem 1.2rem;font-size:.85rem;color:var(--muted)">
            <label style="display:flex;gap:.4rem;align-items:center"><input type="checkbox" data-k="autoTanh"> ${T.auto}</label>
            <label style="display:flex;gap:.4rem;align-items:center" data-pre-wrap><input type="checkbox" data-k="pre"> ${T.preempt}</label>
          </div>
          <svg role="img" aria-label="${T.title}" style="margin-top:.75rem"></svg>
          <div class="readout">
            <div><small>${T.est}</small><b data-v="est"></b></div>
            <div><small>${T.period}</small><b data-v="period"></b></div>
            <div><small>${T.head}</small><b data-v="head"></b></div>
            <div><small>${T.macs}</small><b data-v="macs"></b></div>
            <div><small>${T.w}</small><b data-v="w"></b></div>
          </div>
          <p class="note" data-v="verdict" aria-live="polite" style="color:var(--text)"></p>
          <p class="note" data-v="ext"></p>
          <p class="note" style="font-size:.78rem">${T.caption}</p>
        </div>`;
      this.svg = this.querySelector("svg");
      const q = (k) => this.querySelector(`[data-k="${k}"]`);
      q("layers").addEventListener("input", (e) => {
        this.s.layers = e.target.value;
        const L = parse(this.s.layers);
        if (L && this.s.autoTanh) this.s.tanh = Math.min(1024, hiddenOf(L));
        this.render();
      });
      q("tanh").addEventListener("input", (e) => {
        this.s.tanh = Number(e.target.value);
        this.s.autoTanh = false;
        this.render();
      });
      q("hz").addEventListener("change", (e) => { this.s.hz = Number(e.target.value); this.render(); });
      q("chip").addEventListener("change", (e) => { this.s.chip = e.target.value; this.render(); });
      q("autoTanh").addEventListener("change", (e) => {
        this.s.autoTanh = e.target.checked;
        const L = parse(this.s.layers);
        if (L && this.s.autoTanh) this.s.tanh = Math.min(1024, hiddenOf(L));
        this.render();
      });
      q("pre").addEventListener("change", (e) => { this.s.pre = e.target.checked; this.render(); });
      this.querySelectorAll("[data-p]").forEach((b) =>
        b.addEventListener("click", () => {
          const p = PRESETS[Number(b.dataset.p)];
          Object.assign(this.s, p, { autoTanh: false });
          this.render();
        })
      );
      new ResizeObserver(() => this.render()).observe(this.svg);
      this.render();
    }

    sync() {
      const q = (k) => this.querySelector(`[data-k="${k}"]`);
      if (document.activeElement !== q("layers")) q("layers").value = this.s.layers;
      q("tanh").value = this.s.tanh;
      q("hz").value = String(this.s.hz);
      q("chip").value = this.s.chip;
      q("autoTanh").checked = this.s.autoTanh;
      q("pre").checked = this.s.pre;
      this.querySelector('[data-o="tanh"]').textContent = this.s.tanh;
      const c = COST[this.s.chip];
      this.querySelector("[data-pre-wrap]").style.display = c.pre ? "flex" : "none";
    }

    render() {
      this.sync();
      const { tanh, hz, chip, pre } = this.s;
      const L = parse(this.s.layers);
      const W = Math.round(this.svg.clientWidth) || 520;
      const v = (k) => this.querySelector(`[data-v="${k}"]`);
      if (!L) {
        this.svg.setAttribute("viewBox", `0 0 ${W} 20`);
        this.svg.innerHTML = "";
        v("verdict").textContent = T.bad;
        ["est", "head", "macs", "w"].forEach((k) => (v(k).textContent = "–"));
        v("ext").textContent = "";
        return;
      }
      const c = COST[chip];
      const macs = macsOf(L);
      const segs = [
        ["mac", macs * c.mac],
        ["tanh", tanh * c.tanh],
        ["div", c.div ? (c.div * L[0]) / 40 : 0],
        ["cache", c.cache],
        ["pre", pre ? c.pre : 0],
      ].filter(([, us]) => us > 0);
      const est = segs.reduce((s, [, us]) => s + us, 0);
      const period = 1e6 / hz;
      const frac = est / period;

      // Bar chart: one stacked bar against the period line, at the real pixel width.
      const small = W < 440;
      const padL = 8, padR = 8, barY = 26, barH = 30;
      const legendRows = small ? Math.ceil(segs.length / 2) : 1;
      const H = barY + barH + 34 + legendRows * 18;
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const span = Math.max(period, est) * 1.08;
      const X = (us) => padL + (us / span) * (W - padL - padR);
      let x0 = 0;
      const rects = segs
        .map(([k, us]) => {
          const r = `<rect x="${X(x0).toFixed(1)}" y="${barY}" width="${Math.max(1, X(x0 + us) - X(x0)).toFixed(1)}" height="${barH}" fill="${COLORS[k]}" ${k === "pre" ? 'stroke="var(--muted)" stroke-dasharray="3 2"' : ""}/>`;
          x0 += us;
          return r;
        })
        .join("");
      const px = X(period);
      const anchor = px > W - 170 ? "end" : "start";
      const ticks = [0, span / 2, span].map((t) => t);
      const legend = segs
        .map(([k, us], i) => {
          const col = small ? i % 2 : i;
          const row = small ? Math.floor(i / 2) : 0;
          const colW = small ? (W - padL - padR) / 2 : (W - padL - padR) / segs.length;
          const lx = padL + col * colW;
          const ly = barY + barH + 34 + row * 18;
          return `<rect x="${lx}" y="${ly - 9}" width="10" height="10" fill="${COLORS[k]}"/><text x="${lx + 14}" y="${ly}" font-size="11" fill="var(--muted)">${T.seg[k]} ${fmtUs(us)}</text>`;
        })
        .join("");
      this.svg.innerHTML = `
        <rect x="${padL}" y="${barY}" width="${X(period) - padL}" height="${barH}" fill="var(--accent-soft)"/>
        ${rects}
        <line x1="${px}" x2="${px}" y1="${barY - 14}" y2="${barY + barH + 6}" stroke="${frac > 1 ? "var(--bad)" : "var(--text)"}" stroke-width="1.5" stroke-dasharray="4 3"/>
        <text x="${px + (anchor === "end" ? -4 : 4)}" y="${barY - 5}" text-anchor="${anchor}" font-size="11" fill="var(--text)" font-family="var(--mono)">${T.period} ${fmtUs(period)} · ${hz} Hz</text>
        ${ticks.map((t, i) => `<text x="${X(t)}" y="${barY + barH + 18}" text-anchor="${i === 0 ? "start" : i === 2 ? "end" : "middle"}" font-size="10" fill="var(--muted)" font-family="var(--mono)">${fmtUs(t)}</text>`).join("")}
        <g font-family="var(--sans)">${legend}</g>`;

      const pct = Math.round(frac * 100);
      v("est").textContent = fmtUs(est);
      v("period").textContent = fmtUs(period);
      v("head").textContent = (frac > 1 ? "−" : "") + fmtUs(Math.abs(period - est));
      v("head").style.color = frac > 1 ? "var(--bad)" : frac > 0.7 ? "var(--amber, inherit)" : "var(--good)";
      v("macs").textContent = fmtN(macs);
      const wBytes = paramsOf(L) * c.bytes;
      v("w").textContent = wBytes >= 10240 ? fmtN(Math.floor(wBytes / 1024)) + " KB" : fmtN(wBytes) + " B";
      v("verdict").textContent = frac > 1 ? T.over(pct) : frac > 0.7 ? T.tight(pct) : T.fits(pct);
      v("verdict").style.color = frac > 1 ? "var(--bad)" : "var(--text)";
      const ratio = macs / c.refMacs;
      const notes = [ratio > 2 || ratio < 0.5 ? T.far(ratio >= 10 ? Math.round(ratio) : ratio.toFixed(ratio < 1 ? 2 : 1)) : T.near];
      if (chip === "s31c") notes.push(paramsOf(L) * 4 > 360448 ? T.noSram : T.sramOk);
      if (chip.startsWith("esp32") && paramsOf(L) * c.bytes > 4 * 27656) notes.push(T.espBig);
      v("ext").textContent = notes.join(" ");
    }
  }
  customElements.define("latency-budget", LatencyBudget);
})();
