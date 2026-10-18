(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "be-json-diff-patch",
    title: "JSON diff and patch",
    track: "Backend",
    level: "Hard",
    minutes: 45,
    tags: ["recursion", "json", "sync"],
    prompt: `Your settings service lets clients send only what changed instead of the whole document. Write a diff that produces a list of operations and a function that applies them.

\`diff(a, b)\` returns operations \`{ op, path, value? }\` where \`op\` is \`"add"\`, \`"remove"\` or \`"replace"\` and \`path\` is a JSON Pointer such as \`/settings/theme\` or \`/tags/0\`. The root is \`""\`. In keys, \`~\` is written \`~0\` and \`/\` is written \`~1\`.

Rules, in this exact order:

- Two plain objects: walk \`a\`'s keys in order. A key missing from \`b\` gives \`remove\`; a key in both recurses. Then each key of \`b\` missing from \`a\` gives \`add\` with its value.
- Two arrays: recurse index by index over the common length. Extra items in \`b\` give \`add\` at each index ascending. Extra items in \`a\` give \`remove\` at each index **descending** (so they can be applied in order).
- Anything else that is not identical (\`Object.is\`) gives \`replace\` with \`b\`'s value, including type changes like object to array.

\`applyPatch(doc, ops)\` returns a new document with the operations applied in order and never mutates \`doc\`. Array \`add\` inserts at the index; array \`remove\` deletes it. For any \`a\` and \`b\`, \`applyPatch(a, diff(a, b))\` deep-equals \`b\`.

\`\`\`
diff({ theme: "dark", tags: ["a"] }, { theme: "light", tags: ["a", "b"], beta: true })
// [ { op: "replace", path: "/theme", value: "light" },
//   { op: "add", path: "/tags/1", value: "b" },
//   { op: "add", path: "/beta", value: true } ]
\`\`\``,
    starter: `function diff(a, b) {
  // your code here
}

function applyPatch(doc, ops) {
  // your code here
}`,
    tests: `test("returns [] for equal documents", () => {
  expect(diff({ a: 1, b: [1, { c: 2 }] }, { a: 1, b: [1, { c: 2 }] })).toEqual([]);
});
test("produces the example operations in order", () => {
  expect(diff({ theme: "dark", tags: ["a"] }, { theme: "light", tags: ["a", "b"], beta: true })).toEqual([
    { op: "replace", path: "/theme", value: "light" },
    { op: "add", path: "/tags/1", value: "b" },
    { op: "add", path: "/beta", value: true },
  ]);
});
test("removes missing keys and recurses into nested objects", () => {
  expect(diff({ user: { name: "Ana", age: 30 } }, { user: { name: "Ana" } })).toEqual([{ op: "remove", path: "/user/age" }]);
});
test("removes extra array items from the end, highest index first", () => {
  expect(diff([1, 2, 3, 4], [1, 9])).toEqual([
    { op: "replace", path: "/1", value: 9 },
    { op: "remove", path: "/3" },
    { op: "remove", path: "/2" },
  ]);
});
test("replaces on a type change and at the root", () => {
  expect(diff({ x: { a: 1 } }, { x: [1] })).toEqual([{ op: "replace", path: "/x", value: [1] }]);
  expect(diff(1, "1")).toEqual([{ op: "replace", path: "", value: "1" }]);
});
test("escapes ~ and / in keys", () => {
  expect(diff({}, { "a/b": 1, "c~d": 2 })).toEqual([
    { op: "add", path: "/a~1b", value: 1 },
    { op: "add", path: "/c~0d", value: 2 },
  ]);
});
test("applyPatch round-trips a complex change", () => {
  const a = { id: 1, tags: ["x", "y", "z"], profile: { name: "Ana", links: [{ url: "a" }] }, "a/b": 0, old: true };
  const b = { id: 2, tags: ["x"], profile: { name: "Ana B", links: [{ url: "a", title: "A" }, { url: "b" }] }, "a/b": 1, fresh: null };
  expect(applyPatch(a, diff(a, b))).toEqual(b);
});
test("applyPatch does not mutate its input", () => {
  const a = { list: [1, 2, 3], nested: { k: 1 } };
  const snapshot = JSON.parse(JSON.stringify(a));
  applyPatch(a, diff(a, { list: [1], nested: { k: 2 } }));
  expect(a).toEqual(snapshot);
});
test("applyPatch inserts into arrays on add", () => {
  expect(applyPatch({ list: ["a", "c"] }, [{ op: "add", path: "/list/1", value: "b" }])).toEqual({ list: ["a", "b", "c"] });
});`,
    hints: [
      "Write `diff` as a recursive function that carries the current pointer path and pushes into a shared ops array.",
      "Branch on shape: both arrays, both plain objects, or otherwise compare with `Object.is` and emit `replace`. For arrays, emit removes in a descending loop so earlier removes do not shift later indexes.",
      "For `applyPatch`, `structuredClone` the doc, then for each op split the path on `/`, unescape `~1` then `~0`, walk to the parent, and use `splice` for arrays or assignment and `delete` for objects. Handle path `\"\"` as replacing the root.",
    ],
    solution: `const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const escapeKey = (k) => String(k).replaceAll("~", "~0").replaceAll("/", "~1");
const unescapeKey = (k) => k.replaceAll("~1", "/").replaceAll("~0", "~");

function diff(a, b, path = "", ops = []) {
  if (Array.isArray(a) && Array.isArray(b)) {
    const common = Math.min(a.length, b.length);
    for (let i = 0; i < common; i++) diff(a[i], b[i], path + "/" + i, ops);
    for (let i = common; i < b.length; i++) ops.push({ op: "add", path: path + "/" + i, value: b[i] });
    for (let i = a.length - 1; i >= common; i--) ops.push({ op: "remove", path: path + "/" + i });
  } else if (isPlainObject(a) && isPlainObject(b)) {
    for (const key of Object.keys(a)) {
      const p = path + "/" + escapeKey(key);
      if (!Object.hasOwn(b, key)) ops.push({ op: "remove", path: p });
      else diff(a[key], b[key], p, ops);
    }
    for (const key of Object.keys(b)) {
      if (!Object.hasOwn(a, key)) ops.push({ op: "add", path: path + "/" + escapeKey(key), value: b[key] });
    }
  } else if (!Object.is(a, b)) {
    ops.push({ op: "replace", path, value: b });
  }
  return ops;
}

function applyPatch(doc, ops) {
  let root = structuredClone(doc);
  for (const { op, path, value } of ops) {
    if (path === "") {
      root = op === "remove" ? undefined : structuredClone(value);
      continue;
    }
    const keys = path.slice(1).split("/").map(unescapeKey);
    const last = keys.pop();
    let parent = root;
    for (const k of keys) parent = parent[k];

    if (Array.isArray(parent)) {
      const i = Number(last);
      if (op === "add") parent.splice(i, 0, structuredClone(value));
      else if (op === "remove") parent.splice(i, 1);
      else parent[i] = structuredClone(value);
    } else if (op === "remove") {
      delete parent[last];
    } else {
      parent[last] = structuredClone(value);
    }
  }
  return root;
}`,
    explanation: `The diff is a parallel walk over both documents. Containers of the same kind recurse; everything else is compared by identity and replaced if different. Each node is visited once, so it runs in O(n) over the size of the documents.

Order is what makes the patch replayable. Array removes are emitted from the highest index down, because removing index 2 first would shift index 3 into its place. Adds go upward for the same reason. Pointer escaping matters as soon as a key contains \`/\`; unescaping \`~1\` before \`~0\` keeps \`~01\` from being misread.

Common mistakes: mutating the input in \`applyPatch\` (clone first), treating \`null\` or arrays as plain objects, and producing a minimal-looking diff for arrays that cannot actually be applied in order.

Follow-up: inserting at the front of an array produces a replace for every element. How would you detect moves or use an LCS-based array diff, and when is it worth it?`,
  },
  {
    id: "be-migration-order",
    title: "Migration runner ordering",
    track: "Backend",
    level: "Medium",
    minutes: 30,
    tags: ["graphs", "topological sort", "databases"],
    prompt: `Your migration tool lets each migration declare which others must run first. Before running anything, work out the order and fail fast on mistakes.

Write \`orderMigrations(migrations, applied = [])\`:

- \`migrations\` is an array of \`{ id, dependsOn? }\` (\`dependsOn\` is an array of ids, possibly missing).
- \`applied\` lists ids that have already run. They count as satisfied and are not returned.
- Return the ids still to run, so every migration comes after all of its dependencies.
- When several migrations are ready at the same time, pick the one that appears first in the input.
- A dependency that is neither in \`migrations\` nor in \`applied\` throws \`Error("Unknown dependency: <id>")\`.
- A cycle throws an error whose message starts with \`"Cycle detected"\`.

\`\`\`
orderMigrations([
  { id: "add_index", dependsOn: ["create_users"] },
  { id: "create_users" },
  { id: "seed", dependsOn: ["add_index", "create_users"] },
]);
// ["create_users", "add_index", "seed"]
\`\`\``,
    starter: `function orderMigrations(migrations, applied = []) {
  // your code here
}`,
    tests: `test("orders by dependencies", () => {
  expect(orderMigrations([
    { id: "add_index", dependsOn: ["create_users"] },
    { id: "create_users" },
    { id: "seed", dependsOn: ["add_index", "create_users"] },
  ])).toEqual(["create_users", "add_index", "seed"]);
});
test("returns [] for no migrations", () => {
  expect(orderMigrations([])).toEqual([]);
});
test("keeps input order for independent migrations", () => {
  expect(orderMigrations([{ id: "c" }, { id: "a" }, { id: "b" }])).toEqual(["c", "a", "b"]);
});
test("breaks ties by input order each time a migration becomes ready", () => {
  expect(orderMigrations([
    { id: "c", dependsOn: ["a"] },
    { id: "b" },
    { id: "a" },
    { id: "d" },
  ])).toEqual(["b", "a", "c", "d"]);
});
test("skips applied migrations and treats them as satisfied", () => {
  expect(orderMigrations([
    { id: "1_users" },
    { id: "2_posts", dependsOn: ["1_users"] },
    { id: "3_tags", dependsOn: ["2_posts"] },
  ], ["1_users"])).toEqual(["2_posts", "3_tags"]);
});
test("accepts dependencies that exist only in applied", () => {
  expect(orderMigrations([{ id: "b", dependsOn: ["a"] }], ["a"])).toEqual(["b"]);
});
test("throws on an unknown dependency", () => {
  expect(() => orderMigrations([{ id: "a", dependsOn: ["ghost"] }])).toThrow("Unknown dependency: ghost");
});
test("throws on a cycle", () => {
  expect(() => orderMigrations([
    { id: "a", dependsOn: ["c"] },
    { id: "b", dependsOn: ["a"] },
    { id: "c", dependsOn: ["b"] },
    { id: "d" },
  ])).toThrow(/^Cycle detected/);
});
test("throws on a self dependency", () => {
  expect(() => orderMigrations([{ id: "a", dependsOn: ["a"] }])).toThrow(/^Cycle detected/);
});`,
    hints: [
      "This is a topological sort. A migration is ready when every one of its dependencies is already done.",
      "Validate unknown dependencies first. Then repeatedly scan the remaining list from the front for the first ready migration, mark it done, and remove it.",
      "If a full scan finds nothing ready but migrations remain, every remaining one is waiting on another remaining one: that is a cycle.",
    ],
    solution: `function orderMigrations(migrations, applied = []) {
  const known = new Set(migrations.map((m) => m.id));
  const done = new Set(applied);
  const deps = (m) => m.dependsOn || [];

  for (const m of migrations) {
    for (const d of deps(m)) {
      if (!known.has(d) && !done.has(d)) throw new Error("Unknown dependency: " + d);
    }
  }

  const remaining = migrations.filter((m) => !done.has(m.id));
  const order = [];
  while (remaining.length) {
    const i = remaining.findIndex((m) => deps(m).every((d) => done.has(d)));
    if (i === -1) throw new Error("Cycle detected among: " + remaining.map((m) => m.id).join(", "));
    const [next] = remaining.splice(i, 1);
    done.add(next.id);
    order.push(next.id);
  }
  return order;
}`,
    explanation: `Migrations and their dependencies form a directed graph, and a valid run order is a topological sort. This is Kahn's algorithm in its simplest form: repeatedly take something with no unmet dependencies. If nothing qualifies while work remains, the leftovers must contain a cycle.

Scanning from the front of the remaining list on every step gives the deterministic tie-break the spec asks for, which matters for migrations: two developers running the tool should get the same order. The simple scan is O(n^2 * d), fine for hundreds of migrations; for large graphs you would keep in-degree counts and a min-heap keyed by input position for O((n + e) log n).

Common mistakes: a DFS-based sort that is correct but orders ties unpredictably, forgetting that already-applied migrations satisfy dependencies, and reporting a cycle as a stack overflow instead of a clear error.

Follow-up: how would you report the exact cycle path (a -> c -> b -> a) rather than just the stuck set?`,
  },
  {
    id: "be-cron-matcher",
    title: "Cron expression matcher",
    track: "Backend",
    level: "Medium",
    minutes: 35,
    tags: ["parsing", "scheduling", "dates"],
    prompt: `Your scheduler wakes up every minute and needs to know which jobs should fire. Write \`cronMatches(expr, date)\`.

\`expr\` has five space-separated fields: minute (0-59), hour (0-23), day of month (1-31), month (1-12), weekday (0-6, 0 is Sunday). Use the date's **UTC** parts.

Each field is a comma-separated list of parts, and each part is one of:

- \`*\` (every value)
- a number: \`5\`
- a range: \`1-5\`
- a step over \`*\` or a range: \`*/15\`, \`10-30/5\`

Day matching follows classic cron: if **both** day of month and weekday are restricted (neither is \`*\`), the date matches when **either** one matches. Otherwise both must match.

Throw \`Error("Invalid cron expression")\` if there are not exactly 5 fields or a value is out of range or malformed.

\`\`\`
cronMatches("*/15 9-17 * * 1-5", new Date("2026-03-02T09:30:00Z"))  // true (Monday 09:30)
cronMatches("0 0 1 * *", new Date("2026-03-02T00:00:00Z"))          // false
cronMatches("0 12 13 * 5", new Date("2026-03-06T12:00:00Z"))        // true (a Friday)
\`\`\``,
    starter: `function cronMatches(expr, date) {
  // your code here
}`,
    tests: `const at = (iso) => new Date(iso + "Z");
test("* * * * * matches any minute", () => {
  expect(cronMatches("* * * * *", at("2026-07-04T13:37:00"))).toBe(true);
});
test("matches exact minute and hour", () => {
  expect(cronMatches("30 9 * * *", at("2026-03-02T09:30:00"))).toBe(true);
  expect(cronMatches("30 9 * * *", at("2026-03-02T09:31:00"))).toBe(false);
});
test("supports steps, ranges and weekdays", () => {
  expect(cronMatches("*/15 9-17 * * 1-5", at("2026-03-02T09:30:00"))).toBe(true);
  expect(cronMatches("*/15 9-17 * * 1-5", at("2026-03-02T09:31:00"))).toBe(false);
  expect(cronMatches("*/15 9-17 * * 1-5", at("2026-03-01T09:30:00"))).toBe(false);
});
test("supports lists and stepped ranges", () => {
  expect(cronMatches("0,30 * * * *", at("2026-01-01T05:30:00"))).toBe(true);
  expect(cronMatches("10-30/10 * * * *", at("2026-01-01T05:20:00"))).toBe(true);
  expect(cronMatches("10-30/10 * * * *", at("2026-01-01T05:25:00"))).toBe(false);
  expect(cronMatches("10-30/10 * * * *", at("2026-01-01T05:40:00"))).toBe(false);
});
test("matches months as 1-12", () => {
  expect(cronMatches("0 0 1 1 *", at("2026-01-01T00:00:00"))).toBe(true);
  expect(cronMatches("0 0 1 12 *", at("2026-01-01T00:00:00"))).toBe(false);
});
test("uses OR when both day of month and weekday are restricted", () => {
  expect(cronMatches("0 12 13 * 5", at("2026-03-06T12:00:00"))).toBe(true);
  expect(cronMatches("0 12 13 * 5", at("2026-03-13T12:00:00"))).toBe(true);
  expect(cronMatches("0 12 13 * 5", at("2026-03-12T12:00:00"))).toBe(false);
});
test("uses AND when only one day field is restricted", () => {
  expect(cronMatches("0 0 13 * *", at("2026-03-06T00:00:00"))).toBe(false);
  expect(cronMatches("0 0 * * 5", at("2026-03-06T00:00:00"))).toBe(true);
});
test("tolerates extra spaces between fields", () => {
  expect(cronMatches("  0   0  * *  * ", at("2026-03-06T00:00:00"))).toBe(true);
});
test("rejects malformed expressions", () => {
  expect(() => cronMatches("* * * *", new Date())).toThrow("Invalid cron expression");
  expect(() => cronMatches("60 * * * *", new Date())).toThrow("Invalid cron expression");
  expect(() => cronMatches("* * 0 * *", new Date())).toThrow("Invalid cron expression");
  expect(() => cronMatches("*/0 * * * *", new Date())).toThrow("Invalid cron expression");
  expect(() => cronMatches("a * * * *", new Date())).toThrow("Invalid cron expression");
});`,
    hints: [
      "Turn each field into the set of values it allows, then the match is just five `set.has(...)` checks (with a special rule for the two day fields).",
      "For each comma part, split on `/` to get a range and a step. `*` means `[min, max]`, `a-b` means `[a, b]`, a single number means `[n, n]`. Then loop from low to high by step.",
      "Validate with `Number.isInteger` and the field's bounds. For days: `restricted = fields[2] !== \"*\" && fields[4] !== \"*\"`, then `restricted ? dom || dow : dom && dow`.",
    ],
    solution: `const CRON_LIMITS = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];

function parseField(field, min, max) {
  const values = new Set();
  for (const part of field.split(",")) {
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);
    let lo, hi;
    if (range === "*") [lo, hi] = [min, max];
    else if (range.includes("-")) [lo, hi] = range.split("-").map(Number);
    else lo = hi = Number(range);

    const ok = [lo, hi, step].every(Number.isInteger) && lo >= min && hi <= max && lo <= hi && step >= 1;
    if (!ok || range === "") throw new Error("Invalid cron expression");
    for (let v = lo; v <= hi; v += step) values.add(v);
  }
  return values;
}

function cronMatches(expr, date) {
  const fields = expr.split(" ").filter(Boolean);
  if (fields.length !== 5) throw new Error("Invalid cron expression");
  const [minutes, hours, days, months, weekdays] = fields.map((f, i) => parseField(f, ...CRON_LIMITS[i]));

  const dom = days.has(date.getUTCDate());
  const dow = weekdays.has(date.getUTCDay());
  const bothRestricted = fields[2] !== "*" && fields[4] !== "*";
  const dayOk = bothRestricted ? dom || dow : dom && dow;

  return minutes.has(date.getUTCMinutes()) && hours.has(date.getUTCHours()) && months.has(date.getUTCMonth() + 1) && dayOk;
}`,
    explanation: `Expanding each field into a set of allowed values separates parsing from matching. Once you have five sets, matching a date is five constant-time lookups, and the sets can be cached per job so parsing happens once.

Steps are the part people get wrong: \`10-30/10\` means start at 10 and count up by 10 within the range (10, 20, 30), not "every value divisible by 10". Starting the loop at \`lo\` gets this right for free. Remember that \`getUTCMonth()\` is zero-based while cron months are not.

The day-of-month and weekday OR rule is a famous cron quirk: \`0 12 13 * 5\` fires on every 13th and on every Friday, not only on Friday the 13th. Many naive implementations AND everything together.

Follow-up: write \`nextRun(expr, from)\`. Stepping minute by minute works but can scan a lot; jumping field by field (next valid month, then day, then hour) is much faster.`,
  },
  {
    id: "be-cookies",
    title: "Parse and serialize cookies",
    track: "Backend",
    level: "Easy",
    minutes: 25,
    tags: ["http", "headers", "strings"],
    prompt: `Write the two cookie helpers every web framework ships.

\`parseCookies(header)\` takes a \`Cookie\` request header and returns an object.

- Pairs are separated by \`;\`. Trim whitespace around names and values.
- Split each pair on the **first** \`=\` only; values may contain \`=\`.
- Strip one pair of surrounding double quotes from a value, then \`decodeURIComponent\` it (if decoding fails, keep the raw value).
- Skip pairs without \`=\`. If a name repeats, the first one wins. A missing or empty header returns \`{}\`.

\`serializeCookie(name, value, options = {})\` returns a \`Set-Cookie\` header value.

- Start with \`name=encodeURIComponent(value)\`.
- Throw \`Error("Invalid cookie name")\` if the name is empty or contains any of \`=\`, \`;\`, \`,\`, space.
- Append attributes in this order, each preceded by \`"; "\`: \`Max-Age=<floor(maxAge)>\`, \`Domain=<domain>\`, \`Path=<path>\`, \`Expires=<expires.toUTCString()>\`, \`HttpOnly\`, \`Secure\`, \`SameSite=<Strict|Lax|None>\`.
- \`sameSite\` accepts any case. \`sameSite: "none"\` without \`secure: true\` throws \`Error("SameSite=None requires Secure")\`.

\`\`\`
parseCookies("sid=abc123; theme=dark; token=a=b")
// { sid: "abc123", theme: "dark", token: "a=b" }
serializeCookie("sid", "abc 123", { httpOnly: true, path: "/", maxAge: 3600, sameSite: "lax" })
// "sid=abc%20123; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax"
\`\`\``,
    starter: `function parseCookies(header) {
  // your code here
}

function serializeCookie(name, value, options = {}) {
  // your code here
}`,
    tests: `test("parses a simple header", () => {
  expect(parseCookies("sid=abc123; theme=dark")).toEqual({ sid: "abc123", theme: "dark" });
});
test("returns {} for missing or empty headers", () => {
  expect(parseCookies(undefined)).toEqual({});
  expect(parseCookies("")).toEqual({});
});
test("splits on the first = only and trims whitespace", () => {
  expect(parseCookies("  token = a=b==  ;x=1")).toEqual({ token: "a=b==", x: "1" });
});
test("decodes values and strips quotes", () => {
  expect(parseCookies('name="Ana%20Lima"; bad=%E0%A4%A')).toEqual({ name: "Ana Lima", bad: "%E0%A4%A" });
});
test("first occurrence wins and pairs without = are skipped", () => {
  expect(parseCookies("a=1; junk; a=2")).toEqual({ a: "1" });
});
test("serializes a name and encoded value", () => {
  expect(serializeCookie("greeting", "hi there; ok")).toBe("greeting=hi%20there%3B%20ok");
});
test("serializes attributes in a fixed order", () => {
  const expires = new Date(Date.UTC(2030, 0, 1));
  expect(serializeCookie("sid", "abc", { secure: true, sameSite: "STRICT", httpOnly: true, expires, path: "/", domain: "example.com", maxAge: 59.9 }))
    .toBe("sid=abc; Max-Age=59; Domain=example.com; Path=/; Expires=Tue, 01 Jan 2030 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict");
});
test("matches the prompt example", () => {
  expect(serializeCookie("sid", "abc 123", { httpOnly: true, path: "/", maxAge: 3600, sameSite: "lax" })).toBe("sid=abc%20123; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax");
});
test("Max-Age=0 is still emitted", () => {
  expect(serializeCookie("sid", "", { maxAge: 0 })).toBe("sid=; Max-Age=0");
});
test("validates names and SameSite=None", () => {
  expect(() => serializeCookie("bad name", "x")).toThrow("Invalid cookie name");
  expect(() => serializeCookie("a=b", "x")).toThrow("Invalid cookie name");
  expect(() => serializeCookie("", "x")).toThrow("Invalid cookie name");
  expect(() => serializeCookie("sid", "x", { sameSite: "none" })).toThrow("SameSite=None requires Secure");
  expect(serializeCookie("sid", "x", { sameSite: "none", secure: true })).toBe("sid=x; Secure; SameSite=None");
});`,
    hints: [
      "Parsing is split on `;`, then `indexOf(\"=\")` on each piece. `split(\"=\")` would break values that contain `=`.",
      "Wrap `decodeURIComponent` in try/catch, and only set a key if it is not already present so the first occurrence wins.",
      "For serializing, push strings into an array in the required order and join with `\"; \"`. Check `maxAge != null` (not truthiness) so `0` is kept, and map `sameSite.toLowerCase()` through `{ strict: \"Strict\", lax: \"Lax\", none: \"None\" }`.",
    ],
    solution: `function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const pair of header.split(";")) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    let value = pair.slice(eq + 1).trim();
    if (!name || name in cookies) continue;
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep the raw value
    }
    cookies[name] = value;
  }
  return cookies;
}

const SAME_SITE = { strict: "Strict", lax: "Lax", none: "None" };

function serializeCookie(name, value, options = {}) {
  if (!name || /[=;, ]/.test(name)) throw new Error("Invalid cookie name");
  const parts = [name + "=" + encodeURIComponent(value)];
  if (options.maxAge != null) parts.push("Max-Age=" + Math.floor(options.maxAge));
  if (options.domain) parts.push("Domain=" + options.domain);
  if (options.path) parts.push("Path=" + options.path);
  if (options.expires) parts.push("Expires=" + options.expires.toUTCString());
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) {
    const sameSite = SAME_SITE[String(options.sameSite).toLowerCase()];
    if (sameSite === "None" && !options.secure) throw new Error("SameSite=None requires Secure");
    parts.push("SameSite=" + sameSite);
  }
  return parts.join("; ");
}`,
    explanation: `Cookies look simple but have a few traps. Values can legally contain \`=\` (base64 tokens often end in \`==\`), so you split on the first one only. Browsers send the most specific cookie first when two share a name, which is why "first wins" is the usual parsing rule.

Encoding the value on the way out and decoding on the way in means users can store any string without breaking the \`;\` separators. Decoding must not throw on malformed input from the client, since a bad cookie should never crash a request.

On the serialize side, \`maxAge: 0\` is meaningful (it deletes the cookie), so checking truthiness is a bug. Browsers now reject \`SameSite=None\` without \`Secure\`, and failing early in your code is kinder than a cookie that silently disappears.

Follow-up: how would you sign cookies so the server can detect tampering, and when would you encrypt them instead?`,
  },
  {
    id: "be-content-negotiation",
    title: "Accept header content negotiation",
    track: "Backend",
    level: "Medium",
    minutes: 25,
    tags: ["http", "headers", "parsing"],
    prompt: `Your endpoint can respond as JSON, HTML or CSV. Pick the best one for the client's \`Accept\` header.

Write \`negotiate(accept, available)\` where \`available\` is the server's list of types in preference order. Return the chosen type (as written in \`available\`) or \`null\` if nothing is acceptable.

- The header is a comma-separated list of media ranges, each with optional parameters: \`text/html;q=0.8\`. Only \`q\` matters (default 1). Compare types case-insensitively.
- A range matches a type exactly, as \`type/*\`, or as \`*/*\`.
- For each available type, use the **most specific** range that matches it (exact beats \`type/*\` beats \`*/*\`). Its \`q\` is that type's quality, even if a less specific range has a higher \`q\`.
- \`q=0\` means "not acceptable".
- Pick the highest quality. On a tie, prefer the type matched by the more specific range, then the earlier one in \`available\`.
- A missing or blank header accepts anything: return \`available[0]\` (or \`null\` if the list is empty).

\`\`\`
negotiate("text/html, application/json;q=0.9", ["application/json", "text/html"])  // "text/html"
negotiate("*/*;q=0.1, text/csv", ["application/json", "text/csv"])               // "text/csv"
negotiate("image/*", ["application/json"])                                        // null
\`\`\``,
    starter: `function negotiate(accept, available) {
  // your code here
}`,
    tests: `const types = ["application/json", "text/html", "text/csv"];
test("picks the highest q", () => {
  expect(negotiate("text/html, application/json;q=0.9", types)).toBe("text/html");
  expect(negotiate("text/html;q=0.5, application/json;q=0.9", types)).toBe("application/json");
});
test("uses server order to break ties", () => {
  expect(negotiate("text/csv, text/html", types)).toBe("text/html");
});
test("wildcards match", () => {
  expect(negotiate("text/*", types)).toBe("text/html");
  expect(negotiate("*/*", types)).toBe("application/json");
});
test("prefers a specific match over a wildcard with equal q", () => {
  expect(negotiate("*/*, text/csv", types)).toBe("text/csv");
});
test("the most specific range decides a type's quality", () => {
  expect(negotiate("*/*, application/json;q=0", types)).toBe("text/html");
  expect(negotiate("text/*;q=0.9, text/html;q=0.1", ["text/html", "text/csv"])).toBe("text/csv");
});
test("returns null when nothing is acceptable", () => {
  expect(negotiate("image/*", types)).toBeNull();
  expect(negotiate("application/json;q=0", ["application/json"])).toBeNull();
});
test("missing or blank header returns the first available type", () => {
  expect(negotiate(undefined, types)).toBe("application/json");
  expect(negotiate("   ", types)).toBe("application/json");
  expect(negotiate("", [])).toBeNull();
});
test("ignores other parameters, spaces and case", () => {
  expect(negotiate("Text/HTML ; charset=utf-8 ; q=0.4 ,  application/JSON ; q=0.3", types)).toBe("text/html");
});`,
    hints: [
      "First parse the header into `{ type, subtype, q }` objects. Split on `,`, then on `;`, and look for a `q=` parameter.",
      "For each available type, scan all ranges and keep the one with the highest specificity score (exact = 2, `type/*` = 1, `*/*` = 0). That range's q is the type's quality.",
      "Skip types with no match or q <= 0. Keep the best so far, replacing it only when q is strictly higher, or q is equal and specificity is strictly higher. Server order then wins naturally.",
    ],
    solution: `function parseAccept(header) {
  return header.split(",").map((part) => {
    const [range, ...params] = part.split(";").map((s) => s.trim().toLowerCase());
    let q = 1;
    for (const p of params) {
      const [key, val] = p.split("=").map((s) => s.trim());
      if (key === "q") q = Number(val);
    }
    const [type, subtype] = range.split("/");
    return { type, subtype, q: Number.isNaN(q) ? 0 : q };
  });
}

function negotiate(accept, available) {
  if (!accept || !accept.trim()) return available[0] ?? null;
  const ranges = parseAccept(accept);
  let best = null;

  for (const candidate of available) {
    const [type, subtype] = candidate.toLowerCase().split("/");
    let match = null;
    for (const r of ranges) {
      const specificity =
        r.type === type && r.subtype === subtype ? 2 : r.type === type && r.subtype === "*" ? 1 : r.type === "*" && r.subtype === "*" ? 0 : -1;
      if (specificity >= 0 && (!match || specificity > match.specificity)) match = { specificity, q: r.q };
    }
    if (!match || match.q <= 0) continue;
    if (!best || match.q > best.q || (match.q === best.q && match.specificity > best.specificity)) {
      best = { type: candidate, ...match };
    }
  }
  return best ? best.type : null;
}`,
    explanation: `Content negotiation is "score every option, pick the best". The scoring rule from the HTTP spec is that the most specific matching range wins, which lets clients say "anything except JSON" with \`*/*, application/json;q=0\`.

Picking the most specific range first and only then reading its q is what a naive "take the max q across all matching ranges" gets wrong: it would accept JSON in that example. Iterating \`available\` in server order and replacing only on a strictly better score means ties fall back to what the server prefers.

The work is O(a * r) for a available types and r ranges, both tiny in practice. Parsing defensively (trim, lowercase, bad q treated as 0) matters because Accept headers come from every client imaginable.

Follow-up: if nothing matches, should you return 406 Not Acceptable or just send your default? Many APIs choose the default, since a usable response usually beats an error.`,
  },
  {
    id: "be-redact-secrets",
    title: "Redact secrets from logs",
    track: "Backend",
    level: "Easy",
    minutes: 20,
    tags: ["security", "recursion", "logging"],
    prompt: `Someone logged a full request object and an API key ended up in your log store. Write a redaction step that runs before anything is logged.

\`redact(value, patterns = DEFAULT_PATTERNS)\` returns a deep copy of \`value\` where every property whose key matches a pattern has its value replaced with \`"[REDACTED]"\`.

- A key matches if it contains any pattern as a substring, case-insensitively. So \`"x-api-key"\` and \`"userPassword"\` both match.
- Redact the whole value, even if it is an object or array.
- Recurse into plain objects and arrays. Return other values (strings, numbers, \`null\`, etc.) as they are.
- Never mutate the input.
- A reference back to an ancestor (a cycle) becomes \`"[Circular]"\`. The same object appearing twice in different branches is **not** a cycle.

\`\`\`
const DEFAULT_PATTERNS = ["password", "secret", "token", "authorization", "api-key", "apikey", "api_key"];

redact({ user: "ana", headers: { Authorization: "Bearer x" }, items: [{ apiKey: 1 }] })
// { user: "ana", headers: { Authorization: "[REDACTED]" }, items: [{ apiKey: "[REDACTED]" }] }
\`\`\``,
    starter: `const DEFAULT_PATTERNS = ["password", "secret", "token", "authorization", "api-key", "apikey", "api_key"];

function redact(value, patterns = DEFAULT_PATTERNS) {
  // your code here
}`,
    tests: `test("redacts matching keys at any depth", () => {
  expect(redact({ user: "ana", headers: { Authorization: "Bearer x" }, items: [{ apiKey: 1 }] }))
    .toEqual({ user: "ana", headers: { Authorization: "[REDACTED]" }, items: [{ apiKey: "[REDACTED]" }] });
});
test("matches substrings case-insensitively", () => {
  expect(redact({ "x-api-key": "k", userPassword: "p", refresh_token: "t", tokenizer: "?" }))
    .toEqual({ "x-api-key": "[REDACTED]", userPassword: "[REDACTED]", refresh_token: "[REDACTED]", tokenizer: "[REDACTED]" });
});
test("redacts whole objects under a matching key", () => {
  expect(redact({ secrets: { a: 1, b: [2] } })).toEqual({ secrets: "[REDACTED]" });
});
test("leaves primitives and non-matching keys alone", () => {
  expect(redact("plain")).toBe("plain");
  expect(redact(null)).toBeNull();
  expect(redact({ id: 1, ok: true, note: null, list: [1, "two"] })).toEqual({ id: 1, ok: true, note: null, list: [1, "two"] });
});
test("does not mutate the input", () => {
  const input = { password: "hunter2", nested: { token: "t" } };
  redact(input);
  expect(input).toEqual({ password: "hunter2", nested: { token: "t" } });
});
test("supports custom patterns", () => {
  expect(redact({ ssn: "123", email: "a@b.c" }, ["ssn"])).toEqual({ ssn: "[REDACTED]", email: "a@b.c" });
});
test("replaces cycles with [Circular]", () => {
  const a = { name: "a" };
  a.self = a;
  a.list = [a];
  expect(redact(a)).toEqual({ name: "a", self: "[Circular]", list: ["[Circular]"] });
});
test("shared references that are not cycles are copied normally", () => {
  const shared = { v: 1 };
  expect(redact({ x: shared, y: shared })).toEqual({ x: { v: 1 }, y: { v: 1 } });
});`,
    hints: [
      "Write a recursive `walk(value)` that returns a new value. Primitives return as they are; arrays map over `walk`; objects build a new object key by key.",
      "Lowercase the patterns once, then test `key.toLowerCase().includes(p)` for each key before recursing.",
      "Track ancestors, not everything you have seen: add the object to a `Set` before walking its children and delete it afterwards. Hitting something already in the set means a cycle.",
    ],
    solution: `const DEFAULT_PATTERNS = ["password", "secret", "token", "authorization", "api-key", "apikey", "api_key"];

function redact(value, patterns = DEFAULT_PATTERNS) {
  const lowered = patterns.map((p) => p.toLowerCase());
  const isSecret = (key) => lowered.some((p) => key.toLowerCase().includes(p));
  const ancestors = new Set();

  function walk(v) {
    if (v === null || typeof v !== "object") return v;
    if (ancestors.has(v)) return "[Circular]";
    ancestors.add(v);
    let out;
    if (Array.isArray(v)) {
      out = v.map(walk);
    } else {
      out = {};
      for (const [key, child] of Object.entries(v)) out[key] = isSecret(key) ? "[REDACTED]" : walk(child);
    }
    ancestors.delete(v);
    return out;
  }

  return walk(value);
}`,
    explanation: `Redaction is a structural copy with one rule applied at each key. Building a new object instead of editing in place matters because the same request object is probably still being used to serve the request.

Cycle detection needs the set of objects on the current path, not every object visited. A request log often references the same object from two places (for example \`req.user\` and \`ctx.user\`); a "seen" set would wrongly mark the second one circular. Adding before recursing and removing after gives exactly the ancestor chain.

The walk is O(n) in the number of nodes. Common mistakes: exact key matching (missing \`X-Api-Key\` or \`accessToken\`), redacting only string values so a nested \`credentials\` object leaks, and crashing with a stack overflow on cyclic objects such as Node's request/response pair.

Follow-up: keys are not the only leak. How would you also catch secrets inside values, such as a bearer token embedded in a URL query string?`,
  },
  {
    id: "be-consistent-hashing",
    title: "Consistent hashing ring",
    track: "Backend",
    level: "Hard",
    minutes: 40,
    tags: ["distributed systems", "hashing", "binary search"],
    prompt: `Your cache cluster uses \`hash(key) % servers.length\`, so adding one server remaps almost every key. Replace it with a consistent hashing ring.

Implement \`class HashRing\`:

- \`new HashRing({ replicas = 100, hash = hash32 } = {})\`. \`hash\` maps a string to an unsigned 32-bit integer. \`hash32\` is provided in the starter.
- \`addNode(name)\`: place \`replicas\` virtual nodes on the ring at \`hash(name + "#" + i)\` for \`i = 0 .. replicas - 1\`. Adding an existing node does nothing.
- \`removeNode(name)\`: remove all of that node's virtual nodes.
- \`getNode(key)\`: hash the key and return the node owning the first virtual node with a hash **greater than or equal to** it, wrapping around to the smallest one. Return \`null\` if the ring is empty.

Keep virtual nodes sorted so \`getNode\` can binary search.

\`\`\`
const ring = new HashRing();
ring.addNode("cache-a"); ring.addNode("cache-b"); ring.addNode("cache-c");
ring.getNode("user:42");   // e.g. "cache-b", and always the same answer
ring.removeNode("cache-c"); // only keys that lived on cache-c move
\`\`\``,
    starter: `// FNV-1a with a final avalanche step, returning an unsigned 32-bit integer.
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

class HashRing {
  constructor({ replicas = 100, hash = hash32 } = {}) {
    // your code here
  }
  addNode(name) {}
  removeNode(name) {}
  getNode(key) {}
}`,
    tests: `const keys = Array.from({ length: 3000 }, (_, i) => "user:" + i);
const assign = (ring) => Object.fromEntries(keys.map((k) => [k, ring.getNode(k)]));
test("returns null for an empty ring", () => {
  expect(new HashRing().getNode("x")).toBeNull();
});
test("sends everything to a single node", () => {
  const ring = new HashRing();
  ring.addNode("a");
  expect(ring.getNode("anything")).toBe("a");
  expect(ring.getNode("else")).toBe("a");
});
test("picks the first virtual node clockwise, inclusive, and wraps around", () => {
  const table = { "a#0": 100, "b#0": 200, k1: 150, k2: 200, k3: 250, k4: 5 };
  const ring = new HashRing({ replicas: 1, hash: (s) => table[s] });
  ring.addNode("a"); ring.addNode("b");
  expect([ring.getNode("k1"), ring.getNode("k2"), ring.getNode("k3"), ring.getNode("k4")]).toEqual(["b", "b", "a", "a"]);
});
test("is deterministic", () => {
  const r1 = new HashRing(); const r2 = new HashRing();
  for (const n of ["a", "b", "c"]) { r1.addNode(n); r2.addNode(n); }
  expect(assign(r1)).toEqual(assign(r2));
});
test("spreads keys roughly evenly with virtual nodes", () => {
  const ring = new HashRing();
  ["a", "b", "c"].forEach((n) => ring.addNode(n));
  const counts = { a: 0, b: 0, c: 0 };
  keys.forEach((k) => counts[ring.getNode(k)]++);
  for (const n of ["a", "b", "c"]) {
    expect(counts[n]).toBeGreaterThan(700);
    expect(counts[n]).toBeLessThan(1300);
  }
});
test("removing a node only moves the keys it owned", () => {
  const ring = new HashRing();
  ["a", "b", "c", "d"].forEach((n) => ring.addNode(n));
  const before = assign(ring);
  ring.removeNode("c");
  const after = assign(ring);
  for (const k of keys) {
    if (before[k] !== "c") expect(after[k]).toBe(before[k]);
    else expect(after[k]).not.toBe("c");
  }
});
test("adding a node only moves keys onto the new node", () => {
  const ring = new HashRing();
  ["a", "b", "c"].forEach((n) => ring.addNode(n));
  const before = assign(ring);
  ring.addNode("d");
  const after = assign(ring);
  let moved = 0;
  for (const k of keys) if (after[k] !== before[k]) { moved++; expect(after[k]).toBe("d"); }
  expect(moved).toBeGreaterThan(400);
  expect(moved).toBeLessThan(1200);
});
test("adding the same node twice changes nothing", () => {
  const ring = new HashRing();
  ring.addNode("a"); ring.addNode("b");
  const before = assign(ring);
  ring.addNode("a");
  ring.removeNode("b");
  expect(Object.values(assign(ring)).every((n) => n === "a")).toBe(true);
  expect(Object.values(before).some((n) => n === "b")).toBe(true);
});`,
    hints: [
      "Picture the 32-bit hash space as a circle. Every virtual node is a point on it, and a key belongs to the next point clockwise.",
      "Keep a sorted array of `{ hash, node }`. Rebuild or re-sort it on add/remove (rare), and binary search it on lookup (frequent).",
      "Binary search for the first index whose hash is `>=` the key's hash. If that index equals the array length, wrap to index 0.",
    ],
    solution: `function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

class HashRing {
  constructor({ replicas = 100, hash = hash32 } = {}) {
    this.replicas = replicas;
    this.hash = hash;
    this.nodes = new Set();
    this.ring = []; // sorted by hash
  }

  addNode(name) {
    if (this.nodes.has(name)) return;
    this.nodes.add(name);
    for (let i = 0; i < this.replicas; i++) this.ring.push({ hash: this.hash(name + "#" + i), node: name });
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  removeNode(name) {
    if (!this.nodes.delete(name)) return;
    this.ring = this.ring.filter((v) => v.node !== name);
  }

  getNode(key) {
    if (!this.ring.length) return null;
    const h = this.hash(key);
    let lo = 0;
    let hi = this.ring.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.ring[mid].hash < h) lo = mid + 1;
      else hi = mid;
    }
    return this.ring[lo === this.ring.length ? 0 : lo].node;
  }
}`,
    explanation: `With modulo hashing, changing the server count changes \`hash % n\` for nearly every key, which empties the whole cache at once. On a ring, each key belongs to the next point clockwise, so adding a server only steals the arcs just before its points and removing one only hands its arcs to the neighbors. About 1/n of keys move.

Virtual nodes fix the other problem: with one point per server, arc lengths are wildly uneven and one server can own half the keys. A hundred points per server averages that out, and lets you weight bigger machines with more replicas.

Lookups are O(log(n * replicas)) with binary search; add and remove are O(R log R) for R virtual nodes because of the re-sort, which is fine since membership changes rarely. Common mistakes: a linear scan on every lookup, forgetting the wrap-around, and an off-by-one between \`>\` and \`>=\`.

Follow-up: how would you replicate each key to the next two distinct physical servers for redundancy? Walk clockwise and skip virtual nodes whose server you already picked.`,
  },
  {
    id: "be-kv-transactions",
    title: "Key-value store with TTL and transactions",
    track: "Backend",
    level: "Hard",
    minutes: 45,
    tags: ["data structures", "transactions", "time"],
    prompt: `Build the core of a tiny Redis-like store that supports expiring keys and nested transactions.

Implement \`class KVStore\`:

- \`new KVStore({ now } = {})\`: \`now()\` returns milliseconds (defaults to \`Date.now\`).
- \`set(key, value, { ttlMs } = {})\`: store a value. With \`ttlMs\`, the key expires once \`now() >= setTime + ttlMs\`. Setting without \`ttlMs\` clears any previous expiry.
- \`get(key)\`: the value, or \`undefined\` if missing or expired.
- \`delete(key)\`: remove the key.
- \`begin()\`: start a transaction. Transactions can nest.
- \`commit()\`: apply the innermost transaction's changes to its parent (or to the store if it is the outermost).
- \`rollback()\`: discard the innermost transaction's changes.
- \`commit()\` and \`rollback()\` with no open transaction throw \`Error("No transaction")\`.

Reads inside a transaction see that transaction's own writes and deletes, falling back to outer transactions and then the store.

\`\`\`
const db = new KVStore();
db.set("a", 1);
db.begin();
db.set("a", 2);
db.begin(); db.delete("a"); db.get("a");  // undefined
db.rollback();  db.get("a");              // 2
db.rollback();  db.get("a");              // 1
\`\`\``,
    starter: `class KVStore {
  constructor({ now = Date.now } = {}) {
    // your code here
  }
  set(key, value, { ttlMs } = {}) {}
  get(key) {}
  delete(key) {}
  begin() {}
  commit() {}
  rollback() {}
}`,
    tests: `function make() { const c = { t: 0 }; c.db = new KVStore({ now: () => c.t }); return c; }
test("sets, gets and deletes", () => {
  const { db } = make();
  db.set("a", 1);
  expect(db.get("a")).toBe(1);
  db.delete("a");
  expect(db.get("a")).toBeUndefined();
});
test("expires keys after ttlMs", () => {
  const c = make();
  c.db.set("session", "s1", { ttlMs: 1000 });
  c.t = 999;
  expect(c.db.get("session")).toBe("s1");
  c.t = 1000;
  expect(c.db.get("session")).toBeUndefined();
});
test("setting without ttl clears a previous expiry", () => {
  const c = make();
  c.db.set("k", 1, { ttlMs: 10 });
  c.db.set("k", 2);
  c.t = 1000000;
  expect(c.db.get("k")).toBe(2);
});
test("rollback discards changes", () => {
  const { db } = make();
  db.set("a", 1);
  db.begin();
  db.set("a", 2); db.set("b", 3); db.delete("a");
  expect(db.get("a")).toBeUndefined();
  db.rollback();
  expect(db.get("a")).toBe(1);
  expect(db.get("b")).toBeUndefined();
});
test("commit applies changes, including deletes", () => {
  const { db } = make();
  db.set("a", 1); db.set("gone", true);
  db.begin();
  db.set("a", 2); db.delete("gone");
  db.commit();
  expect(db.get("a")).toBe(2);
  expect(db.get("gone")).toBeUndefined();
  expect(() => db.rollback()).toThrow("No transaction");
});
test("nested rollback only discards the inner transaction", () => {
  const { db } = make();
  db.set("a", 1);
  db.begin(); db.set("a", 2);
  db.begin(); db.delete("a");
  expect(db.get("a")).toBeUndefined();
  db.rollback();
  expect(db.get("a")).toBe(2);
  db.rollback();
  expect(db.get("a")).toBe(1);
});
test("committing an inner transaction still lets the outer one roll back", () => {
  const { db } = make();
  db.begin();
  db.set("x", "outer");
  db.begin(); db.set("x", "inner"); db.set("y", 1); db.commit();
  expect(db.get("x")).toBe("inner");
  db.rollback();
  expect(db.get("x")).toBeUndefined();
  expect(db.get("y")).toBeUndefined();
});
test("a delete in an inner transaction survives committing into the outer one", () => {
  const { db } = make();
  db.set("k", 1);
  db.begin();
  db.begin(); db.delete("k"); db.commit();
  expect(db.get("k")).toBeUndefined();
  db.commit();
  expect(db.get("k")).toBeUndefined();
});
test("ttl works inside transactions", () => {
  const c = make();
  c.db.begin();
  c.db.set("t", 1, { ttlMs: 50 });
  c.db.commit();
  c.t = 50;
  expect(c.db.get("t")).toBeUndefined();
});
test("commit and rollback without a transaction throw", () => {
  const { db } = make();
  expect(() => db.commit()).toThrow("No transaction");
  expect(() => db.rollback()).toThrow("No transaction");
});`,
    hints: [
      "Model the store as a stack of layers (`Map`s). Layer 0 is the committed data; each `begin()` pushes an empty layer that records only what changed.",
      "Writes go to the top layer. Reads search from the top layer down and stop at the first layer that has the key. A delete inside a transaction has to be recorded too, so store a tombstone like `{ deleted: true }`.",
      "Store entries as `{ value, expiresAt }` and check expiry on read. `commit()` pops the top layer and copies each entry into the new top; when that new top is the base layer, apply tombstones as real deletes.",
    ],
    solution: `class KVStore {
  constructor({ now = Date.now } = {}) {
    this.now = now;
    this.layers = [new Map()]; // layers[0] is committed data
  }

  top() {
    return this.layers[this.layers.length - 1];
  }

  get(key) {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const entry = this.layers[i].get(key);
      if (!entry) continue;
      if (entry.deleted) return undefined;
      if (entry.expiresAt != null && this.now() >= entry.expiresAt) return undefined;
      return entry.value;
    }
    return undefined;
  }

  set(key, value, { ttlMs } = {}) {
    this.top().set(key, { value, expiresAt: ttlMs != null ? this.now() + ttlMs : null });
  }

  delete(key) {
    if (this.layers.length === 1) this.layers[0].delete(key);
    else this.top().set(key, { deleted: true });
  }

  begin() {
    this.layers.push(new Map());
  }

  rollback() {
    if (this.layers.length === 1) throw new Error("No transaction");
    this.layers.pop();
  }

  commit() {
    if (this.layers.length === 1) throw new Error("No transaction");
    const changes = this.layers.pop();
    const parent = this.top();
    const isBase = this.layers.length === 1;
    for (const [key, entry] of changes) {
      if (entry.deleted && isBase) parent.delete(key);
      else parent.set(key, entry);
    }
  }
}`,
    explanation: `A stack of change layers makes nested transactions cheap. \`begin\` is O(1), \`rollback\` is O(1) (just drop the layer), and \`commit\` is O(changes in that layer). Reads walk at most one map per open transaction. Compare that with snapshotting the whole store on every \`begin\`, which is O(n) per transaction.

Tombstones are the subtle part. If a delete inside a transaction simply removed the key from the top layer, the read would fall through to an older layer and find the old value again. Recording \`{ deleted: true }\` stops the lookup; only when changes reach the base layer does the delete become real.

Expiry is checked lazily on read, which keeps \`set\` and \`get\` O(1). Redis does the same, plus a background sweep that samples keys so expired data does not pile up in memory.

Follow-up: how would you add a \`count(value)\` command that stays O(1) inside nested transactions?`,
  },
  {
    id: "be-etag-conditional-get",
    title: "ETags and conditional GET",
    track: "Backend",
    level: "Easy",
    minutes: 25,
    tags: ["http", "caching", "middleware"],
    prompt: `Your product listing endpoint is polled constantly and the payload rarely changes. Save bandwidth with ETags so clients get a tiny 304 when nothing changed.

Write \`withETag(handler)\`. \`handler\` is \`async (req) => res\`. Return an \`async (req) => res\` wrapper. Requests are \`{ method, headers }\` with lowercase header names; responses are \`{ status, headers?, body }\`.

- Only \`GET\` and \`HEAD\` requests with a \`200\` response get an ETag. Everything else passes through untouched.
- Body to hash: the body string, or \`JSON.stringify(body)\` if it is not a string. The ETag is \`'"' + fnv1a(text).toString(16) + '"'\` (\`fnv1a\` is in the starter).
- Add an \`etag\` header to the response, keeping the handler's other headers.
- If \`if-none-match\` matches, return \`{ status: 304, headers, body: null }\` with the same headers (including \`etag\`).
- \`if-none-match\` can be a comma-separated list, can be \`*\`, and can contain weak tags like \`W/"abc"\`. Compare ignoring the \`W/\` prefix.
- \`HEAD\` responses always have \`body: null\`.

\`\`\`
const get = withETag(async () => ({ status: 200, headers: { "cache-control": "no-cache" }, body: { items: [] } }));
const first = await get({ method: "GET", headers: {} });
// { status: 200, headers: { "cache-control": "no-cache", etag: "\\"...\\"" }, body: { items: [] } }
await get({ method: "GET", headers: { "if-none-match": first.headers.etag } });
// { status: 304, headers: { "cache-control": "no-cache", etag: "..." }, body: null }
\`\`\``,
    starter: `function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function withETag(handler) {
  // your code here
}`,
    tests: `const listing = { items: [{ id: 1, name: "Lamp" }] };
const tagOf = (text) => '"' + fnv1a(text).toString(16) + '"';
const app = () => withETag(async () => ({ status: 200, headers: { "cache-control": "no-cache" }, body: listing }));
test("adds an etag header computed from the JSON body", async () => {
  const res = await app()({ method: "GET", headers: {} });
  expect(res).toEqual({ status: 200, headers: { "cache-control": "no-cache", etag: tagOf(JSON.stringify(listing)) }, body: listing });
});
test("hashes string bodies as they are", async () => {
  const res = await withETag(async () => ({ status: 200, body: "hello" }))({ method: "GET", headers: {} });
  expect(res.headers.etag).toBe(tagOf("hello"));
});
test("returns 304 with no body when the tag matches", async () => {
  const get = app();
  const first = await get({ method: "GET", headers: {} });
  const second = await get({ method: "GET", headers: { "if-none-match": first.headers.etag } });
  expect(second).toEqual({ status: 304, headers: first.headers, body: null });
});
test("returns 200 when the tag does not match", async () => {
  const res = await app()({ method: "GET", headers: { "if-none-match": '"deadbeef"' } });
  expect(res.status).toBe(200);
  expect(res.body).toEqual(listing);
});
test("matches against a list and ignores weak prefixes", async () => {
  const tag = tagOf(JSON.stringify(listing));
  const res = await app()({ method: "GET", headers: { "if-none-match": '"aaa", W/' + tag + ' , "bbb"' } });
  expect(res.status).toBe(304);
});
test("* matches any representation", async () => {
  expect((await app()({ method: "GET", headers: { "if-none-match": "*" } })).status).toBe(304);
});
test("HEAD gets the etag but no body", async () => {
  const res = await app()({ method: "HEAD", headers: {} });
  expect(res.status).toBe(200);
  expect(res.body).toBeNull();
  expect(res.headers.etag).toBe(tagOf(JSON.stringify(listing)));
});
test("passes through non-GET requests and non-200 responses untouched", async () => {
  const post = await app()({ method: "POST", headers: { "if-none-match": "*" } });
  expect(post).toEqual({ status: 200, headers: { "cache-control": "no-cache" }, body: listing });
  const missing = await withETag(async () => ({ status: 404, body: "nope" }))({ method: "GET", headers: { "if-none-match": "*" } });
  expect(missing).toEqual({ status: 404, body: "nope" });
});`,
    hints: [
      "Call the handler first and bail out early unless the method is GET/HEAD and the status is 200.",
      "Compute the tag from the serialized body, build `headers = { ...res.headers, etag }`, then look at `req.headers[\"if-none-match\"]`.",
      "Normalize each comma-separated entry with `.trim().replace(/^W\\//, \"\")` and compare to your tag; `*` matches anything. On a match return status 304 with `body: null`.",
    ],
    solution: `function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function withETag(handler) {
  return async function (req) {
    const res = await handler(req);
    const method = req.method.toUpperCase();
    if ((method !== "GET" && method !== "HEAD") || res.status !== 200) return res;

    const text = typeof res.body === "string" ? res.body : JSON.stringify(res.body);
    const etag = '"' + fnv1a(text).toString(16) + '"';
    const headers = { ...res.headers, etag };

    const ifNoneMatch = req.headers["if-none-match"];
    if (ifNoneMatch) {
      const tags = ifNoneMatch.split(",").map((t) => t.trim().replace(/^W\\//, ""));
      if (tags.includes("*") || tags.includes(etag)) return { status: 304, headers, body: null };
    }
    return { status: 200, headers, body: method === "HEAD" ? null : res.body };
  };
}`,
    explanation: `An ETag is a fingerprint of a response. The client stores it and sends it back as \`If-None-Match\`; if the fingerprint still matches, the server answers \`304 Not Modified\` with no body and the client reuses its cached copy. The response still has to be computed, but the expensive part for mobile clients, the transfer, disappears.

\`If-None-Match\` uses weak comparison, so \`W/"abc"\` and \`"abc"\` are considered the same, and it can list several tags (a client holding multiple cached variants) or \`*\`. Keeping the other headers on the 304 matters, because caches update their stored \`Cache-Control\` from it.

Common mistakes: adding ETags to errors or POST responses, dropping the original headers, and returning a body with a 304. Note FNV-1a is fine for change detection but not for anything security sensitive.

Follow-up: hashing still means building the full response. How would you get the ETag cheaper, for example from a row's \`updated_at\` or a version column, and skip the query entirely?`,
  },
  {
    id: "be-webhook-signature",
    title: "Verify webhook signatures",
    track: "Backend",
    level: "Medium",
    minutes: 35,
    tags: ["security", "crypto", "async"],
    prompt: `A payments provider sends you webhooks and signs them so you can tell real events from forged ones. Verify the signature with the Web Crypto API (\`crypto.subtle\`).

The provider sends a header like:

\`\`\`
t=1700000000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
\`\`\`

\`t\` is a Unix timestamp in **seconds**. Each \`v1\` is a lowercase hex HMAC-SHA256 of the string \`t + "." + payload\` using your webhook secret. There may be several \`v1\` entries during a secret rotation; any one matching is enough.

Write \`async verifyWebhook({ payload, header, secret, now, toleranceSec = 300 })\` where \`now\` is the current time in **milliseconds**. Return:

- \`{ ok: false, reason: "malformed" }\` if the header is missing, has no integer \`t\`, or has no \`v1\`.
- \`{ ok: false, reason: "expired" }\` if \`t\` is more than \`toleranceSec\` seconds away from \`now\` (in either direction).
- \`{ ok: false, reason: "bad_signature" }\` if no \`v1\` matches.
- \`{ ok: true }\` otherwise.

Compare signatures without returning early on the first differing character.

\`\`\`
await verifyWebhook({ payload: '{"id":"evt_1"}', header, secret: "whsec_test", now: 1700000010000 })
// { ok: true }
\`\`\``,
    starter: `async function verifyWebhook({ payload, header, secret, now, toleranceSec = 300 }) {
  // your code here
}`,
    tests: `async function sign(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}
const secret = "whsec_test";
const payload = '{"id":"evt_1","type":"charge.succeeded"}';
const t = 1700000000;
test("accepts a correctly signed event", async () => {
  const header = "t=" + t + ",v1=" + (await sign(secret, t + "." + payload));
  expect(await verifyWebhook({ payload, header, secret, now: t * 1000 + 10000 })).toEqual({ ok: true });
});
test("rejects a tampered payload", async () => {
  const header = "t=" + t + ",v1=" + (await sign(secret, t + "." + payload));
  expect(await verifyWebhook({ payload: payload.replace("succeeded", "refunded"), header, secret, now: t * 1000 })).toEqual({ ok: false, reason: "bad_signature" });
});
test("rejects the wrong secret", async () => {
  const header = "t=" + t + ",v1=" + (await sign("whsec_other", t + "." + payload));
  expect((await verifyWebhook({ payload, header, secret, now: t * 1000 })).reason).toBe("bad_signature");
});
test("signs the timestamp too, so it cannot be swapped", async () => {
  const sig = await sign(secret, t + "." + payload);
  const header = "t=" + (t + 60) + ",v1=" + sig;
  expect((await verifyWebhook({ payload, header, secret, now: t * 1000 })).reason).toBe("bad_signature");
});
test("rejects events outside the tolerance window in either direction", async () => {
  const header = "t=" + t + ",v1=" + (await sign(secret, t + "." + payload));
  expect((await verifyWebhook({ payload, header, secret, now: (t + 301) * 1000 })).reason).toBe("expired");
  expect((await verifyWebhook({ payload, header, secret, now: (t - 301) * 1000 })).reason).toBe("expired");
  expect((await verifyWebhook({ payload, header, secret, now: (t + 300) * 1000 })).ok).toBe(true);
  expect((await verifyWebhook({ payload, header, secret, now: (t + 30) * 1000, toleranceSec: 10 })).reason).toBe("expired");
});
test("accepts any matching v1 during secret rotation", async () => {
  const oldSig = await sign("whsec_old", t + "." + payload);
  const newSig = await sign(secret, t + "." + payload);
  const header = "t=" + t + ",v1=" + oldSig + ",v1=" + newSig;
  expect(await verifyWebhook({ payload, header, secret, now: t * 1000 })).toEqual({ ok: true });
});
test("reports malformed headers", async () => {
  for (const header of [undefined, "", "v1=abc", "t=abc,v1=abc", "t=" + t]) {
    expect(await verifyWebhook({ payload, header, secret, now: t * 1000 })).toEqual({ ok: false, reason: "malformed" });
  }
});
test("tolerates spaces around header parts", async () => {
  const header = " t=" + t + " , v1=" + (await sign(secret, t + "." + payload)) + " ";
  expect((await verifyWebhook({ payload, header, secret, now: t * 1000 })).ok).toBe(true);
});`,
    hints: [
      "Parse first: split the header on `,`, then each part on the first `=`, collecting `t` and every `v1`. Check the timestamp before doing any crypto.",
      "`crypto.subtle.importKey(\"raw\", new TextEncoder().encode(secret), { name: \"HMAC\", hash: \"SHA-256\" }, false, [\"sign\"])` gives you a key; `crypto.subtle.sign(\"HMAC\", key, bytes)` gives an ArrayBuffer to hex-encode.",
      "For a constant-time compare, return false on a length mismatch, otherwise OR together `a.charCodeAt(i) ^ b.charCodeAt(i)` over every index and check the total is 0.",
    ],
    solution: `async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyWebhook({ payload, header, secret, now, toleranceSec = 300 }) {
  if (typeof header !== "string") return { ok: false, reason: "malformed" };

  let timestamp = null;
  const signatures = [];
  for (const part of header.split(",")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (key === "t" && /^[0-9]+$/.test(value)) timestamp = Number(value);
    if (key === "v1" && value) signatures.push(value);
  }
  if (timestamp === null || signatures.length === 0) return { ok: false, reason: "malformed" };

  if (Math.abs(now / 1000 - timestamp) > toleranceSec) return { ok: false, reason: "expired" };

  const expected = await hmacHex(secret, timestamp + "." + payload);
  return signatures.some((sig) => timingSafeEqual(sig, expected)) ? { ok: true } : { ok: false, reason: "bad_signature" };
}`,
    explanation: `An HMAC proves two things at once: the sender knows the shared secret, and the payload was not changed in transit. Signing \`t + "." + payload\` binds the timestamp into the signature, so an attacker who captured an old event cannot simply update \`t\` to get past the tolerance check. The tolerance window is what turns that into replay protection.

Always verify against the raw request body exactly as received. Parsing JSON and re-serializing it can reorder keys or change whitespace, and the signature will no longer match.

A normal string compare returns as soon as characters differ, which in theory leaks how many leading characters were right through timing. Comparing every character and OR-ing the differences takes the same time regardless. Supporting several \`v1\` values lets the provider rotate secrets without dropping events.

Follow-up: the tolerance window still allows replays within five minutes. How would you close that gap? (Store processed event ids and ignore duplicates.)`,
  },
  {
    id: "be-semver",
    title: "Semver parse, compare and sort",
    track: "Backend",
    level: "Medium",
    minutes: 30,
    tags: ["parsing", "sorting", "versioning"],
    prompt: `Your package registry needs to sort versions correctly, and string sorting puts \`1.10.0\` before \`1.9.0\`. Implement Semantic Versioning ordering.

Write three functions:

- \`parseSemver(str)\`: accepts \`MAJOR.MINOR.PATCH\` with an optional leading \`v\`, optional \`-prerelease\` and optional \`+build\`. Returns \`{ major, minor, patch, prerelease, build }\` where \`prerelease\` and \`build\` are arrays of dot-separated identifiers (empty if absent). Numeric prerelease identifiers become numbers; everything else stays a string. Core numbers must not have leading zeros. Identifiers may contain only \`[0-9A-Za-z-]\` and cannot be empty. Throw \`Error("Invalid version: <str>")\` otherwise.
- \`compareSemver(a, b)\`: returns \`-1\`, \`0\` or \`1\`.
- \`sortVersions(list)\`: returns a new array sorted ascending. Does not mutate \`list\`.

Ordering rules:

1. Compare major, minor, patch numerically.
1. A version with a prerelease is lower than the same version without one.
1. Prerelease identifiers compare left to right: numbers numerically, strings by ASCII, and a number is always lower than a string. If all shared identifiers are equal, the shorter list is lower.
1. Build metadata is ignored.

\`\`\`
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0
\`\`\``,
    starter: `function parseSemver(str) {
  // your code here
}

function compareSemver(a, b) {
  // your code here
}

function sortVersions(list) {
  // your code here
}`,
    tests: `test("parses a full version", () => {
  expect(parseSemver("v1.2.3-beta.11+build.5")).toEqual({ major: 1, minor: 2, patch: 3, prerelease: ["beta", 11], build: ["build", "5"] });
});
test("parses a plain version", () => {
  expect(parseSemver("0.10.0")).toEqual({ major: 0, minor: 10, patch: 0, prerelease: [], build: [] });
});
test("rejects invalid versions", () => {
  for (const bad of ["1.2", "1.2.3.4", "01.2.3", "1.2.x", "1.2.3-", "1.2.3-alpha..1", "1.2.3+", "1.2.3-al_pha", ""]) {
    expect(() => parseSemver(bad)).toThrow("Invalid version");
  }
});
test("compares core versions numerically", () => {
  expect(compareSemver("1.10.0", "1.9.0")).toBe(1);
  expect(compareSemver("2.0.0", "10.0.0")).toBe(-1);
  expect(compareSemver("1.2.3", "v1.2.3")).toBe(0);
});
test("prerelease is lower than the release", () => {
  expect(compareSemver("1.0.0-rc.1", "1.0.0")).toBe(-1);
  expect(compareSemver("1.0.0", "1.0.0-rc.1")).toBe(1);
});
test("follows the spec's prerelease precedence", () => {
  const ordered = ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta", "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0"];
  for (let i = 0; i < ordered.length - 1; i++) expect(compareSemver(ordered[i], ordered[i + 1])).toBe(-1);
});
test("ignores build metadata", () => {
  expect(compareSemver("1.0.0+20260101", "1.0.0+exp.sha.5114f85")).toBe(0);
});
test("sortVersions sorts without mutating", () => {
  const input = ["1.10.0", "1.2.0", "1.2.0-beta", "0.9.9", "1.2.0-alpha.10", "1.2.0-alpha.9"];
  const copy = input.slice();
  expect(sortVersions(input)).toEqual(["0.9.9", "1.2.0-alpha.9", "1.2.0-alpha.10", "1.2.0-beta", "1.2.0", "1.10.0"]);
  expect(input).toEqual(copy);
});`,
    hints: [
      "Parse by splitting rather than one giant regex: strip the `v`, split off `+build` at the first `+`, then `-prerelease` at the first `-`, then split the core on `.`.",
      "Validate each core part with `/^(0|[1-9][0-9]*)$/` and each identifier with `/^[0-9A-Za-z-]+$/`. Turn all-digit prerelease identifiers into numbers.",
      "Compare core parts in order. Then handle prerelease: empty beats non-empty, otherwise walk shared indexes (number vs string means the number is lower) and finally compare lengths.",
    ],
    solution: `const CORE = /^(0|[1-9][0-9]*)$/;
const IDENT = /^[0-9A-Za-z-]+$/;

function parseSemver(str) {
  const fail = () => {
    throw new Error("Invalid version: " + str);
  };
  let rest = String(str).startsWith("v") ? str.slice(1) : String(str);

  let build = [];
  const plus = rest.indexOf("+");
  if (plus !== -1) {
    build = rest.slice(plus + 1).split(".");
    rest = rest.slice(0, plus);
  }
  let prerelease = [];
  const dash = rest.indexOf("-");
  if (dash !== -1) {
    prerelease = rest.slice(dash + 1).split(".");
    rest = rest.slice(0, dash);
  }

  const core = rest.split(".");
  if (core.length !== 3 || !core.every((p) => CORE.test(p))) fail();
  if (![...prerelease, ...build].every((id) => IDENT.test(id))) fail();

  const [major, minor, patch] = core.map(Number);
  return {
    major,
    minor,
    patch,
    prerelease: prerelease.map((id) => (/^[0-9]+$/.test(id) ? Number(id) : id)),
    build,
  };
}

function compareIdentifiers(x, y) {
  if (x === y) return 0;
  const xNum = typeof x === "number";
  const yNum = typeof y === "number";
  if (xNum && !yNum) return -1;
  if (!xNum && yNum) return 1;
  return x < y ? -1 : 1;
}

function compareSemver(a, b) {
  const va = parseSemver(a);
  const vb = parseSemver(b);
  for (const k of ["major", "minor", "patch"]) {
    if (va[k] !== vb[k]) return va[k] < vb[k] ? -1 : 1;
  }
  const pa = va.prerelease;
  const pb = vb.prerelease;
  if (!pa.length || !pb.length) return Math.sign(pb.length - pa.length);
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
    const c = compareIdentifiers(pa[i], pb[i]);
    if (c) return c;
  }
  return Math.sign(pa.length - pb.length);
}

function sortVersions(list) {
  return [...list].sort(compareSemver);
}`,
    explanation: `Version strings look sortable but are really tuples. Parsing them into numbers and identifier lists first, then comparing field by field, is the same idea as comparing dates by year, month, then day.

The prerelease rules are the interesting part. A release outranks its own prereleases (\`1.0.0-rc.1 < 1.0.0\`), which the length check handles in one line: if either list is empty, the empty one is higher. Within prereleases, numeric identifiers compare as numbers so \`beta.11\` beats \`beta.2\`, and numbers rank below words so \`alpha.1 < alpha.beta\`.

Sorting is O(n log n) comparisons. In a real registry you would parse each version once and sort the parsed objects instead of re-parsing inside the comparator. Common mistakes: string comparison of the core, treating \`-\` inside a prerelease (\`1.0.0-x-y\`) as another separator, and letting build metadata affect order.

Follow-up: implement \`satisfies(version, "^1.2.0")\`. Caret ranges allow changes that do not modify the left-most non-zero part.`,
  },
  {
    id: "be-feature-flag-rollout",
    title: "Percentage feature flag rollout",
    track: "Backend",
    level: "Easy",
    minutes: 20,
    tags: ["hashing", "feature flags", "determinism"],
    prompt: `You want to ship a new checkout to 10% of users, then 25%, then everyone. Each user must get a stable answer (no flickering between requests), and growing the percentage must keep everyone who already had the feature.

Write two functions:

- \`fnv1a(str)\`: the 32-bit FNV-1a hash as an unsigned integer. Start with offset basis \`0x811c9dc5\`; for each UTF-16 code unit, XOR it into the hash, then multiply by the prime \`0x01000193\` modulo 2^32 (\`Math.imul\` helps). Return \`h >>> 0\`.
- \`isEnabled(flag, userId)\`: \`flag\` is \`{ key, enabled, percentage, allow?, deny? }\`.

Rules for \`isEnabled\`, in order:

1. If \`enabled\` is false, return \`false\`.
1. If \`userId\` is in \`deny\`, return \`false\`.
1. If \`userId\` is in \`allow\`, return \`true\`.
1. Otherwise compute \`bucket = fnv1a(flag.key + ":" + userId) % 100\` and return \`bucket < percentage\`.

Including the flag key in the hash means different flags pick different users.

\`\`\`
fnv1a("")   // 2166136261
fnv1a("a")  // 3826002220
isEnabled({ key: "new-checkout", enabled: true, percentage: 100 }, "u1")  // true
\`\`\``,
    starter: `function fnv1a(str) {
  // your code here
}

function isEnabled(flag, userId) {
  // your code here
}`,
    tests: `const users = Array.from({ length: 10000 }, (_, i) => "user-" + i);
const flag = (over) => ({ key: "new-checkout", enabled: true, percentage: 25, ...over });
test("fnv1a matches known test vectors", () => {
  expect(fnv1a("")).toBe(2166136261);
  expect(fnv1a("a")).toBe(3826002220);
  expect(fnv1a("foobar")).toBe(3214735720);
});
test("fnv1a always returns an unsigned 32-bit integer", () => {
  for (const s of ["x", "hello world", "user-123:flag", "ünïcödé"]) {
    const h = fnv1a(s);
    expect(Number.isInteger(h) && h >= 0 && h < 2 ** 32).toBe(true);
  }
});
test("0% enables nobody and 100% enables everybody", () => {
  expect(users.some((u) => isEnabled(flag({ percentage: 0 }), u))).toBe(false);
  expect(users.every((u) => isEnabled(flag({ percentage: 100 }), u))).toBe(true);
});
test("enables roughly the requested share of users", () => {
  const count = users.filter((u) => isEnabled(flag({ percentage: 25 }), u)).length;
  expect(count).toBeGreaterThan(2200);
  expect(count).toBeLessThan(2800);
});
test("is stable and only grows as the percentage increases", () => {
  const at10 = users.filter((u) => isEnabled(flag({ percentage: 10 }), u));
  const again = users.filter((u) => isEnabled(flag({ percentage: 10 }), u));
  expect(again).toEqual(at10);
  expect(at10.every((u) => isEnabled(flag({ percentage: 30 }), u))).toBe(true);
});
test("uses the bucket formula from the prompt", () => {
  for (const u of users.slice(0, 200)) {
    expect(isEnabled(flag({ percentage: 50 }), u)).toBe(fnv1a("new-checkout:" + u) % 100 < 50);
  }
});
test("different flag keys select different users", () => {
  const a = users.filter((u) => isEnabled(flag({ key: "flag-a", percentage: 50 }), u));
  const b = new Set(users.filter((u) => isEnabled(flag({ key: "flag-b", percentage: 50 }), u)));
  const overlap = a.filter((u) => b.has(u)).length;
  expect(overlap).toBeLessThan(a.length * 0.6);
});
test("disabled beats deny beats allow beats percentage", () => {
  expect(isEnabled(flag({ enabled: false, allow: ["vip"] }), "vip")).toBe(false);
  expect(isEnabled(flag({ percentage: 100, deny: ["bad"], allow: ["bad"] }), "bad")).toBe(false);
  expect(isEnabled(flag({ percentage: 0, allow: ["vip"] }), "vip")).toBe(true);
});`,
    hints: [
      "The whole trick is that the same input always hashes to the same number, so a user's bucket never changes for a given flag.",
      "FNV-1a: `let h = 0x811c9dc5; for each char: h ^= code; h = Math.imul(h, 0x01000193);` and return `h >>> 0`. `Math.imul` keeps the multiply in 32 bits.",
      "Check the rules top to bottom with early returns. The bucket is `fnv1a(flag.key + \":\" + userId) % 100`; because `bucket < pct` only gets easier as pct grows, rollouts only add users.",
    ],
    solution: `function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function isEnabled(flag, userId) {
  if (!flag.enabled) return false;
  if (flag.deny && flag.deny.includes(userId)) return false;
  if (flag.allow && flag.allow.includes(userId)) return true;
  const bucket = fnv1a(flag.key + ":" + userId) % 100;
  return bucket < flag.percentage;
}`,
    explanation: `Hashing the user id gives every user a fixed, pseudo-random bucket from 0 to 99 without storing anything. The flag is on for buckets below the percentage, so raising 10% to 30% only adds buckets 10 to 29: nobody who had the feature loses it, which is what keeps a rollout from flickering.

Mixing the flag key into the hash input is important. Without it, the same 10% of users would be guinea pigs for every experiment, which skews results and annoys those users.

FNV-1a is a good fit: tiny, fast and well distributed for short strings. \`Math.imul\` performs a true 32-bit multiply; a plain \`*\` produces floats that lose precision past 2^53, and forgetting \`>>> 0\` leaves negative numbers that break \`% 100\`.

Follow-up: \`% 100\` gives whole percents only. How would you support 0.5% rollouts? (Use \`% 10000\` and compare against \`percentage * 100\`.)`,
  },
  {
    id: "be-request-logger",
    title: "Structured request logger middleware",
    track: "Backend",
    level: "Easy",
    minutes: 20,
    tags: ["middleware", "logging", "observability"],
    prompt: `Your service logs are free-form strings that nobody can query. Write middleware that emits one structured log entry per request.

Write \`requestLogger({ now, log })\` returning Koa-style middleware \`async (ctx, next)\`. \`now()\` returns milliseconds; \`log(entry)\` receives a plain object.

\`ctx\` looks like \`{ method, path, headers, status? }\`. After \`await next()\` finishes, call \`log\` exactly once with:

\`\`\`
{ level, method, path, status, durationMs, requestId }
\`\`\`

- \`durationMs\` is \`now()\` after \`next\` minus \`now()\` before it.
- \`status\` is \`ctx.status\`, defaulting to \`404\` if nothing set it.
- \`requestId\` is \`ctx.headers["x-request-id"]\`, or \`"-"\` if missing.
- \`level\` is \`"info"\` below 400, \`"warn"\` for 400-499, \`"error"\` for 500 and up.
- If \`next\` throws, log with \`status\` set to \`err.status\` (or 500 if it has none), add an \`error\` field with the error message, then rethrow the same error. The \`error\` field appears only in that case.

\`\`\`
// GET /users took 12ms and set ctx.status = 200
{ level: "info", method: "GET", path: "/users", status: 200, durationMs: 12, requestId: "abc" }
\`\`\``,
    starter: `function requestLogger({ now = Date.now, log }) {
  // your code here
  return async (ctx, next) => {};
}`,
    tests: `function setup(times) { const entries = []; const queue = times.slice(); const mw = requestLogger({ now: () => queue.shift(), log: (e) => entries.push(e) }); return { mw, entries }; }
const ctxFor = (over) => ({ method: "GET", path: "/users", headers: { "x-request-id": "abc" }, ...over });
test("does not log until next has finished", async () => {
  const { mw, entries } = setup([1000, 1012]);
  let seenDuringNext = null;
  await mw(ctxFor(), async () => { seenDuringNext = entries.length; });
  expect(seenDuringNext).toBe(0);
  expect(entries).toHaveLength(1);
});
test("logs one structured entry after next completes", async () => {
  const { mw, entries } = setup([1000, 1012]);
  const ctx = ctxFor();
  await mw(ctx, async () => { ctx.status = 200; });
  expect(entries).toEqual([{ level: "info", method: "GET", path: "/users", status: 200, durationMs: 12, requestId: "abc" }]);
});
test("waits for downstream async work before measuring", async () => {
  const { mw, entries } = setup([0, 30]);
  const ctx = ctxFor();
  let finished = false;
  await mw(ctx, async () => { await sleep(10); ctx.status = 201; finished = true; });
  expect(finished).toBe(true);
  expect(entries[0].status).toBe(201);
  expect(entries[0].durationMs).toBe(30);
});
test("defaults status to 404 and request id to -", async () => {
  const { mw, entries } = setup([5, 6]);
  await mw(ctxFor({ headers: {} }), async () => {});
  expect(entries[0]).toEqual({ level: "warn", method: "GET", path: "/users", status: 404, durationMs: 1, requestId: "-" });
});
test("chooses the level from the status", async () => {
  const levels = [];
  for (const status of [200, 302, 400, 499, 500, 503]) {
    const { mw, entries } = setup([0, 1]);
    const ctx = ctxFor();
    await mw(ctx, async () => { ctx.status = status; });
    levels.push(entries[0].level);
  }
  expect(levels).toEqual(["info", "info", "warn", "warn", "error", "error"]);
});
test("logs and rethrows errors with status 500", async () => {
  const { mw, entries } = setup([100, 150]);
  const boom = new Error("db timeout");
  const caught = await rejects(() => mw(ctxFor({ method: "POST" }), async () => { throw boom; }));
  expect(caught).toBe(boom);
  expect(entries).toEqual([{ level: "error", method: "POST", path: "/users", status: 500, durationMs: 50, requestId: "abc", error: "db timeout" }]);
});
test("uses err.status when the error has one", async () => {
  const { mw, entries } = setup([0, 2]);
  const err = Object.assign(new Error("forbidden"), { status: 403 });
  await rejects(() => mw(ctxFor(), async () => { throw err; }), "forbidden");
  expect(entries[0].status).toBe(403);
  expect(entries[0].level).toBe("warn");
});`,
    hints: [
      "Read the clock once before `await next()` and once after, in both the success and the error path.",
      "A `try { await next() } catch (err) { ... throw err; }` lets you log failures and still let the error propagate. A `finally` is a neat place to log exactly once.",
      "Build the entry in one helper: compute `status`, pick the level with two comparisons, and only add `error` when you caught something.",
    ],
    solution: `function requestLogger({ now = Date.now, log }) {
  const levelFor = (status) => (status >= 500 ? "error" : status >= 400 ? "warn" : "info");

  return async (ctx, next) => {
    const start = now();
    let error = null;
    try {
      await next();
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const status = error ? error.status || 500 : ctx.status || 404;
      const entry = {
        level: levelFor(status),
        method: ctx.method,
        path: ctx.path,
        status,
        durationMs: now() - start,
        requestId: (ctx.headers && ctx.headers["x-request-id"]) || "-",
      };
      if (error) entry.error = error.message;
      log(entry);
    }
  };
}`,
    explanation: `Wrapping \`await next()\` is the whole trick: everything downstream, including async database calls, finishes before the second clock read, so the duration covers the full request. Using \`finally\` guarantees exactly one log line whether the request succeeded or threw, and the \`throw\` in the catch keeps the error flowing to whatever error handler sits upstream.

Structured entries (objects with stable field names) are what make logs queryable: you can graph \`durationMs\` by \`path\` or alert on \`level: "error"\` without regexes. Carrying the request id lets you join this line with logs from other services that handled the same request.

Injecting \`now\` keeps the middleware deterministic in tests. In production you would use \`performance.now()\` for sub-millisecond, monotonic timing, since \`Date.now()\` can jump when the system clock is adjusted.

Common mistakes: logging before \`next\` resolves, swallowing the error, and logging twice on failure. Follow-up: how would you generate a request id when the client did not send one and pass it to downstream services?`,
  },
);
