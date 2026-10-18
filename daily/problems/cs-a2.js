(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "cs-three-sum",
    title: "3Sum: unique triplets",
    track: "CS fundamentals",
    level: "Hard",
    minutes: 40,
    tags: ["arrays", "two pointers", "sorting"],
    prompt: `Write \`threeSum(nums)\` that returns every **unique** triplet of values \`[a, b, c]\` drawn from three different positions of \`nums\` such that \`a + b + c === 0\`.

- "Unique" means by value: \`[-1, 0, 1]\` and \`[0, -1, 1]\` are the same triplet and must appear once.
- Any order is fine, both for the triplets and within each triplet. **The tests sort each triplet ascending and then sort the list**, so only the set of triplets matters.
- Return \`[]\` if there are none.

\`\`\`
threeSum([-1, 0, 1, 2, -1, -4])  // [[-1, -1, 2], [-1, 0, 1]]
threeSum([0, 0, 0, 0])           // [[0, 0, 0]]
threeSum([1, 2, -2, -1])         // []
\`\`\`

Aim for O(n²) time. Brute force over every triple is O(n³) and has a hard time with duplicates.`,
    starter: `function threeSum(nums) {\n  // your code here\n}`,
    tests: `const norm = (list) => (Array.isArray(list) ? list.map((t) => [...t].sort((a, b) => a - b)).sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]) : list);
test("finds the triplets in the classic example", () => {
  expect(norm(threeSum([-1, 0, 1, 2, -1, -4]))).toEqual([[-1, -1, 2], [-1, 0, 1]]);
});
test("returns a repeated triplet only once", () => {
  expect(norm(threeSum([0, 0, 0, 0]))).toEqual([[0, 0, 0]]);
});
test("returns [] when nothing sums to zero", () => {
  expect(norm(threeSum([1, 2, -2, -1]))).toEqual([]);
});
test("returns [] for fewer than three numbers", () => {
  expect(norm(threeSum([]))).toEqual([]);
  expect(norm(threeSum([0, 0]))).toEqual([]);
});
test("dedupes when many duplicates are present", () => {
  expect(norm(threeSum([-2, 0, 0, 2, 2, -2, 0]))).toEqual([[-2, 0, 2], [0, 0, 0]]);
});
test("uses each position at most once", () => {
  expect(norm(threeSum([-2, 1, 3]))).toEqual([]);
  expect(norm(threeSum([-2, 1, 1]))).toEqual([[-2, 1, 1]]);
});
test("matches a brute-force reference on a larger input", () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) % 21) - 10;
  const nums = Array.from({ length: 80 }, rand);
  const seen = new Set();
  const expected = [];
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      for (let k = j + 1; k < nums.length; k++)
        if (nums[i] + nums[j] + nums[k] === 0) {
          const t = [nums[i], nums[j], nums[k]].sort((a, b) => a - b);
          const key = t.join(",");
          if (!seen.has(key)) { seen.add(key); expected.push(t); }
        }
  expect(norm(threeSum(nums.slice()))).toEqual(norm(expected));
});`,
    hints: [
      "Sorting the array first makes duplicates sit next to each other and lets you reason about whether a sum is too big or too small.",
      "Fix the first element at index i, then solve two-sum for -nums[i] on the sorted remainder using two pointers lo and hi moving inward.",
      "Skip duplicates in two places: skip i when nums[i] === nums[i - 1], and after recording a hit, advance lo past equal values (and hi likewise). You can also stop once nums[i] > 0.",
    ],
    solution: `function threeSum(nums) {
  const a = [...nums].sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i < a.length - 2; i++) {
    if (a[i] > 0) break; // smallest is positive: no more zero sums
    if (i > 0 && a[i] === a[i - 1]) continue; // same first value
    let lo = i + 1, hi = a.length - 1;
    while (lo < hi) {
      const sum = a[i] + a[lo] + a[hi];
      if (sum < 0) lo++;
      else if (sum > 0) hi--;
      else {
        out.push([a[i], a[lo], a[hi]]);
        lo++; hi--;
        while (lo < hi && a[lo] === a[lo - 1]) lo++;
        while (lo < hi && a[hi] === a[hi + 1]) hi--;
      }
    }
  }
  return out;
}`,
    explanation: `Sorting turns the problem into n instances of the sorted two-sum. For each anchor \`a[i]\`, two pointers start at the ends of the remainder: if the sum is too small, the low pointer must move right; if too large, the high pointer moves left. Each anchor costs O(n), so the total is O(n²) time and O(n) for the sorted copy (or O(1) if you may sort in place).

Sorting also solves the uniqueness problem cheaply. Equal values are adjacent, so skipping an anchor equal to the previous anchor, and skipping repeated \`lo\`/\`hi\` values after a hit, guarantees each value-triplet is emitted once. Without those skips, \`[0, 0, 0, 0]\` produces \`[0, 0, 0]\` several times.

The alternative is collecting triplets into a Set of string keys. It is correct but slower and interviewers usually want to see the skip logic.

Follow-up: 3Sum closest (track the best difference instead of an exact hit), or k-sum by recursing down to the two-pointer base case in O(n^(k-1)).`,
  },
  {
    id: "cs-container-most-water",
    title: "Container with most water",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 20,
    tags: ["arrays", "two pointers", "greedy"],
    prompt: `You are given \`heights\`, where \`heights[i]\` is the height of a vertical line at x = i. Pick two lines that, together with the x-axis, hold the most water. Write \`maxArea(heights)\` that returns that maximum area.

The area between lines \`i < j\` is \`(j - i) * Math.min(heights[i], heights[j])\`.

- Return \`0\` if there are fewer than two lines.

\`\`\`
maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])  // 49  (lines at 1 and 8: width 7, height 7)
maxArea([1, 1])                       // 1
\`\`\`

Aim for O(n) time.`,
    starter: `function maxArea(heights) {\n  // your code here\n}`,
    tests: `test("handles the classic example", () => {
  expect(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])).toBe(49);
});
test("handles two lines", () => {
  expect(maxArea([1, 1])).toBe(1);
});
test("returns 0 for fewer than two lines", () => {
  expect(maxArea([])).toBe(0);
  expect(maxArea([5])).toBe(0);
});
test("uses the outer lines when they are tallest", () => {
  expect(maxArea([4, 3, 2, 1, 4])).toBe(16);
});
test("limits height by the shorter line", () => {
  expect(maxArea([1, 2, 1])).toBe(2);
});
test("finds a best pair that is not the outermost", () => {
  expect(maxArea([1, 3, 2, 5, 25, 24, 5])).toBe(24);
});
test("handles zero-height lines", () => {
  expect(maxArea([0, 0, 0])).toBe(0);
  expect(maxArea([0, 2, 0, 2, 0])).toBe(4);
});
test("matches brute force on a mixed input", () => {
  const h = [6, 1, 9, 3, 3, 8, 2, 7, 4, 10, 1, 5];
  let best = 0;
  for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) best = Math.max(best, (j - i) * Math.min(h[i], h[j]));
  expect(maxArea(h)).toBe(best);
});`,
    hints: [
      "Start with the widest possible container: the first and last lines. Any other pair is narrower, so it only wins if it is taller.",
      "Move one pointer inward at each step. Which one? Moving the taller line can never help, because the shorter line still caps the height and the width shrinks.",
      "lo = 0, hi = n - 1. Record (hi - lo) * Math.min(h[lo], h[hi]), then move whichever pointer is at the shorter line. Stop when they meet.",
    ],
    solution: `function maxArea(heights) {
  let lo = 0, hi = heights.length - 1;
  let best = 0;
  while (lo < hi) {
    const area = (hi - lo) * Math.min(heights[lo], heights[hi]);
    if (area > best) best = area;
    // the shorter side is the bottleneck, so it is the only one worth replacing
    if (heights[lo] < heights[hi]) lo++;
    else hi--;
  }
  return best;
}`,
    explanation: `Two pointers start at the widest pair. At each step the shorter line limits the area. Any container that keeps that short line and moves the other pointer inward is narrower and no taller, so it cannot beat what we just measured. That means the short line can be discarded safely, and we move its pointer. Each step discards one line, so the scan is O(n) time and O(1) space.

The brute force checks all pairs in O(n²). It is a fine starting point to state out loud, but interviewers expect the greedy argument above.

The common mistake is moving the taller pointer, or moving both, which can skip the optimal pair. When the two heights are equal, moving either one is safe.

Follow-up: "trapping rain water" looks similar but sums water over every column; it uses prefix/suffix maxima or a two-pointer variant.`,
  },
  {
    id: "cs-top-k-frequent",
    title: "Top k frequent elements",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["hashing", "sorting", "bucket sort"],
    prompt: `An analytics panel shows the k most-used tags. Write \`topKFrequent(nums, k)\` that returns the \`k\` values that occur most often in \`nums\`.

The order is fully specified so there is one right answer:

- Most frequent first.
- Ties in frequency are broken by **smaller value first**.
- \`k\` is between 1 and the number of distinct values.

\`\`\`
topKFrequent([1, 1, 1, 2, 2, 3], 2)  // [1, 2]
topKFrequent([5, 5, 2, 2, 9], 2)     // [2, 5]  (tie: smaller first)
topKFrequent([3, 3, 3, 1, 2, 2], 2)  // [3, 2]  (by count, not by value)
\`\`\``,
    starter: `function topKFrequent(nums, k) {\n  // your code here\n}`,
    tests: `test("returns the two most frequent values", () => {
  expect(topKFrequent([1, 1, 1, 2, 2, 3], 2)).toEqual([1, 2]);
});
test("orders by count, not by value", () => {
  expect(topKFrequent([3, 3, 3, 1, 2, 2], 2)).toEqual([3, 2]);
});
test("breaks ties with the smaller value first", () => {
  expect(topKFrequent([5, 5, 2, 2, 9], 2)).toEqual([2, 5]);
  expect(topKFrequent([9, 8, 7], 2)).toEqual([7, 8]);
});
test("handles k = 1", () => {
  expect(topKFrequent([4, 1, 4, 1, 4], 1)).toEqual([4]);
});
test("returns every distinct value when k equals that count", () => {
  expect(topKFrequent([2, 1, 2, 3, 3, 3], 3)).toEqual([3, 2, 1]);
});
test("handles negative numbers", () => {
  expect(topKFrequent([-1, -1, -5, 10, 10, -5, -5], 2)).toEqual([-5, -1]);
});
test("compares numbers numerically, not as strings", () => {
  expect(topKFrequent([10, 9, 10, 9, 100], 2)).toEqual([9, 10]);
});`,
    hints: [
      "Two separate jobs: count how often each value appears, then pick the top k by that count.",
      "Count with a Map. Then take the Map's entries and sort them by count descending, breaking ties by value ascending.",
      "[...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, k).map(([v]) => v). Use a Map rather than an object so keys stay numbers.",
    ],
    solution: `function topKFrequent(nums, k) {
  const counts = new Map();
  for (const n of nums) counts.set(n, (counts.get(n) || 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0]) // count desc, then value asc
    .slice(0, k)
    .map(([value]) => value);
}`,
    explanation: `Counting is O(n) with a Map. Sorting the d distinct entries is O(d log d), and a comparator that chains count then value gives the exact order the problem asks for.

If ties did not matter, you could do better. **Bucket sort**: make an array of buckets indexed by count (counts are at most n), drop each value in its bucket, then walk from the highest bucket down until you have k values. That is O(n) overall. A size-k min-heap gives O(n log k), which is the go-to when k is much smaller than d.

Common mistakes: counting with a plain object, which turns keys into strings so you return \`"1"\` instead of \`1\` and compare them as text; forgetting the tie-break so output depends on insertion order; and sorting values by count but returning counts.

Follow-up: the data is a stream too large to hold. Count-Min Sketch plus a heap gives approximate heavy hitters in bounded memory.`,
  },
  {
    id: "cs-valid-palindrome",
    title: "Valid palindrome",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 10,
    tags: ["strings", "two pointers"],
    prompt: `Write \`isPalindrome(s)\` that returns \`true\` if \`s\` reads the same forwards and backwards after you **lowercase it and ignore every character that is not an ASCII letter or digit**.

- Letters are \`a-z\` and \`A-Z\`, digits are \`0-9\`. Everything else (spaces, punctuation, underscores) is ignored.
- A string with no letters or digits (including \`""\`) is a palindrome.

\`\`\`
isPalindrome("A man, a plan, a canal: Panama")  // true
isPalindrome("race a car")                      // false
isPalindrome("0P")                              // false
\`\`\`

Try doing it with two pointers and O(1) extra space.`,
    starter: `function isPalindrome(s) {\n  // your code here\n}`,
    tests: `test("accepts the classic sentence", () => {
  expect(isPalindrome("A man, a plan, a canal: Panama")).toBe(true);
});
test("rejects a near miss", () => {
  expect(isPalindrome("race a car")).toBe(false);
});
test("treats an empty string as a palindrome", () => {
  expect(isPalindrome("")).toBe(true);
});
test("treats punctuation-only input as a palindrome", () => {
  expect(isPalindrome(".,! ?")).toBe(true);
});
test("keeps digits and compares them", () => {
  expect(isPalindrome("0P")).toBe(false);
  expect(isPalindrome("1a2 2A1")).toBe(true);
});
test("ignores underscores (they are not alphanumeric)", () => {
  expect(isPalindrome("ab_a")).toBe(true);
  expect(isPalindrome("_a_b")).toBe(false);
});
test("ignores case", () => {
  expect(isPalindrome("No 'x' in Nixon")).toBe(true);
});
test("handles a single character", () => {
  expect(isPalindrome("Z")).toBe(true);
});`,
    hints: [
      "Watch out: the regex shorthand \\w includes the underscore, which this problem says to ignore.",
      "Put one pointer at each end. Move each pointer past characters that are not letters or digits, then compare the two characters case-insensitively.",
      "Use a helper like isAlnum = (c) => /[a-z0-9]/i.test(c). Loop while lo < hi: skip junk on both sides, compare s[lo].toLowerCase() with s[hi].toLowerCase(), then move both inward.",
    ],
    solution: `function isPalindrome(s) {
  const isAlnum = (c) => /[a-z0-9]/i.test(c);
  let lo = 0, hi = s.length - 1;
  while (lo < hi) {
    if (!isAlnum(s[lo])) { lo++; continue; }
    if (!isAlnum(s[hi])) { hi--; continue; }
    if (s[lo].toLowerCase() !== s[hi].toLowerCase()) return false;
    lo++; hi--;
  }
  return true;
}`,
    explanation: `Two pointers walk inward from both ends, skipping characters that do not count, and compare the ones that do. Each character is looked at once, so it is O(n) time and O(1) space.

The one-liner \`const t = s.toLowerCase().replace(/[^a-z0-9]/g, ""); return t === [...t].reverse().join("")\` is also correct, uses O(n) space, and is a fine first answer. Interviewers often follow up by asking for the constant-space version.

The classic bug is using \`\\W\` or \`\\w\` to strip characters: \`\\w\` includes \`_\`, so \`"ab_a"\` would be judged wrong. Another is forgetting digits, which makes \`"0P"\` look like a palindrome.

Follow-up: "valid palindrome II" asks whether the string can become a palindrome by deleting at most one character. On the first mismatch, try skipping either side once.`,
  },
  {
    id: "cs-run-length-encoding",
    title: "Run-length encode and decode",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 20,
    tags: ["strings", "encoding"],
    prompt: `Implement both halves of a simple run-length encoding.

\`encode(s)\` replaces each run of identical consecutive characters with the run length followed by the character. The count is always written, even when it is 1, and may have several digits.

\`decode(s)\` reverses it, turning \`"12a3b"\` back into twelve \`a\`s followed by three \`b\`s.

- Input to \`encode\` contains letters only (no digits), so the format is unambiguous.
- Runs are only **consecutive** characters: \`"aabaa"\` is three runs.
- Both functions return \`""\` for \`""\`.

\`\`\`
encode("aaabcc")    // "3a1b2c"
encode("aabaa")     // "2a1b2a"
decode("12x1y")     // "xxxxxxxxxxxxy"
\`\`\``,
    starter: `function encode(s) {\n  // your code here\n}\n\nfunction decode(s) {\n  // your code here\n}`,
    tests: `test("encodes runs of characters", () => {
  expect(encode("aaabcc")).toBe("3a1b2c");
});
test("writes a count of 1 for single characters", () => {
  expect(encode("abc")).toBe("1a1b1c");
});
test("only merges consecutive characters", () => {
  expect(encode("aabaa")).toBe("2a1b2a");
});
test("writes multi-digit counts", () => {
  expect(encode("z".repeat(12) + "Q")).toBe("12z1Q");
});
test("decodes single and multi-digit counts", () => {
  expect(decode("3a1b2c")).toBe("aaabcc");
  expect(decode("12x1y")).toBe("x".repeat(12) + "y");
});
test("returns empty strings for empty input", () => {
  expect(encode("")).toBe("");
  expect(decode("")).toBe("");
});
test("round-trips a longer mixed string", () => {
  const s = "WWWWWWWWWWWWBWWWWWWWWWWWWBBBWWWWWWWWWWWWWWWWWWWWWWWWBWWWWWWWWWWWWWW";
  expect(encode(s)).toBe("12W1B12W3B24W1B14W");
  expect(decode(encode(s))).toBe(s);
});`,
    hints: [
      "For encode, you only emit something when a run ends: when the next character differs from the current one, or at the end of the string.",
      "For decode, read digits until you hit a non-digit; the digits you collected are the count for that character. Do not assume counts are a single digit.",
      "encode: keep a count, and at each i where s[i + 1] !== s[i], append count + s[i] and reset. decode: accumulate num = num * 10 + digit, then on a letter append letter.repeat(num) and reset num to 0.",
    ],
    solution: `function encode(s) {
  let out = "";
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    count++;
    if (s[i + 1] !== s[i]) { // run ends here
      out += count + s[i];
      count = 0;
    }
  }
  return out;
}

function decode(s) {
  let out = "";
  let num = 0;
  for (const ch of s) {
    if (ch >= "0" && ch <= "9") num = num * 10 + Number(ch);
    else {
      out += ch.repeat(num);
      num = 0;
    }
  }
  return out;
}`,
    explanation: `Encoding is a single scan that emits a token whenever a run ends. Comparing \`s[i + 1]\` with \`s[i]\` handles the final run naturally, because \`s[s.length]\` is \`undefined\`. Decoding is a tiny parser: digits build up a number, and the next letter consumes it.

Both are O(n) in the size of their output. String concatenation in a loop is fast in modern engines; pushing parts to an array and joining is equally fine.

Common mistakes: counting total occurrences instead of consecutive runs (\`"aabaa"\` becomes \`"4a1b"\`), forgetting to flush the last run, and decoding only one digit of the count so \`"12a"\` becomes one \`2\`-ish mess.

Follow-up: how would you support digits in the input? You would need an escape scheme or a fixed-width count, which is exactly why real formats like PackBits use a length byte.`,
  },
  {
    id: "cs-roman-numerals",
    title: "Integer to Roman and back",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 25,
    tags: ["strings", "greedy", "parsing"],
    prompt: `Write two functions for Roman numerals between 1 and 3999.

\`toRoman(n)\` converts an integer to a Roman numeral string. \`fromRoman(s)\` converts a valid Roman numeral string back to an integer.

Symbols: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Subtractive forms are used for 4s and 9s: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900. Use the standard shortest form (4 is \`"IV"\`, never \`"IIII"\`).

- \`toRoman\` throws a \`RangeError\` if \`n\` is not an integer from 1 to 3999.
- \`fromRoman\` may assume its input is valid and uppercase.

\`\`\`
toRoman(1994)        // "MCMXCIV"
fromRoman("LVIII")   // 58
toRoman(0)           // throws RangeError
\`\`\``,
    starter: `function toRoman(n) {\n  // your code here\n}\n\nfunction fromRoman(s) {\n  // your code here\n}`,
    tests: `test("converts small numbers using subtractive forms", () => {
  expect(toRoman(3)).toBe("III");
  expect(toRoman(4)).toBe("IV");
  expect(toRoman(9)).toBe("IX");
});
test("converts larger numbers", () => {
  expect(toRoman(58)).toBe("LVIII");
  expect(toRoman(1994)).toBe("MCMXCIV");
  expect(toRoman(3999)).toBe("MMMCMXCIX");
  expect(toRoman(444)).toBe("CDXLIV");
});
test("parses Roman numerals", () => {
  expect(fromRoman("III")).toBe(3);
  expect(fromRoman("IV")).toBe(4);
  expect(fromRoman("LVIII")).toBe(58);
  expect(fromRoman("MCMXCIV")).toBe(1994);
});
test("parses subtractive pairs anywhere in the string", () => {
  expect(fromRoman("CDXLIV")).toBe(444);
  expect(fromRoman("MMMCMXCIX")).toBe(3999);
});
test("throws RangeError outside 1 to 3999", () => {
  expect(() => toRoman(0)).toThrow();
  expect(() => toRoman(4000)).toThrow();
  let err;
  try { toRoman(-5); } catch (e) { err = e; }
  expect(err).toBeInstanceOf(RangeError);
});
test("throws RangeError for non-integers", () => {
  let err;
  try { toRoman(2.5); } catch (e) { err = e; }
  expect(err).toBeInstanceOf(RangeError);
});
test("round-trips every number from 1 to 3999", () => {
  for (let n = 1; n <= 3999; n++) {
    if (fromRoman(toRoman(n)) !== n) throw new Error("round-trip failed for " + n + " (" + toRoman(n) + ")");
  }
});`,
    hints: [
      "Treat the six subtractive pairs as symbols of their own. Then there are 13 symbols, and both directions get simple.",
      "toRoman is greedy: walk the 13 values from largest to smallest and append each symbol as many times as it fits. fromRoman: add each symbol's value, but subtract it when it is smaller than the symbol after it.",
      "Table: [[1000,\"M\"],[900,\"CM\"],[500,\"D\"],[400,\"CD\"],[100,\"C\"],[90,\"XC\"],[50,\"L\"],[40,\"XL\"],[10,\"X\"],[9,\"IX\"],[5,\"V\"],[4,\"IV\"],[1,\"I\"]]. For fromRoman: total += v < next ? -v : v.",
    ],
    solution: `const ROMAN = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
const VALUE = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) {
    throw new RangeError("toRoman expects an integer from 1 to 3999");
  }
  let out = "";
  for (const [value, symbol] of ROMAN) {
    while (n >= value) {
      out += symbol;
      n -= value;
    }
  }
  return out;
}

function fromRoman(s) {
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = VALUE[s[i]];
    const next = VALUE[s[i + 1]] || 0;
    total += v < next ? -v : v; // a smaller symbol before a larger one subtracts
  }
  return total;
}`,
    explanation: `Including the subtractive pairs (CM, CD, XC, XL, IX, IV) in the table makes \`toRoman\` a plain greedy algorithm: take the largest symbol that fits, repeat. Greedy is safe here because the table is exactly the set of building blocks of the standard form. With at most 15 symbols in any result, both functions are effectively O(1) for this range.

For \`fromRoman\`, the rule is local: a symbol that is smaller than the one immediately after it is subtracted, otherwise added. That handles \`"MCMXCIV"\` without any lookahead beyond one character.

Common mistakes: leaving out the subtractive pairs and producing \`"IIII"\`, checking only for the specific pair \`"IV"\` instead of the general smaller-before-larger rule, and forgetting input validation. \`Number.isInteger\` also rejects \`NaN\` and strings.

Follow-up: make \`fromRoman\` reject invalid input such as \`"IIII"\` or \`"IC"\`. One neat trick is to convert and then check that \`toRoman(result) === s\`.`,
  },
  {
    id: "cs-first-unique-char",
    title: "First unique character",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 10,
    tags: ["strings", "hashing"],
    prompt: `Write \`firstUniqueChar(s)\` that returns the **index** of the first character in \`s\` that appears exactly once, or \`-1\` if there is none.

- The comparison is case-sensitive (\`"a"\` and \`"A"\` are different).
- An empty string returns \`-1\`.

\`\`\`
firstUniqueChar("leetcode")      // 0
firstUniqueChar("loveleetcode")  // 2
firstUniqueChar("aabb")          // -1
\`\`\``,
    starter: `function firstUniqueChar(s) {\n  // your code here\n}`,
    tests: `test("returns 0 when the first character is unique", () => {
  expect(firstUniqueChar("leetcode")).toBe(0);
});
test("finds a unique character later in the string", () => {
  expect(firstUniqueChar("loveleetcode")).toBe(2);
});
test("returns -1 when every character repeats", () => {
  expect(firstUniqueChar("aabb")).toBe(-1);
});
test("returns -1 for an empty string", () => {
  expect(firstUniqueChar("")).toBe(-1);
});
test("is case-sensitive", () => {
  expect(firstUniqueChar("aA")).toBe(0);
  expect(firstUniqueChar("AaA")).toBe(1);
});
test("does not treat a character as unique before its repeat appears", () => {
  expect(firstUniqueChar("abcab")).toBe(2);
});
test("handles a single character and spaces", () => {
  expect(firstUniqueChar("z")).toBe(0);
  expect(firstUniqueChar("  x")).toBe(2);
});`,
    hints: [
      "You cannot know a character is unique until you have seen the whole string.",
      "Make two passes: first count every character, then scan again and return the first index whose count is 1.",
      "counts = new Map(); for (const c of s) counts.set(c, (counts.get(c) || 0) + 1); then for i in 0..s.length-1, if counts.get(s[i]) === 1 return i. Return -1 at the end.",
    ],
    solution: `function firstUniqueChar(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  for (let i = 0; i < s.length; i++) {
    if (counts.get(s[i]) === 1) return i;
  }
  return -1;
}`,
    explanation: `Uniqueness depends on the whole string, so a single pass that returns early cannot work: in \`"abcab"\`, \`a\` looks unique until index 3. Two passes fix this. The first counts characters, the second finds the earliest one with count 1.

Both passes are O(n), and the map holds at most k distinct characters, so space is O(k), which is O(1) for a fixed alphabet.

The tempting \`s.indexOf(c) === s.lastIndexOf(c)\` check per character is correct but O(n²). Using \`for...of\` in the first pass and an index loop in the second is fine for ASCII; for astral Unicode characters, iterate by code point in both passes.

Follow-up: characters arrive as a stream and you must report the first unique one so far after each arrival. Keep counts plus an ordered structure (a queue or a Map with deletions) of candidates.`,
  },
  {
    id: "cs-subarray-sum-k",
    title: "Subarray sum equals k",
    track: "CS fundamentals",
    level: "Hard",
    minutes: 35,
    tags: ["arrays", "prefix sums", "hashing"],
    prompt: `A metrics service stores per-minute deltas. Write \`subarraySum(nums, k)\` that returns **how many** contiguous, non-empty subarrays of \`nums\` sum to exactly \`k\`.

- \`nums\` may contain negative numbers and zeros, so a sliding window will not work.
- Overlapping subarrays count separately. An empty array returns \`0\`.

\`\`\`
subarraySum([1, 1, 1], 2)    // 2  ([1,1] twice)
subarraySum([1, 2, 3], 3)    // 2  ([1,2] and [3])
subarraySum([1, -1, 0], 0)   // 3  ([1,-1], [1,-1,0], [0])
\`\`\`

Aim for O(n) time.`,
    starter: `function subarraySum(nums, k) {\n  // your code here\n}`,
    tests: `test("counts overlapping subarrays", () => {
  expect(subarraySum([1, 1, 1], 2)).toBe(2);
});
test("counts subarrays of different lengths", () => {
  expect(subarraySum([1, 2, 3], 3)).toBe(2);
});
test("handles negative numbers", () => {
  expect(subarraySum([1, -1, 0], 0)).toBe(3);
  expect(subarraySum([3, 4, 7, 2, -3, 1, 4, 2], 7)).toBe(4);
});
test("counts every subarray of zeros", () => {
  expect(subarraySum([0, 0, 0], 0)).toBe(6);
});
test("counts a subarray that starts at index 0", () => {
  expect(subarraySum([5], 5)).toBe(1);
  expect(subarraySum([2, 3, -1], 5)).toBe(1);
});
test("returns 0 for an empty array or no match", () => {
  expect(subarraySum([], 0)).toBe(0);
  expect(subarraySum([1, 2, 3], 100)).toBe(0);
});
test("matches brute force on a mixed input", () => {
  const nums = [2, -2, 3, 0, 4, -7, 1, 1, 0, 2, -1, 3];
  for (const k of [0, 1, 2, 3, 4]) {
    let count = 0;
    for (let i = 0; i < nums.length; i++) {
      let sum = 0;
      for (let j = i; j < nums.length; j++) if ((sum += nums[j]) === k) count++;
    }
    expect(subarraySum(nums, k)).toBe(count);
  }
});`,
    hints: [
      "Let prefix[i] be the sum of the first i elements. The subarray from i to j - 1 sums to prefix[j] - prefix[i].",
      "So at each position with running sum S, you want to know how many earlier prefix sums equal S - k. A Map from prefix sum to how many times you have seen it answers that in O(1).",
      "Start the map with {0: 1} (the empty prefix, so subarrays starting at index 0 count). For each x: sum += x; count += seen.get(sum - k) || 0; then seen.set(sum, (seen.get(sum) || 0) + 1). Look up before you insert.",
    ],
    solution: `function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]); // prefix sum -> times seen; the empty prefix counts
  let sum = 0;
  let count = 0;
  for (const x of nums) {
    sum += x;
    count += seen.get(sum - k) || 0;
    seen.set(sum, (seen.get(sum) || 0) + 1);
  }
  return count;
}`,
    explanation: `Every subarray sum is a difference of two prefix sums. If the running sum is \`S\` at the current position, each earlier prefix equal to \`S - k\` marks the start of a subarray ending here with sum \`k\`. Keeping a count of prefix sums seen so far lets you add all of them at once.

That is O(n) time and O(n) space, versus O(n²) for checking every start and end.

Three details matter. Seed the map with \`0 → 1\` so subarrays starting at index 0 are counted. Look up \`sum - k\` **before** inserting the current sum, or with \`k = 0\` you would count an empty subarray. And store counts, not booleans, because the same prefix sum can repeat (all those zeros).

The tempting sliding window only works when all numbers are positive, since then extending always increases the sum. Negatives break that, which is why it is a classic interview trap. Follow-up: find the longest subarray with sum k (store the first index of each prefix sum instead of a count).`,
  },
  {
    id: "cs-longest-consecutive",
    title: "Longest consecutive sequence",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["arrays", "hashing"],
    prompt: `Write \`longestConsecutive(nums)\` that returns the length of the longest run of **consecutive integers** that can be formed from the values in \`nums\`. The values can appear in any order in the array.

- Duplicates do not extend a run (\`[1, 2, 2, 3]\` has a run of length 3).
- An empty array returns \`0\`.

\`\`\`
longestConsecutive([100, 4, 200, 1, 3, 2])          // 4  (1, 2, 3, 4)
longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])  // 9
\`\`\`

Sorting gives an O(n log n) answer. Aim for O(n).`,
    starter: `function longestConsecutive(nums) {\n  // your code here\n}`,
    tests: `test("finds a run scattered through the array", () => {
  expect(longestConsecutive([100, 4, 200, 1, 3, 2])).toBe(4);
});
test("handles a long run with a duplicate", () => {
  expect(longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])).toBe(9);
});
test("returns 0 for an empty array", () => {
  expect(longestConsecutive([])).toBe(0);
});
test("returns 1 for a single value or no neighbors", () => {
  expect(longestConsecutive([7])).toBe(1);
  expect(longestConsecutive([10, 30, 20])).toBe(1);
});
test("does not let duplicates break or extend a run", () => {
  expect(longestConsecutive([1, 2, 2, 3])).toBe(3);
  expect(longestConsecutive([5, 5, 5])).toBe(1);
});
test("handles negative numbers", () => {
  expect(longestConsecutive([-1, 1, 0, -3, -2])).toBe(5);
});
test("picks the longest of several runs", () => {
  expect(longestConsecutive([10, 11, 1, 2, 3, 12, 13, 14, 50])).toBe(5);
});
test("handles a large input quickly", () => {
  const nums = [];
  for (let i = 0; i < 50000; i++) nums.push((i * 7919) % 50000);
  expect(longestConsecutive(nums)).toBe(50000);
});`,
    hints: [
      "Put every value in a Set so you can ask \"is x + 1 present?\" in O(1).",
      "Only start counting from values that begin a run: x is a start exactly when x - 1 is not in the set.",
      "For each start x, count upward while set.has(x + len). Iterate over the set (not the array) so duplicates cost nothing. Every value is visited at most twice overall, so it is O(n).",
    ],
    solution: `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue; // not the start of a run
    let len = 1;
    while (set.has(x + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}`,
    explanation: `A Set gives O(1) membership. The key trick is only expanding from the **start** of a run, a value whose predecessor is missing. Without that check, every element of a run of length L would rescan the rest of the run, which is O(n²) in the worst case. With it, each value is touched once as a candidate and once while some run is being counted: O(n) time and O(n) space.

Iterating over the set rather than the original array means duplicates do not trigger repeated work, which matters for input like many copies of the start value.

The sort-based answer is O(n log n): sort, then walk, extending on \`+1\`, ignoring equal neighbors and resetting otherwise. Its classic bug is resetting the run on a duplicate, which makes \`[1, 2, 2, 3]\` return 2.

Follow-up: support adding numbers one at a time and reporting the longest run so far. A union-find over values, or a map from run endpoints to run lengths, handles that.`,
  },
  {
    id: "cs-majority-element",
    title: "Majority element (Boyer-Moore)",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 15,
    tags: ["arrays", "voting", "constant space"],
    prompt: `Write \`majorityElement(nums)\` that returns the value appearing **more than half** the time in \`nums\`.

- The input is non-empty and is guaranteed to have a majority element.
- Use O(1) extra space: no Map, no Set, no sorting a copy. The Boyer-Moore voting algorithm does this in one pass.

\`\`\`
majorityElement([3, 2, 3])              // 3
majorityElement([2, 2, 1, 1, 1, 2, 2])  // 2
\`\`\``,
    starter: `function majorityElement(nums) {\n  // your code here\n}`,
    tests: `test("finds the majority in a short array", () => {
  expect(majorityElement([3, 2, 3])).toBe(3);
});
test("finds the majority when it is interleaved", () => {
  expect(majorityElement([2, 2, 1, 1, 1, 2, 2])).toBe(2);
});
test("handles a single element", () => {
  expect(majorityElement([9])).toBe(9);
});
test("finds a majority clustered at the end", () => {
  expect(majorityElement([1, 2, 3, 3, 3])).toBe(3);
  expect(majorityElement([4, 5, 6, 7, 7, 7, 7])).toBe(7);
});
test("finds a majority that is not the first element", () => {
  expect(majorityElement([1, 2, 2])).toBe(2);
});
test("handles negatives and zero", () => {
  expect(majorityElement([0, -1, -1, 0, -1])).toBe(-1);
  expect(majorityElement([0, 0, 5])).toBe(0);
});
test("does not mutate the input", () => {
  const nums = [6, 5, 5];
  expect(majorityElement(nums)).toBe(5);
  expect(nums).toEqual([6, 5, 5]);
});`,
    hints: [
      "Pair each occurrence of the majority value with an occurrence of some other value and cancel them out. The majority always has something left over.",
      "Keep a candidate and a counter. Matching the candidate increments the counter; anything else decrements it.",
      "If count is 0, take the current value as the new candidate before comparing. At the end, the candidate is the answer (guaranteed here; otherwise you would verify with a second pass).",
    ],
    solution: `function majorityElement(nums) {
  let candidate;
  let count = 0;
  for (const x of nums) {
    if (count === 0) candidate = x;
    count += x === candidate ? 1 : -1;
  }
  return candidate;
}`,
    explanation: `Boyer-Moore voting is a cancellation argument. Every time the counter drops, one copy of the candidate cancels against one non-candidate. Since the majority value has more copies than everything else combined, it cannot be fully cancelled, so it is the candidate standing at the end. One pass, O(n) time, O(1) space.

The candidate after the scan is only guaranteed correct when a majority exists. Without that guarantee you need a second pass counting the candidate to confirm it has more than n/2 copies.

Common mistakes: forgetting to adopt a new candidate when the count hits zero (so you keep decrementing past zero), and reaching for a Map or a sort, which are correct but break the space requirement. Sorting in place also mutates the caller's array.

Follow-up: find all elements appearing more than n/3 times. Generalized Boyer-Moore keeps two candidates and two counters, then verifies both.`,
  },
  {
    id: "cs-minimum-window-substring",
    title: "Minimum window substring",
    track: "CS fundamentals",
    level: "Hard",
    minutes: 45,
    tags: ["strings", "sliding window", "hashing"],
    prompt: `A search box highlights the shortest snippet of a document that contains every character of the query. Write \`minWindow(s, t)\` that returns the shortest contiguous substring of \`s\` containing **every character of \`t\`, including duplicates** (if \`t\` has two \`a\`s, the window needs at least two \`a\`s).

- Case-sensitive.
- If several windows tie for shortest, return the **leftmost** one.
- Return \`""\` if no window exists or if \`t\` is empty.

\`\`\`
minWindow("ADOBECODEBANC", "ABC")  // "BANC"
minWindow("a", "aa")               // ""
minWindow("abab", "ab")            // "ab"  (leftmost of several)
\`\`\`

Aim for O(|s| + |t|) time.`,
    starter: `function minWindow(s, t) {\n  // your code here\n}`,
    tests: `test("finds the classic window", () => {
  expect(minWindow("ADOBECODEBANC", "ABC")).toBe("BANC");
});
test("returns the whole string when it is the only window", () => {
  expect(minWindow("a", "a")).toBe("a");
});
test("requires duplicate characters to be covered", () => {
  expect(minWindow("a", "aa")).toBe("");
  expect(minWindow("aa", "aa")).toBe("aa");
  expect(minWindow("abcabdebac", "aab")).toBe("abca");
});
test("returns the leftmost of equally short windows", () => {
  expect(minWindow("abab", "ab")).toBe("ab");
  expect(minWindow("xaybxbya", "ab")).toBe("ayb");
});
test("returns empty for an empty query or no match", () => {
  expect(minWindow("abc", "")).toBe("");
  expect(minWindow("abc", "d")).toBe("");
  expect(minWindow("", "a")).toBe("");
});
test("is case-sensitive", () => {
  expect(minWindow("aAbB", "AB")).toBe("AbB");
});
test("shrinks past extra characters on the left", () => {
  expect(minWindow("aaaaaaaab", "ab")).toBe("ab");
  expect(minWindow("bba", "ab")).toBe("ba");
});
test("matches brute force on several queries", () => {
  const s = "cabwefgewcwaefgcf";
  const covers = (w, q) => {
    const need = {};
    for (const c of q) need[c] = (need[c] || 0) + 1;
    for (const c of w) if (need[c]) need[c]--;
    return Object.values(need).every((n) => n === 0);
  };
  for (const q of ["cae", "fgc", "wwc", "ab", "ff"]) {
    let best = "";
    for (let len = 1; len <= s.length && !best; len++)
      for (let i = 0; i + len <= s.length; i++)
        if (covers(s.slice(i, i + len), q)) { best = s.slice(i, i + len); break; }
    expect(minWindow(s, q)).toBe(best);
  }
});`,
    hints: [
      "Use a sliding window: grow the right edge until the window covers t, then shrink the left edge as far as it can while still covering t. Record the window each time it is valid.",
      "Keep a Map need of how many of each character t requires, and a counter missing = t.length. When you add a character that was still needed (need > 0), missing drops. The window is valid when missing === 0.",
      "Expanding: need[c]--, and if it was > 0 before, missing--. While missing === 0: record if shorter (strictly shorter keeps the leftmost), then remove s[left]: need[s[left]]++, and if it becomes > 0, missing++; left++.",
    ],
    solution: `function minWindow(s, t) {
  if (!t) return "";
  const need = new Map(); // char -> how many more the window needs (can go negative)
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);
  let missing = t.length;
  let bestStart = 0, bestLen = Infinity;
  let left = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (need.has(c)) {
      if (need.get(c) > 0) missing--;
      need.set(c, need.get(c) - 1);
    }
    while (missing === 0) {
      if (right - left + 1 < bestLen) {
        bestStart = left;
        bestLen = right - left + 1;
      }
      const d = s[left++];
      if (need.has(d)) {
        need.set(d, need.get(d) + 1);
        if (need.get(d) > 0) missing++;
      }
    }
  }
  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}`,
    explanation: `The window \`[left, right]\` expands until it covers \`t\`, then contracts from the left while it still does. Every valid window that cannot be shrunk further is a candidate, and the shortest candidate is the answer. Each index enters and leaves the window at most once, so the scan is O(|s|), plus O(|t|) to build the counts. Space is O(k) for k distinct characters in \`t\`.

The \`missing\` counter is what keeps this linear. Instead of comparing two whole count maps on every step, you track how many required characters are still unmet. It only changes when a count crosses zero, so validity checks are O(1). Counts can go negative when the window holds surplus copies; those surpluses are what let the left edge move without breaking coverage.

Common mistakes: treating \`t\` as a set and ignoring duplicate requirements, re-checking full coverage on every step (O(|s|·k)), and using \`<=\` when recording, which returns the rightmost tie instead of the leftmost.

Follow-up: the same skeleton solves "find all anagrams of p in s" and "permutation in string", where the window has a fixed size.`,
  },
);
