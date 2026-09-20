/* ==========================================================================
   history.js — the history page (history.html)
   It only READS data/history.json.
   ========================================================================== */

const LATEST_COUNT = 5; // how many recent days to show before a date is chosen

const yesterdayButton = byId("yesterday-btn");
const datePicker = byId("date-picker");
const latestButton = byId("latest-btn");
const results = byId("results");

let records = null; // the list from history.json, once loaded

// One saved day: "September 21, 2026 — Monday" and its three group orders.
function dayCard(record, titleLevel) {
  const groupLevel = "h" + (Number(titleLevel.slice(1)) + 1);
  const card = el("article", "day-card");
  card.append(el(titleLevel, "day-title", `${prettyDate(record.date)} — ${dayName(record.date)}`));

  const groups = el("div");
  renderGroups(groups, record.groups, groupLevel);
  card.append(groups);
  return card;
}

// Default view: the most recent saved days, newest first.
function showLatest() {
  datePicker.value = "";
  latestButton.hidden = true;

  if (records.length === 0) {
    results.replaceChildren(el("p", "notice", "No days have been saved yet."));
    return;
  }

  const latest = [...records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, LATEST_COUNT);

  results.replaceChildren(el("h2", "", "Latest days"), ...latest.map((record) => dayCard(record, "h3")));
}

// One chosen day, or a short message if nothing was saved for it.
function showDate(iso) {
  latestButton.hidden = false;
  const record = records.find((item) => item.date === iso);

  if (record) {
    results.replaceChildren(dayCard(record, "h2"));
    return;
  }

  const card = el("article", "day-card");
  card.append(el("h2", "day-title", fullDate(iso)));
  card.append(el("p", "", "No lunch order was saved for this date."));
  results.replaceChildren(card);
}

function showLoadError() {
  const box = el("div", "error");
  box.append(el("p", "", "The history could not be loaded. Check your internet connection and try again."));
  results.replaceChildren(box);
}

yesterdayButton.addEventListener("click", () => {
  if (!records) return showLoadError();
  const yesterday = addDays(localTodayISO(), -1);
  datePicker.value = yesterday;
  showDate(yesterday);
});

datePicker.addEventListener("change", () => {
  if (!records) return showLoadError();
  if (datePicker.value) showDate(datePicker.value);
  else showLatest();
});

latestButton.addEventListener("click", () => {
  if (records) showLatest();
});

async function start() {
  try {
    records = await loadJSON("data/history.json");
    if (!Array.isArray(records)) throw new Error("history.json must be a list");
    showLatest();
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

start();
