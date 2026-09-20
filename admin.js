/* ==========================================================================
   admin.js — the admin page (admin.html)
   Works entirely in the browser. It never writes to GitHub or to your disk on
   its own: "Complete Today & Create Tomorrow" only changes the copy in memory,
   and you then download the two updated files yourself.
   ========================================================================== */

const loadPanel = byId("load-panel");
const loadMessage = byId("load-message");
const fileInput = byId("file-input");
const adminApp = byId("admin-app");

const realToday = byId("real-today");
const dateWarning = byId("date-warning");
const currentDate = byId("current-date");
const currentGroups = byId("current-groups");
const tomorrowGroups = byId("tomorrow-groups");
const newDate = byId("new-date");
const newDayName = byId("new-day-name");

const completeButton = byId("complete-btn");
const message = byId("message");
const downloadPanel = byId("download-panel");

let currentDay = null; // the contents of current.json
let records = null;    // the contents of history.json
let completed = false; // becomes true after "Complete Today & Create Tomorrow"


/* ---------- Loading ---------- */

function checkData(day, list) {
  if (!isValidDay(day)) throw new Error("current.json has the wrong format.");
  if (!Array.isArray(list) || !list.every(isValidDay)) throw new Error("history.json has the wrong format.");
}

function start(day, list) {
  currentDay = day;
  records = list;
  completed = false;
  loadPanel.hidden = true;
  adminApp.hidden = false;
  render();
}

// First try: read the files next to this page (works on GitHub Pages or a local server).
async function load() {
  try {
    const [day, list] = await Promise.all([
      loadJSON("data/current.json"),
      loadJSON("data/history.json"),
    ]);
    checkData(day, list);
    start(day, list);
  } catch (error) {
    console.error(error);
    loadMessage.textContent =
      "The data files could not be loaded automatically. This is normal when admin.html is opened straight from your computer.";
    loadPanel.hidden = false;
  }
}

// Fallback: pick the two files by hand.
async function loadChosenFiles() {
  const files = [...fileInput.files];
  const currentFile = files.find((file) => file.name.toLowerCase().includes("current"));
  const historyFile = files.find((file) => file.name.toLowerCase().includes("history"));

  if (!currentFile || !historyFile) {
    loadMessage.textContent = "Please select both files: current.json and history.json.";
    return;
  }

  try {
    const day = JSON.parse(await currentFile.text());
    const list = JSON.parse(await historyFile.text());
    checkData(day, list);
    start(day, list);
  } catch (error) {
    console.error(error);
    loadMessage.textContent = `Those files could not be used. ${error.message}`;
  }
}


/* ---------- Showing the page ---------- */

function render() {
  const today = localTodayISO();
  realToday.textContent = fullDate(today);

  currentDate.textContent = fullDate(currentDay.date);
  renderGroups(currentGroups, currentDay.groups, "h3");
  renderGroups(tomorrowGroups, rotateGroups(currentDay.groups), "h3");

  newDate.value = nextSchoolDay(currentDay.date);
  newDate.disabled = completed;
  updateNewDayName();

  if (!completed && currentDay.date !== today) {
    dateWarning.textContent =
      `current.json is dated ${fullDate(currentDay.date)}, which is not today's date on this computer. ` +
      "That is fine if it is what you expect. The history record will use the date from current.json.";
    dateWarning.hidden = false;
  } else {
    dateWarning.hidden = true;
  }

  completeButton.disabled = completed;
  completeButton.textContent = completed ? "Completed ✓" : "Complete Today & Create Tomorrow";
}

function updateNewDayName() {
  newDayName.textContent = newDate.value ? dayName(newDate.value) : "";
}

function showMessage(text, isError) {
  message.textContent = text;
  message.className = isError ? "error" : "notice";
  message.hidden = false;
}


/* ---------- Completing a day ---------- */

function copyGroups(groups) {
  const copy = {};
  for (const group of GROUPS) copy[group.key] = [...groups[group.key]];
  return copy;
}

function completeDay() {
  if (completed) return;

  const newDay = newDate.value;
  if (!newDay) {
    showMessage("Choose the date of the new order first.", true);
    return;
  }
  if (newDay <= currentDay.date) {
    showMessage(`The new date must be after ${fullDate(currentDay.date)}.`, true);
    return;
  }

  const question = `Save ${fullDate(currentDay.date)} to history and create the order for ${fullDate(newDay)}?`;
  if (!confirm(question)) return;

  // Step 1: add the current order to the history, with its actual date and day.
  const record = {
    date: currentDay.date,
    day: dayName(currentDay.date),
    groups: copyGroups(currentDay.groups),
  };
  const replaced = records.some((item) => item.date === record.date);
  records = records.filter((item) => item.date !== record.date);
  records.push(record);
  records.sort((a, b) => a.date.localeCompare(b.date));

  // Steps 2 and 3: calculate the next order and make it the current order.
  currentDay = {
    date: newDay,
    day: dayName(newDay),
    groups: rotateGroups(currentDay.groups),
  };

  completed = true;
  render();
  downloadPanel.hidden = false;
  showMessage(
    `Done. ${fullDate(record.date)} was saved to the history` +
    (replaced ? " (replacing an earlier record for that date)" : "") +
    `, and the current order is now the one for ${fullDate(newDay)}.`,
    false
  );
}


/* ---------- Downloading the JSON files ---------- */

// Writes the files in the same tidy layout as the examples: one line per group.
function inlineList(list) {
  return "[" + list.map((name) => JSON.stringify(name)).join(", ") + "]";
}

function dayToJSON(day, pad) {
  const groupLines = GROUPS
    .map((group) => `${pad}    ${JSON.stringify(group.key)}: ${inlineList(day.groups[group.key])}`)
    .join(",\n");

  return [
    `${pad}{`,
    `${pad}  "date": ${JSON.stringify(day.date)},`,
    `${pad}  "day": ${JSON.stringify(dayName(day.date))},`,
    `${pad}  "groups": {`,
    groupLines,
    `${pad}  }`,
    `${pad}}`,
  ].join("\n");
}

function currentToJSON(day) {
  return dayToJSON(day, "") + "\n";
}

function historyToJSON(list) {
  if (list.length === 0) return "[]\n";
  return "[\n" + list.map((day) => dayToJSON(day, "  ")).join(",\n") + "\n]\n";
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCurrent() {
  downloadFile("current.json", currentToJSON(currentDay));
}

function downloadHistory() {
  downloadFile("history.json", historyToJSON(records));
}

function downloadBoth() {
  downloadCurrent();
  // a short pause, because some browsers block two downloads at the same moment
  setTimeout(downloadHistory, 400);
}


/* ---------- Wiring ---------- */

fileInput.addEventListener("change", loadChosenFiles);
newDate.addEventListener("input", updateNewDayName);
completeButton.addEventListener("click", completeDay);
byId("download-both-btn").addEventListener("click", downloadBoth);
byId("download-current-btn").addEventListener("click", downloadCurrent);
byId("download-history-btn").addEventListener("click", downloadHistory);

load();
