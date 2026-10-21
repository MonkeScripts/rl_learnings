// Days listed in course.js that have no Markdown page yet, per language.
// Each gets a "coming soon" placeholder so links written ahead of time never 404.
const fs = require("node:fs");
const path = require("node:path");
const course = require("./course.js");

module.exports = Object.fromEntries(
  ["en", "zh"].map((lang) => [
    lang,
    Object.keys(course.days)
      .map(Number)
      .filter((n) => !fs.existsSync(path.join(__dirname, "..", lang, "days", `day${String(n).padStart(2, "0")}.md`))),
  ])
);
