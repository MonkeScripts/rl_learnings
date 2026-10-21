const markdownIt = require("markdown-it");
const katex = require("@vscode/markdown-it-katex").default;
const container = require("markdown-it-container");

const LANGS = ["en", "zh"];

// Callout containers used in day pages:  ::: tip  /  ::: field  /  ::: warn
const CALLOUTS = {
  tip: { en: "Plain reading", zh: "说白了" },
  field: { en: "Field notes", zh: "实战笔记" },
  warn: { en: "Careful", zh: "注意" },
};

module.exports = function (eleventyConfig) {
  const md = markdownIt({ html: true, linkify: true, typographer: false }).use(katex, {
    throwOnError: true,
  });
  for (const [name, label] of Object.entries(CALLOUTS)) {
    md.use(container, name, {
      render(tokens, idx, _opts, env) {
        if (tokens[idx].nesting !== 1) return "</div></aside>\n";
        const lang = env.lang || env.page?.lang || "en";
        const custom = tokens[idx].info.trim().slice(name.length).trim();
        return `<aside class="callout callout-${name}"><div class="callout-label">${md.utils.escapeHtml(custom || label[lang] || label.en)}</div><div class="callout-body">\n`;
      },
    });
  }
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("md", (s) => (s ? md.render(String(s)) : ""));
  eleventyConfig.addFilter("mdInline", (s) => (s ? md.renderInline(String(s)) : ""));
  eleventyConfig.addFilter("findDay", (pages, n) => (pages || []).find((p) => p.data.day === n) || false);
  eleventyConfig.addFilter("pad2", (n) => String(n).padStart(2, "0"));

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "node_modules/katex/dist/katex.min.css": "assets/katex/katex.min.css" });
  eleventyConfig.addPassthroughCopy({ "node_modules/katex/dist/fonts": "assets/katex/fonts" });

  for (const lang of LANGS) {
    eleventyConfig.addCollection(`days_${lang}`, (api) =>
      api.getFilteredByGlob(`src/${lang}/days/*.md`).sort((a, b) => a.data.day - b.data.day)
    );
  }

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    pathPrefix: process.env.PATH_PREFIX ?? "/rl_learnings/",
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
};
