# Code Review Drills

Interactive code review practice. Each exercise is a realistic pull request with planted issues.
Click a line number to comment, choose a category, explain the problem, then submit to be graded.

## Files
- `index.html`: the app (page markup, styles, grader). Written as an artifact page body, so add
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  at the top before hosting on GitHub Pages.
- `exercises.js`: the exercise bank and answer keys. Add exercises here; nothing else needs to change.

## Adding an exercise
Each issue points at its line(s) with `at`, a list of substrings that must each match exactly one line of `code`.
`kw` lists words that show the reviewer named the real cause.

Scoring per issue: half credit for a comment on the right line (or the next one), a quarter for a matching
category, a quarter for naming the cause. Blockers weigh 3, majors 2, nits 1.

Check anchors after editing:

    node -e 'global.window={};require("./exercises.js");for(const e of window.EXERCISES){const l=e.code.replace(/^\n/,"").split("\n");for(const i of e.issues)for(const a of i.at){const m=l.filter(x=>x.includes(a)).length;if(m!==1)console.log(e.id,a,m)}}'
