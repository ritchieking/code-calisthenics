(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "cs-max-depth",
    title: "Maximum depth of a binary tree",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 10,
    tags: ["trees", "recursion"],
    prompt: `A nested comment thread is stored as a binary tree, and the UI needs to know how deep the indentation goes. Nodes are shaped \`{ val, left, right }\` with \`null\` for a missing child. Write \`maxDepth(root)\` that returns the number of nodes on the longest path from the root down to a leaf.

- An empty tree (\`null\`) has depth \`0\`.
- A single node has depth \`1\`.

The examples show trees in level order, with \`null\` for gaps.

\`\`\`
[3, 9, 20, null, null, 15, 7]  // 3
[1, null, 2]                   // 2
\`\`\``,
    starter: `function maxDepth(root) {
  // your code here
}`,
    tests: `{
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
test("returns 0 for an empty tree", () => {
  expect(maxDepth(null)).toBe(0);
});
test("returns 1 for a single node", () => {
  expect(maxDepth(tree([1]))).toBe(1);
});
test("measures a balanced tree", () => {
  expect(maxDepth(tree([3, 9, 20, null, null, 15, 7]))).toBe(3);
  expect(maxDepth(tree([1, 2, 3, 4, 5, 6, 7]))).toBe(3);
});
test("follows a tree that only has right children", () => {
  expect(maxDepth(tree([1, null, 2]))).toBe(2);
});
test("finds the deepest branch even when it is not the leftmost", () => {
  expect(maxDepth(tree([1, 2, 3, null, null, 4, null, 5]))).toBe(4);
});
test("handles a long left-leaning chain", () => {
  let root = null;
  for (let i = 0; i < 1000; i++) root = { val: i, left: root, right: null };
  expect(maxDepth(root)).toBe(1000);
});
}`,
    hints: [
      "The depth of a tree is defined in terms of the depths of its two subtrees.",
      "Recurse: an empty tree has depth 0; any other tree is one more than the deeper of its children.",
      "return root ? 1 + Math.max(maxDepth(root.left), maxDepth(root.right)) : 0",
    ],
    solution: `function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
    explanation: `Trees are recursive structures, so many tree questions have a recursive answer that mirrors the definition. The depth of an empty tree is 0, and the depth of any other tree is the root itself plus the deeper of its two subtrees.

Every node is visited once, so the time is O(n). The space is O(h) for the call stack, where h is the height: O(log n) for a balanced tree, O(n) for a chain.

The usual slip is the base case. Returning 1 for a leaf and forgetting \`null\`, or counting edges instead of nodes, gives answers that are off by one. Read the definition in the prompt carefully; here, depth counts nodes.

Follow-up: write it iteratively with a level-by-level BFS (the depth is the number of levels), which avoids stack overflow on very deep trees. Or find the minimum depth, where you must be careful that a node with one child is not a leaf.`,
  },
  {
    id: "cs-level-order",
    title: "Level-order traversal",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 20,
    tags: ["trees", "BFS", "queues"],
    prompt: `An org chart is stored as a binary tree, and you want to render it one row per management level. Nodes are shaped \`{ val, left, right }\` with \`null\` for a missing child. Write \`levelOrder(root)\` that returns an array of levels, top to bottom, where each level lists its values left to right.

- An empty tree returns \`[]\`.
- Levels with gaps still list only the nodes that exist.

The examples show trees in level order, with \`null\` for gaps.

\`\`\`
[3, 9, 20, null, null, 15, 7]  // [[3], [9, 20], [15, 7]]
[1, 2, 3, 4, null, null, 5]    // [[1], [2, 3], [4, 5]]
\`\`\``,
    starter: `function levelOrder(root) {
  // your code here
}`,
    tests: `{
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
test("returns [] for an empty tree", () => {
  expect(levelOrder(null)).toEqual([]);
});
test("returns one level for a single node", () => {
  expect(levelOrder(tree([1]))).toEqual([[1]]);
});
test("groups values by level", () => {
  expect(levelOrder(tree([3, 9, 20, null, null, 15, 7]))).toEqual([[3], [9, 20], [15, 7]]);
});
test("lists each level left to right across different parents", () => {
  expect(levelOrder(tree([1, 2, 3, 4, null, null, 5]))).toEqual([[1], [2, 3], [4, 5]]);
});
test("handles a lopsided tree", () => {
  expect(levelOrder(tree([1, 2, null, 3, null, 4]))).toEqual([[1], [2], [3], [4]]);
});
test("works with string values", () => {
  expect(levelOrder(tree(["ceo", "cto", "cfo", "eng", "design"]))).toEqual([["ceo"], ["cto", "cfo"], ["eng", "design"]]);
});
test("handles a full tree with many levels", () => {
  const arr = Array.from({ length: 1023 }, (_, i) => i);
  const levels = levelOrder(tree(arr));
  expect(levels).toHaveLength(10);
  expect(levels[9]).toHaveLength(512);
  expect(levels[3]).toEqual([7, 8, 9, 10, 11, 12, 13, 14]);
});
}`,
    hints: [
      "Visiting nodes in order of distance from the root is breadth-first search, which uses a queue.",
      "The tricky part is knowing where one level ends. At the start of each round, the queue holds exactly one full level.",
      "While the queue is non-empty: let count = queue.length; pull exactly count nodes, collect their values into one array, and enqueue their non-null children. Push that array onto the result.",
    ],
    solution: `function levelOrder(root) {
  if (!root) return [];
  const levels = [];
  let queue = [root];
  while (queue.length) {
    const next = [];
    const values = [];
    for (const node of queue) {
      values.push(node.val);
      if (node.left) next.push(node.left);
      if (node.right) next.push(node.right);
    }
    levels.push(values);
    queue = next; // the children form the next level
  }
  return levels;
}`,
    explanation: `Breadth-first search visits nodes in order of their distance from the root. To split the output into levels, process the tree one level at a time: the current array holds every node at depth d, and while reading it you collect their children, which are exactly the nodes at depth d + 1.

Swapping in a fresh \`next\` array each round sidesteps \`Array.prototype.shift\`, which is O(n) per call in JavaScript and can make a naive queue O(n²) on wide trees. The total work is O(n) time and O(w) extra space, where w is the widest level.

A common mistake is checking \`queue.length\` inside the inner loop while also pushing children, so levels bleed into each other. Snapshotting the level (or its size) first fixes it.

Follow-up: return the levels in zigzag order (alternating left-to-right and right-to-left), or return only the rightmost value of each level, which is what you'd see looking at the tree from the right.`,
  },
  {
    id: "cs-lca-bst",
    title: "Lowest common ancestor in a BST",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 20,
    tags: ["trees", "BST"],
    prompt: `Categories in a product catalog are stored as a binary search tree keyed by category ID. Nodes are shaped \`{ val, left, right }\`; left subtrees hold smaller values and right subtrees larger ones, with no duplicates. Write \`lowestCommonAncestor(root, p, q)\` that returns the **node** that is the deepest common ancestor of the nodes with values \`p\` and \`q\`.

- Both \`p\` and \`q\` are guaranteed to be in the tree.
- A node counts as an ancestor of itself, so if \`p\` is above \`q\`, the answer is \`p\`'s node.
- \`p\` may be greater than \`q\`, and they may be equal.
- Use the BST ordering: the tests include a tree that is 5,000 levels deep.

\`\`\`
//         6
//       /   \\
//      2     8
//     / \\   / \\
//    0   4 7   9
//       / \\
//      3   5
lowestCommonAncestor(root, 2, 8).val // 6
lowestCommonAncestor(root, 2, 4).val // 2
lowestCommonAncestor(root, 3, 5).val // 4
\`\`\``,
    starter: `function lowestCommonAncestor(root, p, q) {
  // your code here
}`,
    tests: `{
const insert = (root, val) => {
  const node = { val, left: null, right: null };
  if (!root) return node;
  let cur = root;
  while (true) {
    const side = val < cur.val ? "left" : "right";
    if (!cur[side]) { cur[side] = node; return root; }
    cur = cur[side];
  }
};
const bst = (vals) => vals.reduce(insert, null);
const find = (root, val) => { let n = root; while (n && n.val !== val) n = val < n.val ? n.left : n.right; return n; };
const sample = () => bst([6, 2, 8, 0, 4, 7, 9, 3, 5]);
test("finds the root when the values are on opposite sides", () => {
  const root = sample();
  expect(lowestCommonAncestor(root, 2, 8)).toBe(root);
});
test("returns the node itself when one value is an ancestor of the other", () => {
  const root = sample();
  expect(lowestCommonAncestor(root, 2, 4)).toBe(find(root, 2));
});
test("finds an ancestor deeper in the tree", () => {
  const root = sample();
  expect(lowestCommonAncestor(root, 3, 5).val).toBe(4);
  expect(lowestCommonAncestor(root, 0, 5).val).toBe(2);
});
test("does not depend on the order of p and q", () => {
  const root = sample();
  expect(lowestCommonAncestor(root, 9, 7).val).toBe(8);
  expect(lowestCommonAncestor(root, 5, 0).val).toBe(2);
});
test("returns the node when p and q are the same value", () => {
  const root = sample();
  expect(lowestCommonAncestor(root, 7, 7)).toBe(find(root, 7));
});
test("returns the actual node object, not a copy", () => {
  const root = sample();
  const result = lowestCommonAncestor(root, 3, 5);
  expect(result).toBe(find(root, 4));
});
test("handles a tree 5,000 levels deep", () => {
  let root = null;
  for (let v = 5000; v >= 1; v--) root = { val: v, left: null, right: root };
  expect(lowestCommonAncestor(root, 4999, 5000).val).toBe(4999);
  expect(lowestCommonAncestor(root, 1, 5000)).toBe(root);
});
}`,
    hints: [
      "In a BST you always know which direction a value lies in. Where do the paths to p and q stop going the same way?",
      "Start at the root. If both values are smaller than the current node, both are in the left subtree; if both are larger, both are on the right.",
      "Loop: if p < node.val and q < node.val go left; else if p > node.val and q > node.val go right; otherwise return node (they split here, or one of them is this node).",
    ],
    solution: `function lowestCommonAncestor(root, p, q) {
  let node = root;
  while (node) {
    if (p < node.val && q < node.val) node = node.left;
    else if (p > node.val && q > node.val) node = node.right;
    else return node; // p and q split here, or one of them is this node
  }
  return null;
}`,
    explanation: `In a BST, the path from the root to any value is forced: go left for smaller values, right for larger ones. The paths to \`p\` and \`q\` share a prefix, and the lowest common ancestor is the last node on that shared prefix. That's the first node where the two values don't both go the same direction, either because they fall on opposite sides or because the node is one of them.

The loop walks one path down the tree, so it runs in O(h) time with O(1) space. A while loop instead of recursion keeps it safe on very unbalanced trees, like the 5,000-deep chain in the tests.

A common mistake is ignoring the BST property and using the general binary-tree algorithm, which searches both subtrees and costs O(n). It still works, but it misses the point of the question, and a recursive version can overflow on deep trees.

Follow-up: solve it for a plain binary tree with no ordering, where you recurse into both children and the LCA is the node where both sides report a match.`,
  },
  {
    id: "cs-number-of-islands",
    title: "Count the islands on a map",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["graphs", "grids", "BFS", "DFS"],
    prompt: `A map tile renderer needs to count separate landmasses. The map is an array of equal-length strings where \`"1"\` is land and \`"0"\` is water. Write \`numIslands(grid)\` that returns how many islands there are.

- An island is a group of land cells connected **horizontally or vertically**. Diagonal neighbors don't connect.
- An empty grid (\`[]\`) has 0 islands.
- Grids can be up to 300 × 300, so a recursive flood fill may overflow the call stack. Use an explicit stack or queue.

\`\`\`
numIslands([
  "11000",
  "11000",
  "00100",
  "00011",
]) // 3
\`\`\``,
    starter: `function numIslands(grid) {
  // your code here
}`,
    tests: `test("returns 0 for an empty grid", () => {
  expect(numIslands([])).toBe(0);
});
test("returns 0 when there is only water", () => {
  expect(numIslands(["000", "000"])).toBe(0);
});
test("counts one large island", () => {
  expect(numIslands(["11110", "11010", "11000", "00000"])).toBe(1);
});
test("counts several islands", () => {
  expect(numIslands(["11000", "11000", "00100", "00011"])).toBe(3);
});
test("does not connect diagonal neighbors", () => {
  expect(numIslands(["101", "010", "101"])).toBe(5);
});
test("counts a single cell and a single row", () => {
  expect(numIslands(["1"])).toBe(1);
  expect(numIslands(["1011101"])).toBe(3);
});
test("handles an island that winds around", () => {
  expect(numIslands(["11111", "00001", "11101", "10001", "11111"])).toBe(1);
});
test("handles a 300 x 300 grid of solid land", () => {
  const grid = Array.from({ length: 300 }, () => "1".repeat(300));
  expect(numIslands(grid)).toBe(1);
});
test("handles a large checkerboard", () => {
  const grid = Array.from({ length: 100 }, (_, r) => Array.from({ length: 100 }, (_, c) => ((r + c) % 2 ? "0" : "1")).join(""));
  expect(numIslands(grid)).toBe(5000);
});`,
    hints: [
      "Each time you find a land cell you haven't seen before, you've found a new island. The work is making sure you never count its other cells again.",
      "When you find unvisited land, increment the count and flood-fill from it, marking every connected land cell as visited.",
      "Keep a visited array of booleans indexed by r * cols + c. For the flood fill, push the start cell on a stack; pop a cell, and push each of its four in-bounds neighbors that are '1' and unvisited (mark them visited when you push).",
    ],
    solution: `function numIslands(grid) {
  const rows = grid.length;
  if (rows === 0) return 0;
  const cols = grid[0].length;
  const seen = new Uint8Array(rows * cols);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let count = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== "1" || seen[r * cols + c]) continue;
      count++;
      // Flood fill this island with an explicit stack.
      const stack = [[r, c]];
      seen[r * cols + c] = 1;
      while (stack.length) {
        const [cr, cc] = stack.pop();
        for (const [dr, dc] of dirs) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          if (grid[nr][nc] !== "1" || seen[nr * cols + nc]) continue;
          seen[nr * cols + nc] = 1;
          stack.push([nr, nc]);
        }
      }
    }
  }
  return count;
}`,
    explanation: `Treat the grid as a graph whose nodes are land cells and whose edges join horizontal and vertical neighbors. Islands are its connected components. Scan every cell; whenever you hit land you haven't visited, that's a new component, so count it and flood-fill the whole thing so none of its cells is counted again.

Every cell is visited a constant number of times, so the time is O(rows × cols), and the visited array is the same size. Marking a cell visited when you push it (not when you pop it) keeps it from being pushed several times.

A recursive DFS is the textbook version, but on a 300 × 300 grid of land it recurses 90,000 levels deep and overflows JavaScript's call stack. An explicit stack (DFS) or queue (BFS) avoids that. Another common mistake is checking diagonals, which merges islands that should be separate.

Follow-up: return the size of the largest island, or handle a stream of "add land at (r, c)" updates with union-find so each update doesn't rescan the map.`,
  },
  {
    id: "cs-grid-shortest-path",
    title: "Shortest path through a floor plan",
    track: "CS fundamentals",
    level: "Hard",
    minutes: 40,
    tags: ["graphs", "BFS", "grids"],
    prompt: `An indoor navigation app routes visitors through a floor plan. The plan is an array of equal-length strings: \`"S"\` is the start, \`"E"\` is the exit, \`"."\` is open floor and \`"#"\` is a wall. Each plan has exactly one \`S\` and one \`E\`. Write \`shortestPath(grid)\` that returns a shortest route as an array of \`[row, col]\` cells.

- Moves go up, down, left or right, one cell at a time, never through walls or off the grid.
- The route starts with the \`S\` cell and ends with the \`E\` cell, so a route of k moves has k + 1 cells.
- Return \`[]\` if the exit can't be reached.
- When several shortest routes exist, any one is accepted. The tests check that your route is valid and has the minimum length.

\`\`\`
shortestPath([
  "S.#",
  "..#",
  "#.E",
]) // [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] (or [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]])
\`\`\``,
    starter: `function shortestPath(grid) {
  // your code here
}`,
    tests: `{
const locate = (grid, ch) => {
  for (let r = 0; r < grid.length; r++) { const c = grid[r].indexOf(ch); if (c !== -1) return [r, c]; }
  return null;
};
// Checks that path is a valid route of exactly expectedCells cells.
const expectValidRoute = (grid, path, expectedCells) => {
  expect(Array.isArray(path)).toBe(true);
  expect(path).toHaveLength(expectedCells);
  expect(path[0]).toEqual(locate(grid, "S"));
  expect(path[path.length - 1]).toEqual(locate(grid, "E"));
  for (let i = 0; i < path.length; i++) {
    const [r, c] = path[i];
    expect(r >= 0 && r < grid.length && c >= 0 && c < grid[0].length).toBe(true);
    expect(grid[r][c]).not.toBe("#");
    if (i > 0) {
      const [pr, pc] = path[i - 1];
      expect(Math.abs(pr - r) + Math.abs(pc - c)).toBe(1);
    }
  }
};
test("returns both cells when the exit is adjacent", () => {
  const grid = ["SE"];
  expect(shortestPath(grid)).toEqual([[0, 0], [0, 1]]);
});
test("finds a route around walls", () => {
  const grid = ["S.#", "..#", "#.E"];
  expectValidRoute(grid, shortestPath(grid), 5);
});
test("returns [] when the exit is walled off", () => {
  expect(shortestPath(["S#.", "##.", "..E"])).toEqual([]);
});
test("finds the shortest of several routes, not just any route", () => {
  const grid = [
    "S....",
    ".###.",
    ".#E..",
    ".###.",
    ".....",
  ];
  expectValidRoute(grid, shortestPath(grid), 9);
});
test("follows a winding corridor", () => {
  const grid = [
    "S#...",
    ".#.#.",
    ".#.#.",
    "...#E",
  ];
  expectValidRoute(grid, shortestPath(grid), 14);
});
test("does not mutate the grid", () => {
  const grid = ["S..", ".#.", "..E"];
  const copy = grid.slice();
  shortestPath(grid);
  expect(grid).toEqual(copy);
});
test("handles a large open floor quickly", () => {
  const n = 150;
  const grid = Array.from({ length: n }, (_, r) => {
    let row = ".".repeat(n);
    if (r === 0) row = "S" + row.slice(1);
    if (r === n - 1) row = row.slice(0, n - 1) + "E";
    return row;
  });
  const start = Date.now();
  const path = shortestPath(grid);
  expect(Date.now() - start).toBeLessThan(1000);
  expectValidRoute(grid, path, 2 * n - 1);
});
test("handles a large maze with a long serpentine route", () => {
  // Walls on every other row, with a gap alternating between the right and left edge.
  const n = 61;
  const grid = [];
  for (let r = 0; r < n; r++) {
    if (r % 2 === 0) grid.push(".".repeat(n));
    else if (r % 4 === 1) grid.push("#".repeat(n - 1) + ".");
    else grid.push("." + "#".repeat(n - 1));
  }
  grid[0] = "S" + grid[0].slice(1);
  grid[n - 1] = grid[n - 1].slice(0, n - 1) + "E";
  // 30 full row traversals of n - 1 moves each, 60 vertical moves, plus the final row.
  const path = shortestPath(grid);
  expectValidRoute(grid, path, 31 * (n - 1) + 60 + 1);
});
}`,
    hints: [
      "Depth-first search finds a route, but not necessarily the shortest. Which search explores cells in order of distance from the start?",
      "Run BFS from S with a queue. The first time you reach E, you got there in the fewest moves. To rebuild the route, record for each cell the cell you came from.",
      "Use a prev array sized rows * cols, set when a cell is first enqueued (which also marks it visited). When you dequeue E, follow prev back to S, collecting [r, c] pairs, then reverse the list.",
    ],
    solution: `function shortestPath(grid) {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  let start = -1;
  let end = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "S") start = r * cols + c;
      if (grid[r][c] === "E") end = r * cols + c;
    }
  }
  if (start === -1 || end === -1) return [];

  // prev[i] is the cell we reached i from; -1 means unvisited.
  const prev = new Int32Array(rows * cols).fill(-1);
  prev[start] = start;
  const queue = [start];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    if (cell === end) break;
    const r = Math.floor(cell / cols);
    const c = cell % cols;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || grid[nr][nc] === "#") continue;
      const next = nr * cols + nc;
      if (prev[next] !== -1) continue;
      prev[next] = cell;
      queue.push(next);
    }
  }
  if (prev[end] === -1) return [];

  const path = [];
  for (let cell = end; ; cell = prev[cell]) {
    path.push([Math.floor(cell / cols), cell % cols]);
    if (cell === start) break;
  }
  return path.reverse();
}`,
    explanation: `In an unweighted grid, breadth-first search explores cells in rings of increasing distance from the start: everything 1 move away, then everything 2 moves away, and so on. So the first time BFS reaches the exit, it has used the fewest possible moves. DFS can stumble into a long winding route first, which is why it doesn't give shortest paths.

To return the route rather than just its length, record a parent pointer for each cell when it's first discovered, then walk back from the exit to the start and reverse. Setting the parent at enqueue time doubles as the visited mark, so each cell enters the queue at most once.

Every cell is processed once with four neighbor checks, so the time and space are O(rows × cols). Reading the queue with a moving \`head\` index instead of \`shift()\` keeps it linear; \`shift()\` is O(n) per call and makes large grids slow.

Common mistakes: marking cells visited when dequeued instead of enqueued (cells get queued many times), returning the path in reverse order, and forgetting the unreachable case. Follow-up: if some cells cost more to cross (stairs, crowds), BFS no longer works; use Dijkstra's algorithm with a priority queue.`,
  },
  {
    id: "cs-course-order",
    title: "Order tasks by their dependencies",
    track: "CS fundamentals",
    level: "Hard",
    minutes: 35,
    tags: ["graphs", "topological sort"],
    prompt: `A build tool must compile packages so that every package comes after the packages it depends on. Write \`buildOrder(packages, deps)\` that returns an order to build them in.

- \`packages\` is an array of unique package names (strings).
- \`deps\` is an array of pairs \`[pkg, dependsOn]\`, meaning \`dependsOn\` must be built before \`pkg\`. Every name in \`deps\` appears in \`packages\`. A pair may appear more than once.
- Return an array containing every package exactly once, with each dependency before its dependents.
- If the dependencies contain a cycle (including a package that depends on itself), return \`[]\`.
- Many orders can be valid. Any valid order is accepted; the tests check the dependency rules rather than one exact answer.

\`\`\`
buildOrder(["app", "ui", "core"], [["app", "ui"], ["ui", "core"]])
// ["core", "ui", "app"]

buildOrder(["a", "b"], [["a", "b"], ["b", "a"]])
// [] (a cycle)
\`\`\``,
    starter: `function buildOrder(packages, deps) {
  // your code here
}`,
    tests: `{
// Checks that order contains every package once and respects every dependency.
const expectValidOrder = (packages, deps, order) => {
  expect(Array.isArray(order)).toBe(true);
  expect(order.slice().sort()).toEqual(packages.slice().sort());
  const pos = new Map(order.map((p, i) => [p, i]));
  for (const [pkg, dep] of deps) expect(pos.get(dep)).toBeLessThan(pos.get(pkg));
};
test("returns every package when there are no dependencies", () => {
  const pkgs = ["a", "b", "c"];
  expectValidOrder(pkgs, [], buildOrder(pkgs, []));
});
test("orders a simple chain", () => {
  expect(buildOrder(["app", "ui", "core"], [["app", "ui"], ["ui", "core"]])).toEqual(["core", "ui", "app"]);
});
test("handles a diamond of dependencies", () => {
  const pkgs = ["app", "auth", "db", "log"];
  const deps = [["app", "auth"], ["app", "db"], ["auth", "log"], ["db", "log"]];
  expectValidOrder(pkgs, deps, buildOrder(pkgs, deps));
});
test("returns [] for a two-package cycle", () => {
  expect(buildOrder(["a", "b"], [["a", "b"], ["b", "a"]])).toEqual([]);
});
test("returns [] for a package that depends on itself", () => {
  expect(buildOrder(["a", "b"], [["a", "a"]])).toEqual([]);
});
test("returns [] when a cycle is hidden in one part of the graph", () => {
  const pkgs = ["a", "b", "c", "d", "e"];
  const deps = [["b", "a"], ["c", "b"], ["d", "c"], ["b", "d"], ["e", "a"]];
  expect(buildOrder(pkgs, deps)).toEqual([]);
});
test("handles duplicate dependency pairs", () => {
  const pkgs = ["x", "y", "z"];
  const deps = [["y", "x"], ["y", "x"], ["z", "y"]];
  expect(buildOrder(pkgs, deps)).toEqual(["x", "y", "z"]);
});
test("handles disconnected groups", () => {
  const pkgs = ["a", "b", "c", "d", "lonely"];
  const deps = [["b", "a"], ["d", "c"]];
  expectValidOrder(pkgs, deps, buildOrder(pkgs, deps));
});
test("handles a long chain of 20,000 packages", () => {
  const pkgs = Array.from({ length: 20000 }, (_, i) => "p" + i);
  const deps = pkgs.slice(1).map((p, i) => [p, pkgs[i]]);
  expectValidOrder(pkgs, deps, buildOrder(pkgs.slice().reverse(), deps));
});
}`,
    hints: [
      "A package with no unbuilt dependencies can be built right now. After you build it, which packages might become ready?",
      "Kahn's algorithm: count each package's unbuilt dependencies (its in-degree). Start a queue with every package whose count is 0, and decrement counts as you build.",
      "Build a map from each dependency to the packages that need it, and a count per package (count duplicates consistently on both sides). Pop a ready package, append it to the order, decrement its dependents, and enqueue any that hit 0. If the order is shorter than packages, there was a cycle: return [].",
    ],
    solution: `function buildOrder(packages, deps) {
  const dependents = new Map(packages.map((p) => [p, []]));
  const remaining = new Map(packages.map((p) => [p, 0]));
  for (const [pkg, dep] of deps) {
    dependents.get(dep).push(pkg);
    remaining.set(pkg, remaining.get(pkg) + 1);
  }

  const ready = packages.filter((p) => remaining.get(p) === 0);
  const order = [];
  for (let i = 0; i < ready.length; i++) {
    const pkg = ready[i];
    order.push(pkg);
    for (const next of dependents.get(pkg)) {
      remaining.set(next, remaining.get(next) - 1);
      if (remaining.get(next) === 0) ready.push(next);
    }
  }
  // Packages stuck on a cycle never reach zero remaining dependencies.
  return order.length === packages.length ? order : [];
}`,
    explanation: `This is a topological sort. Kahn's algorithm builds the order greedily: any package whose dependencies are all built is safe to build now. Track, for every package, how many dependencies are still unbuilt. Start with the packages at zero; each time you build one, decrement its dependents and add any that reach zero.

If there's a cycle, the packages on it wait on each other forever and never reach zero, so they never enter the order. That makes cycle detection free: if the final order is shorter than the package list, return \`[]\`.

Each package and each dependency pair is handled once, so it's O(V + E) time and space. Duplicate pairs are fine as long as you count them consistently: adding an edge to the dependents list for every pair while also counting every pair. Mixing a deduplicated \`Set\` on one side with raw counts on the other leaves packages stuck above zero.

The DFS alternative (post-order with a "visiting" mark to detect back edges) is also O(V + E) but recurses as deep as the longest chain, which overflows on the 20,000-package test unless written iteratively. Follow-up: group the packages into stages that can be built in parallel, which is Kahn's algorithm processed one wave at a time.`,
  },
  {
    id: "cs-permutations",
    title: "Generate all permutations",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["recursion", "backtracking"],
    prompt: `A seating-chart tool wants to try every ordering of a small group of guests. Write \`permutations(items)\` that returns every ordering of the array.

- The items are distinct.
- Return an array of arrays. The permutations can come in any order; the tests sort them before comparing.
- An empty input has exactly one permutation: \`[[]]\`.
- Don't mutate \`items\`.

\`\`\`
permutations([1, 2, 3])
// [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
\`\`\``,
    starter: `function permutations(items) {
  // your code here
}`,
    tests: `{
const normalize = (perms) => perms.map((p) => JSON.stringify(p)).sort();
test("returns [[]] for an empty array", () => {
  expect(permutations([])).toEqual([[]]);
});
test("returns one permutation for one item", () => {
  expect(permutations(["a"])).toEqual([["a"]]);
});
test("returns both orders of two items", () => {
  expect(normalize(permutations([1, 2]))).toEqual(normalize([[1, 2], [2, 1]]));
});
test("returns all six orders of three items", () => {
  const expected = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]];
  expect(normalize(permutations([1, 2, 3]))).toEqual(normalize(expected));
});
test("works with strings", () => {
  const result = permutations(["ana", "bo", "cy"]);
  expect(result).toHaveLength(6);
  expect(normalize(result)).toContain(JSON.stringify(["cy", "ana", "bo"]));
});
test("returns 720 distinct permutations of six items", () => {
  const result = permutations([1, 2, 3, 4, 5, 6]);
  expect(result).toHaveLength(720);
  expect(new Set(normalize(result)).size).toBe(720);
  expect(result.every((p) => p.length === 6 && new Set(p).size === 6)).toBe(true);
});
test("returns separate arrays, not the same array reused", () => {
  const result = permutations([1, 2, 3]);
  expect(new Set(result).size).toBe(6);
});
test("does not mutate the input", () => {
  const items = [3, 1, 2];
  permutations(items);
  expect(items).toEqual([3, 1, 2]);
});
}`,
    hints: [
      "Think of building a permutation one position at a time: pick any unused item for the first slot, then any unused item for the next, and so on.",
      "Backtracking: keep a current array and a used flag per item. Recurse to fill the next slot, and undo your choice after the recursive call returns.",
      "When current.length === items.length, push a copy (current.slice()) onto the results. Otherwise, for each i not used: mark it, push items[i], recurse, pop, unmark.",
    ],
    solution: `function permutations(items) {
  const results = [];
  const current = [];
  const used = new Array(items.length).fill(false);

  const build = () => {
    if (current.length === items.length) {
      results.push(current.slice()); // copy, because current keeps changing
      return;
    }
    for (let i = 0; i < items.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      current.push(items[i]);
      build();
      current.pop();
      used[i] = false;
    }
  };

  build();
  return results;
}`,
    explanation: `Backtracking builds each permutation one slot at a time. For the first slot you can pick any of the n items, for the second any of the remaining n - 1, and so on. Each recursive call tries every unused item in the next slot, recurses, and then undoes the choice so the next option starts from a clean state.

There are n! permutations and each takes O(n) to copy, so the time is O(n · n!), which is also the size of the output. The recursion depth and the bookkeeping are O(n). You can't do asymptotically better, since you must produce every permutation.

The classic bug is pushing \`current\` itself instead of a copy: every entry in the results ends up as the same array, emptied by the final pops. Another is forgetting to undo the \`used\` flag, which makes later branches skip items.

Follow-up: handle inputs with duplicates and return only unique permutations. Sort the input and skip an item when it equals the previous one and the previous one isn't currently used.`,
  },
  {
    id: "cs-subsets",
    title: "Generate every subset",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 20,
    tags: ["recursion", "backtracking", "bit manipulation"],
    prompt: `A pricing page lets customers pick any combination of add-ons, and you want to precompute every bundle. Write \`subsets(items)\` that returns every subset of the array (its power set).

- The items are distinct.
- Within each subset, items appear in the same order as in \`items\`.
- The subsets themselves can come in any order; the tests sort them before comparing.
- The empty subset is always included, so \`subsets([])\` is \`[[]]\`.
- Don't mutate \`items\`.

\`\`\`
subsets(["a", "b", "c"])
// [[], ["a"], ["b"], ["c"], ["a", "b"], ["a", "c"], ["b", "c"], ["a", "b", "c"]]
\`\`\``,
    starter: `function subsets(items) {
  // your code here
}`,
    tests: `{
const normalize = (sets) => sets.map((s) => JSON.stringify(s)).sort();
test("returns [[]] for an empty array", () => {
  expect(subsets([])).toEqual([[]]);
});
test("returns the empty set and the item for one item", () => {
  expect(normalize(subsets([1]))).toEqual(normalize([[], [1]]));
});
test("returns all eight subsets of three items", () => {
  const expected = [[], ["a"], ["b"], ["c"], ["a", "b"], ["a", "c"], ["b", "c"], ["a", "b", "c"]];
  expect(normalize(subsets(["a", "b", "c"]))).toEqual(normalize(expected));
});
test("keeps items in their input order within each subset", () => {
  const result = normalize(subsets([3, 1, 2]));
  expect(result).toContain(JSON.stringify([3, 2]));
  expect(result).not.toContain(JSON.stringify([2, 3]));
});
test("returns 1,024 distinct subsets of ten items", () => {
  const items = Array.from({ length: 10 }, (_, i) => i);
  const result = subsets(items);
  expect(result).toHaveLength(1024);
  expect(new Set(normalize(result)).size).toBe(1024);
});
test("returns separate arrays, not the same array reused", () => {
  const result = subsets([1, 2, 3]);
  expect(new Set(result).size).toBe(8);
});
test("does not mutate the input", () => {
  const items = ["x", "y"];
  subsets(items);
  expect(items).toEqual(["x", "y"]);
});
}`,
    hints: [
      "For every item, each subset either includes it or doesn't. That's two choices per item, so 2^n subsets.",
      "Start with [[]]. For each item, take every subset you have so far and add a copy of it with the item appended.",
      "let result = [[]]; for (const item of items) result = result.concat(result.map((s) => [...s, item])); return result. Because items are processed in order, each subset stays in input order.",
    ],
    solution: `function subsets(items) {
  let result = [[]];
  for (const item of items) {
    // Every existing subset either skips this item or includes it.
    result = result.concat(result.map((subset) => [...subset, item]));
  }
  return result;
}`,
    explanation: `Each item is an independent yes-or-no choice, so a set of n items has 2^n subsets. The iterative approach builds them up: after processing the first k items, \`result\` holds all 2^k subsets of those items. Adding item k + 1 doubles the list, keeping every old subset and adding a copy of each with the new item appended. Since items are appended in input order, each subset keeps that order.

The output has 2^n subsets of average length n / 2, so the time and space are O(n · 2^n), which is optimal because that's the size of the answer.

Two other standard approaches: backtracking (at each index, recurse once without the item and once with it), and bitmasks, where the binary digits of each number from 0 to 2^n - 1 say which items to include. The most common bug in the backtracking version is the same as for permutations: pushing the shared \`current\` array instead of a copy.

Follow-up: return only subsets of size k (combinations), or handle duplicate items without producing duplicate subsets.`,
  },
  {
    id: "cs-coin-change",
    title: "Fewest coins to make change",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 30,
    tags: ["dynamic programming"],
    prompt: `A vending machine has an unlimited supply of coins in a few denominations and wants to return change using as few coins as possible. Write \`minCoins(coins, amount)\` that returns the fewest coins that add up to \`amount\`, or \`-1\` if it can't be done.

- \`coins\` is an array of distinct positive integers, in no particular order.
- \`amount\` is a non-negative integer; \`minCoins(coins, 0)\` is \`0\`.
- Greedily taking the largest coin first does not always work. Amounts go up to 10,000.

\`\`\`
minCoins([1, 2, 5], 11)  // 3 (5 + 5 + 1)
minCoins([2], 3)         // -1
minCoins([1, 3, 4], 6)   // 2 (3 + 3), not 3 (4 + 1 + 1)
\`\`\``,
    starter: `function minCoins(coins, amount) {
  // your code here
}`,
    tests: `test("returns 0 for an amount of 0", () => {
  expect(minCoins([1, 2, 5], 0)).toBe(0);
});
test("finds the fewest coins for a simple amount", () => {
  expect(minCoins([1, 2, 5], 11)).toBe(3);
});
test("returns -1 when the amount can't be made", () => {
  expect(minCoins([2], 3)).toBe(-1);
  expect(minCoins([5, 10], 7)).toBe(-1);
});
test("beats the greedy largest-coin-first strategy", () => {
  expect(minCoins([1, 3, 4], 6)).toBe(2);
  expect(minCoins([1, 5, 6, 9], 11)).toBe(2);
});
test("works when coins are not sorted", () => {
  expect(minCoins([25, 1, 10, 5], 63)).toBe(6);
});
test("uses a single coin when the amount matches one", () => {
  expect(minCoins([3, 7], 7)).toBe(1);
});
test("handles a larger amount with awkward coins", () => {
  expect(minCoins([186, 419, 83, 408], 6249)).toBe(20);
});
test("handles an amount of 10,000 quickly", () => {
  const start = Date.now();
  expect(minCoins([7, 13, 29], 10000)).toBe(348);
  expect(Date.now() - start).toBeLessThan(1000);
});`,
    hints: [
      "If you knew the fewest coins for every smaller amount, could you work out the answer for this one?",
      "Let best[a] be the fewest coins that make amount a. For the last coin c you use, best[a] = best[a - c] + 1. Try every coin and keep the minimum.",
      "Fill an array of length amount + 1 with Infinity, set best[0] = 0, and for a from 1 to amount, for each coin c <= a, set best[a] = Math.min(best[a], best[a - c] + 1). Return -1 if best[amount] is still Infinity.",
    ],
    solution: `function minCoins(coins, amount) {
  // best[a] = fewest coins that make amount a (Infinity if impossible)
  const best = new Array(amount + 1).fill(Infinity);
  best[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && best[a - c] + 1 < best[a]) best[a] = best[a - c] + 1;
    }
  }
  return best[amount] === Infinity ? -1 : best[amount];
}`,
    explanation: `Greedy fails because a large coin can leave an awkward remainder: with coins 1, 3 and 4, taking 4 for 6 leaves 2, which needs two 1s. Instead, think about the last coin in an optimal answer. If it's c, the rest is an optimal answer for \`amount - c\`. So the best for each amount is one more than the best over all \`amount - c\`, and you can fill a table from 0 up.

The table has \`amount + 1\` entries and each looks at every coin, so the time is O(amount × coins) and the space is O(amount). For 10,000 with three coins that's 30,000 steps.

Plain recursion over the same recurrence recomputes the same subproblems exponentially many times; adding memoization fixes that but can recurse 10,000 deep. Using \`Infinity\` as "impossible" keeps the comparisons simple, but remember to convert it to \`-1\` at the end.

Follow-up: count the number of distinct ways to make the amount (order doesn't matter), which needs the coin loop on the outside to avoid counting 1 + 2 and 2 + 1 separately. Or return which coins to use by recording the last coin chosen at each amount.`,
  },
  {
    id: "cs-lcs",
    title: "Longest common subsequence",
    track: "CS fundamentals",
    level: "Hard",
    minutes: 40,
    tags: ["dynamic programming", "strings"],
    prompt: `A diff viewer highlights what two versions of a line have in common. Write \`longestCommonSubsequence(a, b)\` that returns \`{ length, sequence }\`: the length of the longest common subsequence of strings \`a\` and \`b\`, and one such subsequence.

- A subsequence keeps characters in order but may skip some: \`"ace"\` is a subsequence of \`"abcde"\`.
- When several longest subsequences exist, any one is accepted. The tests check that \`sequence\` has the right length and is a subsequence of both strings.
- If there's nothing in common (or a string is empty), return \`{ length: 0, sequence: "" }\`.
- Strings can be 1,500 characters long, so a brute-force search will time out.

\`\`\`
longestCommonSubsequence("abcde", "ace")  // { length: 3, sequence: "ace" }
longestCommonSubsequence("abc", "acb")    // { length: 2, sequence: "ab" } or "ac"
longestCommonSubsequence("abc", "xyz")    // { length: 0, sequence: "" }
\`\`\``,
    starter: `function longestCommonSubsequence(a, b) {
  // your code here
}`,
    tests: `{
const isSubsequence = (s, of) => { let i = 0; for (const ch of of) if (i < s.length && s[i] === ch) i++; return i === s.length; };
const expectLcs = (a, b, len) => {
  const result = longestCommonSubsequence(a, b);
  expect(result.length).toBe(len);
  expect(typeof result.sequence).toBe("string");
  expect(result.sequence).toHaveLength(len);
  expect(isSubsequence(result.sequence, a)).toBe(true);
  expect(isSubsequence(result.sequence, b)).toBe(true);
};
const rand = (seed) => () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
test("returns length 0 and an empty sequence for empty strings", () => {
  expect(longestCommonSubsequence("", "")).toEqual({ length: 0, sequence: "" });
  expect(longestCommonSubsequence("abc", "")).toEqual({ length: 0, sequence: "" });
});
test("returns length 0 when nothing is shared", () => {
  expect(longestCommonSubsequence("abc", "xyz")).toEqual({ length: 0, sequence: "" });
});
test("finds a subsequence that skips characters", () => {
  expect(longestCommonSubsequence("abcde", "ace")).toEqual({ length: 3, sequence: "ace" });
});
test("returns the whole string when both are identical", () => {
  expect(longestCommonSubsequence("design", "design")).toEqual({ length: 6, sequence: "design" });
});
test("accepts any valid answer when there are ties", () => {
  expectLcs("abc", "acb", 2);
  expectLcs("ABCBDAB", "BDCABA", 4);
});
test("handles repeated characters", () => {
  expectLcs("aaaa", "aa", 2);
  expectLcs("abab", "baba", 3);
});
test("works on realistic text", () => {
  expectLcs("const total = price * qty;", "let total = price * quantity;", 22);
});
test("handles two 1,500-character strings quickly", () => {
  const next = rand(2024);
  const gen = () => Array.from({ length: 1500 }, () => "acgt"[Math.floor(next() * 4)]).join("");
  const a = gen();
  const b = gen();
  const start = Date.now();
  const result = longestCommonSubsequence(a, b);
  expect(Date.now() - start).toBeLessThan(1500);
  expect(result.sequence).toHaveLength(result.length);
  expect(result.length).toBeGreaterThan(900);
  expect(isSubsequence(result.sequence, a)).toBe(true);
  expect(isSubsequence(result.sequence, b)).toBe(true);
});
test("finds the optimal length on a long string with a known answer", () => {
  const a = "x".repeat(700) + "y".repeat(700);
  const b = "y".repeat(500) + "x".repeat(500);
  expectLcs(a, b, 500);
});
}`,
    hints: [
      "Compare the last characters of a and b. If they match, they can end the common subsequence. If not, at least one of them isn't in it.",
      "Let dp[i][j] be the LCS length of the first i characters of a and the first j of b. If a[i-1] === b[j-1], dp[i][j] = dp[i-1][j-1] + 1; otherwise it's the max of dp[i-1][j] and dp[i][j-1].",
      "After filling the table, rebuild the string by starting at dp[n][m] and walking back: on a match take the character and move diagonally; otherwise move toward whichever neighbor (up or left) holds the larger value. Reverse what you collected.",
    ],
    solution: `function longestCommonSubsequence(a, b) {
  const n = a.length;
  const m = b.length;
  // dp[i][j] = LCS length of a.slice(0, i) and b.slice(0, j)
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Walk back from the bottom-right corner to recover one subsequence.
  const chars = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      chars.push(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return { length: dp[n][m], sequence: chars.reverse().join("") };
}`,
    explanation: `Look at the last characters of the two prefixes. If they match, the best answer uses that character and adds it to the best answer for both prefixes minus one character. If they don't match, at least one of them is not in the answer, so the best is the better of dropping the last character of \`a\` or of \`b\`. Those overlapping subproblems fill an (n + 1) × (m + 1) table row by row.

That's O(n × m) time and space: about 2.25 million cells for two 1,500-character strings, which is fast. The brute force tries all 2^n subsequences and never finishes.

The table holds lengths, not strings. To get an actual subsequence, walk back from \`dp[n][m]\`: a matching character was used, so take it and step diagonally; otherwise step toward the neighbor holding the larger value, since that's where the optimum came from. Storing whole strings in every cell also works but costs far more memory. A frequent bug is off-by-one indexing between \`dp[i]\` and \`a[i - 1]\`.

Follow-up: if you only need the length, keep just two rows for O(m) space. Real diff tools use related algorithms (like Myers' diff) that run faster when the inputs are mostly similar.`,
  },
  {
    id: "cs-trie-autocomplete",
    title: "Trie with ranked autocomplete",
    track: "CS fundamentals",
    level: "Hard",
    minutes: 45,
    tags: ["tries", "trees", "design", "strings"],
    prompt: `A search box suggests completions as the user types, favoring queries people search for most. Implement a \`Trie\` class.

- \`insert(word)\` records one search for \`word\`. Inserting the same word again increases its count.
- \`search(word)\` returns \`true\` if \`word\` itself was inserted, not merely a longer word starting with it.
- \`startsWith(prefix)\` returns \`true\` if any inserted word starts with \`prefix\`.
- \`autocomplete(prefix, limit = 5)\` returns up to \`limit\` inserted words that start with \`prefix\` (including \`prefix\` itself if it was inserted), ordered by insert count, highest first. Break ties alphabetically. Return \`[]\` if nothing matches. An empty prefix matches every word.

Words are lowercase strings. The tests insert thousands of words, so store them in a tree of characters rather than scanning a flat list.

\`\`\`
const t = new Trie();
["car", "cart", "care", "cart", "dog"].forEach((w) => t.insert(w));
t.search("car");             // true
t.search("ca");              // false
t.startsWith("ca");          // true
t.autocomplete("car");       // ["cart", "car", "care"] ("cart" was inserted twice)
t.autocomplete("car", 1);    // ["cart"]
\`\`\``,
    starter: `class Trie {
  insert(word) {
    // your code here
  }
  search(word) {}
  startsWith(prefix) {}
  autocomplete(prefix, limit = 5) {}
}`,
    tests: `{
const sample = () => {
  const t = new Trie();
  ["car", "cart", "care", "cart", "dog", "do", "carbon"].forEach((w) => t.insert(w));
  return t;
};
test("search finds inserted words", () => {
  const t = sample();
  expect(t.search("car")).toBe(true);
  expect(t.search("dog")).toBe(true);
  expect(t.search("do")).toBe(true);
});
test("search rejects prefixes that are not words themselves", () => {
  const t = sample();
  expect(t.search("ca")).toBe(false);
  expect(t.search("carb")).toBe(false);
  expect(t.search("cartwheel")).toBe(false);
});
test("startsWith checks prefixes", () => {
  const t = sample();
  expect(t.startsWith("ca")).toBe(true);
  expect(t.startsWith("carbo")).toBe(true);
  expect(t.startsWith("cat")).toBe(false);
  expect(t.startsWith("x")).toBe(false);
});
test("autocomplete ranks by count, then alphabetically", () => {
  const t = sample();
  expect(t.autocomplete("car")).toEqual(["cart", "car", "carbon", "care"]);
});
test("autocomplete respects the limit", () => {
  const t = sample();
  expect(t.autocomplete("car", 1)).toEqual(["cart"]);
  expect(t.autocomplete("car", 2)).toEqual(["cart", "car"]);
});
test("autocomplete returns [] when nothing matches", () => {
  const t = sample();
  expect(t.autocomplete("zebra")).toEqual([]);
});
test("autocomplete with an empty prefix ranks every word", () => {
  const t = new Trie();
  ["beta", "alpha", "gamma", "beta", "gamma", "gamma"].forEach((w) => t.insert(w));
  expect(t.autocomplete("", 10)).toEqual(["gamma", "beta", "alpha"]);
});
test("counts change the ranking as more searches come in", () => {
  const t = new Trie();
  t.insert("react"); t.insert("redux"); t.insert("redux");
  expect(t.autocomplete("re")).toEqual(["redux", "react"]);
  t.insert("react"); t.insert("react");
  expect(t.autocomplete("re")).toEqual(["react", "redux"]);
});
test("handles thousands of words quickly", () => {
  const t = new Trie();
  const letters = "abcdefghij";
  const start = Date.now();
  for (let i = 0; i < 20000; i++) {
    let w = "";
    let n = i;
    for (let k = 0; k < 5; k++) { w += letters[n % 10]; n = Math.floor(n / 10); }
    t.insert(w);
    if (i % 7 === 0) t.insert(w);
  }
  expect(t.search("aaaaa")).toBe(true);
  expect(t.startsWith("abc")).toBe(true);
  const results = t.autocomplete("abc", 3);
  expect(results).toHaveLength(3);
  expect(results.every((w) => w.startsWith("abc"))).toBe(true);
  for (let i = 0; i < 2000; i++) t.autocomplete("abcde", 5);
  expect(Date.now() - start).toBeLessThan(2000);
});
}`,
    hints: [
      "Each node in a trie represents a prefix. Its children are keyed by the next character, and it needs to remember whether a whole word ends here and how many times.",
      "Give each node children (a Map from character to node) and a count (0 when no word ends there). insert, search and startsWith all start by walking down one character at a time.",
      "autocomplete: walk to the prefix's node (return [] if it's missing), then DFS from there, building each word as prefix + path and collecting [word, count] for nodes with count > 0. Sort by count descending, then word ascending, and slice to limit.",
    ],
    solution: `class Trie {
  constructor() {
    this.root = { children: new Map(), count: 0 };
  }

  // Returns the node for prefix, or null if no word starts with it.
  find(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      node = node.children.get(ch);
      if (!node) return null;
    }
    return node;
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), count: 0 });
      node = node.children.get(ch);
    }
    node.count++;
  }

  search(word) {
    const node = this.find(word);
    return !!node && node.count > 0;
  }

  startsWith(prefix) {
    return this.find(prefix) !== null;
  }

  autocomplete(prefix, limit = 5) {
    const start = this.find(prefix);
    if (!start) return [];
    const found = [];
    const stack = [[start, prefix]];
    while (stack.length) {
      const [node, word] = stack.pop();
      if (node.count > 0) found.push([word, node.count]);
      for (const [ch, child] of node.children) stack.push([child, word + ch]);
    }
    found.sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
    return found.slice(0, limit).map(([word]) => word);
  }
}`,
    explanation: `A trie stores words as paths of characters from a shared root, so all words with the same prefix live under the same node. \`insert\`, \`search\` and \`startsWith\` each walk one node per character: O(L) for a word of length L, no matter how many words are stored. Keeping a count on the node where a word ends handles both "was this exact word inserted?" and the ranking.

\`autocomplete\` walks to the prefix's node and then collects every word in that subtree. Collecting, sorting and slicing costs O(k log k) for k matching words, which is fine when prefixes narrow the subtree quickly. Use a \`Map\` (or \`Object.create(null)\`) for children so a character never collides with a built-in object property.

The common mistakes: treating any node on the path as a word (so \`search("ca")\` returns true), returning words that only share part of the prefix, and sorting alphabetically before by count. Comparing counts first with \`||\` falling through to the alphabetical comparison gets both orderings in one comparator.

Follow-up: for a big dictionary and a short prefix, the subtree can be huge. Interviewers often ask you to cache the top results at every node when inserting, so each keystroke is O(L) instead of a subtree scan, at the cost of more memory and more work per insert.`,
  },
);
