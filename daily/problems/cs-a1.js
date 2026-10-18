(window.PROBLEMS = window.PROBLEMS || []).push(
  {
    id: "cs-two-sum",
    title: "Two sum",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 15,
    tags: ["arrays", "hashing"],
    prompt: `A checkout page needs to find two line items whose prices add up exactly to a gift card balance. Write the classic version:

\`twoSum(nums, target)\` takes an array of numbers and a target, and returns the **indices** \`[i, j]\` of two different elements whose values add up to \`target\`.

- Return the indices with the smaller one first (\`i < j\`).
- You may not use the same element twice, but two different elements may have the same value.
- If several pairs work, return the pair whose second index \`j\` is smallest (this is what a single left-to-right pass naturally finds).
- Return \`null\` if no pair exists.

\`\`\`
twoSum([2, 7, 11, 15], 9)  // [0, 1]
twoSum([3, 2, 4], 6)       // [1, 2]  (not [0, 0])
twoSum([1, 2], 7)          // null
\`\`\`

Aim for a single pass in O(n) time.`,
    starter: `function twoSum(nums, target) {\n  // your code here\n}`,
    tests: `test("finds the pair in the basic example", () => {
  expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);
});
test("does not use the same element twice", () => {
  expect(twoSum([3, 2, 4], 6)).toEqual([1, 2]);
});
test("handles two equal values", () => {
  expect(twoSum([3, 3], 6)).toEqual([0, 1]);
});
test("returns the smaller index first", () => {
  expect(twoSum([1, 5, 9, 4], 5)).toEqual([0, 3]);
});
test("works with negatives and zero", () => {
  expect(twoSum([-4, 8, 0, 4], 0)).toEqual([0, 3]);
});
test("returns the pair that completes earliest", () => {
  expect(twoSum([1, 4, 3, 2, 5], 6)).toEqual([1, 3]);
});
test("returns null when no pair exists", () => {
  expect(twoSum([1, 2, 3], 100)).toBeNull();
});
test("returns null for an empty list", () => {
  expect(twoSum([], 0)).toBeNull();
});`,
    hints: [
      "For each number x, the only partner that works is target - x. The question is how fast you can ask \"have I already seen that partner?\"",
      "Walk the array once, keeping a Map from value to the index where you saw it.",
      "At index j, look up target - nums[j] in the map. If it is there, return [map.get(...), j]. Otherwise store nums[j] -> j and move on. Check before storing so an element never pairs with itself.",
    ],
    solution: `function twoSum(nums, target) {
  const seen = new Map(); // value -> index
  for (let j = 0; j < nums.length; j++) {
    const need = target - nums[j];
    if (seen.has(need)) return [seen.get(need), j];
    if (!seen.has(nums[j])) seen.set(nums[j], j);
  }
  return null;
}`,
    explanation: `The brute-force answer checks every pair in O(n²). The insight is that for each element the partner is fully determined: it must be \`target - x\`. A hash map turns "have I seen that value?" into an O(1) lookup, so one pass is enough: O(n) time, O(n) space.

Checking the map **before** inserting the current element is what keeps you from pairing an element with itself (\`[3, 2, 4]\` with target 6 would otherwise return \`[0, 0]\`). It also means you naturally find the pair whose second index is smallest, and since the earlier index came from the map, the result is already ordered.

A common mistake is building the whole map first and then scanning; that works but needs an explicit \`i !== j\` check and handles duplicates more awkwardly.

Follow-up: if the array is sorted, you can do it in O(1) extra space with two pointers moving inward from both ends.`,
  },
  {
    id: "cs-valid-anagram",
    title: "Valid anagram",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 10,
    tags: ["strings", "hashing"],
    prompt: `Write \`isAnagram(a, b)\` that returns \`true\` if string \`b\` is a rearrangement of exactly the same characters as string \`a\`, and \`false\` otherwise.

- The comparison is case-sensitive and counts every character, including spaces and punctuation.
- Each character must appear the **same number of times** in both strings.
- Two empty strings are anagrams.

\`\`\`
isAnagram("listen", "silent")  // true
isAnagram("rat", "car")        // false
isAnagram("aab", "abb")        // false (same letters, different counts)
\`\`\``,
    starter: `function isAnagram(a, b) {\n  // your code here\n}`,
    tests: `test("recognizes a simple anagram", () => {
  expect(isAnagram("listen", "silent")).toBe(true);
  expect(isAnagram("anagram", "nagaram")).toBe(true);
});
test("rejects strings with different letters", () => {
  expect(isAnagram("rat", "car")).toBe(false);
});
test("rejects strings of different lengths", () => {
  expect(isAnagram("a", "ab")).toBe(false);
  expect(isAnagram("ab", "a")).toBe(false);
});
test("counts repeated letters, not just which letters appear", () => {
  expect(isAnagram("aab", "abb")).toBe(false);
});
test("treats two empty strings as anagrams", () => {
  expect(isAnagram("", "")).toBe(true);
});
test("is case-sensitive", () => {
  expect(isAnagram("Abc", "abc")).toBe(false);
});
test("counts spaces and punctuation", () => {
  expect(isAnagram("a b!", "!b a")).toBe(true);
  expect(isAnagram("a b", "ab")).toBe(false);
});`,
    hints: [
      "Comparing the sets of letters is not enough: \"aab\" and \"abb\" use the same letters.",
      "Count how many times each character appears. If the strings have different lengths you can bail out immediately.",
      "Use one Map: add 1 for each character of a, subtract 1 for each character of b. They are anagrams exactly when every count ends at 0.",
    ],
    solution: `function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const ch of a) counts.set(ch, (counts.get(ch) || 0) + 1);
  for (const ch of b) {
    const n = counts.get(ch);
    if (!n) return false; // b has a character a ran out of
    counts.set(ch, n - 1);
  }
  return true;
}`,
    explanation: `Two strings are anagrams when they have the same multiset of characters. A frequency map captures that directly: count up for one string, count down for the other. Because the lengths match, if \`b\` never asks for a character that \`a\` has run out of, every count must end at zero.

This is O(n) time and O(k) space where k is the number of distinct characters. The one-liner \`[...a].sort().join("") === [...b].sort().join("")\` is also correct and perfectly fine in an interview, but costs O(n log n).

The classic mistake is comparing \`new Set(a)\` with \`new Set(b)\`, which ignores counts. Another is lowercasing or stripping spaces when the problem did not ask for it.

Follow-up: what changes for Unicode input? Iterating with \`for...of\` walks code points rather than UTF-16 units, which matters for emoji; full grapheme handling needs \`Intl.Segmenter\`.`,
  },
  {
    id: "cs-group-anagrams",
    title: "Group anagrams",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 20,
    tags: ["strings", "hashing"],
    prompt: `A tagging UI wants to cluster tags that are anagrams of each other. Write \`groupAnagrams(words)\` that takes an array of lowercase strings and returns an array of groups, where each group is an array of words that are anagrams of one another.

Ordering is fixed so the output is predictable:

- Groups appear in the order their **first word** appears in the input.
- Within a group, words keep their input order.
- Duplicate words are kept (both copies go in the same group).

\`\`\`
groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
// [["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]

groupAnagrams([])     // []
groupAnagrams([""])   // [[""]]
\`\`\``,
    starter: `function groupAnagrams(words) {\n  // your code here\n}`,
    tests: `test("groups the classic example in first-seen order", () => {
  expect(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"])).toEqual([["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]);
});
test("returns [] for an empty list", () => {
  expect(groupAnagrams([])).toEqual([]);
});
test("handles the empty string as a word", () => {
  expect(groupAnagrams(["", "b", ""])).toEqual([["", ""], ["b"]]);
});
test("keeps duplicate words", () => {
  expect(groupAnagrams(["ab", "ba", "ab"])).toEqual([["ab", "ba", "ab"]]);
});
test("does not group words with the same letters but different counts", () => {
  expect(groupAnagrams(["ab", "aab", "abb", "ba"])).toEqual([["ab", "ba"], ["aab"], ["abb"]]);
});
test("returns one group per word when nothing matches", () => {
  expect(groupAnagrams(["abc", "def", "ghi"])).toEqual([["abc"], ["def"], ["ghi"]]);
});
test("does not mutate the input", () => {
  const words = ["cab", "bca", "x"];
  groupAnagrams(words);
  expect(words).toEqual(["cab", "bca", "x"]);
});`,
    hints: [
      "Two words are anagrams exactly when they look identical after sorting their letters. That gives you a key.",
      "Use a Map from key to array of words. A Map remembers insertion order, which is the group order you need.",
      "For each word: key = [...word].sort().join(\"\"); push the word into map.get(key) (creating the array first if needed). Return [...map.values()].",
    ],
    solution: `function groupAnagrams(words) {
  const groups = new Map(); // sorted letters -> words
  for (const word of words) {
    const key = [...word].sort().join("");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}`,
    explanation: `Every anagram class has a canonical representative: the word's letters in sorted order. Bucketing words by that key groups them in one pass. Because a JavaScript \`Map\` iterates in insertion order, the groups come out in first-seen order for free, and pushing preserves the order within each group.

Time is O(n · k log k) for n words of length up to k, dominated by sorting each word. Space is O(n · k) for the map.

A faster key is a letter-count signature such as \`"1#0#2#..."\` built from a 26-slot array, giving O(n · k). If you build a count key, include a separator: without one, counts like 1,11 and 11,1 collide.

A common mistake is using a plain object and forgetting that keys like \`"constructor"\` or \`"__proto__"\` can misbehave; a Map avoids that. Follow-up: how would you stream this over a huge file of words? Same key, but persist buckets to disk or a key-value store.`,
  },
  {
    id: "cs-longest-substring-no-repeat",
    title: "Longest substring without repeats",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["strings", "sliding window", "hashing"],
    prompt: `Write \`lengthOfLongestSubstring(s)\` that returns the length of the longest **contiguous** substring of \`s\` in which no character repeats.

- The comparison is case-sensitive; spaces count as characters.
- An empty string returns \`0\`.

\`\`\`
lengthOfLongestSubstring("abcabcbb")  // 3  ("abc")
lengthOfLongestSubstring("pwwkew")    // 3  ("wke"; "pwke" is not contiguous)
lengthOfLongestSubstring("abba")      // 2
\`\`\`

Aim for O(n) time.`,
    starter: `function lengthOfLongestSubstring(s) {\n  // your code here\n}`,
    tests: `test("handles the classic example", () => {
  expect(lengthOfLongestSubstring("abcabcbb")).toBe(3);
});
test("handles a string of one repeated character", () => {
  expect(lengthOfLongestSubstring("bbbbb")).toBe(1);
});
test("requires the substring to be contiguous", () => {
  expect(lengthOfLongestSubstring("pwwkew")).toBe(3);
});
test("returns 0 for an empty string", () => {
  expect(lengthOfLongestSubstring("")).toBe(0);
});
test("never moves the window start backwards", () => {
  expect(lengthOfLongestSubstring("abba")).toBe(2);
});
test("does not restart from scratch at a repeat", () => {
  expect(lengthOfLongestSubstring("dvdf")).toBe(3);
});
test("counts spaces and is case-sensitive", () => {
  expect(lengthOfLongestSubstring("aA b")).toBe(4);
});
test("returns the full length when nothing repeats", () => {
  expect(lengthOfLongestSubstring("abcdefg")).toBe(7);
});`,
    hints: [
      "Keep a window [start, i] that never contains a repeat. When you hit a character already inside the window, the window has to shrink from the left.",
      "Remember the last index where you saw each character. On a repeat, jump start to just past that index instead of shrinking one step at a time.",
      "start = Math.max(start, last.get(ch) + 1). The Math.max matters: the last sighting may be left of the current window (try \"abba\"). Then record last.set(ch, i) and update best with i - start + 1.",
    ],
    solution: `function lengthOfLongestSubstring(s) {
  const last = new Map(); // char -> last index seen
  let start = 0;
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (last.has(ch)) start = Math.max(start, last.get(ch) + 1);
    last.set(ch, i);
    best = Math.max(best, i - start + 1);
  }
  return best;
}`,
    explanation: `This is the canonical sliding window. The window \`[start, i]\` always holds distinct characters. Each new character either extends the window, or it already appears inside the window, in which case the window must begin just after its previous occurrence.

Storing the last index of each character lets the left edge jump directly, so each step is O(1): O(n) time overall, and O(k) space for k distinct characters.

The subtle bug is forgetting \`Math.max\`. In \`"abba"\`, when the second \`a\` arrives its last index is 0, but \`start\` is already 2 because of the \`b\`. Without the max, \`start\` would move backwards to 1 and you would count \`"bba"\`. The other common mistake is resetting the window entirely on a repeat, which fails \`"dvdf"\`.

Follow-up: return the substring itself, or allow at most k distinct characters instead of all-distinct (shrink with a count map instead of jumping).`,
  },
  {
    id: "cs-max-subarray",
    title: "Maximum subarray (Kadane)",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 15,
    tags: ["arrays", "dynamic programming"],
    prompt: `A dashboard shows daily profit and loss. Product wants the best run of consecutive days. Write \`maxSubarray(nums)\` that returns the largest sum of any **non-empty** contiguous subarray.

- \`nums\` always has at least one element.
- If every number is negative, the answer is the largest (least negative) single element, not 0.

\`\`\`
maxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])  // 6  ([4, -1, 2, 1])
maxSubarray([-3, -1, -2])                     // -1
\`\`\`

Aim for O(n) time and O(1) extra space.`,
    starter: `function maxSubarray(nums) {\n  // your code here\n}`,
    tests: `test("handles the classic example", () => {
  expect(maxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])).toBe(6);
});
test("returns the largest element when all are negative", () => {
  expect(maxSubarray([-3, -1, -2])).toBe(-1);
});
test("handles a single element", () => {
  expect(maxSubarray([7])).toBe(7);
  expect(maxSubarray([-7])).toBe(-7);
});
test("sums everything when all are positive", () => {
  expect(maxSubarray([1, 2, 3, 4])).toBe(10);
});
test("drops a prefix that drags the sum down", () => {
  expect(maxSubarray([5, -9, 6])).toBe(6);
});
test("keeps going through a dip that is worth it", () => {
  expect(maxSubarray([5, -2, 6])).toBe(9);
});
test("handles zeros and negatives", () => {
  expect(maxSubarray([-1, 0, -2])).toBe(0);
});`,
    hints: [
      "Think about the best subarray that ends exactly at index i. How does it relate to the best one ending at i - 1?",
      "Either you extend the previous run, or you start fresh at nums[i]. Starting fresh is better whenever the previous run's sum is negative.",
      "Keep cur = Math.max(nums[i], cur + nums[i]) and best = Math.max(best, cur). Initialize both to nums[0], not 0, so all-negative input works.",
    ],
    solution: `function maxSubarray(nums) {
  let cur = nums[0]; // best sum of a subarray ending here
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,
    explanation: `Kadane's algorithm is a tiny dynamic program. Let \`cur\` be the best sum of a subarray ending at the current index. The best subarray ending here either extends the previous one or starts fresh, so \`cur = max(x, cur + x)\`. The overall answer is the best \`cur\` seen.

That is O(n) time and O(1) space. The brute force over all pairs is O(n²).

The most common bug is initializing \`cur\` and \`best\` to 0. That silently returns 0 for all-negative input, which corresponds to an empty subarray the problem does not allow. Initialize from \`nums[0]\` and loop from index 1.

Follow-up: return the start and end indices too (record \`start\` whenever you restart, and copy it when \`best\` improves), or solve the circular variant where the subarray may wrap around.`,
  },
  {
    id: "cs-product-except-self",
    title: "Product of array except self",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["arrays", "prefix sums"],
    prompt: `Write \`productExceptSelf(nums)\` that returns a new array \`out\` where \`out[i]\` is the product of every element of \`nums\` **except** \`nums[i]\`.

- **Do not use division.** (It also breaks on zeros, which the tests include.)
- \`nums\` has at least two elements. Do not mutate it.
- The tests treat \`-0\` and \`0\` as equal.

\`\`\`
productExceptSelf([1, 2, 3, 4])  // [24, 12, 8, 6]
productExceptSelf([1, 0, 3])     // [0, 3, 0]
\`\`\`

Aim for O(n) time and O(1) extra space besides the output array.`,
    starter: `function productExceptSelf(nums) {\n  // your code here\n}`,
    tests: `const z = (a) => (Array.isArray(a) ? a.map((x) => x + 0) : a); // -0 -> 0
test("handles the classic example", () => {
  expect(z(productExceptSelf([1, 2, 3, 4]))).toEqual([24, 12, 8, 6]);
});
test("handles a single zero", () => {
  expect(z(productExceptSelf([1, 0, 3]))).toEqual([0, 3, 0]);
});
test("handles two zeros", () => {
  expect(z(productExceptSelf([0, 4, 0, 2]))).toEqual([0, 0, 0, 0]);
});
test("handles negatives", () => {
  expect(z(productExceptSelf([-1, 2, -3, 4]))).toEqual([-24, 12, -8, 6]);
});
test("handles two elements", () => {
  expect(z(productExceptSelf([5, 9]))).toEqual([9, 5]);
});
test("handles a zero among negatives", () => {
  expect(z(productExceptSelf([-1, 1, 0, -3, 3]))).toEqual([0, 0, 9, 0, 0]);
});
test("does not mutate the input", () => {
  const nums = [2, 3, 4];
  const out = productExceptSelf(nums);
  expect(nums).toEqual([2, 3, 4]);
  expect(z(out)).toEqual([12, 8, 6]);
});`,
    hints: [
      "The product of everything except nums[i] is (product of everything to its left) times (product of everything to its right).",
      "Make one pass left to right writing the running prefix product into out[i] before multiplying in nums[i]. Then do the same from the right.",
      "Pass 1: let p = 1; for i ascending: out[i] = p; p *= nums[i]. Pass 2: let s = 1; for i descending: out[i] *= s; s *= nums[i].",
    ],
    solution: `function productExceptSelf(nums) {
  const n = nums.length;
  const out = new Array(n);
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    out[i] = prefix; // product of everything left of i
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= suffix; // times everything right of i
    suffix *= nums[i];
  }
  return out;
}`,
    explanation: `Each answer splits into a left part and a right part: \`out[i] = prefix(i) * suffix(i)\`. Computing prefix products left to right and suffix products right to left gives every answer in two passes. Storing prefixes in the output array and folding in the suffix with a single running variable keeps extra space at O(1).

Time is O(n). The naive approach of multiplying everything for each index is O(n²).

Dividing the total product by \`nums[i]\` is the tempting shortcut, but it fails as soon as there is a zero (division by zero) and needs special cases for one versus two zeros. That is exactly why interviewers forbid it.

Follow-up: the same prefix/suffix trick solves "trapping rain water" (prefix max and suffix max) and many "everything except me" questions.`,
  },
  {
    id: "cs-merge-intervals",
    title: "Merge intervals",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 20,
    tags: ["intervals", "sorting"],
    prompt: `A calendar view needs to shade busy time. Write \`mergeIntervals(intervals)\` that takes an array of \`[start, end]\` pairs (with \`start <= end\`, in any order) and returns a new array of non-overlapping intervals that cover exactly the same time.

- The result is sorted by start.
- Intervals that merely touch (\`[1, 4]\` and \`[4, 5]\`) are merged.
- Do not mutate the input array or its pairs.
- An empty input returns \`[]\`.

\`\`\`
mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]])  // [[1, 6], [8, 10], [15, 18]]
mergeIntervals([[1, 4], [4, 5]])                     // [[1, 5]]
mergeIntervals([[1, 10], [2, 3]])                    // [[1, 10]]
\`\`\``,
    starter: `function mergeIntervals(intervals) {\n  // your code here\n}`,
    tests: `test("merges the classic example", () => {
  expect(mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]])).toEqual([[1, 6], [8, 10], [15, 18]]);
});
test("merges intervals that only touch", () => {
  expect(mergeIntervals([[1, 4], [4, 5]])).toEqual([[1, 5]]);
});
test("handles unsorted input", () => {
  expect(mergeIntervals([[8, 10], [1, 3], [2, 6]])).toEqual([[1, 6], [8, 10]]);
});
test("keeps the larger end when one interval contains another", () => {
  expect(mergeIntervals([[1, 10], [2, 3], [4, 5]])).toEqual([[1, 10]]);
});
test("returns [] for an empty list", () => {
  expect(mergeIntervals([])).toEqual([]);
});
test("handles a single interval and zero-length intervals", () => {
  expect(mergeIntervals([[5, 5]])).toEqual([[5, 5]]);
  expect(mergeIntervals([[1, 2], [2, 2], [3, 3]])).toEqual([[1, 2], [3, 3]]);
});
test("does not mutate the input", () => {
  const input = [[3, 4], [1, 3]];
  mergeIntervals(input);
  expect(input).toEqual([[3, 4], [1, 3]]);
});`,
    hints: [
      "Overlaps are easy to spot once intervals are sorted by start: an interval can only overlap the one you are currently building.",
      "Sort a copy by start. Walk it, keeping the last merged interval. If the next start is <= that interval's end, extend; otherwise start a new one.",
      "When extending, use last[1] = Math.max(last[1], cur[1]), not cur[1], or a contained interval will shrink the result. Push copies ([s, e]) so you never mutate the caller's pairs.",
    ],
    solution: `function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [start, end] of sorted) {
    const last = out[out.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      out.push([start, end]); // fresh pair, not the caller's
    }
  }
  return out;
}`,
    explanation: `After sorting by start, any interval that overlaps the current merged block must come right after it, so a single sweep suffices. Each interval either extends the last block or starts a new one.

Sorting dominates: O(n log n) time, O(n) space for the copy and output.

Three classic bugs: forgetting to sort (or sorting the caller's array in place), using \`end\` instead of \`Math.max(last[1], end)\` so \`[1, 10]\` followed by \`[2, 3]\` shrinks to \`[1, 3]\`, and pushing the original pair then mutating it, which changes the caller's data. Also note \`sort()\` without a comparator sorts numbers as strings.

Follow-up: given a stream of intervals arriving one at a time, how would you keep the merged set up to date? (A sorted structure with binary search, which leads into the "insert interval" problem.)`,
  },
  {
    id: "cs-insert-interval",
    title: "Insert interval",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["intervals", "arrays"],
    prompt: `A booking widget keeps a user's reserved slots as a sorted list of non-overlapping \`[start, end]\` intervals. Write \`insertInterval(intervals, newInterval)\` that returns a **new** sorted, non-overlapping list with \`newInterval\` added, merging wherever it overlaps or touches existing intervals.

- \`intervals\` is already sorted by start and non-overlapping.
- Touching intervals merge (\`[1, 2]\` plus \`[2, 3]\` becomes \`[1, 3]\`).
- Do not mutate \`intervals\`, its pairs, or \`newInterval\`.

\`\`\`
insertInterval([[1, 3], [6, 9]], [2, 5])                    // [[1, 5], [6, 9]]
insertInterval([[1, 2], [3, 5], [6, 7], [8, 10]], [4, 8])   // [[1, 2], [3, 10]]
insertInterval([], [5, 7])                                  // [[5, 7]]
\`\`\`

Aim for O(n) time; you do not need to sort.`,
    starter: `function insertInterval(intervals, newInterval) {\n  // your code here\n}`,
    tests: `test("merges into one existing interval", () => {
  expect(insertInterval([[1, 3], [6, 9]], [2, 5])).toEqual([[1, 5], [6, 9]]);
});
test("swallows several intervals at once", () => {
  expect(insertInterval([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8])).toEqual([[1, 2], [3, 10], [12, 16]]);
});
test("inserts into an empty list", () => {
  expect(insertInterval([], [5, 7])).toEqual([[5, 7]]);
});
test("inserts at the very start and very end", () => {
  expect(insertInterval([[3, 4], [6, 7]], [0, 1])).toEqual([[0, 1], [3, 4], [6, 7]]);
  expect(insertInterval([[3, 4], [6, 7]], [9, 10])).toEqual([[3, 4], [6, 7], [9, 10]]);
});
test("inserts into a gap without merging", () => {
  expect(insertInterval([[1, 2], [8, 9]], [4, 5])).toEqual([[1, 2], [4, 5], [8, 9]]);
});
test("merges intervals that only touch", () => {
  expect(insertInterval([[1, 2], [5, 6]], [2, 5])).toEqual([[1, 6]]);
});
test("handles a new interval inside an existing one", () => {
  expect(insertInterval([[1, 10]], [3, 4])).toEqual([[1, 10]]);
});
test("does not mutate its inputs", () => {
  const list = [[1, 3], [6, 9]];
  const add = [2, 5];
  insertInterval(list, add);
  expect(list).toEqual([[1, 3], [6, 9]]);
  expect(add).toEqual([2, 5]);
});`,
    hints: [
      "Because the list is sorted, it splits into three runs: intervals entirely before the new one, intervals that overlap it, and intervals entirely after.",
      "Copy everything that ends before newInterval starts. Then, while an interval starts at or before newInterval's end, absorb it by widening a merged [start, end]. Push that, then copy the rest.",
      "Before: intervals[i][1] < start. Overlap: intervals[i][0] <= end, with start = Math.min(...), end = Math.max(...). Work on local variables, never on the input pairs.",
    ],
    solution: `function insertInterval(intervals, newInterval) {
  const out = [];
  let [start, end] = newInterval;
  let i = 0;
  // 1. entirely before
  while (i < intervals.length && intervals[i][1] < start) {
    out.push([...intervals[i++]]);
  }
  // 2. overlapping or touching: widen the new interval
  while (i < intervals.length && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    i++;
  }
  out.push([start, end]);
  // 3. entirely after
  while (i < intervals.length) out.push([...intervals[i++]]);
  return out;
}`,
    explanation: `Since the input is sorted and non-overlapping, you do not need the general merge. One left-to-right scan has three phases: copy intervals that end before the new one starts, absorb every interval that starts before the new one ends, then copy the rest.

That is O(n) time and O(n) for the output. Appending and calling the full "merge intervals" also works but costs O(n log n) for the sort, which an interviewer will ask you to avoid.

The comparison operators decide how touching intervals behave: \`< start\` and \`<= end\` mean an interval ending exactly at \`start\` is merged. Getting those backwards is the most common bug. The other is mutating \`newInterval\` or the input pairs while widening.

Follow-up: if intervals live in a large sorted array, you can find the overlapping range with two binary searches, though splicing is still O(n) in the worst case.`,
  },
  {
    id: "cs-rotate-matrix",
    title: "Rotate a matrix in place",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["matrices", "in place"],
    prompt: `An image editor stores a square image as an n×n array of rows. Write \`rotate(matrix)\` that rotates it **90 degrees clockwise in place**.

- Mutate \`matrix\` directly. Keep the same row arrays (change their contents; do not replace them with new arrays). Returning a value is optional; the tests only look at \`matrix\`.
- \`matrix\` may be any size from 1×1 up.

\`\`\`
const m = [[1, 2, 3],
           [4, 5, 6],
           [7, 8, 9]];
rotate(m);
// m is now [[7, 4, 1],
//           [8, 5, 2],
//           [9, 6, 3]]
\`\`\`

Aim for O(1) extra space.`,
    starter: `function rotate(matrix) {\n  // your code here\n}`,
    tests: `const grid = (n) => Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1));
test("rotates a 3x3 matrix clockwise", () => {
  const m = grid(3);
  rotate(m);
  expect(m).toEqual([[7, 4, 1], [8, 5, 2], [9, 6, 3]]);
});
test("rotates a 4x4 matrix clockwise", () => {
  const m = grid(4);
  rotate(m);
  expect(m).toEqual([[13, 9, 5, 1], [14, 10, 6, 2], [15, 11, 7, 3], [16, 12, 8, 4]]);
});
test("rotates a 2x2 matrix", () => {
  const m = [[1, 2], [3, 4]];
  rotate(m);
  expect(m).toEqual([[3, 1], [4, 2]]);
});
test("leaves a 1x1 matrix alone", () => {
  const m = [[42]];
  rotate(m);
  expect(m).toEqual([[42]]);
});
test("keeps the same row arrays (truly in place)", () => {
  const m = grid(3);
  const rows = m.slice();
  rotate(m);
  expect(m.length).toBe(3);
  rows.forEach((row, i) => expect(m[i] === row).toBe(true));
  expect(m).toEqual([[7, 4, 1], [8, 5, 2], [9, 6, 3]]);
});
test("four rotations return to the original", () => {
  const m = grid(5);
  for (let i = 0; i < 4; i++) rotate(m);
  expect(m).toEqual(grid(5));
});`,
    hints: [
      "A clockwise rotation can be built from two simpler in-place operations you already know how to do.",
      "Transpose the matrix (swap m[r][c] with m[c][r]), then reverse each row.",
      "For the transpose, only loop c from r + 1 so each pair is swapped once: [m[r][c], m[c][r]] = [m[c][r], m[r][c]]. Then m.forEach(row => row.reverse()), which reverses each row array in place.",
    ],
    solution: `function rotate(matrix) {
  const n = matrix.length;
  // transpose across the main diagonal
  for (let r = 0; r < n; r++) {
    for (let c = r + 1; c < n; c++) {
      [matrix[r][c], matrix[c][r]] = [matrix[c][r], matrix[r][c]];
    }
  }
  // then mirror each row
  for (const row of matrix) row.reverse();
}`,
    explanation: `A 90° clockwise rotation sends cell \`(r, c)\` to \`(c, n - 1 - r)\`. Transposing sends \`(r, c)\` to \`(c, r)\`, and reversing each row then sends \`(c, r)\` to \`(c, n - 1 - r)\`. Composing two easy in-place steps gives the rotation.

Time is O(n²), which is optimal since every cell moves, and extra space is O(1).

Common bugs: looping the transpose over the whole matrix (each pair is swapped twice, undoing itself), reversing the outer array instead of each row (that gives a counter-clockwise rotation after the transpose), and building a new matrix then reassigning, which is not in place.

The alternative is rotating layer by layer, moving four cells at a time. Follow-up: rotate counter-clockwise (reverse rows first, or transpose then reverse the outer array), or rotate a non-square image, which cannot be done in place.`,
  },
  {
    id: "cs-spiral-order",
    title: "Spiral order traversal",
    track: "CS fundamentals",
    level: "Medium",
    minutes: 25,
    tags: ["matrices", "simulation"],
    prompt: `Write \`spiralOrder(matrix)\` that returns all elements of an m×n matrix in clockwise spiral order, starting at the top-left and moving right.

- The matrix may be rectangular (including a single row or a single column).
- An empty matrix (\`[]\`) returns \`[]\`.
- Do not mutate the matrix. Every element appears exactly once.

\`\`\`
spiralOrder([[1, 2, 3],
             [4, 5, 6],
             [7, 8, 9]])
// [1, 2, 3, 6, 9, 8, 7, 4, 5]

spiralOrder([[1, 2, 3, 4],
             [5, 6, 7, 8],
             [9, 10, 11, 12]])
// [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
\`\`\``,
    starter: `function spiralOrder(matrix) {\n  // your code here\n}`,
    tests: `test("walks a 3x3 matrix", () => {
  expect(spiralOrder([[1, 2, 3], [4, 5, 6], [7, 8, 9]])).toEqual([1, 2, 3, 6, 9, 8, 7, 4, 5]);
});
test("walks a wide 3x4 matrix", () => {
  expect(spiralOrder([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]])).toEqual([1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]);
});
test("walks a tall 4x2 matrix without repeats", () => {
  expect(spiralOrder([[1, 2], [3, 4], [5, 6], [7, 8]])).toEqual([1, 2, 4, 6, 8, 7, 5, 3]);
});
test("handles a single row", () => {
  expect(spiralOrder([[1, 2, 3]])).toEqual([1, 2, 3]);
});
test("handles a single column", () => {
  expect(spiralOrder([[1], [2], [3]])).toEqual([1, 2, 3]);
});
test("handles a 3x5 matrix whose center is a single row", () => {
  expect(spiralOrder([[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15]])).toEqual([1, 2, 3, 4, 5, 10, 15, 14, 13, 12, 11, 6, 7, 8, 9]);
});
test("returns [] for an empty matrix", () => {
  expect(spiralOrder([])).toEqual([]);
});
test("does not mutate the matrix", () => {
  const m = [[1, 2], [3, 4]];
  expect(spiralOrder(m)).toEqual([1, 2, 4, 3]);
  expect(m).toEqual([[1, 2], [3, 4]]);
});`,
    hints: [
      "Track four boundaries: top, bottom, left, right. Each lap peels off one edge in turn and moves that boundary inward.",
      "Go right along top (then top++), down along right (right--), left along bottom (bottom--), up along left (left++), while top <= bottom and left <= right.",
      "The bottom and left passes need their own guards (if top <= bottom, if left <= right) because the first two passes may have already used up the last row or column. Without them, single rows and columns come out doubled.",
    ],
    solution: `function spiralOrder(matrix) {
  const out = [];
  if (!matrix.length) return out;
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(matrix[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(matrix[r][right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) out.push(matrix[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) out.push(matrix[r][left]);
      left++;
    }
  }
  return out;
}`,
    explanation: `The boundary approach treats the matrix as nested rings. Each lap emits the top row, right column, bottom row and left column of the current ring, shrinking the corresponding boundary after each edge. Every cell is visited once: O(m·n) time and O(1) extra space beyond the output.

The trap is rectangular input. After the top and right passes, the remaining region may be a single row or column, or empty. Without the \`top <= bottom\` and \`left <= right\` checks before the bottom and left passes, you walk the same strip back the other way and emit duplicates. Square test cases hide this bug, which is why interviewers like rectangular ones.

An alternative is direction-vector simulation with a visited set, turning right whenever you hit an edge or a visited cell. It is easier to get right under pressure but uses O(m·n) extra space.

Follow-up: generate an n×n matrix filled 1..n² in spiral order (same boundaries, writing instead of reading).`,
  },
  {
    id: "cs-move-zeroes",
    title: "Move zeroes in place",
    track: "CS fundamentals",
    level: "Easy",
    minutes: 15,
    tags: ["arrays", "two pointers", "in place"],
    prompt: `Write \`moveZeroes(nums)\` that moves every \`0\` to the end of the array **in place**, while keeping the relative order of the non-zero elements.

- Mutate \`nums\` directly; do not create and return a new array (the tests only look at the array you were given).
- Do it with O(1) extra space.

\`\`\`
const a = [0, 1, 0, 3, 12];
moveZeroes(a);
// a is now [1, 3, 12, 0, 0]
\`\`\``,
    starter: `function moveZeroes(nums) {\n  // your code here\n}`,
    tests: `test("moves zeroes to the end of the classic example", () => {
  const a = [0, 1, 0, 3, 12];
  moveZeroes(a);
  expect(a).toEqual([1, 3, 12, 0, 0]);
});
test("keeps the relative order of non-zero values", () => {
  const a = [4, 0, 2, 0, 9, 1];
  moveZeroes(a);
  expect(a).toEqual([4, 2, 9, 1, 0, 0]);
});
test("handles negatives without sorting them", () => {
  const a = [0, -3, 5, 0, -1];
  moveZeroes(a);
  expect(a).toEqual([-3, 5, -1, 0, 0]);
});
test("leaves an array without zeroes unchanged", () => {
  const a = [1, 2, 3];
  moveZeroes(a);
  expect(a).toEqual([1, 2, 3]);
});
test("handles all zeroes and an empty array", () => {
  const a = [0, 0, 0];
  moveZeroes(a);
  expect(a).toEqual([0, 0, 0]);
  const b = [];
  moveZeroes(b);
  expect(b).toEqual([]);
});
test("handles leading zeroes", () => {
  const a = [0, 0, 1];
  moveZeroes(a);
  expect(a).toEqual([1, 0, 0]);
});
test("keeps the array length", () => {
  const a = [0, 5, 0];
  moveZeroes(a);
  expect(a).toHaveLength(3);
  expect(a).toEqual([5, 0, 0]);
});`,
    hints: [
      "Think of a write pointer: the position where the next non-zero value should go.",
      "Scan with a read pointer. Every non-zero value gets written at the write pointer, which then advances. Zeroes are simply skipped.",
      "After the scan, everything from the write pointer to the end should be 0, so fill it. Or swap nums[read] and nums[write] as you go and the zeroes end up at the back on their own.",
    ],
    solution: `function moveZeroes(nums) {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
}`,
    explanation: `This is the read/write two-pointer pattern. The write pointer marks the end of the compacted, non-zero prefix. Each non-zero value is swapped into that slot, so non-zeros keep their order and zeroes drift to the back. One pass: O(n) time, O(1) space.

The swap version also minimizes writes when there are few zeroes. The alternative, copying non-zeros forward then filling the tail with zeroes, is just as good.

Common mistakes: returning \`nums.filter(...).concat(zeros)\` (not in place, and the caller's array is unchanged), sorting (breaks the order of non-zero values), and splicing zeroes out while iterating forward, which skips elements and is O(n²).

Follow-up: the same pattern removes duplicates from a sorted array in place, or partitions an array around a pivot.`,
  },
);
