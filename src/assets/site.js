// Theme, on-page TOC, reading bar, quiz, and per-browser progress. Everything degrades to plain HTML.
(() => {
  const KEY = "lrl.v1";
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  const save = (s) => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  };
  const state = Object.assign({ done: [], quiz: {}, last: null }, load());

  // Theme toggle
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("lrl.theme", root.dataset.theme); } catch {}
  });

  // Mark done days in any list
  const markLists = () => {
    document.querySelectorAll("[data-day-item]").forEach((li) => {
      li.classList.toggle("is-done", state.done.includes(Number(li.dataset.dayItem)));
    });
  };
  markLists();

  // Home: progress + resume
  const bar = document.querySelector("[data-progress-bar]");
  if (bar) {
    const total = document.querySelectorAll(".stage-days [data-day-item]").length;
    bar.style.setProperty("--p", `${(100 * state.done.length) / Math.max(total, 1)}%`);
    const txt = document.querySelector("[data-progress-text]");
    txt.textContent = `${state.done.length}/${total} ${txt.dataset.doneWord}`;
    const link = document.querySelector("[data-resume-link]");
    if (state.last && link) {
      const base = document.body.dataset.base;
      link.href = `${base}day${String(state.last).padStart(2, "0")}/`;
      link.textContent = link.dataset.resumeLabel;
    }
  }

  // Day list: open beside the text on wide screens, collapsed above it on phones.
  const dayNav = document.querySelector("[data-day-nav]");
  if (dayNav && matchMedia("(min-width: 961px)").matches) dayNav.open = true;

  const article = document.querySelector("article.day");
  if (!article) return;
  const day = Number(article.dataset.day);
  state.last = day;
  save(state);

  // TOC from h2s
  const toc = document.querySelector("[data-toc]");
  const heads = [...article.querySelectorAll(".prose h2")];
  heads.forEach((h, i) => {
    if (!h.id) h.id = "s" + (i + 1);
    const a = document.createElement("a");
    a.href = "#" + h.id;
    a.textContent = h.textContent;
    toc.appendChild(a);
  });
  if (!heads.length) toc.remove();
  const tocLinks = toc ? [...toc.querySelectorAll("a")] : [];

  // Reading bar + active section
  const readBar = document.querySelector("[data-reading-bar]");
  const onScroll = () => {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1);
    if (readBar) readBar.style.width = `${Math.min(100, p * 100)}%`;
    let cur = 0;
    heads.forEach((hd, i) => { if (hd.getBoundingClientRect().top < 120) cur = i; });
    tocLinks.forEach((a, i) => a.classList.toggle("active", i === cur));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mark done
  const doneBtn = document.querySelector("[data-mark-done]");
  const paintDone = () => {
    if (!doneBtn) return;
    const isDone = state.done.includes(day);
    doneBtn.dataset.labelTodo ??= doneBtn.textContent;
    doneBtn.textContent = isDone ? doneBtn.dataset.labelDone : doneBtn.dataset.labelTodo;
    doneBtn.setAttribute("aria-pressed", String(isDone));
  };
  doneBtn?.addEventListener("click", () => {
    state.done = state.done.includes(day) ? state.done.filter((d) => d !== day) : [...state.done, day];
    save(state);
    paintDone();
    markLists();
  });
  paintDone();

  // Quiz
  const quiz = document.querySelector("[data-quiz]");
  quiz?.querySelector("[data-quiz-check]").addEventListener("click", () => {
    let right = 0;
    quiz.querySelectorAll(".quiz-q").forEach((q) => {
      const answer = q.dataset.answer;
      const picked = q.querySelector("input:checked");
      q.querySelectorAll(".quiz-choice").forEach((c) => c.classList.remove("is-right", "is-wrong"));
      if (!picked) return;
      const ok = picked.value === answer;
      if (ok) right++;
      picked.closest(".quiz-choice").classList.add(ok ? "is-right" : "is-wrong");
      q.querySelector(`input[value="${answer}"]`).closest(".quiz-choice").classList.add("is-right");
      const fb = q.querySelector(".quiz-feedback");
      const v = fb.querySelector(".quiz-verdict");
      v.textContent = ok ? v.dataset.correct : v.dataset.wrong;
      v.className = "quiz-verdict " + (ok ? "good" : "bad");
      fb.hidden = false;
    });
    const total = quiz.querySelectorAll(".quiz-q").length;
    state.quiz[day] = Math.max(state.quiz[day] || 0, right);
    save(state);
    quiz.querySelector(".quiz-done").hidden = right !== total;
  });
})();
