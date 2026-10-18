(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "be-route-matcher",
    title: "Route matcher with params and wildcards",
    track: "Backend",
    level: "Easy",
    minutes: 20,
    tags: ["routing", "strings", "http"],
    prompt: `Your tiny HTTP framework needs a router. Before you can dispatch requests, you need a function that decides whether a route pattern matches a request path and, if so, pulls out the named parameters.

Write \`matchRoute(pattern, path)\`. It returns an object of params when the path matches and \`null\` when it does not.

- Split both pattern and path on \`/\` and ignore empty segments, so a trailing slash does not matter.
- A segment like \`:id\` matches exactly one non-empty path segment and captures it as \`params.id\`.
- A \`*\` segment (only ever the last one) matches the rest of the path, including nothing at all, and captures it as \`params["*"]\` joined with \`/\`.
- Any other segment must match literally.
- Ignore a query string (\`?page=2\`) on the path.
- Captured values are URL-decoded with \`decodeURIComponent\`.

\`\`\`
matchRoute("/users/:id", "/users/42")          // { id: "42" }
matchRoute("/users/:id", "/users/42/posts")    // null
matchRoute("/files/*", "/files/img/cat.png")   // { "*": "img/cat.png" }
matchRoute("/health", "/health")               // {}
\`\`\``,
    starter: `function matchRoute(pattern, path) {
  // your code here
}`,
    tests: `test("captures a single named param", () => {
  expect(matchRoute("/users/:id", "/users/42")).toEqual({ id: "42" });
});
test("captures several params", () => {
  expect(matchRoute("/orgs/:org/repos/:repo", "/orgs/acme/repos/api")).toEqual({ org: "acme", repo: "api" });
});
test("returns {} for a static match and null for a static mismatch", () => {
  expect(matchRoute("/health", "/health")).toEqual({});
  expect(matchRoute("/health", "/healthz")).toBeNull();
});
test("returns null when segment counts differ", () => {
  expect(matchRoute("/users/:id", "/users")).toBeNull();
  expect(matchRoute("/users/:id", "/users/42/posts")).toBeNull();
});
test("wildcard captures the rest of the path", () => {
  expect(matchRoute("/files/*", "/files/img/cat.png")).toEqual({ "*": "img/cat.png" });
});
test("wildcard can match nothing", () => {
  expect(matchRoute("/files/*", "/files")).toEqual({ "*": "" });
});
test("ignores trailing slashes and query strings", () => {
  expect(matchRoute("/users/:id", "/users/7/?tab=posts")).toEqual({ id: "7" });
});
test("decodes captured values", () => {
  expect(matchRoute("/tags/:name", "/tags/node%20js")).toEqual({ name: "node js" });
});`,
    hints: [
      "Normalize both strings into arrays of segments first; most of the edge cases disappear once you do.",
      "Walk the pattern segments with an index. A param captures, a literal must be equal, and `*` grabs `parts.slice(i)` and returns early.",
      "After the loop, the path must not have extra segments: return `parts.length === pat.length ? params : null`.",
    ],
    solution: `function matchRoute(pattern, path) {
  const segments = (s) => s.split("?")[0].split("/").filter(Boolean);
  const pat = segments(pattern);
  const parts = segments(path);
  const params = {};

  for (let i = 0; i < pat.length; i++) {
    const seg = pat[i];
    if (seg === "*") {
      params["*"] = parts.slice(i).map(decodeURIComponent).join("/");
      return params;
    }
    if (i >= parts.length) return null;
    if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(parts[i]);
    else if (seg !== parts[i]) return null;
  }
  return parts.length === pat.length ? params : null;
}`,
    explanation: `Normalizing both strings into segment arrays (dropping empties and the query string) turns the problem into a simple parallel walk. Each pattern segment is either a capture, a literal, or the terminal wildcard, so a single loop handles all three.

The common mistake is forgetting the length check at the end: without it \`/users/:id\` would happily match \`/users/42/posts\`. Another is decoding before splitting, which breaks when an encoded \`%2F\` should stay inside one segment.

Matching is O(n) in the number of segments. A real router compiles patterns ahead of time (into regexes or a radix tree) so that it can test many routes quickly.

Follow-up: how would you choose between \`/users/me\` and \`/users/:id\` when both match? Most routers rank static segments above params above wildcards.`,
  },
  {
    id: "be-middleware-compose",
    title: "Compose Koa-style middleware",
    track: "Backend",
    level: "Medium",
    minutes: 25,
    tags: ["middleware", "promises", "http"],
    prompt: `Koa builds every request pipeline out of async middleware shaped like \`async (ctx, next) => { ...; await next(); ... }\`. Code before \`await next()\` runs on the way in, code after it runs on the way out (the "onion").

Write \`compose(middleware)\` that takes an array of middleware functions and returns a function \`(ctx, next?) => Promise\`.

- Calling the returned function runs \`middleware[0]\`, whose \`next\` runs \`middleware[1]\`, and so on. After the last one, \`next\` calls the optional outer \`next\` if given.
- It always returns a promise, even if a middleware is synchronous.
- A middleware that does not call \`next\` stops the chain.
- Errors (thrown or rejected) propagate as a rejection, so an upstream middleware can catch them with \`try { await next() } catch {}\`.
- Calling \`next()\` twice inside the same middleware rejects with \`Error("next() called multiple times")\`.

\`\`\`
const order = [];
const app = compose([
  async (ctx, next) => { order.push(1); await next(); order.push(4); },
  async (ctx, next) => { order.push(2); await next(); order.push(3); },
]);
await app({});   // order is [1, 2, 3, 4]
\`\`\``,
    starter: `function compose(middleware) {
  // your code here
}`,
    tests: `test("runs middleware in onion order", async () => {
  const order = [];
  const app = compose([
    async (ctx, next) => { order.push(1); await next(); order.push(4); },
    async (ctx, next) => { order.push(2); await next(); order.push(3); },
  ]);
  await app({});
  expect(order).toEqual([1, 2, 3, 4]);
});
test("shares the same ctx object", async () => {
  const app = compose([
    async (ctx, next) => { ctx.user = "ana"; await next(); },
    async (ctx) => { ctx.body = "hi " + ctx.user; },
  ]);
  const ctx = {};
  await app(ctx);
  expect(ctx.body).toBe("hi ana");
});
test("resolves for an empty array", async () => {
  const result = compose([])({});
  expect(result).toBeInstanceOf(Promise);
  await result;
});
test("returns a promise even for synchronous middleware", async () => {
  const app = compose([(ctx) => { ctx.ran = true; }]);
  const ctx = {};
  const p = app(ctx);
  expect(p).toBeInstanceOf(Promise);
  await p;
  expect(ctx.ran).toBe(true);
});
test("calls the outer next after the last middleware", async () => {
  const order = [];
  const app = compose([async (ctx, next) => { order.push("a"); await next(); }]);
  await app({}, async () => { order.push("outer"); });
  expect(order).toEqual(["a", "outer"]);
});
test("stops when a middleware does not call next", async () => {
  let reached = false;
  const app = compose([async () => {}, async () => { reached = true; }]);
  await app({});
  expect(reached).toBe(false);
});
test("lets upstream middleware catch downstream errors", async () => {
  const app = compose([
    async (ctx, next) => { try { await next(); } catch (e) { ctx.status = 500; ctx.error = e.message; } },
    () => { throw new Error("boom"); },
  ]);
  const ctx = {};
  await app(ctx);
  expect(ctx).toEqual({ status: 500, error: "boom" });
});
test("rejects when a synchronous middleware throws", async () => {
  const app = compose([() => { throw new Error("sync fail"); }]);
  await rejects(() => app({}), "sync fail");
});
test("rejects when next is called twice", async () => {
  const app = compose([async (ctx, next) => { await next(); await next(); }]);
  await rejects(() => app({}), "next() called multiple times");
});`,
    hints: [
      "Think of the chain as a recursive `dispatch(i)` that runs middleware `i` and hands it `() => dispatch(i + 1)` as `next`.",
      "Wrap each call in `Promise.resolve(...)` and a try/catch so sync return values and sync throws both become promises.",
      "To detect a double `next()`, keep the highest index dispatched so far in a closure variable; if `dispatch(i)` is called with `i <= index`, reject.",
    ],
    solution: `function compose(middleware) {
  return function (ctx, next) {
    let index = -1;

    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error("next() called multiple times"));
      index = i;
      const fn = i === middleware.length ? next : middleware[i];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}`,
    explanation: `The whole pipeline is one recursive function, \`dispatch(i)\`. Middleware \`i\` gets \`() => dispatch(i + 1)\` as its \`next\`, so awaiting \`next\` waits for everything downstream to finish. That is what produces the onion: code after \`await next()\` runs on the way back out.

Wrapping in \`Promise.resolve\` and try/catch normalizes everything into a promise, so sync middleware and sync throws behave like async ones. The double-call guard works because \`index\` only ever moves forward: a second \`next()\` from middleware \`i\` asks for \`i + 1\` again, which is no longer greater than \`index\`.

A frequent mistake is building the chain with \`reduceRight\` and forgetting the outer \`next\`, or returning \`undefined\` instead of a promise when the chain is empty.

Follow-up: how would you add a per-middleware timer for profiling without changing any middleware?`,
  },
  {
    id: "be-lru-cache",
    title: "LRU cache",
    track: "Backend",
    level: "Medium",
    minutes: 25,
    tags: ["caching", "data structures", "map"],
    prompt: `Your service calls a slow pricing API. You want an in-memory cache that keeps only the most recently used entries.

Implement \`class LRUCache\`:

- \`new LRUCache(capacity)\`: capacity is a positive integer.
- \`get(key)\`: returns the value, or \`undefined\` if missing. A hit marks the key as most recently used.
- \`set(key, value)\`: inserts or updates and marks the key most recently used. If inserting a new key would exceed capacity, evict the least recently used key first.
- \`has(key)\`: returns a boolean and does **not** change recency.
- \`size\`: a getter for the number of entries.

Both \`get\` and \`set\` should be O(1). Values can be falsy (\`0\`, \`""\`, \`false\`) and must still be cached.

\`\`\`
const c = new LRUCache(2);
c.set("a", 1); c.set("b", 2);
c.get("a");      // 1, now "b" is least recent
c.set("c", 3);   // evicts "b"
c.has("b");      // false
\`\`\``,
    starter: `class LRUCache {
  constructor(capacity) {
    // your code here
  }
  get(key) {}
  set(key, value) {}
  has(key) {}
  get size() {}
}`,
    tests: `test("stores and returns values", () => {
  const c = new LRUCache(2);
  c.set("a", 1);
  expect(c.get("a")).toBe(1);
  expect(c.get("missing")).toBeUndefined();
});
test("evicts the least recently used key", () => {
  const c = new LRUCache(2);
  c.set("a", 1); c.set("b", 2); c.set("c", 3);
  expect(c.has("a")).toBe(false);
  expect(c.get("b")).toBe(2);
  expect(c.get("c")).toBe(3);
});
test("get refreshes recency", () => {
  const c = new LRUCache(2);
  c.set("a", 1); c.set("b", 2);
  c.get("a");
  c.set("c", 3);
  expect(c.has("a")).toBe(true);
  expect(c.has("b")).toBe(false);
});
test("updating an existing key refreshes it and does not evict", () => {
  const c = new LRUCache(2);
  c.set("a", 1); c.set("b", 2);
  c.set("a", 10);
  expect(c.size).toBe(2);
  c.set("c", 3);
  expect(c.get("a")).toBe(10);
  expect(c.has("b")).toBe(false);
});
test("has does not change recency", () => {
  const c = new LRUCache(2);
  c.set("a", 1); c.set("b", 2);
  c.has("a");
  c.set("c", 3);
  expect(c.has("a")).toBe(false);
});
test("caches falsy values", () => {
  const c = new LRUCache(3);
  c.set("zero", 0); c.set("empty", ""); c.set("no", false);
  expect(c.get("zero")).toBe(0);
  expect(c.get("empty")).toBe("");
  expect(c.get("no")).toBe(false);
});
test("works with capacity 1", () => {
  const c = new LRUCache(1);
  c.set("a", 1); c.set("b", 2);
  expect(c.size).toBe(1);
  expect(c.get("a")).toBeUndefined();
  expect(c.get("b")).toBe(2);
});`,
    hints: [
      "A JavaScript `Map` remembers insertion order. The first key in iteration order can be your least recently used.",
      "To mark a key as recently used, delete it and set it again so it moves to the end.",
      "On insert of a new key at capacity, evict `this.map.keys().next().value`. Check presence with `map.has`, never with the value's truthiness.",
    ],
    solution: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) this.map.delete(this.map.keys().next().value);
    this.map.set(key, value);
    return this;
  }

  has(key) {
    return this.map.has(key);
  }

  get size() {
    return this.map.size;
  }
}`,
    explanation: `\`Map\` keeps keys in insertion order, so deleting and re-inserting a key moves it to the back. The front of the map is then always the least recently used entry, and evicting it is \`map.keys().next()\`. Every operation is O(1) and the cache uses O(capacity) space.

The classic language-agnostic version pairs a hash map with a doubly linked list: the map finds nodes in O(1), the list moves them to the head and pops the tail in O(1). Interviewers often ask for that version explicitly, so be ready to sketch it.

Common mistakes: checking \`if (!value)\` instead of \`has\`, which loses falsy values; evicting before checking whether the key already exists, which throws out a good entry on an update; and making \`has\` refresh recency.

Follow-up: add a per-entry TTL, or make eviction depend on the total byte size of the values instead of the count.`,
  },
  {
    id: "be-token-bucket",
    title: "Token bucket rate limiter",
    track: "Backend",
    level: "Medium",
    minutes: 25,
    tags: ["rate limiting", "time", "classes"],
    prompt: `Your public API allows short bursts but limits sustained traffic. A token bucket does exactly that: it holds up to \`capacity\` tokens, refills continuously at \`refillPerSecond\`, and each request spends tokens.

Implement \`class TokenBucket\`:

- \`new TokenBucket({ capacity, refillPerSecond, now })\`. \`now\` is a function returning the current time in milliseconds (tests pass a fake clock). The bucket starts full.
- \`tryRemove(count = 1)\`: refill based on elapsed time, then if at least \`count\` tokens are available, spend them and return \`true\`. Otherwise return \`false\` and spend nothing.
- \`tokens()\`: refill and return the current (possibly fractional) token count.

Refill is continuous and fractional: at 2 tokens/second, 250ms adds 0.5 tokens. The bucket never holds more than \`capacity\`.

\`\`\`
let t = 0;
const b = new TokenBucket({ capacity: 2, refillPerSecond: 1, now: () => t });
b.tryRemove(); b.tryRemove();  // true, true
b.tryRemove();                 // false
t = 1000;
b.tryRemove();                 // true
\`\`\``,
    starter: `class TokenBucket {
  constructor({ capacity, refillPerSecond, now = Date.now }) {
    // your code here
  }
  tryRemove(count = 1) {}
  tokens() {}
}`,
    tests: `function clock() { const c = { t: 0, now: () => c.t }; return c; }
test("starts full and allows a burst up to capacity", () => {
  const c = clock();
  const b = new TokenBucket({ capacity: 3, refillPerSecond: 1, now: c.now });
  expect([b.tryRemove(), b.tryRemove(), b.tryRemove(), b.tryRemove()]).toEqual([true, true, true, false]);
});
test("refills over time", () => {
  const c = clock();
  const b = new TokenBucket({ capacity: 2, refillPerSecond: 2, now: c.now });
  b.tryRemove(2);
  expect(b.tryRemove()).toBe(false);
  c.t = 500;
  expect(b.tryRemove()).toBe(true);
  expect(b.tryRemove()).toBe(false);
});
test("accumulates fractional tokens", () => {
  const c = clock();
  const b = new TokenBucket({ capacity: 1, refillPerSecond: 2, now: c.now });
  b.tryRemove();
  c.t = 250;
  expect(b.tryRemove()).toBe(false);
  c.t = 500;
  expect(b.tryRemove()).toBe(true);
});
test("never exceeds capacity after a long idle period", () => {
  const c = clock();
  const b = new TokenBucket({ capacity: 5, refillPerSecond: 10, now: c.now });
  b.tryRemove(5);
  c.t = 60000;
  expect(b.tokens()).toBeCloseTo(5, 6);
});
test("a failed multi-token request spends nothing", () => {
  const c = clock();
  const b = new TokenBucket({ capacity: 4, refillPerSecond: 1, now: c.now });
  b.tryRemove(2);
  expect(b.tryRemove(3)).toBe(false);
  expect(b.tokens()).toBeCloseTo(2, 6);
  expect(b.tryRemove(2)).toBe(true);
});
test("a request larger than capacity is always rejected", () => {
  const c = clock();
  const b = new TokenBucket({ capacity: 2, refillPerSecond: 100, now: c.now });
  c.t = 10000;
  expect(b.tryRemove(3)).toBe(false);
});
test("tokens reports fractional values", () => {
  const c = clock();
  const b = new TokenBucket({ capacity: 10, refillPerSecond: 4, now: c.now });
  b.tryRemove(10);
  c.t = 125;
  expect(b.tokens()).toBeCloseTo(0.5, 6);
});`,
    hints: [
      "You do not need a timer. Store the token count and the time you last refilled, and catch up lazily whenever someone asks.",
      "On every call: `elapsed = now() - last`, add `elapsed / 1000 * rate`, clamp to capacity, update `last`.",
      "Only subtract after checking `tokens >= count`; otherwise return false without touching the balance.",
    ],
    solution: `class TokenBucket {
  constructor({ capacity, refillPerSecond, now = Date.now }) {
    this.capacity = capacity;
    this.rate = refillPerSecond;
    this.now = now;
    this.balance = capacity;
    this.last = now();
  }

  refill() {
    const t = this.now();
    this.balance = Math.min(this.capacity, this.balance + ((t - this.last) / 1000) * this.rate);
    this.last = t;
  }

  tryRemove(count = 1) {
    this.refill();
    if (this.balance < count) return false;
    this.balance -= count;
    return true;
  }

  tokens() {
    this.refill();
    return this.balance;
  }
}`,
    explanation: `The key idea is lazy refill: instead of a timer adding tokens, each call computes how many tokens accrued since the last call. That makes the bucket O(1) per request and trivially testable with an injected clock.

Clamping to capacity is what bounds the burst size. Without it, a client that is idle for an hour could fire thousands of requests at once. Refusing a multi-token request without spending anything keeps the balance honest.

Common mistakes: refilling in whole tokens with \`Math.floor\` (which loses fractional progress and starves slow refill rates), forgetting to update \`last\`, or using \`setInterval\`, which drifts and leaks timers per key.

Follow-up: how would you share one bucket per API key across several server instances? Usually with Redis and a small Lua script that does the refill and spend atomically.`,
  },
  {
    id: "be-sliding-window-limiter",
    title: "Sliding window log rate limiter",
    track: "Backend",
    level: "Medium",
    minutes: 25,
    tags: ["rate limiting", "time", "maps"],
    prompt: `Your login endpoint allows at most \`limit\` attempts per user in any rolling window of \`windowMs\`. A fixed-window counter lets attackers double up at the window edge, so you keep a log of request timestamps per key instead.

Write \`createRateLimiter({ limit, windowMs, now })\` returning \`{ check(key) }\`. \`now()\` returns milliseconds.

\`check(key)\` returns \`{ allowed, remaining, retryAfterMs }\`:

- A recorded request at time \`t\` counts against the key while \`now < t + windowMs\`.
- If the key has fewer than \`limit\` requests in the window, record this one and return \`allowed: true\`, \`remaining\` (how many more are allowed right now), and \`retryAfterMs: 0\`.
- Otherwise return \`allowed: false\`, \`remaining: 0\`, and \`retryAfterMs\`: how long until the oldest recorded request leaves the window. Rejected requests are **not** recorded.
- Keys are independent.

\`\`\`
const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
t = 0;   rl.check("ana")   // { allowed: true, remaining: 1, retryAfterMs: 0 }
t = 100; rl.check("ana")   // { allowed: true, remaining: 0, retryAfterMs: 0 }
t = 400; rl.check("ana")   // { allowed: false, remaining: 0, retryAfterMs: 600 }
\`\`\``,
    starter: `function createRateLimiter({ limit, windowMs, now = Date.now }) {
  // your code here
  return { check(key) {} };
}`,
    tests: `function setup(limit, windowMs) { const c = { t: 0 }; c.rl = createRateLimiter({ limit, windowMs, now: () => c.t }); return c; }
test("allows requests up to the limit", () => {
  const c = setup(2, 1000);
  expect(c.rl.check("ana")).toEqual({ allowed: true, remaining: 1, retryAfterMs: 0 });
  c.t = 100;
  expect(c.rl.check("ana")).toEqual({ allowed: true, remaining: 0, retryAfterMs: 0 });
});
test("rejects over the limit with retryAfterMs", () => {
  const c = setup(2, 1000);
  c.rl.check("ana"); c.t = 100; c.rl.check("ana"); c.t = 400;
  expect(c.rl.check("ana")).toEqual({ allowed: false, remaining: 0, retryAfterMs: 600 });
});
test("keys are independent", () => {
  const c = setup(1, 1000);
  expect(c.rl.check("ana").allowed).toBe(true);
  expect(c.rl.check("bo").allowed).toBe(true);
  expect(c.rl.check("ana").allowed).toBe(false);
});
test("the window slides instead of resetting", () => {
  const c = setup(2, 1000);
  c.t = 900; c.rl.check("k");
  c.t = 1100; c.rl.check("k");
  c.t = 1500;
  expect(c.rl.check("k").allowed).toBe(false);
  c.t = 1900;
  expect(c.rl.check("k").allowed).toBe(true);
});
test("a request exactly windowMs old no longer counts", () => {
  const c = setup(1, 1000);
  c.rl.check("k");
  c.t = 999;
  expect(c.rl.check("k").allowed).toBe(false);
  c.t = 1000;
  expect(c.rl.check("k").allowed).toBe(true);
});
test("rejected requests are not recorded", () => {
  const c = setup(1, 1000);
  c.rl.check("k");
  c.t = 500; c.rl.check("k");
  c.t = 999; c.rl.check("k");
  c.t = 1000;
  expect(c.rl.check("k")).toEqual({ allowed: true, remaining: 0, retryAfterMs: 0 });
});
test("remaining counts down as requests arrive", () => {
  const c = setup(3, 1000);
  expect([c.rl.check("x").remaining, c.rl.check("x").remaining, c.rl.check("x").remaining]).toEqual([2, 1, 0]);
});`,
    hints: [
      "Keep a `Map` from key to an array of timestamps, oldest first.",
      "On each check, drop timestamps from the front while `t + windowMs <= now`. What is left is the current window.",
      "If `log.length < limit`, push `now` and return `limit - log.length` as remaining. Otherwise `retryAfterMs = log[0] + windowMs - now`.",
    ],
    solution: `function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const logs = new Map();

  return {
    check(key) {
      const t = now();
      const log = logs.get(key) || [];
      while (log.length && log[0] + windowMs <= t) log.shift();
      logs.set(key, log);

      if (log.length < limit) {
        log.push(t);
        return { allowed: true, remaining: limit - log.length, retryAfterMs: 0 };
      }
      return { allowed: false, remaining: 0, retryAfterMs: log[0] + windowMs - t };
    },
  };
}`,
    explanation: `A sliding log stores the exact time of each accepted request, so the question "how many requests in the last \`windowMs\`?" has an exact answer. Because timestamps arrive in order, expired entries are always at the front and can be trimmed with a simple loop.

Each check is amortized O(1) (every timestamp is pushed and shifted once) and memory is O(limit) per key, which is the main cost compared with a token bucket or a sliding-window counter. \`retryAfterMs\` is precise because the oldest entry tells you exactly when a slot frees up, which makes a good \`Retry-After\` header.

Common mistakes: an off-by-one at the window boundary (\`<\` vs \`<=\`), recording rejected requests (so a client hammering the endpoint locks itself out forever), and never deleting empty keys in a long-running process.

Follow-up: with millions of keys, how would you cap memory? A sliding-window counter (two fixed buckets weighted by overlap) gives a close approximation in O(1) space.`,
  },
  {
    id: "be-schema-validator",
    title: "Request body schema validator",
    track: "Backend",
    level: "Hard",
    minutes: 45,
    tags: ["validation", "recursion", "api design"],
    prompt: `Your API should reject bad request bodies with a list of every problem, not just the first one. Write a small validator.

\`validate(schema, value)\` returns an array of \`{ path, message }\` errors (empty when valid).

A schema is \`{ type, required?, min?, max?, properties?, items? }\` where \`type\` is one of \`"string"\`, \`"number"\`, \`"boolean"\`, \`"object"\`, \`"array"\`.

- \`number\` rejects \`NaN\`. \`object\` means a non-null, non-array object. Extra object keys are ignored.
- \`properties\` (objects) maps keys to child schemas. A property that is \`undefined\` is an error only if its schema has \`required: true\`; otherwise it is skipped.
- \`items\` (arrays) is the schema for every element.
- If the type is wrong, report only the type error for that value (no min/max, no children).
- Errors appear depth first, in the order properties are declared in the schema, then array index order.

Paths join object keys with \`.\` and array indexes with \`[i]\`, for example \`user.tags[1]\`. The root path is \`""\`.

Messages (exactly):

- \`is required\`
- \`expected <type>\`, for example \`expected string\`
- strings: \`must be at least N characters\` / \`must be at most N characters\`
- numbers: \`must be >= N\` / \`must be <= N\`
- arrays: \`must have at least N items\` / \`must have at most N items\`

\`\`\`
const schema = { type: "object", properties: {
  name: { type: "string", required: true, min: 2 },
  tags: { type: "array", items: { type: "string" } },
}};
validate(schema, { name: "a", tags: ["ok", 5] });
// [ { path: "name", message: "must be at least 2 characters" },
//   { path: "tags[1]", message: "expected string" } ]
\`\`\``,
    starter: `function validate(schema, value) {
  // your code here
}`,
    tests: `const userSchema = {
  type: "object",
  properties: {
    name: { type: "string", required: true, min: 2, max: 10 },
    age: { type: "number", min: 0, max: 150 },
    admin: { type: "boolean" },
    address: { type: "object", required: true, properties: {
      city: { type: "string", required: true },
      zip: { type: "string", min: 5, max: 5 },
    } },
    tags: { type: "array", max: 3, items: { type: "string", min: 1 } },
  },
};
test("returns [] for a valid body", () => {
  expect(validate(userSchema, { name: "Ana", age: 30, address: { city: "Lisbon" }, tags: ["a"] })).toEqual([]);
});
test("reports missing required fields", () => {
  expect(validate(userSchema, { address: {} })).toEqual([
    { path: "name", message: "is required" },
    { path: "address.city", message: "is required" },
  ]);
});
test("reports type errors and skips deeper checks for that value", () => {
  expect(validate(userSchema, { name: 42, address: "nope" })).toEqual([
    { path: "name", message: "expected string" },
    { path: "address", message: "expected object" },
  ]);
});
test("collects every error, not just the first", () => {
  const errs = validate(userSchema, { name: "A", age: -1, admin: "yes", address: { city: "X", zip: "123" } });
  expect(errs).toEqual([
    { path: "name", message: "must be at least 2 characters" },
    { path: "age", message: "must be >= 0" },
    { path: "admin", message: "expected boolean" },
    { path: "address.zip", message: "must be at least 5 characters" },
  ]);
});
test("validates array length and items with indexed paths", () => {
  const errs = validate(userSchema, { name: "Ana", address: { city: "X" }, tags: ["ok", "", 3, "x"] });
  expect(errs).toEqual([
    { path: "tags", message: "must have at most 3 items" },
    { path: "tags[1]", message: "must be at least 1 characters" },
    { path: "tags[2]", message: "expected string" },
  ]);
});
test("treats NaN as not a number and max as inclusive", () => {
  expect(validate({ type: "number", max: 5 }, NaN)).toEqual([{ path: "", message: "expected number" }]);
  expect(validate({ type: "number", max: 5 }, 5)).toEqual([]);
  expect(validate({ type: "number", max: 5 }, 6)).toEqual([{ path: "", message: "must be <= 5" }]);
});
test("null is not an object and arrays are not objects", () => {
  expect(validate({ type: "object" }, null)).toEqual([{ path: "", message: "expected object" }]);
  expect(validate({ type: "object" }, [])).toEqual([{ path: "", message: "expected object" }]);
});
test("null for an optional property is still a type error", () => {
  expect(validate(userSchema, { name: "Ana", address: { city: "X" }, age: null })).toEqual([
    { path: "age", message: "expected number" },
  ]);
});
test("handles nested arrays of objects", () => {
  const schema = { type: "array", min: 1, items: { type: "object", properties: { id: { type: "number", required: true } } } };
  expect(validate(schema, [])).toEqual([{ path: "", message: "must have at least 1 items" }]);
  expect(validate(schema, [{ id: 1 }, {}])).toEqual([{ path: "[1].id", message: "is required" }]);
});`,
    hints: [
      "Write one recursive `walk(schema, value, path)` that pushes into a shared errors array. The root call uses path `\"\"`.",
      "Check the type first and return early if it fails. Then do min/max by type, then recurse: object keys with `path ? path + \".\" + key : key`, array items with `path + \"[\" + i + \"]\"`.",
      "For each declared property: if `value[key] === undefined`, push `is required` only when `child.required`, then `continue`. Use a table of type predicates where `number` is `typeof v === \"number\" && !Number.isNaN(v)`.",
    ],
    solution: `const TYPE_CHECKS = {
  string: (v) => typeof v === "string",
  number: (v) => typeof v === "number" && !Number.isNaN(v),
  boolean: (v) => typeof v === "boolean",
  object: (v) => v !== null && typeof v === "object" && !Array.isArray(v),
  array: (v) => Array.isArray(v),
};

function validate(schema, value) {
  const errors = [];
  const add = (path, message) => errors.push({ path, message });

  function bounds(s, size, path, low, high) {
    if (s.min != null && size < s.min) add(path, low(s.min));
    if (s.max != null && size > s.max) add(path, high(s.max));
  }

  function walk(s, v, path) {
    if (!TYPE_CHECKS[s.type](v)) return add(path, "expected " + s.type);

    if (s.type === "number") bounds(s, v, path, (n) => "must be >= " + n, (n) => "must be <= " + n);
    if (s.type === "string")
      bounds(s, v.length, path, (n) => "must be at least " + n + " characters", (n) => "must be at most " + n + " characters");

    if (s.type === "array") {
      bounds(s, v.length, path, (n) => "must have at least " + n + " items", (n) => "must have at most " + n + " items");
      if (s.items) v.forEach((item, i) => walk(s.items, item, path + "[" + i + "]"));
    }

    if (s.type === "object") {
      for (const [key, child] of Object.entries(s.properties || {})) {
        const childPath = path ? path + "." + key : key;
        if (v[key] === undefined) {
          if (child.required) add(childPath, "is required");
          continue;
        }
        walk(child, v[key], childPath);
      }
    }
  }

  walk(schema, value, "");
  return errors;
}`,
    explanation: `Validation is a tree walk over the schema and the value in lockstep. Passing the path down as a string means every error knows exactly where it came from, and pushing into one shared array is what lets you report all problems in a single response.

Returning early on a type error is important: checking \`min\` on a number that is actually a string, or recursing into \`null\`, would produce confusing extra errors or crash. The type table also keeps the JavaScript gotchas in one place: \`typeof null === "object"\`, arrays are objects, and \`NaN\` is a number.

The work is O(size of the value) since each node is visited once. Common mistakes: treating \`null\` as "missing" (an explicit \`null\` is a client bug worth reporting), bailing on the first error, and building paths like \`.name\` at the root.

Follow-up: how would you add \`additionalProperties: false\`, or coerce query-string values like \`"42"\` into numbers before validating?`,
  },
  {
    id: "be-sql-builder",
    title: "Parameterized SQL query builder",
    track: "Backend",
    level: "Medium",
    minutes: 35,
    tags: ["sql", "security", "builder pattern"],
    prompt: `You are writing a tiny query builder for Postgres. It must never interpolate values into SQL text: every value goes into a \`values\` array and the text uses \`$1\`, \`$2\`, ... placeholders.

Write \`select(table, columns = ["*"])\` returning a chainable builder:

- \`.where(column, op, value)\`: \`op\` is one of \`=\`, \`!=\`, \`<\`, \`<=\`, \`>\`, \`>=\`, \`LIKE\`. Anything else throws \`Error("Invalid operator: ...")\`. If \`value === null\` with \`=\` or \`!=\`, emit \`column IS NULL\` / \`column IS NOT NULL\` with no placeholder.
- \`.whereIn(column, values)\`: emits \`column IN ($1, $2)\`. An empty list emits \`FALSE\`.
- \`.orderBy(column, dir = "ASC")\`: \`ASC\` or \`DESC\` (any case, output uppercase), otherwise throw \`Error("Invalid direction: ...")\`.
- \`.limit(n)\`: emits \`LIMIT $k\` with \`n\` as a value.
- \`.toSQL()\`: returns \`{ text, values }\`.

Multiple conditions join with \` AND \`. Multiple orderings join with \`, \`. Table and column names must match \`/^[A-Za-z_][A-Za-z0-9_.]*$/\` (or be \`*\` in the column list), otherwise throw \`Error("Invalid identifier: ...")\` when the method is called.

\`\`\`
select("users", ["id", "name"])
  .where("age", ">", 21).where("status", "=", "active")
  .orderBy("created_at", "desc").limit(10)
  .toSQL();
// { text: "SELECT id, name FROM users WHERE age > $1 AND status = $2 ORDER BY created_at DESC LIMIT $3",
//   values: [21, "active", 10] }
\`\`\``,
    starter: `function select(table, columns = ["*"]) {
  // your code here
}`,
    tests: `test("selects all columns by default", () => {
  expect(select("users").toSQL()).toEqual({ text: "SELECT * FROM users", values: [] });
});
test("builds the full example query", () => {
  const q = select("users", ["id", "name"]).where("age", ">", 21).where("status", "=", "active").orderBy("created_at", "desc").limit(10).toSQL();
  expect(q).toEqual({
    text: "SELECT id, name FROM users WHERE age > $1 AND status = $2 ORDER BY created_at DESC LIMIT $3",
    values: [21, "active", 10],
  });
});
test("never puts values in the text", () => {
  const evil = "x'; DROP TABLE users; --";
  const q = select("users").where("name", "=", evil).toSQL();
  expect(q.text).toBe("SELECT * FROM users WHERE name = $1");
  expect(q.values).toEqual([evil]);
});
test("whereIn numbers placeholders in sequence", () => {
  const q = select("orders").where("total", ">=", 100).whereIn("status", ["paid", "shipped"]).toSQL();
  expect(q).toEqual({ text: "SELECT * FROM orders WHERE total >= $1 AND status IN ($2, $3)", values: [100, "paid", "shipped"] });
});
test("whereIn with an empty list emits FALSE", () => {
  expect(select("orders").whereIn("id", []).toSQL()).toEqual({ text: "SELECT * FROM orders WHERE FALSE", values: [] });
});
test("null comparisons use IS NULL and IS NOT NULL", () => {
  const q = select("users").where("deleted_at", "=", null).where("email", "!=", null).toSQL();
  expect(q).toEqual({ text: "SELECT * FROM users WHERE deleted_at IS NULL AND email IS NOT NULL", values: [] });
});
test("supports several orderings", () => {
  expect(select("posts").orderBy("pinned", "DESC").orderBy("id").toSQL().text).toBe("SELECT * FROM posts ORDER BY pinned DESC, id ASC");
});
test("rejects unknown operators and directions", () => {
  expect(() => select("users").where("age", "; DELETE", 1)).toThrow("Invalid operator");
  expect(() => select("users").orderBy("id", "sideways")).toThrow("Invalid direction");
});
test("rejects unsafe identifiers", () => {
  expect(() => select("users; DROP TABLE x")).toThrow("Invalid identifier");
  expect(() => select("users", ["id", "name--"])).toThrow("Invalid identifier");
  expect(() => select("users").where("1=1 OR id", "=", 1)).toThrow("Invalid identifier");
});
test("toSQL can be called twice with the same result", () => {
  const b = select("users").where("id", "=", 1);
  expect(b.toSQL()).toEqual(b.toSQL());
});`,
    hints: [
      "Store the pieces (conditions, orderings, limit) in plain arrays as the methods are called, and only build text inside `toSQL`.",
      "In `toSQL`, use a local `values` array and a helper `param(v)` that pushes `v` and returns `\"$\" + values.length`. Because numbering happens during assembly, it is always sequential.",
      "Validate eagerly: an `ident(name)` helper that tests the regex and throws, and a `Set` of allowed operators. Handle `null` with `=`/`!=` before calling `param`.",
    ],
    solution: `const OPERATORS = new Set(["=", "!=", "<", "<=", ">", ">=", "LIKE"]);

function ident(name) {
  if (typeof name !== "string" || !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(name)) throw new Error("Invalid identifier: " + name);
  return name;
}

function select(table, columns = ["*"]) {
  const q = {
    table: ident(table),
    columns: columns.map((c) => (c === "*" ? c : ident(c))),
    conditions: [],
    order: [],
    limit: null,
  };

  const builder = {
    where(column, op, value) {
      if (!OPERATORS.has(op)) throw new Error("Invalid operator: " + op);
      q.conditions.push({ column: ident(column), op, value });
      return builder;
    },
    whereIn(column, values) {
      q.conditions.push({ column: ident(column), op: "IN", value: [...values] });
      return builder;
    },
    orderBy(column, dir = "ASC") {
      const d = String(dir).toUpperCase();
      if (d !== "ASC" && d !== "DESC") throw new Error("Invalid direction: " + dir);
      q.order.push(ident(column) + " " + d);
      return builder;
    },
    limit(n) {
      q.limit = n;
      return builder;
    },
    toSQL() {
      const values = [];
      const param = (v) => {
        values.push(v);
        return "$" + values.length;
      };
      const conds = q.conditions.map(({ column, op, value }) => {
        if (op === "IN") return value.length ? column + " IN (" + value.map(param).join(", ") + ")" : "FALSE";
        if (value === null && op === "=") return column + " IS NULL";
        if (value === null && op === "!=") return column + " IS NOT NULL";
        return column + " " + op + " " + param(value);
      });

      let text = "SELECT " + q.columns.join(", ") + " FROM " + q.table;
      if (conds.length) text += " WHERE " + conds.join(" AND ");
      if (q.order.length) text += " ORDER BY " + q.order.join(", ");
      if (q.limit != null) text += " LIMIT " + param(q.limit);
      return { text, values };
    },
  };
  return builder;
}`,
    explanation: `Placeholders separate code from data: the database parses the SQL text once and treats \`values\` as data, so a string like \`'; DROP TABLE\` can never change the query's shape. Identifiers cannot be parameterized, which is why they get a strict allowlist regex instead.

Assigning placeholder numbers inside \`toSQL\` (not when \`where\` is called) guarantees the numbers follow the order they appear in the text, even though \`LIMIT\` is added last, and makes \`toSQL\` safe to call more than once.

The \`null\` case is the classic trap: \`col = NULL\` is never true in SQL, so a naive builder silently returns zero rows. Likewise \`IN ()\` is a syntax error in Postgres, so an empty list becomes \`FALSE\`.

Follow-up: make the builder immutable so a base query can be reused safely, or add \`OR\` groups without losing the placeholder ordering.`,
  },
  {
    id: "be-cursor-pagination",
    title: "Opaque cursor pagination",
    track: "Backend",
    level: "Medium",
    minutes: 35,
    tags: ["pagination", "api design", "encoding"],
    prompt: `Your activity feed uses offset pagination, and users see duplicates when new posts arrive. Switch to keyset (cursor) pagination ordered by \`createdAt\` descending, then \`id\` descending to break ties.

Write three functions:

- \`encodeCursor({ createdAt, id })\`: returns an opaque URL-safe string (base64url of some JSON works well: no \`+\`, \`/\`, \`=\` or \`{\` visible).
- \`decodeCursor(cursor)\`: returns \`{ createdAt, id }\`. Throws \`Error("Invalid cursor")\` for anything that does not decode to two numbers.
- \`paginate(rows, cursor, limit)\`: rows are \`{ id, createdAt, ... }\` with numeric fields, in any order. Returns \`{ items, nextCursor }\` where \`items\` are the next \`limit\` rows strictly after the cursor (or from the start when \`cursor\` is \`null\`), and \`nextCursor\` points at the last item, or is \`null\` when no rows remain after this page.

\`\`\`
const rows = [{ id: 1, createdAt: 100 }, { id: 2, createdAt: 200 }, { id: 3, createdAt: 200 }];
const p1 = paginate(rows, null, 2);    // items ids [3, 2], nextCursor "..."
const p2 = paginate(rows, p1.nextCursor, 2); // items ids [1], nextCursor null
\`\`\``,
    starter: `function encodeCursor({ createdAt, id }) {
  // your code here
}

function decodeCursor(cursor) {
  // your code here
}

function paginate(rows, cursor, limit) {
  // your code here
}`,
    tests: `const feed = [
  { id: 1, createdAt: 100 }, { id: 2, createdAt: 200 }, { id: 3, createdAt: 200 },
  { id: 4, createdAt: 300 }, { id: 5, createdAt: 200 }, { id: 6, createdAt: 50 },
];
const ids = (page) => page.items.map((r) => r.id);
test("round-trips a cursor", () => {
  expect(decodeCursor(encodeCursor({ createdAt: 1700000000000, id: 42 }))).toEqual({ createdAt: 1700000000000, id: 42 });
});
test("cursors are opaque and URL-safe", () => {
  const c = encodeCursor({ createdAt: 1700000000000, id: 9999 });
  expect(typeof c).toBe("string");
  expect(c).not.toMatch(/[+/={}]/);
});
test("first page is newest first", () => {
  expect(ids(paginate(feed, null, 2))).toEqual([4, 5]);
});
test("walks every row exactly once, breaking ties by id", () => {
  const seen = [];
  let cursor = null;
  do {
    const page = paginate(feed, cursor, 2);
    seen.push(...ids(page));
    cursor = page.nextCursor;
  } while (cursor);
  expect(seen).toEqual([4, 5, 3, 2, 1, 6]);
});
test("nextCursor is null when the page ends exactly at the last row", () => {
  const p1 = paginate(feed, null, 3);
  const p2 = paginate(feed, p1.nextCursor, 3);
  expect(ids(p2)).toEqual([2, 1, 6]);
  expect(p2.nextCursor).toBeNull();
});
test("is stable when rows are inserted or deleted between requests", () => {
  const p1 = paginate(feed, null, 2);
  const changed = feed.filter((r) => r.id !== 4).concat([{ id: 7, createdAt: 999 }]);
  expect(ids(paginate(changed, p1.nextCursor, 2))).toEqual([3, 2]);
});
test("returns an empty page for an empty table", () => {
  expect(paginate([], null, 5)).toEqual({ items: [], nextCursor: null });
});
test("does not mutate the input rows", () => {
  const copy = feed.slice();
  paginate(feed, null, 2);
  expect(feed).toEqual(copy);
});
test("rejects garbage cursors", () => {
  expect(() => decodeCursor("not-a-cursor!!")).toThrow("Invalid cursor");
  expect(() => decodeCursor(btoa("{}"))).toThrow("Invalid cursor");
  expect(() => paginate(feed, "%%%", 2)).toThrow("Invalid cursor");
});`,
    hints: [
      "A cursor is just the sort key of the last row you returned. Encode `[createdAt, id]` as JSON, then base64, then swap `+`/`/` for `-`/`_` and strip `=`.",
      "Define one comparator for the feed order: `(a, b) => b.createdAt - a.createdAt || b.id - a.id`. A row is \"after\" the cursor when `compare(row, cursor) > 0`.",
      "Sort a copy, filter to rows after the cursor, take `slice(0, limit)`, and set `nextCursor` only if more than `limit` rows were left.",
    ],
    solution: `function encodeCursor({ createdAt, id }) {
  return btoa(JSON.stringify([createdAt, id])).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeCursor(cursor) {
  try {
    let b64 = cursor.replaceAll("-", "+").replaceAll("_", "/");
    while (b64.length % 4) b64 += "=";
    const [createdAt, id] = JSON.parse(atob(b64));
    if (typeof createdAt !== "number" || typeof id !== "number") throw new Error();
    return { createdAt, id };
  } catch {
    throw new Error("Invalid cursor");
  }
}

const feedOrder = (a, b) => b.createdAt - a.createdAt || b.id - a.id;

function paginate(rows, cursor, limit) {
  let sorted = [...rows].sort(feedOrder);
  if (cursor) {
    const after = decodeCursor(cursor);
    sorted = sorted.filter((row) => feedOrder(row, after) > 0);
  }
  const items = sorted.slice(0, limit);
  const nextCursor = sorted.length > limit ? encodeCursor(items[items.length - 1]) : null;
  return { items, nextCursor };
}`,
    explanation: `Offset pagination says "skip 20 rows", which shifts whenever rows are added or removed. Keyset pagination says "give me rows after this sort key", which stays correct no matter what changed above the cursor. In SQL this becomes \`WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT $3\`, which an index can serve directly.

The tie-breaker is essential. Ordering by \`createdAt\` alone means two rows with the same timestamp have no defined order, and a cursor that only stores the timestamp either skips or repeats them. Including the unique \`id\` makes the order total.

Making the cursor opaque (base64url) tells clients not to construct or parse it, so you can change its contents later. Detecting the last page by checking for more than \`limit\` remaining rows (in SQL, fetching \`limit + 1\`) avoids an extra empty request.

Follow-up: how would you support "previous page", or sign the cursor with an HMAC so clients cannot tamper with it?`,
  },
  {
    id: "be-idempotency-keys",
    title: "Idempotency key middleware",
    track: "Backend",
    level: "Medium",
    minutes: 30,
    tags: ["payments", "reliability", "promises"],
    prompt: `Mobile clients retry \`POST /charges\` when the network flakes, and customers get charged twice. Add support for an \`Idempotency-Key\` header, Stripe style.

Write \`createIdempotentHandler(handler)\`. \`handler\` is \`async (req) => res\`. Return an \`async (req) => res\` wrapper. Requests look like \`{ headers, body }\` (header names are lowercase), responses like \`{ status, headers?, body }\`.

- No \`idempotency-key\` header: just call \`handler\`.
- New key: call \`handler\`, remember the key, a fingerprint of \`req.body\`, and the response. Return the response unchanged.
- Seen key with the same body: do **not** call \`handler\` again. Return the stored response with an extra header \`"idempotent-replayed": "true"\` (keep the original headers).
- Seen key with a different body: return \`{ status: 422, body: { error: "Idempotency key reused with a different payload" } }\`.
- Bodies are the same if they are deeply equal, regardless of object key order.
- A duplicate that arrives while the first request is still running waits for it and gets the replay; the handler still runs once.
- If the handler throws, forget the key so the client can retry, and rethrow.

\`\`\`
const charge = createIdempotentHandler(async (req) => ({ status: 201, body: { id: "ch_1" } }));
await charge({ headers: { "idempotency-key": "k1" }, body: { amount: 500 } });
// { status: 201, body: { id: "ch_1" } }
await charge({ headers: { "idempotency-key": "k1" }, body: { amount: 500 } });
// { status: 201, body: { id: "ch_1" }, headers: { "idempotent-replayed": "true" } }
\`\`\``,
    starter: `function createIdempotentHandler(handler) {
  // your code here
}`,
    tests: `function counting(fn) { const h = async (req) => { h.calls++; return fn(req, h.calls); }; h.calls = 0; return h; }
const req = (key, body) => ({ headers: key ? { "idempotency-key": key } : {}, body });
test("passes requests without a key straight through", async () => {
  const h = counting((r, n) => ({ status: 201, body: { n } }));
  const wrapped = createIdempotentHandler(h);
  await wrapped(req(null, { a: 1 }));
  await wrapped(req(null, { a: 1 }));
  expect(h.calls).toBe(2);
});
test("returns the handler response for a new key", async () => {
  const wrapped = createIdempotentHandler(async () => ({ status: 201, headers: { "x-id": "1" }, body: { id: "ch_1" } }));
  expect(await wrapped(req("k1", { amount: 5 }))).toEqual({ status: 201, headers: { "x-id": "1" }, body: { id: "ch_1" } });
});
test("replays the stored response without calling the handler again", async () => {
  const h = counting((r, n) => ({ status: 201, headers: { "x-id": String(n) }, body: { id: "ch_" + n } }));
  const wrapped = createIdempotentHandler(h);
  await wrapped(req("k1", { amount: 5 }));
  const again = await wrapped(req("k1", { amount: 5 }));
  expect(h.calls).toBe(1);
  expect(again).toEqual({ status: 201, headers: { "x-id": "1", "idempotent-replayed": "true" }, body: { id: "ch_1" } });
});
test("adds the replay header even when the original had no headers", async () => {
  const wrapped = createIdempotentHandler(async () => ({ status: 200, body: "ok" }));
  await wrapped(req("k", 1));
  expect((await wrapped(req("k", 1))).headers).toEqual({ "idempotent-replayed": "true" });
});
test("treats bodies with different key order as the same", async () => {
  const h = counting(() => ({ status: 201, body: {} }));
  const wrapped = createIdempotentHandler(h);
  await wrapped(req("k1", { amount: 5, currency: "usd", meta: { a: 1, b: 2 } }));
  const r = await wrapped(req("k1", { meta: { b: 2, a: 1 }, currency: "usd", amount: 5 }));
  expect(h.calls).toBe(1);
  expect(r.status).toBe(201);
});
test("rejects a reused key with a different payload", async () => {
  const h = counting(() => ({ status: 201, body: {} }));
  const wrapped = createIdempotentHandler(h);
  await wrapped(req("k1", { amount: 5 }));
  expect(await wrapped(req("k1", { amount: 6 }))).toEqual({ status: 422, body: { error: "Idempotency key reused with a different payload" } });
  expect(h.calls).toBe(1);
});
test("concurrent duplicates share one handler call", async () => {
  const h = counting(async (r, n) => { await sleep(20); return { status: 201, body: { n } }; });
  const wrapped = createIdempotentHandler(h);
  const [a, b] = await Promise.all([wrapped(req("k1", { x: 1 })), wrapped(req("k1", { x: 1 }))]);
  expect(h.calls).toBe(1);
  expect(a.body).toEqual({ n: 1 });
  expect(b.body).toEqual({ n: 1 });
  expect(b.headers["idempotent-replayed"]).toBe("true");
});
test("forgets the key when the handler fails so a retry can succeed", async () => {
  const h = counting((r, n) => { if (n === 1) throw new Error("db down"); return { status: 201, body: { n } }; });
  const wrapped = createIdempotentHandler(h);
  await rejects(() => wrapped(req("k1", { x: 1 })), "db down");
  expect(await wrapped(req("k1", { x: 1 }))).toEqual({ status: 201, body: { n: 2 } });
});`,
    hints: [
      "Store a `Map` from key to `{ fingerprint, promise }`. Storing the promise (not the resolved response) is what makes concurrent duplicates easy.",
      "For the fingerprint, write a `stableStringify` that sorts object keys recursively before joining, so key order does not matter.",
      "Flow: no key, call through. Entry exists, compare fingerprints (422 on mismatch), otherwise `await entry.promise` and spread in the replay header. New key, create the promise, store it, and in a catch delete the key and rethrow.",
    ],
    solution: `function stableStringify(value) {
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

function createIdempotentHandler(handler) {
  const store = new Map();

  return async function (req) {
    const key = req.headers && req.headers["idempotency-key"];
    if (!key) return handler(req);

    const fingerprint = stableStringify(req.body);
    const entry = store.get(key);
    if (entry) {
      if (entry.fingerprint !== fingerprint) {
        return { status: 422, body: { error: "Idempotency key reused with a different payload" } };
      }
      const res = await entry.promise;
      return { ...res, headers: { ...res.headers, "idempotent-replayed": "true" } };
    }

    // Store the promise right away so a concurrent duplicate can await it.
    const promise = Promise.resolve().then(() => handler(req));
    store.set(key, { fingerprint, promise });
    try {
      return await promise;
    } catch (err) {
      store.delete(key);
      throw err;
    }
  };
}`,
    explanation: `An idempotency key turns "at least once" client retries into "exactly once" side effects. The server remembers the outcome of the first request and replays it, so the client gets the same answer without the charge running twice.

Storing the in-flight promise rather than the final response closes the race where two identical requests arrive milliseconds apart: the second finds the entry immediately and awaits the same work. The fingerprint check protects against a client bug that reuses a key for a different operation, which should fail loudly instead of returning an unrelated response.

Common mistakes: fingerprinting with plain \`JSON.stringify\` (key order differs between clients), caching failures forever so the client can never retry, and only writing the entry after the handler resolves, which lets concurrent duplicates both run.

Follow-up: in production the store is Redis or a database table with a TTL (often 24 hours). How would you make "claim the key" atomic across multiple servers?`,
  },
  {
    id: "be-job-queue",
    title: "Job queue with retries and dead letters",
    track: "Backend",
    level: "Hard",
    minutes: 45,
    tags: ["queues", "reliability", "async"],
    prompt: `You are building the worker that sends transactional emails. Jobs fail sometimes, so failed jobs retry with exponential backoff, and jobs that keep failing go to a dead-letter list for a human to look at.

Implement \`class JobQueue\`:

- \`new JobQueue({ handler, maxAttempts = 3, baseDelayMs = 1000, now })\`. \`handler\` is \`async (payload, attempt) => void\` (\`attempt\` starts at 1). \`now()\` returns milliseconds.
- \`add(payload)\`: enqueue a job that is due immediately (\`runAt = now()\`). Returns a numeric id, starting at 1.
- \`async runDue()\`: take a snapshot of jobs with \`runAt <= now()\`, ordered by \`runAt\` then id, and run them one at a time. Returns how many jobs it ran.
  - On success the job is removed and its id is pushed to \`completed\`.
  - On failure (throw or rejection), if attempts so far < \`maxAttempts\`, reschedule at \`now() + baseDelayMs * 2 ** (attempts - 1)\`. So the 2nd attempt waits 1000ms, the 3rd 2000ms.
  - After the final failed attempt, remove it and push \`{ id, payload, attempts, error }\` to \`deadLetters\` (\`error\` is the error message).
- \`pending\`: a getter for how many jobs are still queued (including ones waiting to retry).
- \`nextRunAt()\`: the earliest \`runAt\` among queued jobs, or \`null\`.
- \`completed\` and \`deadLetters\` are public arrays.

\`\`\`
let t = 0;
const q = new JobQueue({ handler: sendEmail, now: () => t });
q.add({ to: "a@x.com" });
await q.runDue();   // attempt 1 fails, retry scheduled at 1000
t = 1000;
await q.runDue();   // attempt 2
\`\`\``,
    starter: `class JobQueue {
  constructor({ handler, maxAttempts = 3, baseDelayMs = 1000, now = Date.now }) {
    // your code here
  }
  add(payload) {}
  async runDue() {}
  get pending() {}
  nextRunAt() {}
}`,
    tests: `function make(handler, opts = {}) { const c = { t: 0 }; c.q = new JobQueue({ handler, now: () => c.t, ...opts }); return c; }
test("runs a successful job once and marks it completed", async () => {
  const seen = [];
  const c = make(async (p, attempt) => { seen.push([p, attempt]); });
  const id = c.q.add("hello");
  expect(id).toBe(1);
  expect(await c.q.runDue()).toBe(1);
  expect(seen).toEqual([["hello", 1]]);
  expect(c.q.completed).toEqual([1]);
  expect(c.q.pending).toBe(0);
});
test("runs due jobs in the order they were added", async () => {
  const seen = [];
  const c = make(async (p) => { seen.push(p); });
  c.q.add("a"); c.q.add("b"); c.q.add("c");
  await c.q.runDue();
  expect(seen).toEqual(["a", "b", "c"]);
  expect(c.q.completed).toEqual([1, 2, 3]);
});
test("retries with exponential backoff", async () => {
  const attempts = [];
  const c = make(async (p, attempt) => { attempts.push([c.t, attempt]); if (attempt < 3) throw new Error("smtp"); });
  c.q.add("x");
  await c.q.runDue();
  expect(c.q.nextRunAt()).toBe(1000);
  c.t = 999; expect(await c.q.runDue()).toBe(0);
  c.t = 1000; await c.q.runDue();
  expect(c.q.nextRunAt()).toBe(3000);
  c.t = 3000; await c.q.runDue();
  expect(attempts).toEqual([[0, 1], [1000, 2], [3000, 3]]);
  expect(c.q.completed).toEqual([1]);
});
test("moves a job to dead letters after maxAttempts", async () => {
  const c = make(async () => { throw new Error("mailbox full"); }, { maxAttempts: 2, baseDelayMs: 10 });
  c.q.add({ to: "a@x.com" });
  await c.q.runDue();
  c.t = 10; await c.q.runDue();
  expect(c.q.deadLetters).toEqual([{ id: 1, payload: { to: "a@x.com" }, attempts: 2, error: "mailbox full" }]);
  expect(c.q.pending).toBe(0);
  expect(c.q.nextRunAt()).toBeNull();
});
test("handles synchronous throws in the handler", async () => {
  const c = make((p) => { throw new Error("sync"); }, { maxAttempts: 1 });
  c.q.add(1);
  await c.q.runDue();
  expect(c.q.deadLetters[0].error).toBe("sync");
});
test("a failing job does not block the others", async () => {
  const c = make(async (p) => { if (p === "bad") throw new Error("nope"); });
  c.q.add("good1"); c.q.add("bad"); c.q.add("good2");
  expect(await c.q.runDue()).toBe(3);
  expect(c.q.completed).toEqual([1, 3]);
  expect(c.q.pending).toBe(1);
});
test("only runs jobs that are due", async () => {
  let runs = 0;
  const c = make(async () => { runs++; throw new Error("x"); });
  c.q.add("a");
  await c.q.runDue();
  c.t = 500; c.q.add("b");
  expect(await c.q.runDue()).toBe(1);
  expect(runs).toBe(2);
  expect(c.q.nextRunAt()).toBe(1000);
});
test("nextRunAt is null for an empty queue", () => {
  const c = make(async () => {});
  expect(c.q.nextRunAt()).toBeNull();
  expect(c.q.pending).toBe(0);
});`,
    hints: [
      "Each job is just `{ id, payload, attempts, runAt }` in an array. Everything else is bookkeeping around that record.",
      "In `runDue`, read `now()` once, filter and sort the due jobs into a snapshot, then `for...of` with `await` inside a try/catch so jobs run one at a time.",
      "In the catch: if `job.attempts >= maxAttempts`, remove it and push to `deadLetters` with `err.message`; otherwise set `job.runAt = now() + baseDelayMs * 2 ** (job.attempts - 1)`.",
    ],
    solution: `class JobQueue {
  constructor({ handler, maxAttempts = 3, baseDelayMs = 1000, now = Date.now }) {
    this.handler = handler;
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
    this.now = now;
    this.jobs = [];
    this.nextId = 1;
    this.completed = [];
    this.deadLetters = [];
  }

  add(payload) {
    const job = { id: this.nextId++, payload, attempts: 0, runAt: this.now() };
    this.jobs.push(job);
    return job.id;
  }

  get pending() {
    return this.jobs.length;
  }

  nextRunAt() {
    return this.jobs.length ? Math.min(...this.jobs.map((j) => j.runAt)) : null;
  }

  remove(job) {
    this.jobs.splice(this.jobs.indexOf(job), 1);
  }

  async runDue() {
    const t = this.now();
    const due = this.jobs.filter((j) => j.runAt <= t).sort((a, b) => a.runAt - b.runAt || a.id - b.id);

    for (const job of due) {
      job.attempts++;
      try {
        await this.handler(job.payload, job.attempts);
        this.remove(job);
        this.completed.push(job.id);
      } catch (err) {
        if (job.attempts >= this.maxAttempts) {
          this.remove(job);
          this.deadLetters.push({ id: job.id, payload: job.payload, attempts: job.attempts, error: err.message });
        } else {
          job.runAt = this.now() + this.baseDelayMs * 2 ** (job.attempts - 1);
        }
      }
    }
    return due.length;
  }
}`,
    explanation: `Injecting \`now\` and exposing \`runDue\` instead of running a timer loop makes the queue deterministic: tests (and you) can step time forward and watch exactly which attempts happen. A production worker would just call \`runDue\` on an interval or sleep until \`nextRunAt()\`.

Taking a snapshot of due jobs before running them matters. If you looped "while any job is due", a job retried with a zero delay, or a job added by a handler, could run forever inside a single call. Running jobs one at a time with \`await\` inside try/catch also keeps one failing job from stopping the rest.

Exponential backoff spreads retries out so a struggling dependency gets room to recover; real systems add random jitter so thousands of failed jobs do not retry in lockstep. The dead-letter list keeps poison messages from retrying forever while preserving them for debugging.

Follow-up: how would you add a concurrency limit (run up to N jobs at once), or make jobs survive a process restart?`,
  },
  {
    id: "be-base62-shortener",
    title: "Base62 URL shortener codes",
    track: "Backend",
    level: "Easy",
    minutes: 15,
    tags: ["encoding", "math", "strings"],
    prompt: `Your link shortener stores links with auto-increment numeric ids. Short codes are those ids written in base62.

Write \`encodeId(n)\` and \`decodeId(code)\` using the alphabet:

\`\`\`
0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
\`\`\`

- \`encodeId(0)\` is \`"0"\`.
- \`encodeId\` throws \`Error("Invalid id")\` for negative numbers, non-integers, or values above \`Number.MAX_SAFE_INTEGER\`.
- \`decodeId\` throws \`Error("Invalid code")\` for an empty string or any character outside the alphabet.
- Every safe integer must round-trip.

\`\`\`
encodeId(61)    // "Z"
encodeId(62)    // "10"
encodeId(125)   // "21"
decodeId("ZZ")  // 3843
\`\`\``,
    starter: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeId(n) {
  // your code here
}

function decodeId(code) {
  // your code here
}`,
    tests: `test("encodes small numbers", () => {
  expect([0, 9, 10, 35, 36, 61].map(encodeId)).toEqual(["0", "9", "a", "z", "A", "Z"]);
});
test("encodes multi-digit numbers", () => {
  expect(encodeId(62)).toBe("10");
  expect(encodeId(125)).toBe("21");
  expect(encodeId(3843)).toBe("ZZ");
  expect(encodeId(3844)).toBe("100");
});
test("decodes codes", () => {
  expect(decodeId("0")).toBe(0);
  expect(decodeId("ZZ")).toBe(3843);
  expect(decodeId("21")).toBe(125);
});
test("round-trips a range of ids including the largest safe integer", () => {
  for (const n of [1, 61, 62, 999, 123456789, 2 ** 40 + 7, Number.MAX_SAFE_INTEGER]) {
    expect(decodeId(encodeId(n))).toBe(n);
  }
});
test("is case sensitive", () => {
  expect(decodeId("a")).toBe(10);
  expect(decodeId("A")).toBe(36);
});
test("rejects invalid ids", () => {
  expect(() => encodeId(-1)).toThrow("Invalid id");
  expect(() => encodeId(1.5)).toThrow("Invalid id");
  expect(() => encodeId(Number.MAX_SAFE_INTEGER + 2)).toThrow("Invalid id");
});
test("rejects invalid codes", () => {
  expect(() => decodeId("")).toThrow("Invalid code");
  expect(() => decodeId("ab-c")).toThrow("Invalid code");
});`,
    hints: [
      "This is the same as converting to binary or hex, just with 62 digits.",
      "Encode by repeatedly taking `n % 62` as the next digit (from the right) and dividing `n` by 62 with `Math.floor`.",
      "Decode left to right: `n = n * 62 + ALPHABET.indexOf(ch)`, throwing when `indexOf` returns -1. Handle `0` specially in encode, since the loop never runs.",
    ],
    solution: `const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function encodeId(n) {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid id");
  if (n === 0) return "0";
  let code = "";
  while (n > 0) {
    code = ALPHABET[n % 62] + code;
    n = Math.floor(n / 62);
  }
  return code;
}

function decodeId(code) {
  if (!code) throw new Error("Invalid code");
  let n = 0;
  for (const ch of code) {
    const digit = ALPHABET.indexOf(ch);
    if (digit === -1) throw new Error("Invalid code");
    n = n * 62 + digit;
  }
  return n;
}`,
    explanation: `Base conversion works the same in any base: the remainder of dividing by the base is the lowest digit, and integer division shifts everything right by one digit. Decoding reverses it with Horner's method, multiplying the running total by 62 before adding each digit.

Both directions are O(log62 n), so an 11-character code covers every safe integer. \`Number.isSafeInteger\` rejects negatives' cousins (fractions, \`NaN\`, \`Infinity\`) and values where floating point would silently lose precision.

Common mistakes: forgetting the \`0\` case (the loop produces an empty string), building the string in the wrong order, and using \`%\` on numbers beyond 2^53, where results are no longer exact. For bigger ids you would switch to \`BigInt\`.

Follow-up: sequential ids make codes guessable and leak your volume. How would you make codes look random but stay collision-free? (Hint: a reversible permutation of the id, such as multiplying by a large odd number modulo 2^k.)`,
  },
  {
    id: "be-csv-parser",
    title: "CSV parser with quoted fields",
    track: "Backend",
    level: "Medium",
    minutes: 35,
    tags: ["parsing", "strings", "state machine"],
    prompt: `Customers upload CSV exports from spreadsheets, and \`line.split(",")\` keeps breaking on addresses like \`"12 Main St, Apt 4"\`. Write a real parser.

\`parseCSV(text, { header = false } = {})\` returns an array of rows, each an array of strings.

- Fields are separated by \`,\` and rows by \`\\n\` or \`\\r\\n\`.
- A field wrapped in double quotes may contain commas, newlines, and \`""\` (an escaped quote).
- Empty fields are kept: \`a,,b\` is \`["a", "", "b"]\`.
- A trailing newline at the end of the text does not create an extra row. Empty input returns \`[]\`.
- An unterminated quoted field throws \`Error("Unterminated quote")\`.
- With \`{ header: true }\`, the first row is the header and the result is an array of objects. Missing trailing fields become \`""\`.

\`\`\`
parseCSV('name,note\\n"Ana","said ""hi"", then left"\\n')
// [["name", "note"], ["Ana", 'said "hi", then left']]
parseCSV("id,name\\n1,Ana", { header: true })
// [{ id: "1", name: "Ana" }]
\`\`\``,
    starter: `function parseCSV(text, { header = false } = {}) {
  // your code here
}`,
    tests: `test("returns [] for empty input", () => {
  expect(parseCSV("")).toEqual([]);
});
test("parses simple rows", () => {
  expect(parseCSV("a,b,c\\n1,2,3")).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
});
test("keeps empty fields, including at the end of a row", () => {
  expect(parseCSV("a,,b\\n,x,")).toEqual([["a", "", "b"], ["", "x", ""]]);
});
test("handles commas inside quotes", () => {
  expect(parseCSV('name,address\\nAna,"12 Main St, Apt 4"')).toEqual([["name", "address"], ["Ana", "12 Main St, Apt 4"]]);
});
test("handles escaped quotes", () => {
  expect(parseCSV('"said ""hi"""')).toEqual([['said "hi"']]);
});
test("handles newlines inside quotes", () => {
  expect(parseCSV('id,bio\\n1,"line one\\nline two"\\n2,short')).toEqual([["id", "bio"], ["1", "line one\\nline two"], ["2", "short"]]);
});
test("accepts CRLF line endings and ignores a trailing newline", () => {
  expect(parseCSV("a,b\\r\\n1,2\\r\\n")).toEqual([["a", "b"], ["1", "2"]]);
});
test("keeps an empty quoted field", () => {
  expect(parseCSV('""\\nx')).toEqual([[""], ["x"]]);
});
test("throws on an unterminated quote", () => {
  expect(() => parseCSV('a,"oops\\nb')).toThrow("Unterminated quote");
});
test("maps rows to objects with header: true", () => {
  expect(parseCSV('id,name,email\\n1,Ana,a@x.com\\n2,"Bo, Jr."', { header: true })).toEqual([
    { id: "1", name: "Ana", email: "a@x.com" },
    { id: "2", name: "Bo, Jr.", email: "" },
  ]);
});`,
    hints: [
      "Splitting on commas or newlines first cannot work, because quotes change the meaning of both. Walk the text one character at a time with an `inQuotes` flag.",
      "Inside quotes, a `\"` followed by another `\"` is a literal quote (skip both); a lone `\"` ends the quoted section. Outside quotes, `,` ends a field and `\\r\\n` or `\\n` ends a row.",
      "At the end, push the last field and row only if the current row has any content (track the index where the row started), and throw if `inQuotes` is still true.",
    ],
    solution: `function parseCSV(text, { header = false } = {}) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let rowStart = 0;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i++;
      } else {
        field += ch;
        i++;
      }
    } else if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ",") {
      row.push(field);
      field = "";
      i++;
    } else if (ch === "\\n" || ch === "\\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += ch === "\\r" && text[i + 1] === "\\n" ? 2 : 1;
      rowStart = i;
    } else {
      field += ch;
      i++;
    }
  }

  if (inQuotes) throw new Error("Unterminated quote");
  if (i > rowStart) {
    row.push(field);
    rows.push(row);
  }

  if (!header) return rows;
  const [head = [], ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((name, j) => [name, r[j] ?? ""])));
}`,
    explanation: `CSV is a tiny state machine with two states, inside and outside quotes. Commas and newlines only mean something outside quotes, which is why splitting first can never handle real files. A single pass is O(n) time and O(n) space for the output.

The escaped quote is the subtle part: inside a quoted field, \`""\` is one literal quote, while a single \`"\` closes the field. Looking one character ahead handles both. Tracking where the current row started lets you tell "the text ended with a newline" (no extra row) apart from "the last row is a single empty quoted field".

Common mistakes: forgetting \`\\r\\n\`, dropping trailing empty fields, and silently accepting an unterminated quote, which swallows the rest of the file into one field.

Follow-up: how would you stream a 2 GB upload without holding it all in memory? Keep the same state machine but feed it chunks, carrying \`field\`, \`row\` and \`inQuotes\` across chunk boundaries.`,
  },
);
