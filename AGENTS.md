# Writing and maintaining this site

Eleventy 3 site, deployed to GitHub Pages at `/rl_learnings/`. English lives at the root (`/day01/`), Chinese under `/zh/` (`/zh/day01/`).

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # Node lives here on the dev box
npm install
npm run serve      # http://localhost:8080/rl_learnings/
npm run build      # writes _site/
npm test
```

## Where things live

- `src/_data/course.js`: the stage and day sequence plus localised titles. A day appears in the nav from here; it gets a page only once `src/<lang>/days/dayNN.md` exists.
- `src/en/days/dayNN.md`, `src/zh/days/dayNN.md`: one Markdown file per day per language. The two files share the beats, numbers, equations and quiz, but the prose is written separately (see `STYLE.md` section 7).
- `src/_data/i18n.js`: UI strings.
- `src/_includes/`: layouts (`base.njk`, `home.njk`, `day.njk`).
- `src/assets/site.css`, `src/assets/site.js`: styling, progress, quiz, theme.
- `src/assets/widgets/<name>.js`: one custom element per interactive widget.
- `src/assets/img/dayNN/`: images used by a day.

## Day page format

```markdown
---
day: 1
minutes: 30
widgets: [gamma-horizon]          # loads src/assets/widgets/gamma-horizon.js
quiz:
  - kind: why                     # why | whatif | numbers  (STYLE.md quiz rules)
    q: "Question text (Markdown inline allowed)"
    choices: ["A", "B", "C", "D"]
    answer: 2                     # 0-based index
    explain: "2-4 sentences in the story voice, ending with which beat it came from."
---

**Goal:** one line.

## Where we left off
## The picture
## Step by step
### Beat titles...
## Pitfalls
## Next
## Sources
```

- Do not write a `# Title`; the layout prints it from `course.js`.
- The quiz is rendered from front matter. Put the literal line `<!-- quiz -->` where it should appear (after Pitfalls, before Next).
- Every `##` becomes an entry in the on-page table of contents.
- Math: `$...$` inline, `$$...$$` display. Rendered at build time with KaTeX, `throwOnError: true`, so a bad formula fails the build. Nunjucks is off in Markdown, so `{{` in LaTeX is safe.
- Callouts:
  ```markdown
  ::: tip
  One-line plain reading of the formula above.
  :::

  ::: field
  Field-notes register: when / when not / what goes wrong / evidence number.
  :::

  ::: warn
  ...
  :::
  ```
  `::: field Custom label` overrides the label.
- Widgets: raw HTML in the Markdown, e.g. `<gamma-horizon></gamma-horizon>`, plus the widget name in front matter `widgets:`.
- Images: `![alt](../assets/img/day01/loop.png)` from `/day01/`, and `../../assets/img/day01/loop.png` from `/zh/day01/`. Always relative, never `/rl_learnings/...`, so `PATH_PREFIX` keeps working.
- Links to other days: `../day02/` (same language).

## Widget contract

- Vanilla JS, no dependencies, one file, `customElements.define("<name>", class extends HTMLElement {...})`.
- Render into light DOM inside a `<div class="widget">` wrapper so site CSS applies. Use the site tokens: `--bg`, `--surface`, `--text`, `--muted`, `--border`, `--accent`, `--accent-2`, `--good`, `--bad`, `--mono`.
- Pick labels by `document.documentElement.lang.startsWith("zh")`.
- Drawing: inline SVG built in JS, using `currentColor` and CSS variables so light and dark both work. Must work at 360px width.
- Attributes for initial values (e.g. `<ppo-clip eps="0.2">`).
- `src/assets/widgets/ppo-clip.js` is the reference implementation.

## Embedding an existing artifact

When one of the user's artifacts (`~/rl-study-guide/artifacts/*.html`) already does the job and runs as static HTML (no `window.claude` calls, no sign-in), embed it instead of rebuilding it:

1. Copy it to `src/assets/embeds/<slug>.html`. It must keep working there: inline everything it needs, and only use external scripts it already pins.
2. In the day page:
   ```html
   <figure class="embed">
     <iframe src="../assets/embeds/<slug>.html" title="<what it shows>" loading="lazy" style="height:640px"></iframe>
     <figcaption>One line on what to look at. <a href="../assets/embeds/<slug>.html" target="_blank" rel="noopener">Open full page</a></figcaption>
   </figure>
   ```
   (`../../assets/...` from `/zh/`). Set the height to fit the content at 390px wide. If the artifact has an EN/ZH toggle, note it in the caption, or pass `?lang=zh` if it supports that.
3. Prefer a real widget when the artifact is a long report and the day needs only one chart from it.

## No labs

Days have no Lab section and the repo has no `labs/` folder. Hands-on work happens in the widgets. Do not tell the reader to run code ("in the lab", "run this script"); a result from a toy run can be quoted as a result.

## Voice

Follow `STYLE.md` (copied from the planning folder). Short version: every section picks up the crack the previous one left, the naive fix fails on the page before the math arrives, every equation gets a plain reading, real robot numbers beat general claims, and each day ends on the question the next day answers.
