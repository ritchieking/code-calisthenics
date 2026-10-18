#!/usr/bin/env node
// Checks every daily problem: schema, solution passes all tests, starter fails at least one.
// Usage: node tools/validate.js [problem-file.js ...]   (defaults to all of daily/problems/)
// Needs Playwright with a Chromium build (npm i -g playwright; npx playwright install chromium).
const fs = require("fs");
const path = require("path");
let chromium;
try { chromium = require("playwright").chromium; } catch (e) {
  chromium = require(path.join(require("child_process").execSync("npm root -g").toString().trim(), "playwright")).chromium;
}

const root = path.join(__dirname, "..", "daily");
const harness = fs.readFileSync(path.join(root, "harness.js"), "utf8");
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(path.join(root, "problems")).filter((f) => f.endsWith(".js")).sort().map((f) => path.join(root, "problems", f));

global.window = { PROBLEMS: [] };
for (const f of files) require(path.resolve(f));
const problems = window.PROBLEMS;

const TRACKS = ["Frontend", "Backend", "Async & data", "CS fundamentals"];
const LEVELS = ["Easy", "Medium", "Hard"];
const problemsWithErrors = [];
const ids = new Set();
for (const p of problems) {
  const errs = [];
  for (const k of ["id", "title", "track", "level", "minutes", "prompt", "starter", "tests", "solution", "explanation"]) if (!p[k]) errs.push("missing " + k);
  if (!Array.isArray(p.hints) || p.hints.length < 2) errs.push("needs 2+ hints");
  if (!TRACKS.includes(p.track)) errs.push("bad track " + p.track);
  if (!LEVELS.includes(p.level)) errs.push("bad level " + p.level);
  if (p.minutes > 60) errs.push("minutes > 60");
  if (ids.has(p.id)) errs.push("duplicate id");
  ids.add(p.id);
  if (errs.length) problemsWithErrors.push([p.id, errs]);
}

function page(code, tests) {
  const esc = (s) => s.replace(/<\/script/gi, "<\\/script");
  return "<!doctype html><html><head><meta charset=utf-8></head><body><script>" + esc(harness) + "</script><script>" +
    esc(code) + "\n;\n" + esc(tests) + "\n;\nwindow.__runTests();</script></body></html>";
}

async function run(browser, code, tests) {
  // One context per run: concurrent exposeFunction calls in a shared context can drop reports.
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  try {
    let resolve;
    const done = new Promise((r) => (resolve = r));
    await pg.exposeFunction("__report", (msg) => resolve(msg));
    // Serve from http://localhost so the page is a secure context (crypto.subtle etc.), like the real https site.
    const html = page(code, tests);
    await pg.route("http://localhost/**", (r) => r.fulfill({ contentType: "text/html", body: html }));
    await pg.goto("http://localhost/");
    return await Promise.race([done, new Promise((r) => setTimeout(() => r({ type: "timeout" }), 60000))]);
  } finally { await ctx.close(); }
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const failures = [];
  let i = 0;
  async function worker() {
    while (i < problems.length) {
      const p = problems[i++];
      const sol = await run(browser, p.solution, p.tests);
      if (sol.type !== "results" || !sol.results.length || sol.results.some((r) => !r.pass)) {
        failures.push([p.id, "solution", sol.type === "results" ? sol.results.filter((r) => !r.pass).map((r) => r.name + ": " + r.message) : sol]);
      }
      const st = await run(browser, p.starter, p.tests);
      if (st.type === "results" && st.results.every((r) => r.pass)) failures.push([p.id, "starter passes every test"]);
      if (st.type === "timeout") failures.push([p.id, "starter timed out (make it fail fast)"]);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  await browser.close();
  for (const [id, e] of problemsWithErrors) console.log("SCHEMA", id, e.join("; "));
  for (const f of failures) console.log("FAIL", f[0], f[1], f[2] ? JSON.stringify(f[2]).slice(0, 800) : "");
  const counts = {};
  problems.forEach((p) => (counts[p.track] = (counts[p.track] || 0) + 1));
  console.log(problems.length + " problems", JSON.stringify(counts), problemsWithErrors.length + failures.length ? "— PROBLEMS FOUND" : "— all good");
  process.exit(problemsWithErrors.length + failures.length ? 1 : 0);
})();
