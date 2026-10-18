(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "fe-render-list",
    title: "Render a list safely",
    track: "Frontend",
    level: "Easy",
    minutes: 15,
    tags: ["dom", "security", "xss"],
    prompt: `Your saved-items panel renders labels that users typed themselves. A teammate's version built an HTML string and assigned it to \`innerHTML\`, and then someone saved an item called \`<img src=x onerror=alert(1)>\`. Rebuild it safely.

Write \`renderList(container, items)\` where \`items\` is an array of \`{ id, label, done }\`.

- Replace whatever is currently inside \`container\`.
- Render one \`<ul class="list">\` with one \`<li>\` per item, in order.
- Each \`<li>\` gets a \`data-id\` attribute set to the item's id, and the label as its text. Labels must never be parsed as HTML.
- Items with \`done: true\` get the class \`done\`. Others get no \`done\` class.
- If \`items\` is empty, render \`<p class="empty">No items</p>\` instead of the list.

\`\`\`js
renderList(el, [{ id: 1, label: "Buy <milk>", done: true }]);
el.innerHTML;
// '<ul class="list"><li data-id="1" class="done">Buy &lt;milk&gt;</li></ul>'
\`\`\``,
    starter: `function renderList(container, items) {\n  // your code here\n}`,
    tests: `test("renders one li per item, in order", () => {
  const el = document.createElement("div");
  renderList(el, [{ id: 1, label: "One" }, { id: 2, label: "Two" }, { id: 3, label: "Three" }]);
  const lis = el.querySelectorAll("ul.list > li");
  expect(lis).toHaveLength(3);
  expect(Array.from(lis, (li) => li.textContent)).toEqual(["One", "Two", "Three"]);
});
test("sets data-id on each li", () => {
  const el = document.createElement("div");
  renderList(el, [{ id: 7, label: "a" }, { id: "x9", label: "b" }]);
  expect(Array.from(el.querySelectorAll("li"), (li) => li.dataset.id)).toEqual(["7", "x9"]);
});
test("adds the done class only to done items", () => {
  const el = document.createElement("div");
  renderList(el, [{ id: 1, label: "a", done: true }, { id: 2, label: "b", done: false }, { id: 3, label: "c" }]);
  const lis = el.querySelectorAll("li");
  expect(lis[0].classList.contains("done")).toBe(true);
  expect(lis[1].classList.contains("done")).toBe(false);
  expect(lis[2].classList.contains("done")).toBe(false);
});
test("never parses labels as HTML", () => {
  window.__xss = 0;
  const el = document.createElement("div");
  document.body.append(el);
  const evil = '<img src=x onerror="window.__xss = 1"><b>bold</b>';
  renderList(el, [{ id: 1, label: evil }]);
  expect(el.querySelector("img")).toBeNull();
  expect(el.querySelector("b")).toBeNull();
  expect(el.querySelector("li").textContent).toBe(evil);
  expect(window.__xss).toBe(0);
  delete window.__xss;
});
test("keeps ampersands and quotes exactly as typed", () => {
  const el = document.createElement("div");
  renderList(el, [{ id: 1, label: "Tom & \\"Jerry\\" &amp;" }]);
  expect(el.querySelector("li").textContent).toBe("Tom & \\"Jerry\\" &amp;");
});
test("replaces previous content on re-render", () => {
  const el = document.createElement("div");
  el.textContent = "loading...";
  renderList(el, [{ id: 1, label: "a" }]);
  renderList(el, [{ id: 2, label: "b" }, { id: 3, label: "c" }]);
  expect(el.children).toHaveLength(1);
  expect(el.querySelectorAll("li")).toHaveLength(2);
  expect(el.textContent).toBe("bc");
});
test("shows an empty state for an empty list", () => {
  const el = document.createElement("div");
  renderList(el, [{ id: 1, label: "a" }]);
  renderList(el, []);
  expect(el.querySelector("ul")).toBeNull();
  const p = el.querySelector("p.empty");
  expect(p).toBeTruthy();
  expect(p.textContent).toBe("No items");
});`,
    hints: [
      "The bug is building markup from strings. If you create nodes yourself, the browser never gets a chance to parse user text as HTML.",
      "Use document.createElement for the ul and each li, set textContent for the label and dataset.id for the id, then append. container.replaceChildren() clears the old content.",
      "container.replaceChildren(); const ul = document.createElement('ul'); ul.className = 'list'; for each item: li.dataset.id = String(item.id); if (item.done) li.classList.add('done'); li.textContent = item.label; ul.append(li).",
    ],
    solution: `function renderList(container, items) {
  container.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No items";
    container.append(empty);
    return;
  }

  const ul = document.createElement("ul");
  ul.className = "list";
  for (const item of items) {
    const li = document.createElement("li");
    li.dataset.id = String(item.id);
    if (item.done) li.classList.add("done");
    li.textContent = item.label; // text, never markup
    ul.append(li);
  }
  container.append(ul);
}`,
    explanation: `Setting \`textContent\` creates a text node. The browser stores the characters as they are and never runs them through the HTML parser, so \`<img onerror>\` shows up as literal text. That rules out XSS completely, with no escaping function to forget or get wrong.

Building the \`<ul>\` before it is attached and then appending it once means a single insertion into the live document. For long lists you can also build into a \`DocumentFragment\`. \`replaceChildren()\` with no arguments is the modern way to clear a node. \`textContent = ""\` works too.

Common mistakes: escaping only \`<\` and \`>\` and forgetting \`&\` and quotes, escaping twice (which turns \`&amp;\` into \`&amp;amp;\`), and only adding the \`done\` class on first render, never removing it.

Follow-up: "How would you update the list without rebuilding it each time?" Keep a map from id to \`<li>\`, then reuse, reorder and remove nodes based on ids. That is keyed reconciliation, the idea behind framework list diffing.`,
  },
  {
    id: "fe-delegate",
    title: "Event delegation helper",
    track: "Frontend",
    level: "Medium",
    minutes: 20,
    tags: ["dom", "events"],
    prompt: `A table with 5,000 rows attaches a click listener to every row and the page is sluggish. Replace that with one listener on the container.

Write \`delegate(root, selector, type, handler)\`:

- Add **one** listener for \`type\` on \`root\`.
- When an event fires, find the nearest element matching \`selector\`, starting from \`event.target\` and walking up. Only call \`handler(event, matchedElement)\` if that element is \`root\` itself or inside \`root\`.
- It must work for elements added after \`delegate\` was called.
- Return an \`unsubscribe()\` function that removes the listener.

\`\`\`js
const off = delegate(table, "tr[data-id]", "click", (event, row) => {
  open(row.dataset.id);
});
// clicking a <td> or a <span> inside a row calls the handler with the <tr>
off(); // no more calls
\`\`\`

Edge case the tests check: if an ancestor **outside** \`root\` matches the selector, it must not trigger the handler.`,
    starter: `function delegate(root, selector, type, handler) {\n  // your code here\n}`,
    tests: `function setupList() {
  document.body.innerHTML = '<ul id="root"><li class="item" data-id="a"><span class="label">A</span></li><li class="item" data-id="b">B</li><li class="other">C</li></ul>';
  return document.getElementById("root");
}
function clickOn(el) {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}
test("calls the handler for a click on a matching element", () => {
  const root = setupList();
  const calls = [];
  delegate(root, ".item", "click", (e, el) => calls.push(el.dataset.id));
  clickOn(root.querySelector('[data-id="b"]'));
  expect(calls).toEqual(["b"]);
});
test("passes the matched element when a descendant is clicked", () => {
  const root = setupList();
  let matched = null, target = null;
  delegate(root, ".item", "click", (e, el) => { matched = el; target = e.target; });
  const span = root.querySelector(".label");
  clickOn(span);
  expect(matched).toBe(root.querySelector('[data-id="a"]'));
  expect(target).toBe(span);
});
test("ignores events on elements that do not match", () => {
  const root = setupList();
  let count = 0;
  delegate(root, ".item", "click", () => count++);
  clickOn(root.querySelector(".other"));
  clickOn(root);
  expect(count).toBe(0);
});
test("works for elements added later", () => {
  const root = setupList();
  const calls = [];
  delegate(root, ".item", "click", (e, el) => calls.push(el.dataset.id));
  const li = document.createElement("li");
  li.className = "item";
  li.dataset.id = "new";
  root.append(li);
  clickOn(li);
  expect(calls).toEqual(["new"]);
});
test("does not match ancestors outside the root", () => {
  document.body.innerHTML = '<div class="item" id="outer"><ul id="root"><li class="plain">x</li></ul></div>';
  const root = document.getElementById("root");
  let count = 0;
  delegate(root, ".item", "click", () => count++);
  clickOn(root.querySelector(".plain"));
  expect(count).toBe(0);
});
test("only listens for the given event type", () => {
  const root = setupList();
  let count = 0;
  delegate(root, ".item", "click", () => count++);
  root.querySelector(".item").dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  expect(count).toBe(0);
});
test("unsubscribe stops further calls", () => {
  const root = setupList();
  let count = 0;
  const off = delegate(root, ".item", "click", () => count++);
  expect(typeof off).toBe("function");
  clickOn(root.querySelector(".item"));
  off();
  clickOn(root.querySelector(".item"));
  expect(count).toBe(1);
});
test("two delegates on the same root are independent", () => {
  const root = setupList();
  const log = [];
  const offA = delegate(root, ".item", "click", () => log.push("item"));
  delegate(root, ".other", "click", () => log.push("other"));
  offA();
  clickOn(root.querySelector(".item"));
  clickOn(root.querySelector(".other"));
  expect(log).toEqual(["other"]);
});`,
    hints: [
      "Events bubble. A single listener on root sees every click inside it, and event.target tells you where it started.",
      "In the listener, call event.target.closest(selector) to find the nearest match walking upward, then check root.contains(match) so ancestors above root don't count.",
      "const listener = (e) => { const match = e.target.closest && e.target.closest(selector); if (match && root.contains(match)) handler(e, match); }; root.addEventListener(type, listener); return () => root.removeEventListener(type, listener);",
    ],
    solution: `function delegate(root, selector, type, handler) {
  const listener = (event) => {
    // Text nodes have no closest(), so start from their parent element.
    const start = event.target instanceof Element ? event.target : event.target.parentElement;
    const match = start && start.closest(selector);
    if (match && root.contains(match)) handler(event, match);
  };
  root.addEventListener(type, listener);
  return () => root.removeEventListener(type, listener);
}`,
    explanation: `Delegation relies on bubbling. The event starts at the clicked node and travels up through its ancestors, so a single listener on \`root\` sees every click inside it. \`closest(selector)\` walks from the target up to the nearest match in one native call. This costs O(depth) per event and one listener in total, compared with one listener per row.

\`closest\` does not stop at \`root\`. It can keep climbing and match something outside the container, which is why the \`root.contains(match)\` check matters. Keeping a reference to the exact \`listener\` function is what makes \`removeEventListener\` work. Passing a new arrow function to remove it silently does nothing.

Common mistakes: using \`event.target.matches(selector)\`, which misses clicks on children such as the \`<span>\` inside a row; leaking listeners because unsubscribe was never wired up; and forgetting that some events don't bubble (\`focus\`, \`blur\`, \`mouseenter\`). For those, use \`focusin\`/\`focusout\` or register in the capture phase.

Follow-up: "How would you support \`focus\` events?" Pass \`{ capture: true }\` to \`addEventListener\` and remember to pass the same flag when removing it.`,
  },
  {
    id: "fe-classnames",
    title: "classNames utility",
    track: "Frontend",
    level: "Easy",
    minutes: 15,
    tags: ["utilities", "recursion"],
    prompt: `Component code is full of string concatenation like \`"btn" + (primary ? " btn-primary" : "")\`. Write the classic helper that libraries like \`clsx\` provide.

\`classNames(...args)\` returns a single space-separated class string. Each argument can be:

- a **string** or **number**: included as is (except \`""\` and \`0\`),
- an **object**: each key is included when its value is truthy,
- an **array**: processed recursively with the same rules (arrays can nest),
- anything falsy (\`false\`, \`null\`, \`undefined\`, \`0\`, \`""\`): skipped.

There are no leading, trailing or double spaces. You don't need to remove duplicates.

\`\`\`js
classNames("btn", { "btn-primary": true, disabled: false }); // "btn btn-primary"
classNames("a", ["b", ["c", { d: 1 }]], null, 0);            // "a b c d"
classNames();                                                 // ""
\`\`\``,
    starter: `function classNames(...args) {\n  // your code here\n}`,
    tests: `test("joins strings with single spaces", () => {
  expect(classNames("a", "b", "c")).toBe("a b c");
});
test("includes object keys with truthy values", () => {
  expect(classNames({ a: true, b: false, c: 1, d: 0, e: "yes", f: null })).toBe("a c e");
});
test("skips falsy arguments", () => {
  expect(classNames("a", false, null, undefined, 0, "", "b")).toBe("a b");
});
test("flattens nested arrays", () => {
  expect(classNames("a", ["b", ["c", { d: true }], []])).toBe("a b c d");
});
test("includes non-zero numbers", () => {
  expect(classNames("col", 1, 12)).toBe("col 1 12");
});
test("returns an empty string with no usable input", () => {
  expect(classNames()).toBe("");
  expect(classNames(null, [], {}, [[]], { a: false })).toBe("");
});
test("never produces stray spaces from empty arrays or objects", () => {
  expect(classNames("a", [], {}, "b")).toBe("a b");
  expect(classNames([], "a")).toBe("a");
});
test("handles a realistic button", () => {
  const size = "lg";
  expect(classNames("btn", "btn-" + size, { "btn-loading": true, "btn-block": false }, ["focus-ring"])).toBe("btn btn-lg btn-loading focus-ring");
});`,
    hints: [
      "Collect the pieces into an array and join with a space at the end. That way you never have to think about where spaces go.",
      "Loop over the arguments. Skip falsy ones. Push strings and numbers. For an array, call classNames on its contents. For an object, push the keys whose values are truthy.",
      "For arrays: const inner = classNames(...arg); if (inner) out.push(inner). The `if (inner)` keeps empty arrays from adding an empty string that would turn into a double space.",
    ],
    solution: `function classNames(...args) {
  const out = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "string" || typeof arg === "number") {
      out.push(String(arg));
    } else if (Array.isArray(arg)) {
      const inner = classNames(...arg);
      if (inner) out.push(inner);
    } else if (typeof arg === "object") {
      for (const key of Object.keys(arg)) if (arg[key]) out.push(key);
    }
  }
  return out.join(" ");
}`,
    explanation: `Collecting the parts into an array and joining once means you never have to place separators by hand, which is where stray spaces come from. Recursing into arrays handles any depth of nesting. A single falsy check up front skips \`false\`, \`null\`, \`0\` and \`""\` together.

The one subtle part is empty arrays and objects. If you push the result of a nested call that returned \`""\`, the join produces a double space. Check the result before pushing.

It runs in O(total number of entries) time. Common mistakes: testing \`typeof arg === "object"\` before \`Array.isArray\` (arrays are objects too, so their indexes become class names), and using \`for...in\` on objects, which also picks up inherited keys.

Follow-up: "How would you de-duplicate and handle \`{ a: true }\` followed by \`{ a: false }\`?" Build a \`Map\` from class to boolean as you go, so a later entry overrides an earlier one, then emit the keys that are true.`,
  },
  {
    id: "fe-create-element",
    title: "h() and render to the DOM",
    track: "Frontend",
    level: "Medium",
    minutes: 30,
    tags: ["dom", "virtual-dom", "jsx"],
    prompt: `JSX compiles to calls like \`h("button", { className: "btn", onClick }, "Save")\`. Build the two pieces underneath it.

**\`h(type, props, ...children)\`** returns a plain virtual node:

- \`{ type, props, children }\`, where \`props\` is \`{}\` when \`null\` or \`undefined\` is passed.
- \`children\` is flattened (nested arrays at any depth), with \`null\`, \`undefined\`, \`true\` and \`false\` removed and numbers turned into strings. Child vnodes stay as objects.

**\`render(vnode, container)\`** turns a vnode into real DOM, appends it to \`container\` and returns the created node:

- A string vnode becomes a text node, never parsed as HTML.
- \`className\` sets the \`class\` attribute.
- \`style\` is an object of camelCase properties applied to \`el.style\`.
- Props starting with \`on\` whose value is a function become event listeners: \`onClick\` listens for \`click\`.
- \`true\` sets an empty attribute (\`disabled=""\`). \`false\`, \`null\` and \`undefined\` are skipped. Anything else is set with \`setAttribute\`.

\`\`\`js
const vnode = h("ul", { id: "list" }, [1, 2].map((n) => h("li", null, "Item ", n)));
// { type: "ul", props: { id: "list" }, children: [
//   { type: "li", props: {}, children: ["Item ", "1"] }, ... ] }
render(vnode, document.body); // <ul id="list"><li>Item 1</li><li>Item 2</li></ul>
\`\`\``,
    starter: `function h(type, props, ...children) {\n  // your code here\n}\n\nfunction render(vnode, container) {\n  // your code here\n}`,
    tests: `test("h returns a vnode with empty props when none are given", () => {
  expect(h("div", null)).toEqual({ type: "div", props: {}, children: [] });
  expect(h("span", undefined, "x")).toEqual({ type: "span", props: {}, children: ["x"] });
});
test("h flattens nested children arrays", () => {
  const v = h("ul", null, [h("li", null, "a"), [h("li", null, "b")]], "c");
  expect(v.children).toHaveLength(3);
  expect(v.children[1]).toEqual({ type: "li", props: {}, children: ["b"] });
  expect(v.children[2]).toBe("c");
});
test("h drops booleans and nullish children and stringifies numbers", () => {
  const v = h("p", null, "n=", 0, null, false, true, undefined, 42);
  expect(v.children).toEqual(["n=", "0", "42"]);
});
test("render creates elements and text and appends them", () => {
  const container = document.createElement("div");
  const node = render(h("ul", { id: "list" }, [1, 2].map((n) => h("li", null, "Item ", n))), container);
  expect(container.firstChild).toBe(node);
  expect(node.tagName).toBe("UL");
  expect(node.id).toBe("list");
  expect(Array.from(node.children, (li) => li.textContent)).toEqual(["Item 1", "Item 2"]);
});
test("render sets className and plain attributes", () => {
  const node = render(h("a", { className: "link primary", href: "/home", "data-track": "nav", "aria-label": "Home" }), document.body);
  expect(node.getAttribute("class")).toBe("link primary");
  expect(node.getAttribute("href")).toBe("/home");
  expect(node.dataset.track).toBe("nav");
  expect(node.getAttribute("aria-label")).toBe("Home");
  expect(node.hasAttribute("className")).toBe(false);
});
test("render applies style objects", () => {
  const node = render(h("div", { style: { backgroundColor: "red", marginTop: "4px" } }), document.body);
  expect(node.style.backgroundColor).toBe("red");
  expect(node.style.marginTop).toBe("4px");
});
test("render wires on* props as event listeners", () => {
  let clicks = 0;
  const node = render(h("button", { onClick: () => clicks++ }, "Go"), document.body);
  node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(clicks).toBe(2);
  expect(node.hasAttribute("onClick")).toBe(false);
});
test("render handles boolean attributes", () => {
  const a = render(h("input", { disabled: true, required: false, placeholder: null }), document.body);
  expect(a.hasAttribute("disabled")).toBe(true);
  expect(a.hasAttribute("required")).toBe(false);
  expect(a.hasAttribute("placeholder")).toBe(false);
});
test("render never parses text children as HTML", () => {
  const node = render(h("p", null, "<b>hi</b>"), document.body);
  expect(node.querySelector("b")).toBeNull();
  expect(node.textContent).toBe("<b>hi</b>");
});`,
    hints: [
      "Treat the two halves separately. h() is pure data shaping: flatten, filter, convert. render() is a recursive walk that turns each vnode into one DOM node.",
      "In h, children.flat(Infinity) flattens everything. Then filter out null, undefined, true and false, and map numbers to strings. In render, write a createNode(vnode) helper: strings become document.createTextNode, objects become createElement plus props plus recursively created children.",
      "Props loop: if key starts with 'on' and value is a function, addEventListener(key.slice(2).toLowerCase(), value); else if key === 'className', set el.className; else if key === 'style', Object.assign(el.style, value); else if value === true, setAttribute(key, ''); else if value is not false or null, setAttribute(key, String(value)).",
    ],
    solution: `function h(type, props, ...children) {
  const flat = children
    .flat(Infinity)
    .filter((c) => c != null && c !== false && c !== true)
    .map((c) => (typeof c === "object" ? c : String(c)));
  return { type, props: props || {}, children: flat };
}

function createNode(vnode) {
  if (typeof vnode === "string") return document.createTextNode(vnode);
  const el = document.createElement(vnode.type);
  for (const [key, value] of Object.entries(vnode.props)) {
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "className") {
      el.className = value;
    } else if (key === "style" && value && typeof value === "object") {
      Object.assign(el.style, value);
    } else if (value === true) {
      el.setAttribute(key, "");
    } else if (value !== false && value != null) {
      el.setAttribute(key, String(value));
    }
  }
  for (const child of vnode.children) el.appendChild(createNode(child));
  return el;
}

function render(vnode, container) {
  const node = createNode(vnode);
  container.appendChild(node);
  return node;
}`,
    explanation: `\`h\` normalizes children once, at creation time, so everything downstream can assume a flat array of strings and vnodes. This mirrors what React does with \`null\` and \`false\` children: it is what makes \`{cond && <Thing />}\` safe to write.

\`render\` is a depth-first recursion with one DOM node per vnode, so it runs in O(n) for n vnodes. Text goes through \`createTextNode\`, which is why JSX output is safe from XSS by default.

Common mistakes: calling \`setAttribute("className", ...)\` (the HTML attribute is \`class\`), setting \`style\` to the string \`"[object Object]"\`, and flattening only one level. Note that \`0\` must survive as \`"0"\`. Filtering with a plain truthiness check drops it.

Follow-up: "How would you support function components?" If \`vnode.type\` is a function, call it with \`{ ...props, children }\` and render whatever it returns. A follow-up after that is how you would update the tree without rebuilding it, which is the diff/patch problem.`,
  },
  {
    id: "fe-vdom-patch",
    title: "Virtual DOM diff and patch",
    track: "Frontend",
    level: "Hard",
    minutes: 50,
    tags: ["virtual-dom", "dom", "reconciliation"],
    prompt: `Rebuilding the whole DOM on every state change loses focus, scroll position and input state. Write a small reconciler that patches the real DOM in place.

A vnode is either a **string** (a text node) or \`{ type, props, children }\` where \`children\` is an array of vnodes. Prop rules: \`className\` sets the class, \`style\` is an object of camelCase properties, \`onX\` functions are event listeners for \`x\`, \`true\` sets an empty attribute, \`false\`/\`null\`/\`undefined\` mean no attribute, and anything else is set with \`setAttribute\`.

Write two functions:

- \`mount(vnode, container)\`: creates the DOM for \`vnode\`, appends it to \`container\` and returns the node.
- \`patch(oldVNode, newVNode, dom)\`: \`dom\` is the node that was created for \`oldVNode\`. Update the DOM to match \`newVNode\` and return the resulting node.

Patch rules:

1. Two strings: update the text node's value only if it changed. Keep the same text node.
2. Different \`type\`, or a string on one side and an element on the other: create a new node, \`replaceWith\` it, and return it.
3. Same \`type\`: keep the element. Remove props that disappeared, set props that changed, swap event listeners (the old handler must stop firing), and remove style keys that are gone.
4. Children are matched **by index**: patch the shared ones, append new ones, remove extra ones.

**Scope:** no keys and no components. Reordering by key is a common follow-up, not part of this task. Patching an identical tree must make **zero** DOM mutations (the tests check this with a \`MutationObserver\`).

\`\`\`js
const a = { type: "p", props: { className: "msg" }, children: ["Hello"] };
const dom = mount(a, document.body);
patch(a, { type: "p", props: { className: "msg on" }, children: ["Hi"] }, dom);
// same <p> and same text node, now class="msg on" with text "Hi"
\`\`\``,
    starter: `function mount(vnode, container) {\n  // your code here\n}\n\nfunction patch(oldVNode, newVNode, dom) {\n  // your code here\n}`,
    tests: `function __v(type, props, ...children) {
  return { type, props: props || {}, children };
}
function __box() {
  const c = document.createElement("div");
  document.body.append(c);
  return c;
}
test("mount builds the DOM and appends it", () => {
  const c = __box();
  const dom = mount(__v("ul", { id: "l" }, __v("li", { className: "a" }, "one"), __v("li", null, "two")), c);
  expect(c.firstChild).toBe(dom);
  expect(dom.id).toBe("l");
  expect(dom.children[0].className).toBe("a");
  expect(dom.textContent).toBe("onetwo");
});
test("updates text in place, keeping the same nodes", () => {
  const c = __box();
  const old = __v("p", null, "Hello");
  const dom = mount(old, c);
  const text = dom.firstChild;
  const out = patch(old, __v("p", null, "Hi"), dom);
  expect(out).toBe(dom);
  expect(dom.firstChild).toBe(text);
  expect(text.nodeValue).toBe("Hi");
});
test("adds, changes and removes attributes on the same element", () => {
  const c = __box();
  const old = __v("input", { type: "text", placeholder: "Name", disabled: true });
  const dom = mount(old, c);
  const out = patch(old, __v("input", { type: "email", "aria-label": "Email" }), dom);
  expect(out).toBe(dom);
  expect(dom.getAttribute("type")).toBe("email");
  expect(dom.getAttribute("aria-label")).toBe("Email");
  expect(dom.hasAttribute("placeholder")).toBe(false);
  expect(dom.hasAttribute("disabled")).toBe(false);
});
test("replaces the node when the type changes", () => {
  const c = __box();
  const old = __v("div", null, "x");
  const dom = mount(old, c);
  const out = patch(old, __v("section", { id: "s" }, "x"), dom);
  expect(out.tagName).toBe("SECTION");
  expect(c.firstChild).toBe(out);
  expect(c.children).toHaveLength(1);
});
test("appends new children and removes extra ones, keeping shared nodes", () => {
  const c = __box();
  const list = (...items) => __v("ul", null, ...items.map((t) => __v("li", null, t)));
  const v1 = list("a", "b", "c");
  const dom = mount(v1, c);
  const firstLi = dom.children[0];
  const v2 = list("a", "b");
  patch(v1, v2, dom);
  expect(Array.from(dom.children, (li) => li.textContent)).toEqual(["a", "b"]);
  const v3 = list("a", "B", "c", "d");
  patch(v2, v3, dom);
  expect(Array.from(dom.children, (li) => li.textContent)).toEqual(["a", "B", "c", "d"]);
  expect(dom.children[0]).toBe(firstLi);
});
test("swaps event listeners so the old handler stops firing", () => {
  const c = __box();
  const log = [];
  const old = __v("button", { onClick: () => log.push("old") }, "Go");
  const dom = mount(old, c);
  const next = __v("button", { onClick: () => log.push("new") }, "Go");
  patch(old, next, dom);
  dom.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  patch(next, __v("button", null, "Go"), dom);
  dom.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(log).toEqual(["new"]);
});
test("updates className and style, removing old style keys", () => {
  const c = __box();
  const old = __v("div", { className: "a", style: { color: "red", marginTop: "4px" } });
  const dom = mount(old, c);
  patch(old, __v("div", { className: "a b", style: { color: "blue" } }), dom);
  expect(dom.className).toBe("a b");
  expect(dom.style.color).toBe("blue");
  expect(dom.style.marginTop).toBe("");
});
test("replaces a text child with an element child and back", () => {
  const c = __box();
  const v1 = __v("div", null, "plain");
  const dom = mount(v1, c);
  const v2 = __v("div", null, __v("strong", null, "bold"));
  patch(v1, v2, dom);
  expect(dom.firstChild.tagName).toBe("STRONG");
  patch(v2, __v("div", null, "plain again"), dom);
  expect(dom.firstChild.nodeType).toBe(3);
  expect(dom.textContent).toBe("plain again");
});
test("patching an identical tree makes no DOM mutations", () => {
  const c = __box();
  const tree = () => __v("div", { id: "x", className: "box", style: { color: "red" }, hidden: false }, __v("p", { title: "t" }, "hi"), "tail");
  const old = tree();
  const dom = mount(old, c);
  const obs = new MutationObserver(() => {});
  obs.observe(c, { subtree: true, childList: true, attributes: true, characterData: true });
  const out = patch(old, tree(), dom);
  const records = obs.takeRecords();
  obs.disconnect();
  expect(out).toBe(dom);
  expect(records).toHaveLength(0);
});`,
    hints: [
      "There are only three situations: both text, different kinds of node (replace), or same element type (update props, then recurse into children). Write those three branches first.",
      "Write one setProp(el, key, newValue, oldValue) that handles every prop kind, including removal when newValue is undefined. Then props diffing is two loops: keys in old but not in new (remove), and keys whose value changed (set). Only touch the DOM when something actually differs.",
      "For children, snapshot dom.childNodes into an array first. Patch indexes 0..min-1 recursively, append createNode(newChildren[i]) for the extras, and remove leftover nodes from the end. For style, compare old and new objects key by key: set changed keys and set removed keys to ''.",
    ],
    solution: `function setProp(el, key, value, oldValue) {
  if (key.startsWith("on")) {
    const type = key.slice(2).toLowerCase();
    if (typeof oldValue === "function") el.removeEventListener(type, oldValue);
    if (typeof value === "function") el.addEventListener(type, value);
  } else if (key === "style") {
    const prev = oldValue || {};
    const next = value || {};
    for (const k of Object.keys(prev)) if (!(k in next)) el.style[k] = "";
    for (const k of Object.keys(next)) if (prev[k] !== next[k]) el.style[k] = next[k];
  } else if (value == null || value === false) {
    el.removeAttribute(key === "className" ? "class" : key);
  } else if (key === "className") {
    el.className = value;
  } else {
    el.setAttribute(key, value === true ? "" : String(value));
  }
}

function updateProps(el, oldProps, newProps) {
  for (const key of Object.keys(oldProps)) {
    if (!(key in newProps)) setProp(el, key, undefined, oldProps[key]);
  }
  for (const key of Object.keys(newProps)) {
    // style objects are compared key by key inside setProp
    if (key === "style" || oldProps[key] !== newProps[key]) setProp(el, key, newProps[key], oldProps[key]);
  }
}

function createNode(vnode) {
  if (typeof vnode === "string") return document.createTextNode(vnode);
  const el = document.createElement(vnode.type);
  updateProps(el, {}, vnode.props || {});
  for (const child of vnode.children || []) el.appendChild(createNode(child));
  return el;
}

function mount(vnode, container) {
  const node = createNode(vnode);
  if (container) container.appendChild(node);
  return node;
}

function patch(oldVNode, newVNode, dom) {
  const oldIsText = typeof oldVNode === "string";
  const newIsText = typeof newVNode === "string";

  if (oldIsText && newIsText) {
    if (oldVNode !== newVNode) dom.nodeValue = newVNode;
    return dom;
  }
  if (oldIsText || newIsText || oldVNode.type !== newVNode.type) {
    const node = createNode(newVNode);
    dom.replaceWith(node);
    return node;
  }

  updateProps(dom, oldVNode.props || {}, newVNode.props || {});

  const oldChildren = oldVNode.children || [];
  const newChildren = newVNode.children || [];
  const nodes = Array.from(dom.childNodes); // snapshot before we mutate
  const shared = Math.min(oldChildren.length, newChildren.length);
  for (let i = 0; i < shared; i++) patch(oldChildren[i], newChildren[i], nodes[i]);
  for (let i = shared; i < newChildren.length; i++) dom.appendChild(createNode(newChildren[i]));
  for (let i = oldChildren.length - 1; i >= shared; i--) nodes[i].remove();
  return dom;
}`,
    explanation: `The reconciler compares two cheap JavaScript trees and touches the expensive DOM only where they differ. The three-way split (text/text, kind changed, same element) covers every case. Index-based child matching makes it O(n) in the size of the tree, which is the same trade-off React makes before keys come in.

Using the old vnode as the source of truth for the DOM is what makes the diff cheap. You never read back from the DOM, you compare \`oldProps\` with \`newProps\`. It is also why listener swapping works: the old handler reference is still sitting in \`oldProps\`, so you can pass it to \`removeEventListener\`.

The zero-mutation test catches a common shortcut: calling \`setAttribute\` for every prop every time. Each call queues a mutation record and can trigger style recalculation, even when the value is the same. Other classic bugs: indexing into the live \`childNodes\` list while removing nodes (the indexes shift under you), forgetting to clear removed style keys, and replacing nodes whose type didn't change, which loses focus and input state.

Follow-up: "Add keyed children." Build a map from key to old index. For each new child, reuse the old node with the same key and move it with \`insertBefore\`. Use the longest increasing subsequence of old indexes to minimise moves, as Vue 3 and Inferno do.`,
  },
  {
    id: "fe-template-render",
    title: "Mustache-style templates",
    track: "Frontend",
    level: "Hard",
    minutes: 45,
    tags: ["parsing", "templates", "security"],
    prompt: `Your email builder lets marketers write templates. Implement a small subset of Mustache.

\`renderTemplate(template, data)\` returns a string. Supported tags:

- \`{{name}}\`: the value, **HTML-escaped** (\`& < > " '\` become \`&amp; &lt; &gt; &quot; &#39;\`).
- \`{{{name}}}\`: the value, raw (not escaped).
- Dotted paths: \`{{user.name}}\`. \`{{.}}\` means the current context itself.
- Sections \`{{#key}}...{{/key}}\`: if the value is a non-empty array, render the body once per item with the item as the context. If it is another truthy value, render once. When that value is an object it becomes the context, otherwise the context stays the same. Falsy values and empty arrays render nothing.
- Inverted sections \`{{^key}}...{{/key}}\`: render the body only when the value is falsy or an empty array.
- Inside a section, a name not found on the current context is looked up on the parent contexts, all the way out to \`data\`.
- Missing values and \`null\` render as an empty string. Whitespace inside tags is allowed (\`{{ name }}\`).
- Sections can be nested. A closing tag that doesn't match the open section, or a section left unclosed, throws an \`Error\`.

\`\`\`js
renderTemplate("Hi {{name}}!", { name: "<Ada>" });          // "Hi &lt;Ada&gt;!"
renderTemplate("{{#items}}<li>{{.}}</li>{{/items}}", { items: ["a", "b"] });
// "<li>a</li><li>b</li>"
renderTemplate("{{^items}}No results{{/items}}", { items: [] }); // "No results"
\`\`\``,
    starter: `function renderTemplate(template, data) {\n  // your code here\n}`,
    tests: `test("interpolates and escapes variables", () => {
  expect(renderTemplate("Hi {{name}}!", { name: "<Ada & \\"Bob\\">'" })).toBe("Hi &lt;Ada &amp; &quot;Bob&quot;&gt;&#39;!");
});
test("triple braces output raw HTML", () => {
  expect(renderTemplate("<p>{{{body}}}</p>", { body: "<b>bold</b>" })).toBe("<p><b>bold</b></p>");
});
test("supports dotted paths and whitespace inside tags", () => {
  expect(renderTemplate("{{ user.name }} ({{user.address.city}})", { user: { name: "Ada", address: { city: "London" } } })).toBe("Ada (London)");
});
test("renders missing and null values as empty strings, but keeps 0", () => {
  expect(renderTemplate("[{{a}}][{{b.c.d}}][{{n}}][{{z}}]", { n: null, z: 0 })).toBe("[][][][0]");
});
test("repeats sections for arrays using the item as context", () => {
  const t = "<ul>{{#items}}<li>{{name}}: {{.price}}</li>{{/items}}</ul>";
  expect(renderTemplate("{{#tags}}[{{.}}]{{/tags}}", { tags: ["a", "<b>"] })).toBe("[a][&lt;b&gt;]");
  expect(renderTemplate("{{#items}}<li>{{name}}</li>{{/items}}", { items: [{ name: "x" }, { name: "y" }] })).toBe("<li>x</li><li>y</li>");
});
test("looks up names on parent contexts inside sections", () => {
  const t = "{{#items}}{{name}} by {{author}}; {{/items}}";
  expect(renderTemplate(t, { author: "Ada", items: [{ name: "A" }, { name: "B", author: "Bob" }] })).toBe("A by Ada; B by Bob; ");
});
test("handles truthy, falsy and object sections", () => {
  const t = "{{#admin}}[admin]{{/admin}}{{#user}}{{name}}{{/user}}{{#missing}}never{{/missing}}{{#empty}}never{{/empty}}";
  expect(renderTemplate(t, { admin: true, user: { name: "Ada" }, empty: [] })).toBe("[admin]Ada");
});
test("renders inverted sections for falsy values and empty arrays", () => {
  const t = "{{^items}}No results{{/items}}{{^ok}}!{{/ok}}{{^present}}hidden{{/present}}";
  expect(renderTemplate(t, { items: [], ok: false, present: 1 })).toBe("No results!");
});
test("supports nested sections", () => {
  const t = "{{#groups}}{{title}}:{{#people}} {{.}}{{/people}}{{^people}} none{{/people}}|{{/groups}}";
  const data = { groups: [{ title: "A", people: ["x", "y"] }, { title: "B", people: [] }] };
  expect(renderTemplate(t, data)).toBe("A: x y|B: none|");
});
test("throws on mismatched or unclosed sections", () => {
  expect(() => renderTemplate("{{#a}}x{{/b}}", {})).toThrow();
  expect(() => renderTemplate("{{#a}}x", {})).toThrow();
  expect(() => renderTemplate("x{{/a}}", {})).toThrow();
});`,
    hints: [
      "Doing this with a single regex replace falls apart on nested sections. Split the work in two: parse the template into a tree, then render the tree.",
      "Scan for '{{' with indexOf. Text before it becomes a text node. Check for '{{{' (raw) and find the matching closing braces. Keep a stack of open sections: '#' and '^' push a new node, '/' pops and checks the name. Rendering takes a stack of contexts: lookup walks it from the innermost context outward and returns the first context that has the first path segment.",
      "Render a section by looking up its value. If it is empty (falsy, or an array of length 0), render nothing for '#' and the body for '^'. If it is an array, render the body once per item with [...stack, item]. If it is an object, render once with [...stack, value]. Otherwise render once with the same stack.",
    ],
    solution: `function escapeHtml(s) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return s.replace(/[&<>"']/g, (ch) => map[ch]);
}

function parseTemplate(template) {
  const root = { children: [] };
  const stack = [root];
  let i = 0;
  while (i < template.length) {
    const open = template.indexOf("{{", i);
    const current = stack[stack.length - 1].children;
    if (open === -1) {
      current.push({ type: "text", value: template.slice(i) });
      break;
    }
    if (open > i) current.push({ type: "text", value: template.slice(i, open) });
    const raw = template.startsWith("{{{", open);
    const closer = raw ? "}}}" : "}}";
    const close = template.indexOf(closer, open + closer.length);
    if (close === -1) throw new Error("Unclosed tag at " + open);
    const tag = template.slice(open + closer.length, close).trim();
    i = close + closer.length;

    if (raw) {
      current.push({ type: "raw", name: tag });
    } else if (tag[0] === "#" || tag[0] === "^") {
      const node = { type: tag[0] === "#" ? "section" : "inverted", name: tag.slice(1).trim(), children: [] };
      current.push(node);
      stack.push(node);
    } else if (tag[0] === "/") {
      const name = tag.slice(1).trim();
      const top = stack.pop();
      if (stack.length === 0 || top.name !== name) throw new Error("Unexpected closing tag: " + name);
    } else {
      current.push({ type: "var", name: tag });
    }
  }
  if (stack.length > 1) throw new Error("Unclosed section: " + stack[stack.length - 1].name);
  return root.children;
}

function lookup(contexts, name) {
  if (name === ".") return contexts[contexts.length - 1];
  const [head, ...rest] = name.split(".");
  for (let i = contexts.length - 1; i >= 0; i--) {
    const ctx = contexts[i];
    if (ctx != null && typeof ctx === "object" && head in ctx) {
      return rest.reduce((value, key) => (value == null ? undefined : value[key]), ctx[head]);
    }
  }
  return undefined;
}

function renderNodes(nodes, contexts) {
  let out = "";
  for (const node of nodes) {
    if (node.type === "text") {
      out += node.value;
    } else if (node.type === "var" || node.type === "raw") {
      const value = lookup(contexts, node.name);
      const s = value == null ? "" : String(value);
      out += node.type === "var" ? escapeHtml(s) : s;
    } else {
      const value = lookup(contexts, node.name);
      const empty = !value || (Array.isArray(value) && value.length === 0);
      if (node.type === "inverted") {
        if (empty) out += renderNodes(node.children, contexts);
      } else if (!empty) {
        if (Array.isArray(value)) {
          for (const item of value) out += renderNodes(node.children, [...contexts, item]);
        } else {
          out += renderNodes(node.children, typeof value === "object" ? [...contexts, value] : contexts);
        }
      }
    }
  }
  return out;
}

function renderTemplate(template, data) {
  return renderNodes(parseTemplate(template), [data]);
}`,
    explanation: `Separating parsing from rendering is the key decision. The parser is a linear scan with a stack of open sections, so nesting and error reporting come almost for free: a closing tag must match whatever is on top of the stack. The renderer is a recursive walk that carries a **context stack**, and that stack is what makes parent lookups work. Both passes are O(template length + output length).

Escaping by default and requiring triple braces for raw output is the secure choice. It means a forgotten tag fails safe. Escape \`&\` too, or the browser will decode entities a user typed, such as \`&lt;\`, back into the characters they stand for.

Common mistakes: regex-based section matching (\`{{#a}}...{{/a}}\` with a lazy \`.*?\` breaks as soon as sections with the same name nest), treating \`0\` as missing when interpolating (it should print \`0\`, only \`null\`/\`undefined\` are empty), and looking up only on the innermost context.

Follow-up: "Templates are rendered thousands of times. How would you speed this up?" Cache the parsed tree per template string, or compile it once into a JavaScript function, which is what Handlebars does.`,
  },
  {
    id: "fe-form-validation",
    title: "Form validation engine",
    track: "Frontend",
    level: "Medium",
    minutes: 30,
    tags: ["forms", "validation"],
    prompt: `Every form in your app hand-rolls its validation. Write a small declarative engine.

\`validate(values, rules)\` returns an object mapping each **failing** field to its **first** error message. Valid fields are left out, so a valid form returns \`{}\`.

\`rules\` maps a field name to an ordered array of rule objects. Supported rules, with their default messages:

- \`{ type: "required" }\` → \`"Required"\`. A value is **empty** when it is \`undefined\`, \`null\`, a string that is empty after trimming, or an empty array.
- \`{ type: "minLength", value: n }\` → \`"Must be at least n characters"\`
- \`{ type: "maxLength", value: n }\` → \`"Must be at most n characters"\`
- \`{ type: "pattern", value: regex }\` → \`"Invalid format"\`
- \`{ type: "min", value: n }\` / \`{ type: "max", value: n }\` compare \`Number(value)\` → \`"Must be at least n"\` / \`"Must be at most n"\`
- \`{ type: "matches", field: "other" }\` → \`"Must match other"\` (strict equality with \`values[other]\`)
- \`{ type: "custom", test: (value, values) => boolean }\` → \`"Invalid"\`

A rule's own \`message\` overrides the default. Every rule except \`required\` **passes when the value is empty**, so optional fields only get checked once they have something in them. An unknown rule type throws \`Error("Unknown rule: <type>")\`.

\`\`\`js
validate(
  { email: "ada@", password: "short", confirm: "shorts" },
  {
    email: [{ type: "required" }, { type: "pattern", value: /^\\S+@\\S+\\.\\S+$/, message: "Enter a valid email" }],
    password: [{ type: "required" }, { type: "minLength", value: 8 }],
    confirm: [{ type: "matches", field: "password", message: "Passwords must match" }],
  }
);
// { email: "Enter a valid email", password: "Must be at least 8 characters", confirm: "Passwords must match" }
\`\`\``,
    starter: `function validate(values, rules) {\n  // your code here\n}`,
    tests: `const emailRule = { type: "pattern", value: /^[^@ ]+@[^@ ]+[.][^@ ]+$/, message: "Enter a valid email" };
test("returns {} when every field is valid", () => {
  const rules = { name: [{ type: "required" }], email: [{ type: "required" }, emailRule] };
  expect(validate({ name: "Ada", email: "ada@example.com" }, rules)).toEqual({});
});
test("required treats undefined, null, whitespace and [] as empty", () => {
  const r = [{ type: "required" }];
  expect(validate({ b: null, c: "   ", d: [] }, { a: r, b: r, c: r, d: r, e: r })).toEqual({ a: "Required", b: "Required", c: "Required", d: "Required", e: "Required" });
  expect(validate({ a: 0, b: false, c: ["x"] }, { a: r, b: r, c: r })).toEqual({});
});
test("reports only the first failing rule per field", () => {
  const rules = { pw: [{ type: "minLength", value: 8 }, { type: "pattern", value: /[0-9]/, message: "Needs a digit" }] };
  expect(validate({ pw: "abc" }, rules)).toEqual({ pw: "Must be at least 8 characters" });
  expect(validate({ pw: "abcdefgh" }, rules)).toEqual({ pw: "Needs a digit" });
});
test("skips non-required rules when the value is empty", () => {
  const rules = { website: [{ type: "pattern", value: /^https:/ }, { type: "minLength", value: 10 }], age: [{ type: "min", value: 18 }] };
  expect(validate({ website: "", age: "" }, rules)).toEqual({});
  expect(validate({ website: "http://x" }, rules)).toEqual({ website: "Invalid format" });
});
test("uses default messages for length, min and max", () => {
  const rules = { bio: [{ type: "maxLength", value: 5 }], age: [{ type: "min", value: 18 }, { type: "max", value: 120 }], qty: [{ type: "max", value: 10 }] };
  expect(validate({ bio: "too long", age: "17", qty: 11 }, rules)).toEqual({ bio: "Must be at most 5 characters", age: "Must be at least 18", qty: "Must be at most 10" });
});
test("min and max compare numerically, not as strings", () => {
  const rules = { n: [{ type: "min", value: 9 }] };
  expect(validate({ n: "10" }, rules)).toEqual({});
  expect(validate({ n: "8" }, rules)).toEqual({ n: "Must be at least 9" });
});
test("matches compares against another field", () => {
  const rules = { confirm: [{ type: "matches", field: "password" }] };
  expect(validate({ password: "hunter22", confirm: "hunter2" }, rules)).toEqual({ confirm: "Must match password" });
  expect(validate({ password: "hunter22", confirm: "hunter22" }, rules)).toEqual({});
});
test("custom rules receive the value and all values, and can override messages", () => {
  let seen = null;
  const rules = { end: [{ type: "custom", test: (v, all) => { seen = all; return v > all.start; }, message: "End must be after start" }], x: [{ type: "custom", test: () => false }] };
  const values = { start: 5, end: 3, x: "y" };
  expect(validate(values, rules)).toEqual({ end: "End must be after start", x: "Invalid" });
  expect(seen).toBe(values);
});
test("throws on unknown rule types", () => {
  expect(() => validate({ a: "x" }, { a: [{ type: "email" }] })).toThrow("Unknown rule: email");
});`,
    hints: [
      "Each rule type is just a test function plus a default message. Put them in a lookup table and the main loop becomes tiny.",
      "For each field, loop over its rules in order. Look up the rule's definition (throw if missing). If the type isn't required and the value is empty, skip it. If the test fails, record rule.message or the default message and break out of that field's loop.",
      "const RULES = { required: { test: (v) => !isEmpty(v), message: () => 'Required' }, minLength: { test: (v, r) => v.length >= r.value, message: (r) => 'Must be at least ' + r.value + ' characters' }, ... matches: { test: (v, r, all) => v === all[r.field], ... } }.",
    ],
    solution: `function isEmpty(value) {
  return (
    value == null ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

const RULES = {
  required: { test: (v) => !isEmpty(v), message: () => "Required" },
  minLength: { test: (v, r) => v.length >= r.value, message: (r) => "Must be at least " + r.value + " characters" },
  maxLength: { test: (v, r) => v.length <= r.value, message: (r) => "Must be at most " + r.value + " characters" },
  pattern: { test: (v, r) => r.value.test(String(v)), message: () => "Invalid format" },
  min: { test: (v, r) => Number(v) >= r.value, message: (r) => "Must be at least " + r.value },
  max: { test: (v, r) => Number(v) <= r.value, message: (r) => "Must be at most " + r.value },
  matches: { test: (v, r, all) => v === all[r.field], message: (r) => "Must match " + r.field },
  custom: { test: (v, r, all) => r.test(v, all), message: () => "Invalid" },
};

function validate(values, rules) {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = values[field];
    for (const rule of fieldRules) {
      const def = RULES[rule.type];
      if (!def) throw new Error("Unknown rule: " + rule.type);
      if (rule.type !== "required" && isEmpty(value)) continue;
      if (!def.test(value, rule, values)) {
        errors[field] = rule.message || def.message(rule);
        break; // first error wins
      }
    }
  }
  return errors;
}`,
    explanation: `A table of \`{ test, message }\` definitions keeps the engine open for extension. Adding a rule is one line and the loop never changes. Stopping at the first failure per field matches how good forms behave: show one actionable message, not a wall of them.

The "skip empty unless required" rule is what makes optional fields work. Without it, an empty optional URL field would fail the pattern check. It also gives a clear separation: \`required\` answers "is anything there?" and every other rule answers "is what's there valid?".

Common mistakes: comparing \`"10" >= 9\` as strings (\`min\`/\`max\` should coerce to numbers), treating \`0\` or \`false\` as empty, and using a regex with the \`g\` flag, whose \`lastIndex\` makes \`.test\` alternate between true and false on repeated calls.

Follow-up: "How would you support async rules like 'username is taken'?" Make tests return promises, run the sync rules first, debounce the async ones per field, and ignore stale results by tagging each run with an incrementing id.`,
  },
  {
    id: "fe-serialize-form",
    title: "Serialize a form",
    track: "Frontend",
    level: "Medium",
    minutes: 25,
    tags: ["forms", "dom"],
    prompt: `You're submitting a settings form as JSON. \`new FormData(form)\` gets close, but it flattens everything to strings and loses unchecked checkboxes. Write your own.

\`serializeForm(form)\` returns a plain object built from \`form.elements\`:

- Skip elements with no \`name\`, disabled elements (including those inside a disabled \`<fieldset>\`), buttons (\`submit\`, \`reset\`, \`button\`, \`image\`) and \`file\` inputs.
- Text-like inputs, \`<textarea>\` and single \`<select>\` give their \`value\` as a string.
- A **lone checkbox** (the only checkbox with that name) gives \`true\` or \`false\`.
- A **group of checkboxes** sharing a name gives an array of the checked values (possibly \`[]\`).
- Radios give the checked value, or \`null\` if none is checked.
- \`<select multiple>\` gives an array of the selected values.
- Several non-checkbox fields sharing a name give an array of their values, in document order.
- A name ending in \`[]\` always gives an array, under the name without the brackets.

\`\`\`html
<form>
  <input name="title" value="Hello">
  <input type="checkbox" name="public" checked>
  <input type="checkbox" name="tags" value="a" checked>
  <input type="checkbox" name="tags" value="b">
  <input type="radio" name="size" value="s"><input type="radio" name="size" value="m" checked>
</form>
\`\`\`

\`\`\`js
serializeForm(form); // { title: "Hello", public: true, tags: ["a"], size: "m" }
\`\`\``,
    starter: `function serializeForm(form) {\n  // your code here\n}`,
    tests: `function makeForm(html) {
  document.body.innerHTML = "<form>" + html + "</form>";
  return document.querySelector("form");
}
test("reads text inputs, textareas and selects as strings", () => {
  const form = makeForm('<input name="title" value="Hello"><input type="email" name="email" value="a@b.co"><textarea name="bio">Hi\\nthere</textarea><select name="color"><option value="r">Red</option><option value="g" selected>Green</option></select><input type="number" name="n" value="3">');
  expect(serializeForm(form)).toEqual({ title: "Hello", email: "a@b.co", bio: "Hi\\nthere", color: "g", n: "3" });
});
test("skips unnamed, disabled, button and file fields", () => {
  const form = makeForm('<input value="no name"><input name="off" value="x" disabled><button name="go" value="1">Go</button><input type="submit" name="s" value="Save"><input type="file" name="f"><input name="keep" value="ok">');
  expect(serializeForm(form)).toEqual({ keep: "ok" });
});
test("skips fields inside a disabled fieldset", () => {
  const form = makeForm('<fieldset disabled><input name="a" value="1"></fieldset><fieldset><input name="b" value="2"></fieldset>');
  expect(serializeForm(form)).toEqual({ b: "2" });
});
test("a lone checkbox becomes a boolean", () => {
  const form = makeForm('<input type="checkbox" name="public" checked><input type="checkbox" name="beta" value="yes">');
  expect(serializeForm(form)).toEqual({ public: true, beta: false });
});
test("a checkbox group becomes an array of checked values", () => {
  const form = makeForm('<input type="checkbox" name="tags" value="a" checked><input type="checkbox" name="tags" value="b"><input type="checkbox" name="tags" value="c" checked><input type="checkbox" name="none" value="x"><input type="checkbox" name="none" value="y">');
  expect(serializeForm(form)).toEqual({ tags: ["a", "c"], none: [] });
});
test("radios give the checked value or null", () => {
  const form = makeForm('<input type="radio" name="size" value="s"><input type="radio" name="size" value="m" checked><input type="radio" name="plan" value="free"><input type="radio" name="plan" value="pro">');
  expect(serializeForm(form)).toEqual({ size: "m", plan: null });
});
test("multi-selects give an array of selected values", () => {
  const form = makeForm('<select name="days" multiple><option value="mon" selected>Mon</option><option value="tue">Tue</option><option value="wed" selected>Wed</option></select><select name="empty" multiple><option value="x">X</option></select>');
  expect(serializeForm(form)).toEqual({ days: ["mon", "wed"], empty: [] });
});
test("repeated names give arrays in document order", () => {
  const form = makeForm('<input name="email" value="a@x.co"><input name="other" value="1"><input name="email" value="b@x.co">');
  expect(serializeForm(form)).toEqual({ email: ["a@x.co", "b@x.co"], other: "1" });
});
test("names ending in [] are always arrays", () => {
  const form = makeForm('<input name="ids[]" value="7"><input type="checkbox" name="flags[]" value="x" checked>');
  expect(serializeForm(form)).toEqual({ ids: ["7"], flags: ["x"] });
});
test("reflects live values typed after load", () => {
  const form = makeForm('<input name="q" value="initial">');
  form.elements.q.value = "typed";
  expect(serializeForm(form)).toEqual({ q: "typed" });
});`,
    hints: [
      "Most of the rules depend on how many fields share a name, so you can't decide what to output one element at a time. Group elements by name first.",
      "Filter form.elements (skip unnamed, el.matches(':disabled'), button types, file inputs), then build a Map from name to element list. For each group, branch on the first element's type: radio, lone checkbox, or everything else collected into a values array.",
      "For the 'everything else' branch: checkboxes push value if checked, select-multiple pushes each selectedOptions value, others push el.value. Then output values as an array if the name ends in [], the group has more than one element, or the field is a multi-select or checkbox. Otherwise output values[0].",
    ],
    solution: `const SKIP_TYPES = new Set(["submit", "reset", "button", "image", "file"]);

function serializeForm(form) {
  const groups = new Map();
  for (const el of form.elements) {
    if (!el.name || SKIP_TYPES.has(el.type) || el.matches(":disabled")) continue;
    if (el.tagName === "FIELDSET" || el.tagName === "OUTPUT" || el.tagName === "OBJECT") continue;
    if (!groups.has(el.name)) groups.set(el.name, []);
    groups.get(el.name).push(el);
  }

  const out = {};
  for (const [rawName, els] of groups) {
    const forceArray = rawName.endsWith("[]");
    const name = forceArray ? rawName.slice(0, -2) : rawName;
    const first = els[0];

    if (first.type === "radio") {
      const checked = els.find((el) => el.checked);
      out[name] = checked ? checked.value : null;
      continue;
    }
    if (first.type === "checkbox" && els.length === 1 && !forceArray) {
      out[name] = first.checked;
      continue;
    }

    const values = [];
    for (const el of els) {
      if (el.type === "checkbox") {
        if (el.checked) values.push(el.value);
      } else if (el.type === "select-multiple") {
        values.push(...Array.from(el.selectedOptions, (o) => o.value));
      } else {
        values.push(el.value);
      }
    }
    const isList = forceArray || els.length > 1 || first.type === "select-multiple" || first.type === "checkbox";
    out[name] = isList ? values : values[0];
  }
  return out;
}`,
    explanation: `Grouping by name before deciding on a shape is what makes this work. A checkbox called \`tags\` means something different when it is alone than when it has siblings, and you can't know which until you've seen the whole form. A \`Map\` keeps document order. The whole thing is O(number of fields).

\`el.matches(":disabled")\` is the detail most people miss. A field inside \`<fieldset disabled>\` reports \`el.disabled === false\`, but the browser won't submit it, and the \`:disabled\` pseudo-class accounts for the fieldset. Reading \`el.value\` (not \`getAttribute("value")\`) returns what the user typed, not the initial markup.

Common mistakes: using \`FormData\`, which drops unchecked checkboxes so you can't tell "unchecked" from "missing"; reading \`select.value\` on a multi-select, which returns only the first selection; and treating buttons as data. A submit button's value is only sent when that specific button was clicked.

Follow-up: "Support nested names like \`address[city]\`." Parse the name into a path and write it with a \`setIn\`-style helper, which is the convention Rails and PHP use.`,
  },
  {
    id: "fe-roving-tabindex",
    title: "Roving tabindex listbox",
    track: "Frontend",
    level: "Medium",
    minutes: 30,
    tags: ["accessibility", "keyboard", "dom"],
    prompt: `A custom single-select listbox should be **one** Tab stop, with the arrow keys moving between options. This is the roving tabindex pattern from the WAI-ARIA Authoring Practices.

Write \`initListbox(listbox)\` for markup like:

\`\`\`html
<ul role="listbox" aria-label="Fruit">
  <li role="option">Apple</li>
  <li role="option" aria-selected="true">Banana</li>
  <li role="option" aria-disabled="true">Cherry</li>
  <li role="option">Date</li>
</ul>
\`\`\`

- On init, the option with \`aria-selected="true"\` (or the first enabled option) gets \`tabindex="0"\`. Every other option gets \`tabindex="-1"\`.
- Selection follows focus. The active option has \`aria-selected="true"\`, all others \`"false"\`.
- Listen for \`keydown\` on the listbox. \`ArrowDown\`/\`ArrowRight\` move to the next enabled option and \`ArrowUp\`/\`ArrowLeft\` to the previous one, **wrapping** at the ends. \`Home\` and \`End\` jump to the first and last enabled options.
- Moving updates \`tabindex\` and \`aria-selected\` and calls \`.focus()\` on the new option. Call \`preventDefault()\` for the keys you handle so the page doesn't scroll. Ignore every other key.
- Options with \`aria-disabled="true"\` are skipped.
- Clicking an enabled option selects and focuses it.
- Return a \`destroy()\` function that removes your listeners.`,
    starter: `function initListbox(listbox) {\n  // your code here\n}`,
    tests: `function makeListbox(labels, attrs) {
  attrs = attrs || {};
  const ul = document.createElement("ul");
  ul.setAttribute("role", "listbox");
  ul.setAttribute("aria-label", "Fruit");
  labels.forEach((label, i) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.textContent = label;
    for (const k of Object.keys(attrs[i] || {})) li.setAttribute(k, attrs[i][k]);
    ul.append(li);
  });
  document.body.append(ul);
  return ul;
}
function optionsOf(ul) { return Array.from(ul.querySelectorAll('[role="option"]')); }
function press(el, key) {
  const e = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
}
function tabindexes(ul) { return optionsOf(ul).map((o) => o.getAttribute("tabindex")); }
function selectedText(ul) { return optionsOf(ul).filter((o) => o.getAttribute("aria-selected") === "true").map((o) => o.textContent); }
test("makes the first option the only tab stop by default", () => {
  const ul = makeListbox(["A", "B", "C"]);
  initListbox(ul);
  expect(tabindexes(ul)).toEqual(["0", "-1", "-1"]);
});
test("respects a preselected option", () => {
  const ul = makeListbox(["A", "B", "C"], { 1: { "aria-selected": "true" } });
  initListbox(ul);
  expect(tabindexes(ul)).toEqual(["-1", "0", "-1"]);
  expect(selectedText(ul)).toEqual(["B"]);
});
test("ArrowDown moves focus, tabindex and selection to the next option", () => {
  const ul = makeListbox(["A", "B", "C"]);
  initListbox(ul);
  optionsOf(ul)[0].focus();
  const e = press(document.activeElement, "ArrowDown");
  expect(document.activeElement).toBe(optionsOf(ul)[1]);
  expect(tabindexes(ul)).toEqual(["-1", "0", "-1"]);
  expect(selectedText(ul)).toEqual(["B"]);
  expect(optionsOf(ul)[0].getAttribute("aria-selected")).toBe("false");
  expect(e.defaultPrevented).toBe(true);
});
test("wraps from last to first and first to last", () => {
  const ul = makeListbox(["A", "B", "C"], { 2: { "aria-selected": "true" } });
  initListbox(ul);
  optionsOf(ul)[2].focus();
  press(document.activeElement, "ArrowDown");
  expect(document.activeElement.textContent).toBe("A");
  press(document.activeElement, "ArrowUp");
  expect(document.activeElement.textContent).toBe("C");
  press(document.activeElement, "ArrowRight");
  press(document.activeElement, "ArrowRight");
  expect(document.activeElement.textContent).toBe("B");
  press(document.activeElement, "ArrowLeft");
  expect(document.activeElement.textContent).toBe("A");
});
test("Home and End jump to the ends", () => {
  const ul = makeListbox(["A", "B", "C", "D"], { 1: { "aria-selected": "true" } });
  initListbox(ul);
  optionsOf(ul)[1].focus();
  press(document.activeElement, "End");
  expect(document.activeElement.textContent).toBe("D");
  press(document.activeElement, "Home");
  expect(document.activeElement.textContent).toBe("A");
  expect(selectedText(ul)).toEqual(["A"]);
});
test("skips aria-disabled options", () => {
  const ul = makeListbox(["A", "B", "C", "D"], { 1: { "aria-disabled": "true" }, 3: { "aria-disabled": "true" } });
  initListbox(ul);
  optionsOf(ul)[0].focus();
  press(document.activeElement, "ArrowDown");
  expect(document.activeElement.textContent).toBe("C");
  press(document.activeElement, "ArrowDown");
  expect(document.activeElement.textContent).toBe("A");
  press(document.activeElement, "End");
  expect(document.activeElement.textContent).toBe("C");
});
test("ignores other keys and does not prevent their default", () => {
  const ul = makeListbox(["A", "B"]);
  initListbox(ul);
  optionsOf(ul)[0].focus();
  const e = press(document.activeElement, "a");
  const tab = press(document.activeElement, "Tab");
  expect(document.activeElement.textContent).toBe("A");
  expect(e.defaultPrevented).toBe(false);
  expect(tab.defaultPrevented).toBe(false);
});
test("clicking an option selects and focuses it", () => {
  const ul = makeListbox(["A", "B", "C"]);
  initListbox(ul);
  optionsOf(ul)[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(document.activeElement.textContent).toBe("C");
  expect(selectedText(ul)).toEqual(["C"]);
  expect(tabindexes(ul)).toEqual(["-1", "-1", "0"]);
});
test("destroy removes the keyboard handling", () => {
  const ul = makeListbox(["A", "B"]);
  const destroy = initListbox(ul);
  optionsOf(ul)[0].focus();
  destroy();
  const e = press(document.activeElement, "ArrowDown");
  expect(document.activeElement.textContent).toBe("A");
  expect(e.defaultPrevented).toBe(false);
});`,
    hints: [
      "Only one option is ever in the Tab order (tabindex 0). Moving means taking tabindex 0 away from one option and giving it to another, then focusing it. Script can focus elements with tabindex -1.",
      "Write a select(option) helper that loops over all options, setting tabIndex and aria-selected, then focuses the chosen one. In the keydown handler, build the list of enabled options, find the index of the current one, compute the next index, call preventDefault and select.",
      "Wrapping: next = (i + 1) % n and prev = (i - 1 + n) % n over the enabled-options array. A switch on e.key with a default that returns early keeps unrelated keys untouched. Find the current option with listbox.querySelector('[role=\"option\"][tabindex=\"0\"]').",
    ],
    solution: `function initListbox(listbox) {
  const all = () => Array.from(listbox.querySelectorAll('[role="option"]'));
  const enabled = () => all().filter((o) => o.getAttribute("aria-disabled") !== "true");

  function select(option, focus) {
    for (const o of all()) {
      const active = o === option;
      o.tabIndex = active ? 0 : -1;
      o.setAttribute("aria-selected", String(active));
    }
    if (focus) option.focus();
  }

  const initial = enabled();
  if (initial.length === 0) return () => {};
  select(initial.find((o) => o.getAttribute("aria-selected") === "true") || initial[0], false);

  function onKeyDown(event) {
    const options = enabled();
    const current = options.indexOf(listbox.querySelector('[role="option"][tabindex="0"]'));
    const n = options.length;
    let next;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = (current + 1) % n;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = (current - 1 + n) % n;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = n - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    select(options[next], true);
  }

  function onClick(event) {
    const option = event.target.closest('[role="option"]');
    if (option && listbox.contains(option) && option.getAttribute("aria-disabled") !== "true") select(option, true);
  }

  listbox.addEventListener("keydown", onKeyDown);
  listbox.addEventListener("click", onClick);
  return () => {
    listbox.removeEventListener("keydown", onKeyDown);
    listbox.removeEventListener("click", onClick);
  };
}`,
    explanation: `A roving tabindex keeps a composite widget to a single Tab stop. Keyboard users press Tab once to enter the listbox and once to leave it, instead of tabbing through every option. Exactly one option has \`tabindex="0"\`. The rest have \`-1\`, which takes them out of the Tab order while still allowing \`.focus()\` from script. Because the tab stop moves with focus, Tabbing away and back returns the user to the option they were on.

Working over the list of **enabled** options makes skipping disabled ones and wrapping fall out of plain modular arithmetic. Each keypress is O(n) to rebuild the list, which is fine for menus. For long lists you would cache the options.

Common mistakes: forgetting \`preventDefault\` (arrow keys then also scroll the page), calling it for every key (which breaks Tab and typing), setting \`aria-selected\` without moving real focus (screen readers announce the focused element), and leaving several options at \`tabindex="0"\`.

Follow-up: "How does this differ from \`aria-activedescendant\`?" With activedescendant, DOM focus stays on the listbox and an attribute points at the active option's id. That works better for comboboxes where focus has to stay in a text input.`,
  },
  {
    id: "fe-focus-trap",
    title: "Focus trap for a modal",
    track: "Frontend",
    level: "Medium",
    minutes: 30,
    tags: ["accessibility", "keyboard", "modal"],
    prompt: `When a modal dialog is open, Tab and Shift+Tab must cycle inside it instead of escaping to the page behind. When it closes, focus must return to the button that opened it.

Write \`trapFocus(container)\` that returns \`release()\`:

- On activation, remember \`document.activeElement\`, then focus the first **tabbable** element inside \`container\`. If there are none, give the container \`tabindex="-1"\` and focus it.
- Tabbable means one of \`a[href]\`, \`button\`, \`input\`, \`select\`, \`textarea\` or \`[tabindex]\` that isn't disabled, doesn't have a negative \`tabIndex\`, isn't \`type="hidden"\` and isn't inside a \`[hidden]\` element. Work this out **at keypress time**, because dialog content can change.
- Listen for \`keydown\` on \`document\`:
  - \`Tab\` on the last tabbable (or when focus is outside the container) → \`preventDefault()\` and focus the first.
  - \`Shift+Tab\` on the first tabbable (or when focus is outside) → \`preventDefault()\` and focus the last.
  - Anywhere else, do nothing and let the browser move focus normally.
- \`release()\` removes the listener and restores focus to the element remembered at activation.

\`\`\`js
opener.focus();
const release = trapFocus(dialog); // focus moves to the dialog's first button
// ... Tab on the last field wraps to the first
release(); // focus goes back to opener
\`\`\``,
    starter: `function trapFocus(container) {\n  // your code here\n}`,
    tests: `function makeDialog() {
  document.body.innerHTML = '<button id="opener">Open</button>' +
    '<div id="dlg" role="dialog" aria-modal="true">' +
    '<button id="a">A</button><input id="b" disabled><a id="c">no href</a>' +
    '<div id="d" tabindex="-1">D</div><span hidden><button id="e">E</button></span>' +
    '<input type="hidden" id="h"><a id="f" href="#x">F</a><input id="g">' +
    '</div><button id="after">After</button>';
  document.getElementById("opener").focus();
  return document.getElementById("dlg");
}
function pressTab(shift) {
  const e = new KeyboardEvent("keydown", { key: "Tab", shiftKey: !!shift, bubbles: true, cancelable: true });
  (document.activeElement || document.body).dispatchEvent(e);
  return e;
}
const byId = (id) => document.getElementById(id);
test("focuses the first tabbable element on activation", () => {
  const dlg = makeDialog();
  const release = trapFocus(dlg);
  expect(document.activeElement).toBe(byId("a"));
  release();
});
test("Tab on the last tabbable wraps to the first", () => {
  const release = trapFocus(makeDialog());
  byId("g").focus();
  const e = pressTab(false);
  expect(e.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(byId("a"));
  release();
});
test("Shift+Tab on the first tabbable wraps to the last", () => {
  const release = trapFocus(makeDialog());
  const e = pressTab(true);
  expect(e.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(byId("g"));
  release();
});
test("leaves Tab alone in the middle of the dialog", () => {
  const release = trapFocus(makeDialog());
  byId("f").focus();
  const e = pressTab(false);
  expect(e.defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(byId("f"));
  const back = pressTab(true);
  expect(back.defaultPrevented).toBe(false);
  release();
});
test("skips disabled, negative tabindex, hidden and href-less elements", () => {
  const release = trapFocus(makeDialog());
  // first is #a, last is #g; #b #c #d #e #h are not tabbable
  byId("a").focus();
  pressTab(true);
  expect(document.activeElement).toBe(byId("g"));
  release();
});
test("picks up elements added after activation", () => {
  const dlg = makeDialog();
  const release = trapFocus(dlg);
  const extra = document.createElement("button");
  extra.id = "late";
  dlg.append(extra);
  byId("g").focus();
  expect(pressTab(false).defaultPrevented).toBe(false);
  extra.focus();
  pressTab(false);
  expect(document.activeElement).toBe(byId("a"));
  release();
});
test("pulls focus back in when Tab is pressed from outside", () => {
  const release = trapFocus(makeDialog());
  byId("after").focus();
  pressTab(false);
  expect(document.activeElement).toBe(byId("a"));
  release();
});
test("focuses the container itself when it has nothing tabbable", () => {
  document.body.innerHTML = '<button id="opener">Open</button><div id="empty"><p>Just text</p></div>';
  byId("opener").focus();
  const box = byId("empty");
  const release = trapFocus(box);
  expect(document.activeElement).toBe(box);
  expect(box.getAttribute("tabindex")).toBe("-1");
  release();
});
test("release restores focus and stops trapping", () => {
  const release = trapFocus(makeDialog());
  expect(typeof release).toBe("function");
  release();
  expect(document.activeElement).toBe(byId("opener"));
  byId("g").focus();
  const e = pressTab(false);
  expect(e.defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(byId("g"));
});`,
    hints: [
      "You only have to step in at the two edges. When focus is in the middle, the browser's own Tab handling already does the right thing.",
      "Write tabbables(container): querySelectorAll the candidate selector, then filter out disabled elements, tabIndex < 0, type hidden and anything with el.closest('[hidden]'). In the document keydown handler, compare document.activeElement with the first and last items.",
      "if (e.shiftKey && (active === first || !inside)) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && (active === last || !inside)) { e.preventDefault(); first.focus(); }. Save document.activeElement before focusing anything so release() can restore it.",
    ],
    solution: `const TABBABLE = 'a[href], button, input, select, textarea, [tabindex]';

function tabbables(container) {
  return Array.from(container.querySelectorAll(TABBABLE)).filter(
    (el) => !el.disabled && el.tabIndex >= 0 && el.type !== "hidden" && !el.closest("[hidden]")
  );
}

function trapFocus(container) {
  const previous = document.activeElement;

  const initial = tabbables(container);
  if (initial.length) {
    initial[0].focus();
  } else {
    if (!container.hasAttribute("tabindex")) container.tabIndex = -1;
    container.focus();
  }

  function onKeyDown(event) {
    if (event.key !== "Tab") return;
    const items = tabbables(container);
    if (items.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const inside = container.contains(active) && active !== container;

    if (event.shiftKey && (active === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("keydown", onKeyDown);
  return function release() {
    document.removeEventListener("keydown", onKeyDown);
    if (previous && typeof previous.focus === "function") previous.focus();
  };
}`,
    explanation: `The trap only steps in at the boundaries. In the middle of the dialog the browser's native Tab order is already correct (it handles positive \`tabindex\`, radio groups and so on), so overriding every Tab press would be more code and more bugs. Recomputing the tabbable list on each keypress costs O(elements in the dialog) and handles content that appears later, such as validation messages or async-loaded fields.

The listener lives on \`document\` so it catches the case where focus has escaped, for example after a mouse click on the page behind or a programmatic focus. Saving \`document.activeElement\` before moving focus is what lets \`release()\` return the user to where they were. Skipping that step is one of the most common modal accessibility bugs.

Common mistakes: using \`el.getAttribute("tabindex")\` instead of \`el.tabIndex\`, forgetting \`a\` without \`href\` isn't focusable, not filtering hidden content, and leaving the listener attached after close.

Follow-up: "What does the \`inert\` attribute change?" Setting \`inert\` on everything outside the dialog (or using \`<dialog>\` with \`showModal()\`) makes the page behind unfocusable and hidden from assistive tech, so Tab wraps naturally. A manual trap is the fallback for custom overlays.`,
  },
  {
    id: "fe-tabs-widget",
    title: "Accessible tabs widget",
    track: "Frontend",
    level: "Hard",
    minutes: 45,
    tags: ["accessibility", "aria", "keyboard"],
    prompt: `Design gave you static markup for a tabs component. Wire it up to follow the WAI-ARIA tabs pattern.

\`\`\`html
<div class="tabs">
  <div role="tablist" aria-label="Settings">
    <button role="tab">General</button>
    <button role="tab">Privacy</button>
    <button role="tab">Billing</button>
  </div>
  <div role="tabpanel">...</div>
  <div role="tabpanel">...</div>
  <div role="tabpanel">...</div>
</div>
\`\`\`

Write \`initTabs(root, options)\` where \`options.activation\` is \`"automatic"\` (default) or \`"manual"\`. Tabs and panels pair up by order.

1. **Wiring:** give every tab and panel an \`id\` if it lacks one (keep existing ids). Set \`aria-controls\` on each tab to its panel's id, \`aria-labelledby\` on each panel to its tab's id, and \`tabindex="0"\` on each panel.
2. **Initial state:** select the tab that already has \`aria-selected="true"\`, otherwise the first.
3. **Selected state:** the selected tab has \`aria-selected="true"\` and \`tabindex="0"\`. Other tabs have \`aria-selected="false"\` and \`tabindex="-1"\`. Every panel except the selected one has the \`hidden\` attribute.
4. **Mouse:** clicking a tab selects and focuses it.
5. **Keyboard** (on the tablist): \`ArrowRight\`/\`ArrowLeft\` move to the next/previous tab, wrapping. \`Home\`/\`End\` go to the first/last. Call \`preventDefault()\` on handled keys.
   - **automatic:** moving focus also selects that tab.
   - **manual:** arrows only move focus. \`Enter\` or \`Space\` (\`" "\`) selects the focused tab. \`tabindex\` stays on the selected tab.
6. Return \`{ select(index), selectedIndex }\`, where \`selectedIndex\` is a getter for the current index.`,
    starter: `function initTabs(root, options) {\n  // your code here\n}`,
    tests: `function makeTabs(preselect) {
  document.body.innerHTML = '<div class="tabs"><div role="tablist" aria-label="Settings">' +
    '<button role="tab">General</button><button role="tab" id="custom-tab">Privacy</button><button role="tab">Billing</button>' +
    '</div><div role="tabpanel">G</div><div role="tabpanel" id="custom-panel">P</div><div role="tabpanel">B</div></div>';
  if (preselect != null) document.querySelectorAll('[role="tab"]')[preselect].setAttribute("aria-selected", "true");
  return document.querySelector(".tabs");
}
function tabsOf() { return Array.from(document.querySelectorAll('[role="tab"]')); }
function panelsOf() { return Array.from(document.querySelectorAll('[role="tabpanel"]')); }
function key(k) {
  const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true });
  document.activeElement.dispatchEvent(e);
  return e;
}
function state() {
  return {
    selected: tabsOf().map((t) => t.getAttribute("aria-selected")),
    tabindex: tabsOf().map((t) => t.getAttribute("tabindex")),
    hidden: panelsOf().map((p) => p.hidden),
  };
}
test("wires aria-controls and aria-labelledby, keeping existing ids", () => {
  initTabs(makeTabs());
  const tabs = tabsOf(), panels = panelsOf();
  expect(tabs[1].id).toBe("custom-tab");
  expect(panels[1].id).toBe("custom-panel");
  tabs.forEach((tab, i) => {
    expect(tab.id.length).toBeGreaterThan(0);
    expect(panels[i].id.length).toBeGreaterThan(0);
    expect(tab.getAttribute("aria-controls")).toBe(panels[i].id);
    expect(panels[i].getAttribute("aria-labelledby")).toBe(tab.id);
    expect(panels[i].getAttribute("tabindex")).toBe("0");
  });
  expect(new Set(tabs.map((t) => t.id).concat(panels.map((p) => p.id))).size).toBe(6);
});
test("selects the first tab by default and hides other panels", () => {
  const api = initTabs(makeTabs());
  expect(state()).toEqual({ selected: ["true", "false", "false"], tabindex: ["0", "-1", "-1"], hidden: [false, true, true] });
  expect(api.selectedIndex).toBe(0);
});
test("respects a tab that is already aria-selected", () => {
  initTabs(makeTabs(2));
  expect(state()).toEqual({ selected: ["false", "false", "true"], tabindex: ["-1", "-1", "0"], hidden: [true, true, false] });
});
test("clicking a tab selects and focuses it", () => {
  const api = initTabs(makeTabs());
  tabsOf()[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(document.activeElement).toBe(tabsOf()[1]);
  expect(state().hidden).toEqual([true, false, true]);
  expect(api.selectedIndex).toBe(1);
});
test("automatic: arrow keys move focus and selection, wrapping", () => {
  initTabs(makeTabs());
  tabsOf()[0].focus();
  const e = key("ArrowRight");
  expect(e.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(tabsOf()[1]);
  expect(state().selected).toEqual(["false", "true", "false"]);
  key("ArrowRight");
  key("ArrowRight");
  expect(document.activeElement).toBe(tabsOf()[0]);
  key("ArrowLeft");
  expect(document.activeElement).toBe(tabsOf()[2]);
  expect(state().hidden).toEqual([true, true, false]);
});
test("Home and End jump to the first and last tab", () => {
  initTabs(makeTabs(1));
  tabsOf()[1].focus();
  key("End");
  expect(document.activeElement).toBe(tabsOf()[2]);
  key("Home");
  expect(document.activeElement).toBe(tabsOf()[0]);
  expect(state().selected).toEqual(["true", "false", "false"]);
});
test("manual: arrows move focus without changing the selection", () => {
  initTabs(makeTabs(), { activation: "manual" });
  tabsOf()[0].focus();
  key("ArrowRight");
  expect(document.activeElement).toBe(tabsOf()[1]);
  expect(state()).toEqual({ selected: ["true", "false", "false"], tabindex: ["0", "-1", "-1"], hidden: [false, true, true] });
});
test("manual: Enter and Space select the focused tab", () => {
  const api = initTabs(makeTabs(), { activation: "manual" });
  tabsOf()[0].focus();
  key("ArrowLeft");
  expect(document.activeElement).toBe(tabsOf()[2]);
  const e = key("Enter");
  expect(e.defaultPrevented).toBe(true);
  expect(api.selectedIndex).toBe(2);
  key("Home");
  key(" ");
  expect(state().selected).toEqual(["true", "false", "false"]);
});
test("ignores unrelated keys", () => {
  initTabs(makeTabs());
  tabsOf()[0].focus();
  const e = key("ArrowDown");
  expect(e.defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(tabsOf()[0]);
});
test("select(index) updates the widget programmatically", () => {
  const api = initTabs(makeTabs());
  api.select(2);
  expect(api.selectedIndex).toBe(2);
  expect(state().hidden).toEqual([true, true, false]);
});`,
    hints: [
      "Separate the state from the DOM. The only real state is the selected index (plus where focus is). One select(index) function should write every aria-selected, tabindex and hidden value from that index.",
      "Do the id and aria wiring once up front, pairing tabs[i] with panels[i]. Then add one click listener and one keydown listener to the tablist. In keydown, work out the index of document.activeElement among the tabs, compute the next index with modular arithmetic, and branch on the activation mode.",
      "In keydown: case Enter or ' ' → if manual, preventDefault and select(current), then return. For the arrows, Home and End: compute next, preventDefault, then manual ? tabs[next].focus() : select(next, true). Use a module-level counter for generated ids so two widgets on the page never collide.",
    ],
    solution: `let tabsUid = 0;

function initTabs(root, { activation = "automatic" } = {}) {
  const tablist = root.querySelector('[role="tablist"]');
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));

  tabs.forEach((tab, i) => {
    const panel = panels[i];
    const n = ++tabsUid;
    if (!tab.id) tab.id = "tab-" + n;
    if (!panel.id) panel.id = "tabpanel-" + n;
    tab.setAttribute("aria-controls", panel.id);
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;
  });

  let selected = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));

  function select(index, focus = false) {
    selected = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tabs[index].focus();
  }
  select(selected);

  tablist.addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab && tabs.includes(tab)) select(tabs.indexOf(tab), true);
  });

  tablist.addEventListener("keydown", (event) => {
    const focused = tabs.indexOf(document.activeElement);
    const from = focused === -1 ? selected : focused;
    const n = tabs.length;
    let next;
    switch (event.key) {
      case "ArrowRight": next = (from + 1) % n; break;
      case "ArrowLeft": next = (from - 1 + n) % n; break;
      case "Home": next = 0; break;
      case "End": next = n - 1; break;
      case "Enter":
      case " ":
        if (activation === "manual" && focused !== -1) {
          event.preventDefault();
          select(focused, true);
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    if (activation === "manual") tabs[next].focus();
    else select(next, true);
  });

  return {
    select: (index) => select(index),
    get selectedIndex() { return selected; },
  };
}`,
    explanation: `The whole widget hangs off one piece of state, the selected index, and a single \`select\` function that projects it onto the DOM (\`aria-selected\`, roving \`tabindex\`, \`hidden\` panels). Keeping every DOM write in one place is what keeps the ARIA attributes from drifting out of sync. Each key press is O(number of tabs).

\`aria-controls\` and \`aria-labelledby\` tie each tab to its panel in the accessibility tree, so a screen reader announces "Privacy, tab, 2 of 3" and names the panel after its tab. \`tabindex="0"\` on panels lets keyboard users Tab from the tablist straight into panel content, even when the panel has no focusable children.

Automatic activation is right when panels are cheap to show. Manual activation is for panels that are slow (for example, they fetch data), so arrowing past a tab doesn't trigger work. In manual mode the tab stop stays on the selected tab. Common mistakes: hiding panels with CSS classes instead of \`hidden\` (which leaves them in the accessibility tree), generating ids that collide when two widgets are on one page, and reacting to \`ArrowDown\` in a horizontal tablist.

Follow-up: "How would you support vertical tabs?" Read \`aria-orientation="vertical"\` on the tablist and map \`ArrowUp\`/\`ArrowDown\` instead of left and right.`,
  },
  {
    id: "fe-toast-queue",
    title: "Toast queue manager",
    track: "Frontend",
    level: "Medium",
    minutes: 30,
    tags: ["state", "timers", "ui"],
    prompt: `Notifications pile up and cover the page. Build the logic behind a toast stack: show at most a few at a time, queue the rest, and auto-dismiss each one.

\`createToaster({ maxVisible = 3, duration = 3000, timers = globalThis } = {})\` returns:

- \`show(message, { duration } = {})\`: adds a toast and returns its id (\`1\`, \`2\`, \`3\`... per toaster). If fewer than \`maxVisible\` toasts are showing, it becomes visible right away. Otherwise it waits in a FIFO queue.
- \`dismiss(id)\`: removes a visible or queued toast. Returns \`true\` if it found one, else \`false\`.
- \`getState()\`: returns \`{ visible: [{ id, message }], queued: [{ id, message }] }\`, each in order.
- \`subscribe(listener)\`: calls \`listener(state)\` after every change. Returns an unsubscribe function.

Timing rules:

- A toast's auto-dismiss timer starts **when it becomes visible**, not when it is queued. Use \`timers.setTimeout\` and \`timers.clearTimeout\` so tests can inject a fake clock.
- When a visible toast goes away, the oldest queued toast is promoted and its timer starts.
- A per-toast \`duration\` overrides the default. A duration of \`0\` or \`Infinity\` means the toast stays until dismissed.
- Dismissing a visible toast early must clear its timer.

\`\`\`js
const toaster = createToaster({ maxVisible: 1, duration: 1000 });
toaster.show("Saved");        // 1, visible
toaster.show("Synced");       // 2, queued
// after 1000ms: "Saved" closes, "Synced" becomes visible and closes 1000ms later
\`\`\``,
    starter: `function createToaster(options) {\n  // your code here\n}`,
    tests: `function makeFakeTimers() {
  let now = 0, nextId = 1;
  const tasks = new Map();
  return {
    setTimeout(fn, ms) { const id = nextId++; tasks.set(id, { fn, at: now + ms }); return id; },
    clearTimeout(id) { tasks.delete(id); },
    advance(ms) {
      const target = now + ms;
      for (;;) {
        let best = null;
        for (const [id, t] of tasks) if (t.at <= target && (!best || t.at < best[1].at)) best = [id, t];
        if (!best) break;
        tasks.delete(best[0]);
        now = best[1].at;
        best[1].fn();
      }
      now = target;
    },
    pending() { return tasks.size; },
  };
}
const ids = (list) => list.map((t) => t.id);
test("shows up to maxVisible toasts and queues the rest", () => {
  const t = createToaster({ maxVisible: 2, timers: makeFakeTimers() });
  const a = t.show("a"), b = t.show("b"), c = t.show("c");
  expect([a, b, c]).toEqual([1, 2, 3]);
  expect(t.getState()).toEqual({ visible: [{ id: 1, message: "a" }, { id: 2, message: "b" }], queued: [{ id: 3, message: "c" }] });
});
test("auto-dismisses after the duration", () => {
  const clock = makeFakeTimers();
  const t = createToaster({ duration: 1000, timers: clock });
  t.show("hello");
  clock.advance(999);
  expect(t.getState().visible).toHaveLength(1);
  clock.advance(1);
  expect(t.getState().visible).toHaveLength(0);
});
test("starts a queued toast's timer only when it becomes visible", () => {
  const clock = makeFakeTimers();
  const t = createToaster({ maxVisible: 1, duration: 1000, timers: clock });
  t.show("first");
  t.show("second");
  clock.advance(1000);
  expect(ids(t.getState().visible)).toEqual([2]);
  clock.advance(999);
  expect(ids(t.getState().visible)).toEqual([2]);
  clock.advance(1);
  expect(t.getState()).toEqual({ visible: [], queued: [] });
});
test("supports a per-toast duration", () => {
  const clock = makeFakeTimers();
  const t = createToaster({ duration: 1000, timers: clock });
  t.show("long", { duration: 5000 });
  t.show("short", { duration: 100 });
  clock.advance(100);
  expect(ids(t.getState().visible)).toEqual([1]);
  clock.advance(4900);
  expect(ids(t.getState().visible)).toEqual([]);
});
test("dismissing early removes the toast and clears its timer", () => {
  const clock = makeFakeTimers();
  const t = createToaster({ maxVisible: 1, duration: 1000, timers: clock });
  const a = t.show("a");
  t.show("b");
  expect(t.dismiss(a)).toBe(true);
  expect(ids(t.getState().visible)).toEqual([2]);
  expect(clock.pending()).toBe(1);
  expect(t.dismiss(a)).toBe(false);
});
test("can dismiss a queued toast", () => {
  const clock = makeFakeTimers();
  const t = createToaster({ maxVisible: 1, timers: clock });
  t.show("a");
  const b = t.show("b");
  t.show("c");
  expect(t.dismiss(b)).toBe(true);
  expect(ids(t.getState().queued)).toEqual([3]);
  expect(clock.pending()).toBe(1);
});
test("duration 0 or Infinity keeps a toast until dismissed", () => {
  const clock = makeFakeTimers();
  const t = createToaster({ duration: 1000, timers: clock });
  t.show("sticky", { duration: 0 });
  t.show("forever", { duration: Infinity });
  clock.advance(1000000);
  expect(ids(t.getState().visible)).toEqual([1, 2]);
  expect(clock.pending()).toBe(0);
});
test("notifies subscribers on every change until unsubscribed", () => {
  const clock = makeFakeTimers();
  const t = createToaster({ maxVisible: 1, duration: 500, timers: clock });
  const seen = [];
  const off = t.subscribe((s) => seen.push(ids(s.visible).concat(ids(s.queued).map((n) => -n))));
  t.show("a");
  t.show("b");
  clock.advance(500);
  off();
  clock.advance(500);
  expect(seen).toEqual([[1], [1, -2], [2]]);
});
test("ids are unique per toaster", () => {
  const t1 = createToaster({ timers: makeFakeTimers() });
  const t2 = createToaster({ timers: makeFakeTimers() });
  expect([t1.show("x"), t1.show("y"), t2.show("z")]).toEqual([1, 2, 1]);
});`,
    hints: [
      "Keep two arrays, visible and queued. Almost every operation is 'change the arrays, then promote from the queue while there is room, then notify'.",
      "Store each toast as { id, message, duration, timer }. Write promote(): while visible.length < maxVisible and the queue isn't empty, move the head of the queue into visible and start its timer. show pushes to the queue and calls promote. dismiss splices from whichever array holds the id.",
      "startTimer(t): if (t.duration > 0 && t.duration !== Infinity) t.timer = timers.setTimeout(() => dismiss(t.id), t.duration). In dismiss, clearTimeout the toast's timer when removing it from visible, then promote() and emit(). getState should map to { id, message } so internal fields don't leak.",
    ],
    solution: `function createToaster({ maxVisible = 3, duration = 3000, timers = globalThis } = {}) {
  let nextId = 1;
  const visible = [];
  const queued = [];
  const listeners = new Set();

  const view = (t) => ({ id: t.id, message: t.message });
  const getState = () => ({ visible: visible.map(view), queued: queued.map(view) });
  const emit = () => {
    const state = getState();
    listeners.forEach((fn) => fn(state));
  };

  function startTimer(toast) {
    if (toast.duration > 0 && toast.duration !== Infinity) {
      toast.timer = timers.setTimeout(() => dismiss(toast.id), toast.duration);
    }
  }

  function promote() {
    while (visible.length < maxVisible && queued.length > 0) {
      const toast = queued.shift();
      visible.push(toast);
      startTimer(toast); // the clock starts only once it is on screen
    }
  }

  function show(message, opts = {}) {
    const toast = { id: nextId++, message, duration: opts.duration ?? duration, timer: null };
    queued.push(toast);
    promote();
    emit();
    return toast.id;
  }

  function dismiss(id) {
    let i = visible.findIndex((t) => t.id === id);
    if (i !== -1) {
      const [toast] = visible.splice(i, 1);
      if (toast.timer != null) timers.clearTimeout(toast.timer);
      promote();
      emit();
      return true;
    }
    i = queued.findIndex((t) => t.id === id);
    if (i !== -1) {
      queued.splice(i, 1);
      emit();
      return true;
    }
    return false;
  }

  return {
    show,
    dismiss,
    getState,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}`,
    explanation: `Routing every new toast through the queue and a single \`promote()\` step means there is exactly one place where a toast becomes visible, and that is where its timer starts. That makes the "timer starts on screen" rule hard to get wrong. Users never see a queued toast flash up and vanish immediately because its time ran out while it waited.

Injecting \`timers\` turns a time-based feature into one you can test synchronously and deterministically. You advance a fake clock instead of sleeping. The same trick works for debounce, polling and animation code. Operations are O(visible + queued), which is tiny.

Common mistakes: starting timers in \`show\` (queued toasts expire unseen), not clearing the timer on manual dismiss (the stale timer later dismisses nothing, or worse, a reused id), using \`duration || default\` (which turns an explicit \`0\` into the default; \`??\` keeps it), and leaking internal fields like \`timer\` through \`getState\`.

Follow-up: "Pause timers while the user hovers the stack." Store each toast's remaining time. On pause, clear the timer and save \`remaining -= now - startedAt\`. On resume, start a new timer for the remaining time.`,
  }
);
