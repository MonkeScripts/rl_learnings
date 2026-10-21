// Shared directory data for src/<lang>/days/. Each day page only needs `day:` in its front matter.
const course = require("../_data/course.js");

module.exports = (lang) => ({
  layout: "day.njk",
  tags: [],
  eleventyComputed: {
    title: (data) => course.days[data.day][lang],
    stageInfo: (data) => course.stages.find((s) => s.days.includes(data.day)),
    permalink: (data) => `${lang === "en" ? "" : lang + "/"}day${String(data.day).padStart(2, "0")}/`,
  },
});
