/* ==========================================================================
   app.js — the student page (index.html)
   It only READS data/current.json. It never changes any file.
   ========================================================================== */

const todayDate = byId("today-date");
const todayGroups = byId("today-groups");
const errorBox = byId("error");
const retryButton = byId("retry-btn");
const tomorrowButton = byId("tomorrow-btn");
const tomorrowSection = byId("tomorrow");
const tomorrowDate = byId("tomorrow-date");
const tomorrowGroups = byId("tomorrow-groups");

let currentDay = null;

async function showToday() {
  try {
    currentDay = await loadJSON("data/current.json");
    if (!isValidDay(currentDay)) throw new Error("current.json has the wrong format");

    todayDate.textContent = fullDate(currentDay.date);
    renderGroups(todayGroups, currentDay.groups, "h2");
    tomorrowButton.hidden = false;
  } catch (error) {
    console.error(error);
    todayDate.hidden = true;
    errorBox.hidden = false;
  }
}

// Show / hide tomorrow's order. The preview is calculated here in the browser
// from today's order, so nothing is ever written anywhere.
function toggleTomorrow() {
  const opening = tomorrowSection.hidden;

  if (opening) {
    tomorrowDate.textContent = fullDate(nextSchoolDay(currentDay.date));
    renderGroups(tomorrowGroups, rotateGroups(currentDay.groups), "h3");
  }

  tomorrowSection.hidden = !opening;
  tomorrowButton.textContent = opening ? "Hide Tomorrow's Order" : "Show Tomorrow's Order";
  tomorrowButton.setAttribute("aria-expanded", String(opening));

  if (opening) tomorrowSection.scrollIntoView({ block: "start" });
}

tomorrowButton.addEventListener("click", toggleTomorrow);
retryButton.addEventListener("click", () => location.reload());

showToday();
