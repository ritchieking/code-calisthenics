(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "fe-undo-redo",
    title: "Undo/redo history",
    track: "Frontend",
    level: "Easy",
    minutes: 20,
    tags: ["state", "stacks"],
    prompt: `Your drawing tool needs Cmd+Z. Write a history container for any value (it treats values as immutable snapshots).

\`createHistory(initial, { capacity = 100 } = {})\` returns an object with:

- \`current()\`: the present value.
- \`set(value)\`: makes \`value\` the present and records the old present as an undo step. Clears the redo stack. Setting a value that is identical to the present (\`Object.is\`) is ignored. Returns the present.
- \`undo()\` / \`redo()\`: move back or forward one step and return the new present. With nothing to undo or redo, they do nothing and return the present.
- \`canUndo()\` / \`canRedo()\`: booleans.
- At most \`capacity\` undo steps are kept. When a new step would go over the limit, the **oldest** step is dropped.

\`\`\`js
const h = createHistory("a", { capacity: 2 });
h.set("b"); h.set("c"); h.set("d"); // "a" falls off
h.undo(); // "c"
h.undo(); // "b"
h.undo(); // "b" (nothing left)
h.redo(); // "c"
\`\`\``,
    starter: `function createHistory(initial, options) {\n  // your code here\n}`,
    tests: `test("starts at the initial value with nothing to undo or redo", () => {
  const h = createHistory(0);
  expect(h.current()).toBe(0);
  expect(h.canUndo()).toBe(false);
  expect(h.canRedo()).toBe(false);
});
test("undo and redo walk through set values", () => {
  const h = createHistory("a");
  h.set("b");
  h.set("c");
  expect(h.undo()).toBe("b");
  expect(h.undo()).toBe("a");
  expect(h.canUndo()).toBe(false);
  expect(h.redo()).toBe("b");
  expect(h.redo()).toBe("c");
  expect(h.canRedo()).toBe(false);
  expect(h.current()).toBe("c");
});
test("set after undo clears the redo stack", () => {
  const h = createHistory(1);
  h.set(2);
  h.set(3);
  h.undo();
  h.set(99);
  expect(h.canRedo()).toBe(false);
  expect(h.redo()).toBe(99);
  expect(h.undo()).toBe(2);
});
test("undo and redo at the edges are no-ops", () => {
  const h = createHistory("x");
  expect(h.undo()).toBe("x");
  expect(h.redo()).toBe("x");
  h.set("y");
  expect(h.redo()).toBe("y");
});
test("drops the oldest steps beyond capacity", () => {
  const h = createHistory("a", { capacity: 2 });
  h.set("b");
  h.set("c");
  h.set("d");
  expect(h.undo()).toBe("c");
  expect(h.undo()).toBe("b");
  expect(h.canUndo()).toBe(false);
  expect(h.undo()).toBe("b");
  expect(h.redo()).toBe("c");
  expect(h.redo()).toBe("d");
});
test("ignores setting the same value", () => {
  const h = createHistory("a");
  h.set("b");
  h.set("b");
  h.set("b");
  expect(h.undo()).toBe("a");
  expect(h.canUndo()).toBe(false);
});
test("stores object snapshots by reference", () => {
  const s1 = { shapes: [] };
  const s2 = { shapes: [{ id: 1 }] };
  const h = createHistory(s1);
  h.set(s2);
  expect(h.undo()).toBe(s1);
  expect(h.redo()).toBe(s2);
});
test("defaults to a capacity of 100", () => {
  const h = createHistory(0);
  for (let i = 1; i <= 150; i++) h.set(i);
  let steps = 0;
  while (h.canUndo()) { h.undo(); steps++; }
  expect(steps).toBe(100);
  expect(h.current()).toBe(50);
});`,
    hints: [
      "Picture three slots: the past (a stack), the present (one value) and the future (another stack).",
      "set pushes the present onto past and clears future. undo pushes the present onto future and pops past into present. redo is the mirror image.",
      "After pushing onto past in set, if (past.length > capacity) past.shift() drops the oldest. Check Object.is(value, present) first and return early so a no-op change doesn't create an undo step.",
    ],
    solution: `function createHistory(initial, { capacity = 100 } = {}) {
  const past = [];
  let present = initial;
  let future = [];

  return {
    current: () => present,
    set(value) {
      if (Object.is(value, present)) return present;
      past.push(present);
      if (past.length > capacity) past.shift(); // forget the oldest step
      present = value;
      future = [];
      return present;
    },
    undo() {
      if (past.length === 0) return present;
      future.push(present);
      present = past.pop();
      return present;
    },
    redo() {
      if (future.length === 0) return present;
      past.push(present);
      present = future.pop();
      return present;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}`,
    explanation: `Two stacks around a present value is the standard model, and it is exactly how Redux-undo and most editors work. Undo and redo are symmetric moves between the stacks, and both are O(1). Any new edit makes the redo future invalid, which is why \`set\` clears it.

The capacity check runs on \`set\` only. \`redo\` can never push past the limit, because it only refills slots that \`undo\` freed. \`past.shift()\` is O(capacity), which is fine for 100 entries. A ring buffer makes it O(1) if you need thousands.

Common mistakes: forgetting to clear the redo stack on a new edit (you can then "redo" into a timeline that no longer exists), recording no-op changes (the user presses Cmd+Z and nothing seems to happen), and storing mutable objects that are later edited in place, which silently rewrites history. Snapshots only work if the values are treated as immutable.

Follow-up: "Typing a word creates one step per keystroke. How would you group them?" Coalesce edits that arrive within a short window, or that share a transaction id, by replacing the present instead of pushing a new step.`,
  },
  {
    id: "fe-todo-reducer",
    title: "Todo reducer",
    track: "Frontend",
    level: "Easy",
    minutes: 20,
    tags: ["state", "immutability", "reducers"],
    prompt: `Write the reducer for a todo app. It must never mutate its input, so React and Redux can detect changes by reference.

\`todoReducer(state, action)\` takes \`state = { todos: [{ id, text, done }], nextId }\` and returns the next state.

- \`{ type: "add", text }\`: trims \`text\`. If it is empty, return \`state\` unchanged. Otherwise append \`{ id: nextId, text, done: false }\` and increment \`nextId\`.
- \`{ type: "toggle", id }\`: flips \`done\`.
- \`{ type: "edit", id, text }\`: sets the trimmed text. Editing to empty text **removes** the todo.
- \`{ type: "remove", id }\`: removes the todo.
- \`{ type: "clearCompleted" }\`: removes every done todo.

Rules: don't mutate \`state\`, its \`todos\` array, or any todo. Todos that didn't change keep the **same object reference**. When an action changes nothing (unknown type, unknown id, empty add, nothing to clear), return the **same** \`state\` object.

\`\`\`js
const s0 = { todos: [], nextId: 1 };
const s1 = todoReducer(s0, { type: "add", text: "  Ship it " });
// { todos: [{ id: 1, text: "Ship it", done: false }], nextId: 2 }
todoReducer(s1, { type: "toggle", id: 42 }) === s1; // true
\`\`\``,
    starter: `function todoReducer(state, action) {\n  // your code here\n}`,
    tests: `function deepFreeze(o) {
  Object.freeze(o);
  for (const v of Object.values(o)) if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  return o;
}
function sample() {
  return deepFreeze({ todos: [{ id: 1, text: "a", done: false }, { id: 2, text: "b", done: true }, { id: 3, text: "c", done: false }], nextId: 4 });
}
test("adds a trimmed todo and increments nextId", () => {
  const s0 = deepFreeze({ todos: [], nextId: 1 });
  const s1 = todoReducer(s0, { type: "add", text: "  Ship it " });
  expect(s1).toEqual({ todos: [{ id: 1, text: "Ship it", done: false }], nextId: 2 });
  expect(s0.todos).toHaveLength(0);
});
test("ignores empty adds and returns the same state", () => {
  const s = sample();
  expect(todoReducer(s, { type: "add", text: "   " })).toBe(s);
});
test("toggles without mutating and keeps other todos by reference", () => {
  const s = sample();
  const next = todoReducer(s, { type: "toggle", id: 1 });
  expect(next).not.toBe(s);
  expect(next.todos).not.toBe(s.todos);
  expect(next.todos[0]).toEqual({ id: 1, text: "a", done: true });
  expect(s.todos[0].done).toBe(false);
  expect(next.todos[1]).toBe(s.todos[1]);
  expect(next.todos[2]).toBe(s.todos[2]);
  expect(next.nextId).toBe(4);
});
test("edits text, trimming it", () => {
  const s = sample();
  const next = todoReducer(s, { type: "edit", id: 2, text: " B! " });
  expect(next.todos.map((t) => t.text)).toEqual(["a", "B!", "c"]);
  expect(next.todos[1].done).toBe(true);
  expect(s.todos[1].text).toBe("b");
});
test("editing to empty text removes the todo", () => {
  const next = todoReducer(sample(), { type: "edit", id: 3, text: "  " });
  expect(next.todos.map((t) => t.id)).toEqual([1, 2]);
});
test("removes by id", () => {
  const s = sample();
  const next = todoReducer(s, { type: "remove", id: 2 });
  expect(next.todos.map((t) => t.id)).toEqual([1, 3]);
  expect(next.todos[0]).toBe(s.todos[0]);
  expect(s.todos).toHaveLength(3);
});
test("clears completed todos", () => {
  const s = sample();
  const next = todoReducer(s, { type: "clearCompleted" });
  expect(next.todos.map((t) => t.id)).toEqual([1, 3]);
  expect(todoReducer(next, { type: "clearCompleted" })).toBe(next);
});
test("returns the same state when nothing changes", () => {
  const s = sample();
  expect(todoReducer(s, { type: "toggle", id: 99 })).toBe(s);
  expect(todoReducer(s, { type: "remove", id: 99 })).toBe(s);
  expect(todoReducer(s, { type: "edit", id: 1, text: "a" })).toBe(s);
  expect(todoReducer(s, { type: "unknown" })).toBe(s);
});
test("new ids keep increasing after removals", () => {
  let s = deepFreeze({ todos: [], nextId: 1 });
  s = todoReducer(s, { type: "add", text: "x" });
  s = todoReducer(s, { type: "remove", id: 1 });
  s = todoReducer(s, { type: "add", text: "y" });
  expect(s.todos).toEqual([{ id: 2, text: "y", done: false }]);
});`,
    hints: [
      "Immutable updates mean copying only the path you change: a new state object, a new todos array, and a new object for the one todo that changed. Everything else is reused.",
      "Use spread and the non-mutating array methods: [...todos, newTodo] to add, todos.map(t => t.id === id ? { ...t, done: !t.done } : t) to update, and todos.filter(...) to remove.",
      "To return the same reference on a no-op, check whether anything changed: for filter, compare lengths. For map, track a changed flag, or skip creating a new todo when the text is identical. Then return changed ? { ...state, todos } : state.",
    ],
    solution: `function updateTodo(state, id, fn) {
  let changed = false;
  const todos = state.todos.map((todo) => {
    if (todo.id !== id) return todo;
    const next = fn(todo);
    if (next !== todo) changed = true;
    return next;
  });
  return changed ? { ...state, todos } : state;
}

function withTodos(state, todos) {
  return todos.length === state.todos.length ? state : { ...state, todos };
}

function todoReducer(state, action) {
  switch (action.type) {
    case "add": {
      const text = action.text.trim();
      if (!text) return state;
      return {
        ...state,
        todos: [...state.todos, { id: state.nextId, text, done: false }],
        nextId: state.nextId + 1,
      };
    }
    case "toggle":
      return updateTodo(state, action.id, (t) => ({ ...t, done: !t.done }));
    case "edit": {
      const text = action.text.trim();
      if (!text) return todoReducer(state, { type: "remove", id: action.id });
      return updateTodo(state, action.id, (t) => (t.text === text ? t : { ...t, text }));
    }
    case "remove":
      return withTodos(state, state.todos.filter((t) => t.id !== action.id));
    case "clearCompleted":
      return withTodos(state, state.todos.filter((t) => !t.done));
    default:
      return state;
  }
}`,
    explanation: `Structural sharing is the core idea. You copy the objects along the path to the change (state → todos array → that todo) and reuse everything else by reference. The update is O(n) for the array copy, and \`React.memo\` rows for unchanged todos skip re-rendering because their props are still \`===\`.

Returning the identical \`state\` for no-ops matters just as much. \`useReducer\` and Redux \`connect\` skip work when the reference doesn't change, so a reducer that always returns a fresh object causes needless re-renders.

Common mistakes: \`state.todos.push(...)\` or \`todo.done = !todo.done\` (mutation, so memoized components never update), deriving the new id from \`todos.length + 1\` (it collides after a removal), and \`{ ...state }\` without also copying the array you change.

Follow-up: "This reducer is getting long. How would you simplify it?" Immer's \`produce\` lets you write mutating code against a draft and produces the same structurally shared result. Or normalize the state into \`{ ids: [], byId: {} }\` so updates are O(1).`,
  },
  {
    id: "fe-memo-selector",
    title: "Memoized selectors",
    track: "Frontend",
    level: "Medium",
    minutes: 25,
    tags: ["memoization", "state", "performance"],
    prompt: `Your component calls \`getVisibleTodos(state)\` on every render, and it filters and sorts 10,000 items each time. Build a \`createSelector\` like Reselect's.

\`createSelector(...inputSelectors, resultFn)\`, or \`createSelector([...inputSelectors], resultFn)\`, returns a \`selector(...args)\` that:

1. Calls every input selector with all the arguments (\`state\`, plus any extra props).
2. If every input result is identical (\`Object.is\`) to the previous call's, returns the cached result **without** calling \`resultFn\`.
3. Otherwise calls \`resultFn(...inputResults)\`, caches the result and returns it.

The cache holds only the most recent call. The selector also has \`selector.recomputations()\` (how many times \`resultFn\` has run) and \`selector.resetRecomputations()\`.

\`\`\`js
const selectTodos = (s) => s.todos;
const selectFilter = (s) => s.filter;
const selectVisible = createSelector(selectTodos, selectFilter, (todos, filter) =>
  todos.filter((t) => filter === "all" || (filter === "done") === t.done)
);
selectVisible(state) === selectVisible(state); // true, computed once
selectVisible({ ...state, unrelated: 1 });      // still cached: inputs are the same references
\`\`\``,
    starter: `function createSelector(...args) {\n  // your code here\n}`,
    tests: `const selTodos = (s) => s.todos;
const selFilter = (s) => s.filter;
function visible(todos, filter) {
  return todos.filter((t) => filter === "all" || (filter === "done") === t.done);
}
function baseState() {
  return { todos: [{ id: 1, done: true }, { id: 2, done: false }], filter: "done", other: 0 };
}
test("computes the result from the input selectors", () => {
  const sel = createSelector(selTodos, selFilter, visible);
  expect(sel(baseState())).toEqual([{ id: 1, done: true }]);
});
test("returns the cached result for the same state", () => {
  const sel = createSelector(selTodos, selFilter, visible);
  const s = baseState();
  const a = sel(s);
  const b = sel(s);
  expect(a).toBe(b);
  expect(sel.recomputations()).toBe(1);
});
test("stays cached when unrelated parts of state change", () => {
  const sel = createSelector(selTodos, selFilter, visible);
  const s = baseState();
  const a = sel(s);
  const b = sel({ ...s, other: 1 });
  expect(b).toBe(a);
  expect(sel.recomputations()).toBe(1);
});
test("recomputes when an input changes", () => {
  const sel = createSelector(selTodos, selFilter, visible);
  const s = baseState();
  sel(s);
  const next = sel({ ...s, filter: "all" });
  expect(next).toHaveLength(2);
  expect(sel.recomputations()).toBe(2);
});
test("caches only the last call", () => {
  const sel = createSelector(selFilter, (f) => f.toUpperCase());
  const a = { filter: "a" }, b = { filter: "b" };
  sel(a); sel(b); sel(a);
  expect(sel.recomputations()).toBe(3);
});
test("passes extra arguments to input selectors", () => {
  const byId = createSelector(selTodos, (s, id) => id, (todos, id) => todos.find((t) => t.id === id));
  const s = baseState();
  expect(byId(s, 2)).toEqual({ id: 2, done: false });
  expect(byId(s, 2)).toBe(byId(s, 2));
  expect(byId.recomputations()).toBe(1);
  expect(byId(s, 1).id).toBe(1);
});
test("accepts input selectors as an array", () => {
  const sel = createSelector([selTodos, selFilter], (todos, filter) => todos.length + ":" + filter);
  expect(sel(baseState())).toBe("2:done");
});
test("composes with other selectors", () => {
  const selVisible = createSelector(selTodos, selFilter, visible);
  const selCount = createSelector(selVisible, (list) => list.length);
  const s = baseState();
  expect(selCount(s)).toBe(1);
  selCount({ ...s, other: 5 });
  expect(selCount.recomputations()).toBe(1);
  expect(selVisible.recomputations()).toBe(1);
});
test("resetRecomputations sets the counter back to zero", () => {
  const sel = createSelector(selFilter, (f) => f);
  sel({ filter: "x" });
  sel.resetRecomputations();
  expect(sel.recomputations()).toBe(0);
  sel({ filter: "y" });
  expect(sel.recomputations()).toBe(1);
});
test("treats NaN inputs as unchanged", () => {
  const sel = createSelector((s) => s.n, (n) => ({ n }));
  const a = sel({ n: NaN });
  expect(sel({ n: NaN })).toBe(a);
});`,
    hints: [
      "Memoize on the input selectors' results, not on the state object. State is a new object on every change, but untouched slices keep their references.",
      "Pop resultFn off the end of the arguments. If args[0] is an array, use it as the input selectors. Keep lastInputs and lastResult in a closure.",
      "In the selector: const values = inputs.map(fn => fn(...params)); if (lastInputs && values.every((v, i) => Object.is(v, lastInputs[i]))) return lastResult; otherwise store values, count++, compute and store lastResult.",
    ],
    solution: `function createSelector(...args) {
  const resultFn = args.pop();
  const inputs = Array.isArray(args[0]) ? args[0] : args;
  let lastInputs = null;
  let lastResult;
  let count = 0;

  function selector(...params) {
    const values = inputs.map((input) => input(...params));
    if (lastInputs && values.every((v, i) => Object.is(v, lastInputs[i]))) {
      return lastResult;
    }
    lastInputs = values;
    count++;
    lastResult = resultFn(...values);
    return lastResult;
  }

  selector.recomputations = () => count;
  selector.resetRecomputations = () => {
    count = 0;
  };
  return selector;
}`,
    explanation: `Immutable state is what makes this cheap. A slice that didn't change keeps its reference, so comparing the inputs takes O(number of inputs) reference checks instead of a deep compare of the data. Only when an input really changed do you pay for \`resultFn\`.

The cached result is also returned **by reference**. That is often more valuable than the CPU saved: a component receiving \`selectVisible(state)\` as a prop sees the same array and can skip re-rendering. Without memoization, \`.filter()\` returns a new array every time and breaks \`React.memo\`.

Common mistakes: memoizing on the \`state\` argument itself (it changes on every action, so the cache always misses), deep-comparing inputs (slow, and it defeats the purpose), and sharing one selector instance across list items with different props. With a cache size of 1 they keep evicting each other.

Follow-up: "Each row calls \`selectTodoById(state, id)\` with a different id. How do you avoid thrashing?" Create one selector per component instance (a factory used inside \`useMemo\`), or use a cache keyed by the arguments, such as a \`WeakMap\` or an LRU.`,
  },
  {
    id: "fe-query-string",
    title: "Parse and stringify query strings",
    track: "Frontend",
    level: "Medium",
    minutes: 25,
    tags: ["urls", "parsing", "encoding"],
    prompt: `Your search page keeps its filters in the URL (\`?q=red+shoes&size=9&size=10\`) so links are shareable. Write both directions.

**\`parseQuery(str)\`** returns an object:

- An optional leading \`?\` is ignored. Pairs are separated by \`&\`. Empty pairs (\`a=1&&b=2\`) are skipped.
- Split each pair on the **first** \`=\`. A key with no \`=\` gets the value \`""\`.
- Decode keys and values: \`+\` means a space, then percent-decode. If a value is malformed (for example \`%E0%A4%A\`), keep it as it is instead of throwing.
- A repeated key becomes an array in order. A key ending in \`[]\` is always an array (\`tag[]=a\` gives \`{ tag: ["a"] }\`).

**\`stringifyQuery(obj)\`** returns a string with no leading \`?\`:

- Keys in insertion order. Encode keys and values with \`encodeURIComponent\`.
- An array becomes a repeated key (\`size=9&size=10\`). An empty array produces nothing.
- \`null\` and \`undefined\` values (and array items) are skipped. Other values are converted with \`String\`.

\`\`\`js
parseQuery("?q=red+shoes&size=9&size=10&sale"); // { q: "red shoes", size: ["9", "10"], sale: "" }
stringifyQuery({ q: "a&b c", page: 2, tag: ["x", "y"], empty: null });
// "q=a%26b%20c&page=2&tag=x&tag=y"
\`\`\``,
    starter: `function parseQuery(str) {\n  // your code here\n}\n\nfunction stringifyQuery(obj) {\n  // your code here\n}`,
    tests: `test("parses simple pairs and ignores a leading ?", () => {
  expect(parseQuery("?a=1&b=two")).toEqual({ a: "1", b: "two" });
  expect(parseQuery("a=1&b=two")).toEqual({ a: "1", b: "two" });
});
test("returns {} for empty input", () => {
  expect(parseQuery("")).toEqual({});
  expect(parseQuery("?")).toEqual({});
});
test("decodes plus signs and percent escapes", () => {
  expect(parseQuery("q=red+shoes&name=Jos%C3%A9&eq=a%3Db&plus=1%2B1")).toEqual({ q: "red shoes", name: "José", eq: "a=b", plus: "1+1" });
});
test("splits only on the first =", () => {
  expect(parseQuery("token=abc==&expr=x=y")).toEqual({ token: "abc==", expr: "x=y" });
});
test("turns repeated keys into arrays", () => {
  expect(parseQuery("size=9&color=red&size=10&size=11")).toEqual({ size: ["9", "10", "11"], color: "red" });
});
test("keys ending in [] are always arrays", () => {
  expect(parseQuery("tag[]=a&one[]=x&tag[]=b")).toEqual({ tag: ["a", "b"], one: ["x"] });
});
test("handles flags without = and skips empty pairs", () => {
  expect(parseQuery("sale&&a=&b=1&")).toEqual({ sale: "", a: "", b: "1" });
});
test("keeps malformed escapes instead of throwing", () => {
  expect(parseQuery("bad=%E0%A4%A&ok=1")).toEqual({ bad: "%E0%A4%A", ok: "1" });
  expect(parseQuery("pct=100%")).toEqual({ pct: "100%" });
});
test("stringifies with encoding, repeated keys and skipped nulls", () => {
  expect(stringifyQuery({ q: "a&b c", page: 2, tag: ["x", "y"], empty: null, nope: undefined, list: [], flag: true })).toBe("q=a%26b%20c&page=2&tag=x&tag=y&flag=true");
  expect(stringifyQuery({})).toBe("");
});
test("round-trips through stringify and parse", () => {
  const obj = { q: "naïve café = 100% & more", tags: ["a b", "c+d"], n: "0" };
  expect(parseQuery(stringifyQuery(obj))).toEqual(obj);
});`,
    hints: [
      "Decoding order matters: replace '+' with a space before percent-decoding, otherwise a real plus sign written as %2B would turn into a space.",
      "Write a safe decode(s) that does s.replaceAll('+', ' ') and then tries decodeURIComponent, catching errors. Loop over str.split('&'), use indexOf('=') to split on the first one, strip a trailing [] from the key, then assign or append.",
      "To append: if the key already exists, out[key] = [].concat(out[key], value), which handles both 'already an array' and 'was a string'. For stringify, normalize each value to an array with Array.isArray(v) ? v : [v], skip null items, and push encodeURIComponent(key) + '=' + encodeURIComponent(String(item)).",
    ],
    solution: `function decodePart(s) {
  const spaced = s.replaceAll("+", " ");
  try {
    return decodeURIComponent(spaced);
  } catch {
    return spaced; // malformed escape: keep what we have
  }
}

function parseQuery(str) {
  const out = {};
  const query = str.startsWith("?") ? str.slice(1) : str;
  if (!query) return out;

  for (const part of query.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    let key = decodePart(eq === -1 ? part : part.slice(0, eq));
    const value = eq === -1 ? "" : decodePart(part.slice(eq + 1));
    const forceArray = key.endsWith("[]");
    if (forceArray) key = key.slice(0, -2);

    if (Object.prototype.hasOwnProperty.call(out, key)) out[key] = [].concat(out[key], value);
    else out[key] = forceArray ? [value] : value;
  }
  return out;
}

function stringifyQuery(obj) {
  const parts = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item == null) continue;
      parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(String(item)));
    }
  }
  return parts.join("&");
}`,
    explanation: `Both directions are a single linear pass. Splitting on the **first** \`=\` matters because base64 tokens and expressions often contain \`=\`. The plus-sign rule comes from HTML form encoding, where a space is sent as \`+\`, so it has to be converted before percent-decoding. Otherwise a real plus, sent as \`%2B\`, would be decoded and then wrongly turned into a space.

\`decodeURIComponent\` throws a \`URIError\` on malformed input, and URLs are user-controlled. Without the \`try\`, one bad link crashes the page. On output, \`encodeURIComponent\` escapes \`&\`, \`=\`, \`+\` and spaces (as \`%20\`), which is why values containing those survive a round trip.

Common mistakes: using \`split("=")\` and dropping everything after the second \`=\`, encoding with \`encodeURI\` (which leaves \`&\` and \`=\` alone), and the \`hasOwnProperty\` check written as \`out[key]\`, which misfires on keys like \`constructor\`. For untrusted keys such as \`__proto__\`, a \`Map\` or \`Object.create(null)\` is the safer container.

Follow-up: "Why not just use \`URLSearchParams\`?" In production you should. It handles all of this, but it returns only strings and leaves you to group repeated keys with \`getAll\`. Knowing the rules underneath helps when you are debugging double-encoding bugs.`,
  },
  {
    id: "fe-virtual-range",
    title: "Virtualized list range",
    track: "Frontend",
    level: "Medium",
    minutes: 30,
    tags: ["performance", "virtualization", "binary-search"],
    prompt: `A log viewer with 100,000 rows freezes the tab. Virtualization renders only the rows in view. Write the math that decides which ones.

\`getVisibleRange({ scrollTop, viewportHeight, itemHeight, itemCount, overscan = 0 })\` returns \`{ start, end, offsetTop, totalHeight }\`:

- \`itemHeight\` is either a number (fixed rows) or a function \`(index) => height\` (variable rows).
- \`start\` is the index of the first row that is at least partly visible. \`end\` is **exclusive**: one past the last row that is at least partly visible. A row touching the viewport edge exactly is not visible.
- Then widen the range by \`overscan\` rows on each side, clamped to \`[0, itemCount]\`.
- \`offsetTop\` is the pixel top of row \`start\` (where to position the rendered block). \`totalHeight\` is the height of all rows (for the scroll spacer).
- Clamp \`scrollTop\` into \`[0, max(0, totalHeight - viewportHeight)]\` first. Overscroll bounce can report negative or too-large values.
- With \`itemCount\` of 0, return all zeros.

\`\`\`js
getVisibleRange({ scrollTop: 100, viewportHeight: 300, itemHeight: 50, itemCount: 1000 });
// rows 2..7 are visible: { start: 2, end: 8, offsetTop: 100, totalHeight: 50000 }
getVisibleRange({ scrollTop: 110, viewportHeight: 300, itemHeight: 50, itemCount: 1000, overscan: 2 });
// visible 2..8 → { start: 0, end: 11, offsetTop: 0, totalHeight: 50000 }
\`\`\`

For variable heights, aim for better than a linear scan from the top on each call (prefix sums plus binary search).`,
    starter: `function getVisibleRange(options) {\n  // your code here\n}`,
    tests: `test("finds the rows in view at the top of the list", () => {
  expect(getVisibleRange({ scrollTop: 0, viewportHeight: 300, itemHeight: 50, itemCount: 1000 })).toEqual({ start: 0, end: 6, offsetTop: 0, totalHeight: 50000 });
});
test("treats rows on the exact edge as not visible", () => {
  expect(getVisibleRange({ scrollTop: 100, viewportHeight: 300, itemHeight: 50, itemCount: 1000 })).toEqual({ start: 2, end: 8, offsetTop: 100, totalHeight: 50000 });
});
test("includes partially visible rows", () => {
  expect(getVisibleRange({ scrollTop: 110, viewportHeight: 300, itemHeight: 50, itemCount: 1000 })).toEqual({ start: 2, end: 9, offsetTop: 100, totalHeight: 50000 });
});
test("adds overscan on both sides, clamped to the list", () => {
  expect(getVisibleRange({ scrollTop: 110, viewportHeight: 300, itemHeight: 50, itemCount: 1000, overscan: 2 })).toEqual({ start: 0, end: 11, offsetTop: 0, totalHeight: 50000 });
  expect(getVisibleRange({ scrollTop: 1000, viewportHeight: 300, itemHeight: 50, itemCount: 1000, overscan: 3 })).toEqual({ start: 17, end: 29, offsetTop: 850, totalHeight: 50000 });
});
test("clamps overscroll past the end and above the top", () => {
  expect(getVisibleRange({ scrollTop: 5000, viewportHeight: 200, itemHeight: 20, itemCount: 100 })).toEqual({ start: 90, end: 100, offsetTop: 1800, totalHeight: 2000 });
  expect(getVisibleRange({ scrollTop: -40, viewportHeight: 200, itemHeight: 20, itemCount: 100, overscan: 1 })).toEqual({ start: 0, end: 11, offsetTop: 0, totalHeight: 2000 });
});
test("handles content shorter than the viewport", () => {
  expect(getVisibleRange({ scrollTop: 30, viewportHeight: 500, itemHeight: 40, itemCount: 3, overscan: 5 })).toEqual({ start: 0, end: 3, offsetTop: 0, totalHeight: 120 });
});
test("returns zeros for an empty list", () => {
  expect(getVisibleRange({ scrollTop: 0, viewportHeight: 300, itemHeight: 50, itemCount: 0, overscan: 3 })).toEqual({ start: 0, end: 0, offsetTop: 0, totalHeight: 0 });
});
test("supports variable row heights", () => {
  // heights: 10, 20, 30, 40, ... (index + 1) * 10
  const itemHeight = (i) => (i + 1) * 10;
  // tops: 0, 10, 30, 60, 100, 150, 210, 280, 360, 450, 550 ... total for 20 rows = 2100
  expect(getVisibleRange({ scrollTop: 35, viewportHeight: 100, itemHeight, itemCount: 20 })).toEqual({ start: 2, end: 5, offsetTop: 30, totalHeight: 2100 });
  expect(getVisibleRange({ scrollTop: 100, viewportHeight: 110, itemHeight, itemCount: 20, overscan: 1 })).toEqual({ start: 3, end: 7, offsetTop: 60, totalHeight: 2100 });
});
test("is fast for large variable-height lists", () => {
  const itemHeight = (i) => 20 + (i % 5) * 4;
  const t0 = performance.now();
  const r = getVisibleRange({ scrollTop: 1000000, viewportHeight: 800, itemHeight, itemCount: 200000, overscan: 5 });
  expect(performance.now() - t0).toBeLessThan(500);
  expect(r.end - r.start).toBeLessThan(60);
  expect(r.offsetTop).toBeLessThanOrEqual(1000000);
});`,
    hints: [
      "Think in pixel offsets. Each row has a top. The first visible row is the last one whose top is at or above scrollTop. The end is the first row whose top is at or below the viewport's bottom edge (scrollTop + viewportHeight).",
      "Build a prefix-sum array tops of length itemCount + 1, where tops[i + 1] = tops[i] + height(i). Its last entry is totalHeight. Because tops is sorted, binary search finds both boundaries in O(log n).",
      "first = (first index with tops[i] > top) - 1, capped at itemCount - 1. end = first index with tops[i] >= bottom, capped at itemCount. Then start = max(0, first - overscan), end = min(itemCount, end + overscan), offsetTop = tops[start].",
    ],
    solution: `// First index i where pred(arr[i]) is true, for a predicate that flips once from false to true.
function firstWhere(arr, pred) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (pred(arr[mid])) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

function getVisibleRange({ scrollTop, viewportHeight, itemHeight, itemCount, overscan = 0 }) {
  if (itemCount === 0) return { start: 0, end: 0, offsetTop: 0, totalHeight: 0 };
  const heightOf = typeof itemHeight === "function" ? itemHeight : () => itemHeight;

  // tops[i] = pixel top of row i; tops[itemCount] = total height
  const tops = new Array(itemCount + 1);
  tops[0] = 0;
  for (let i = 0; i < itemCount; i++) tops[i + 1] = tops[i] + heightOf(i);
  const totalHeight = tops[itemCount];

  const top = Math.min(Math.max(0, scrollTop), Math.max(0, totalHeight - viewportHeight));
  const bottom = top + viewportHeight;

  const first = Math.min(firstWhere(tops, (t) => t > top) - 1, itemCount - 1);
  const last = Math.min(firstWhere(tops, (t) => t >= bottom), itemCount);

  const start = Math.max(0, first - overscan);
  const end = Math.min(itemCount, last + overscan);
  return { start, end, offsetTop: tops[start], totalHeight };
}`,
    explanation: `Virtualization keeps the DOM size proportional to the viewport, not the data. The scroll container gets a spacer of \`totalHeight\` so the scrollbar looks right, and only rows \`start..end\` are rendered, positioned at \`offsetTop\`. With fixed heights the range is two divisions. Prefix sums generalize that to variable heights, and because they are sorted, both edges come from a binary search in O(log n).

Building the prefix array is O(n). A real implementation caches it and updates it only when heights change, as measured heights arrive from a \`ResizeObserver\`. Overscan renders a few extra rows on each side so fast scrolling doesn't flash blank space before the next frame paints.

Common mistakes: off-by-one at exact boundaries (\`ceil\` vs \`floor\`, inclusive vs exclusive \`end\`), forgetting to clamp overscroll (iOS rubber-banding gives negative \`scrollTop\`), and positioning each row absolutely by \`index * height\` while also translating the block, which counts the offset twice.

Follow-up: "Row heights aren't known until they render." Start with an estimate, measure rows once they mount, update the prefix sums, and correct \`scrollTop\` by the height difference above the viewport so the content doesn't jump.`,
  },
  {
    id: "fe-move-item",
    title: "Reorder for drag and drop",
    track: "Frontend",
    level: "Easy",
    minutes: 15,
    tags: ["arrays", "immutability", "drag-and-drop"],
    prompt: `Your kanban board's drag-and-drop library reports \`{ fromIndex, toIndex }\` when a card is dropped. Write the immutable state updates.

\`moveItem(list, fromIndex, toIndex)\` returns a **new** array with the item at \`fromIndex\` moved so that it ends up **at** \`toIndex\` in the result.

- \`toIndex\` is clamped to \`[0, list.length - 1]\`.
- If \`fromIndex\` is out of range, or the clamped \`toIndex\` equals \`fromIndex\`, return the **original** array (same reference) so React can skip the update.
- Never mutate \`list\`.

\`moveBetween(source, target, fromIndex, toIndex)\` moves an item from one column to another and returns \`{ source, target }\` as new arrays. \`toIndex\` is clamped to \`[0, target.length]\`. If \`fromIndex\` is out of range, return the original arrays.

\`\`\`js
moveItem(["a", "b", "c", "d"], 0, 2); // ["b", "c", "a", "d"]
moveItem(["a", "b", "c", "d"], 3, 0); // ["d", "a", "b", "c"]
moveBetween(["a", "b"], ["x"], 1, 0); // { source: ["a"], target: ["b", "x"] }
\`\`\``,
    starter: `function moveItem(list, fromIndex, toIndex) {\n  // your code here\n}\n\nfunction moveBetween(source, target, fromIndex, toIndex) {\n  // your code here\n}`,
    tests: `test("moves an item forward so it lands at toIndex", () => {
  expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  expect(moveItem(["a", "b", "c", "d"], 1, 3)).toEqual(["a", "c", "d", "b"]);
});
test("moves an item backward", () => {
  expect(moveItem(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
  expect(moveItem(["a", "b", "c", "d"], 2, 1)).toEqual(["a", "c", "b", "d"]);
});
test("does not mutate the input", () => {
  const list = Object.freeze(["a", "b", "c"]);
  const out = moveItem(list, 0, 2);
  expect(list).toEqual(["a", "b", "c"]);
  expect(out).not.toBe(list);
});
test("returns the same array when nothing moves", () => {
  const list = ["a", "b", "c"];
  expect(moveItem(list, 1, 1)).toBe(list);
  expect(moveItem(list, 5, 0)).toBe(list);
  expect(moveItem(list, -1, 0)).toBe(list);
});
test("clamps toIndex into range", () => {
  expect(moveItem(["a", "b", "c"], 0, 99)).toEqual(["b", "c", "a"]);
  expect(moveItem(["a", "b", "c"], 2, -5)).toEqual(["c", "a", "b"]);
  const list = ["a", "b", "c"];
  expect(moveItem(list, 2, 10)).toBe(list);
});
test("keeps item identity", () => {
  const card = { id: 1 };
  const out = moveItem([card, { id: 2 }], 0, 1);
  expect(out[1]).toBe(card);
});
test("moves between lists", () => {
  expect(moveBetween(["a", "b"], ["x"], 1, 0)).toEqual({ source: ["a"], target: ["b", "x"] });
  expect(moveBetween(["a", "b", "c"], ["x", "y"], 0, 1)).toEqual({ source: ["b", "c"], target: ["x", "a", "y"] });
});
test("moveBetween clamps toIndex and can append or insert into an empty list", () => {
  expect(moveBetween(["a"], ["x", "y"], 0, 99)).toEqual({ source: [], target: ["x", "y", "a"] });
  expect(moveBetween(["a", "b"], [], 0, -3)).toEqual({ source: ["b"], target: ["a"] });
});
test("moveBetween leaves inputs alone and handles a bad fromIndex", () => {
  const source = Object.freeze(["a", "b"]);
  const target = Object.freeze(["x"]);
  const out = moveBetween(source, target, 0, 0);
  expect(source).toEqual(["a", "b"]);
  expect(target).toEqual(["x"]);
  const same = moveBetween(source, target, 7, 0);
  expect(same.source).toBe(source);
  expect(same.target).toBe(target);
});`,
    hints: [
      "toIndex is the item's final position. Removing the item first shifts every later index down by one, which is exactly what makes a remove-then-insert give the right answer.",
      "Copy the list with slice(), splice the item out at fromIndex, then splice it back in at the clamped toIndex. Do the guard checks (out-of-range from, same index) before copying.",
      "const next = list.slice(); const [item] = next.splice(from, 1); next.splice(to, 0, item); return next. For moveBetween, build the new arrays with slice and spread: [...target.slice(0, i), item, ...target.slice(i)].",
    ],
    solution: `const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);

function moveItem(list, fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= list.length) return list;
  const to = clamp(toIndex, 0, list.length - 1);
  if (to === fromIndex) return list;
  const next = list.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(to, 0, item);
  return next;
}

function moveBetween(source, target, fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= source.length) return { source, target };
  const item = source[fromIndex];
  const to = clamp(toIndex, 0, target.length);
  return {
    source: [...source.slice(0, fromIndex), ...source.slice(fromIndex + 1)],
    target: [...target.slice(0, to), item, ...target.slice(to)],
  };
}`,
    explanation: `Copy-then-splice keeps the update immutable while reusing the familiar mutating API on a private copy. The subtle part is the index arithmetic when moving forward. If you insert first and then delete, the deletion index shifts. Removing first, then inserting at \`toIndex\` in the shorter array, lands the item exactly at \`toIndex\` in the result. It is O(n) time and space.

Returning the original reference for no-ops is a small performance contract. A drop onto the same slot shouldn't cause a re-render or an API call that saves an "unchanged" order.

Common mistakes: \`list.splice(...)\` on the original (it mutates props or state), adjusting \`toIndex - 1\` by hand when moving forward (correct for some drag libraries' "insert before" semantics, wrong for "final index"), and forgetting to clamp drops past the end of a column.

Follow-up: "How do you persist the order without rewriting every row's position in the database?" Use fractional indexing: give the moved item a rank between its new neighbors' ranks (for example a lexicographic string key), so one row changes per move.`,
  },
  {
    id: "fe-contrast-ratio",
    title: "WCAG contrast checker",
    track: "Frontend",
    level: "Easy",
    minutes: 20,
    tags: ["accessibility", "color", "math"],
    prompt: `Your design system's color picker should warn when text fails WCAG contrast. Implement the WCAG 2 formula.

**\`contrastRatio(colorA, colorB)\`** takes two hex colors (\`#rgb\` or \`#rrggbb\`, the \`#\` is optional, any case) and returns the contrast ratio as an unrounded number from 1 to 21. The order of the arguments doesn't matter.

1. For each channel, \`c = value / 255\`, then linearize: \`c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4\`.
2. Relative luminance \`L = 0.2126 * R + 0.7152 * G + 0.0722 * B\`.
3. Ratio \`= (L1 + 0.05) / (L2 + 0.05)\`, where \`L1\` is the **lighter** color's luminance.

**\`checkContrast(fg, bg, { size = "normal" } = {})\`** returns \`{ ratio, AA, AAA }\`. \`ratio\` is rounded to 2 decimal places for display. The thresholds are 4.5 (AA) and 7 (AAA) for normal text, and 3 (AA) and 4.5 (AAA) for \`size: "large"\`. Compare against the **unrounded** ratio.

An invalid color throws an \`Error\`.

\`\`\`js
contrastRatio("#000", "#fff");        // 21
checkContrast("#767676", "#ffffff");  // { ratio: 4.54, AA: true, AAA: false }
checkContrast("#777", "#fff", { size: "large" }); // { ratio: 4.48, AA: true, AAA: false }
\`\`\``,
    starter: `function contrastRatio(colorA, colorB) {\n  // your code here\n}\n\nfunction checkContrast(fg, bg, options) {\n  // your code here\n}`,
    tests: `test("black on white is 21:1 and identical colors are 1:1", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 6);
  expect(contrastRatio("#3a7", "#3a7")).toBeCloseTo(1, 6);
});
test("argument order does not matter", () => {
  expect(contrastRatio("#ffffff", "#767676")).toBeCloseTo(contrastRatio("#767676", "#ffffff"), 10);
});
test("matches known reference values", () => {
  expect(contrastRatio("#767676", "#fff")).toBeCloseTo(4.54, 2);
  expect(contrastRatio("#777777", "#fff")).toBeCloseTo(4.48, 2);
  expect(contrastRatio("#0066cc", "#ffffff")).toBeCloseTo(5.57, 2);
});
test("accepts shorthand, missing # and any case", () => {
  expect(contrastRatio("FFF", "#000")).toBeCloseTo(21, 6);
  expect(contrastRatio("#AbC", "#aabbcc")).toBeCloseTo(1, 6);
});
test("grades normal text against 4.5 and 7", () => {
  expect(checkContrast("#767676", "#ffffff")).toEqual({ ratio: 4.54, AA: true, AAA: false });
  expect(checkContrast("#595959", "#ffffff")).toEqual({ ratio: 7, AA: true, AAA: true });
  expect(checkContrast("#777", "#fff")).toEqual({ ratio: 4.48, AA: false, AAA: false });
});
test("grades large text against 3 and 4.5", () => {
  expect(checkContrast("#777", "#fff", { size: "large" })).toEqual({ ratio: 4.48, AA: true, AAA: false });
  expect(checkContrast("#ff0000", "#ffffff", { size: "large" })).toEqual({ ratio: 4, AA: true, AAA: false });
  expect(checkContrast("#949494", "#fff", { size: "large" }).AA).toBe(true);
});
test("compares the unrounded ratio against thresholds", () => {
  // 4.4987... displays as 4.5 but does not pass AA
  expect(checkContrast("#018580", "#ffffff")).toEqual({ ratio: 4.5, AA: false, AAA: false });
});
test("throws on invalid colors", () => {
  expect(() => contrastRatio("#12345", "#fff")).toThrow();
  expect(() => contrastRatio("red", "#fff")).toThrow();
  expect(() => checkContrast("#ggg", "#fff")).toThrow();
});`,
    hints: [
      "Break it into three pure helpers: parse hex into [r, g, b], compute relative luminance, and combine two luminances into a ratio.",
      "Validate with a regex like /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i. Expand shorthand by doubling each character. Linearize each channel with the formula from the prompt before weighting, because the weights apply to linear light, not to the gamma-encoded value.",
      "Sort the two luminances descending so the lighter one goes on top: (hi + 0.05) / (lo + 0.05). In checkContrast, pick the thresholds by size, compare the raw ratio, and only round with Math.round(ratio * 100) / 100 for the returned value.",
    ],
    solution: `function parseHex(input) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(input).trim());
  if (!m) throw new Error("Invalid color: " + input);
  let hex = m[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(colorA, colorB) {
  const [hi, lo] = [luminance(colorA), luminance(colorB)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function checkContrast(fg, bg, { size = "normal" } = {}) {
  const ratio = contrastRatio(fg, bg);
  const [aa, aaa] = size === "large" ? [3, 4.5] : [4.5, 7];
  return { ratio: Math.round(ratio * 100) / 100, AA: ratio >= aa, AAA: ratio >= aaa };
}`,
    explanation: `sRGB values are gamma-encoded, so \`#808080\` is not half as bright as white in physical light. Linearizing first and then weighting the channels (green dominates human brightness perception) gives relative luminance. The \`+ 0.05\` models ambient flare and keeps the ratio finite for pure black, which is why the maximum is 21:1.

Rounding is for display only. \`#018580\` on white is 4.4987:1. It shows as "4.5" but fails AA, because WCAG thresholds have no rounding. A checker that rounds first will approve colors that real audit tools reject.

Common mistakes: forgetting to linearize (the numbers come out close but wrong in the mid-tones), putting the darker color on top (giving ratios below 1), and testing one color against the threshold instead of the pair. Large text means at least 24px, or 18.66px bold.

Follow-up: "Given a background, find the closest color to the brand blue that passes AA." Convert to HSL or OKLCH, binary search the lightness until the ratio crosses 4.5, and keep the hue fixed so the color still reads as the brand color.`,
  },
  {
    id: "fe-color-convert",
    title: "Hex, RGB and HSL conversions",
    track: "Frontend",
    level: "Medium",
    minutes: 30,
    tags: ["color", "math", "design-tokens"],
    prompt: `Your theming tool lets designers pick colors in HSL but stores tokens as hex. Write the conversions.

- \`hexToRgb(hex)\`: \`#rgb\` or \`#rrggbb\` (\`#\` optional, any case) → \`{ r, g, b }\` with integers from 0 to 255. Invalid input throws an \`Error\`.
- \`rgbToHex({ r, g, b })\`: → \`"#rrggbb"\`, lowercase. Round each channel and clamp it to 0–255 first.
- \`rgbToHsl({ r, g, b })\`: → \`{ h, s, l }\` with \`h\` in [0, 360) and \`s\`, \`l\` as percentages from 0 to 100, **each rounded to an integer**. Grays have \`h: 0, s: 0\`.
- \`hslToRgb({ h, s, l })\`: → \`{ r, g, b }\` rounded to integers. \`h\` wraps around, so \`-120\` and \`480\` are valid. \`s\` and \`l\` are percentages.

\`\`\`js
hexToRgb("#336699");                 // { r: 51, g: 102, b: 153 }
rgbToHsl({ r: 51, g: 102, b: 153 }); // { h: 210, s: 50, l: 40 }
hslToRgb({ h: 210, s: 50, l: 40 });  // { r: 51, g: 102, b: 153 }
rgbToHex({ r: 255, g: 127.6, b: 0 }); // "#ff8000"
\`\`\`

Hint at the formulas: lightness is the average of the largest and smallest channel. Hue depends on which channel is largest.`,
    starter: `function hexToRgb(hex) {\n  // your code here\n}\n\nfunction rgbToHex(rgb) {\n  // your code here\n}\n\nfunction rgbToHsl(rgb) {\n  // your code here\n}\n\nfunction hslToRgb(hsl) {\n  // your code here\n}`,
    tests: `test("hexToRgb parses full and shorthand hex", () => {
  expect(hexToRgb("#336699")).toEqual({ r: 51, g: 102, b: 153 });
  expect(hexToRgb("FFF")).toEqual({ r: 255, g: 255, b: 255 });
  expect(hexToRgb("#0aF")).toEqual({ r: 0, g: 170, b: 255 });
});
test("hexToRgb throws on invalid input", () => {
  expect(() => hexToRgb("#12")).toThrow();
  expect(() => hexToRgb("#zzzzzz")).toThrow();
  expect(() => hexToRgb("")).toThrow();
});
test("rgbToHex pads, lowercases, rounds and clamps", () => {
  expect(rgbToHex({ r: 0, g: 10, b: 255 })).toBe("#000aff");
  expect(rgbToHex({ r: 255, g: 127.6, b: 0 })).toBe("#ff8000");
  expect(rgbToHex({ r: 300, g: -20, b: 15.4 })).toBe("#ff000f");
});
test("rgbToHsl handles primaries and grays", () => {
  expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
  expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
  expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toEqual({ h: 0, s: 0, l: 50 });
  expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
});
test("rgbToHsl handles mixed colors", () => {
  expect(rgbToHsl({ r: 51, g: 102, b: 153 })).toEqual({ h: 210, s: 50, l: 40 });
  expect(rgbToHsl({ r: 0, g: 128, b: 128 })).toEqual({ h: 180, s: 100, l: 25 });
  expect(rgbToHsl({ r: 255, g: 0, b: 128 })).toEqual({ h: 330, s: 100, l: 50 });
});
test("hslToRgb converts back", () => {
  expect(hslToRgb({ h: 210, s: 50, l: 40 })).toEqual({ r: 51, g: 102, b: 153 });
  expect(hslToRgb({ h: 120, s: 100, l: 25 })).toEqual({ r: 0, g: 128, b: 0 });
  expect(hslToRgb({ h: 0, s: 0, l: 50 })).toEqual({ r: 128, g: 128, b: 128 });
});
test("hslToRgb wraps the hue", () => {
  expect(hslToRgb({ h: -120, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
  expect(hslToRgb({ h: 480, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
  expect(hslToRgb({ h: 360, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
});
test("hue never rounds up to 360", () => {
  // this color's hue is about 359.8 degrees
  expect(rgbToHsl({ r: 255, g: 0, b: 1 }).h).toBe(0);
});
test("round-trips through hex and hsl", () => {
  for (const hex of ["#336699", "#ff8000", "#00ff00", "#000000", "#ffffff"]) {
    expect(rgbToHex(hslToRgb(rgbToHsl(hexToRgb(hex))))).toBe(hex);
  }
});`,
    hints: [
      "Normalize the channels to 0..1 first. Then max, min and their difference d drive everything: l = (max + min) / 2, and a color is gray when d is 0.",
      "Saturation is d / (1 - |2l - 1|). Hue depends on which channel is the max: red gives ((g - b) / d) mod 6, green gives (b - r) / d + 2, blue gives (r - g) / d + 4. Multiply by 60 and add 360 if negative. Round at the end and take % 360 so 359.8 becomes 0, not 360.",
      "For the reverse: c = (1 - |2l - 1|) * s, x = c * (1 - |(h / 60) mod 2 - 1|), m = l - c / 2. Pick (r, g, b) from [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x] by which 60-degree sector h is in, then add m and multiply by 255.",
    ],
    solution: `function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new Error("Invalid hex color: " + hex);
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(h / 60);
  const [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][sector];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}`,
    explanation: `HSL is a cylinder wrapped around the RGB cube. Lightness is the midpoint of the brightest and dimmest channel, chroma (\`max - min\`) is how far from gray the color is, and hue is the angle around the color wheel. Which channel is largest tells you which third of the wheel you are in, and the other two channels give the position within it. Every function is O(1).

\`hslToRgb\` works in reverse: compute the chroma \`c\`, find the second-largest component \`x\` from the position within the 60° sector, and shift everything by \`m\` to restore lightness. Wrapping the hue with \`((h % 360) + 360) % 360\` handles negative angles, which JavaScript's \`%\` alone does not.

Common mistakes: forgetting to normalize to 0..1, a \`% 6\` that leaves red-dominant hues negative, rounding the hue to 360 instead of wrapping to 0, and treating HSL lightness as perceptual. An HSL yellow and an HSL blue at \`l: 50\` look wildly different in brightness.

Follow-up: "Why are modern design systems moving to OKLCH?" Its lightness is perceptually uniform, so generating a tonal palette by stepping L gives even visual steps and predictable contrast, which HSL can't guarantee.`,
  },
  {
    id: "fe-fluid-type-clamp",
    title: "Fluid type with clamp()",
    track: "Frontend",
    level: "Easy",
    minutes: 20,
    tags: ["css", "typography", "design-math"],
    prompt: `Your type scale should grow smoothly between a phone and a desktop width instead of jumping at breakpoints. Generate the CSS.

\`fluidType({ minSize, maxSize, minViewport, maxViewport, rootFontSize = 16 })\`: all inputs are in px. It returns a CSS \`clamp()\` string whose preferred value is a straight line through \`(minViewport, minSize)\` and \`(maxViewport, maxSize)\`:

- \`slope = (maxSize - minSize) / (maxViewport - minViewport)\`
- \`intercept = minSize - slope * minViewport\` (px)
- Preferred value: \`<intercept / rootFontSize>rem + <slope * 100>vw\`. If the vw term is negative, write \`- <abs>vw\`.
- Format: \`clamp(<lower>rem, <preferred>, <upper>rem)\`, where lower and upper are the smaller and larger of the two sizes, so shrinking type also works.
- Round every number to at most 4 decimal places and drop trailing zeros (\`1.5\`, not \`1.5000\`).
- If \`minSize === maxSize\`, return just \`"<size>rem"\`.
- If \`minViewport >= maxViewport\`, throw an \`Error\`.

\`\`\`js
fluidType({ minSize: 16, maxSize: 24, minViewport: 320, maxViewport: 1280 });
// "clamp(1rem, 0.8333rem + 0.8333vw, 1.5rem)"
fluidType({ minSize: 16, maxSize: 48, minViewport: 600, maxViewport: 1000 });
// "clamp(1rem, -2rem + 8vw, 3rem)"
\`\`\`

Using rem for the intercept (not px) keeps the type responsive to the user's browser font-size setting.`,
    starter: `function fluidType(options) {\n  // your code here\n}`,
    tests: `test("generates a clamp() for growing type", () => {
  expect(fluidType({ minSize: 16, maxSize: 24, minViewport: 320, maxViewport: 1280 })).toBe("clamp(1rem, 0.8333rem + 0.8333vw, 1.5rem)");
});
test("drops trailing zeros", () => {
  expect(fluidType({ minSize: 18, maxSize: 32, minViewport: 400, maxViewport: 1200 })).toBe("clamp(1.125rem, 0.6875rem + 1.75vw, 2rem)");
});
test("handles a negative intercept", () => {
  expect(fluidType({ minSize: 16, maxSize: 48, minViewport: 600, maxViewport: 1000 })).toBe("clamp(1rem, -2rem + 8vw, 3rem)");
});
test("supports shrinking type with a negative slope", () => {
  expect(fluidType({ minSize: 24, maxSize: 16, minViewport: 320, maxViewport: 1280 })).toBe("clamp(1rem, 1.6667rem - 0.8333vw, 1.5rem)");
});
test("respects a custom root font size", () => {
  expect(fluidType({ minSize: 16, maxSize: 24, minViewport: 320, maxViewport: 1280, rootFontSize: 10 })).toBe("clamp(1.6rem, 1.3333rem + 0.8333vw, 2.4rem)");
});
test("returns a plain rem value when sizes are equal", () => {
  expect(fluidType({ minSize: 20, maxSize: 20, minViewport: 320, maxViewport: 1280 })).toBe("1.25rem");
});
test("hits the exact sizes at both viewport edges", () => {
  const opts = { minSize: 14, maxSize: 22, minViewport: 375, maxViewport: 1440 };
  const css = fluidType(opts);
  const m = css.match(/clamp\\(([-0-9.]+)rem, ([-0-9.]+)rem ([+-]) ([0-9.]+)vw, ([-0-9.]+)rem\\)/);
  expect(m).toBeTruthy();
  const at = (vw) => Number(m[2]) * 16 + (m[3] === "-" ? -1 : 1) * Number(m[4]) * vw / 100;
  expect(Math.abs(at(375) - 14)).toBeLessThan(0.01);
  expect(Math.abs(at(1440) - 22)).toBeLessThan(0.01);
});
test("throws when the viewport range is empty or inverted", () => {
  expect(() => fluidType({ minSize: 16, maxSize: 24, minViewport: 800, maxViewport: 800 })).toThrow();
  expect(() => fluidType({ minSize: 16, maxSize: 24, minViewport: 1200, maxViewport: 400 })).toThrow();
});`,
    hints: [
      "It's the equation of a straight line, y = intercept + slope * x, where x is the viewport width and y is the font size. 1vw is 1% of the viewport width, so a slope of 0.01 px per px is 1vw.",
      "Compute slope and intercept in px. Convert the intercept and both bounds to rem by dividing by rootFontSize, and the slope to vw by multiplying by 100.",
      "A number formatter of String(Number(n.toFixed(4))) rounds and drops trailing zeros. Build the middle term as rem(intercept) + (vw < 0 ? ' - ' + fmt(-vw) : ' + ' + fmt(vw)) + 'vw', and use Math.min and Math.max of the two sizes for the bounds.",
    ],
    solution: `function fluidType({ minSize, maxSize, minViewport, maxViewport, rootFontSize = 16 }) {
  if (minViewport >= maxViewport) throw new Error("minViewport must be less than maxViewport");

  const fmt = (n) => String(Number(n.toFixed(4))); // round, drop trailing zeros, no "-0"
  const rem = (px) => fmt(px / rootFontSize) + "rem";
  if (minSize === maxSize) return rem(minSize);

  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const intercept = minSize - slope * minViewport;
  const vw = slope * 100;

  const preferred = rem(intercept) + (vw < 0 ? " - " + fmt(-vw) : " + " + fmt(vw)) + "vw";
  const lower = rem(Math.min(minSize, maxSize));
  const upper = rem(Math.max(minSize, maxSize));
  return "clamp(" + lower + ", " + preferred + ", " + upper + ")";
}`,
    explanation: `Fluid type is linear interpolation written in CSS units. The two design points (a size at a small viewport and a size at a large one) define a line. \`vw\` supplies the slope because \`1vw = viewport / 100\`, and the rem intercept positions the line. \`clamp()\` stops it from growing or shrinking past the design's limits outside that viewport range.

Keeping the intercept in rem matters for accessibility. A pure-\`vw\` size ignores the user's preferred font size, and browser zoom barely changes it, which fails WCAG 1.4.4 (Resize text). Mixing rem and vw keeps a component that scales with user settings. The function is O(1).

Common mistakes: mixing px and rem in the slope math (convert at the end, not the start), putting the larger size first in \`clamp()\` (when min > max, the browser always uses min), and emitting \`+ -0.8333vw\`, which works but reads badly in a design-token diff.

Follow-up: "Generate a whole modular scale." Take a ratio at each end (for example 1.2 on mobile and 1.333 on desktop), compute \`minSize * ratio^step\` and \`maxSize * ratio^step\` for each step, and feed each pair into this function.`,
  },
  {
    id: "fe-relative-time",
    title: "Relative time formatter",
    track: "Frontend",
    level: "Medium",
    minutes: 20,
    tags: ["dates", "formatting", "i18n"],
    prompt: `Comment timestamps should read "3 minutes ago" and scheduled posts "in 2 days". Write the formatter.

\`formatRelative(date, now = Date.now())\`: \`date\` and \`now\` can each be a \`Date\` or epoch milliseconds.

- Take the whole number of seconds between them. If it is **under 60** in either direction, return \`"just now"\`.
- Otherwise pick the **largest** unit the difference reaches: year (365 days), month (30 days), week (7 days), day, hour, minute.
- The count is **floored**, never rounded: 119 minutes is "1 hour", not "2 hours".
- Pluralize: \`"1 hour"\`, \`"2 hours"\`.
- Past: \`"<n> <unit> ago"\`. Future: \`"in <n> <unit>"\`.
- Exactly one day becomes \`"yesterday"\` or \`"tomorrow"\`.

\`\`\`js
const now = Date.UTC(2024, 0, 15, 12, 0, 0);
formatRelative(now - 3 * 60 * 1000, now);         // "3 minutes ago"
formatRelative(now + 2 * 86400 * 1000, now);      // "in 2 days"
formatRelative(now - 30 * 1000, now);             // "just now"
formatRelative(new Date(now - 86400 * 1000), now); // "yesterday"
\`\`\``,
    starter: `function formatRelative(date, now) {\n  // your code here\n}`,
    tests: `const NOW = Date.UTC(2024, 0, 15, 12, 0, 0);
const S = 1000, M = 60 * S, H = 60 * M, D = 24 * H;
test("returns 'just now' under a minute in either direction", () => {
  expect(formatRelative(NOW, NOW)).toBe("just now");
  expect(formatRelative(NOW - 59 * S, NOW)).toBe("just now");
  expect(formatRelative(NOW + 59 * S, NOW)).toBe("just now");
});
test("formats minutes and hours in the past", () => {
  expect(formatRelative(NOW - 60 * S, NOW)).toBe("1 minute ago");
  expect(formatRelative(NOW - 3 * M, NOW)).toBe("3 minutes ago");
  expect(formatRelative(NOW - 5 * H, NOW)).toBe("5 hours ago");
});
test("floors instead of rounding", () => {
  expect(formatRelative(NOW - 119 * M, NOW)).toBe("1 hour ago");
  expect(formatRelative(NOW - (2 * D - 1 * S), NOW)).toBe("yesterday");
  expect(formatRelative(NOW - 13 * D, NOW)).toBe("1 week ago");
});
test("formats the future with 'in'", () => {
  expect(formatRelative(NOW + 2 * D, NOW)).toBe("in 2 days");
  expect(formatRelative(NOW + 1 * H, NOW)).toBe("in 1 hour");
  expect(formatRelative(NOW + 90 * S, NOW)).toBe("in 1 minute");
});
test("uses yesterday and tomorrow for one day", () => {
  expect(formatRelative(NOW - D, NOW)).toBe("yesterday");
  expect(formatRelative(NOW + D + 5 * H, NOW)).toBe("tomorrow");
});
test("formats weeks, months and years", () => {
  expect(formatRelative(NOW - 7 * D, NOW)).toBe("1 week ago");
  expect(formatRelative(NOW - 29 * D, NOW)).toBe("4 weeks ago");
  expect(formatRelative(NOW - 30 * D, NOW)).toBe("1 month ago");
  expect(formatRelative(NOW + 200 * D, NOW)).toBe("in 6 months");
  expect(formatRelative(NOW - 365 * D, NOW)).toBe("1 year ago");
  expect(formatRelative(NOW - 1000 * D, NOW)).toBe("2 years ago");
});
test("accepts Date objects for both arguments", () => {
  expect(formatRelative(new Date(NOW - 3 * H), new Date(NOW))).toBe("3 hours ago");
});
test("defaults now to the current time", () => {
  expect(formatRelative(Date.now() - 10 * M)).toBe("10 minutes ago");
  expect(formatRelative(new Date(Date.now() + 3 * D + M))).toBe("in 3 days");
});`,
    hints: [
      "Compute everything from one signed difference in seconds. The sign decides 'ago' or 'in'. The absolute value decides the unit and the count.",
      "Keep a table of units from largest to smallest, [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]], and pick the first one whose size is at most the absolute difference.",
      "n = Math.floor(abs / unitSeconds). Special-case unit === 'day' && n === 1. Then label = n + ' ' + unit + (n === 1 ? '' : 's') and return diff < 0 ? label + ' ago' : 'in ' + label. Use +date to turn a Date or a number into milliseconds.",
    ],
    solution: `const RELATIVE_UNITS = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["week", 7 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function formatRelative(date, now = Date.now()) {
  const diffMs = +date - +now;
  const abs = Math.floor(Math.abs(diffMs) / 1000);
  if (abs < 60) return "just now";

  const past = diffMs < 0;
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (abs < seconds) continue;
    const n = Math.floor(abs / seconds);
    if (unit === "day" && n === 1) return past ? "yesterday" : "tomorrow";
    const label = n + " " + unit + (n === 1 ? "" : "s");
    return past ? label + " ago" : "in " + label;
  }
}`,
    explanation: `A table of units ordered from largest to smallest turns the logic into a single scan: take the first unit the difference reaches, then floor. Flooring matches how people read these labels. Something posted 119 minutes ago was "1 hour ago", and rounding would make it look twice as old. The function is O(1) with a constant-size table.

Taking \`now\` as a parameter, with the clock as the default, makes the function pure and testable without mocking \`Date\`. \`+date\` converts both \`Date\` objects and numbers to milliseconds.

Common mistakes: using \`Math.round\` (40 seconds becomes "1 minute ago"), computing \`Math.floor\` on a negative difference (\`Math.floor(-1.5)\` is \`-2\`, so take the absolute value first), and fixed-length months, which drift. Fine for "3 months ago", not for billing.

Follow-up: "Localize it." \`Intl.RelativeTimeFormat\` handles grammar and \`numeric: "auto"\` produces "yesterday" in every locale. You still need this unit-selection logic, and a timer to refresh visible labels, ideally aligned to the next minute boundary rather than polling every second.`,
  },
  {
    id: "fe-highlight-matches",
    title: "Highlight search matches",
    track: "Frontend",
    level: "Hard",
    minutes: 40,
    tags: ["dom", "security", "text-nodes"],
    prompt: `Your docs page has a find-in-page box. The quick version did \`el.innerHTML = el.innerHTML.replace(query, "<mark>$&</mark>")\`. It breaks attributes, it is an XSS hole, and it destroys event listeners. Do it properly.

\`highlight(root, query)\` returns the number of matches it highlighted:

1. First remove any highlights from a previous call: unwrap every \`mark[data-highlight]\` inside \`root\` and merge the split text nodes back together (\`normalize()\`), so the DOM returns to its original shape.
2. If \`query\` is empty, stop and return \`0\`.
3. Walk every **text node** under \`root\`, skipping \`<script>\` and \`<style>\`. Wrap each case-insensitive match of \`query\` in \`<mark data-highlight>\`, keeping the original text's case.
4. The query is a literal string, not a regex: \`"a.b"\` matches only \`a.b\`. Matches don't overlap. A match only has to be found within a single text node.
5. Never touch tags or attribute values. Never use \`innerHTML\`. Leave existing \`<mark>\` elements without \`data-highlight\` alone.

\`\`\`html
<p id="doc">Cats and <a href="/cats">more cats</a>.</p>
\`\`\`

\`\`\`js
highlight(doc, "cat"); // 2
// <p>[mark]Cat[/mark]s and <a href="/cats">more [mark]cat[/mark]s</a>.</p>
highlight(doc, "");    // 0, original DOM restored
\`\`\``,
    starter: `function highlight(root, query) {\n  // your code here\n}`,
    tests: `function fixture(html) {
  document.body.innerHTML = '<div id="root">' + html + '</div>';
  return document.getElementById("root");
}
function marks(root) { return Array.from(root.querySelectorAll("mark[data-highlight]"), (m) => m.textContent); }
test("wraps a match in a mark element", () => {
  const root = fixture("<p>Hello world</p>");
  expect(highlight(root, "world")).toBe(1);
  expect(marks(root)).toEqual(["world"]);
  expect(root.textContent).toBe("Hello world");
});
test("matches case-insensitively and keeps the original case", () => {
  const root = fixture("<p>Cats and <a href='/cats'>more CATS</a>.</p>");
  expect(highlight(root, "cat")).toBe(2);
  expect(marks(root)).toEqual(["Cat", "CAT"]);
});
test("finds several matches in one text node and across elements", () => {
  const root = fixture("<p>aXa aXa</p><ul><li>xx</li><li>none</li></ul>");
  expect(highlight(root, "x")).toBe(4);
  expect(root.querySelector("p").childNodes).toHaveLength(5);
});
test("never matches inside attributes or tag names", () => {
  const root = fixture('<a href="/match" title="match" class="match">link</a>');
  expect(highlight(root, "match")).toBe(0);
  expect(root.querySelector("a").getAttribute("href")).toBe("/match");
  expect(highlight(root, "a")).toBe(0);
});
test("treats regex characters literally", () => {
  const root = fixture("<p>a.b axb (x) $1 a+b</p>");
  expect(highlight(root, "a.b")).toBe(1);
  expect(highlight(root, "(x)")).toBe(1);
  expect(highlight(root, "$1")).toBe(1);
  expect(highlight(root, "a+b")).toBe(1);
  expect(marks(root)).toEqual(["a+b"]);
});
test("does not parse text that looks like HTML", () => {
  const root = fixture("<p>&lt;img src=x onerror=alert(1)&gt; img</p>");
  expect(highlight(root, "img")).toBe(2);
  expect(root.querySelector("img")).toBeNull();
  expect(root.textContent).toBe("<img src=x onerror=alert(1)> img");
});
test("clears previous highlights and restores the original DOM", () => {
  const root = fixture("<p>one two one</p><b>one</b>");
  const before = root.innerHTML;
  highlight(root, "one");
  highlight(root, "two");
  expect(marks(root)).toEqual(["two"]);
  expect(highlight(root, "")).toBe(0);
  expect(root.innerHTML).toBe(before);
  expect(root.querySelector("p").childNodes).toHaveLength(1);
});
test("keeps existing elements and their listeners", () => {
  const root = fixture("<button>find me</button><mark>keep me</mark>");
  const button = root.querySelector("button");
  let clicks = 0;
  button.addEventListener("click", () => clicks++);
  highlight(root, "me");
  highlight(root, "");
  expect(root.querySelector("button")).toBe(button);
  button.click();
  expect(clicks).toBe(1);
  expect(root.querySelectorAll("mark")).toHaveLength(1);
  expect(root.querySelector("mark").textContent).toBe("keep me");
});
test("skips script and style contents", () => {
  const root = fixture("<style>.find { color: red }</style><p>find</p><script>var find = 1;</script>");
  expect(highlight(root, "find")).toBe(1);
  expect(root.querySelector("style").textContent).toBe(".find { color: red }");
});`,
    hints: [
      "Strings are the wrong tool here. Work only with text nodes: they contain the visible text and nothing else, so attributes and tags are out of reach by construction.",
      "Collect the text nodes first with document.createTreeWalker(root, NodeFilter.SHOW_TEXT), filtering out those inside script or style, and only then modify them, because changing the DOM mid-walk confuses the walker. For each node, find matches with lower.indexOf(needle, from), a literal search with no regex escaping needed.",
      "For a node with matches, build a DocumentFragment: append the text before each match, then a mark whose textContent is the original slice, and finally the remaining text, then node.replaceWith(fragment). To clear, replace each mark[data-highlight] with its child nodes and call normalize() on its parent.",
    ],
    solution: `function clearHighlights(root) {
  for (const mark of root.querySelectorAll("mark[data-highlight]")) {
    const parent = mark.parentNode;
    mark.replaceWith(...mark.childNodes);
    parent.normalize(); // merge the split text nodes back together
  }
}

function highlight(root, query) {
  clearHighlights(root);
  if (!query) return 0;

  const needle = query.toLowerCase();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement && node.parentElement.closest("script, style")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  let count = 0;
  for (const node of textNodes) {
    const text = node.nodeValue;
    const lower = text.toLowerCase();
    let index = lower.indexOf(needle);
    if (index === -1) continue;

    const fragment = document.createDocumentFragment();
    let last = 0;
    while (index !== -1) {
      if (index > last) fragment.append(text.slice(last, index));
      const mark = document.createElement("mark");
      mark.dataset.highlight = "";
      mark.textContent = text.slice(index, index + needle.length);
      fragment.append(mark);
      count++;
      last = index + needle.length;
      index = lower.indexOf(needle, last);
    }
    if (last < text.length) fragment.append(text.slice(last));
    node.replaceWith(fragment);
  }
  return count;
}`,
    explanation: `Text nodes hold exactly the characters the user sees, so searching them can never touch markup, attributes or scripts. Building replacements from \`createElement\` and plain strings means user text is never parsed. Elements that aren't text are never recreated either, so their event listeners, focus and form state survive. The work is O(total text length).

Collecting the nodes before mutating them avoids a classic TreeWalker bug: once you replace the current node, the walker's position is gone. \`indexOf\` on lowercased copies gives a literal, case-insensitive search with no regex escaping. Slicing the **original** string at the same indexes keeps the user's casing.

Clearing is the inverse operation. Unwrap each mark, then call \`normalize()\` to merge adjacent text nodes. Without it, repeated searches leave the text fragmented into dozens of nodes, which breaks later matches across the seams. Edge case: \`toLowerCase\` can change string length for a few characters (such as the Turkish dotted İ), which shifts indexes. A production version compares with \`localeCompare\` or uses a regex with the \`i\` and \`u\` flags on escaped input.

Follow-up: "Matches that span elements, like \`he<b>llo</b>\`?" Concatenate the text of all nodes with an offset map, search the combined string, and wrap each covered segment separately. Or skip the DOM work entirely with the CSS Custom Highlight API (\`CSS.highlights\` with \`Range\` objects).`,
  },
  {
    id: "fe-specificity",
    title: "CSS specificity calculator",
    track: "Frontend",
    level: "Hard",
    minutes: 40,
    tags: ["css", "parsing", "selectors"],
    prompt: `Your CSS linter flags rules that can never win because of specificity. Write the calculator.

\`specificity(selector)\` returns \`[a, b, c]\`:

- **a**: ID selectors (\`#nav\`).
- **b**: class selectors (\`.item\`), attribute selectors (\`[href]\`, \`[type="text"]\`) and pseudo-classes (\`:hover\`, \`:nth-child(2n+1)\`).
- **c**: type selectors (\`div\`) and pseudo-elements (\`::before\`, plus the legacy single-colon \`:before\`, \`:after\`, \`:first-line\`, \`:first-letter\`).
- \`*\` and combinators (space, \`>\`, \`+\`, \`~\`) count for nothing.
- \`:is()\`, \`:not()\` and \`:has()\` count as their **most specific** argument. \`:where()\` counts as zero.
- Attribute values may be quoted and may contain characters like \`]\`, \`.\` or \`#\`. They don't count as anything.
- A selector list (\`a, #b\`) returns the specificity of its most specific selector.

\`compareSpecificity(selA, selB)\` returns \`1\`, \`-1\` or \`0\`, comparing \`a\`, then \`b\`, then \`c\`. **There is no carry**: one ID beats any number of classes.

\`\`\`js
specificity("#nav .item a:hover");       // [1, 2, 1]
specificity("a:not(#x, .y)::before");    // [1, 0, 2]
specificity(":where(#app) p");           // [0, 0, 1]
compareSpecificity("#a", ".a.b.c.d.e.f.g.h.i.j.k"); // 1
\`\`\``,
    starter: `function specificity(selector) {\n  // your code here\n}\n\nfunction compareSpecificity(selA, selB) {\n  // your code here\n}`,
    tests: `test("counts type selectors and ignores the universal selector", () => {
  expect(specificity("*")).toEqual([0, 0, 0]);
  expect(specificity("div")).toEqual([0, 0, 1]);
  expect(specificity("ul li a")).toEqual([0, 0, 3]);
});
test("counts ids, classes and pseudo-classes", () => {
  expect(specificity("#nav .item a:hover")).toEqual([1, 2, 1]);
  expect(specificity(".a.b.c")).toEqual([0, 3, 0]);
  expect(specificity("#a#b")).toEqual([2, 0, 0]);
});
test("ignores combinators", () => {
  expect(specificity("div > p + .x ~ span")).toEqual([0, 1, 3]);
  expect(specificity("div>p+.x~span")).toEqual([0, 1, 3]);
});
test("counts attribute selectors, including quoted values with special characters", () => {
  expect(specificity("a[href^='http']")).toEqual([0, 1, 1]);
  expect(specificity('input[type="text"][required]')).toEqual([0, 2, 1]);
  expect(specificity('a[title="x] #y.z"]')).toEqual([0, 1, 1]);
});
test("distinguishes pseudo-elements, including legacy single-colon ones", () => {
  expect(specificity("p::first-line")).toEqual([0, 0, 2]);
  expect(specificity("p:before")).toEqual([0, 0, 2]);
  expect(specificity("a::after:hover")).toEqual([0, 1, 2]);
  expect(specificity("li:nth-child(2n+1)")).toEqual([0, 1, 1]);
  expect(specificity("li:first-child")).toEqual([0, 1, 1]);
});
test(":is, :not and :has take their most specific argument", () => {
  expect(specificity(":not(#a, .b)")).toEqual([1, 0, 0]);
  expect(specificity("a:is(.x, #y .z)")).toEqual([1, 1, 1]);
  expect(specificity("a:not(.x)::before")).toEqual([0, 1, 2]);
  expect(specificity("section:has(> h2.title)")).toEqual([0, 1, 2]);
});
test(":where contributes nothing", () => {
  expect(specificity(":where(#app .main) p")).toEqual([0, 0, 1]);
  expect(specificity(":where(:is(#a))")).toEqual([0, 0, 0]);
});
test("selector lists return the most specific selector", () => {
  expect(specificity("a, #b, .c.d")).toEqual([1, 0, 0]);
  expect(specificity(".x .y, .z")).toEqual([0, 2, 0]);
});
test("one id beats any number of classes", () => {
  const manyClasses = ".a.b.c.d.e.f.g.h.i.j.k";
  expect(compareSpecificity("#a", manyClasses)).toBe(1);
  expect(compareSpecificity(manyClasses, "#a")).toBe(-1);
  expect(compareSpecificity(".x", "div".repeat(1) + " p span em strong b i u s a q")).toBe(1);
});
test("compareSpecificity returns 0 for ties", () => {
  expect(compareSpecificity(".a p", "p.a")).toBe(0);
  expect(compareSpecificity(":where(#x) .a", ".b")).toBe(0);
});`,
    hints: [
      "Regexes like /#\\w+/g miscount as soon as attribute values or :not() arguments contain the same characters. A tiny left-to-right scanner that consumes one simple selector at a time is easier to get right.",
      "Scan character by character: '#' consumes a name and bumps a; '.' consumes a name and bumps b; '[' skips to the matching ']' (respecting quotes) and bumps b; ':' or '::' reads a name, then an optional parenthesized argument, and decides by name; a name character starts a type selector and bumps c; anything else (combinators, '*', whitespace) is skipped.",
      "For :is, :not and :has, recurse: specificity(argument) already handles lists by taking the max, so add its [a, b, c] to your counts. Split top-level lists on commas only at depth 0 and outside quotes. Compare tuples with a loop: for (i of 0..2) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1; return 0.",
    ],
    solution: `const LEGACY_PSEUDO_ELEMENTS = ["before", "after", "first-line", "first-letter"];
const FORGIVING = ["is", "not", "has", "matches"];

const isNameChar = (ch) => /[A-Za-z0-9_-]/.test(ch) || ch.charCodeAt(0) > 127;

// Index of the bracket that closes the one at s[i], skipping quoted strings.
function findClose(s, i, open, close) {
  let depth = 0;
  let quote = null;
  for (; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === open) {
      depth++;
    } else if (ch === close && --depth === 0) {
      return i;
    }
  }
  throw new Error("Unbalanced " + open + " in selector");
}

function splitList(s) {
  const parts = [];
  let depth = 0, quote = null, start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
  }
  parts.push(s.slice(start));
  return parts.map((p) => p.trim()).filter(Boolean);
}

function cmp(x, y) {
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  return 0;
}

function complexSpecificity(s) {
  let a = 0, b = 0, c = 0, i = 0;
  const readName = () => {
    const start = i;
    while (i < s.length && isNameChar(s[i])) i++;
    return s.slice(start, i);
  };
  while (i < s.length) {
    const ch = s[i];
    if (ch === "#") { i++; readName(); a++; }
    else if (ch === ".") { i++; readName(); b++; }
    else if (ch === "[") { i = findClose(s, i, "[", "]") + 1; b++; }
    else if (ch === ":") {
      const isElement = s[i + 1] === ":";
      i += isElement ? 2 : 1;
      const name = readName().toLowerCase();
      let arg = null;
      if (s[i] === "(") {
        const end = findClose(s, i, "(", ")");
        arg = s.slice(i + 1, end);
        i = end + 1;
      }
      if (isElement || LEGACY_PSEUDO_ELEMENTS.includes(name)) c++;
      else if (name === "where") { /* zero specificity */ }
      else if (FORGIVING.includes(name)) {
        const [x, y, z] = specificity(arg || "");
        a += x; b += y; c += z;
      } else b++;
    }
    else if (isNameChar(ch)) { readName(); c++; }
    else i++; // combinators, whitespace, *
  }
  return [a, b, c];
}

function specificity(selector) {
  return splitList(selector)
    .map(complexSpecificity)
    .reduce((best, s) => (cmp(s, best) > 0 ? s : best), [0, 0, 0]);
}

function compareSpecificity(selA, selB) {
  return cmp(specificity(selA), specificity(selB));
}`,
    explanation: `Specificity is a 3-tuple compared lexicographically, not a number. The old "IDs are 100, classes are 10" shortcut breaks at 11 classes, and browsers have never carried between columns. Comparing tuple positions in order mirrors the cascade exactly.

A hand-written scanner beats regexes because selectors are nested and quoted. A quoted attribute value can contain \`#\`, \`.\` or \`]\`, and \`:not()\` can contain a whole selector list. \`findClose\` tracks depth and quotes, and recursion handles the functional pseudo-classes. Because \`specificity()\` already returns the max over a list, \`:is(a, #b)\` simply reuses it. The work is linear in the selector length (plus the size of nested arguments).

Common mistakes: counting \`::before\` as a pseudo-class, giving \`:where()\` or \`:not()\` their own +1 (only their arguments count), counting \`*\`, and splitting selector lists on every comma, including the ones inside \`:is(...)\`.

Follow-up: "Where do inline styles, \`!important\` and \`@layer\` fit?" They sit above specificity in the cascade. Origin and importance are compared first, then layer order, and only then specificity, which is why a low-specificity selector in a later layer can beat an ID in an earlier one.`,
  },
  {
    id: "fe-get-set-in",
    title: "getIn and immutable setIn",
    track: "Frontend",
    level: "Easy",
    minutes: 20,
    tags: ["immutability", "objects", "paths"],
    prompt: `Your form library stores values like \`{ user: { addresses: [{ city }] } }\` and fields are named with paths like \`"user.addresses[0].city"\`. Write the path helpers.

Paths can be an array of keys (\`["user", "addresses", 0, "city"]\`) or a string using dots and/or brackets (\`"user.addresses[0].city"\`, \`"user.addresses.0.city"\`). An empty path refers to the root.

- \`getIn(obj, path, defaultValue)\`: returns the value at \`path\`, or \`defaultValue\` if any step is missing (\`null\` or \`undefined\` along the way) or the final value is \`undefined\`. A final \`null\` is returned as \`null\`.
- \`setIn(obj, path, value)\`: returns a **new** object with \`value\` at \`path\`. It never mutates \`obj\`:
  - Copy each object or array along the path (arrays stay arrays). Branches you didn't touch keep their references.
  - Create missing containers. Use an array when the **next** key is a non-negative integer (like \`0\` or \`"0"\`), otherwise an object.
  - If the value at the path is already \`value\` (\`Object.is\`), return \`obj\` itself.

\`\`\`js
const state = { user: { name: "Ada", tags: ["a"] } };
getIn(state, "user.tags[0]");          // "a"
getIn(state, "user.age", 30);          // 30
setIn(state, "user.name", "Grace");    // { user: { name: "Grace", tags: ["a"] } } (tags reused)
setIn({}, "list[1].id", 7);            // { list: [ <empty>, { id: 7 } ] }
\`\`\``,
    starter: `function getIn(obj, path, defaultValue) {\n  // your code here\n}\n\nfunction setIn(obj, path, value) {\n  // your code here\n}`,
    tests: `const base = () => ({ user: { name: "Ada", tags: ["a", "b"], address: { city: "London" } }, flags: { beta: true } });
test("getIn reads dotted, bracket and array paths", () => {
  const s = base();
  expect(getIn(s, "user.name")).toBe("Ada");
  expect(getIn(s, "user.tags[1]")).toBe("b");
  expect(getIn(s, "user.tags.0")).toBe("a");
  expect(getIn(s, ["user", "address", "city"])).toBe("London");
});
test("getIn returns the default for missing paths", () => {
  const s = base();
  expect(getIn(s, "user.age", 30)).toBe(30);
  expect(getIn(s, "nope.deeper.still", "x")).toBe("x");
  expect(getIn(s, "user.tags[5]")).toBeUndefined();
  expect(getIn(null, "a", 1)).toBe(1);
});
test("getIn keeps falsy values and null", () => {
  const s = { a: 0, b: "", c: false, d: null };
  expect(getIn(s, "a", 9)).toBe(0);
  expect(getIn(s, "b", 9)).toBe("");
  expect(getIn(s, "c", 9)).toBe(false);
  expect(getIn(s, "d", 9)).toBeNull();
  expect(getIn(s, "d.e", 9)).toBe(9);
});
test("an empty path refers to the root", () => {
  const s = base();
  expect(getIn(s, "")).toBe(s);
  expect(getIn(s, [])).toBe(s);
  expect(setIn(s, [], 5)).toBe(5);
});
test("setIn returns a new object and leaves the original alone", () => {
  const s = base();
  const next = setIn(s, "user.name", "Grace");
  expect(next.user.name).toBe("Grace");
  expect(s.user.name).toBe("Ada");
  expect(next).not.toBe(s);
  expect(next.user).not.toBe(s.user);
});
test("setIn shares untouched branches by reference", () => {
  const s = base();
  const next = setIn(s, "user.address.city", "Paris");
  expect(next.flags).toBe(s.flags);
  expect(next.user.tags).toBe(s.user.tags);
  expect(next.user.address).not.toBe(s.user.address);
});
test("setIn copies arrays as arrays", () => {
  const s = base();
  const next = setIn(s, "user.tags[1]", "B");
  expect(Array.isArray(next.user.tags)).toBe(true);
  expect(next.user.tags).toEqual(["a", "B"]);
  expect(s.user.tags).toEqual(["a", "b"]);
});
test("setIn creates missing objects and arrays", () => {
  const next = setIn({}, "list[1].id", 7);
  expect(Array.isArray(next.list)).toBe(true);
  expect(next.list).toHaveLength(2);
  expect(next.list[1]).toEqual({ id: 7 });
  expect(setIn({ a: null }, ["a", "b", "c"], 1)).toEqual({ a: { b: { c: 1 } } });
});
test("setIn returns the same object when the value is unchanged", () => {
  const s = base();
  expect(setIn(s, "user.name", "Ada")).toBe(s);
  expect(setIn(s, "flags.beta", true)).toBe(s);
});`,
    hints: [
      "Normalize the path into an array of keys first. Then both functions are simple loops, or a recursion, over that array.",
      "To parse a string path, replace '[x]' with '.x' and split on '.', dropping empty pieces. getIn walks key by key and bails out with the default when it hits null or undefined. setIn is naturally recursive: copy this level, then set copy[key] = setIn(current[key], restOfPath, value).",
      "In setIn, when the current value isn't an object, create [] if the key is /^\\d+$/, else {}. Copy with Array.isArray(base) ? base.slice() : { ...base }. If the recursive result is Object.is-equal to base[key] and base === obj, return obj unchanged.",
    ],
    solution: `function toPath(path) {
  if (Array.isArray(path)) return path;
  return String(path)
    .replace(/\\[([^\\]]*)\\]/g, ".$1") // a[0].b -> a.0.b
    .split(".")
    .filter((key) => key !== "");
}

const isIndex = (key) => /^\\d+$/.test(String(key));

function getIn(obj, path, defaultValue) {
  let current = obj;
  for (const key of toPath(path)) {
    if (current == null) return defaultValue;
    current = current[key];
  }
  return current === undefined ? defaultValue : current;
}

function setIn(obj, path, value) {
  const keys = toPath(path);
  if (keys.length === 0) return value;
  const [key, ...rest] = keys;

  const isContainer = obj !== null && typeof obj === "object";
  const base = isContainer ? obj : isIndex(key) ? [] : {};
  const nextChild = setIn(base[key], rest, value);
  if (isContainer && Object.is(nextChild, base[key])) return obj; // nothing changed

  const copy = Array.isArray(base) ? base.slice() : { ...base };
  copy[key] = nextChild;
  return copy;
}`,
    explanation: `\`setIn\` is path copying. Only the objects on the path from the root to the change are cloned, and every sibling branch is reused by reference. That costs O(depth × width of each copied level), not a deep clone of the whole state, and it is how Immutable.js, Redux Toolkit and form libraries keep updates cheap while still letting \`===\` detect what changed.

Recursion makes the "unchanged" check fall out naturally. If the recursive call hands back the same child, this level hasn't changed either, so it returns the original and no copies are made all the way up. Parsing paths once into a key array keeps both functions free of string handling.

Common mistakes: \`{ ...arr }\` turns an array into an object with numeric keys, using \`||\` for the default (it swallows \`0\`, \`""\` and \`false\`), mutating on the way down "just for the missing containers", and deciding between array and object by the current key instead of the key being written into the new container.

Follow-up: "Is this safe with paths from user input?" Not as is. A path like \`__proto__.isAdmin\` reaches \`Object.prototype\` through \`getIn\`, and \`setIn\` defines an own \`__proto__\` key on the copy, which later merge code may follow. Reject \`__proto__\`, \`constructor\` and \`prototype\` segments.`,
  }
);
