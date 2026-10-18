(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "async-promisify",
    title: "Promisify a callback API",
    track: "Async & data",
    level: "Easy",
    minutes: 15,
    tags: ["promises", "callbacks"],
    prompt: `Your upload service still depends on an old library that uses Node-style callbacks: the last argument is a function called as \`callback(error, value)\`. You want to \`await\` it instead.

Write \`promisify(fn)\`. It returns a new function that, when called with some arguments, calls \`fn\` with those arguments plus a callback, and returns a promise that:

- resolves with \`value\` when the callback receives a falsy \`error\`
- rejects with \`error\` when it is truthy
- rejects if \`fn\` throws synchronously

The returned function must forward \`this\` to \`fn\`, so promisified methods keep working. The callback may be called synchronously or later.

\`\`\`js
function readSize(path, callback) {
  setTimeout(() => callback(null, path.length * 100), 10);
}
const readSizeAsync = promisify(readSize);
await readSizeAsync("a.png"); // 500
\`\`\``,
    starter: `function promisify(fn) {
  // your code here
}`,
    tests: `function addLater(a, b, cb) { setTimeout(() => cb(null, a + b), 5); }

test("returns a function that returns a promise", () => {
  const add = promisify(addLater);
  expect(typeof add).toBe("function");
  expect(add(1, 2)).toBeInstanceOf(Promise);
});

test("resolves with the callback's value", async () => {
  const add = promisify(addLater);
  expect(await add(2, 3)).toBe(5);
});

test("rejects with the callback's error", async () => {
  const save = promisify((name, cb) => setTimeout(() => cb(new Error("disk full")), 5));
  await rejects(save("a.txt"), "disk full");
});

test("works when the callback is called synchronously", async () => {
  const echo = promisify((x, cb) => cb(null, x));
  expect(await echo("now")).toBe("now");
});

test("treats a null error with no value as success", async () => {
  const done = promisify((cb) => cb(null));
  expect(await done()).toBeUndefined();
});

test("rejects when fn throws synchronously", async () => {
  const broken = promisify(() => { throw new Error("bad config"); });
  await rejects(broken(), "bad config");
});

test("forwards this so methods still work", async () => {
  const client = { base: 10 };
  client.read = promisify(function (x, cb) { cb(null, this.base + x); });
  expect(await client.read(5)).toBe(15);
});`,
    hints: [
      "The returned function needs to collect its arguments and build a `new Promise` that `fn` can settle.",
      "Inside the executor, call `fn` with the original arguments followed by your own `(error, value)` callback that calls `reject` or `resolve`.",
      "Return a regular `function (...args)` (not an arrow) so you can use `fn.call(this, ...args, callback)`; a throw inside the executor already rejects the promise.",
    ],
    solution: `function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      // A synchronous throw inside the executor rejects the promise for us.
      fn.call(this, ...args, (error, value) => {
        if (error) reject(error);
        else resolve(value);
      });
    });
  };
}`,
    explanation: `The promise executor runs synchronously, so we can call \`fn\` right there and hand it a callback that settles the promise. Because the callback closes over \`resolve\` and \`reject\`, it does not matter whether \`fn\` calls it immediately or seconds later.

Two details matter. First, the wrapper must be a regular \`function\` so it receives the caller's \`this\`, and the arrow functions inside capture it, which lets \`fn.call(this, ...)\` work for methods. Second, if \`fn\` throws before calling back, the \`Promise\` constructor catches the throw and rejects, so no try/catch is needed.

A common mistake is checking \`error !== null\` instead of truthiness, which breaks APIs that pass \`undefined\` on success. Another is resolving with \`arguments\` and losing the single-value shape.

Follow-up: how would you support callbacks that pass several success values, like \`(err, bytesRead, buffer)\`? (Resolve with an array, or let the caller opt in with a flag, as Node's \`util.promisify.custom\` does.)`,
  },

  {
    id: "async-with-timeout",
    title: "Give up on slow requests",
    track: "Async & data",
    level: "Easy",
    minutes: 15,
    tags: ["promises", "timeouts"],
    prompt: `A dashboard tile calls a reporting API that sometimes hangs for a minute. You'd rather show an error after a few seconds.

Write \`withTimeout(promise, ms)\`, which returns a promise that settles the same way as \`promise\` if that happens within \`ms\` milliseconds. Otherwise it rejects with a \`TimeoutError\`.

Also finish the \`TimeoutError\` class:

- it extends \`Error\`
- its \`name\` is \`"TimeoutError"\`
- its message is \`"Timed out after <ms>ms"\`, for example \`"Timed out after 500ms"\`

\`withTimeout\` should accept a plain value as well as a promise, and clear its timer once the input settles so no stray timers are left behind.

\`\`\`js
await withTimeout(fetchReport(), 5000); // the report, if it arrives in time
await withTimeout(neverResolves, 50);   // throws TimeoutError: Timed out after 50ms
\`\`\``,
    starter: `class TimeoutError extends Error {
  // your code here
}

function withTimeout(promise, ms) {
  // your code here
}`,
    tests: `const later = (value, ms) => new Promise((r) => setTimeout(() => r(value), ms));

test("resolves with the value when the promise settles in time", async () => {
  expect(await withTimeout(later("ok", 5), 50)).toBe("ok");
});

test("rejects with a TimeoutError when the promise is too slow", async () => {
  const err = await rejects(withTimeout(later("late", 80), 10));
  expect(err).toBeInstanceOf(TimeoutError);
});

test("TimeoutError is a real Error named TimeoutError", async () => {
  const err = await rejects(withTimeout(later("late", 80), 5));
  expect(err).toBeInstanceOf(Error);
  expect(err.name).toBe("TimeoutError");
});

test("the message says how long it waited", async () => {
  await rejects(withTimeout(later(1, 80), 7), "Timed out after 7ms");
});

test("passes through the original rejection if it comes first", async () => {
  const failing = new Promise((_, rej) => setTimeout(() => rej(new Error("503 from API")), 5));
  await rejects(withTimeout(failing, 50), "503 from API");
});

test("rejects without waiting for the slow promise", async () => {
  const start = Date.now();
  await rejects(withTimeout(later(1, 300), 10));
  expect(Date.now() - start).toBeLessThan(200);
});

test("accepts a plain value", async () => {
  expect(await withTimeout(42, 20)).toBe(42);
});

test("clears its timer once the promise wins", async () => {
  const realSet = window.setTimeout, realClear = window.clearTimeout;
  const live = new Set();
  window.setTimeout = (fn, ms) => { const id = realSet(() => { live.delete(id); fn(); }, ms); live.add(id); return id; };
  window.clearTimeout = (id) => { live.delete(id); realClear(id); };
  try {
    await withTimeout(Promise.resolve("fast"), 1000);
    await Promise.resolve();
    expect(live.size).toBe(0);
  } finally {
    window.setTimeout = realSet;
    window.clearTimeout = realClear;
  }
});`,
    hints: [
      "You need two things to compete: the original promise and a promise that rejects after `ms`.",
      "`Promise.race` settles with whichever finishes first. Build the losing side with `setTimeout(() => reject(new TimeoutError(ms)), ms)`.",
      "Keep the timer id in a variable and call `clearTimeout` in a `.finally()` on the race. In the class, call `super(message)` and set `this.name`.",
    ],
    solution: `class TimeoutError extends Error {
  constructor(ms) {
    super("Timed out after " + ms + "ms");
    this.name = "TimeoutError";
  }
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}`,
    explanation: `\`Promise.race\` settles with the first input to settle, fulfilled or rejected. Racing the real promise against a timer that rejects gives exactly the behavior we want, and because \`race\` wraps its inputs with \`Promise.resolve\`, plain values work too.

The \`.finally\` step is what separates a careful answer from a quick one. Without it, every successful call leaves a timer pending, which in Node can keep the process alive and in tests can trigger work after the test ends.

Note that this does not stop the underlying work: the slow request keeps running, we just stop waiting. Giving \`TimeoutError\` its own class and \`name\` lets callers handle timeouts differently from other failures with \`instanceof\`.

Follow-up: how would you actually cancel the slow request? (Pass an \`AbortSignal\` into the work and abort it when the timer fires, or use \`AbortSignal.timeout(ms)\`.)`,
  },

  {
    id: "async-promise-all",
    title: "Implement Promise.all",
    track: "Async & data",
    level: "Easy",
    minutes: 20,
    tags: ["promises", "fundamentals"],
    prompt: `A profile page loads the user, their teams, and their notifications in parallel and renders once all three arrive. Rebuild the primitive that makes that work.

Write \`promiseAll(iterable)\` that behaves like \`Promise.all\`, without using \`Promise.all\` itself:

- returns a promise for an array of results **in input order**, regardless of which finishes first
- plain (non-promise) values are passed through as results
- an empty input resolves to \`[]\`
- rejects with the reason of the **first** input to reject, without waiting for the others
- accepts any iterable, not just arrays

\`\`\`js
await promiseAll([fetchUser(), fetchTeams(), 3]); // [user, teams, 3]
await promiseAll([]);                              // []
\`\`\``,
    starter: `function promiseAll(iterable) {
  // your code here
}`,
    tests: `const later = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const failLater = (msg, ms) => new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms));
function noBuiltin(fn) {
  return async () => {
    const orig = Promise.all;
    Promise.all = () => { throw new Error("Implement it without Promise.all"); };
    try { await fn(); } finally { Promise.all = orig; }
  };
}

test("resolves with values in input order, not finish order", noBuiltin(async () => {
  expect(await promiseAll([later("a", 30), later("b", 5), later("c", 15)])).toEqual(["a", "b", "c"]);
}));

test("resolves [] for an empty list", noBuiltin(async () => {
  expect(await promiseAll([])).toEqual([]);
}));

test("passes plain values through", noBuiltin(async () => {
  expect(await promiseAll([1, later(2, 5), "three"])).toEqual([1, 2, "three"]);
}));

test("rejects with the first rejection", noBuiltin(async () => {
  await rejects(promiseAll([later(1, 20), failLater("teams failed", 5), failLater("second", 10)]), "teams failed");
}));

test("rejects without waiting for slower inputs", noBuiltin(async () => {
  const start = Date.now();
  await rejects(promiseAll([later(1, 300), failLater("boom", 5)]), "boom");
  expect(Date.now() - start).toBeLessThan(200);
}));

test("runs inputs concurrently", noBuiltin(async () => {
  const start = Date.now();
  await promiseAll([later(1, 40), later(2, 40), later(3, 40)]);
  expect(Date.now() - start).toBeLessThan(100);
}));

test("accepts any iterable, such as a Set", noBuiltin(async () => {
  expect(await promiseAll(new Set([later("x", 5), "y"]))).toEqual(["x", "y"]);
}));`,
    hints: [
      "You need to know when the *last* input finishes, and you need to put each result in its own slot.",
      "Turn the iterable into an array, keep a `results` array and a `remaining` counter, and subscribe to each item with `Promise.resolve(item).then(...)`.",
      "In each fulfillment handler store `results[i] = value` and resolve when `--remaining === 0`; pass `reject` directly as the rejection handler. Handle the empty case up front.",
    ],
    solution: `function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;
        if (--remaining === 0) resolve(results);
      }, reject);
    });
  });
}`,
    explanation: `Each input gets a handler that writes into a fixed index, which is how order is preserved even though completion order is random. A counter, not \`results.length\`, tells us when everything is done, since writing to index 2 first makes the array length 3 immediately.

Rejection is simple because a promise can only settle once: passing \`reject\` to every input means the first failure wins and later calls are ignored. \`Promise.resolve(item)\` normalizes plain values and thenables.

The work is O(n) time and space. Common mistakes: awaiting items one by one in a loop (still correct results but serial waiting on rejections and confusing semantics), pushing results in completion order, and forgetting that an empty input must resolve, not hang.

Follow-up: what does \`Promise.all\` do with the other promises after one rejects? (Nothing. They keep running, and their results are discarded. Cancellation needs \`AbortController\`.)`,
  },

  {
    id: "async-promise-all-settled",
    title: "Implement Promise.allSettled",
    track: "Async & data",
    level: "Easy",
    minutes: 15,
    tags: ["promises", "fundamentals"],
    prompt: `A bulk image upload sends twenty files at once. You want a summary of which succeeded and which failed, rather than bailing out on the first error.

Write \`promiseAllSettled(iterable)\` that behaves like \`Promise.allSettled\`, without using it:

- waits for every input to settle and **never rejects**
- resolves to an array in input order, with one object per input:
  - \`{ status: "fulfilled", value }\` or
  - \`{ status: "rejected", reason }\`
- plain values count as fulfilled
- an empty input resolves to \`[]\`

\`\`\`js
await promiseAllSettled([upload("a.png"), Promise.reject(new Error("too big")), 7]);
// [
//   { status: "fulfilled", value: "a.png uploaded" },
//   { status: "rejected", reason: Error("too big") },
//   { status: "fulfilled", value: 7 },
// ]
\`\`\``,
    starter: `function promiseAllSettled(iterable) {
  // your code here
}`,
    tests: `const later = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const failLater = (msg, ms) => new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms));
function noBuiltin(fn) {
  return async () => {
    const orig = Promise.allSettled;
    Promise.allSettled = () => { throw new Error("Implement it without Promise.allSettled"); };
    try { await fn(); } finally { Promise.allSettled = orig; }
  };
}

test("reports each fulfilled value", noBuiltin(async () => {
  expect(await promiseAllSettled([later("a", 5), later("b", 10)])).toEqual([
    { status: "fulfilled", value: "a" },
    { status: "fulfilled", value: "b" },
  ]);
}));

test("reports rejections instead of rejecting", noBuiltin(async () => {
  const out = await promiseAllSettled([failLater("too big", 5), later("ok", 10)]);
  expect(out[0].status).toBe("rejected");
  expect(out[0].reason.message).toBe("too big");
  expect(out[1]).toEqual({ status: "fulfilled", value: "ok" });
}));

test("keeps input order, not finish order", noBuiltin(async () => {
  const out = await promiseAllSettled([later(1, 30), failLater("x", 5), later(3, 15)]);
  expect(out.map((r) => r.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
  expect(out[2].value).toBe(3);
}));

test("waits for slow inputs even after a rejection", noBuiltin(async () => {
  const out = await promiseAllSettled([failLater("fast fail", 2), later("slow", 40)]);
  expect(out[1]).toEqual({ status: "fulfilled", value: "slow" });
}));

test("treats plain values as fulfilled", noBuiltin(async () => {
  expect(await promiseAllSettled([7, "x"])).toEqual([
    { status: "fulfilled", value: 7 },
    { status: "fulfilled", value: "x" },
  ]);
}));

test("resolves [] for an empty list", noBuiltin(async () => {
  expect(await promiseAllSettled([])).toEqual([]);
}));

test("accepts any iterable", noBuiltin(async () => {
  const out = await promiseAllSettled(new Set([later("s", 5)]));
  expect(out).toEqual([{ status: "fulfilled", value: "s" }]);
}));`,
    hints: [
      "This is `Promise.all` where every input is turned into something that cannot fail.",
      "Use a fixed-size results array and a remaining counter. Attach both a fulfillment and a rejection handler to `Promise.resolve(item)`.",
      "Each handler writes `{ status: \"fulfilled\", value }` or `{ status: \"rejected\", reason }` into `results[i]`, decrements the counter, and resolves the outer promise when it reaches zero.",
    ],
    solution: `function promiseAllSettled(iterable) {
  return new Promise((resolve) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    const settle = (i, outcome) => {
      results[i] = outcome;
      if (--remaining === 0) resolve(results);
    };
    items.forEach((item, i) => {
      Promise.resolve(item).then(
        (value) => settle(i, { status: "fulfilled", value }),
        (reason) => settle(i, { status: "rejected", reason }),
      );
    });
  });
}`,
    explanation: `The structure mirrors \`Promise.all\`: one slot per input and a counter of unsettled inputs. The difference is that both outcomes are treated the same way, so the outer promise only ever resolves.

Another neat way to write it is to map every input to \`Promise.resolve(p).then(onOk, onErr)\`, which turns each one into a promise that always fulfills, and then hand that list to your own \`promiseAll\`. Both are O(n).

Mistakes to avoid: using \`.catch\` after \`.then\` in a way that also catches errors thrown by your own fulfillment handler, and forgetting the empty input case, which would hang forever.

Follow-up: when would you choose \`allSettled\` over \`all\` in a UI? (Independent widgets or batch operations where partial success is still useful, like uploading many files and showing a per-file status.)`,
  },

  {
    id: "async-promise-any",
    title: "Implement Promise.any",
    track: "Async & data",
    level: "Medium",
    minutes: 20,
    tags: ["promises", "fundamentals"],
    prompt: `Your app can load map tiles from three CDN mirrors. You want whichever mirror succeeds first, and an error only if every mirror fails.

Write \`promiseAny(iterable)\` that behaves like \`Promise.any\`, without using it:

- resolves with the value of the **first input to fulfill**, ignoring rejections that happen before it
- if every input rejects, rejects with an \`AggregateError\` whose \`errors\` array holds the reasons **in input order** (not rejection order), with the message \`"All promises were rejected"\`
- an empty input rejects right away with an \`AggregateError\` whose \`errors\` is \`[]\`
- plain values count as fulfilled

\`\`\`js
await promiseAny([mirrorA(), mirrorB(), mirrorC()]); // first tile that loads
await promiseAny([Promise.reject(new Error("a")), Promise.reject(new Error("b"))]);
// AggregateError, errors: [Error("a"), Error("b")]
\`\`\``,
    starter: `function promiseAny(iterable) {
  // your code here
}`,
    tests: `const later = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const failLater = (msg, ms) => new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms));
function noBuiltin(fn) {
  return async () => {
    const orig = Promise.any;
    Promise.any = () => { throw new Error("Implement it without Promise.any"); };
    try { await fn(); } finally { Promise.any = orig; }
  };
}

test("resolves with the first value to fulfill", noBuiltin(async () => {
  expect(await promiseAny([later("slow", 30), later("fast", 5)])).toBe("fast");
}));

test("ignores rejections that happen before a success", noBuiltin(async () => {
  expect(await promiseAny([failLater("mirror A down", 2), later("mirror B", 15)])).toBe("mirror B");
}));

test("rejects with an AggregateError when everything fails", noBuiltin(async () => {
  const err = await rejects(promiseAny([failLater("a", 5), failLater("b", 10)]));
  expect(err).toBeInstanceOf(AggregateError);
  expect(err.message).toBe("All promises were rejected");
}));

test("lists errors in input order, not rejection order", noBuiltin(async () => {
  const err = await rejects(promiseAny([failLater("first input", 25), failLater("second input", 5)]));
  expect(err.errors.map((e) => e.message)).toEqual(["first input", "second input"]);
}));

test("rejects with an empty AggregateError for an empty list", noBuiltin(async () => {
  const err = await rejects(promiseAny([]));
  expect(err).toBeInstanceOf(AggregateError);
  expect(err.errors).toEqual([]);
}));

test("treats plain values as fulfilled", noBuiltin(async () => {
  expect(await promiseAny([failLater("x", 5), "cached tile"])).toBe("cached tile");
}));

test("resolves as soon as one succeeds, without waiting for the rest", noBuiltin(async () => {
  const start = Date.now();
  expect(await promiseAny([later("quick", 5), later("slow", 300)])).toBe("quick");
  expect(Date.now() - start).toBeLessThan(200);
}));`,
    hints: [
      "This is the mirror image of `Promise.all`: successes short-circuit, and failures are what you count.",
      "Pass `resolve` straight in as the fulfillment handler. For rejections, store the reason at its index and decrement a counter.",
      "When the counter hits zero, `reject(new AggregateError(errors, \"All promises were rejected\"))`. Check for an empty input first so it rejects instead of hanging.",
    ],
    solution: `function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const errors = new Array(items.length);
    let remaining = items.length;
    const fail = () => reject(new AggregateError(errors, "All promises were rejected"));
    if (remaining === 0) return fail();
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (reason) => {
        errors[i] = reason;
        if (--remaining === 0) fail();
      });
    });
  });
}`,
    explanation: `\`Promise.any\` is \`Promise.all\` with the roles of success and failure swapped. Any fulfillment resolves the outer promise, and since a promise can only settle once, later fulfillments are ignored for free.

Rejections are collected by index so the \`errors\` array matches input order, and the counter tells us when the last one arrives. An empty input is a special case: with nothing to wait for, there will never be a success, so it rejects immediately.

The most common bug is rejecting on the first failure (copying the \`all\` pattern too closely). Another is collecting errors with \`push\`, which records them in rejection order. Time and space are O(n).

Follow-up: how is \`any\` different from \`race\`? (\`race\` settles with the first input to settle either way, so one quick failure ends it. \`any\` only gives up when every input has failed.)`,
  },

  {
    id: "async-retry-backoff",
    title: "Retry with exponential backoff",
    track: "Async & data",
    level: "Medium",
    minutes: 25,
    tags: ["promises", "resilience"],
    prompt: `The payments API returns the occasional 503. Hammering it again immediately makes things worse, so you want to retry with growing delays.

Write \`retry(fn, options)\` that calls \`fn(attempt)\` (attempt starts at \`0\`) and returns its result. If it rejects, wait and try again.

Options, all optional:

- \`retries\` (default \`3\`): how many retries after the first try, so at most \`retries + 1\` calls
- \`baseDelay\` (default \`100\`), \`factor\` (default \`2\`): the delay before retry number \`n\` (starting at 0) is \`baseDelay * factor ** n\`
- \`maxDelay\` (default \`Infinity\`): delays are capped at this value
- \`jitter\` (default \`d => d\`): every delay is passed through this function before waiting, so callers can add randomness
- \`shouldRetry\` (default \`() => true\`): called with the error; if it returns false, rethrow immediately
- \`sleep\` (default: a real \`setTimeout\` sleep): \`sleep(ms)\` returns a promise. Tests inject a fake one.

When attempts run out, reject with the **last** error.

\`\`\`js
await retry(() => chargeCard(order), { retries: 2, baseDelay: 200 });
// tries, waits 200ms, tries, waits 400ms, tries, then gives up
\`\`\``,
    starter: `async function retry(fn, options = {}) {
  // your code here
}`,
    tests: `function recorder() {
  const delays = [];
  return { delays, sleep: async (ms) => { delays.push(ms); } };
}
function flaky(failures, value = "ok") {
  let calls = 0;
  const fn = async () => {
    calls++;
    if (calls <= failures) throw new Error("fail " + calls);
    return value;
  };
  fn.calls = () => calls;
  return fn;
}

test("returns right away when the first try works", async () => {
  const r = recorder(), fn = flaky(0);
  expect(await retry(fn, { sleep: r.sleep })).toBe("ok");
  expect(fn.calls()).toBe(1);
  expect(r.delays).toEqual([]);
});

test("retries until it succeeds", async () => {
  const r = recorder(), fn = flaky(2);
  expect(await retry(fn, { sleep: r.sleep })).toBe("ok");
  expect(fn.calls()).toBe(3);
});

test("rejects with the last error after retries + 1 attempts", async () => {
  const r = recorder(), fn = flaky(10);
  await rejects(retry(fn, { retries: 2, sleep: r.sleep }), "fail 3");
  expect(fn.calls()).toBe(3);
});

test("doubles the delay each time by default", async () => {
  const r = recorder();
  await retry(flaky(3), { retries: 3, baseDelay: 100, sleep: r.sleep });
  expect(r.delays).toEqual([100, 200, 400]);
});

test("uses a custom factor and caps delays at maxDelay", async () => {
  const r = recorder();
  await retry(flaky(4), { retries: 4, baseDelay: 50, factor: 3, maxDelay: 1000, sleep: r.sleep });
  expect(r.delays).toEqual([50, 150, 450, 1000]);
});

test("passes each delay through the jitter function", async () => {
  const r = recorder();
  await retry(flaky(2), { baseDelay: 100, jitter: (d) => d + 7, sleep: r.sleep });
  expect(r.delays).toEqual([107, 207]);
});

test("stops immediately when shouldRetry returns false", async () => {
  const r = recorder();
  let calls = 0;
  const fn = async () => { calls++; throw new Error("400 Bad Request"); };
  await rejects(retry(fn, { sleep: r.sleep, shouldRetry: (e) => !e.message.startsWith("4") }), "400");
  expect(calls).toBe(1);
  expect(r.delays).toEqual([]);
});

test("passes the attempt number, starting at 0", async () => {
  const r = recorder(), seen = [];
  await retry(async (n) => { seen.push(n); if (n < 2) throw new Error("x"); return n; }, { sleep: r.sleep });
  expect(seen).toEqual([0, 1, 2]);
});

test("works with the default sleep when delays are tiny", async () => {
  expect(await retry(flaky(2), { baseDelay: 1 })).toBe("ok");
});`,
    hints: [
      "A loop is easier than recursion here: try, and if it fails, decide whether to wait and loop again.",
      "Use `for (let attempt = 0; ; attempt++)` with a try/catch around `await fn(attempt)`. In the catch, rethrow if `attempt >= retries` or `!shouldRetry(err)`.",
      "Otherwise compute `Math.min(maxDelay, baseDelay * factor ** attempt)`, then `await sleep(jitter(delay))`. Use destructuring with defaults for the options.",
    ],
    solution: `const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(fn, {
  retries = 3,
  baseDelay = 100,
  factor = 2,
  maxDelay = Infinity,
  jitter = (d) => d,
  shouldRetry = () => true,
  sleep = defaultSleep,
} = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      const delay = Math.min(maxDelay, baseDelay * factor ** attempt);
      await sleep(jitter(delay));
    }
  }
}`,
    explanation: `Each failed attempt computes its delay from the attempt number, so delays grow as 100, 200, 400 and so on, then flatten at \`maxDelay\`. The \`return await\` inside \`try\` is important: a bare \`return fn()\` would hand back the promise without the catch block ever seeing its rejection.

Jitter exists because many clients that failed together will otherwise retry together, producing synchronized waves of load (the "thundering herd"). A typical production jitter is "full jitter": \`d => Math.random() * d\`. Making it a parameter keeps the function testable.

Injecting \`sleep\` is the same idea: time is a dependency. Tests stay instant and deterministic, and you can assert on the exact delays instead of measuring wall-clock time.

Common mistakes: an off-by-one between "retries" and "attempts", rethrowing the first error instead of the last, and retrying errors that will never succeed, like a 400. Follow-up: how would you honor a \`Retry-After\` header from the server? (Let \`shouldRetry\` or a \`delayFor(err, attempt)\` option return a delay that overrides the computed one.)`,
  },

  {
    id: "async-map-concurrency",
    title: "Map with a concurrency limit",
    track: "Async & data",
    level: "Medium",
    minutes: 25,
    tags: ["promises", "concurrency"],
    prompt: `You need to generate thumbnails for 500 photos, but the image service allows only a few requests at a time. \`Promise.all(items.map(fn))\` would fire all 500 at once.

Write \`mapWithConcurrency(items, limit, fn)\`:

- calls \`fn(item, index)\` for each item, with **at most \`limit\` calls in flight** at any moment
- starts the next item as soon as **any** call finishes (a rolling pool, not fixed batches)
- resolves to an array of results **in input order**
- resolves to \`[]\` for an empty array without calling \`fn\`
- if any call rejects, rejects with that error and **starts no new items** (calls already in flight may finish)

\`\`\`js
const thumbs = await mapWithConcurrency(photos, 4, (photo) => makeThumb(photo.url));
// thumbs[i] belongs to photos[i]
\`\`\``,
    starter: `async function mapWithConcurrency(items, limit, fn) {
  // your code here
}`,
    tests: `const later = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));

test("preserves input order when items finish out of order", async () => {
  const out = await mapWithConcurrency([30, 5, 15, 1], 2, (ms) => later("done " + ms, ms));
  expect(out).toEqual(["done 30", "done 5", "done 15", "done 1"]);
});

test("never runs more than limit at once, and uses the full limit", async () => {
  let active = 0, peak = 0;
  await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async () => {
    active++; peak = Math.max(peak, active);
    await later(null, 5);
    active--;
  });
  expect(peak).toBe(3);
});

test("starts the next item as soon as any slot frees up", async () => {
  const log = [];
  await mapWithConcurrency([40, 5, 5, 5], 2, async (ms, i) => {
    log.push("start " + i);
    await later(null, ms);
    log.push("end " + i);
  });
  expect(log.indexOf("start 2")).toBeLessThan(log.indexOf("end 0"));
});

test("returns [] for an empty list without calling fn", async () => {
  let calls = 0;
  expect(await mapWithConcurrency([], 3, () => { calls++; })).toEqual([]);
  expect(calls).toBe(0);
});

test("works when the limit is larger than the list", async () => {
  expect(await mapWithConcurrency([1, 2], 10, async (x) => x * 2)).toEqual([2, 4]);
});

test("passes the index as the second argument", async () => {
  expect(await mapWithConcurrency(["a", "b", "c"], 2, async (x, i) => x + i)).toEqual(["a0", "b1", "c2"]);
});

test("rejects with the error from a failing call", async () => {
  await rejects(mapWithConcurrency([1, 2, 3], 2, async (x) => {
    if (x === 2) throw new Error("photo 2 is corrupt");
    return x;
  }), "photo 2 is corrupt");
});

test("starts no new items after a failure", async () => {
  const started = [];
  await rejects(mapWithConcurrency([0, 1, 2, 3, 4], 2, async (x) => {
    started.push(x);
    if (x === 0) { await later(null, 5); throw new Error("fail"); }
    await later(null, 30);
  }), "fail");
  await later(null, 60);
  expect(started).toEqual([0, 1]);
});`,
    hints: [
      "Think of `limit` workers, each pulling the next index from a shared counter until the list runs out.",
      "Write an async `worker()` that loops `while (next < items.length)`, grabs `const i = next++`, and stores `results[i] = await fn(items[i], i)`. Start `Math.min(limit, items.length)` workers and await them all.",
      "To stop after a failure, keep a `failed` flag: set it in a catch before rethrowing, and check it in the worker's loop condition.",
    ],
    solution: `async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  let failed = false;

  async function worker() {
    while (!failed && next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}`,
    explanation: `The worker-pool pattern starts \`limit\` loops that share one cursor. JavaScript runs one piece of code at a time, so \`next++\` needs no locking: each worker grabs a unique index synchronously before it awaits. Whenever a call finishes, that worker immediately pulls the next item, which gives the rolling behavior.

Writing into \`results[i]\` keeps input order. \`Promise.all\` over the workers rejects as soon as one worker throws, and the \`failed\` flag stops the other workers from picking up new items after their current call.

The common naive answer chunks the list into groups of \`limit\` and awaits each group, which leaves slots idle while the slowest item in a group finishes. Time is bounded by the work itself, and extra space is O(n) for results.

Follow-up: how would you support cancelling the whole job from the UI? (Pass an \`AbortSignal\`, check \`signal.aborted\` in the loop, and forward the signal into \`fn\`.)`,
  },

  {
    id: "async-debounce",
    title: "Debounce with cancel and flush",
    track: "Async & data",
    level: "Easy",
    minutes: 20,
    tags: ["timers", "events"],
    prompt: `An autosave field should save only after the user stops typing for a moment. You also want to cancel a pending save when they discard changes, and save immediately when they close the tab.

Write \`debounce(fn, wait)\` that returns a function \`debounced(...args)\`:

- each call restarts a \`wait\` ms timer; when it fires, \`fn\` runs once with the **latest** arguments and \`this\`
- \`debounced.cancel()\` drops any pending call
- \`debounced.flush()\` runs the pending call right away and returns \`fn\`'s result; with nothing pending it does nothing and returns \`undefined\`
- after a flush or cancel, the old timer must not fire

\`\`\`js
const save = debounce((text) => api.save(text), 300);
save("H"); save("He"); save("Hey");
// 300ms after the last call: api.save("Hey") runs once
save.flush(); // or: run it now
\`\`\``,
    starter: `function debounce(fn, wait) {
  // your code here
}`,
    tests: `test("calls fn once after a burst, with the last arguments", async () => {
  const calls = [];
  const d = debounce((x) => calls.push(x), 20);
  d("H"); d("He"); d("Hey");
  await sleep(50);
  expect(calls).toEqual(["Hey"]);
});

test("does not call fn right away", () => {
  let calls = 0;
  const d = debounce(() => calls++, 20);
  d();
  expect(calls).toBe(0);
  d.cancel();
});

test("each call restarts the timer", async () => {
  let calls = 0;
  const d = debounce(() => calls++, 40);
  d();
  await sleep(25);
  d();
  await sleep(25);
  expect(calls).toBe(0);
  await sleep(40);
  expect(calls).toBe(1);
});

test("cancel() drops the pending call", async () => {
  let calls = 0;
  const d = debounce(() => calls++, 15);
  d(); d.cancel();
  await sleep(40);
  expect(calls).toBe(0);
});

test("flush() runs the pending call now and returns its result", () => {
  const d = debounce((a, b) => a + b, 1000);
  d(1, 1); d(2, 3);
  expect(d.flush()).toBe(5);
});

test("flush() with nothing pending does nothing", () => {
  let calls = 0;
  const d = debounce(() => calls++, 10);
  expect(d.flush()).toBeUndefined();
  expect(calls).toBe(0);
});

test("the timer does not fire again after flush()", async () => {
  let calls = 0;
  const d = debounce(() => calls++, 15);
  d(); d.flush();
  await sleep(40);
  expect(calls).toBe(1);
});

test("keeps this from the latest call", async () => {
  let seen;
  const field = { name: "title", save: debounce(function () { seen = this.name; }, 10) };
  field.save();
  await sleep(30);
  expect(seen).toBe("title");
});

test("separate bursts each produce a call", async () => {
  const calls = [];
  const d = debounce((x) => calls.push(x), 10);
  d("a");
  await sleep(30);
  d("b");
  await sleep(30);
  expect(calls).toEqual(["a", "b"]);
});`,
    hints: [
      "You need to remember three things between calls: the timer id, the latest arguments, and the latest `this`.",
      "On every call, save the args and `this`, `clearTimeout` the old timer and start a new one. Return a regular `function` so `this` is available.",
      "Write one `invoke()` helper that clears the timer, resets the saved state, and returns `fn.apply(savedThis, savedArgs)`. The timer calls it, `flush` calls it only if a timer is pending, and `cancel` just clears everything.",
    ],
    solution: `function debounce(fn, wait) {
  let timer = null;
  let pendingArgs = null;
  let pendingThis = null;

  function invoke() {
    const args = pendingArgs, ctx = pendingThis;
    clearTimeout(timer);
    timer = pendingArgs = pendingThis = null;
    return fn.apply(ctx, args);
  }

  function debounced(...args) {
    pendingArgs = args;
    pendingThis = this;
    clearTimeout(timer);
    timer = setTimeout(invoke, wait);
  }

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = pendingArgs = pendingThis = null;
  };
  debounced.flush = () => (timer === null ? undefined : invoke());
  return debounced;
}`,
    explanation: `Debouncing collapses a burst of calls into one, fired \`wait\` ms after the burst ends. Clearing and restarting a single timer on every call does that, and keeping the latest arguments means the eventual call sees the final state of the input.

\`flush\` and \`cancel\` are where most implementations slip. Funneling every real invocation through one \`invoke()\` helper that also clears the timer guarantees a flushed call can't fire a second time. Using \`timer === null\` as "is anything pending?" keeps \`flush\` from calling \`fn\` with stale or missing arguments.

Each call is O(1). Typical bugs: using an arrow function for \`debounced\` (losing \`this\`), capturing the first call's arguments instead of the last, and forgetting to clear state after flushing.

Follow-up: add a \`leading\` option that fires on the first call of a burst. How do you avoid a second, trailing call when the burst was only one call long?`,
  },

  {
    id: "async-throttle",
    title: "Throttle with a trailing call",
    track: "Async & data",
    level: "Medium",
    minutes: 25,
    tags: ["timers", "events"],
    prompt: `A live cursor-sharing feature sends the mouse position over the network. Sending on every \`mousemove\` floods the socket, but you still want the final resting position to arrive.

Write \`throttle(fn, wait)\` that returns a function \`throttled(...args)\`:

- the first call runs \`fn\` **immediately** and starts a \`wait\` ms cooldown
- calls during the cooldown don't run; only the **latest** one is remembered
- when the cooldown ends, if a call was remembered, run it (the trailing call) and **start a new cooldown**
- if nothing was remembered, the cooldown simply ends, and the next call runs immediately again
- \`fn\` is called with the right arguments and \`this\`

\`\`\`js
const send = throttle((pos) => socket.send(pos), 100);
send(1); send(2); send(3);
// send(1) runs now; send(3) runs at ~100ms; send(2) never runs
\`\`\``,
    starter: `function throttle(fn, wait) {
  // your code here
}`,
    tests: `test("runs the first call immediately", () => {
  const calls = [];
  const t = throttle((x) => calls.push(x), 30);
  t("a");
  expect(calls).toEqual(["a"]);
});

test("ignores calls during the cooldown except the last one", async () => {
  const calls = [];
  const t = throttle((x) => calls.push(x), 30);
  t("a"); t("b"); t("c");
  expect(calls).toEqual(["a"]);
  await sleep(50);
  expect(calls).toEqual(["a", "c"]);
});

test("makes no trailing call when there was only one call", async () => {
  const calls = [];
  const t = throttle((x) => calls.push(x), 20);
  t("only");
  await sleep(50);
  expect(calls).toEqual(["only"]);
});

test("a trailing call starts a new cooldown", async () => {
  const calls = [];
  const t = throttle((x) => calls.push(x), 30);
  t("a"); t("b");
  await sleep(40);
  expect(calls).toEqual(["a", "b"]);
  t("c");
  expect(calls).toEqual(["a", "b"]);
  await sleep(45);
  expect(calls).toEqual(["a", "b", "c"]);
});

test("after a quiet period the next call runs immediately", async () => {
  const calls = [];
  const t = throttle((x) => calls.push(x), 20);
  t("a");
  await sleep(50);
  t("b");
  expect(calls).toEqual(["a", "b"]);
});

test("passes all arguments through", () => {
  let seen;
  const t = throttle((x, y) => { seen = [x, y]; }, 20);
  t(10, 20);
  expect(seen).toEqual([10, 20]);
});

test("keeps this for leading and trailing calls", async () => {
  const seen = [];
  const cursor = { id: "c1", move: throttle(function () { seen.push(this.id); }, 20) };
  cursor.move(); cursor.move();
  await sleep(40);
  expect(seen).toEqual(["c1", "c1"]);
});`,
    hints: [
      "Model it with two pieces of state: \"am I in a cooldown?\" (a timer) and \"what's the latest call I skipped?\".",
      "If no timer is running, call `fn` and start the cooldown timer. Otherwise just save the args and `this`.",
      "When the cooldown timer fires: if there are saved args, call `fn` with them, clear them, and start another cooldown; if not, set the timer back to `null`.",
    ],
    solution: `function throttle(fn, wait) {
  let timer = null;
  let pendingArgs = null;
  let pendingThis = null;

  function startCooldown() {
    timer = setTimeout(() => {
      if (pendingArgs) {
        const args = pendingArgs, ctx = pendingThis;
        pendingArgs = pendingThis = null;
        fn.apply(ctx, args);
        startCooldown(); // the trailing call opens a new window
      } else {
        timer = null;
      }
    }, wait);
  }

  return function throttled(...args) {
    if (timer === null) {
      fn.apply(this, args);
      startCooldown();
    } else {
      pendingArgs = args;
      pendingThis = this;
    }
  };
}`,
    explanation: `Throttling guarantees at most one call per \`wait\` window while still reacting instantly to the first event. The timer represents the cooldown: if it is running, we are inside a window and only record the latest call.

The trailing call is what makes the final state arrive, such as the last cursor position or the final scroll offset. The subtle rule is that the trailing call must itself start a new cooldown. Otherwise a call right after it would run immediately, and you'd get two calls a few milliseconds apart, breaking the rate guarantee.

Each call is O(1). Compared with debounce, throttle keeps a steady stream of updates during continuous activity, while debounce waits until activity stops. Typical bugs: firing the trailing call with the first skipped arguments instead of the last, and never resetting the timer, which blocks all future leading calls.

Follow-up: how would you add \`cancel()\`, and should it drop just the pending trailing call or also end the cooldown?`,
  },

  {
    id: "async-cancellable-fetch",
    title: "Cancellable requests with AbortController",
    track: "Async & data",
    level: "Easy",
    minutes: 15,
    tags: ["abortcontroller", "fetch"],
    prompt: `When a user leaves the search page, its in-flight requests should be cancelled rather than finishing in the background.

Write \`cancellableFetch(fetchFn, url, options)\` that returns \`{ promise, cancel }\`:

- it calls \`fetchFn(url, opts)\` once, where \`opts\` contains everything in \`options\` plus a \`signal\` from a fresh \`AbortController\`
- \`promise\` is whatever \`fetchFn\` returns
- \`cancel()\` aborts that controller. A well-behaved fetch then rejects with an error named \`"AbortError"\`
- calling \`cancel()\` after the request finished is harmless
- if \`options.signal\` is provided (for example, a page-wide signal), aborting it must also cancel this request. If it is already aborted, cancel right away

\`fetchFn\` has the same shape as \`fetch\`. The tests pass a fake that respects the signal.

\`\`\`js
const { promise, cancel } = cancellableFetch(fetch, "/api/search?q=sh", { method: "GET" });
onLeavePage(cancel);
const res = await promise; // rejects with AbortError if cancelled
\`\`\``,
    starter: `function cancellableFetch(fetchFn, url, options = {}) {
  // your code here
}`,
    tests: `function makeFetch(delay = 20) {
  const calls = [];
  const fakeFetch = (url, opts = {}) => {
    calls.push({ url, opts });
    return new Promise((resolve, reject) => {
      const abortError = () => new DOMException("The request was aborted", "AbortError");
      if (opts.signal && opts.signal.aborted) return reject(abortError());
      const t = setTimeout(() => resolve({ ok: true, url }), delay);
      if (opts.signal) opts.signal.addEventListener("abort", () => { clearTimeout(t); reject(abortError()); });
    });
  };
  return { fakeFetch, calls };
}

test("resolves with the response when not cancelled", async () => {
  const { fakeFetch } = makeFetch();
  const { promise } = cancellableFetch(fakeFetch, "/api/search?q=a");
  expect(await promise).toEqual({ ok: true, url: "/api/search?q=a" });
});

test("gives fetch the url, the other options, and a signal", () => {
  const { fakeFetch, calls } = makeFetch();
  const { promise, cancel } = cancellableFetch(fakeFetch, "/api/items", { method: "POST", body: "x" });
  promise.catch(() => {});
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe("/api/items");
  expect(calls[0].opts.method).toBe("POST");
  expect(calls[0].opts.body).toBe("x");
  expect(calls[0].opts.signal).toBeInstanceOf(AbortSignal);
  cancel();
});

test("cancel() rejects the promise with an AbortError", async () => {
  const { fakeFetch } = makeFetch();
  const { promise, cancel } = cancellableFetch(fakeFetch, "/slow");
  cancel();
  const err = await rejects(promise);
  expect(err.name).toBe("AbortError");
});

test("cancel() aborts the signal fetch received", () => {
  const { fakeFetch, calls } = makeFetch();
  const { promise, cancel } = cancellableFetch(fakeFetch, "/slow");
  promise.catch(() => {});
  expect(calls[0].opts.signal.aborted).toBe(false);
  cancel();
  expect(calls[0].opts.signal.aborted).toBe(true);
});

test("cancelling one request leaves another running", async () => {
  const { fakeFetch } = makeFetch();
  const a = cancellableFetch(fakeFetch, "/a");
  const b = cancellableFetch(fakeFetch, "/b");
  a.cancel();
  await rejects(a.promise);
  expect((await b.promise).url).toBe("/b");
});

test("calling cancel() after it finished is harmless", async () => {
  const { fakeFetch } = makeFetch(5);
  const { promise, cancel } = cancellableFetch(fakeFetch, "/done");
  const res = await promise;
  expect(() => cancel()).not.toThrow();
  expect(res.url).toBe("/done");
});

test("an outer signal in options also cancels the request", async () => {
  const { fakeFetch, calls } = makeFetch();
  const page = new AbortController();
  const { promise } = cancellableFetch(fakeFetch, "/a", { signal: page.signal });
  page.abort();
  const err = await rejects(promise);
  expect(err.name).toBe("AbortError");
  expect(calls[0].opts.signal.aborted).toBe(true);
});

test("an already-aborted outer signal cancels right away", async () => {
  const { fakeFetch } = makeFetch();
  const page = new AbortController();
  page.abort();
  const err = await rejects(cancellableFetch(fakeFetch, "/a", { signal: page.signal }).promise);
  expect(err.name).toBe("AbortError");
});`,
    hints: [
      "`new AbortController()` gives you a `signal` to hand to fetch and an `abort()` method to call later.",
      "Spread the options and override `signal`: `fetchFn(url, { ...options, signal: controller.signal })`. `cancel` is just `() => controller.abort()`.",
      "For the outer signal: if `options.signal.aborted`, abort your controller before calling fetch; otherwise `options.signal.addEventListener(\"abort\", () => controller.abort(), { once: true })`.",
    ],
    solution: `function cancellableFetch(fetchFn, url, options = {}) {
  const controller = new AbortController();
  const outer = options.signal;
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const promise = fetchFn(url, { ...options, signal: controller.signal });
  return { promise, cancel: () => controller.abort() };
}`,
    explanation: `\`AbortController\` is the standard cancellation primitive on the web. The controller owns the right to cancel, and its \`signal\` is the read-only half you pass to anything that should stop when cancelled. \`fetch\` listens to it and rejects with a \`DOMException\` named \`AbortError\`.

Creating a fresh controller per call keeps requests independent. Linking an optional outer signal lets a page-level or component-level controller cancel many requests at once, which is how you clean up on unmount. Calling \`abort()\` twice, or after completion, is a no-op, so \`cancel\` is always safe.

A common mistake is passing the caller's signal straight through, which leaves your own \`cancel()\` with nothing to abort. Another is treating \`AbortError\` like a real failure in the UI. Callers usually check \`err.name === "AbortError"\` and stay quiet.

Follow-up: modern browsers have \`AbortSignal.any([a, b])\` and \`AbortSignal.timeout(ms)\`. How would you add a timeout to this function with them?`,
  },

  {
    id: "async-dedupe-inflight",
    title: "Dedupe in-flight requests",
    track: "Async & data",
    level: "Easy",
    minutes: 15,
    tags: ["promises", "caching"],
    prompt: `Five components on a page each ask for the current user at the same time, and the network panel shows five identical requests.

Write \`dedupeRequests(fetcher)\`, which returns \`get(key)\`:

- the first \`get(key)\` calls \`fetcher(key)\` and returns a promise for its result
- while that request is in flight, more \`get(key)\` calls return **the same promise** without calling \`fetcher\` again
- once it settles (fulfilled **or** rejected), it is forgotten. The next \`get(key)\` makes a fresh request. This is not a cache
- different keys are independent
- if the request fails, every waiting caller sees the rejection

\`\`\`js
const getUser = dedupeRequests((id) => api.get("/users/" + id));
const [a, b] = await Promise.all([getUser(1), getUser(1)]); // one request
\`\`\``,
    starter: `function dedupeRequests(fetcher) {
  // your code here
}`,
    tests: `function makeFetcher(ms = 10) {
  const calls = [];
  const fetcher = (key) => { calls.push(key); return new Promise((r) => setTimeout(() => r({ key, n: calls.length }), ms)); };
  return { fetcher, calls };
}

test("concurrent calls for the same key share one request", async () => {
  const { fetcher, calls } = makeFetcher();
  const get = dedupeRequests(fetcher);
  await Promise.all([get("me"), get("me"), get("me")]);
  expect(calls).toEqual(["me"]);
});

test("every caller gets the same value", async () => {
  const { fetcher } = makeFetcher();
  const get = dedupeRequests(fetcher);
  const [a, b] = await Promise.all([get("me"), get("me")]);
  expect(a).toEqual({ key: "me", n: 1 });
  expect(b).toBe(a);
});

test("returns the same promise while in flight", async () => {
  const { fetcher } = makeFetcher();
  const get = dedupeRequests(fetcher);
  const p1 = get("x"), p2 = get("x");
  expect(p1).toBe(p2);
  await p1;
});

test("different keys fetch separately", async () => {
  const { fetcher, calls } = makeFetcher();
  const get = dedupeRequests(fetcher);
  await Promise.all([get("a"), get("b"), get("a")]);
  expect(calls).toEqual(["a", "b"]);
});

test("fetches again once the earlier request has finished", async () => {
  const { fetcher, calls } = makeFetcher(5);
  const get = dedupeRequests(fetcher);
  await get("me");
  const second = await get("me");
  expect(calls).toEqual(["me", "me"]);
  expect(second.n).toBe(2);
});

test("a failure rejects every waiting caller", async () => {
  const get = dedupeRequests(() => new Promise((_, r) => setTimeout(() => r(new Error("401")), 5)));
  const p1 = get("me"), p2 = get("me");
  await rejects(p1, "401");
  await rejects(p2, "401");
});

test("after a failure the key can be fetched again", async () => {
  let n = 0;
  const get = dedupeRequests(async () => { n++; if (n === 1) throw new Error("flaky"); return "ok"; });
  await rejects(get("me"), "flaky");
  expect(await get("me")).toBe("ok");
});`,
    hints: [
      "Store the in-flight promise itself, keyed by `key`, in a `Map`.",
      "If the map has the key, return the stored promise. Otherwise call the fetcher, store the promise, and return it.",
      "Remove the key when the request settles either way: `fetcher(key)` followed by `.finally(() => inFlight.delete(key))`. Store and return the promise that `.finally` gives you.",
    ],
    solution: `function dedupeRequests(fetcher) {
  const inFlight = new Map();
  return function get(key) {
    if (inFlight.has(key)) return inFlight.get(key);
    const promise = Promise.resolve()
      .then(() => fetcher(key))
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
}`,
    explanation: `The trick is to cache the *promise*, not the result. A promise can have any number of \`.then\` subscribers, so every caller who arrives while the request is running simply awaits the same one.

Clearing the entry in \`.finally\` gives the "in flight only" semantics for both success and failure. Wrapping the call in \`Promise.resolve().then(...)\` also turns a synchronous throw from \`fetcher\` into a rejection, so the entry can't get stuck. Each call is O(1).

Two mistakes are common. Removing the key only on success leaves a failed request cached forever. Storing the result instead of the promise doesn't help concurrent callers, because none of them sees a result until the first one finishes.

Follow-up: libraries like SWR and React Query combine this with a short-lived cache. What extra state would you need to also reuse results for a few seconds after they arrive?`,
  },

  {
    id: "async-swr-cache",
    title: "Stale-while-revalidate cache",
    track: "Async & data",
    level: "Hard",
    minutes: 45,
    tags: ["caching", "promises", "clocks"],
    prompt: `A metrics dashboard re-renders often. You want instant numbers from cache, while quietly refreshing anything that's out of date: the stale-while-revalidate pattern.

Write \`createSWRCache({ fetcher, ttl, now })\`, where \`fetcher(key)\` returns a promise, \`ttl\` is in ms, and \`now()\` returns the current time in ms (defaults to \`Date.now\`; tests pass a fake clock). It returns an object with:

- \`get(key)\` returns a promise for the value:
  - **missing:** call the fetcher, cache the result, and resolve with it
  - **fresh** (\`now() - storedAt < ttl\`): resolve with the cached value, no fetch
  - **stale** (\`now() - storedAt >= ttl\`): resolve **immediately** with the cached value, and start a background refresh that updates the cache when it finishes
- \`peek(key)\` synchronously returns the cached value or \`undefined\`
- \`invalidate(key)\` drops the entry, so the next \`get\` fetches and waits

Rules:

- at most **one** fetch per key in flight. Concurrent misses share it, and repeated stale reads don't start extra refreshes
- \`storedAt\` is \`now()\` at the moment a fetch **finishes**
- a failed first fetch rejects \`get\` and caches nothing
- a failed background refresh keeps the old value (no unhandled rejection), and a later stale \`get\` tries again

\`\`\`js
const cache = createSWRCache({ fetcher: loadMetric, ttl: 60_000 });
await cache.get("signups"); // fetches
await cache.get("signups"); // cached
// a minute later:
await cache.get("signups"); // old value instantly, refresh in the background
\`\`\``,
    starter: `function createSWRCache({ fetcher, ttl, now = Date.now }) {
  // your code here
}`,
    tests: `function setup(ttl = 1000) {
  let t = 0;
  let calls = 0;
  const failNext = { value: false };
  const fetcher = async (key) => {
    calls++;
    const n = calls;
    await sleep(5);
    if (failNext.value) { failNext.value = false; throw new Error("fetch failed"); }
    return key + n;
  };
  const cache = createSWRCache({ fetcher, ttl, now: () => t });
  return { cache, tick: (ms) => { t += ms; }, calls: () => calls, failNext };
}

test("fetches on the first get and caches the value", async () => {
  const s = setup();
  expect(await s.cache.get("a")).toBe("a1");
  expect(await s.cache.get("a")).toBe("a1");
  expect(s.calls()).toBe(1);
});

test("serves fresh values without fetching", async () => {
  const s = setup(1000);
  await s.cache.get("a");
  s.tick(999);
  expect(await s.cache.get("a")).toBe("a1");
  expect(s.calls()).toBe(1);
});

test("serves a stale value immediately and refreshes in the background", async () => {
  const s = setup(1000);
  await s.cache.get("a");
  s.tick(1000);
  expect(await s.cache.get("a")).toBe("a1");
  expect(s.calls()).toBe(2);
  await sleep(20);
  expect(s.cache.peek("a")).toBe("a2");
});

test("a refreshed entry is fresh again", async () => {
  const s = setup(1000);
  await s.cache.get("a");
  s.tick(1500);
  await s.cache.get("a");
  await sleep(20);
  expect(await s.cache.get("a")).toBe("a2");
  expect(s.calls()).toBe(2);
});

test("concurrent misses share one fetch", async () => {
  const s = setup();
  const [x, y] = await Promise.all([s.cache.get("a"), s.cache.get("a")]);
  expect(x).toBe("a1");
  expect(y).toBe("a1");
  expect(s.calls()).toBe(1);
});

test("repeated stale reads start only one refresh", async () => {
  const s = setup(1000);
  await s.cache.get("a");
  s.tick(2000);
  await Promise.all([s.cache.get("a"), s.cache.get("a"), s.cache.get("a")]);
  await sleep(20);
  expect(s.calls()).toBe(2);
});

test("a failed first fetch rejects and caches nothing", async () => {
  const s = setup();
  s.failNext.value = true;
  await rejects(s.cache.get("a"), "fetch failed");
  expect(s.cache.peek("a")).toBeUndefined();
  expect(await s.cache.get("a")).toBe("a2");
});

test("a failed refresh keeps the old value, and a later get retries", async () => {
  const s = setup(1000);
  await s.cache.get("a");
  s.tick(1000);
  s.failNext.value = true;
  expect(await s.cache.get("a")).toBe("a1");
  await sleep(20);
  expect(s.cache.peek("a")).toBe("a1");
  expect(await s.cache.get("a")).toBe("a1");
  await sleep(20);
  expect(s.cache.peek("a")).toBe("a3");
});

test("invalidate() makes the next get fetch and wait", async () => {
  const s = setup();
  await s.cache.get("a");
  s.cache.invalidate("a");
  expect(s.cache.peek("a")).toBeUndefined();
  expect(await s.cache.get("a")).toBe("a2");
});

test("keys are cached independently", async () => {
  const s = setup();
  expect(await s.cache.get("a")).toBe("a1");
  expect(await s.cache.get("b")).toBe("b2");
  expect(s.cache.peek("a")).toBe("a1");
});`,
    hints: [
      "Keep two maps: settled entries (`{ value, storedAt }`) and in-flight fetch promises. Most of the rules come from how `get` combines them.",
      "Write one `load(key)` helper that reuses an in-flight promise if there is one, otherwise calls the fetcher, and on success stores `{ value, storedAt: now() }`. Either way, it removes the in-flight entry when the fetch settles.",
      "In `get`: no entry means `return load(key)`. Otherwise, if stale, call `load(key).catch(() => {})` without awaiting it. Then `return Promise.resolve(entry.value)`.",
    ],
    solution: `function createSWRCache({ fetcher, ttl, now = Date.now }) {
  const entries = new Map();  // key -> { value, storedAt }
  const inFlight = new Map(); // key -> promise

  function load(key) {
    if (inFlight.has(key)) return inFlight.get(key);
    const promise = (async () => fetcher(key))().then(
      (value) => {
        entries.set(key, { value, storedAt: now() });
        inFlight.delete(key);
        return value;
      },
      (err) => {
        inFlight.delete(key);
        throw err;
      },
    );
    inFlight.set(key, promise);
    return promise;
  }

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return load(key);
      if (now() - entry.storedAt >= ttl) {
        load(key).catch(() => {}); // background refresh; keep the old value on failure
      }
      return Promise.resolve(entry.value);
    },
    peek(key) {
      const entry = entries.get(key);
      return entry ? entry.value : undefined;
    },
    invalidate(key) {
      entries.delete(key);
    },
  };
}`,
    explanation: `Stale-while-revalidate splits "what do I show now?" from "is it up to date?". Callers always get an answer immediately once something is cached, and staleness only triggers work in the background. That is why dashboards built on SWR or React Query feel instant.

The design hinges on a single \`load\` function that owns the in-flight map. Because both misses and background refreshes go through it, deduplication is automatic: three stale reads, or a miss during a refresh, all share one fetch. Writing the entry only on success means a failed refresh leaves the old value in place, and the \`.catch(() => {})\` on the fire-and-forget call prevents an unhandled rejection.

Injecting \`now\` makes time controllable. Tests advance a number instead of waiting, and freshness logic is easy to reason about. Using the completion time as \`storedAt\` means a slow fetch doesn't come back already stale.

Common mistakes: awaiting the refresh in the stale path (it is no longer "stale-while"), starting a new refresh on every stale read, and caching rejected promises. Each operation is O(1) apart from the fetch itself. Follow-up: how would you let components subscribe so they re-render when a background refresh lands?`,
  },

  {
    id: "async-poll-until",
    title: "Poll until a job finishes",
    track: "Async & data",
    level: "Easy",
    minutes: 15,
    tags: ["promises", "polling"],
    prompt: `Exporting a CSV starts a server job. The client checks its status every few seconds until it says \`"done"\`, but it shouldn't poll forever.

Write \`poll(fn, options)\`:

- calls \`fn(attempt)\`, with \`attempt\` starting at \`1\`, and awaits the result
- if \`until(result)\` is true, resolves with \`result\`
- otherwise waits \`interval\` ms using \`sleep(interval)\`, then tries again
- after \`maxAttempts\` calls without success, rejects with an \`Error\` whose message is \`"Polling gave up after N attempts"\`. There is no sleep after the final attempt
- if \`fn\` rejects, \`poll\` rejects with that error right away

Options: \`interval\` (default \`1000\`), \`maxAttempts\` (default \`10\`), \`until\` (default: the result is truthy), \`sleep\` (default: a real timer; tests inject a fake).

\`\`\`js
const job = await poll(() => api.get("/exports/42"), {
  interval: 2000,
  until: (job) => job.status === "done",
});
\`\`\``,
    starter: `async function poll(fn, options = {}) {
  // your code here
}`,
    tests: `function recorder() {
  const delays = [];
  return { delays, sleep: async (ms) => { delays.push(ms); } };
}
function statuses(list) {
  let i = 0;
  const fn = async () => ({ status: list[Math.min(i++, list.length - 1)] });
  fn.calls = () => i;
  return fn;
}
const isDone = (job) => job.status === "done";

test("resolves on the first attempt without sleeping", async () => {
  const r = recorder();
  const job = await poll(statuses(["done"]), { until: isDone, sleep: r.sleep });
  expect(job).toEqual({ status: "done" });
  expect(r.delays).toEqual([]);
});

test("keeps polling until the condition is met", async () => {
  const r = recorder(), fn = statuses(["queued", "running", "done"]);
  const job = await poll(fn, { until: isDone, interval: 500, sleep: r.sleep });
  expect(job.status).toBe("done");
  expect(fn.calls()).toBe(3);
  expect(r.delays).toEqual([500, 500]);
});

test("gives up after maxAttempts", async () => {
  const r = recorder(), fn = statuses(["running"]);
  await rejects(poll(fn, { until: isDone, maxAttempts: 3, sleep: r.sleep }), "Polling gave up after 3 attempts");
  expect(fn.calls()).toBe(3);
});

test("does not sleep after the final attempt", async () => {
  const r = recorder();
  await rejects(poll(statuses(["running"]), { until: isDone, maxAttempts: 4, interval: 10, sleep: r.sleep }));
  expect(r.delays).toEqual([10, 10, 10]);
});

test("rejects right away when fn rejects", async () => {
  const r = recorder();
  let calls = 0;
  const fn = async () => { calls++; throw new Error("404 job not found"); };
  await rejects(poll(fn, { sleep: r.sleep }), "404 job not found");
  expect(calls).toBe(1);
});

test("passes the attempt number, starting at 1", async () => {
  const r = recorder(), seen = [];
  await poll(async (n) => { seen.push(n); return n === 3; }, { sleep: r.sleep });
  expect(seen).toEqual([1, 2, 3]);
});

test("by default stops on a truthy result", async () => {
  const r = recorder();
  const values = [null, 0, "ready"];
  let i = 0;
  expect(await poll(async () => values[i++], { sleep: r.sleep })).toBe("ready");
});

test("works with the default sleep and a tiny interval", async () => {
  expect((await poll(statuses(["running", "done"]), { until: isDone, interval: 5 })).status).toBe("done");
});`,
    hints: [
      "A `for` loop from 1 to `maxAttempts` makes the attempt count and the stopping rule easy to see.",
      "In each iteration `await fn(attempt)` and return it if `until(result)`. Otherwise sleep, but only if this isn't the last attempt.",
      "Destructure options with defaults, including `until = Boolean`. After the loop ends, `throw new Error(\"Polling gave up after \" + maxAttempts + \" attempts\")`.",
    ],
    solution: `const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function poll(fn, {
  interval = 1000,
  maxAttempts = 10,
  until = Boolean,
  sleep = defaultSleep,
} = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn(attempt);
    if (until(result)) return result;
    if (attempt < maxAttempts) await sleep(interval);
  }
  throw new Error("Polling gave up after " + maxAttempts + " attempts");
}`,
    explanation: `An async function with a plain loop reads exactly like the requirement: try, check, wait, repeat. Any rejection from \`fn\` propagates on its own because nothing catches it, which gives the "fail fast on real errors" behavior.

Skipping the sleep after the last attempt matters in practice. Otherwise a user waits an extra interval just to be told it failed. Injecting \`sleep\` keeps the tests instant and lets you assert on the exact waiting pattern.

Polling is O(maxAttempts) calls. Typical mistakes are off-by-one attempt counts, recursion that builds up long promise chains, and polling on a fixed timer with \`setInterval\`, which can overlap requests when the server is slower than the interval.

Follow-up: when would you switch from polling to Server-Sent Events or a WebSocket, and how would you make the polling interval back off while the job is still queued?`,
  },
);
