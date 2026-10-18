// Test runtime injected into the sandboxed iframe before the user's code and the problem's tests.
// Globals for tests: test(name, fn), expect(value), sleep(ms), rejects(promiseOrFn, pattern?).
(function () {
  var tests = [];
  var post = function (msg) {
    if (window.__report) window.__report(msg);
    else parent.postMessage(Object.assign({ __calisthenics: true }, msg), "*");
  };

  function fmt(v, depth) {
    depth = depth || 0;
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "function") return "[Function " + (v.name || "anonymous") + "]";
    if (typeof v === "bigint") return v + "n";
    if (v === undefined) return "undefined";
    if (typeof v === "number" && Object.is(v, -0)) return "-0";
    if (v instanceof Error) return v.name + ": " + v.message;
    if (typeof Node !== "undefined" && v instanceof Node) return v.outerHTML ? v.outerHTML.slice(0, 120) : String(v.nodeName);
    if (v instanceof Map) return "Map(" + fmt(Array.from(v.entries()), depth + 1) + ")";
    if (v instanceof Set) return "Set(" + fmt(Array.from(v), depth + 1) + ")";
    if (depth > 3) return Array.isArray(v) ? "[…]" : "{…}";
    if (Array.isArray(v)) {
      var items = v.slice(0, 20).map(function (x) { return fmt(x, depth + 1); });
      return "[" + items.join(", ") + (v.length > 20 ? ", … " + (v.length - 20) + " more" : "") + "]";
    }
    if (v && typeof v === "object") {
      var keys = Object.keys(v);
      return "{ " + keys.slice(0, 12).map(function (k) { return k + ": " + fmt(v[k], depth + 1); }).join(", ") + (keys.length > 12 ? ", …" : "") + " }";
    }
    return String(v);
  }

  function eq(a, b, seen) {
    if (Object.is(a, b)) return true;
    if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
    if (a instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof Map || a instanceof Set) {
      if (a.size !== b.size) return false;
      return eq(Array.from(a.entries()), Array.from(b.entries()), seen);
    }
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var i = 0; i < ka.length; i++) {
      if (!Object.prototype.hasOwnProperty.call(b, ka[i])) return false;
      if (!eq(a[ka[i]], b[ka[i]], seen)) return false;
    }
    return true;
  }

  function fail(msg) { var e = new Error(msg); e.__assertion = true; throw e; }

  function matchers(actual, negate) {
    var check = function (pass, msg, negMsg) { if (negate ? pass : !pass) fail(negate ? negMsg : msg); };
    var m = {
      toBe: function (exp) { check(Object.is(actual, exp), "Expected " + fmt(exp) + ", got " + fmt(actual), "Expected value not to be " + fmt(exp)); },
      toEqual: function (exp) { check(eq(actual, exp), "Expected " + fmt(exp) + ", got " + fmt(actual), "Expected value not to equal " + fmt(exp)); },
      toBeTruthy: function () { check(!!actual, "Expected a truthy value, got " + fmt(actual), "Expected a falsy value, got " + fmt(actual)); },
      toBeFalsy: function () { check(!actual, "Expected a falsy value, got " + fmt(actual), "Expected a truthy value, got " + fmt(actual)); },
      toBeNull: function () { check(actual === null, "Expected null, got " + fmt(actual), "Expected a value other than null"); },
      toBeUndefined: function () { check(actual === undefined, "Expected undefined, got " + fmt(actual), "Expected a value other than undefined"); },
      toBeGreaterThan: function (n) { check(actual > n, "Expected " + fmt(actual) + " to be greater than " + n, "Expected " + fmt(actual) + " not to be greater than " + n); },
      toBeGreaterThanOrEqual: function (n) { check(actual >= n, "Expected " + fmt(actual) + " to be at least " + n, "Expected " + fmt(actual) + " to be less than " + n); },
      toBeLessThan: function (n) { check(actual < n, "Expected " + fmt(actual) + " to be less than " + n, "Expected " + fmt(actual) + " not to be less than " + n); },
      toBeLessThanOrEqual: function (n) { check(actual <= n, "Expected " + fmt(actual) + " to be at most " + n, "Expected " + fmt(actual) + " to be greater than " + n); },
      toBeCloseTo: function (n, digits) { var d = digits == null ? 6 : digits; check(Math.abs(actual - n) < Math.pow(10, -d) / 2, "Expected " + fmt(actual) + " to be close to " + n, "Expected " + fmt(actual) + " not to be close to " + n); },
      toContain: function (x) {
        var has = typeof actual === "string" ? actual.indexOf(x) !== -1 : Array.from(actual || []).some(function (y) { return eq(y, x); });
        check(has, "Expected " + fmt(actual) + " to contain " + fmt(x), "Expected " + fmt(actual) + " not to contain " + fmt(x));
      },
      toHaveLength: function (n) { var len = actual == null ? undefined : actual.length; check(len === n, "Expected length " + n + ", got " + fmt(len), "Expected length other than " + n); },
      toMatch: function (re) { var r = typeof re === "string" ? new RegExp(re) : re; check(r.test(String(actual)), "Expected " + fmt(actual) + " to match " + r, "Expected " + fmt(actual) + " not to match " + r); },
      toBeInstanceOf: function (C) { check(actual instanceof C, "Expected an instance of " + (C && C.name), "Expected not an instance of " + (C && C.name)); },
      toThrow: function (pattern) {
        var threw = false, err;
        try { actual(); } catch (e) { threw = true; err = e; }
        var ok = threw && (pattern == null || (pattern instanceof RegExp ? pattern.test(String(err && err.message)) : String(err && err.message).indexOf(pattern) !== -1));
        check(ok, threw ? "Threw " + fmt(err) + ", which doesn't match " + fmt(pattern) : "Expected the function to throw", "Expected the function not to throw, but it threw " + fmt(err));
      },
    };
    return m;
  }

  window.expect = function (actual) {
    var m = matchers(actual, false);
    m.not = matchers(actual, true);
    return m;
  };
  window.test = function (name, fn) { tests.push({ name: name, fn: fn }); };
  window.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  window.rejects = async function (p, pattern) {
    try { await (typeof p === "function" ? p() : p); } catch (e) {
      if (pattern == null) return e;
      var msg = String(e && e.message);
      if (pattern instanceof RegExp ? pattern.test(msg) : msg.indexOf(pattern) !== -1) return e;
      fail("Rejected with " + fmt(e) + ", which doesn't match " + fmt(pattern));
    }
    fail("Expected the promise to reject");
  };

  var logs = [];
  ["log", "info", "warn", "error"].forEach(function (k) {
    var orig = console[k];
    console[k] = function () {
      var line = Array.prototype.map.call(arguments, function (a) { return typeof a === "string" ? a : fmt(a); }).join(" ");
      if (logs.length < 200) logs.push({ level: k, text: line.slice(0, 2000) });
      try { orig.apply(console, arguments); } catch (e) {}
    };
  });

  window.addEventListener("error", function (e) {
    post({ type: "error", message: (e.error && e.error.name ? e.error.name + ": " : "") + (e.error ? e.error.message : e.message), line: e.lineno, logs: logs });
  });
  window.addEventListener("unhandledrejection", function (e) {
    logs.push({ level: "error", text: "Unhandled rejection: " + fmt(e.reason) });
  });

  window.__runTests = async function () {
    var results = [];
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i];
      if (document.body) document.body.innerHTML = "";
      var started = Date.now();
      try {
        await Promise.race([
          Promise.resolve().then(t.fn),
          new Promise(function (_, rej) { setTimeout(function () { rej(new Error("Timed out after 3 seconds")); }, 3000); }),
        ]);
        results.push({ name: t.name, pass: true, ms: Date.now() - started });
      } catch (e) {
        results.push({ name: t.name, pass: false, ms: Date.now() - started, message: e && e.__assertion ? e.message : fmt(e) });
      }
    }
    post({ type: "results", results: results, logs: logs });
  };
})();
