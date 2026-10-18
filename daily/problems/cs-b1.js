(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "cs-valid-parentheses",
    title: "Bracket matcher for a code editor",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 15,
    tags: ["stacks", "strings"],
    prompt: `Your code editor wants to underline a line when its brackets don't balance. Write \`isBalanced(s)\` that returns \`true\` when every bracket in the string is closed by the matching kind, in the right order.

- The bracket pairs are \`()\`, \`[]\` and \`{}\`.
- Every other character (letters, spaces, operators) is ignored.
- An empty string, or one with no brackets at all, is balanced.

\`\`\`
isBalanced("fn(a[0], {b: 1})")  // true
isBalanced("([)]")              // false, closed in the wrong order
isBalanced("((")                // false, never closed
\`\`\``,
    starter: `function isBalanced(s) {
  // your code here
}`,
    tests: `test("accepts an empty string", () => {
  expect(isBalanced("")).toBe(true);
});
test("accepts simple pairs of every kind", () => {
  expect(isBalanced("()[]{}")).toBe(true);
});
test("accepts nested brackets", () => {
  expect(isBalanced("{[()()]}")).toBe(true);
});
test("ignores characters that are not brackets", () => {
  expect(isBalanced("fn(a[0], {b: 1})")).toBe(true);
  expect(isBalanced("no brackets here")).toBe(true);
});
test("rejects a mismatched kind", () => {
  expect(isBalanced("(]")).toBe(false);
});
test("rejects pairs closed in the wrong order", () => {
  expect(isBalanced("([)]")).toBe(false);
});
test("rejects brackets that are never closed", () => {
  expect(isBalanced("((")).toBe(false);
  expect(isBalanced("{[}")).toBe(false);
});
test("rejects a closer with nothing open", () => {
  expect(isBalanced("]")).toBe(false);
  expect(isBalanced("())(")).toBe(false);
});`,
    hints: [
      "The most recently opened bracket is the one that must close next. What data structure gives you the most recent item first?",
      "Push each opener onto a stack. When you see a closer, the top of the stack must be its matching opener.",
      "Keep a map like { ')': '(', ']': '[', '}': '{' }. On a closer, pop and compare with map[ch]; at the end, the stack must be empty.",
    ],
    solution: `function isBalanced(s) {
  const openerFor = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else if (ch in openerFor) {
      if (stack.pop() !== openerFor[ch]) return false;
    }
  }
  return stack.length === 0;
}`,
    explanation: `Brackets nest, so the bracket that must close next is always the one opened most recently. That last-in, first-out order is exactly what a stack gives you: push openers, and on each closer pop and check that it matches.

Two checks catch every failure. A closer that pops the wrong opener (or pops from an empty stack, which gives \`undefined\`) fails immediately. Openers left on the stack at the end were never closed.

This runs in O(n) time and O(n) space in the worst case (a string of all openers). A common mistake is counting each bracket kind separately: counts pass \`"([)]"\` even though it is invalid, because they ignore order.

Follow-up: return the index of the first offending character so the editor can underline it, not just the whole line.`,
  },
  {
    id: "cs-min-stack",
    title: "Stack with constant-time minimum",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 20,
    tags: ["stacks", "design"],
    prompt: `An undo history needs to report the smallest value it holds at any moment, without scanning. Implement a \`MinStack\` class where every method runs in O(1) time.

- \`push(x)\` adds a number to the top.
- \`pop()\` removes and returns the top value, or \`undefined\` when empty.
- \`top()\` returns the top value without removing it, or \`undefined\` when empty.
- \`getMin()\` returns the smallest value currently in the stack, or \`undefined\` when empty.
- \`size()\` returns the number of values.

Duplicates are allowed, and the minimum must stay correct after pops.

\`\`\`
const s = new MinStack();
s.push(5); s.push(2); s.push(2); s.push(7);
s.getMin(); // 2
s.pop();    // 7
s.pop();    // 2
s.getMin(); // 2 (the other 2 is still there)
\`\`\``,
    starter: `class MinStack {
  push(x) {
    // your code here
  }
  pop() {}
  top() {}
  getMin() {}
  size() {}
}`,
    tests: `test("an empty stack returns undefined and has size 0", () => {
  const s = new MinStack();
  expect(s.pop()).toBeUndefined();
  expect(s.top()).toBeUndefined();
  expect(s.getMin()).toBeUndefined();
  expect(s.size()).toBe(0);
});
test("push and pop work in last-in, first-out order", () => {
  const s = new MinStack();
  s.push(1); s.push(2); s.push(3);
  expect(s.top()).toBe(3);
  expect(s.pop()).toBe(3);
  expect(s.pop()).toBe(2);
  expect(s.size()).toBe(1);
});
test("getMin tracks the smallest value as values are pushed", () => {
  const s = new MinStack();
  s.push(5); expect(s.getMin()).toBe(5);
  s.push(8); expect(s.getMin()).toBe(5);
  s.push(3); expect(s.getMin()).toBe(3);
});
test("getMin is restored after the minimum is popped", () => {
  const s = new MinStack();
  s.push(5); s.push(3); s.push(8); s.push(1);
  s.pop();
  expect(s.getMin()).toBe(3);
  s.pop(); s.pop();
  expect(s.getMin()).toBe(5);
});
test("handles duplicate minimums", () => {
  const s = new MinStack();
  s.push(2); s.push(2); s.push(7);
  s.pop(); s.pop();
  expect(s.getMin()).toBe(2);
});
test("handles negative numbers and zero", () => {
  const s = new MinStack();
  s.push(0); s.push(-4); s.push(-1);
  expect(s.getMin()).toBe(-4);
  s.pop(); s.pop();
  expect(s.getMin()).toBe(0);
});
test("stays fast with many values", () => {
  const s = new MinStack();
  const start = Date.now();
  for (let i = 0; i < 50000; i++) s.push(50000 - i);
  for (let i = 0; i < 50000; i++) { s.getMin(); s.pop(); }
  expect(Date.now() - start).toBeLessThan(1000);
  expect(s.size()).toBe(0);
});`,
    hints: [
      "When you pop the current minimum, you need to know what the minimum was before it was pushed. Where could you remember that?",
      "Store the running minimum alongside each value, either in a second stack or as a pair on the same stack.",
      "On push, store { value: x, min: Math.min(x, currentMin) }. getMin just reads the top entry's min.",
    ],
    solution: `class MinStack {
  constructor() {
    this.items = []; // each entry: { value, min } where min is the minimum at or below it
  }
  push(x) {
    const min = this.items.length ? Math.min(x, this.getMin()) : x;
    this.items.push({ value: x, min });
  }
  pop() {
    const entry = this.items.pop();
    return entry ? entry.value : undefined;
  }
  top() {
    const entry = this.items[this.items.length - 1];
    return entry ? entry.value : undefined;
  }
  getMin() {
    const entry = this.items[this.items.length - 1];
    return entry ? entry.min : undefined;
  }
  size() {
    return this.items.length;
  }
}`,
    explanation: `A single "current minimum" variable is not enough: once you pop the minimum, you have no way to recover the previous one without scanning. The fix is to remember, for every position in the stack, what the minimum was at that point.

Storing \`{ value, min }\` pairs does that. Because a stack only changes at the top, the minimum of everything below an entry never changes while that entry is in the stack, so each snapshot stays valid. Every method is O(1) time, and the extra space is O(n).

A common bug is a separate min stack that only pushes when a value is strictly smaller than the current minimum. Then duplicate minimums break: push 2, 2 and pop once, and the min stack loses its only 2. Either push when the value is less than or equal, or store a min with every entry as above.

Follow-up: can you do it with O(1) extra space? (Yes, by storing encoded differences from the minimum, at the cost of readability.)`,
  },
  {
    id: "cs-queue-two-stacks",
    title: "Queue built from two stacks",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 20,
    tags: ["queues", "stacks", "amortized analysis"],
    prompt: `A job runner processes tasks in arrival order, but the only primitive you're allowed is a stack. Implement a first-in, first-out \`StackQueue\` class using two arrays that you only touch with \`push\`, \`pop\` and \`length\` (no \`shift\`, \`unshift\` or \`splice\`).

- \`enqueue(x)\` adds a value to the back.
- \`dequeue()\` removes and returns the front value, or \`undefined\` when empty.
- \`peek()\` returns the front value without removing it, or \`undefined\` when empty.
- \`size()\` returns the number of values.

Operations should be O(1) amortized. The tests run tens of thousands of mixed operations, so moving every element back and forth on each call will be too slow.

\`\`\`
const q = new StackQueue();
q.enqueue("a"); q.enqueue("b");
q.dequeue(); // "a"
q.enqueue("c");
q.dequeue(); // "b"
q.peek();    // "c"
\`\`\``,
    starter: `class StackQueue {
  enqueue(x) {
    // your code here
  }
  dequeue() {}
  peek() {}
  size() {}
}`,
    tests: `test("an empty queue returns undefined and has size 0", () => {
  const q = new StackQueue();
  expect(q.dequeue()).toBeUndefined();
  expect(q.peek()).toBeUndefined();
  expect(q.size()).toBe(0);
});
test("dequeues in first-in, first-out order", () => {
  const q = new StackQueue();
  q.enqueue(1); q.enqueue(2); q.enqueue(3);
  expect(q.dequeue()).toBe(1);
  expect(q.dequeue()).toBe(2);
  expect(q.dequeue()).toBe(3);
});
test("peek returns the front without removing it", () => {
  const q = new StackQueue();
  q.enqueue("a"); q.enqueue("b");
  expect(q.peek()).toBe("a");
  expect(q.peek()).toBe("a");
  expect(q.size()).toBe(2);
});
test("keeps order when enqueues and dequeues interleave", () => {
  const q = new StackQueue();
  q.enqueue(1); q.enqueue(2);
  expect(q.dequeue()).toBe(1);
  q.enqueue(3); q.enqueue(4);
  expect(q.dequeue()).toBe(2);
  q.enqueue(5);
  expect([q.dequeue(), q.dequeue(), q.dequeue()]).toEqual([3, 4, 5]);
  expect(q.dequeue()).toBeUndefined();
});
test("size tracks enqueues and dequeues", () => {
  const q = new StackQueue();
  q.enqueue(1); q.enqueue(2); q.enqueue(3);
  q.dequeue();
  expect(q.size()).toBe(2);
});
test("stores falsy values like 0 and empty string", () => {
  const q = new StackQueue();
  q.enqueue(0); q.enqueue("");
  expect(q.dequeue()).toBe(0);
  expect(q.peek()).toBe("");
  expect(q.size()).toBe(1);
});
test("handles many interleaved operations quickly", () => {
  const q = new StackQueue();
  for (let i = 0; i < 20000; i++) q.enqueue(i);
  const start = Date.now();
  let expected = 0;
  for (let i = 0; i < 20000; i++) {
    q.enqueue(20000 + i);
    expect(q.dequeue()).toBe(expected++);
  }
  expect(Date.now() - start).toBeLessThan(1000);
  expect(q.size()).toBe(20000);
});`,
    hints: [
      "Pushing items onto one stack and popping them onto another reverses their order. What does reversing a stack give you?",
      "Use an inbox stack for enqueue and an outbox stack for dequeue. Only move items from inbox to outbox when the outbox is empty.",
      "dequeue: if outbox is empty, pop everything from inbox and push it onto outbox; then pop from outbox. Each item moves at most once.",
    ],
    solution: `class StackQueue {
  constructor() {
    this.inbox = [];
    this.outbox = [];
  }
  enqueue(x) {
    this.inbox.push(x);
  }
  // Refill the outbox only when it's empty, so every item moves at most once.
  shift() {
    if (this.outbox.length === 0) {
      while (this.inbox.length) this.outbox.push(this.inbox.pop());
    }
  }
  dequeue() {
    this.shift();
    return this.outbox.pop();
  }
  peek() {
    this.shift();
    return this.outbox[this.outbox.length - 1];
  }
  size() {
    return this.inbox.length + this.outbox.length;
  }
}`,
    explanation: `Pouring one stack into another reverses it, which turns last-in, first-out into first-in, first-out. New items land on the inbox; dequeues come off the outbox, whose top is the oldest item.

The key is to refill the outbox only when it is empty. If you pour items back into the inbox after every dequeue, each operation costs O(n) and a long run becomes O(n²). With lazy refilling, each item is pushed onto the inbox once, moved once, and popped once, so the total work is O(1) amortized per operation, even though a single dequeue can occasionally cost O(n).

Watch out for falsy values: checking \`if (!this.outbox.pop())\` to detect emptiness breaks when the queue stores \`0\` or \`""\`. Check \`length\` instead.

Follow-up: implement a stack using two queues, and compare which operation becomes expensive.`,
  },
  {
    id: "cs-reverse-linked-list",
    title: "Reverse a linked list",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 15,
    tags: ["linked lists", "pointers"],
    prompt: `A playlist is stored as a singly linked list of nodes shaped \`{ val, next }\`, where the last node's \`next\` is \`null\`. Write \`reverseList(head)\` that reverses the list in place and returns the new head.

- Reuse the existing node objects; don't create new ones.
- An empty list (\`null\`) returns \`null\`.
- Lists can be 100,000 nodes long, so a recursive solution may overflow the call stack.

\`\`\`
// 1 -> 2 -> 3 -> null
reverseList(head) // 3 -> 2 -> 1 -> null
\`\`\``,
    starter: `function reverseList(head) {
  // your code here
}`,
    tests: `{
const listOf = (vals) => { let head = null; for (let i = vals.length - 1; i >= 0; i--) head = { val: vals[i], next: head }; return head; };
const valuesOf = (head) => { const out = []; let n = head; while (n && out.length < 200001) { out.push(n.val); n = n.next; } return out; };
test("returns null for an empty list", () => {
  expect(reverseList(null)).toBeNull();
});
test("a single node is its own reverse", () => {
  const head = listOf([7]);
  const result = reverseList(head);
  expect(result).toBe(head);
  expect(result.next).toBeNull();
});
test("reverses a short list", () => {
  expect(valuesOf(reverseList(listOf([1, 2, 3])))).toEqual([3, 2, 1]);
});
test("reverses a two-node list", () => {
  expect(valuesOf(reverseList(listOf(["a", "b"])))).toEqual(["b", "a"]);
});
test("reuses the original nodes", () => {
  const head = listOf([1, 2, 3]);
  const tail = head.next.next;
  const result = reverseList(head);
  expect(result).toBe(tail);
  expect(head.next).toBeNull();
});
test("reverses a 100,000-node list without overflowing the stack", () => {
  const vals = Array.from({ length: 100000 }, (_, i) => i);
  const result = valuesOf(reverseList(listOf(vals)));
  expect(result).toHaveLength(100000);
  expect(result[0]).toBe(99999);
  expect(result[99999]).toBe(0);
});
}`,
    hints: [
      "As you walk the list, each node's next pointer should end up pointing backwards. What do you lose when you overwrite next?",
      "Keep three pointers: prev (starts null), curr (starts at head), and a temporary for curr.next before you overwrite it.",
      "Loop while curr: save next = curr.next, set curr.next = prev, then move prev = curr and curr = next. Return prev.",
    ],
    solution: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next; // save before overwriting
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
    explanation: `Reversing a list means flipping every \`next\` pointer. Walking forward, you keep the node behind you (\`prev\`) and the node you're on (\`curr\`). Before pointing \`curr.next\` back at \`prev\`, save the forward link, or you lose the rest of the list.

When \`curr\` falls off the end, \`prev\` is the old tail, which is the new head. This is O(n) time and O(1) extra space.

The recursive version is elegant but uses O(n) call stack, and at 100,000 nodes JavaScript engines throw a stack overflow. Another frequent mistake is building a new list of fresh nodes, which uses O(n) memory and breaks any code holding references to the originals.

Follow-up: reverse only the nodes between positions m and n, or reverse the list in groups of k.`,
  },
  {
    id: "cs-linked-list-cycle",
    title: "Detect a cycle in a linked list",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 15,
    tags: ["linked lists", "two pointers"],
    prompt: `A bug in a redirect resolver can link URL records into a loop. Records form a singly linked list of nodes shaped \`{ val, next }\`. Write \`hasCycle(head)\` that returns \`true\` if following \`next\` ever revisits a node, and \`false\` if the list ends in \`null\`.

- An empty list has no cycle.
- Different nodes can hold the same \`val\`, so compare nodes, not values.
- Aim for O(1) extra space.

\`\`\`
// 1 -> 2 -> 3 -> 4 -> back to 2
hasCycle(head) // true

// 1 -> 1 -> 1 -> null
hasCycle(head) // false
\`\`\``,
    starter: `function hasCycle(head) {
  // your code here
}`,
    tests: `{
// Builds a list from vals. If loopTo is a number, the tail points back to that index.
const listOf = (vals, loopTo) => {
  const nodes = vals.map((val) => ({ val, next: null }));
  nodes.forEach((n, i) => { n.next = nodes[i + 1] || null; });
  if (typeof loopTo === "number" && nodes.length) nodes[nodes.length - 1].next = nodes[loopTo];
  return nodes[0] || null;
};
test("returns false for an empty list", () => {
  expect(hasCycle(null)).toBe(false);
});
test("returns false for a single node", () => {
  expect(hasCycle(listOf([1]))).toBe(false);
});
test("detects a node that points to itself", () => {
  expect(hasCycle(listOf([1], 0))).toBe(true);
});
test("detects a tail that links back to the head", () => {
  expect(hasCycle(listOf([1, 2, 3], 0))).toBe(true);
});
test("detects a loop that starts in the middle", () => {
  expect(hasCycle(listOf([1, 2, 3, 4, 5], 2))).toBe(true);
});
test("returns false for a normal list", () => {
  expect(hasCycle(listOf([1, 2, 3, 4, 5]))).toBe(false);
});
test("does not confuse repeated values with a cycle", () => {
  expect(hasCycle(listOf([1, 1, 1, 1]))).toBe(false);
});
test("handles a long list with a long loop", () => {
  const vals = Array.from({ length: 50000 }, (_, i) => i);
  expect(hasCycle(listOf(vals, 10))).toBe(true);
  expect(hasCycle(listOf(vals))).toBe(false);
});
}`,
    hints: [
      "If there is a loop, a walker never reaches null. How could you notice you're going in circles without remembering every node?",
      "Use two pointers moving at different speeds. On a loop, the faster one must eventually catch the slower one.",
      "slow moves one step, fast moves two. Loop while fast && fast.next; if slow === fast at any point, return true. Fall out of the loop means false.",
    ],
    solution: `function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
    explanation: `This is Floyd's tortoise and hare. If the list ends, the fast pointer reaches \`null\` first and we return \`false\`. If there's a loop, both pointers end up inside it, and each step the fast one closes the gap by one node, so it must land exactly on the slow one within one lap.

That's O(n) time and O(1) space. A \`Set\` of visited nodes also works in O(n) time but uses O(n) memory. What doesn't work is a set of visited values: lists with repeated values would be reported as cyclic.

Make sure the loop condition checks both \`fast\` and \`fast.next\` before taking two steps, or you'll read \`.next\` of \`null\`.

Follow-up: return the node where the cycle begins. After the pointers meet, move one back to the head and step both one at a time; they meet at the cycle's start.`,
  },
  {
    id: "cs-merge-sorted-lists",
    title: "Merge two sorted linked lists",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 20,
    tags: ["linked lists", "merging"],
    prompt: `Two services each return a timeline already sorted by timestamp, as singly linked lists of nodes shaped \`{ val, next }\` (\`val\` is a number). Write \`mergeLists(a, b)\` that splices them into one sorted list and returns its head.

- Reuse the existing nodes; don't create new value nodes.
- Either list (or both) may be \`null\`.
- On ties, nodes from \`a\` come before nodes from \`b\` (the merge is stable).

\`\`\`
// a: 1 -> 4 -> 6    b: 2 -> 4 -> 9
mergeLists(a, b) // 1 -> 2 -> 4(a) -> 4(b) -> 6 -> 9
\`\`\``,
    starter: `function mergeLists(a, b) {
  // your code here
}`,
    tests: `{
const listOf = (vals, tag) => { let head = null; for (let i = vals.length - 1; i >= 0; i--) head = { val: vals[i], next: head, tag }; return head; };
const valuesOf = (head) => { const out = []; let n = head; while (n && out.length < 100001) { out.push(n.val); n = n.next; } return out; };
const nodesOf = (head) => { const out = []; let n = head; while (n && out.length < 100001) { out.push(n); n = n.next; } return out; };
test("returns null when both lists are empty", () => {
  expect(mergeLists(null, null)).toBeNull();
});
test("returns the other list when one is empty", () => {
  const b = listOf([1, 2]);
  expect(mergeLists(null, b)).toBe(b);
  const a = listOf([3]);
  expect(mergeLists(a, null)).toBe(a);
});
test("interleaves two sorted lists", () => {
  expect(valuesOf(mergeLists(listOf([1, 4, 6]), listOf([2, 3, 9])))).toEqual([1, 2, 3, 4, 6, 9]);
});
test("handles one list entirely before the other", () => {
  expect(valuesOf(mergeLists(listOf([5, 6]), listOf([1, 2, 3])))).toEqual([1, 2, 3, 5, 6]);
});
test("puts nodes from a before nodes from b on ties", () => {
  const merged = nodesOf(mergeLists(listOf([1, 4], "a"), listOf([4, 4], "b")));
  expect(merged.map((n) => n.val + n.tag)).toEqual(["1a", "4a", "4b", "4b"]);
});
test("reuses the original nodes", () => {
  const a = listOf([1, 3]);
  const b = listOf([2]);
  const original = new Set([...nodesOf(a), ...nodesOf(b)]);
  const merged = nodesOf(mergeLists(a, b));
  expect(merged).toHaveLength(3);
  expect(merged.every((n) => original.has(n))).toBe(true);
});
test("merges long lists without overflowing the stack", () => {
  const evens = Array.from({ length: 30000 }, (_, i) => i * 2);
  const odds = Array.from({ length: 30000 }, (_, i) => i * 2 + 1);
  const merged = valuesOf(mergeLists(listOf(evens), listOf(odds)));
  expect(merged).toHaveLength(60000);
  expect(merged.slice(0, 5)).toEqual([0, 1, 2, 3, 4]);
  expect(merged[59999]).toBe(59999);
});
}`,
    hints: [
      "At each step the next node of the result is the smaller of the two current heads. Handling the very first node is the awkward part.",
      "Create a dummy node to sit in front of the result, and keep a tail pointer you append to. Return dummy.next at the end.",
      "While a and b are both non-null, attach whichever has val <= the other (prefer a on ties) and advance it. Then attach whatever remains of a or b.",
    ],
    solution: `function mergeLists(a, b) {
  const dummy = { val: null, next: null };
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { // <= keeps the merge stable
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  tail.next = a || b; // the leftover is already sorted
  return dummy.next;
}`,
    explanation: `This is the merge step from merge sort, done with pointers. At each step the smallest remaining node is the smaller of the two heads, so you attach it to the result and advance that list. When one list runs out, the rest of the other is already sorted and can be attached in one move.

The dummy node removes the special case for the first node: you always append to \`tail.next\`, and the real head is \`dummy.next\`. It's O(n + m) time and O(1) extra space.

Using \`<\` instead of \`<=\` takes \`b\`'s node first on ties, which breaks stability. A recursive merge is shorter but uses one stack frame per node and overflows on long lists.

Follow-up: merge k sorted lists. Pairwise merging works; a min-heap of the k heads does it in O(N log k).`,
  },
  {
    id: "cs-binary-search",
    title: "Find the first match with binary search",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 20,
    tags: ["binary search", "arrays"],
    prompt: `A log viewer keeps event timestamps in a sorted array and needs to jump to the first event at a given time. Write \`firstIndexOf(sorted, target)\` that returns the index of the **first** element equal to \`target\`, or \`-1\` if it isn't there.

- \`sorted\` is in ascending order and may contain duplicates.
- Use O(log n) reads. The tests count how many array elements you read, so \`indexOf\` or a linear scan will fail on the large case.

\`\`\`
firstIndexOf([1, 3, 3, 3, 8], 3) // 1
firstIndexOf([1, 3, 8], 5)       // -1
firstIndexOf([], 1)              // -1
\`\`\``,
    starter: `function firstIndexOf(sorted, target) {
  // your code here
}`,
    tests: `{
// Wraps an array in a Proxy that counts element reads.
const counted = (arr) => {
  const stats = { reads: 0 };
  const proxy = new Proxy(arr, {
    get(t, k, r) {
      if (typeof k === "string" && k !== "" && Number.isInteger(Number(k))) stats.reads++;
      return Reflect.get(t, k, r);
    },
  });
  return [proxy, stats];
};
test("returns -1 for an empty array", () => {
  expect(firstIndexOf([], 1)).toBe(-1);
});
test("finds the only element", () => {
  expect(firstIndexOf([5], 5)).toBe(0);
});
test("finds elements at the start, middle and end", () => {
  const arr = [1, 3, 5, 7, 9, 11];
  expect(firstIndexOf(arr, 1)).toBe(0);
  expect(firstIndexOf(arr, 7)).toBe(3);
  expect(firstIndexOf(arr, 11)).toBe(5);
});
test("returns -1 for values that are missing", () => {
  const arr = [1, 3, 5, 7];
  expect(firstIndexOf(arr, 0)).toBe(-1);
  expect(firstIndexOf(arr, 4)).toBe(-1);
  expect(firstIndexOf(arr, 8)).toBe(-1);
});
test("returns the first index among duplicates", () => {
  expect(firstIndexOf([1, 3, 3, 3, 8], 3)).toBe(1);
  expect(firstIndexOf([2, 2, 2, 2, 2], 2)).toBe(0);
});
test("finds the first duplicate in a large array with few reads", () => {
  const arr = [];
  for (let i = 0; i < 1000000; i++) arr.push(Math.floor(i / 1000));
  const [proxy, stats] = counted(arr);
  expect(firstIndexOf(proxy, 512)).toBe(512000);
  expect(stats.reads).toBeLessThanOrEqual(60);
});
test("reports a missing value in a large array with few reads", () => {
  const arr = Array.from({ length: 1000000 }, (_, i) => i * 2);
  const [proxy, stats] = counted(arr);
  expect(firstIndexOf(proxy, 777777)).toBe(-1);
  expect(stats.reads).toBeLessThanOrEqual(60);
});
}`,
    hints: [
      "A normal binary search stops as soon as it sees the target, but that might be the second or tenth copy. What if you didn't stop?",
      "Search for the leftmost position where sorted[i] >= target. When sorted[mid] >= target, the answer is at mid or to its left.",
      "lo = 0, hi = length. While lo < hi: mid = (lo + hi) >> 1; if sorted[mid] < target then lo = mid + 1, else hi = mid. Finally check sorted[lo] === target.",
    ],
    solution: `function firstIndexOf(sorted, target) {
  // Find the leftmost index whose value is >= target (the "lower bound").
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo < sorted.length && sorted[lo] === target ? lo : -1;
}`,
    explanation: `Instead of searching for "an index equal to target", search for the boundary: the first index where the value is at least \`target\`. Everything left of it is smaller, everything from it onward is at least \`target\`. If the value at the boundary equals \`target\`, it's the first copy.

The half-open range \`[lo, hi)\` keeps the loop simple: when \`sorted[mid] < target\` the boundary is strictly right of \`mid\`, otherwise \`mid\` itself might be it, so \`hi = mid\`. The range shrinks every step, so it terminates in about log₂(n) iterations: around 20 reads for a million elements.

Common bugs: stopping at the first match (wrong index among duplicates), scanning left from a match (O(n) when there are many duplicates), and off-by-one loops that never end because \`lo = mid\` doesn't shrink the range.

Follow-up: return the range \`[first, last]\` of the target with two boundary searches, or count how many elements fall between two timestamps.`,
  },
  {
    id: "cs-search-rotated",
    title: "Search a rotated sorted array",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 30,
    tags: ["binary search", "arrays"],
    prompt: `A circular buffer of sorted IDs was rotated at some unknown pivot, so \`[1, 2, 4, 5, 7, 9]\` might be stored as \`[5, 7, 9, 1, 2, 4]\`. Write \`searchRotated(nums, target)\` that returns the index of \`target\`, or \`-1\` if it's absent.

- All values are distinct.
- The array may not be rotated at all, and may be empty.
- Use O(log n) reads. The tests count element reads on a large array, so a linear scan will fail.

\`\`\`
searchRotated([4, 5, 6, 7, 0, 1, 2], 0) // 4
searchRotated([4, 5, 6, 7, 0, 1, 2], 3) // -1
searchRotated([1, 3], 3)                // 1
\`\`\``,
    starter: `function searchRotated(nums, target) {
  // your code here
}`,
    tests: `{
const counted = (arr) => {
  const stats = { reads: 0 };
  const proxy = new Proxy(arr, {
    get(t, k, r) {
      if (typeof k === "string" && k !== "" && Number.isInteger(Number(k))) stats.reads++;
      return Reflect.get(t, k, r);
    },
  });
  return [proxy, stats];
};
const rotated = (n, by) => Array.from({ length: n }, (_, i) => ((i + by) % n) * 3);
test("returns -1 for an empty array", () => {
  expect(searchRotated([], 5)).toBe(-1);
});
test("finds a value in the rotated right half", () => {
  expect(searchRotated([4, 5, 6, 7, 0, 1, 2], 0)).toBe(4);
});
test("finds a value in the left half", () => {
  expect(searchRotated([4, 5, 6, 7, 0, 1, 2], 5)).toBe(1);
});
test("returns -1 for a missing value", () => {
  expect(searchRotated([4, 5, 6, 7, 0, 1, 2], 3)).toBe(-1);
  expect(searchRotated([4, 5, 6, 7, 0, 1, 2], 8)).toBe(-1);
});
test("works when the array is not rotated", () => {
  expect(searchRotated([1, 2, 3, 4, 5], 4)).toBe(3);
});
test("handles one and two elements", () => {
  expect(searchRotated([1], 1)).toBe(0);
  expect(searchRotated([1], 0)).toBe(-1);
  expect(searchRotated([3, 1], 1)).toBe(1);
  expect(searchRotated([3, 1], 3)).toBe(0);
});
test("finds every element of a small rotated array", () => {
  for (let by = 0; by < 7; by++) {
    const arr = rotated(7, by);
    arr.forEach((v, i) => expect(searchRotated(arr, v)).toBe(i));
  }
});
test("uses a logarithmic number of reads on a large array", () => {
  const arr = rotated(200000, 123457);
  const [proxy, stats] = counted(arr);
  expect(searchRotated(proxy, arr[150000])).toBe(150000);
  expect(searchRotated(proxy, 1)).toBe(-1);
  expect(stats.reads).toBeLessThanOrEqual(150);
});
}`,
    hints: [
      "Cut a rotated sorted array anywhere and at least one of the two halves is still plainly sorted.",
      "At each step compare nums[lo] with nums[mid] to learn which half is sorted, then check whether target falls inside that sorted half's range.",
      "If nums[lo] <= nums[mid], the left half is sorted: go left when nums[lo] <= target < nums[mid], else go right. Otherwise the right half is sorted: go right when nums[mid] < target <= nums[hi], else go left.",
    ],
    solution: `function searchRotated(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const midVal = nums[mid];
    if (midVal === target) return mid;
    const loVal = nums[lo];
    if (loVal <= midVal) {
      // Left half [lo, mid] is sorted.
      if (loVal <= target && target < midVal) hi = mid - 1;
      else lo = mid + 1;
    } else {
      // Right half [mid, hi] is sorted.
      const hiVal = nums[hi];
      if (midVal < target && target <= hiVal) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,
    explanation: `The rotation point can only be in one half of any range, so the other half is an ordinary sorted run. Comparing \`nums[lo]\` with \`nums[mid]\` tells you which: if \`nums[lo] <= nums[mid]\`, there is no drop between them and the left half is sorted. For a sorted half you can check in O(1) whether the target lies inside it; if it does you search there, otherwise in the other half.

Each iteration halves the range, so it's O(log n) time and O(1) space, with a handful of reads per step.

The usual bugs are in the boundary comparisons. Use \`<=\` in \`nums[lo] <= nums[mid]\` so a two-element range where \`lo === mid\` is treated correctly, and keep the inclusive ends (\`loVal <= target\`, \`target <= hiVal\`) on the sorted side.

Follow-up: what if values can repeat? When \`nums[lo] === nums[mid] === nums[hi]\` you can't tell which half is sorted, and the worst case degrades to O(n).`,
  },
  {
    id: "cs-merge-sort",
    title: "Implement a stable merge sort",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 30,
    tags: ["sorting", "recursion", "divide and conquer"],
    prompt: `Your table component sorts rows by a column, and users expect rows with equal values to keep their previous order. Write \`mergeSort(items, compare)\` without using the built-in \`sort\` or \`toSorted\` (the tests disable them).

- \`compare(a, b)\` works like \`Array.prototype.sort\`'s comparator: negative if \`a\` goes first, positive if \`b\` goes first, \`0\` if equal. It defaults to numeric ascending, \`(a, b) => a - b\`.
- The sort must be **stable**: items that compare as equal keep their original relative order.
- Return a new array. Don't mutate \`items\`.

\`\`\`
mergeSort([5, 2, 9, 1])  // [1, 2, 5, 9]

const rows = [{ name: "Ana", age: 30 }, { name: "Bo", age: 25 }, { name: "Cy", age: 30 }];
mergeSort(rows, (a, b) => a.age - b.age).map((r) => r.name) // ["Bo", "Ana", "Cy"]
\`\`\``,
    starter: `function mergeSort(items, compare = (a, b) => a - b) {
  // your code here
}`,
    tests: `{
// Runs fn with the built-in sorts disabled, then restores them.
const withoutBuiltInSort = (fn) => {
  const sort = Array.prototype.sort;
  const toSorted = Array.prototype.toSorted;
  Array.prototype.sort = function () { throw new Error("built-in sort is disabled for this problem"); };
  if (toSorted) Array.prototype.toSorted = Array.prototype.sort;
  try { return fn(); } finally {
    Array.prototype.sort = sort;
    if (toSorted) Array.prototype.toSorted = toSorted;
  }
};
const rand = (seed) => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
test("returns [] for an empty array", () => {
  expect(withoutBuiltInSort(() => mergeSort([]))).toEqual([]);
});
test("sorts numbers ascending by default", () => {
  expect(withoutBuiltInSort(() => mergeSort([5, 2, 9, 1, 5, 6]))).toEqual([1, 2, 5, 5, 6, 9]);
});
test("sorts numerically, not as strings", () => {
  expect(withoutBuiltInSort(() => mergeSort([10, 9, 100, 1]))).toEqual([1, 9, 10, 100]);
});
test("uses a custom comparator", () => {
  expect(withoutBuiltInSort(() => mergeSort(["pear", "fig", "banana"], (a, b) => b.length - a.length))).toEqual(["banana", "pear", "fig"]);
});
test("keeps equal items in their original order", () => {
  const rows = [
    { name: "Ana", age: 30 }, { name: "Bo", age: 25 }, { name: "Cy", age: 30 },
    { name: "Di", age: 25 }, { name: "Ed", age: 30 }, { name: "Fa", age: 20 },
  ];
  const sorted = withoutBuiltInSort(() => mergeSort(rows, (a, b) => a.age - b.age));
  expect(sorted.map((r) => r.name)).toEqual(["Fa", "Bo", "Di", "Ana", "Cy", "Ed"]);
});
test("does not mutate the input and returns a new array", () => {
  const input = [3, 1, 2];
  const out = withoutBuiltInSort(() => mergeSort(input));
  expect(input).toEqual([3, 1, 2]);
  expect(out).not.toBe(input);
  const single = [1];
  expect(withoutBuiltInSort(() => mergeSort(single))).not.toBe(single);
});
test("sorts 20,000 random numbers correctly", () => {
  const next = rand(42);
  const input = Array.from({ length: 20000 }, () => Math.floor(next() * 1000));
  const out = withoutBuiltInSort(() => mergeSort(input));
  const expected = input.slice().sort((a, b) => a - b);
  expect(out).toEqual(expected);
});
test("stays stable on a large input with many ties", () => {
  const next = rand(7);
  const input = Array.from({ length: 5000 }, (_, i) => ({ key: Math.floor(next() * 10), i }));
  const out = withoutBuiltInSort(() => mergeSort(input, (a, b) => a.key - b.key));
  let ok = out.length === 5000;
  for (let j = 1; j < out.length; j++) {
    const a = out[j - 1], b = out[j];
    if (a.key > b.key || (a.key === b.key && a.i > b.i)) ok = false;
  }
  expect(ok).toBe(true);
});
}`,
    hints: [
      "Two already-sorted arrays can be combined into one sorted array in a single linear pass. How do you get sorted halves to begin with?",
      "Split the array in half, sort each half recursively (an array of 0 or 1 items is already sorted), then merge the two halves.",
      "In the merge, take from the left half when compare(left[i], right[j]) <= 0. That 'less than or equal' is what keeps equal items in order.",
    ],
    solution: `function mergeSort(items, compare = (a, b) => a - b) {
  if (items.length <= 1) return items.slice();
  const mid = items.length >> 1;
  const left = mergeSort(items.slice(0, mid), compare);
  const right = mergeSort(items.slice(mid), compare);

  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    // <= takes from the left on ties, which keeps the sort stable
    if (compare(left[i], right[j]) <= 0) out.push(left[i++]);
    else out.push(right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}`,
    explanation: `Merge sort is divide and conquer: split the array in half, sort each half, and merge. Merging two sorted arrays takes one pass, always taking the smaller front item. Recursion bottoms out at arrays of length 0 or 1, which are trivially sorted.

There are log₂(n) levels of splitting and each level does O(n) work merging, so the total is O(n log n) in every case, with O(n) extra space for the merged arrays. The recursion depth is only O(log n), so even large inputs don't threaten the stack.

Stability comes from one character: on a tie, \`compare(left[i], right[j]) <= 0\` takes the item from the left half, which came earlier in the input. Using \`< 0\` silently makes the sort unstable. Also remember the base case should return a copy (\`items.slice()\`) so the function never hands back the caller's array.

Follow-up: write a bottom-up version that merges runs of width 1, 2, 4, … iteratively, or explain why quicksort is usually faster in practice but not stable.`,
  },
  {
    id: "cs-kth-largest",
    title: "Kth largest element",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 30,
    tags: ["quickselect", "heaps", "selection"],
    prompt: `A leaderboard needs the score that ranks kth from the top. Write \`kthLargest(nums, k)\` that returns the kth largest number in the array, counting duplicates (so in \`[5, 5, 4]\` the 2nd largest is \`5\`).

- \`k\` is 1-based: \`k = 1\` is the maximum, \`k = nums.length\` is the minimum.
- Throw a \`RangeError\` if \`k\` is not an integer between 1 and \`nums.length\`.
- Don't mutate \`nums\`.
- Aim for better than sorting: average O(n) with quickselect, or O(n log k) with a size-k min-heap.

\`\`\`
kthLargest([3, 2, 1, 5, 6, 4], 2)          // 5
kthLargest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) // 4
\`\`\``,
    starter: `function kthLargest(nums, k) {
  // your code here
}`,
    tests: `test("finds the 2nd largest", () => {
  expect(kthLargest([3, 2, 1, 5, 6, 4], 2)).toBe(5);
});
test("counts duplicates", () => {
  expect(kthLargest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4)).toBe(4);
  expect(kthLargest([5, 5, 4], 2)).toBe(5);
});
test("k = 1 is the maximum and k = length is the minimum", () => {
  const nums = [7, -2, 15, 0, 3];
  expect(kthLargest(nums, 1)).toBe(15);
  expect(kthLargest(nums, 5)).toBe(-2);
});
test("works with a single element", () => {
  expect(kthLargest([42], 1)).toBe(42);
});
test("does not mutate the input", () => {
  const nums = [9, 1, 8, 2, 7, 3];
  kthLargest(nums, 3);
  expect(nums).toEqual([9, 1, 8, 2, 7, 3]);
});
test("throws a RangeError for an out-of-range k", () => {
  const isRangeError = (fn) => { try { fn(); return false; } catch (e) { return e instanceof RangeError; } };
  expect(isRangeError(() => kthLargest([1, 2, 3], 0))).toBe(true);
  expect(isRangeError(() => kthLargest([1, 2, 3], 4))).toBe(true);
  expect(isRangeError(() => kthLargest([], 1))).toBe(true);
});
test("handles a large array full of duplicates", () => {
  const nums = Array.from({ length: 100000 }, (_, i) => i % 3);
  expect(kthLargest(nums, 1)).toBe(2);
  expect(kthLargest(nums, 50000)).toBe(1);
  expect(kthLargest(nums, 100000)).toBe(0);
});
test("handles a large sorted array", () => {
  const nums = Array.from({ length: 100000 }, (_, i) => i);
  expect(kthLargest(nums, 10)).toBe(99990);
});`,
    hints: [
      "You don't need the whole array sorted, only to know which value would land at one particular index if it were.",
      "Quickselect: partition a copy around a random pivot like quicksort, then continue only into the side that contains the target index (length - k in ascending order).",
      "Use a three-way partition (less than, equal to, greater than the pivot) so arrays with many duplicates don't degrade. If the target index lands in the 'equal' block, the pivot is the answer.",
    ],
    solution: `function kthLargest(nums, k) {
  if (!Number.isInteger(k) || k < 1 || k > nums.length) {
    throw new RangeError("k must be between 1 and " + nums.length);
  }
  const a = nums.slice();
  const target = a.length - k; // index of the answer in ascending order
  let lo = 0;
  let hi = a.length - 1;
  while (true) {
    const pivot = a[lo + Math.floor(Math.random() * (hi - lo + 1))];
    // Three-way partition: [lo, lt) < pivot, [lt, gt] === pivot, (gt, hi] > pivot
    let lt = lo;
    let gt = hi;
    let i = lo;
    while (i <= gt) {
      if (a[i] < pivot) { [a[lt], a[i]] = [a[i], a[lt]]; lt++; i++; }
      else if (a[i] > pivot) { [a[i], a[gt]] = [a[gt], a[i]]; gt--; }
      else i++;
    }
    if (target < lt) hi = lt - 1;
    else if (target > gt) lo = gt + 1;
    else return a[target];
  }
}`,
    explanation: `The kth largest is the value at index \`length - k\` of the sorted array. Quickselect finds it without sorting everything: partition around a pivot, and the pivot's final position tells you which side the target is on. Unlike quicksort, you recurse into only one side, so the expected work is n + n/2 + n/4 + … = O(n).

A random pivot avoids the O(n²) worst case on already-sorted input, and the three-way partition keeps arrays with many equal values fast: all copies of the pivot land in one block and are settled at once. Working on a copy keeps the input untouched, at O(n) extra space.

The min-heap alternative keeps the k largest values seen so far; any value bigger than the heap's top replaces it. That's O(n log k) and is the better choice for a stream where you can't hold everything in memory.

Common mistakes: an off-by-one between 1-based \`k\` and 0-based indices, mutating the caller's array, and a two-way partition that goes quadratic when every element is equal. Follow-up: return the top k elements themselves, in order.`,
  },
  {
    id: "cs-min-heap",
    title: "Build a MinHeap priority queue",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 35,
    tags: ["heaps", "priority queue", "design"],
    prompt: `A task scheduler always runs the job with the earliest deadline next. Implement a \`MinHeap\` class backed by an array.

- \`new MinHeap(compare)\`: \`compare(a, b)\` returns a negative number when \`a\` should come out first. It defaults to \`(a, b) => a - b\`.
- \`push(value)\` adds a value in O(log n).
- \`pop()\` removes and returns the smallest value in O(log n), or \`undefined\` when empty.
- \`peek()\` returns the smallest value without removing it, or \`undefined\` when empty.
- \`size()\` returns the number of values.

Duplicates are allowed. The tests push and pop tens of thousands of values.

\`\`\`
const h = new MinHeap();
h.push(5); h.push(1); h.push(3);
h.peek(); // 1
h.pop();  // 1
h.pop();  // 3

const jobs = new MinHeap((a, b) => a.due - b.due);
\`\`\``,
    starter: `class MinHeap {
  constructor(compare = (a, b) => a - b) {
    // your code here
  }
  push(value) {}
  pop() {}
  peek() {}
  size() {}
}`,
    tests: `{
const rand = (seed) => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
test("an empty heap returns undefined and has size 0", () => {
  const h = new MinHeap();
  expect(h.pop()).toBeUndefined();
  expect(h.peek()).toBeUndefined();
  expect(h.size()).toBe(0);
});
test("peek returns the smallest value without removing it", () => {
  const h = new MinHeap();
  h.push(5); h.push(1); h.push(3);
  expect(h.peek()).toBe(1);
  expect(h.size()).toBe(3);
});
test("pops values in ascending order", () => {
  const h = new MinHeap();
  [5, 3, 8, 1, 9, 2, 7].forEach((x) => h.push(x));
  const out = [];
  while (h.size()) out.push(h.pop());
  expect(out).toEqual([1, 2, 3, 5, 7, 8, 9]);
});
test("handles duplicates and negative numbers", () => {
  const h = new MinHeap();
  [2, -1, 2, 0, -1].forEach((x) => h.push(x));
  expect([h.pop(), h.pop(), h.pop(), h.pop(), h.pop()]).toEqual([-1, -1, 0, 2, 2]);
  expect(h.pop()).toBeUndefined();
});
test("uses a custom comparator", () => {
  const h = new MinHeap((a, b) => a.due - b.due);
  h.push({ id: "email", due: 30 });
  h.push({ id: "deploy", due: 10 });
  h.push({ id: "backup", due: 20 });
  expect([h.pop().id, h.pop().id, h.pop().id]).toEqual(["deploy", "backup", "email"]);
});
test("works as a max-heap with a reversed comparator", () => {
  const h = new MinHeap((a, b) => b - a);
  [4, 9, 1].forEach((x) => h.push(x));
  expect(h.pop()).toBe(9);
});
test("keeps order with interleaved pushes and pops", () => {
  const h = new MinHeap();
  h.push(10); h.push(4);
  expect(h.pop()).toBe(4);
  h.push(1); h.push(7);
  expect(h.pop()).toBe(1);
  expect(h.pop()).toBe(7);
  h.push(3);
  expect(h.pop()).toBe(3);
  expect(h.pop()).toBe(10);
  expect(h.size()).toBe(0);
});
test("sorts 30,000 random values quickly", () => {
  const next = rand(99);
  const values = Array.from({ length: 30000 }, () => Math.floor(next() * 100000));
  const start = Date.now();
  const h = new MinHeap();
  values.forEach((v) => h.push(v));
  const out = [];
  while (h.size()) out.push(h.pop());
  expect(Date.now() - start).toBeLessThan(1500);
  expect(out).toEqual(values.slice().sort((a, b) => a - b));
});
}`,
    hints: [
      "Store the heap as an array where the children of index i live at 2i + 1 and 2i + 2, and its parent at (i - 1) >> 1. The smallest value is always at index 0.",
      "push: append to the end, then 'sift up' by swapping with the parent while it's smaller. pop: save index 0, move the last element to index 0, then 'sift down'.",
      "Sift down: repeatedly find the smaller of the (up to two) children; if it's smaller than the current node, swap and continue from that child, otherwise stop. Handle the size-1 case so you don't re-insert the element you just removed.",
    ],
    solution: `class MinHeap {
  constructor(compare = (a, b) => a - b) {
    this.compare = compare;
    this.items = [];
  }
  size() {
    return this.items.length;
  }
  peek() {
    return this.items[0];
  }
  push(value) {
    const a = this.items;
    a.push(value);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(a[i], a[parent]) >= 0) break;
      [a[i], a[parent]] = [a[parent], a[i]];
      i = parent;
    }
  }
  pop() {
    const a = this.items;
    if (a.length === 0) return undefined;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      while (true) {
        const left = 2 * i + 1;
        const right = left + 1;
        let smallest = i;
        if (left < a.length && this.compare(a[left], a[smallest]) < 0) smallest = left;
        if (right < a.length && this.compare(a[right], a[smallest]) < 0) smallest = right;
        if (smallest === i) break;
        [a[i], a[smallest]] = [a[smallest], a[i]];
        i = smallest;
      }
    }
    return top;
  }
}`,
    explanation: `A binary heap is a complete binary tree stored in an array, with the rule that every parent is no larger than its children. That rule puts the minimum at index 0, so \`peek\` is O(1). Because the tree is complete, its height is log₂(n), and both \`push\` and \`pop\` only walk one root-to-leaf path, making them O(log n).

\`push\` appends the value as a new leaf and sifts it up past any larger parents. \`pop\` takes the root, moves the last leaf into the hole, and sifts it down, always swapping with the smaller child so the heap rule holds for both subtrees.

The classic bugs: swapping with the first child that's smaller instead of the smallest child, forgetting the case where only a left child exists, and in \`pop\` writing the last element back into index 0 after the heap has become empty. A sorted array with insertion also "works" but makes \`push\` O(n).

Follow-up: build a heap from an existing array in O(n) by sifting down from the last parent to the root, or add a \`decreaseKey\` operation for Dijkstra's algorithm.`,
  },
  {
    id: "cs-validate-bst",
    title: "Validate a binary search tree",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["trees", "recursion", "BST"],
    prompt: `An index service stores keys in a binary search tree, and after a bad migration you need to check its integrity. Nodes are shaped \`{ val, left, right }\` with \`null\` for a missing child. Write \`isValidBST(root)\` that returns \`true\` if, for every node, **all** values in its left subtree are strictly less than its value and **all** values in its right subtree are strictly greater.

- An empty tree (\`null\`) is valid.
- Duplicate values make the tree invalid.
- Values are numbers and can be negative or very large.

The examples show trees in level order, with \`null\` for gaps.

\`\`\`
[2, 1, 3]                       // true
[5, 1, 4, null, null, 3, 6]     // false, 4 is in 5's right subtree
[5, 4, 6, null, null, 3, 7]     // false, 3 is in 5's right subtree
\`\`\``,
    starter: `function isValidBST(root) {
  // your code here
}`,
    tests: `{
// Builds a tree from a level-order array with nulls for missing children.
const tree = (arr) => {
  if (!arr.length || arr[0] == null) return null;
  const make = (val) => ({ val, left: null, right: null });
  const root = make(arr[0]);
  const queue = [root];
  let i = 1;
  while (queue.length && i < arr.length) {
    const node = queue.shift();
    if (i < arr.length && arr[i] != null) { node.left = make(arr[i]); queue.push(node.left); }
    i++;
    if (i < arr.length && arr[i] != null) { node.right = make(arr[i]); queue.push(node.right); }
    i++;
  }
  return root;
};
test("an empty tree is valid", () => {
  expect(isValidBST(null)).toBe(true);
});
test("a single node is valid", () => {
  expect(isValidBST(tree([1]))).toBe(true);
});
test("accepts a small valid tree", () => {
  expect(isValidBST(tree([2, 1, 3]))).toBe(true);
  expect(isValidBST(tree([8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7]))).toBe(true);
});
test("rejects a child on the wrong side of its parent", () => {
  expect(isValidBST(tree([5, 1, 4, null, null, 3, 6]))).toBe(false);
});
test("rejects a grandchild that breaks an ancestor's bound", () => {
  expect(isValidBST(tree([5, 4, 6, null, null, 3, 7]))).toBe(false);
  expect(isValidBST(tree([10, 5, 15, null, 12]))).toBe(false);
});
test("rejects duplicate values", () => {
  expect(isValidBST(tree([2, 2]))).toBe(false);
  expect(isValidBST(tree([2, null, 2]))).toBe(false);
});
test("handles negative and very large values", () => {
  expect(isValidBST(tree([0, -Number.MAX_VALUE, Number.MAX_VALUE]))).toBe(true);
  expect(isValidBST(tree([-1, -5, 0, -10, -2]))).toBe(true);
});
test("accepts a right-leaning chain", () => {
  let root = null;
  for (let v = 300; v >= 1; v--) root = { val: v, left: null, right: root };
  expect(isValidBST(root)).toBe(true);
});
}`,
    hints: [
      "Checking each node only against its direct children isn't enough: a node deep in the right subtree must still be greater than the root.",
      "Pass down an allowed range (low, high) as you recurse. Going left tightens the upper bound; going right tightens the lower bound.",
      "valid(node, low, high): null is valid; if node.val <= low or node.val >= high return false; otherwise return valid(left, low, node.val) && valid(right, node.val, high). Start with -Infinity and Infinity.",
    ],
    solution: `function isValidBST(root) {
  // Each node must fall strictly inside the range set by its ancestors.
  const valid = (node, low, high) => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return valid(node.left, low, node.val) && valid(node.right, node.val, high);
  };
  return valid(root, -Infinity, Infinity);
}`,
    explanation: `The BST rule is about whole subtrees, not just children. In \`[5, 4, 6, null, null, 3, 7]\` every parent-child pair looks fine, but 3 sits in 5's right subtree, so the tree is invalid. The fix is to carry the bounds every ancestor imposes: going left from a node sets a new upper bound, going right sets a new lower bound.

Each node is visited once, so it's O(n) time, with O(h) stack space for a tree of height h. Starting the bounds at \`-Infinity\` and \`Infinity\` avoids sentinel bugs; using something like \`Number.MIN_SAFE_INTEGER\` as a sentinel fails on trees that legitimately contain that value.

An equivalent approach is an in-order traversal: a valid BST yields a strictly increasing sequence, so you only need to compare each value with the previous one. Using \`<\` instead of \`<=\` in either version lets duplicates slip through.

Follow-up: two nodes of a BST were swapped by mistake. Find and fix them without changing the tree's structure.`,
  },
);
