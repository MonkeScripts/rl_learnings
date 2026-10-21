// <arm-table sort="surv"> : the nine-arm interface ablation as a sortable table with a "which arm would you ship?" pick (Day 18).
// Data: removing-more-made-it-better.html, seed 0, model_4999, n = 3000, evaluator seed 12345, full domain randomisation.
(() => {
  const ZH = document.documentElement.lang.startsWith("zh");
  const T = ZH
    ? {
        title: "九组消融：你会把哪一组刷进机器人？",
        hint: "点表头排序（再点一次反向）。选一行，作为你要上机的那一组。",
        cols: { arm: "实验组", surv: "存活率", bin: "36–44 ms 档", wob: "晃动 sd", drift: "航向漂移", rail: "锁死探针" },
        short: { arm: "实验组", surv: "存活", bin: "36–44", wob: "晃动", drift: "漂移", rail: "锁死" },
        verdict: "我的结论",
        pick: "上机这组",
        reset: "重新选",
        you: "你选了",
        mine: "我实际上机的",
        killed: "第 700 次迭代被停，回合长度 62：从没站稳",
        foot: "种子 0，model_4999，3000 个回合，全域随机化。36–44 ms 档是最长的保持延迟四分位。晃动 sd 是 12 ms 台架条件下的俯仰标准差，越小越稳。航向漂移单位 rad/s。锁死探针是 prev_action 不动点里最坏的电压，越小越好。单种子下存活率差别小于约 0.011 分不出来。窄屏上不显示航向漂移这一列。",
        sorted: (c, d) => `按 ${c} ${d > 0 ? "升序" : "降序"}`,
      }
    : {
        title: "Nine arms: which one would you flash?",
        hint: "Tap a column header to sort (tap again to reverse). Pick the row you would put on the robot.",
        cols: { arm: "Arm", surv: "Survival", bin: "36–44 ms bin", wob: "Wobble sd", drift: "Heading drift", rail: "Rail probe" },
        short: { arm: "Arm", surv: "Surv.", bin: "36–44", wob: "Wobble", drift: "Drift", rail: "Rail" },
        verdict: "My verdict",
        pick: "Ship this one",
        reset: "Pick again",
        you: "You picked",
        mine: "What I kept on the robot",
        killed: "killed at iteration 700, episode length 62: never balanced",
        foot: "Seed 0, model_4999, 3000 episodes under full domain randomisation. The 36–44 ms bin is the longest held-delay quartile. Wobble sd is pitch standard deviation on the 12 ms bench condition, lower is calmer. Heading drift is in rad/s. The rail probe is the worst prev_action fixed point in volts, lower is safer. At one seed, survival differences under about 0.011 cannot be resolved. On narrow screens the heading-drift column is hidden.",
        sorted: (c, d) => `sorted by ${c}, ${d > 0 ? "ascending" : "descending"}`,
      };

  const L = (en, zh) => (ZH ? zh : en);
  // what: what came out. verdict: the source's verdict column. why: the reasoning shown after a pick.
  const ARMS = [
    {
      id: "control", surv: 0.976, bin: 0.936, wob: 1.58, drift: 0.0034, rail: 0.84,
      what: L("nothing: the 40-input interface", "什么都没删：40 输入的接口"),
      verdict: L("reference", "参照组"),
      why: L(
        "The shipped interface. Nothing else on this table beats it on the axis that predicted the bench, the long-delay bin (0.936), and its rail probe sits well under the 2 V retrain acceptance.",
        "就是实际上机的接口。表里没有哪一组在能预言台架的那一列，也就是长延迟档（0.936）上赢过它，它的锁死探针也远低于 2 V 的重训验收线。"
      ),
    },
    {
      id: "nolpf", surv: 0.979, bin: 0.933, wob: 2.46, drift: 0.0032, rail: 0.57,
      what: L("the 50 ms odometry low-pass", "50 ms 里程计低通"),
      verdict: L("keep it", "留着"),
      why: L(
        "The top survival number, and it means nothing: 0.003 above the control is inside the 0.011 tie band. Wobble rose 56%, because inverting the filter amplifies the 12-bit encoder dither by about 6.4. Sorting by survival picks the shakiest healthy arm.",
        "存活率最高，但这个第一没有意义：比 control 高 0.003，落在 0.011 的平局带里。晃动涨了 56%，因为把滤波器反解回去，会把 12 位编码器的抖动放大约 6.4 倍。按存活率排序，挑中的是最抖的那个健康组。"
      ),
    },
    {
      id: "jerk1", surv: 0.965, bin: 0.891, wob: 1.09, drift: 0.0038, rail: 1.14,
      what: L("low-pass swapped for a jerk penalty (1.0)", "低通换成 jerk 惩罚（1.0）"),
      verdict: L("worse on bench", "台架上更差"),
      why: L(
        "The calmest wobble on the table, 1.09°, bought at the tail: the long-delay bin falls to 0.891 and on the bench it drives further forward before recovering from a push. At the action, dither and the fast corrections a long loop needs are the same signal, so a penalty cannot take one without the other.",
        "全表晃动最小，1.09°，代价记在尾巴上：长延迟档掉到 0.891，台架上被推一下要往前冲得更远才救回来。到了动作这一端，抖动和长回路需要的快速修正是同一个信号，惩罚压一个就会压到另一个。"
      ),
    },
    {
      id: "jerk4", surv: null, bin: null, wob: null, drift: null, rail: null,
      what: L("the same penalty at weight 4.0", "同样的惩罚，权重 4.0"),
      verdict: L("killed", "被停"),
      why: L(
        "Never balanced. Same direction as weight 1.0, more severe, which says the problem is structural rather than a tuning one.",
        "从没站稳。方向和权重 1.0 一样，只是更严重，说明问题出在结构上，不是参数没调好。"
      ),
    },
    {
      id: "gyroyaw", surv: 0.973, bin: 0.925, wob: 1.99, drift: 0.0064, rail: 0.79,
      what: L("the yaw estimator (10 constants, PI, slip gate, settle clock)", "航向估计器（十个常数、PI、打滑门、稳定时钟）"),
      verdict: L("removable", "可以删"),
      why: L(
        "The best candidate to cut, and the one cut the evidence does not yet allow. It corrects about 5° of drift against a 14° heading sigma, so the objective barely notices it. But it rests on one seed, and its 20 s settle clock runs inside 10 s episodes, so simulation never tests the part it was built for. That is a bench question.",
        "最值得删的候选，也是证据还不允许删的那一个。它修正大约 5° 的漂移，而航向项的 sigma 是 14°，目标函数几乎感觉不到它。但这个结论只有一个种子，而且它 20 s 的稳定时钟跑在 10 s 的回合里，仿真从来没测到它真正要干的那部分。这得上台架回答。"
      ),
    },
    {
      id: "h1", surv: 0.911, bin: 0.757, wob: 1.54, drift: 0.0044, rail: 2.08,
      what: L("frame stack, 4 frames → 1", "帧堆叠，4 帧 → 1 帧"),
      verdict: L("keep it", "留着"),
      why: L(
        "The worst arm: 0.757 at long delay and a 2.08 V rail probe, over the 2 V acceptance. With the filter on and one frame, the odometry slot is nearly all history and says almost nothing about now.",
        "最差的一组：长延迟档 0.757，锁死探针 2.08 V，超过 2 V 验收线。开着滤波器只留一帧，里程计那一格几乎全是历史，几乎不告诉你现在。"
      ),
    },
    {
      id: "h1_noreg", surv: 0.923, bin: 0.797, wob: 1.85, drift: 0.0041, rail: 1.97,
      what: L("stack and prev_action noise, low-pass kept", "帧堆叠和 prev_action 噪声，低通保留"),
      verdict: L("attribution", "归因用"),
      why: L(
        "Not a candidate: it exists to split h1's damage between the stack and the noise. One frame of history still loses badly at the tail.",
        "不是候选：它存在的意义是把 h1 的损失拆给帧堆叠和噪声。只有一帧历史，尾巴上照样输得很惨。"
      ),
    },
    {
      id: "noreg", surv: 0.97, bin: 0.911, wob: 1.46, drift: 0.0031, rail: 1.04,
      what: L("the prev_action noise regulariser", "prev_action 噪声正则"),
      verdict: L("removable", "可以删"),
      why: L(
        "Survival is inside the tie band, but the long-delay bin drops 0.025 and the rail probe rises from 0.84 to 1.04 V. The noise costs nothing at deploy time (it is training-only), so removing it saves nothing on the robot.",
        "存活率在平局带里，但长延迟档掉了 0.025，锁死探针从 0.84 V 升到 1.04 V。这份噪声只在训练时加，部署时不花任何代价，删掉它在机器人上什么也省不下。"
      ),
    },
    {
      id: "combo", surv: 0.97, bin: 0.912, wob: 1.23, drift: 0.0066, rail: 0.81,
      what: L("all four at once: 10 inputs, no filters", "四样一起删：10 个输入，没有滤波器"),
      verdict: L("see Day 14", "见第 14 天"),
      why: L(
        "The tempting one: a quarter of the inputs, calmer than the control, and a tie at one seed. Three seeds say it is really about 0.007 worse (0.968 against 0.975, long-delay 0.905 against 0.923), and on the bench it drives further forward after a push, as the bin predicted. Worth one more combo arm on the new 3–30 ms plant, not a flash on this one.",
        "最诱人的一组：输入只剩四分之一，比 control 还稳，单种子下打平。三个种子说它其实差约 0.007（0.968 对 0.975，长延迟档 0.905 对 0.923），台架上被推之后往前冲得更远，和延迟档预言的一样。值得在新的 3–30 ms 被控对象上再跑一组 combo，但不值得在这个上面刷机。"
      ),
    },
  ];
  const NAMES = { jerk1: "nolpf_jerk1", jerk4: "nolpf_jerk4" };
  const COLS = ["surv", "bin", "wob", "drift", "rail"];
  // +1 means higher is better.
  const GOOD = { surv: 1, bin: 1, wob: -1, drift: -1, rail: -1 };
  const fmt = (k, v) =>
    v == null ? "—" : k === "wob" ? v.toFixed(2) + "°" : k === "rail" ? v.toFixed(2) + " V" : k === "drift" ? v.toFixed(4) : v.toFixed(3);

  class ArmTable extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      const s0 = this.getAttribute("sort");
      this.sort = COLS.includes(s0) ? s0 : null;
      this.dir = this.sort ? -GOOD[this.sort] : 1;
      this.picked = null;
      this.innerHTML = `
        <div class="widget arm-table">
          <p class="widget-title">${T.title}</p>
          <p class="note" style="margin:0 0 .6rem">${T.hint}</p>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:.8rem"></table>
          </div>
          <p class="note" data-v="sorted" aria-live="polite"></p>
          <div data-v="answer" aria-live="polite"></div>
          <p class="note">${T.foot}</p>
        </div>`;
      this.table = this.querySelector("table");
      // Compact layout below 560px: short headers, the description on its own row.
      new ResizeObserver(() => {
        const c = this.table.parentElement.clientWidth < 560;
        if (c !== this.compact) {
          this.compact = c;
          this.render();
        }
      }).observe(this.table.parentElement);
      this.compact = this.table.parentElement.clientWidth < 560;
      this.render();
    }

    rows() {
      const r = ARMS.slice();
      if (!this.sort) return r;
      const k = this.sort, d = this.dir;
      return r.sort((a, b) => {
        if (a[k] == null) return 1;
        if (b[k] == null) return -1;
        return d * (a[k] - b[k]);
      });
    }

    render() {
      const C = this.compact;
      const cell = C ? "padding:.35rem .2rem;vertical-align:top" : "padding:.4rem .45rem;border-bottom:1px solid var(--border);vertical-align:top";
      const lab = C ? T.short : T.cols;
      const showV = this.picked && !C;
      const cols = C ? COLS.filter((k) => k !== "drift") : COLS;
      const head = `<tr>
        <th style="${cell};text-align:left;color:var(--muted);font-weight:500">${lab.arm}</th>
        ${cols.map((k) => {
          const on = this.sort === k;
          const arrow = on ? (this.dir > 0 ? " ▲" : " ▼") : "";
          return `<th style="${cell};text-align:right;white-space:nowrap"><button type="button" data-sort="${k}" aria-pressed="${on}" style="background:none;border:0;padding:0;font:inherit;cursor:pointer;color:${on ? "var(--accent)" : "var(--muted)"};font-weight:${on ? 600 : 500}" aria-label="${T.cols[k]}">${lab[k]}${arrow}</button></th>`;
        }).join("")}
        ${showV ? `<th style="${cell};text-align:left;color:var(--muted);font-weight:500">${T.verdict}</th>` : ""}
      </tr>`;
      const body = this.rows()
        .map((a) => {
          const sel = this.picked === a.id;
          const mine = this.picked && a.id === "control";
          const bg = sel ? "background:var(--accent-2-soft);" : mine ? "background:var(--accent-soft);" : "";
          const nums = a.surv == null
            ? `<td colspan="${cols.length}" style="${cell};color:var(--muted);font-style:italic;${C ? "font-size:.74rem;" : ""}">${T.killed}</td>`
            : cols.map((k) => `<td style="${cell};text-align:right;font-family:var(--mono);white-space:nowrap;${C ? "font-size:.74rem;" : ""}">${C ? fmt(k, a[k]).replace(" V", "") : fmt(k, a[k])}</td>`).join("");
          const desc = `<small style="color:var(--muted)">${a.what}${this.picked ? ` · <b style="color:var(--text);font-weight:500">${T.verdict}${ZH ? "：" : ": "}${a.verdict}</b>` : ""}</small>`;
          if (C)
            return `<tr style="${bg}">
              <td style="${cell}"><label style="display:flex;gap:.3rem;align-items:center;cursor:pointer;color:var(--text);font-size:.78rem">
                <input type="radio" name="arm-pick" value="${a.id}" ${sel ? "checked" : ""} aria-label="${T.pick}: ${NAMES[a.id] || a.id}" style="margin:0;accent-color:var(--accent-2)">
                <b style="font-family:var(--mono);font-weight:600">${NAMES[a.id] || a.id}</b></label></td>
              ${nums}
            </tr>
            <tr style="${bg}"><td colspan="${cols.length + 1}" style="padding:0 .2rem .45rem 1.45rem;border-bottom:1px solid var(--border)">${desc}</td></tr>`;
          return `<tr style="${bg}">
            <td style="${cell}">
              <label style="display:flex;gap:.4rem;align-items:flex-start;cursor:pointer;color:var(--text);font-size:.8rem">
                <input type="radio" name="arm-pick" value="${a.id}" ${sel ? "checked" : ""} aria-label="${T.pick}: ${NAMES[a.id] || a.id}" style="margin-top:.15rem;accent-color:var(--accent-2)">
                <span><b style="font-family:var(--mono);font-weight:600">${NAMES[a.id] || a.id}</b><br><small style="color:var(--muted)">${a.what}</small></span>
              </label>
            </td>
            ${nums}
            ${showV ? `<td style="${cell};white-space:nowrap">${a.verdict}</td>` : ""}
          </tr>`;
        })
        .join("");
      this.table.innerHTML = head + body;
      this.table.querySelectorAll("[data-sort]").forEach((b) =>
        b.addEventListener("click", () => {
          const k = b.dataset.sort;
          if (this.sort === k) this.dir = -this.dir;
          else {
            this.sort = k;
            this.dir = -GOOD[k]; // best first
          }
          this.render();
        })
      );
      this.table.querySelectorAll("input[type=radio]").forEach((inp) =>
        inp.addEventListener("change", () => {
          this.picked = inp.value;
          this.render();
        })
      );
      this.querySelector('[data-v="sorted"]').textContent = this.sort ? T.sorted(T.cols[this.sort], this.dir) : "";

      const ans = this.querySelector('[data-v="answer"]');
      if (!this.picked) {
        ans.innerHTML = "";
        return;
      }
      const p = ARMS.find((a) => a.id === this.picked);
      const c = ARMS[0];
      const box = (bg, label, a) =>
        `<div style="background:${bg};border-radius:6px;padding:.6rem .75rem;margin-top:.6rem">
          <small style="display:block;color:var(--muted);font-size:.75rem">${label}${ZH ? "：" : ": "}<b style="font-family:var(--mono);color:var(--text)">${NAMES[a.id] || a.id}</b></small>
          <span style="font-size:.86rem">${a.why}</span>
        </div>`;
      ans.innerHTML =
        box("var(--accent-2-soft)", T.you, p) +
        (p.id === "control" ? "" : box("var(--accent-soft)", T.mine, c)) +
        `<div style="margin-top:.6rem"><button type="button" class="button secondary" data-act="reset">${T.reset}</button></div>`;
      ans.querySelector('[data-act="reset"]').addEventListener("click", () => {
        this.picked = null;
        this.render();
      });
    }
  }
  customElements.define("arm-table", ArmTable);
})();
