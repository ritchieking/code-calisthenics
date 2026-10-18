(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "async-task-queue",
    title: "Pausable upload queue",
    track: "Async & data",
    level: "Medium",
    minutes: 25,
    tags: ["promises", "queues"],
    prompt: `A file uploader sends one file at a time so a slow connection isn't saturated. Users can pause the queue (the current file finishes) and resume later.

Implement \`class TaskQueue\` with concurrency 1:

- \`add(task)\` takes a function that returns a value or a promise. It returns a promise that settles with that task's outcome
- tasks run **one at a time, in the order added**. A task starts as soon as the queue is free
- a task that rejects (or throws) rejects only its own promise. The queue moves on to the next task
- \`pause()\`: the running task keeps going, but no new task starts
- \`resume()\`: starts running waiting tasks again
- \`size\` (a getter): the number of tasks **waiting**, not counting the one running

\`\`\`js
const queue = new TaskQueue();
const a = queue.add(() => upload(fileA));
const b = queue.add(() => upload(fileB)); // starts after fileA finishes
queue.pause();                            // fileA finishes, fileB waits
queue.resume();                           // fileB starts
\`\`\``,
    starter: `class TaskQueue {
  add(task) {
    // your code here
  }

  pause() {
    // your code here
  }

  resume() {
    // your code here
  }

  get size() {
    // your code here
  }
}`,
    tests: `const later = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));

test("runs tasks one at a time, in order", async () => {
  const q = new TaskQueue();
  const log = [];
  let active = 0, peak = 0;
  const job = (name, ms) => async () => {
    active++; peak = Math.max(peak, active);
    log.push(name);
    await later(null, ms);
    active--;
  };
  await Promise.all([q.add(job("a", 15)), q.add(job("b", 5)), q.add(job("c", 1))]);
  expect(log).toEqual(["a", "b", "c"]);
  expect(peak).toBe(1);
});

test("add() resolves with the task's result", async () => {
  const q = new TaskQueue();
  expect(await q.add(() => later("uploaded", 5))).toBe("uploaded");
  expect(await q.add(() => 42)).toBe(42);
});

test("a failing task rejects its own promise and later tasks still run", async () => {
  const q = new TaskQueue();
  const bad = q.add(async () => { throw new Error("file too large"); });
  const good = q.add(() => later("ok", 5));
  await rejects(bad, "file too large");
  expect(await good).toBe("ok");
});

test("a task that throws synchronously is handled the same way", async () => {
  const q = new TaskQueue();
  const bad = q.add(() => { throw new Error("sync boom"); });
  await rejects(bad, "sync boom");
  expect(await q.add(() => "next")).toBe("next");
});

test("pause() lets the running task finish but starts no new ones", async () => {
  const q = new TaskQueue();
  const done = [];
  q.add(() => later("a", 20).then((v) => done.push(v)));
  q.add(() => later("b", 5).then((v) => done.push(v)));
  await sleep(5);
  q.pause();
  await sleep(50);
  expect(done).toEqual(["a"]);
  expect(q.size).toBe(1);
});

test("resume() continues with the waiting tasks", async () => {
  const q = new TaskQueue();
  const done = [];
  q.add(() => later("a", 10).then((v) => done.push(v)));
  const b = q.add(() => later("b", 5).then((v) => done.push(v)));
  q.pause();
  await sleep(30);
  expect(done).toEqual(["a"]);
  q.resume();
  await b;
  expect(done).toEqual(["a", "b"]);
});

test("tasks added while paused wait for resume()", async () => {
  const q = new TaskQueue();
  q.pause();
  let started = false;
  const p = q.add(() => { started = true; return "ran"; });
  await sleep(20);
  expect(started).toBe(false);
  q.resume();
  expect(await p).toBe("ran");
});

test("size counts waiting tasks, not the running one", async () => {
  const q = new TaskQueue();
  q.add(() => later(1, 30));
  q.add(() => later(2, 5));
  q.add(() => later(3, 5));
  await sleep(0);
  expect(q.size).toBe(2);
});

test("an idle queue starts a new task right away", async () => {
  const q = new TaskQueue();
  await q.add(() => "first");
  let started = false;
  q.add(() => { started = true; });
  await sleep(0);
  expect(started).toBe(true);
});`,
    hints: [
      "You need a list of waiting tasks plus two flags: is something running, and is the queue paused.",
      "`add` pushes `{ task, resolve, reject }` onto an array inside a `new Promise` and then calls a `next()` helper. `next()` returns early if running, paused, or empty.",
      "In `next()`, shift a job, set running, and run `Promise.resolve().then(job.task).then(job.resolve, job.reject).finally(() => { running = false; next(); })`. `resume()` clears the flag and calls `next()`.",
    ],
    solution: `class TaskQueue {
  #waiting = [];
  #running = false;
  #paused = false;

  add(task) {
    return new Promise((resolve, reject) => {
      this.#waiting.push({ task, resolve, reject });
      this.#next();
    });
  }

  pause() {
    this.#paused = true;
  }

  resume() {
    this.#paused = false;
    this.#next();
  }

  get size() {
    return this.#waiting.length;
  }

  #next() {
    if (this.#running || this.#paused || this.#waiting.length === 0) return;
    const { task, resolve, reject } = this.#waiting.shift();
    this.#running = true;
    // Promise.resolve().then(task) turns sync throws into rejections too.
    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        this.#running = false;
        this.#next();
      });
  }
}`,
    explanation: `The queue stores each task together with the \`resolve\` and \`reject\` of the promise returned by \`add\`. That way the caller's promise settles when *their* task finishes, however long it waited in line.

A single \`#next()\` method holds all the scheduling rules: do nothing if something is running, the queue is paused, or nothing is waiting. It is called from the three places where those conditions can change: after \`add\`, after \`resume\`, and after a task settles. Pausing only flips a flag, which is why the running task finishes naturally.

Running the task through \`Promise.resolve().then(task)\` catches synchronous throws as well as rejections, so one bad task can't stall the queue. \`add\` and \`next\` are O(1) apart from \`shift\`, which is fine for UI-sized queues. A ring buffer or index pointer would make it O(1) for huge ones.

Follow-up: generalize to \`concurrency: n\`. (Replace the boolean with a running count and loop in \`#next()\` while \`running < n\`.)`,
  },

  {
    id: "async-event-emitter",
    title: "Build an event emitter",
    track: "Async & data",
    level: "Medium",
    minutes: 25,
    tags: ["events", "pub-sub"],
    prompt: `Your live dashboard receives socket messages in one place and several widgets react to them. A small event emitter connects them.

Implement \`class EventEmitter\`:

- \`on(event, listener)\` registers a listener and returns an **unsubscribe** function
- \`off(event, listener)\` removes that listener. It can also remove a \`once\` listener when given the original function
- \`once(event, listener)\` registers a listener that runs at most once, and also returns an unsubscribe function
- \`emit(event, ...args)\` calls the event's listeners in registration order with \`args\`. Returns \`true\` if there were any listeners, \`false\` otherwise
- \`listenerCount(event)\` returns how many listeners are registered

During an \`emit\`, use the listener list as it was when the emit started. A listener that removes itself must not cause the next one to be skipped, and a listener added during an emit runs from the next emit on.

\`\`\`js
const bus = new EventEmitter();
const stop = bus.on("price", (sym, value) => render(sym, value));
bus.emit("price", "ACME", 41.2); // true
stop();
bus.emit("price", "ACME", 41.5); // false
\`\`\``,
    starter: `class EventEmitter {
  on(event, listener) {
    // your code here
  }

  off(event, listener) {
    // your code here
  }

  once(event, listener) {
    // your code here
  }

  emit(event, ...args) {
    // your code here
  }

  listenerCount(event) {
    // your code here
  }
}`,
    tests: `test("calls listeners with the arguments, in registration order", () => {
  const bus = new EventEmitter(), log = [];
  bus.on("price", (s, v) => log.push("a " + s + " " + v));
  bus.on("price", (s, v) => log.push("b " + s + " " + v));
  bus.emit("price", "ACME", 41);
  expect(log).toEqual(["a ACME 41", "b ACME 41"]);
});

test("emit returns whether there were listeners", () => {
  const bus = new EventEmitter();
  expect(bus.emit("nobody")).toBe(false);
  bus.on("x", () => {});
  expect(bus.emit("x")).toBe(true);
});

test("off removes a listener", () => {
  const bus = new EventEmitter();
  let calls = 0;
  const fn = () => calls++;
  bus.on("tick", fn);
  bus.off("tick", fn);
  expect(bus.emit("tick")).toBe(false);
  expect(calls).toBe(0);
});

test("on returns an unsubscribe function", () => {
  const bus = new EventEmitter();
  let calls = 0;
  const stop = bus.on("tick", () => calls++);
  bus.emit("tick");
  stop();
  bus.emit("tick");
  expect(calls).toBe(1);
});

test("once listeners fire only once", () => {
  const bus = new EventEmitter(), seen = [];
  bus.once("ready", (v) => seen.push(v));
  bus.emit("ready", 1);
  bus.emit("ready", 2);
  expect(seen).toEqual([1]);
  expect(bus.listenerCount("ready")).toBe(0);
});

test("off removes a once listener given the original function", () => {
  const bus = new EventEmitter();
  let calls = 0;
  const fn = () => calls++;
  bus.once("ready", fn);
  bus.off("ready", fn);
  bus.emit("ready");
  expect(calls).toBe(0);
});

test("a listener that removes itself does not make the next one skip", () => {
  const bus = new EventEmitter(), log = [];
  const first = () => { log.push("first"); bus.off("msg", first); };
  bus.on("msg", first);
  bus.on("msg", () => log.push("second"));
  bus.emit("msg");
  expect(log).toEqual(["first", "second"]);
});

test("a listener added during emit runs from the next emit", () => {
  const bus = new EventEmitter(), log = [];
  bus.once("msg", () => { log.push("outer"); bus.on("msg", () => log.push("inner")); });
  bus.emit("msg");
  expect(log).toEqual(["outer"]);
  bus.emit("msg");
  expect(log).toEqual(["outer", "inner"]);
});

test("listenerCount reports registered listeners", () => {
  const bus = new EventEmitter();
  expect(bus.listenerCount("a")).toBe(0);
  bus.on("a", () => {});
  bus.once("a", () => {});
  expect(bus.listenerCount("a")).toBe(2);
});

test("events are independent", () => {
  const bus = new EventEmitter(), log = [];
  bus.on("a", () => log.push("a"));
  bus.on("b", () => log.push("b"));
  bus.emit("b");
  expect(log).toEqual(["b"]);
});`,
    hints: [
      "Store a `Map` from event name to an array of listener functions. Most bugs come from editing that array while iterating it.",
      "In `emit`, loop over a copy (`[...list]`) so removals and additions during the loop don't affect this emit.",
      "For `once`, register a wrapper that calls `off` and then the original, and set `wrapper.original = listener`. In `off`, remove the first entry where `l === listener || l.original === listener`.",
    ],
    solution: `class EventEmitter {
  #listeners = new Map();

  on(event, listener) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    const list = this.#listeners.get(event);
    if (!list) return;
    const i = list.findIndex((l) => l === listener || l.original === listener);
    if (i !== -1) list.splice(i, 1);
  }

  once(event, listener) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      listener.apply(this, args);
    };
    wrapper.original = listener;
    return this.on(event, wrapper);
  }

  emit(event, ...args) {
    const list = this.#listeners.get(event);
    if (!list || list.length === 0) return false;
    // Iterate a snapshot so listeners can add/remove safely.
    for (const listener of [...list]) listener.apply(this, args);
    return true;
  }

  listenerCount(event) {
    const list = this.#listeners.get(event);
    return list ? list.length : 0;
  }
}`,
    explanation: `An emitter is a map from event names to arrays of listeners. \`on\` appends, \`emit\` calls each in order, and returning a closure that calls \`off\` gives the convenient unsubscribe pattern that React effects and many APIs expect.

The interesting part is mutation during emit. If you iterate the live array and a listener splices itself out, every later element shifts left and the loop skips one. Iterating a snapshot (\`[...list]\`) fixes both that and the "added during emit" case. The copy costs O(k) per emit for k listeners, which is the same order as calling them anyway.

\`once\` is implemented as a wrapper that unregisters itself before calling through. Tagging the wrapper with \`original\` lets \`off(event, fn)\` find it, which is a detail many candidates miss.

Follow-up: what happens if a listener throws? (Here the error propagates and later listeners don't run. Node's emitter behaves the same. Some buses catch per listener and report errors separately so one broken widget can't stop the others.)`,
  },

  {
    id: "async-latest-only",
    title: "Ignore stale search responses",
    track: "Async & data",
    level: "Medium",
    minutes: 20,
    tags: ["promises", "race-conditions", "search"],
    prompt: `In a search-as-you-type box, the request for \`"re"\` sometimes comes back after the request for \`"react"\`, and the results flicker back to the wrong list.

Write \`latestOnly(fn)\`, where \`fn\` returns a promise. It returns a wrapped function with the same arguments:

- every call still calls \`fn\` (this wrapper doesn't cancel anything) and returns a promise
- only the **most recent** call's promise settles, with \`fn\`'s value or error
- once a newer call starts, older calls are **superseded**: their promises never settle, whether \`fn\` resolves or rejects, and whichever finishes first
- \`this\` and all arguments are passed through to \`fn\`

\`\`\`js
const search = latestOnly((q) => api.search(q));
search("re").then(render);    // never renders: superseded
search("react").then(render); // renders the "react" results
\`\`\``,
    starter: `function latestOnly(fn) {
  // your code here
}`,
    tests: `function fakeApi(delays) {
  const calls = [];
  const fn = (q) => {
    calls.push(q);
    return new Promise((resolve, reject) => setTimeout(() => {
      if (q === "fail") reject(new Error("search failed"));
      else resolve("results for " + q);
    }, delays[q] ?? 5));
  };
  return { fn, calls };
}
function track(p, log) {
  p.then((v) => log.push(v), (e) => log.push("error: " + e.message));
}

test("resolves normally when there is only one call", async () => {
  const { fn } = fakeApi({});
  const search = latestOnly(fn);
  expect(await search("react")).toBe("results for react");
});

test("ignores a slow older response that lands after a newer one", async () => {
  const { fn } = fakeApi({ re: 40, react: 5 });
  const search = latestOnly(fn), log = [];
  track(search("re"), log);
  track(search("react"), log);
  await sleep(70);
  expect(log).toEqual(["results for react"]);
});

test("ignores an older response even when it lands first", async () => {
  const { fn } = fakeApi({ re: 5, react: 30 });
  const search = latestOnly(fn), log = [];
  track(search("re"), log);
  track(search("react"), log);
  await sleep(15);
  expect(log).toEqual([]);
  await sleep(40);
  expect(log).toEqual(["results for react"]);
});

test("still calls fn for every call", async () => {
  const { fn, calls } = fakeApi({});
  const search = latestOnly(fn);
  search("r"); search("re");
  await search("rea");
  expect(calls).toEqual(["r", "re", "rea"]);
});

test("rejects when the latest call fails", async () => {
  const { fn } = fakeApi({});
  const search = latestOnly(fn);
  await rejects(search("fail"), "search failed");
});

test("swallows errors from superseded calls", async () => {
  const { fn } = fakeApi({ fail: 5, react: 20 });
  const search = latestOnly(fn), log = [];
  track(search("fail"), log);
  track(search("react"), log);
  await sleep(50);
  expect(log).toEqual(["results for react"]);
});

test("calls made after the previous one settled each resolve", async () => {
  const { fn } = fakeApi({});
  const search = latestOnly(fn);
  expect(await search("a")).toBe("results for a");
  expect(await search("b")).toBe("results for b");
});

test("passes this and every argument through", async () => {
  const client = {
    prefix: "v2",
    search: latestOnly(async function (q, page) { return this.prefix + ":" + q + ":" + page; }),
  };
  expect(await client.search("hooks", 3)).toBe("v2:hooks:3");
});`,
    hints: [
      "Give each call an increasing id and remember the id of the latest one.",
      "Each call returns `new Promise(...)` that it only settles if its id is still the latest when `fn` finishes.",
      "Use `const id = ++latest;` then `fn.apply(this, args).then(v => { if (id === latest) resolve(v); }, e => { if (id === latest) reject(e); })`. Return a regular function to keep `this`.",
    ],
    solution: `function latestOnly(fn) {
  let latest = 0;
  return function (...args) {
    const id = ++latest;
    return new Promise((resolve, reject) => {
      (async () => fn.apply(this, args))().then(
        (value) => { if (id === latest) resolve(value); },
        (error) => { if (id === latest) reject(error); },
      );
    });
  };
}`,
    explanation: `The bug this solves is a race: responses arrive in a different order than requests were sent. A monotonically increasing counter tells each response whether it still belongs to the newest request. If not, it is dropped. This is what "takeLatest" in Redux-Saga and RxJS's \`switchMap\` do.

Leaving superseded promises pending is a deliberate choice: the UI code chained on them never runs, so you don't need \`if (stale) return\` checks everywhere. Pending promises with no references are garbage collected, so this doesn't leak.

Each call is O(1). A common incorrect fix is comparing the query string ("is the input still \`re\`?"), which breaks when the user types \`re\`, \`rea\`, then back to \`re\`. Another is only guarding the success path and letting stale errors show an error banner.

Follow-up: this still downloads every response. Combine it with \`AbortController\` so starting a new call aborts the previous request. Which errors would you then need to ignore?`,
  },

  {
    id: "async-reorder-sequence",
    title: "Reorder out-of-sequence live updates",
    track: "Async & data",
    level: "Medium",
    minutes: 30,
    tags: ["streams", "buffers", "realtime"],
    prompt: `A collaborative editor receives operations over several connections, each tagged with a sequence number. They can arrive out of order or twice, but they must be applied exactly once, in order.

Write \`createSequencer(onMessage, options)\`, where \`options\` has \`start\` (default \`1\`, the first expected seq) and \`maxBuffer\` (default \`Infinity\`). It returns:

- \`push(message)\`, where \`message\` is \`{ seq, ...data }\`:
  - if \`seq\` is the next expected number, call \`onMessage(message)\`, then deliver any buffered messages that are now in order
  - if it's ahead, buffer it
  - if it was already delivered or is already buffered, ignore it (the first copy wins)
- \`pending\` (a getter): how many messages are buffered

If the buffer would grow beyond \`maxBuffer\`, assume the missing messages are lost. Jump ahead to the smallest buffered seq and deliver from there as far as it is contiguous. Anything older that shows up later is ignored.

\`\`\`js
const seq = createSequencer(apply);
seq.push({ seq: 2, op: "b" }); // buffered
seq.push({ seq: 1, op: "a" }); // apply(1), then apply(2)
seq.push({ seq: 2, op: "b" }); // duplicate, ignored
\`\`\``,
    starter: `function createSequencer(onMessage, { start = 1, maxBuffer = Infinity } = {}) {
  // your code here
}`,
    tests: `function setup(opts) {
  const got = [];
  const s = createSequencer((m) => got.push(m.seq), opts);
  return { s, got };
}
const msg = (seq, extra = {}) => ({ seq, op: "op" + seq, ...extra });

test("delivers in-order messages right away", () => {
  const { s, got } = setup();
  s.push(msg(1)); s.push(msg(2)); s.push(msg(3));
  expect(got).toEqual([1, 2, 3]);
});

test("holds out-of-order messages until the gap is filled", () => {
  const { s, got } = setup();
  s.push(msg(3)); s.push(msg(2));
  expect(got).toEqual([]);
  s.push(msg(1));
  expect(got).toEqual([1, 2, 3]);
});

test("ignores duplicates and already-delivered messages", () => {
  const { s, got } = setup();
  [1, 1, 2, 1, 3, 3].forEach((n) => s.push(msg(n)));
  expect(got).toEqual([1, 2, 3]);
});

test("keeps the first copy of a buffered duplicate", () => {
  const seen = [];
  const s = createSequencer((m) => seen.push(m.op));
  s.push(msg(2, { op: "first copy" }));
  s.push(msg(2, { op: "second copy" }));
  s.push(msg(1));
  expect(seen).toEqual(["op1", "first copy"]);
});

test("pending counts buffered messages", () => {
  const { s } = setup();
  expect(s.pending).toBe(0);
  s.push(msg(4)); s.push(msg(2));
  expect(s.pending).toBe(2);
  s.push(msg(1));
  expect(s.pending).toBe(1);
});

test("respects a custom start", () => {
  const { s, got } = setup({ start: 100 });
  s.push(msg(99)); s.push(msg(101)); s.push(msg(100));
  expect(got).toEqual([100, 101]);
});

test("passes the whole message to onMessage", () => {
  const seen = [];
  const s = createSequencer((m) => seen.push(m));
  s.push({ seq: 1, user: "ana", text: "hi" });
  expect(seen).toEqual([{ seq: 1, user: "ana", text: "hi" }]);
});

test("skips a lost message when the buffer overflows", () => {
  const { s, got } = setup({ maxBuffer: 2 });
  s.push(msg(3)); s.push(msg(4));
  expect(got).toEqual([]);
  s.push(msg(5));
  expect(got).toEqual([3, 4, 5]);
  s.push(msg(1));
  s.push(msg(6));
  expect(got).toEqual([3, 4, 5, 6]);
});

test("after skipping, delivers only the contiguous run", () => {
  const { s, got } = setup({ maxBuffer: 2 });
  s.push(msg(3)); s.push(msg(5)); s.push(msg(6));
  expect(got).toEqual([3]);
  expect(s.pending).toBe(2);
  s.push(msg(4));
  expect(got).toEqual([3, 4, 5, 6]);
});`,
    hints: [
      "Track `next`, the seq you expect, and keep early arrivals in a `Map` keyed by seq.",
      "On push, ignore `seq < next` or anything already in the map. Otherwise store it and drain: `while (buffer.has(next))` deliver it, delete it, and increment `next`.",
      "After draining, if `buffer.size > maxBuffer`, set `next = Math.min(...buffer.keys())` and drain again.",
    ],
    solution: `function createSequencer(onMessage, { start = 1, maxBuffer = Infinity } = {}) {
  let next = start;
  const buffer = new Map(); // seq -> message

  function drain() {
    while (buffer.has(next)) {
      const message = buffer.get(next);
      buffer.delete(next);
      next++;
      onMessage(message);
    }
  }

  return {
    push(message) {
      if (message.seq < next || buffer.has(message.seq)) return;
      buffer.set(message.seq, message);
      drain();
      if (buffer.size > maxBuffer) {
        // Give up on the gap: resume from the oldest message we do have.
        next = Math.min(...buffer.keys());
        drain();
      }
    },
    get pending() {
      return buffer.size;
    },
  };
}`,
    explanation: `This is the same idea TCP uses to rebuild a byte stream: a "next expected" pointer plus a buffer for packets that arrived early. Putting the in-order message into the buffer and then draining keeps the code to one path: delivery always happens in the \`while\` loop, which also releases anything that was waiting behind it.

Deduplication falls out of the same state. Anything below \`next\` was delivered, and anything in the map is already waiting. A \`Map\` gives O(1) lookups, so each message is handled in amortized O(1). The overflow rule scans the buffer once, O(maxBuffer), and only when overflow happens.

The overflow policy matters in real systems. Without it, one lost message freezes the stream forever and memory grows without bound. Jumping to the oldest buffered seq trades a visible gap for liveness. A real app would also request a fresh snapshot when that happens.

Common mistakes: delivering only the message that fills the gap and forgetting the buffered ones behind it, and letting a late duplicate overwrite a buffered copy. Follow-up: how would you add a time-based rule, skipping a gap after it has been open for 2 seconds?`,
  },

  {
    id: "async-dataloader",
    title: "Batch loads within a tick",
    track: "Async & data",
    level: "Hard",
    minutes: 45,
    tags: ["batching", "caching", "graphql"],
    prompt: `A GraphQL resolver for a feed calls \`loadUser(id)\` once per post. With 50 posts, that's 50 database queries. A DataLoader collects the loads made during the same tick and sends one batched query.

Implement \`class DataLoader\`:

- \`new DataLoader(batchFn, { maxBatchSize = Infinity })\`, where \`batchFn(keys)\` returns a promise for an array of values, **one per key, in the same order**. A value that is an \`Error\` instance means that key failed
- \`load(key)\` returns a promise for that key's value
  - all \`load\` calls made in the same synchronous run of code go into **one** \`batchFn\` call, dispatched afterwards (in a microtask is fine)
  - batches larger than \`maxBatchSize\` are split into several \`batchFn\` calls
  - results are cached by key: loading the same key again (in the same batch or later) returns the same promise and doesn't add the key again
- if \`batchFn\` rejects, or returns something that isn't an array of the right length, every key in that batch rejects
- keys that fail (for any reason) are removed from the cache, so a later \`load\` retries them
- \`clear(key)\` removes a key from the cache

\`\`\`js
const users = new DataLoader((ids) => db.users.findMany(ids));
const [a, b] = await Promise.all([users.load(1), users.load(2)]);
// one call: batchFn([1, 2])
\`\`\``,
    starter: `class DataLoader {
  constructor(batchFn, { maxBatchSize = Infinity } = {}) {
    // your code here
  }

  load(key) {
    // your code here
  }

  clear(key) {
    // your code here
  }
}`,
    tests: `function makeBatch(fn = (keys) => keys.map((k) => "user " + k)) {
  const batches = [];
  let failNext = false;
  const batchFn = async (keys) => {
    batches.push(keys);
    await sleep(2);
    if (failNext) { failNext = false; throw new Error("db down"); }
    return fn(keys);
  };
  return { batchFn, batches, failOnce: () => { failNext = true; } };
}

test("batches loads from the same tick into one call", async () => {
  const { batchFn, batches } = makeBatch();
  const loader = new DataLoader(batchFn);
  await Promise.all([loader.load(1), loader.load(2), loader.load(3)]);
  expect(batches).toEqual([[1, 2, 3]]);
});

test("resolves each key with its own value", async () => {
  const { batchFn } = makeBatch();
  const loader = new DataLoader(batchFn);
  const [a, b] = await Promise.all([loader.load(7), loader.load(9)]);
  expect(a).toBe("user 7");
  expect(b).toBe("user 9");
});

test("a repeated key is loaded once and shares the promise", async () => {
  const { batchFn, batches } = makeBatch();
  const loader = new DataLoader(batchFn);
  const p1 = loader.load(1), p2 = loader.load(1);
  expect(p1).toBe(p2);
  await p1;
  expect(batches).toEqual([[1]]);
});

test("caches results for later loads", async () => {
  const { batchFn, batches } = makeBatch();
  const loader = new DataLoader(batchFn);
  await loader.load(1);
  expect(await loader.load(1)).toBe("user 1");
  expect(batches).toHaveLength(1);
});

test("loads in a later tick go into a new batch", async () => {
  const { batchFn, batches } = makeBatch();
  const loader = new DataLoader(batchFn);
  await loader.load(1);
  await loader.load(2);
  expect(batches).toEqual([[1], [2]]);
});

test("an Error in the results rejects only that key", async () => {
  const { batchFn } = makeBatch((keys) => keys.map((k) => (k === 2 ? new Error("user 2 not found") : "user " + k)));
  const loader = new DataLoader(batchFn);
  const p1 = loader.load(1), p2 = loader.load(2);
  expect(await p1).toBe("user 1");
  await rejects(p2, "user 2 not found");
});

test("a failed batch rejects every key, and they can be retried", async () => {
  const { batchFn, batches, failOnce } = makeBatch();
  const loader = new DataLoader(batchFn);
  failOnce();
  const p1 = loader.load(1), p2 = loader.load(2);
  await rejects(p1, "db down");
  await rejects(p2, "db down");
  expect(await loader.load(1)).toBe("user 1");
  expect(batches).toEqual([[1, 2], [1]]);
});

test("a result of the wrong length rejects the whole batch", async () => {
  const { batchFn } = makeBatch((keys) => keys.slice(1).map((k) => "user " + k));
  const loader = new DataLoader(batchFn);
  const p1 = loader.load(1), p2 = loader.load(2);
  await rejects(p1);
  await rejects(p2);
});

test("splits batches larger than maxBatchSize", async () => {
  const { batchFn, batches } = makeBatch();
  const loader = new DataLoader(batchFn, { maxBatchSize: 2 });
  const out = await Promise.all([1, 2, 3, 4, 5].map((k) => loader.load(k)));
  expect(batches).toEqual([[1, 2], [3, 4], [5]]);
  expect(out).toEqual(["user 1", "user 2", "user 3", "user 4", "user 5"]);
});

test("clear(key) makes the next load fetch again", async () => {
  const { batchFn, batches } = makeBatch();
  const loader = new DataLoader(batchFn);
  await loader.load(1);
  loader.clear(1);
  await loader.load(1);
  expect(batches).toEqual([[1], [1]]);
});`,
    hints: [
      "There are two pieces of state: a cache of key to promise, and a queue of `{ key, resolve, reject }` waiting for the next dispatch.",
      "In `load`, return the cached promise if there is one. Otherwise create a promise, push its resolvers onto the queue, and if the queue was empty, `queueMicrotask(dispatch)`. `dispatch` takes the whole queue, resets it, and slices it into chunks of `maxBatchSize`.",
      "For each chunk, `await batchFn(keys)` in a try/catch, check that it is an array of the right length, then resolve or reject each entry by index (`value instanceof Error`). Attach `promise.catch(() => { if (cache.get(key) === promise) cache.delete(key); })` when you create each promise.",
    ],
    solution: `class DataLoader {
  #batchFn;
  #maxBatchSize;
  #cache = new Map(); // key -> promise
  #queue = [];        // { key, resolve, reject } waiting for dispatch

  constructor(batchFn, { maxBatchSize = Infinity } = {}) {
    this.#batchFn = batchFn;
    this.#maxBatchSize = maxBatchSize;
  }

  load(key) {
    if (this.#cache.has(key)) return this.#cache.get(key);
    const promise = new Promise((resolve, reject) => {
      this.#queue.push({ key, resolve, reject });
      if (this.#queue.length === 1) queueMicrotask(() => this.#dispatch());
    });
    this.#cache.set(key, promise);
    // Failed keys leave the cache so they can be retried.
    promise.catch(() => {
      if (this.#cache.get(key) === promise) this.#cache.delete(key);
    });
    return promise;
  }

  clear(key) {
    this.#cache.delete(key);
  }

  #dispatch() {
    const queue = this.#queue;
    this.#queue = [];
    for (let i = 0; i < queue.length; i += this.#maxBatchSize) {
      this.#run(queue.slice(i, i + this.#maxBatchSize));
    }
  }

  async #run(batch) {
    try {
      const values = await this.#batchFn(batch.map((entry) => entry.key));
      if (!Array.isArray(values) || values.length !== batch.length) {
        throw new Error("batchFn must return an array with one value per key");
      }
      batch.forEach((entry, i) => {
        if (values[i] instanceof Error) entry.reject(values[i]);
        else entry.resolve(values[i]);
      });
    } catch (err) {
      batch.forEach((entry) => entry.reject(err));
    }
  }
}`,
    explanation: `Batching works because of how the event loop schedules work. All the \`load\` calls a resolver makes run synchronously, one after another. The first one schedules a microtask, which only runs after the current synchronous code finishes, so by the time \`dispatch\` runs, every key from that pass is in the queue.

The cache stores promises rather than values, so a duplicate key in the same batch gets the existing promise and is never sent twice. Removing a failed key (with an identity check, so \`clear\` plus a newer load isn't clobbered) avoids caching errors forever. Validating the result length guards against the most common real bug in batch functions: a SQL \`WHERE id IN (...)\` query that silently drops missing rows and shifts every result.

Each load is O(1) and each batch is O(k). In GraphQL servers, you create one loader per request so the cache never leaks data between users.

Follow-up: databases return rows in arbitrary order. How would you write \`batchFn\` to map rows back to keys? (Build a \`Map\` from id to row, then \`keys.map(k => byId.get(k) ?? new Error(...))\`.)`,
  },

  {
    id: "async-paginate-generator",
    title: "Page through a cursor API",
    track: "Async & data",
    level: "Medium",
    minutes: 20,
    tags: ["async-iterators", "pagination"],
    prompt: `An activity feed API returns results in pages: each response has \`items\` and a \`nextCursor\` to pass in for the next page. Callers shouldn't have to deal with cursors at all.

Write an async generator \`paginate(fetchPage)\`, where \`fetchPage(cursor)\` returns a promise for \`{ items, nextCursor }\`:

- the first call uses cursor \`null\`
- yield every item, in order, across all pages
- stop when \`nextCursor\` is \`null\` or \`undefined\`. A page with no items but a cursor is not the end
- be **lazy**: fetch the next page only when the consumer asks for more items than you have, and stop fetching if the consumer stops iterating
- errors from \`fetchPage\` should reach the consumer's \`for await\` loop

\`\`\`js
for await (const activity of paginate((cursor) => api.activity({ cursor }))) {
  render(activity);
  if (feedIsFull()) break; // no more pages are fetched
}
\`\`\``,
    starter: `async function* paginate(fetchPage) {
  // your code here
}`,
    tests: `const PAGES = {
  null: { items: [1, 2], nextCursor: "c2" },
  c2: { items: [3, 4], nextCursor: "c3" },
  c3: { items: [5], nextCursor: null },
};
function makeApi(pages = PAGES) {
  const requested = [];
  const fetchPage = async (cursor) => {
    requested.push(cursor);
    await sleep(1);
    const page = pages[String(cursor)];
    if (page instanceof Error) throw page;
    return page;
  };
  return { fetchPage, requested };
}
async function take(iter, limit = Infinity) {
  const out = [];
  for await (const x of iter) {
    out.push(x);
    if (out.length >= limit) break;
  }
  return out;
}

test("yields every item across pages, in order", async () => {
  const { fetchPage } = makeApi();
  expect(await take(paginate(fetchPage))).toEqual([1, 2, 3, 4, 5]);
});

test("starts with a null cursor and follows nextCursor", async () => {
  const { fetchPage, requested } = makeApi();
  await take(paginate(fetchPage));
  expect(requested).toEqual([null, "c2", "c3"]);
});

test("treats a missing nextCursor as the end", async () => {
  const { fetchPage, requested } = makeApi({ null: { items: ["only"] } });
  expect(await take(paginate(fetchPage))).toEqual(["only"]);
  expect(requested).toEqual([null]);
});

test("keeps going past an empty page that has a cursor", async () => {
  const { fetchPage } = makeApi({
    null: { items: [], nextCursor: "b" },
    b: { items: ["x"], nextCursor: null },
  });
  expect(await take(paginate(fetchPage))).toEqual(["x"]);
});

test("yields nothing for an empty first page", async () => {
  const { fetchPage } = makeApi({ null: { items: [], nextCursor: null } });
  expect(await take(paginate(fetchPage))).toEqual([]);
});

test("fetches lazily, one page at a time", async () => {
  const { fetchPage, requested } = makeApi();
  const it = paginate(fetchPage);
  await it.next();
  await it.next();
  expect(requested).toEqual([null]);
  await it.next();
  expect(requested).toEqual([null, "c2"]);
});

test("stops fetching when the consumer breaks", async () => {
  const { fetchPage, requested } = makeApi();
  expect(await take(paginate(fetchPage), 3)).toEqual([1, 2, 3]);
  await sleep(10);
  expect(requested).toEqual([null, "c2"]);
});

test("errors from fetchPage reach the consumer after earlier items", async () => {
  const { fetchPage } = makeApi({ null: { items: [1, 2], nextCursor: "bad" }, bad: new Error("page 2 failed") });
  const seen = [];
  await rejects(async () => { for await (const x of paginate(fetchPage)) seen.push(x); }, "page 2 failed");
  expect(seen).toEqual([1, 2]);
});`,
    hints: [
      "An `async function*` can `await` a page and then `yield` its items. It pauses at each `yield` until the consumer asks for more, which gives you laziness for free.",
      "Keep a `cursor` variable starting at `null`. Loop: fetch the page, yield each item, then move the cursor forward.",
      "Use a `do { ... } while (cursor != null)` loop with `const { items, nextCursor } = await fetchPage(cursor); yield* items; cursor = nextCursor;`.",
    ],
    solution: `async function* paginate(fetchPage) {
  let cursor = null;
  do {
    const { items, nextCursor } = await fetchPage(cursor);
    yield* items;
    cursor = nextCursor;
  } while (cursor != null); // stops on null or undefined
}`,
    explanation: `Async generators are a natural fit for paginated APIs. The generator pauses at every \`yield\` and resumes only when the consumer calls \`next()\`, so a page is fetched only when the previous one runs out. When the consumer \`break\`s, \`for await\` calls the generator's \`return()\`, which ends it at the paused \`yield\`, so no extra requests go out.

A \`do...while\` loop expresses "always fetch the first page, then keep going while there's a cursor". \`yield*\` delegates to the page's array, and \`!= null\` treats \`null\` and \`undefined\` the same. Errors thrown by \`await fetchPage\` surface as a rejection from the consumer's \`next()\` call, which \`for await\` rethrows inside the loop.

Memory is O(page size) no matter how long the feed is. The common naive version collects every page into an array first, which defeats laziness and fetches pages the UI may never show.

Follow-up: how would you prefetch the next page while the consumer is still rendering the current one, so scrolling feels instant?`,
  },

  {
    id: "async-merge-iterables",
    title: "Merge live async streams",
    track: "Async & data",
    level: "Hard",
    minutes: 40,
    tags: ["async-iterators", "streams", "realtime"],
    prompt: `A trading dashboard subscribes to several price feeds, each exposed as an async iterable. You want one combined stream that yields each update **as soon as it arrives**, from whichever feed produced it.

Write an async generator \`merge(...iterables)\`:

- yields values from all sources, in **arrival order**. A slow source must not hold up a fast one
- finishes when **every** source has finished. With no sources, it finishes immediately
- if any source throws, the merged stream throws that error
- if the consumer stops early (for example with \`break\`), call \`return()\` on every source that hasn't finished yet, so they can close their connections
- accept anything with \`[Symbol.asyncIterator]\`, not just async generators

\`\`\`js
for await (const tick of merge(nasdaqFeed, nyseFeed, cryptoFeed)) {
  updateTicker(tick);
}
\`\`\``,
    starter: `async function* merge(...iterables) {
  // your code here
}`,
    tests: `async function* timed(values, delays) {
  for (let i = 0; i < values.length; i++) {
    await sleep(delays[i]);
    yield values[i];
  }
}
async function collect(iter) {
  const out = [];
  for await (const x of iter) out.push(x);
  return out;
}
function endless(name) {
  const state = { closed: false };
  state.iterable = {
    [Symbol.asyncIterator]() {
      return {
        next: () => sleep(5).then(() => ({ value: name, done: false })),
        return: () => { state.closed = true; return Promise.resolve({ value: undefined, done: true }); },
      };
    },
  };
  return state;
}

test("yields values in arrival order across sources", async () => {
  const a = timed(["a1", "a2"], [5, 50]);
  const b = timed(["b1", "b2"], [20, 5]);
  expect(await collect(merge(a, b))).toEqual(["a1", "b1", "b2", "a2"]);
});

test("a slow source does not hold up a fast one", async () => {
  const slow = timed(["slow"], [60]);
  const fast = timed(["f1", "f2"], [5, 5]);
  expect(await collect(merge(slow, fast))).toEqual(["f1", "f2", "slow"]);
});

test("finishes immediately with no sources", async () => {
  expect(await collect(merge())).toEqual([]);
});

test("an empty source does not block the others", async () => {
  expect(await collect(merge(timed([], []), timed(["x"], [5])))).toEqual(["x"]);
});

test("works with a single source", async () => {
  expect(await collect(merge(timed([1, 2, 3], [1, 1, 1])))).toEqual([1, 2, 3]);
});

test("accepts any async iterable", async () => {
  let i = 0;
  const custom = { [Symbol.asyncIterator]: () => ({ next: async () => (i < 2 ? { value: i++, done: false } : { value: undefined, done: true }) }) };
  expect(await collect(merge(custom))).toEqual([0, 1]);
});

test("throws when a source throws", async () => {
  async function* broken() { await sleep(5); yield "ok"; await sleep(5); throw new Error("feed disconnected"); }
  const seen = [];
  await rejects(async () => { for await (const x of merge(broken(), timed(["late"], [80]))) seen.push(x); }, "feed disconnected");
  expect(seen).toEqual(["ok"]);
});

test("breaking out early closes every unfinished source", async () => {
  const one = endless("one"), two = endless("two");
  let count = 0;
  for await (const _ of merge(one.iterable, two.iterable)) {
    if (++count === 3) break;
  }
  expect(one.closed).toBe(true);
  expect(two.closed).toBe(true);
});`,
    hints: [
      "Keep exactly one pending `next()` promise per source and race them. Whichever settles first gives you the next value.",
      "Store pending promises in a `Map` from source index to `iterator.next().then(result => ({ i, result }))`. Each loop iteration, `await Promise.race(pending.values())`. If the result is done, delete that index. Otherwise request that source's next value and yield.",
      "Wrap the loop in `try { ... } finally { ... }`. In the `finally`, call `iterators[i].return?.()` for every index still in the map. That runs on `break` and on errors.",
    ],
    solution: `async function* merge(...iterables) {
  const iterators = iterables.map((it) => it[Symbol.asyncIterator]());
  const pending = new Map(); // source index -> promise of { i, result }
  const pull = (i) => iterators[i].next().then((result) => ({ i, result }));
  iterators.forEach((_, i) => pending.set(i, pull(i)));

  try {
    while (pending.size > 0) {
      const { i, result } = await Promise.race(pending.values());
      if (result.done) {
        pending.delete(i);
        continue;
      }
      pending.set(i, pull(i));
      yield result.value;
    }
  } finally {
    // Runs on normal completion, on error, and when the consumer breaks.
    for (const i of pending.keys()) {
      Promise.resolve(iterators[i].return?.()).catch(() => {});
    }
  }
}`,
    explanation: `The core idea is to keep one outstanding \`next()\` request per source and \`Promise.race\` them. Each promise is tagged with its source index so we know which source to pull from again. Since only one request per source is ever pending, each source still sees ordinary sequential \`next()\` calls, which async iterators require.

Termination comes from the map shrinking: a source that reports \`done\` is removed, and the loop ends when none remain. An error from a source rejects the race, which the generator rethrows to the consumer.

The \`finally\` block handles cleanup. When the consumer breaks, \`for await\` calls \`return()\` on the merged generator, which resumes it at the paused \`yield\` as a return and runs \`finally\`. There we close every source that hasn't finished, which in a real app closes sockets. Each yielded value costs a race over k sources, so O(k) per value.

A common naive answer iterates sources one after another, which is \`concat\`, not \`merge\`. Another starts a new \`next()\` on every source each loop, which calls \`next()\` concurrently and loses values. Follow-up: how would you tag each value with its source name, or add backpressure when the consumer is slow?`,
  },

  {
    id: "async-optimistic-update",
    title: "Optimistic updates with rollback",
    track: "Async & data",
    level: "Medium",
    minutes: 35,
    tags: ["state", "promises", "ux"],
    prompt: `Clicking "like" should update the count instantly and send the request in the background. If the request fails, the UI should undo **that** change, without undoing other changes made in the meantime.

Write \`createOptimisticStore(initialState)\` that returns:

- \`getState()\`: the visible state
- \`subscribe(listener)\`: \`listener(state)\` is called after every change described below. Returns an unsubscribe function
- \`mutate(update, request)\`: \`update\` is a pure function \`state => newState\`, and \`request\` returns a promise
  1. apply \`update\` to the visible state **immediately** (synchronously), notify listeners, and call \`request()\`
  2. if the request succeeds, the update becomes permanent. Notify listeners again, and resolve with the request's result
  3. if it fails, remove **only this update**, notify listeners, and reject with the error

The visible state should always be the confirmed state with all still-pending updates applied in the order they were made. So rolling back one update must keep the effect of other updates, whether they're pending or already succeeded.

\`\`\`js
const store = createOptimisticStore({ likes: 4 });
store.mutate((s) => ({ likes: s.likes + 1 }), () => api.like(postId));
store.getState(); // { likes: 5 } right away
\`\`\``,
    starter: `function createOptimisticStore(initialState) {
  // your code here
}`,
    tests: `const later = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const failLater = (msg, ms) => new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms));
const like = (s) => ({ ...s, liked: true, likes: s.likes + 1 });
const add = (n) => (s) => s + n;

test("applies the update immediately and starts the request", () => {
  const store = createOptimisticStore({ liked: false, likes: 4 });
  let started = false;
  store.mutate(like, () => { started = true; return later("ok", 20); });
  expect(store.getState()).toEqual({ liked: true, likes: 5 });
  expect(started).toBe(true);
});

test("keeps the update and resolves with the result on success", async () => {
  const store = createOptimisticStore({ liked: false, likes: 4 });
  expect(await store.mutate(like, () => later({ id: 1 }, 5))).toEqual({ id: 1 });
  expect(store.getState()).toEqual({ liked: true, likes: 5 });
});

test("rolls back and rejects when the request fails", async () => {
  const store = createOptimisticStore({ liked: false, likes: 4 });
  await rejects(store.mutate(like, () => failLater("500", 5)), "500");
  expect(store.getState()).toEqual({ liked: false, likes: 4 });
});

test("notifies subscribers on apply and on settle", async () => {
  const store = createOptimisticStore(0), seen = [];
  store.subscribe((s) => seen.push(s));
  await store.mutate(add(1), () => later("ok", 5));
  expect(seen).toEqual([1, 1]);
  await rejects(store.mutate(add(5), () => failLater("nope", 5)));
  expect(seen).toEqual([1, 1, 6, 1]);
});

test("rolling back one update keeps a later one that succeeded", async () => {
  const store = createOptimisticStore(0);
  const a = store.mutate(add(1), () => failLater("a failed", 25));
  const b = store.mutate(add(10), () => later("ok", 5));
  expect(store.getState()).toBe(11);
  await b;
  expect(store.getState()).toBe(11);
  await rejects(a);
  expect(store.getState()).toBe(10);
});

test("rolling back one update keeps an earlier one that succeeded", async () => {
  const store = createOptimisticStore(1);
  const a = store.mutate(add(1), () => later("ok", 5));
  const b = store.mutate((s) => s * 10, () => failLater("b failed", 20));
  expect(store.getState()).toBe(20);
  await a;
  await rejects(b);
  expect(store.getState()).toBe(2);
});

test("rolling back keeps another pending update", async () => {
  const store = createOptimisticStore(0);
  const a = store.mutate(add(1), () => failLater("a failed", 5));
  const b = store.mutate(add(10), () => later("ok", 30));
  await rejects(a);
  expect(store.getState()).toBe(10);
  await b;
  expect(store.getState()).toBe(10);
});

test("unsubscribe stops notifications", async () => {
  const store = createOptimisticStore(0);
  let calls = 0;
  const stop = store.subscribe(() => calls++);
  stop();
  await store.mutate(add(1), () => later("ok", 5));
  expect(calls).toBe(0);
});`,
    hints: [
      "Don't roll back to a snapshot: another update may have happened since. Keep the confirmed state and a list of pending updates, and derive what's visible.",
      "Visible state = `pending.reduce((s, p) => p.update(s), confirmed)`. Write a `recompute()` that sets it and notifies listeners.",
      "In `mutate`, push an entry object, recompute, then `await request()`. On success set `confirmed = update(confirmed)`. In a `finally`, remove that entry by identity and recompute again.",
    ],
    solution: `function createOptimisticStore(initialState) {
  let confirmed = initialState;
  let pending = []; // updates whose requests haven't settled, in order
  let visible = initialState;
  const listeners = new Set();

  function recompute() {
    visible = pending.reduce((state, entry) => entry.update(state), confirmed);
    listeners.forEach((listener) => listener(visible));
  }

  return {
    getState: () => visible,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async mutate(update, request) {
      const entry = { update };
      pending.push(entry);
      recompute(); // runs synchronously, before the first await
      try {
        const result = await request();
        confirmed = update(confirmed);
        return result;
      } finally {
        pending = pending.filter((p) => p !== entry);
        recompute();
      }
    },
  };
}`,
    explanation: `The naive version saves a snapshot before the update and restores it on failure. That breaks as soon as two updates overlap: if A fails after B succeeded, restoring A's snapshot silently erases B. The fix is to treat the visible state as derived data: confirmed state plus a replay of pending updates.

With that model, success means "move this update from pending into confirmed" and failure means "drop it from pending". Either way we recompute from scratch, so the result is always consistent. This is roughly how Apollo and React Query handle optimistic responses, and it's why \`update\` must be pure: it may run several times.

An \`async\` function runs synchronously until its first \`await\`, so the optimistic state and the request start before \`mutate\` returns. The \`finally\` block covers both outcomes in one place. Recompute is O(p) for p pending updates, which is tiny in practice.

Follow-up: if the server returns the canonical object (with a real id or updated timestamp), how would you let \`mutate\` replace the optimistic guess with it?`,
  },

  {
    id: "async-sse-parser",
    title: "Parse a Server-Sent Events stream",
    track: "Async & data",
    level: "Medium",
    minutes: 35,
    tags: ["streams", "parsing", "realtime"],
    prompt: `Your app streams AI responses and live notifications with Server-Sent Events. The network delivers the text in arbitrary chunks: a chunk may end in the middle of a line, or even between \`\\r\` and \`\\n\`.

Write \`createSSEParser(onEvent)\` that returns \`{ feed(chunk) }\`. Feed it chunks of text, and it calls \`onEvent({ type, data, id })\` for each complete event. The rules (a subset of the spec):

- lines end with \`\\n\` or \`\\r\\n\`
- a **blank line** ends an event. Dispatch it only if it had at least one \`data\` line, then reset the event's \`type\` and \`data\`
- a line starting with \`:\` is a comment (often a heartbeat) and is ignored
- other lines are \`field:value\`. If the value starts with a space, remove **one** space. A line with no colon is a field with an empty value
- \`data\`: append to the event's data. Multiple data lines are joined with \`\\n\`
- \`event\`: sets \`type\`. The default \`type\` is \`"message"\`
- \`id\`: sets the last event id, which **persists** to later events until changed. It starts as \`""\`
- any other field is ignored
- don't dispatch an event until its blank line arrives

\`\`\`js
const parser = createSSEParser((e) => console.log(e));
parser.feed("event: price\\ndata: 4");
parser.feed("2\\n\\n");
// { type: "price", data: "42", id: "" }
\`\`\``,
    starter: `function createSSEParser(onEvent) {
  // your code here
}`,
    tests: `function parse(chunks) {
  const events = [];
  const parser = createSSEParser((e) => events.push(e));
  chunks.forEach((c) => parser.feed(c));
  return events;
}

test("parses a single event", () => {
  expect(parse(["data: hello\\n\\n"])).toEqual([{ type: "message", data: "hello", id: "" }]);
});

test("uses the event field as the type", () => {
  expect(parse(["event: price\\ndata: 42\\n\\n"])).toEqual([{ type: "price", data: "42", id: "" }]);
});

test("joins multiple data lines with newlines", () => {
  expect(parse(["data: line one\\ndata: line two\\n\\n"])[0].data).toBe("line one\\nline two");
});

test("handles an event split across chunks anywhere", () => {
  const text = "event: price\\ndata: 42\\n\\ndata: next\\n\\n";
  expect(parse(text.split(""))).toEqual([
    { type: "price", data: "42", id: "" },
    { type: "message", data: "next", id: "" },
  ]);
});

test("ignores comment lines such as heartbeats", () => {
  expect(parse([": ping\\n\\ndata: x\\n: another\\n\\n"])).toEqual([{ type: "message", data: "x", id: "" }]);
});

test("strips only one leading space from values", () => {
  expect(parse(["data:  indented\\ndata:tight\\n\\n"])[0].data).toBe(" indented\\ntight");
});

test("supports \\\\r\\\\n line endings, even split between \\\\r and \\\\n", () => {
  expect(parse(["data: a\\r", "\\n\\r", "\\n"])).toEqual([{ type: "message", data: "a", id: "" }]);
});

test("remembers the last id for later events", () => {
  const events = parse(["id: 7\\ndata: a\\n\\ndata: b\\n\\nid: 8\\ndata: c\\n\\n"]);
  expect(events.map((e) => e.id)).toEqual(["7", "7", "8"]);
});

test("waits for the blank line before dispatching", () => {
  expect(parse(["data: partial\\n"])).toEqual([]);
});

test("ignores unknown fields and events without data, and resets the type", () => {
  expect(parse(["retry: 3000\\n\\nevent: ping\\n\\nfoo: bar\\ndata: real\\n\\n"])).toEqual([
    { type: "message", data: "real", id: "" },
  ]);
});`,
    hints: [
      "Chunks don't line up with lines, so keep a string buffer. Only process complete lines and keep the unfinished tail for the next chunk.",
      "In `feed`, append the chunk, `split(\"\\n\")`, and put the last element (possibly partial) back in the buffer. Strip a trailing `\\r` from each complete line before handling it.",
      "Handle each line: empty means dispatch if `data.length` and reset; a leading `:` means skip; otherwise split at the first colon, drop one leading space from the value, and switch on the field name.",
    ],
    solution: `function createSSEParser(onEvent) {
  let buffer = "";
  let type = "";
  let data = [];
  let lastId = "";

  function handleLine(line) {
    if (line === "") {
      if (data.length > 0) onEvent({ type: type || "message", data: data.join("\\n"), id: lastId });
      type = "";
      data = [];
      return;
    }
    if (line.startsWith(":")) return; // comment / heartbeat
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "data") data.push(value);
    else if (field === "event") type = value;
    else if (field === "id") lastId = value;
  }

  return {
    feed(chunk) {
      buffer += chunk;
      const lines = buffer.split("\\n");
      buffer = lines.pop(); // the last piece may be an incomplete line
      for (const line of lines) handleLine(line.endsWith("\\r") ? line.slice(0, -1) : line);
    },
  };
}`,
    explanation: `Streaming parsers have two layers: reassembling lines from arbitrary chunks, and interpreting complete lines. Splitting the buffer on \`\\n\` and keeping the last piece handles the first layer, because the last piece is either empty (the chunk ended on a newline) or an incomplete line. A \`\\r\` split from its \`\\n\` stays at the end of the buffered line until the \`\\n\` arrives, and then it's stripped.

The second layer is a small state machine. \`data\` and \`type\` belong to the event being built and reset at every blank line. \`lastId\` belongs to the connection and persists, which is what lets \`EventSource\` send \`Last-Event-ID\` when it reconnects. Removing exactly one leading space is spec behavior that lets servers send indented data.

Each character is processed a constant number of times, so total work is O(n) in the stream length. Common bugs: splitting each chunk on its own (losing lines split across chunks), dispatching on every \`data\` line, and forgetting to reset \`type\` after an event without data.

Follow-up: wire this up to a \`fetch\` response body. (Read with \`response.body.pipeThrough(new TextDecoderStream()).getReader()\` and \`feed\` each chunk, which also handles multi-byte characters split across chunks.)`,
  },

  {
    id: "async-reconnecting-socket",
    title: "Reconnecting socket with backoff",
    track: "Async & data",
    level: "Hard",
    minutes: 45,
    tags: ["websockets", "resilience", "realtime"],
    prompt: `A live chat should survive flaky Wi-Fi. When the socket drops, reconnect with growing delays, queue outgoing messages until the connection is back, and stop cleanly when the user leaves.

Write \`createReconnectingSocket(connect, options)\`. \`connect()\` returns a new socket-like object. You set its \`onopen\`, \`onmessage\` (called with \`{ data }\`), and \`onclose\` handlers, and you can call \`send(data)\` and \`close()\` on it.

Options (all optional): \`baseDelay = 100\`, \`maxDelay = 5000\`, \`maxRetries = Infinity\`, \`onMessage(data)\`, \`onStatus(status)\`, and \`schedule(fn, ms)\` / \`cancel(handle)\`, which default to \`setTimeout\` / \`clearTimeout\` (tests inject fakes).

Behavior:

- connect right away. Call \`onStatus("connecting")\` every time a socket is created, and \`onStatus("open")\` when it opens
- forward each incoming message's \`data\` to \`onMessage\`
- \`send(data)\` sends immediately while open. Otherwise it queues the data and sends it, in order, on the next open
- on an unexpected close: call \`onStatus("reconnecting")\` and schedule a new connection after \`min(maxDelay, baseDelay * 2 ** n)\`, where \`n\` is the number of reconnects scheduled since the last successful open (so 100, 200, 400...)
- a successful open resets \`n\` to 0
- if \`n\` has reached \`maxRetries\` when a close happens, call \`onStatus("failed")\` and stop
- \`close()\`: call \`onStatus("closed")\`, close the current socket, cancel any scheduled reconnect, and never reconnect again

Return \`{ send, close }\`.

\`\`\`js
const chat = createReconnectingSocket(() => new WebSocket(url), {
  onMessage: (data) => addMessage(JSON.parse(data)),
  onStatus: (s) => setBanner(s),
});
chat.send("hello"); // queued until open
\`\`\``,
    starter: `function createReconnectingSocket(connect, options = {}) {
  // your code here
}`,
    tests: `function makeFactory() {
  const sockets = [];
  const connect = () => {
    const s = {
      sent: [],
      closed: false,
      send(d) { this.sent.push(d); },
      close() { this.closed = true; if (this.onclose) this.onclose(); },
      // test helpers that simulate the network
      open() { if (this.onopen) this.onopen(); },
      receive(d) { if (this.onmessage) this.onmessage({ data: d }); },
      drop() { if (this.onclose) this.onclose(); },
    };
    sockets.push(s);
    return s;
  };
  return { connect, sockets };
}
function makeScheduler() {
  const tasks = [];
  return {
    tasks,
    schedule: (fn, ms) => { const t = { fn, ms, cancelled: false }; tasks.push(t); return t; },
    cancel: (t) => { if (t) t.cancelled = true; },
    runNext() { const t = tasks.shift(); if (t && !t.cancelled) t.fn(); return t; },
  };
}
function setup(extra = {}) {
  const f = makeFactory(), sch = makeScheduler(), statuses = [], messages = [];
  const socket = createReconnectingSocket(f.connect, {
    schedule: sch.schedule, cancel: sch.cancel,
    onStatus: (s) => statuses.push(s), onMessage: (d) => messages.push(d), ...extra,
  });
  return { f, sch, statuses, messages, socket };
}

test("connects right away and reports connecting, then open", () => {
  const { f, statuses } = setup();
  expect(f.sockets).toHaveLength(1);
  expect(statuses).toEqual(["connecting"]);
  f.sockets[0].open();
  expect(statuses).toEqual(["connecting", "open"]);
});

test("forwards incoming message data to onMessage", () => {
  const { f, messages } = setup();
  f.sockets[0].open();
  f.sockets[0].receive("hi");
  f.sockets[0].receive("there");
  expect(messages).toEqual(["hi", "there"]);
});

test("queues sends until open, then sends directly", () => {
  const { f, socket } = setup();
  socket.send("a"); socket.send("b");
  expect(f.sockets[0].sent).toEqual([]);
  f.sockets[0].open();
  expect(f.sockets[0].sent).toEqual(["a", "b"]);
  socket.send("c");
  expect(f.sockets[0].sent).toEqual(["a", "b", "c"]);
});

test("reconnects after an unexpected close, with exponential backoff", () => {
  const { f, sch, statuses } = setup();
  f.sockets[0].open();
  f.sockets[0].drop();
  expect(statuses).toEqual(["connecting", "open", "reconnecting"]);
  expect(sch.tasks.map((t) => t.ms)).toEqual([100]);
  sch.runNext();
  expect(f.sockets).toHaveLength(2);
  f.sockets[1].drop();
  expect(sch.tasks[0].ms).toBe(200);
  sch.runNext();
  f.sockets[2].drop();
  expect(sch.tasks[0].ms).toBe(400);
});

test("a successful open resets the backoff", () => {
  const { f, sch } = setup();
  f.sockets[0].drop();
  sch.runNext();
  f.sockets[1].drop();
  expect(sch.tasks[0].ms).toBe(200);
  sch.runNext();
  f.sockets[2].open();
  f.sockets[2].drop();
  expect(sch.tasks[0].ms).toBe(100);
});

test("caps delays at maxDelay", () => {
  const { f, sch } = setup({ baseDelay: 100, maxDelay: 250 });
  const delays = [];
  for (let i = 0; i < 4; i++) {
    f.sockets[i].drop();
    delays.push(sch.tasks[0].ms);
    sch.runNext();
  }
  expect(delays).toEqual([100, 200, 250, 250]);
});

test("gives up after maxRetries reconnects in a row", () => {
  const { f, sch, statuses } = setup({ maxRetries: 2 });
  f.sockets[0].drop(); sch.runNext();
  f.sockets[1].drop(); sch.runNext();
  f.sockets[2].drop();
  expect(statuses[statuses.length - 1]).toBe("failed");
  expect(sch.tasks).toHaveLength(0);
  expect(f.sockets).toHaveLength(3);
});

test("close() closes the socket and never reconnects", () => {
  const { f, sch, statuses, socket } = setup();
  f.sockets[0].open();
  socket.close();
  expect(f.sockets[0].closed).toBe(true);
  expect(statuses[statuses.length - 1]).toBe("closed");
  expect(sch.tasks).toHaveLength(0);
  expect(f.sockets).toHaveLength(1);
});

test("close() during a pending reconnect cancels it", () => {
  const { f, sch, socket } = setup();
  f.sockets[0].drop();
  const pending = sch.tasks[0];
  socket.close();
  expect(pending.cancelled).toBe(true);
  sch.runNext();
  expect(f.sockets).toHaveLength(1);
});

test("messages sent while reconnecting go out on the new socket", () => {
  const { f, sch, socket } = setup();
  f.sockets[0].open();
  f.sockets[0].drop();
  socket.send("are you there?");
  sch.runNext();
  f.sockets[1].open();
  expect(f.sockets[1].sent).toEqual(["are you there?"]);
  expect(f.sockets[0].sent).toEqual([]);
});`,
    hints: [
      "Write an `open()` function that creates a socket and attaches its three handlers. Reconnecting is just scheduling `open` again.",
      "Track `isOpen`, `closedByUser`, a retry count, the scheduled handle, and an outbox array. `onopen` resets retries and flushes the outbox, and `send` either sends or pushes to the outbox.",
      "In `onclose`: return if `closedByUser`. If `retries >= maxRetries`, report \"failed\". Otherwise compute `Math.min(maxDelay, baseDelay * 2 ** retries)`, increment retries, report \"reconnecting\", and `timer = schedule(open, delay)`. In `close()`, set the flag before calling `socket.close()`, because that triggers `onclose`.",
    ],
    solution: `function createReconnectingSocket(connect, {
  baseDelay = 100,
  maxDelay = 5000,
  maxRetries = Infinity,
  onMessage = () => {},
  onStatus = () => {},
  schedule = (fn, ms) => setTimeout(fn, ms),
  cancel = (handle) => clearTimeout(handle),
} = {}) {
  let socket = null;
  let isOpen = false;
  let closedByUser = false;
  let retries = 0;
  let timer = null;
  const outbox = [];

  function open() {
    timer = null;
    onStatus("connecting");
    const s = connect();
    socket = s;
    s.onopen = () => {
      if (s !== socket) return; // ignore events from an old socket
      isOpen = true;
      retries = 0;
      onStatus("open");
      while (outbox.length) s.send(outbox.shift());
    };
    s.onmessage = (event) => {
      if (s === socket) onMessage(event.data);
    };
    s.onclose = () => {
      if (s !== socket) return;
      isOpen = false;
      if (closedByUser) return;
      if (retries >= maxRetries) {
        onStatus("failed");
        return;
      }
      const delay = Math.min(maxDelay, baseDelay * 2 ** retries);
      retries++;
      onStatus("reconnecting");
      timer = schedule(open, delay);
    };
  }

  open();

  return {
    send(data) {
      if (isOpen) socket.send(data);
      else outbox.push(data);
    },
    close() {
      if (closedByUser) return;
      closedByUser = true; // set first: socket.close() fires onclose
      isOpen = false;
      if (timer !== null) cancel(timer);
      timer = null;
      onStatus("closed");
      socket.close();
    },
  };
}`,
    explanation: `The wrapper is a small state machine around a sequence of real sockets: connecting, open, reconnecting, and finally closed or failed. Keeping all of the transition logic in the three handlers attached by \`open()\` means a reconnect is just "schedule \`open\` again", with no special first-connection path.

The \`closedByUser\` flag separates a deliberate close from a dropped connection. Because \`socket.close()\` fires \`onclose\` synchronously in the fake (and asynchronously in browsers), the flag must be set before calling it. Cancelling the pending timer covers a user who leaves while a reconnect is waiting. The \`s !== socket\` guards make sure late events from an old socket can't change the current state.

Resetting the retry count only on a successful open gives the expected backoff: repeated failures grow 100, 200, 400, capped at \`maxDelay\`, while a connection that worked and then dropped starts over. The outbox gives at-least-once delivery from the client's point of view. Injecting \`schedule\` and \`cancel\` makes all of this testable with no real timers.

Follow-up: messages sent just before a drop may be lost in flight. How would you add acknowledgements so the client re-sends unacknowledged messages after reconnecting?`,
  },

  {
    id: "async-memoize",
    title: "Async memoize that forgets failures",
    track: "Async & data",
    level: "Medium",
    minutes: 25,
    tags: ["caching", "promises"],
    prompt: `Currency conversion rates rarely change, so you memoize \`getRate(from, to)\`. But one network blip shouldn't cache an error forever.

Write \`memoizeAsync(fn, { key })\`, where \`fn\` returns a promise and \`key(...args)\` builds the cache key (default: \`JSON.stringify(args)\`). It returns \`memoized(...args)\`:

- the first call for a key calls \`fn\` and caches the **promise**. Concurrent and later calls with the same key get that promise, without calling \`fn\`
- if the promise rejects, every caller waiting on it sees the rejection, and the entry is **evicted** so the next call retries
- \`memoized.clear()\` empties the cache
- eviction must only remove the entry for the promise that failed: if the cache was cleared and a newer call is cached under the same key, a late failure of the old promise must not evict the new one
- \`this\` is passed through to \`fn\`

\`\`\`js
const getRate = memoizeAsync((from, to) => api.rate(from, to));
await getRate("USD", "EUR"); // fetches
await getRate("USD", "EUR"); // cached
\`\`\``,
    starter: `function memoizeAsync(fn, { key = (...args) => JSON.stringify(args) } = {}) {
  // your code here
}`,
    tests: `const later = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
function counter(impl) {
  let calls = 0;
  const fn = (...args) => { calls++; return impl(calls, ...args); };
  fn.calls = () => calls;
  return fn;
}

test("caches resolved values", async () => {
  const fn = counter((n, a, b) => later(a + "->" + b, 5));
  const m = memoizeAsync(fn);
  expect(await m("USD", "EUR")).toBe("USD->EUR");
  expect(await m("USD", "EUR")).toBe("USD->EUR");
  expect(fn.calls()).toBe(1);
});

test("concurrent calls share one promise", async () => {
  const fn = counter(() => later("rate", 10));
  const m = memoizeAsync(fn);
  const p1 = m("x"), p2 = m("x");
  expect(p1).toBe(p2);
  await p1;
  expect(fn.calls()).toBe(1);
});

test("different arguments are cached separately", async () => {
  const fn = counter((n, a) => later(a, 2));
  const m = memoizeAsync(fn);
  await m("a"); await m("b"); await m("a");
  expect(fn.calls()).toBe(2);
});

test("evicts a rejected promise so the next call retries", async () => {
  const fn = counter((n) => (n === 1 ? Promise.reject(new Error("network blip")) : later("ok", 2)));
  const m = memoizeAsync(fn);
  await rejects(m("USD"), "network blip");
  expect(await m("USD")).toBe("ok");
  expect(fn.calls()).toBe(2);
});

test("every concurrent caller sees the rejection", async () => {
  const fn = counter(() => new Promise((_, r) => setTimeout(() => r(new Error("503")), 5)));
  const m = memoizeAsync(fn);
  const p1 = m("k"), p2 = m("k");
  await rejects(p1, "503");
  await rejects(p2, "503");
  expect(fn.calls()).toBe(1);
});

test("uses a custom key function", async () => {
  const fn = counter((n, user) => later(user.name, 2));
  const m = memoizeAsync(fn, { key: (user) => user.id });
  await m({ id: 1, name: "Ana" });
  expect(await m({ id: 1, name: "Ana (copy)" })).toBe("Ana");
  expect(fn.calls()).toBe(1);
});

test("clear() empties the cache", async () => {
  const fn = counter(() => later("v", 2));
  const m = memoizeAsync(fn);
  await m(1);
  m.clear();
  await m(1);
  expect(fn.calls()).toBe(2);
});

test("a late failure does not evict a newer entry", async () => {
  const fn = counter((n) => (n === 1
    ? new Promise((_, r) => setTimeout(() => r(new Error("old request failed")), 20))
    : later("fresh", 2)));
  const m = memoizeAsync(fn);
  const old = m("k");
  m.clear();
  expect(await m("k")).toBe("fresh");
  await rejects(old, "old request failed");
  expect(await m("k")).toBe("fresh");
  expect(fn.calls()).toBe(2);
});

test("passes this through to fn", async () => {
  const svc = { base: 100, get: memoizeAsync(async function (x) { return this.base + x; }) };
  expect(await svc.get(1)).toBe(101);
});`,
    hints: [
      "Cache the promise itself, keyed by `key(...args)`, so concurrent callers share it.",
      "When you create a promise, also attach a `.catch` that removes it from the cache. That `.catch` is your own handler and doesn't hide the rejection from callers.",
      "Guard the eviction with an identity check: `promise.catch(() => { if (cache.get(k) === promise) cache.delete(k); })`. Return a regular `function` so you can `fn.apply(this, args)`.",
    ],
    solution: `function memoizeAsync(fn, { key = (...args) => JSON.stringify(args) } = {}) {
  const cache = new Map();

  function memoized(...args) {
    const k = key(...args);
    if (cache.has(k)) return cache.get(k);
    const promise = (async () => fn.apply(this, args))();
    cache.set(k, promise);
    promise.catch(() => {
      // Only evict if this promise is still the cached one.
      if (cache.get(k) === promise) cache.delete(k);
    });
    return promise;
  }

  memoized.clear = () => cache.clear();
  return memoized;
}`,
    explanation: `Memoizing the promise rather than the value is what makes concurrent calls share work. The second caller arrives before any value exists, but the promise is already there to await.

Eviction is a side branch: \`promise.catch(...)\` creates a separate promise used only for cleanup, while callers still receive the original promise and see the rejection. The identity check matters once you add \`clear()\` or expiry. Without it, an old request that fails late would delete a newer, healthy entry stored under the same key.

Calling \`fn\` inside an \`async\` arrow turns a synchronous throw into a rejection, so it gets evicted too. Lookups are O(1). Typical bugs: caching the awaited value (no sharing), never evicting failures, and using a \`.then(..., evict)\` result as the cached value, which swallows the error.

Follow-up: add a TTL so successful values expire. (Store \`{ promise, expiresAt }\` and treat expired entries as misses. With an injected clock, this is easy to test.)`,
  },

  {
    id: "async-rate-limiter",
    title: "Client-side rate limiter",
    track: "Async & data",
    level: "Hard",
    minutes: 40,
    tags: ["rate-limiting", "timers", "queues"],
    prompt: `A third-party geocoding API allows at most N requests per second per client and returns 429 errors beyond that. Instead of handling errors, you want the client to never exceed the limit.

Write \`createRateLimiter({ limit, interval })\` that returns an object with \`schedule(task)\`:

- \`task\` is a function returning a value or a promise. \`schedule\` returns a promise that settles with the task's outcome
- at most \`limit\` tasks may **start** within any \`interval\` ms (a **sliding** window, not fixed buckets)
- tasks start in the order they were scheduled. If there's room, a task starts right away
- this limits starts, not concurrency: a long-running task does not block later starts once the window allows them
- a task that rejects or throws rejects its own promise and still counts toward the limit. The queue keeps moving

For example, with \`limit: 2, interval: 1000\`: if tasks start at 0ms and 300ms, the third can't start until 1000ms, and the fourth until 1300ms.

\`\`\`js
const limiter = createRateLimiter({ limit: 5, interval: 1000 });
const results = await Promise.all(addresses.map((a) => limiter.schedule(() => geocode(a))));
\`\`\``,
    starter: `function createRateLimiter({ limit, interval }) {
  // your code here
}`,
    tests: `function recorder() {
  const t0 = Date.now();
  const starts = {};
  const task = (label, result = label, ms = 0) => () => {
    starts[label] = Date.now() - t0;
    return ms ? sleep(ms).then(() => result) : result;
  };
  return { starts, task };
}

test("starts up to limit tasks right away", async () => {
  const limiter = createRateLimiter({ limit: 3, interval: 50 });
  const r = recorder();
  ["a", "b", "c", "d"].forEach((l) => limiter.schedule(r.task(l)));
  await sleep(5);
  expect(Object.keys(r.starts).sort()).toEqual(["a", "b", "c"]);
});

test("holds extra tasks until a slot frees up", async () => {
  const limiter = createRateLimiter({ limit: 2, interval: 40 });
  const r = recorder();
  const ps = ["a", "b", "c"].map((l) => limiter.schedule(r.task(l)));
  await sleep(15);
  expect(r.starts.c).toBeUndefined();
  await Promise.all(ps);
  expect(r.starts.c).toBeGreaterThanOrEqual(38);
});

test("resolves with each task's result", async () => {
  const limiter = createRateLimiter({ limit: 2, interval: 20 });
  const out = await Promise.all([
    limiter.schedule(() => "sync value"),
    limiter.schedule(() => sleep(5).then(() => "async value")),
  ]);
  expect(out).toEqual(["sync value", "async value"]);
});

test("a failing task rejects, and later tasks still run", async () => {
  const limiter = createRateLimiter({ limit: 1, interval: 10 });
  const bad = limiter.schedule(() => { throw new Error("429"); });
  const good = limiter.schedule(() => "next");
  await rejects(bad, "429");
  expect(await good).toBe("next");
});

test("starts tasks in the order they were scheduled", async () => {
  const limiter = createRateLimiter({ limit: 1, interval: 8 });
  const order = [];
  await Promise.all([0, 1, 2, 3].map((i) => limiter.schedule(() => order.push(i))));
  expect(order).toEqual([0, 1, 2, 3]);
});

test("never starts more than limit tasks in any window", async () => {
  const limiter = createRateLimiter({ limit: 2, interval: 30 });
  const r = recorder();
  const labels = ["a", "b", "c", "d", "e", "f"];
  await Promise.all(labels.map((l) => limiter.schedule(r.task(l))));
  const times = labels.map((l) => r.starts[l]);
  for (let i = 0; i + 2 < times.length; i++) {
    expect(times[i + 2] - times[i]).toBeGreaterThanOrEqual(29);
  }
  expect(times[5]).toBeLessThan(150);
});

test("uses a sliding window, not fixed buckets", async () => {
  const limiter = createRateLimiter({ limit: 2, interval: 40 });
  const r = recorder();
  const a = limiter.schedule(r.task("a"));
  await sleep(30);
  await Promise.all([a, ...["b", "c", "d"].map((l) => limiter.schedule(r.task(l)))]);
  expect(r.starts.c - r.starts.a).toBeGreaterThanOrEqual(39);
  expect(r.starts.c).toBeLessThan(66);
  expect(r.starts.d - r.starts.b).toBeGreaterThanOrEqual(39);
});

test("limits starts, not how long tasks run", async () => {
  const limiter = createRateLimiter({ limit: 1, interval: 10 });
  const r = recorder();
  const slow = limiter.schedule(r.task("slow", "done", 60));
  const next = limiter.schedule(r.task("next"));
  await next;
  expect(r.starts.next).toBeLessThan(50);
  await slow;
});`,
    hints: [
      "Keep a FIFO queue of waiting tasks and a list of recent start times. The window only cares about starts in the last `interval` ms.",
      "Write a `drain()` function: drop start times older than `now - interval`, then start tasks while the queue is non-empty and fewer than `limit` starts remain. If tasks are still waiting, set one timer for when the oldest start expires.",
      "The timer delay is `starts[0] + interval - now`. Start each task with `new Promise((res) => res(task())).then(resolve, reject)` so sync throws are caught. Call `drain()` from `schedule()` if no timer is pending.",
    ],
    solution: `function createRateLimiter({ limit, interval }) {
  const queue = [];  // { task, resolve, reject }
  const starts = []; // timestamps of recent starts, oldest first
  let timer = null;

  function drain() {
    timer = null;
    const now = Date.now();
    while (starts.length && now - starts[0] >= interval) starts.shift();
    while (queue.length && starts.length < limit) {
      const { task, resolve, reject } = queue.shift();
      starts.push(now);
      new Promise((res) => res(task())).then(resolve, reject);
    }
    if (queue.length) {
      // Wake up exactly when the oldest start leaves the window.
      timer = setTimeout(drain, Math.max(0, starts[0] + interval - now));
    }
  }

  return {
    schedule(task) {
      return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        if (timer === null) drain();
      });
    },
  };
}`,
    explanation: `A sliding-window limiter remembers when the last \`limit\` tasks started. A new task may start only if fewer than \`limit\` of those timestamps are within the past \`interval\` ms. Because timestamps arrive in order, expired ones are always at the front of the array, so trimming is a simple loop of \`shift\` calls.

Instead of polling, the limiter sleeps until the exact moment the oldest start leaves the window, then drains again. Only one timer exists at a time, and \`schedule\` only drains directly when no timer is pending, which keeps FIFO order intact. Tasks are started without being awaited, so a slow task never blocks later starts. That is the difference between rate limiting and concurrency limiting.

Fixed buckets ("reset the counter every second") are simpler but allow bursts of up to 2x the limit around each boundary, which is exactly what the sliding-window test catches. Each start or expiry is O(1) amortized, and memory is O(limit + queue length).

Follow-up: servers often report remaining quota in headers such as \`X-RateLimit-Remaining\`. How would you let a 429 response pause the limiter until the reset time?`,
  },
);
