# Writing daily problems

Each problem is a bite-sized JavaScript exercise (10 to 45 minutes, never more than 60) that runs and is graded
in the browser. The audience is a design-minded full stack engineer preparing for interviews, so favor practical,
realistic framing ("the search box fires too many requests…") over abstract puzzles where it fits.

## File format

Problems live in `daily/problems/*.js`. Each file appends to a global array:

```js
(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "async-retry-backoff",          // kebab-case, unique, prefixed by its file's area
    title: "Retry with exponential backoff",
    track: "Async & data",              // Frontend | Backend | Async & data | CS fundamentals
    level: "Medium",                    // Easy | Medium | Hard
    minutes: 25,                        // honest estimate, <= 60
    tags: ["promises", "resilience"],
    prompt: `...`,                      // markdown subset, see below
    starter: `function retry(fn, options) {\n  // your code here\n}`,
    tests: `test("...", async () => { ... });`,
    hints: ["nudge", "approach", "nearly the answer"],
    solution: `...`,
    explanation: `...`,
  },
  { ... },
);
```

Write string fields as template literals. Inside them, escape any backtick as \` and any `${` as `\${`.
Escape backslashes in regexes or strings as `\\`.

## Markdown subset for prompt and explanation

Paragraphs separated by blank lines, `inline code`, **bold**, bullet lists with `- `, numbered lists with `1. `,
and fenced code blocks with triple backticks (escaped as \`\`\` inside the template literal). Nothing else.

The prompt states the task, the exact function signature(s), input and output shapes, and 1 to 3 examples in a code
block. Mention edge cases the tests check (empty input, ties, errors) so nothing is a trick.

## Starter

Signature(s) plus a `// your code here` comment, returning nothing. Declare every global the tests use
(functions with `function name()`, classes with `class Name {}`). The starter must fail at least one test quickly:
no infinite loops, no long waits.

## Tests

Plain JavaScript run after the user's code in a sandboxed browser iframe (full DOM available; `document.body` is
emptied before each test). Available globals:

- `test(name, fn)` where fn may be async. Each test times out after 3 seconds.
- `expect(x)` with `.toBe .toEqual .toBeTruthy .toBeFalsy .toBeNull .toBeUndefined .toBeGreaterThan
  .toBeGreaterThanOrEqual .toBeLessThan .toBeLessThanOrEqual .toBeCloseTo(n, digits) .toContain .toHaveLength
  .toMatch .toBeInstanceOf .toThrow(stringOrRegex)` and `.not.` versions. `toEqual` is deep equality.
- `sleep(ms)` and `await rejects(promiseOrFn, stringOrRegex?)`.

Rules:
- 5 to 10 tests per problem. Test names read as specs a person sees in the UI: "returns [] for an empty list".
- Deterministic and fast: the whole file should finish in well under 2 seconds. Use small real delays (5–50ms)
  for async work, or inject a clock/scheduler into the function under test.
- No network. Mock `fetch` or other services by passing a fake into the function, or define a local fake inside
  the test. Don't leave global state behind (restore anything you replace).
- Cover the main case, edge cases, and at least one case a naive solution gets wrong.

## Hints, solution, explanation

- `hints`: exactly 3, progressive. First a nudge about what to notice, then the approach, then nearly the answer.
- `solution`: clean, idiomatic modern JavaScript a strong candidate would write in an interview. Short comments only
  where a step is not obvious.
- `explanation`: 2 to 5 short paragraphs. Why the approach works, time and space complexity where relevant, the
  common mistakes, and one follow-up an interviewer might ask.

## Check your work

Run `node tools/validate.js daily/problems/<your-file>.js`. It checks the schema, that the solution passes every
test, and that the starter fails at least one. Fix everything it reports.
