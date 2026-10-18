// Code Review Drills: exercise bank.
// Each issue is located by `at`: substrings that each match exactly one line of `code`.
// sev: critical | major | minor. cat: any of bug, security, performance, a11y, design.
// kw: words that show the reviewer explained the real cause (case-insensitive substring match).

window.EXERCISES = [
  {
    id: "search-box",
    track: "Frontend",
    lang: "tsx",
    level: "Medium",
    file: "src/components/SearchBox.tsx",
    title: "Add live search to the command palette",
    author: "maya-k",
    description:
      "Adds a search box that queries /api/search as you type and lists matching pages. Clicking a result navigates to it. Looking for a quick approval so this can go out with the palette redesign.",
    code: `
import { useEffect, useState } from "react";
import { Spinner } from "./Spinner";

type Result = { id: string; title: string; href: string };

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/search?q=" + query)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results);
        setLoading(false);
      });
  }, []);

  return (
    <div className="search">
      <input
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <Spinner />}
      <ul>
        {results.map((r, i) => (
          <li key={i} onClick={() => (window.location.href = r.href)}>
            {r.title}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
    issues: [
      {
        title: "Effect never re-runs when the query changes",
        sev: "critical",
        cat: ["bug"],
        at: ["}, []);"],
        kw: ["depend", "deps", "query", "re-run", "rerun", "only once", "on mount", "stale"],
        why: "The dependency array is empty, so the search runs once on mount with an empty query and never again. Typing does nothing.",
        fix: "}, [query]);",
      },
      {
        title: "Out-of-order responses can overwrite newer results",
        sev: "major",
        cat: ["bug"],
        at: ["useEffect(() => {", ".then((data) => {"],
        kw: ["race", "abort", "out of order", "out-of-order", "cancel", "cleanup", "ignore", "older", "stale"],
        why: "Once the effect depends on the query, a slow response for \"re\" can land after the response for \"react\" and replace it. The effect needs a cleanup that aborts or ignores the previous request.",
        fix: "const controller = new AbortController();\nfetch(url, { signal: controller.signal })...\nreturn () => controller.abort();",
      },
      {
        title: "Query is not URL-encoded",
        sev: "minor",
        cat: ["bug", "security"],
        at: ['fetch("/api/search?q=" + query)'],
        kw: ["encode", "urlsearchparams", "escape", "&", "special char"],
        why: "A query containing &, # or + breaks the URL or injects extra parameters.",
        fix: 'fetch("/api/search?" + new URLSearchParams({ q: query }))',
      },
      {
        title: "Failed requests leave the spinner on forever",
        sev: "major",
        cat: ["bug"],
        at: [".then((res) => res.json())"],
        kw: ["error", "catch", "res.ok", "status", "fail", "reject", "finally"],
        why: "fetch only rejects on network failure, and there is no catch either way. A 500 or a network error leaves loading stuck at true and logs an unhandled rejection.",
        fix: "if (!res.ok) throw new Error(res.statusText);\n// ...\n.catch(setError).finally(() => setLoading(false));",
      },
      {
        title: "A request goes out on every keystroke",
        sev: "minor",
        cat: ["performance"],
        at: ["onChange={(e) => setQuery(e.target.value)}"],
        kw: ["debounce", "throttle", "keystroke", "every key", "each key"],
        why: "Typing a ten-letter word sends ten requests. Debounce the query before it drives the effect.",
        fix: "const debouncedQuery = useDebounce(query, 200);",
      },
      {
        title: "Input has no accessible name",
        sev: "minor",
        cat: ["a11y"],
        at: ['placeholder="Search…"'],
        kw: ["label", "aria-label", "screen reader", "accessible name", "placeholder"],
        why: "A placeholder is not a label. Screen readers may announce nothing, and the hint disappears once the user types.",
        fix: '<label htmlFor="search" className="sr-only">Search pages</label>\n<input id="search" type="search" ... />',
      },
      {
        title: "Array index used as React key",
        sev: "minor",
        cat: ["bug", "performance"],
        at: ["{results.map((r, i) => ("],
        kw: ["key", "index", "r.id", "id"],
        why: "Results reorder on every search, so index keys make React reuse the wrong DOM nodes. Each result already has a stable id.",
        fix: "<li key={r.id}>",
      },
      {
        title: "Clickable list item is not keyboard accessible",
        sev: "major",
        cat: ["a11y"],
        at: ["<li key={i} onClick="],
        kw: ["keyboard", "link", "<a", "anchor", "focus", "tab", "button", "href", "middle-click", "new tab"],
        why: "An li with onClick can't be focused or activated with the keyboard, and users lose open-in-new-tab. Navigation should be a real link.",
        fix: '<li key={r.id}><a href={r.href}>{r.title}</a></li>',
      },
    ],
  },

  {
    id: "modal",
    track: "Frontend",
    lang: "tsx",
    level: "Medium",
    file: "packages/ui/src/Modal.tsx",
    title: "Reusable Modal for the design system",
    author: "devon-r",
    description:
      "Adds a Modal primitive to the component library: overlay, title, close button, closes on Escape and on backdrop click. Three product teams are waiting to adopt it.",
    code: `
import { useEffect } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") onClose();
    });
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <div className="close" onClick={onClose}>×</div>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}`,
    issues: [
      {
        title: "Clicking anywhere inside the modal closes it",
        sev: "critical",
        cat: ["bug"],
        at: ['<div className="overlay" onClick={onClose}>'],
        kw: ["bubbl", "propagat", "target", "currenttarget", "inside", "any click"],
        why: "Clicks inside the dialog bubble up to the overlay's onClick, so typing in a form field or pressing a button inside closes the modal.",
        fix: "onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}",
      },
      {
        title: "Page scroll is locked even when closed, and never restored",
        sev: "major",
        cat: ["bug"],
        at: ['document.body.style.overflow = "hidden";'],
        kw: ["restore", "cleanup", "reset", "closed", "never", "unmount", "scroll"],
        why: "The effect runs on mount whether or not the modal is open and has no cleanup, so the whole page stops scrolling as soon as any Modal is rendered.",
        fix: 'if (!open) return;\nconst prev = document.body.style.overflow;\ndocument.body.style.overflow = "hidden";\nreturn () => { document.body.style.overflow = prev; };',
      },
      {
        title: "Keydown listener leaks and stacks up",
        sev: "major",
        cat: ["bug", "performance"],
        at: ['window.addEventListener("keydown"'],
        kw: ["removeeventlistener", "cleanup", "leak", "remove", "stack", "multiple", "duplicate"],
        why: "A new anonymous listener is added every time open changes and none are removed, so Escape fires onClose several times, including after the modal is gone.",
        fix: "const onKey = (e) => { if (e.key === \"Escape\") onClose(); };\nwindow.addEventListener(\"keydown\", onKey);\nreturn () => window.removeEventListener(\"keydown\", onKey);",
      },
      {
        title: "onClose missing from effect dependencies",
        sev: "minor",
        cat: ["bug"],
        at: ["}, [open]);"],
        kw: ["onclose", "stale", "depend", "deps", "exhaustive"],
        why: "The listener captures the first onClose it saw. If the parent passes a new callback, Escape calls the stale one.",
        fix: "}, [open, onClose]);",
      },
      {
        title: "No dialog semantics",
        sev: "major",
        cat: ["a11y"],
        at: ['<div className="modal">'],
        kw: ["role", "dialog", "aria-modal", "aria-labelledby", "<dialog", "semantic"],
        why: "Assistive tech has no idea this is a modal. It needs role=\"dialog\", aria-modal, and a label tied to the heading, or use the native dialog element.",
        fix: '<div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>\n  <h2 id={titleId}>{title}</h2>',
      },
      {
        title: "Close control is a div",
        sev: "major",
        cat: ["a11y"],
        at: ['<div className="close" onClick={onClose}>'],
        kw: ["button", "focus", "keyboard", "aria-label", "tab", "×"],
        why: "It can't be reached with Tab or activated with Enter, and \"×\" is read as \"times\" or nothing at all.",
        fix: '<button type="button" className="close" aria-label="Close" onClick={onClose}>×</button>',
      },
      {
        title: "Focus is not moved, trapped, or restored",
        sev: "major",
        cat: ["a11y"],
        at: ["return createPortal("],
        kw: ["focus", "trap", "restore", "inert", "return focus"],
        why: "Keyboard users stay focused on the page behind the overlay, can Tab out of the dialog, and lose their place when it closes.",
        fix: "Move focus into the dialog on open, keep Tab inside it (or set inert on the app root), and return focus to the trigger on close.",
      },
    ],
  },

  {
    id: "button",
    track: "Frontend",
    lang: "tsx",
    level: "Easy",
    file: "packages/ui/src/Button.tsx",
    title: "Button component with variants and loading state",
    author: "sam-l",
    description:
      "First component in the new design system. Supports primary, secondary and ghost variants, a disabled state, and a loading state that swaps the label for a spinner.",
    code: `
import React from "react";
import { Spinner } from "./Spinner";
import "./button.css";

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  loading,
  disabled,
  onClick,
  children,
  className,
}: ButtonProps) {
  return (
    <button
      className={className ?? "btn btn-" + variant}
      onClick={onClick}
      style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.5 : 1 }}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}`,
    issues: [
      {
        title: "Disabled button is still focusable and keyboard-clickable",
        sev: "major",
        cat: ["a11y", "bug"],
        at: ["pointerEvents: disabled"],
        kw: ["disabled attribute", "disabled={", "keyboard", "focus", "aria-disabled", "enter", "space", "still click", "pointer-events"],
        why: "pointer-events only blocks the mouse. Tab plus Enter or Space still fires onClick, and screen readers don't announce it as disabled.",
        fix: "<button disabled={disabled || loading} ...>",
      },
      {
        title: "Missing type=\"button\" submits surrounding forms",
        sev: "major",
        cat: ["bug"],
        at: ["    <button"],
        kw: ["type", "submit", "form"],
        why: "A button's default type is submit. Dropping this inside any form, as a \"Cancel\" for example, submits the form.",
        fix: '<button type={type ?? "button"} ...>',
      },
      {
        title: "Custom className wipes out the variant classes",
        sev: "minor",
        cat: ["bug", "design"],
        at: ['className={className ?? "btn btn-" + variant}'],
        kw: ["merge", "override", "replace", "combine", "clsx", "classnames", "concat", "lose", "wipe"],
        why: "Passing className=\"mt-4\" to add spacing removes btn and btn-primary entirely, so the button loses all its styling.",
        fix: 'className={clsx("btn", "btn-" + variant, className)}',
      },
      {
        title: "Can be clicked again while loading",
        sev: "major",
        cat: ["bug"],
        at: ["onClick={onClick}"],
        kw: ["double", "twice", "again", "loading", "while", "prevent", "duplicate"],
        why: "Nothing stops a second click during loading, which is exactly when users double-submit payments and forms.",
        fix: "disabled={disabled || loading}",
      },
      {
        title: "Loading state removes the accessible name and shifts layout",
        sev: "minor",
        cat: ["a11y", "design"],
        at: ["{loading ? <Spinner /> : children}"],
        kw: ["aria-busy", "label", "name", "width", "layout", "shift", "jump", "screen reader", "announce"],
        why: "Swapping the label for a spinner leaves the button with no text for screen readers and changes its width, so surrounding layout jumps.",
        fix: '<span className={loading ? "invisible" : ""}>{children}</span>\n{loading && <Spinner aria-hidden className="absolute" />}\n// plus aria-busy={loading}',
      },
      {
        title: "Props don't extend native button attributes",
        sev: "minor",
        cat: ["design"],
        at: ["type ButtonProps = {"],
        kw: ["buttonhtmlattributes", "componentprops", "componentpropswithoutref", "extend", "rest", "spread", "...props", "aria", "forwardref", "ref"],
        why: "Consumers can't pass type, aria-*, data-* attributes, form, or a ref. Every new need becomes a breaking change to the component.",
        fix: 'type ButtonProps = React.ComponentPropsWithRef<"button"> & { variant?: ...; loading?: boolean };',
      },
    ],
  },

  {
    id: "users-api",
    track: "Backend",
    lang: "js",
    level: "Medium",
    file: "server/routes/users.js",
    title: "Profile endpoints: GET and PUT /api/users/:id",
    author: "priya-n",
    description:
      "Adds the two endpoints the new profile page needs: fetch a user by id, and update name, email and role from the settings form. Tested manually with curl.",
    code: `
const express = require("express");
const db = require("./db");

const router = express.Router();

router.get("/api/users/:id", async (req, res) => {
  const user = await db.query(
    "SELECT * FROM users WHERE id = " + req.params.id
  );

  if (!user) {
    res.status(200).json({ error: "User not found" });
  }

  res.json(user.rows[0]);
});

router.put("/api/users/:id", async (req, res) => {
  const { name, email, role } = req.body;
  await db.query(
    "UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4",
    [name, email, role, req.params.id]
  );
  res.json({ ok: true });
});

module.exports = router;`,
    issues: [
      {
        title: "SQL injection through the id parameter",
        sev: "critical",
        cat: ["security"],
        at: ['"SELECT * FROM users WHERE id = " + req.params.id'],
        kw: ["inject", "parameter", "$1", "placeholder", "sanitiz", "prepared", "concat"],
        why: "/api/users/1 OR 1=1 returns every row. The PUT handler already shows the right pattern.",
        fix: 'db.query("SELECT id, name, email FROM users WHERE id = $1", [req.params.id])',
      },
      {
        title: "SELECT * sends the password hash to the client",
        sev: "major",
        cat: ["security"],
        at: ['"SELECT * FROM users WHERE id = " + req.params.id'],
        kw: ["password", "hash", "sensitive", "column", "select *", "leak", "expose", "explicit"],
        why: "Every column, including password_hash and any tokens, goes straight into the JSON response.",
        fix: "Select only the public columns, or map the row to a response DTO.",
      },
      {
        title: "Not-found check can never be true",
        sev: "major",
        cat: ["bug"],
        at: ["if (!user) {"],
        kw: ["rows", "length", "always", "truthy", "result object", "undefined"],
        why: "db.query returns a result object even when there are no rows, so this branch never runs and the client gets an empty response.",
        fix: "const user = result.rows[0];\nif (!user) ...",
      },
      {
        title: "Not found is reported as 200",
        sev: "minor",
        cat: ["design"],
        at: ["res.status(200).json"],
        kw: ["404", "status"],
        why: "Clients and monitoring can't tell success from failure without parsing the body.",
        fix: 'return res.status(404).json({ error: "User not found" });',
      },
      {
        title: "Missing return sends a second response",
        sev: "major",
        cat: ["bug"],
        at: ["res.json(user.rows[0]);"],
        kw: ["return", "headers already sent", "twice", "fall through", "falls through", "second response"],
        why: "If the error branch ever runs, execution continues to res.json and Express throws \"Cannot set headers after they are sent\".",
        fix: "return res.status(404)...",
      },
      {
        title: "Anyone can update any user",
        sev: "critical",
        cat: ["security"],
        at: ['router.put("/api/users/:id"'],
        kw: ["auth", "permission", "owner", "idor", "any user", "session", "req.user", "logged in"],
        why: "There's no authentication or ownership check. Changing the id in the URL edits someone else's account.",
        fix: "router.put(\"/api/users/:id\", requireAuth, async (req, res) => {\n  if (req.user.id !== req.params.id) return res.sendStatus(403);",
      },
      {
        title: "Users can promote themselves to admin",
        sev: "critical",
        cat: ["security"],
        at: ["const { name, email, role } = req.body;"],
        kw: ["role", "admin", "privilege", "escalat", "mass assignment", "allowlist", "whitelist"],
        why: "role comes straight from the request body, so a profile form submit with role: \"admin\" grants admin.",
        fix: "Drop role from this endpoint. Role changes belong in an admin-only route.",
      },
      {
        title: "Async errors are unhandled",
        sev: "minor",
        cat: ["bug"],
        at: ['router.get("/api/users/:id", async'],
        kw: ["try", "catch", "error", "next(", "unhandled", "reject", "express 5", "asynchandler"],
        why: "Express 4 doesn't catch rejected promises from handlers. A database error leaves the request hanging and logs an unhandled rejection.",
        fix: "Wrap handlers in try/catch and call next(err), use an asyncHandler wrapper, or upgrade to Express 5.",
      },
    ],
  },

  {
    id: "orders-pagination",
    track: "Backend",
    lang: "ts",
    level: "Hard",
    file: "server/routes/orders.ts",
    title: "Paginated order history endpoint",
    author: "jonah-b",
    description:
      "Order history page needs pagination. This returns orders for the signed-in customer with their line items, a total count, and a hasMore flag for the Load more button.",
    code: `
app.get("/api/orders", requireAuth, async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = page * limit;

  const orders = await db.order.findMany({
    where: { customerId: req.user.id },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  });

  const withItems = [];
  for (const order of orders) {
    const items = await db.orderItem.findMany({ where: { orderId: order.id } });
    withItems.push({ ...order, items });
  }

  const total = await db.order.count();

  res.json({
    orders: withItems,
    total,
    hasMore: offset + limit <= total,
  });
});`,
    issues: [
      {
        title: "First page is always skipped",
        sev: "major",
        cat: ["bug"],
        at: ["const offset = page * limit;"],
        kw: ["page - 1", "page-1", "off by one", "off-by-one", "first page", "skip"],
        why: "Page 1 starts at offset 20, so the newest 20 orders never appear.",
        fix: "const offset = (page - 1) * limit;",
      },
      {
        title: "limit is unbounded",
        sev: "major",
        cat: ["security", "performance"],
        at: ["const limit = Number(req.query.limit) || 20;"],
        kw: ["max", "cap", "clamp", "bound", "upper", "math.min", "dos", "huge", "large"],
        why: "?limit=1000000 pulls every row plus a million follow-up queries. One request can take the database down.",
        fix: "const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);",
      },
      {
        title: "Negative or fractional page values aren't validated",
        sev: "minor",
        cat: ["bug"],
        at: ["const page = Number(req.query.page) || 1;"],
        kw: ["negative", "validat", "zero", "nan", "integer", "math.max", "fraction", "1.5"],
        why: "?page=-2 produces a negative skip and the ORM throws a 500. ?page=1.5 gives a fractional offset.",
        fix: "const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);",
      },
      {
        title: "Sort order isn't deterministic",
        sev: "minor",
        cat: ["bug"],
        at: ['orderBy: { createdAt: "desc" },'],
        kw: ["tie", "unique", "stable", "deterministic", "duplicate", "cursor", "same timestamp", "id"],
        why: "Orders with the same createdAt can swap between queries, so items repeat or vanish across pages. Offset pagination also drifts when new orders arrive.",
        fix: 'orderBy: [{ createdAt: "desc" }, { id: "desc" }]  // or switch to cursor pagination',
      },
      {
        title: "N+1 queries for line items",
        sev: "major",
        cat: ["performance"],
        at: ["for (const order of orders) {", "const items = await db.orderItem.findMany"],
        kw: ["n+1", "n + 1", "include", "join", "batch", "in:", "loop", "each order", "one query"],
        why: "Twenty orders means twenty-one sequential round trips. Fetch items in the same query or in one batched query.",
        fix: "db.order.findMany({ ..., include: { items: true } })",
      },
      {
        title: "Total counts every customer's orders",
        sev: "major",
        cat: ["bug", "security"],
        at: ["const total = await db.order.count();"],
        kw: ["where", "customer", "filter", "all orders", "leak", "everyone", "every customer"],
        why: "The count has no where clause, so total is wrong and reveals the store's overall order volume to every customer.",
        fix: "db.order.count({ where: { customerId: req.user.id } })",
      },
      {
        title: "hasMore is true on the last page",
        sev: "minor",
        cat: ["bug"],
        at: ["hasMore: offset + limit <= total,"],
        kw: ["<=", "off by one", "off-by-one", "exactly", "equal", "last page", "empty page"],
        why: "With 40 orders and limit 20, the second page reports hasMore and Load more fetches an empty page.",
        fix: "hasMore: offset + orders.length < total",
      },
    ],
  },

  {
    id: "reminders-job",
    track: "Backend",
    lang: "js",
    level: "Easy",
    file: "jobs/sendReminders.js",
    title: "Nightly weekly-summary reminder emails",
    author: "lee-t",
    description:
      "Sends the weekly summary email to everyone who opted in, logs how many went out, and marks the job complete so the dashboard shows it ran.",
    code: `
async function sendReminders() {
  const users = await db.users.findAll({ where: { reminderEnabled: true } });
  let sent = 0;

  users.forEach(async (user) => {
    await mailer.send({
      to: user.email,
      subject: "Your weekly summary",
      html: "<p>Hi " + user.name + "</p>" + renderSummary(user),
    });
    sent++;
  });

  console.log("Sent " + sent + " reminders");
  await db.jobs.markComplete("reminders");
}

setInterval(sendReminders, 24 * 60 * 60 * 1000);`,
    issues: [
      {
        title: "forEach doesn't await async callbacks",
        sev: "critical",
        cat: ["bug"],
        at: ["users.forEach(async (user) => {"],
        kw: ["foreach", "await", "promise.all", "for...of", "for of", "not awaited", "fire and forget", "0"],
        why: "forEach ignores the returned promises. The log always says \"Sent 0\" and the job is marked complete before a single email is sent.",
        fix: "for (const user of users) { await mailer.send(...); sent++; }\n// or a bounded-concurrency Promise.allSettled",
      },
      {
        title: "One failed send becomes an unhandled rejection",
        sev: "major",
        cat: ["bug"],
        at: ["await mailer.send({"],
        kw: ["error", "catch", "retry", "unhandled", "fail", "allsettled", "bounce"],
        why: "A single bad address throws inside a callback nobody awaits. Depending on Node settings that crashes the process, and failures are never recorded.",
        fix: "try { await mailer.send(...); sent++; } catch (err) { failures.push({ user: user.id, err }); }",
      },
      {
        title: "Loads every opted-in user into memory at once",
        sev: "major",
        cat: ["performance"],
        at: ["const users = await db.users.findAll"],
        kw: ["batch", "memory", "paginat", "chunk", "concurrency", "all users", "stream", "rate limit"],
        why: "Fine for 500 users, a problem at 500,000. Once the await bug is fixed with Promise.all it also fires every send at the mail provider simultaneously.",
        fix: "Page through users in batches of a few hundred and cap concurrent sends.",
      },
      {
        title: "User name is injected into HTML unescaped",
        sev: "major",
        cat: ["security"],
        at: ['html: "<p>Hi " + user.name'],
        kw: ["escape", "inject", "xss", "sanitiz", "html", "template"],
        why: "A user who sets their name to a link or markup gets it rendered in the email, which is a phishing vector from your own domain.",
        fix: 'html: "<p>Hi " + escapeHtml(user.name) + "</p>" + ...',
      },
      {
        title: "Re-running the job sends duplicates",
        sev: "minor",
        cat: ["design"],
        at: ['await db.jobs.markComplete("reminders");'],
        kw: ["idempot", "duplicate", "twice", "record", "already sent", "resume", "partial"],
        why: "Nothing records who already got this week's email. A crash halfway through means a retry emails the first half again.",
        fix: "Record a (userId, week) row per send and skip users who already have one.",
      },
      {
        title: "setInterval is a fragile scheduler",
        sev: "minor",
        cat: ["design"],
        at: ["setInterval(sendReminders"],
        kw: ["cron", "schedul", "instance", "restart", "deploy", "overlap", "queue", "drift", "every server"],
        why: "It runs once per server instance, resets on every deploy, drifts over time, and can overlap a slow previous run.",
        fix: "Use a real scheduler (cron, a job queue, or the platform's scheduled tasks) with a lock.",
      },
    ],
  },

  {
    id: "orders-migration",
    track: "Backend",
    lang: "sql",
    level: "Hard",
    file: "db/migrations/2026_10_12_add_order_status.sql",
    title: "Replace shipped_at with an order status column",
    author: "ana-m",
    description:
      "Product wants more states than shipped and not shipped. This adds a status column, backfills it from shipped_at, indexes it for the admin filter, and removes the old column. The orders table has about 40 million rows.",
    code: `
-- Migration: add order status, retire shipped_at
BEGIN;

ALTER TABLE orders ADD COLUMN status TEXT NOT NULL;

UPDATE orders SET status = 'complete' WHERE shipped_at IS NOT NULL;
UPDATE orders SET status = 'pending' WHERE shipped_at IS NULL;

CREATE INDEX idx_orders_status ON orders (status);

ALTER TABLE orders DROP COLUMN shipped_at;

COMMIT;`,
    issues: [
      {
        title: "NOT NULL with no default fails on existing rows",
        sev: "critical",
        cat: ["bug"],
        at: ["ADD COLUMN status TEXT NOT NULL;"],
        kw: ["default", "existing rows", "fail", "null", "backfill first", "add constraint after"],
        why: "Every existing row would get NULL, so Postgres rejects the statement and the migration never runs.",
        fix: "Add the column as nullable, backfill, then add NOT NULL (or a validated CHECK) afterwards.",
      },
      {
        title: "Status is free text",
        sev: "minor",
        cat: ["design"],
        at: ["ADD COLUMN status TEXT NOT NULL;"],
        kw: ["check", "enum", "constraint", "typo", "allowed values", "lookup table"],
        why: "Nothing stops 'Complete', 'completed' and 'complte' from all ending up in the table.",
        fix: "CHECK (status IN ('pending', 'complete', 'cancelled', 'refunded'))",
      },
      {
        title: "40-million-row update in a single transaction",
        sev: "major",
        cat: ["performance"],
        at: ["UPDATE orders SET status = 'complete'"],
        kw: ["batch", "lock", "chunk", "long transaction", "bloat", "wal", "replica", "lag"],
        why: "This rewrites every row while holding row locks for the whole transaction, bloats the table, and can stall replicas. Checkout writes block behind it.",
        fix: "Backfill in batches of ~10k rows outside the schema-change transaction.",
      },
      {
        title: "Index build blocks writes",
        sev: "major",
        cat: ["performance"],
        at: ["CREATE INDEX idx_orders_status"],
        kw: ["concurrently", "lock", "block", "writes", "downtime"],
        why: "A plain CREATE INDEX takes a lock that blocks inserts and updates on orders until it finishes, which is a long time at this size.",
        fix: "CREATE INDEX CONCURRENTLY ... -- in its own migration, outside a transaction",
      },
      {
        title: "Low-selectivity index",
        sev: "minor",
        cat: ["performance"],
        at: ["CREATE INDEX idx_orders_status"],
        kw: ["cardinality", "partial", "selectiv", "where status", "composite", "few values"],
        why: "With a handful of values and most rows 'complete', the planner will rarely use this. The admin filter mostly looks for pending orders.",
        fix: "CREATE INDEX CONCURRENTLY ... ON orders (created_at) WHERE status = 'pending';",
      },
      {
        title: "Dropping shipped_at breaks running code and loses data",
        sev: "critical",
        cat: ["bug", "design"],
        at: ["DROP COLUMN shipped_at"],
        kw: ["expand", "contract", "old code", "deploy", "data loss", "backward", "rollback", "two-phase", "still reading", "timestamp"],
        why: "App servers on the previous release still read shipped_at and start failing the moment this commits. The ship date itself is also thrown away, and there's no rollback.",
        fix: "Expand and contract: add and backfill now, deploy code that uses status, then drop shipped_at in a later migration (or keep it as data).",
      },
    ],
  },

  {
    id: "like-button",
    track: "Full stack",
    lang: "tsx",
    level: "Medium",
    file: "web/LikeButton.tsx + server/routes/likes.ts",
    title: "Optimistic like button",
    author: "kai-w",
    description:
      "Likes now update instantly instead of waiting for the server. The client flips state optimistically and the server increments the post's like count.",
    code: `
// web/LikeButton.tsx
export function LikeButton({ postId, initialLikes, initiallyLiked }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initiallyLiked);

  async function toggle() {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);

    await fetch(\`/api/posts/\${postId}/like\`, {
      method: liked ? "DELETE" : "POST",
    });
  }

  return (
    <button onClick={toggle} className={liked ? "liked" : ""}>
      ♥ {likes}
    </button>
  );
}

// server/routes/likes.ts
app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
  const post = await db.post.findUnique({ where: { id: req.params.id } });
  await db.post.update({
    where: { id: post.id },
    data: { likeCount: post.likeCount + 1 },
  });
  res.sendStatus(204);
});`,
    issues: [
      {
        title: "No rollback when the request fails",
        sev: "major",
        cat: ["bug"],
        at: ["await fetch("],
        kw: ["rollback", "roll back", "revert", "error", "fail", "res.ok", "catch", "undo"],
        why: "The UI shows the like even when the server rejects it or the network drops, and nothing checks res.ok.",
        fix: "const res = await fetch(...);\nif (!res.ok) { setLiked(prevLiked); setLikes(prevLikes); }",
      },
      {
        title: "Rapid clicks race and read stale state",
        sev: "major",
        cat: ["bug"],
        at: ["setLikes(liked ? likes - 1 : likes + 1);"],
        kw: ["functional", "updater", "prev", "stale", "double", "rapid", "race", "in-flight", "in flight", "disable", "closure"],
        why: "Both reads use the render's liked and likes. Two quick clicks can send POST then DELETE in either order and leave client and server disagreeing.",
        fix: "Use functional updates and either ignore clicks while a request is in flight or send the desired final state (PUT liked=true/false).",
      },
      {
        title: "Toggle state isn't exposed to assistive tech",
        sev: "minor",
        cat: ["a11y"],
        at: ['<button onClick={toggle} className={liked ? "liked" : ""}>'],
        kw: ["aria-pressed", "screen reader", "label", "announce", "state", "type="],
        why: "Liked is shown only by color. A screen reader hears \"heart 12, button\" either way.",
        fix: '<button type="button" aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} ...>',
      },
      {
        title: "Read-modify-write loses concurrent likes",
        sev: "critical",
        cat: ["bug"],
        at: ["data: { likeCount: post.likeCount + 1 },"],
        kw: ["atomic", "increment", "race", "lost update", "concurren", "transaction", "simultaneous"],
        why: "Two users liking at the same moment both read 10 and both write 11.",
        fix: "data: { likeCount: { increment: 1 } }",
      },
      {
        title: "The same user can like a post unlimited times",
        sev: "critical",
        cat: ["bug", "design"],
        at: ['app.post("/api/posts/:id/like"'],
        kw: ["unique", "idempot", "multiple times", "per user", "already liked", "likes table", "user id", "userid", "replay"],
        why: "Nothing records who liked what. Replaying the POST inflates the count, and DELETE has no way to know if this user liked it.",
        fix: "Insert into likes(userId, postId) with a unique constraint and derive or update the count from that.",
      },
      {
        title: "Missing post crashes with a 500",
        sev: "minor",
        cat: ["bug"],
        at: ["const post = await db.post.findUnique"],
        kw: ["null", "404", "not found", "exist", "deleted"],
        why: "findUnique returns null for a deleted or bad id, and post.id throws.",
        fix: "if (!post) return res.sendStatus(404);",
      },
    ],
  },

  {
    id: "jwt-auth",
    track: "Full stack",
    lang: "js",
    level: "Hard",
    file: "server/auth.js + web/login.js",
    title: "Login and session handling with JWTs",
    author: "rio-s",
    description:
      "Replaces server sessions with stateless JWTs. /login checks the password and returns a token, requireAuth reads it on protected routes, and the client stores it for later requests.",
    code: `
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET = "supersecret123";

app.post("/login", async (req, res) => {
  const user = await db.users.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ error: "No account with that email" });

  if (user.passwordHash !== bcrypt.hashSync(req.body.password, 10)) {
    return res.status(401).json({ error: "Wrong password" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
  res.json({ token });
});

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  const payload = jwt.decode(token);
  if (!payload) return res.sendStatus(401);
  req.user = payload;
  next();
}

// web/login.js
localStorage.setItem("token", data.token);`,
    issues: [
      {
        title: "Tokens are decoded, never verified",
        sev: "critical",
        cat: ["security"],
        at: ["jwt.decode(token)"],
        kw: ["verify", "signature", "forge", "decode", "tamper", "unsigned"],
        why: "decode just base64-parses the payload. Anyone can hand-write a token with role: \"admin\" and it's accepted.",
        fix: 'const payload = jwt.verify(token, SECRET, { algorithms: ["HS256"] });',
      },
      {
        title: "Password check can never succeed",
        sev: "critical",
        cat: ["bug", "security"],
        at: ["bcrypt.hashSync(req.body.password, 10)"],
        kw: ["compare", "salt", "never match", "hashsync", "timing", "sync", "block"],
        why: "hashSync generates a fresh random salt, so the result never equals the stored hash. It also blocks the event loop for every login.",
        fix: "if (!(await bcrypt.compare(req.body.password, user.passwordHash)))",
      },
      {
        title: "Hardcoded, guessable signing secret",
        sev: "critical",
        cat: ["security"],
        at: ['const SECRET = "supersecret123";'],
        kw: ["env", "environment", "hardcod", "secret manager", "rotat", "weak", "commit", "repo"],
        why: "It's in the repo for anyone with read access, and short enough to brute-force offline from a single token.",
        fix: "const SECRET = process.env.JWT_SECRET; // long random value from a secret store",
      },
      {
        title: "Tokens never expire",
        sev: "major",
        cat: ["security"],
        at: ["jwt.sign({ id: user.id"],
        kw: ["expir", "expiresin", "exp", "revoke", "lifetime", "forever", "refresh"],
        why: "A leaked token works forever, and changing a user's role or banning them has no effect on tokens already issued.",
        fix: 'jwt.sign({ sub: user.id }, SECRET, { expiresIn: "15m" }) // plus a refresh flow',
      },
      {
        title: "Token stored where any XSS can read it",
        sev: "major",
        cat: ["security"],
        at: ['localStorage.setItem("token"'],
        kw: ["httponly", "cookie", "xss", "localstorage", "script"],
        why: "Any injected script, including from a compromised dependency, can read localStorage and exfiltrate the session.",
        fix: "Set it as an HttpOnly, Secure, SameSite cookie from the server instead.",
      },
      {
        title: "Login reveals which emails have accounts",
        sev: "minor",
        cat: ["security"],
        at: ["No account with that email"],
        kw: ["enumerat", "same error", "generic", "reveal", "exist", "404"],
        why: "Different messages and status codes for unknown email versus wrong password let attackers build a list of valid accounts.",
        fix: 'return res.status(401).json({ error: "Email or password is incorrect" });',
      },
      {
        title: "No rate limiting on login",
        sev: "minor",
        cat: ["security"],
        at: ['app.post("/login"'],
        kw: ["rate limit", "rate-limit", "brute", "lockout", "throttle", "captcha", "attempts"],
        why: "Nothing slows down password guessing against a single account or credential stuffing across many.",
        fix: "Add per-IP and per-account rate limits on /login.",
      },
    ],
  },

  {
    id: "group-sessions",
    track: "General",
    lang: "py",
    level: "Easy",
    file: "analytics/sessions.py",
    title: "Group analytics events into sessions",
    author: "noor-h",
    description:
      "Utility for the analytics pipeline. Takes a list of events, sorts them, and splits them into sessions wherever there's a gap of more than 30 minutes.",
    code: `
def group_sessions(events, gap_minutes=30, sessions=[]):
    """Group events (dicts with a 'ts' datetime) into sessions.

    A new session starts when the gap between consecutive events
    exceeds gap_minutes.
    """
    events.sort(key=lambda e: e["ts"])

    current = [events[0]]
    for i in range(1, len(events) - 1):
        prev, event = events[i - 1], events[i]
        gap = (event["ts"] - prev["ts"]).seconds / 60
        if gap > gap_minutes:
            sessions.append(current)
            current = []
        current.append(event)

    return sessions


def load_events(path):
    try:
        with open(path) as f:
            return [parse(line) for line in f]
    except:
        return []`,
    issues: [
      {
        title: "Mutable default argument is shared between calls",
        sev: "critical",
        cat: ["bug"],
        at: ["def group_sessions("],
        kw: ["mutable", "default", "shared", "none", "between calls", "persist"],
        why: "The default list is created once at definition time. Every call without an explicit list appends to the same one, so results accumulate across calls.",
        fix: "def group_sessions(events, gap_minutes=30):\n    sessions = []",
      },
      {
        title: "Sorting mutates the caller's list",
        sev: "minor",
        cat: ["bug", "design"],
        at: ['events.sort(key=lambda e: e["ts"])'],
        kw: ["mutat", "in place", "in-place", "sorted(", "copy", "side effect", "caller"],
        why: "Callers don't expect a grouping helper to reorder their data.",
        fix: 'events = sorted(events, key=lambda e: e["ts"])',
      },
      {
        title: "Crashes on an empty list",
        sev: "major",
        cat: ["bug"],
        at: ["current = [events[0]]"],
        kw: ["empty", "indexerror", "no events", "guard", "[0]"],
        why: "events[0] raises IndexError when there are no events, which is a normal case for a new user.",
        fix: "if not events:\n    return []",
      },
      {
        title: "Loop skips the last event",
        sev: "major",
        cat: ["bug"],
        at: ["for i in range(1, len(events) - 1):"],
        kw: ["last", "off by one", "off-by-one", "len(events)", "skip", "range"],
        why: "range already excludes its end, so the - 1 drops the final event.",
        fix: "for prev, event in zip(events, events[1:]):",
      },
      {
        title: ".seconds ignores whole days",
        sev: "major",
        cat: ["bug"],
        at: ['.seconds / 60'],
        kw: ["total_seconds", "days", "timedelta", "24 hours", "wrap"],
        why: "timedelta.seconds is only the seconds part. A gap of 1 day and 5 minutes reads as 5 minutes, so those events merge into one session.",
        fix: 'gap = (event["ts"] - prev["ts"]).total_seconds() / 60',
      },
      {
        title: "The final session is never returned",
        sev: "critical",
        cat: ["bug"],
        at: ["return sessions"],
        kw: ["last session", "final", "append", "current", "never added", "dropped", "missing"],
        why: "Sessions are only appended when a gap closes them. Whatever is in current at the end, including the only session for most users, is dropped.",
        fix: "sessions.append(current)\nreturn sessions",
      },
      {
        title: "Bare except hides every error",
        sev: "major",
        cat: ["bug", "design"],
        at: ["except:"],
        kw: ["bare", "exception", "swallow", "specific", "filenotfounderror", "log", "hide", "keyboardinterrupt", "silent"],
        why: "A typo in parse, a permissions error or Ctrl-C all become \"no events\", so pipeline bugs show up as quietly empty dashboards.",
        fix: "except FileNotFoundError:\n    return []",
      },
    ],
  },

  {
    id: "debounce",
    track: "General",
    lang: "js",
    level: "Medium",
    file: "src/utils/timing.js",
    title: "debounce and throttle helpers",
    author: "ellis-p",
    description:
      "Small helpers so we can stop pulling in lodash for two functions. debounce waits until calls stop for `wait` ms; throttle allows at most one call per `limit` ms.",
    code: `
export function debounce(fn, wait) {
  let timer;
  return () => {
    setTimeout(() => {
      fn();
    }, wait);
  };
}

export function throttle(fn, limit) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last > limit) {
      fn.apply(this, args);
    }
  };
}`,
    issues: [
      {
        title: "debounce never cancels the previous timer",
        sev: "critical",
        cat: ["bug"],
        at: ["    setTimeout(() => {"],
        kw: ["cleartimeout", "clear", "timer", "cancel", "every call", "delay", "never assigned"],
        why: "timer is declared but never assigned or cleared, so every call still fires, just wait ms later. That's a delay, not a debounce.",
        fix: "clearTimeout(timer);\ntimer = setTimeout(() => fn.apply(this, args), wait);",
      },
      {
        title: "Arguments are dropped",
        sev: "major",
        cat: ["bug"],
        at: ["  return () => {"],
        kw: ["args", "argument", "parameter", "...args", "event"],
        why: "The returned function takes no parameters and calls fn() with none, so debounce(onInput) never sees the event.",
        fix: "return function (...args) { ... }",
      },
      {
        title: "this is lost",
        sev: "minor",
        cat: ["bug"],
        at: ["      fn();"],
        kw: ["this", "context", "apply", "call(", "method", "bind"],
        why: "Debouncing an object method calls it with this undefined.",
        fix: "fn.apply(this, args)",
      },
      {
        title: "throttle never records the last call",
        sev: "critical",
        cat: ["bug"],
        at: ["fn.apply(this, args);"],
        kw: ["last", "update", "never", "assign", "= now", "always"],
        why: "last stays 0, so the condition is always true and throttle passes every call through.",
        fix: "last = now;\nfn.apply(this, args);",
      },
      {
        title: "No way to cancel a pending call",
        sev: "minor",
        cat: ["design"],
        at: ["export function debounce(fn, wait) {"],
        kw: ["cancel", "flush", "unmount", "pending", "api"],
        why: "A component that unmounts can't stop a pending debounced save from firing afterwards. Most callers of a lodash replacement will expect cancel.",
        fix: "debounced.cancel = () => clearTimeout(timer);",
      },
    ],
  },

  {
    id: "cart-totals",
    track: "General",
    lang: "ts",
    level: "Medium",
    file: "shared/pricing.ts",
    title: "Cart totals with discount codes",
    author: "tomas-g",
    description:
      "Shared pricing helpers used by both the checkout page and the order service. Applies a percentage discount code, then tax, and formats prices for display.",
    code: `
type LineItem = { name: string; price: number; qty: number };

export function cartTotal(items: LineItem[], discountPct: number, taxRate: number) {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.qty;
  }

  const discounted = subtotal - subtotal * (discountPct / 100);
  const taxed = discounted + discounted * taxRate;

  return {
    subtotal: subtotal.toFixed(2),
    total: (taxed - taxed * (discountPct / 100)).toFixed(2),
  };
}

export function formatPrice(amount: number) {
  return "$" + amount.toFixed(2);
}`,
    issues: [
      {
        title: "Discount is applied twice",
        sev: "critical",
        cat: ["bug"],
        at: ["total: (taxed - taxed"],
        kw: ["twice", "double", "again", "already", "applied"],
        why: "discounted already includes the discount, then total takes it off again. A 20% code becomes 36% off.",
        fix: "total: taxed",
      },
      {
        title: "Money is computed in floating-point dollars",
        sev: "major",
        cat: ["bug"],
        at: ["subtotal += item.price * item.qty;"],
        kw: ["float", "cents", "integer", "decimal", "precision", "rounding", "0.1"],
        why: "0.1 + 0.2 !== 0.3. Errors accumulate across lines, and the client and server can round to different totals for the same cart.",
        fix: "Store prices as integer cents and round once at defined points.",
      },
      {
        title: "Discount percentage isn't validated",
        sev: "major",
        cat: ["bug", "security"],
        at: ["const discounted = subtotal - subtotal * (discountPct / 100);"],
        kw: ["validat", "clamp", "negative", "100", "range", "bound"],
        why: "A discount over 100 makes the total negative, and a negative one increases the price. Because this runs on the server too, a bad value can reach payment.",
        fix: "if (discountPct < 0 || discountPct > 100) throw new RangeError(...)",
      },
      {
        title: "Percent and fraction units are mixed",
        sev: "minor",
        cat: ["design"],
        at: ["export function cartTotal("],
        kw: ["unit", "percent", "fraction", "inconsistent", "confus", "0-1", "options object", "named"],
        why: "discountPct is 0 to 100 but taxRate is 0 to 1, as two adjacent number parameters. Someone will eventually pass 8 for 8% tax.",
        fix: "cartTotal(items, { discountPercent, taxPercent })  // one unit, named",
      },
      {
        title: "Totals are returned as strings",
        sev: "minor",
        cat: ["design"],
        at: ["subtotal: subtotal.toFixed(2),"],
        kw: ["string", "number", "type", "format", "display", "presentation", "parse"],
        why: "The order service has to parse these back into numbers, and formatting is mixed into the calculation.",
        fix: "Return numbers (cents) and format only at display time.",
      },
      {
        title: "Formatting is hardcoded to US dollars",
        sev: "minor",
        cat: ["design"],
        at: ['return "$" + amount.toFixed(2);'],
        kw: ["intl", "numberformat", "locale", "currency", "negative", "i18n"],
        why: "It ignores currency and locale and prints refunds as $-5.00.",
        fix: 'new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)',
      },
    ],
  },
];
