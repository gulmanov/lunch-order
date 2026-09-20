/* ==========================================================================
   common.js — shared by index.html, history.html and admin.html
   Everything that more than one page needs lives here, so the rotation
   rule and the date handling exist in exactly one place.
   ========================================================================== */

/* ---------- Settings you may want to edit ---------- */

// The three groups, in display order.
// "key" must match the keys used inside data/current.json and data/history.json.
const GROUPS = [
  { key: "group1", title: "Group 1 — Grade 7" },
  { key: "group2", title: "Group 2 — Grade 8 & 9" },
  { key: "group3", title: "Group 3 — Grade 9, 10 & 11" },
];

// Students per class. Only used to show the group totals (161 / 162 / 150).
const CLASS_SIZES = {
  "7A": 27, "7B": 28, "7C": 27, "7D": 27, "7E": 26, "7F": 26,
  "8A": 18, "8B": 25, "8C": 26, "8D": 23, "9A": 18, "9B": 26, "9C": 26,
  "9D": 26, "10A": 22, "10B": 26, "11A": 21, "11B": 27, "11C": 28,
};

// Days when lunch is served: 0 = Sunday, 1 = Monday ... 6 = Saturday.
// "Tomorrow" skips the other days. For a six-day school week use [1, 2, 3, 4, 5, 6].
const SCHOOL_DAYS = [1, 2, 3, 4, 5];


/* ---------- Rotation ---------- */

// Moves the first class to the end: [A, B, C, D] -> [B, C, D, A]
function rotate(order) {
  if (order.length === 0) return [];
  return [...order.slice(1), order[0]];
}

// Rotates all three groups independently.
function rotateGroups(groups) {
  const next = {};
  for (const group of GROUPS) {
    next[group.key] = rotate(groups[group.key] || []);
  }
  return next;
}


/* ---------- Dates ----------
   Dates are stored as "YYYY-MM-DD" text. They are parsed as UTC so the
   result never shifts by a day because of the visitor's time zone. */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function parseISO(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(iso, count) {
  const date = parseISO(iso);
  date.setUTCDate(date.getUTCDate() + count);
  return toISO(date);
}

// The next date after `iso` that is a school day.
function nextSchoolDay(iso) {
  let next = addDays(iso, 1);
  while (!SCHOOL_DAYS.includes(parseISO(next).getUTCDay())) {
    next = addDays(next, 1);
  }
  return next;
}

// Today's date on the visitor's own device, as "YYYY-MM-DD".
function localTodayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function dayName(iso) {
  return DAY_NAMES[parseISO(iso).getUTCDay()];
}

// "September 21, 2026"
function prettyDate(iso) {
  const date = parseISO(iso);
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

// "Monday, September 21, 2026"
function fullDate(iso) {
  return `${dayName(iso)}, ${prettyDate(iso)}`;
}


/* ---------- Loading data ---------- */

// The ?t= part makes every request unique, so phones always get the newest
// file instead of an old cached copy.
async function loadJSON(path) {
  const response = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status})`);
  }
  return response.json();
}

// True if `day` looks like { date: "YYYY-MM-DD", groups: { group1: [...], ... } }
function isValidDay(day) {
  return Boolean(
    day &&
    /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
    day.groups &&
    GROUPS.every((group) => Array.isArray(day.groups[group.key]))
  );
}


/* ---------- Drawing ---------- */

function byId(id) {
  return document.getElementById(id);
}

// Creates an element, optionally with a class name and text.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// One group: a title, the student total, and the classes in order.
// `level` is the heading tag to use ("h2", "h3", ...), so headings nest properly on each page.
function groupSection(group, order, level) {
  const section = el("section", "group");
  section.dataset.group = group.key;
  section.append(el(level, "group-title", group.title));

  const total = order.reduce((sum, name) => sum + (CLASS_SIZES[name] || 0), 0);
  if (total > 0) section.append(el("p", "meta", `${total} students`));

  const list = el("ol", "order");
  list.setAttribute("role", "list");
  for (const name of order) {
    const item = el("li");
    item.append(el("span", "chip", name));
    list.append(item);
  }
  section.append(list);
  return section;
}

// Fills `container` with all three groups.
function renderGroups(container, groups, level = "h2") {
  container.replaceChildren(
    ...GROUPS.map((group) => groupSection(group, groups[group.key] || [], level))
  );
}
