# Code Calisthenics

Daily practice for full stack and design engineering interviews. A static site with no build server: open it on
GitHub Pages and everything runs in the browser. Progress is stored in each browser's localStorage.

- `daily/`: 120 bite-sized JavaScript problems, one per day for four months. Each runs real tests in a sandboxed
  iframe and has three hints plus a reference solution with an explanation. Tracks: CS fundamentals, Async & data,
  Frontend, Backend. The calendar spreads the tracks evenly and ramps from Easy to Hard.
- `review/`: Code Review Drills. Realistic pull requests with planted issues, graded against an answer key.

## Working on problems

Problems live in `daily/problems/*.js`. See `tools/AUTHORING.md` for the format.

    node tools/validate.js        # schema check, every solution passes, every starter fails (needs Playwright + Chromium)
    node tools/bundle.js          # rebuild daily/problems.js, the file the app loads

To preview locally, serve the repo root (the app fetches files, so `file://` won't work):

    python3 -m http.server 8000   # then open http://localhost:8000/

CodeMirror 5 is vendored in `daily/vendor/codemirror` (MIT).
