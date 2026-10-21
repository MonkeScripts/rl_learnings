// Checks that run against the source tree (fast) and, if present, the built _site/.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const course = require("../src/_data/course.js");

const root = path.join(__dirname, "..");
const dayFile = (lang, n) => path.join(root, "src", lang, "days", `day${String(n).padStart(2, "0")}.md`);
const frontMatter = (file) => fs.readFileSync(file, "utf8").split(/^---$/m)[1] || "";

test("every stage day has a title in both languages", () => {
  const listed = course.stages.flatMap((s) => s.days);
  assert.deepStrictEqual(listed, [...listed].sort((a, b) => a - b), "days are ordered");
  for (const n of listed) {
    assert.ok(course.days[n]?.en && course.days[n]?.zh, `day ${n} titles`);
  }
});

test("day pages exist in pairs and share the quiz answers", () => {
  for (const n of Object.keys(course.days).map(Number)) {
    const en = fs.existsSync(dayFile("en", n));
    const zh = fs.existsSync(dayFile("zh", n));
    assert.strictEqual(en, zh, `day ${n}: en and zh must both exist or both be missing`);
    if (!en) continue;
    const answers = (f) => [...frontMatter(f).matchAll(/^\s*answer:\s*(\d+)/gm)].map((m) => m[1]);
    const a = answers(dayFile("en", n));
    assert.ok(a.length >= 6, `day ${n}: at least six quiz questions`);
    assert.deepStrictEqual(answers(dayFile("zh", n)), a, `day ${n}: same answer indices`);
    for (const lang of ["en", "zh"]) {
      const body = fs.readFileSync(dayFile(lang, n), "utf8");
      assert.ok(body.includes("<!-- quiz -->"), `day ${n} ${lang}: quiz marker`);
    }
  }
});

test("widgets referenced in front matter exist", () => {
  for (const lang of ["en", "zh"]) {
    const dir = path.join(root, "src", lang, "days");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const m = frontMatter(path.join(dir, f)).match(/^widgets:\s*\[(.*)\]/m);
      for (const w of (m?.[1] || "").split(",").map((s) => s.trim()).filter(Boolean)) {
        assert.ok(fs.existsSync(path.join(root, "src/assets/widgets", `${w}.js`)), `${lang}/${f}: widget ${w}`);
      }
    }
  }
});

test("built pages have no unresolved local links", { skip: !fs.existsSync(path.join(root, "_site")) }, () => {
  const site = path.join(root, "_site");
  const prefix = "/rl_learnings/";
  const html = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) html.push(p);
  });
  walk(site);
  const missing = [];
  for (const file of html) {
    const src = fs.readFileSync(file, "utf8");
    for (const [, url] of src.matchAll(/(?:href|src)="([^"#?]+)/g)) {
      if (/^(https?:|mailto:|data:)/.test(url)) continue;
      let target = url.startsWith(prefix)
        ? path.join(site, url.slice(prefix.length))
        : url.startsWith("/") ? null : path.resolve(path.dirname(file), url);
      if (target === null) { missing.push(`${path.relative(site, file)} -> ${url} (no path prefix)`); continue; }
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
      if (!fs.existsSync(target)) missing.push(`${path.relative(site, file)} -> ${url}`);
    }
  }
  assert.deepStrictEqual(missing, []);
});
