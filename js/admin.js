/* ===== ניהול לוז שבת - עמוד admin.html =====
   הערה חשובה: הסיסמה כאן היא הגנה בסיסית בלבד (קוד צד-לקוח, גלוי בקובץ הזה) - לא אבטחה אמיתית.
   ההגנה האמיתית על יכולת השמירה היא ה-GitHub Personal Access Token שהמנהל מזין (נשמר בדפדפן
   בלבד, ל-sessionStorage, ונשלח ישירות ל-GitHub API - לא לשום שרת אחר). */

const ADMIN_PASSWORD = "אוהב ישראל";
const GH_OWNER = "DavidHaiIntel";
const GH_REPO = "hasimcha-beofek";
const GH_FILE_PATH = "shabbat.html";
const GH_BRANCH = "main";

function b64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(escape(atob(str)));
}

function addRow(containerId, label = "", time = "", hidden = false, key = "") {
  const container = document.getElementById(containerId);
  const row = document.createElement("div");
  row.className = "admin-row";
  row.dataset.hidden = hidden ? "true" : "false";
  row.dataset.key = key;
  row.innerHTML = `
    <button type="button" class="move-row-btn move-up-btn" title="הזז למעלה">↑</button>
    <button type="button" class="move-row-btn move-down-btn" title="הזז למטה">↓</button>
    <input type="text" class="row-label" placeholder="תיאור" value="${label.replace(/"/g, "&quot;")}">
    <input type="text" class="row-time" placeholder="שעה" value="${time.replace(/"/g, "&quot;")}">
    <button type="button" class="hide-row-btn">${hidden ? "הצג" : "הסתר"}</button>
    <button type="button" class="remove-row-btn">הסר</button>
  `;
  if (hidden) row.classList.add("row-hidden");
  row.querySelector(".remove-row-btn").addEventListener("click", () => row.remove());
  row.querySelector(".hide-row-btn").addEventListener("click", (e) => {
    const nowHidden = row.dataset.hidden !== "true";
    row.dataset.hidden = nowHidden ? "true" : "false";
    row.classList.toggle("row-hidden", nowHidden);
    e.target.textContent = nowHidden ? "הצג" : "הסתר";
  });
  row.querySelector(".move-up-btn").addEventListener("click", () => {
    const prev = row.previousElementSibling;
    if (prev) container.insertBefore(row, prev);
  });
  row.querySelector(".move-down-btn").addEventListener("click", () => {
    const next = row.nextElementSibling;
    if (next) container.insertBefore(next, row);
  });
  container.appendChild(row);
}

function getRows(containerId) {
  const container = document.getElementById(containerId);
  return Array.from(container.querySelectorAll(".admin-row")).map((row) => ({
    label: row.querySelector(".row-label").value.trim(),
    time: row.querySelector(".row-time").value.trim(),
    hidden: row.dataset.hidden === "true",
    key: row.dataset.key || "",
  })).filter((r) => r.label || r.time);
}

function buildListHtml(id, rows) {
  const items = rows
    .map((r) => {
      const hiddenAttr = r.hidden ? ' style="display:none" data-hidden="true"' : "";
      return `              <li${hiddenAttr}><span>${r.label}</span><span class="time">${r.time}</span></li>`;
    })
    .join("\n");
  return `<ul class="shabbat-list" id="${id}">\n${items}\n            </ul>`;
}

function parseListFromHtml(html, id) {
  const re = new RegExp(`<ul class="shabbat-list" id="${id}">([\\s\\S]*?)</ul>`);
  const match = html.match(re);
  if (!match) return [];
  const liRe = /<li([^>]*)><span>([\s\S]*?)<\/span><span class="time"[^>]*>([\s\S]*?)<\/span><\/li>/g;
  const rows = [];
  let m;
  while ((m = liRe.exec(match[1])) !== null) {
    rows.push({ label: m[2].trim(), time: m[3].trim(), hidden: /data-hidden="true"/.test(m[1]) });
  }
  return rows;
}

// ===== זמני תפילות שבת (js/shabbat-times-config.js) - אוטומטי + אפשרות דריסה/הוספה/מחיקה =====
async function fetchLiveShabbatTimesConfigJs() {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/js/shabbat-times-config.js?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error("לא הצלחתי לטעון את הגדרות זמני שבת מ-GitHub");
  return resp.text();
}

function parseShabbatTimesConfigJs(jsText) {
  const match = jsText.match(/SHABBAT_TIMES_CONFIG\s*=\s*(\{[\s\S]*?\n\});/);
  if (!match) return { parashaTitle: { override: "" }, candleLighting: { override: "" }, shabbatEnds: { override: "" }, rows: [] };
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (e) {
    return { parashaTitle: { override: "" }, candleLighting: { override: "" }, shabbatEnds: { override: "" }, rows: [] };
  }
}

function buildShabbatTimesConfigJs(parashaOverride, candleOverride, shabbatEndsOverride, rows) {
  const rowsJs = rows
    .map((r) => `    { key: "${r.key}", label: "${r.label.replace(/"/g, '\\"')}", override: "${r.time}", hidden: ${r.hidden} },`)
    .join("\n");
  return `/* ===== זמני תפילות שבת - נערך מעמוד הניהול (admin.html) =====
   כל זמן מחושב אוטומטית כל שבוע (ראו calcShabbatTimes ב-js/zmanim.js) אלא אם יש override
   (שדה שעה לא ריק) - אז הוא נדרס לשעה הקבועה שהוזנה. שורות עם key מקושרות לחישוב האוטומטי;
   שורות בלי key (שנוספו ידנית) מציגות רק את ה-override. כנ"ל לגבי שם הפרשה - ריק = נמשך
   אוטומטית מ-Hebcal, אחרת מוצג הטקסט הקבוע שהוזן. */
const SHABBAT_TIMES_CONFIG = {
  parashaTitle: { override: "${parashaOverride.replace(/"/g, '\\"')}" },
  candleLighting: { override: "${candleOverride}" },
  shabbatEnds: { override: "${shabbatEndsOverride}" },
  rows: [
${rowsJs}
  ],
};
`;
}

// ===== עמוד הקהילה (about.html) - קבוצות הנהלה (רב/ועדים/גבאים) =====
function parseCommitteeFromHtml(html) {
  const blockMatch = html.match(/<!-- COMMITTEE_START -->([\s\S]*?)<!-- COMMITTEE_END -->/);
  if (!blockMatch) return [];
  const cardRe = /<div class="committee-card"[^>]*>\s*<h4>([\s\S]*?)<\/h4>\s*<ul>([\s\S]*?)<\/ul>\s*<\/div>/g;
  const groups = [];
  let cardMatch;
  while ((cardMatch = cardRe.exec(blockMatch[1])) !== null) {
    const title = cardMatch[1].trim();
    const names = [];
    const liRe = /<li>([\s\S]*?)<\/li>/g;
    let liMatch;
    while ((liMatch = liRe.exec(cardMatch[2])) !== null) {
      names.push(liMatch[1].trim());
    }
    groups.push({ title, names });
  }
  return groups;
}

function buildCommitteeHtml(groups) {
  const cards = groups
    .map((g) => {
      const items = g.names.map((n) => `          <li>${n}</li>`).join("\n");
      return `        <div class="committee-card">\n          <h4>${g.title}</h4>\n          <ul>\n${items}\n          </ul>\n        </div>`;
    })
    .join("\n");
  return `<!-- COMMITTEE_START -->\n      <div class="committee-grid">\n${cards}\n      </div>\n      <!-- COMMITTEE_END -->`;
}

function addNameRow(container, name = "") {
  const row = document.createElement("div");
  row.className = "admin-row";
  row.style.gridTemplateColumns = "1fr auto";
  row.innerHTML = `
    <input type="text" class="row-name" placeholder="שם" value="${name.replace(/"/g, "&quot;")}">
    <button type="button" class="remove-row-btn">הסר</button>
  `;
  row.querySelector(".remove-row-btn").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function addCommitteeGroup(group = { title: "", names: [] }) {
  const container = document.getElementById("committee-groups");
  const groupEl = document.createElement("details");
  groupEl.className = "committee-group-editor";
  groupEl.innerHTML = `
    <summary>${(group.title || "קבוצה חדשה").replace(/</g, "&lt;")}</summary>
    <div class="admin-field">
      <label>שם הקבוצה</label>
      <input type="text" class="group-title" value="${group.title.replace(/"/g, "&quot;")}">
    </div>
    <div class="group-names"></div>
    <button type="button" class="admin-add-btn add-name-btn">+ הוסף שם</button>
    <button type="button" class="remove-page-btn remove-group-btn">מחק קבוצה</button>
  `;
  const summaryEl = groupEl.querySelector("summary");
  const titleInput = groupEl.querySelector(".group-title");
  titleInput.addEventListener("input", () => {
    summaryEl.textContent = titleInput.value.trim() || "קבוצה חדשה";
  });
  const namesContainer = groupEl.querySelector(".group-names");
  group.names.forEach((n) => addNameRow(namesContainer, n));
  groupEl.querySelector(".add-name-btn").addEventListener("click", () => addNameRow(namesContainer));
  groupEl.querySelector(".remove-group-btn").addEventListener("click", () => groupEl.remove());
  container.appendChild(groupEl);
}

function renderCommitteeForm(groups) {
  const container = document.getElementById("committee-groups");
  container.innerHTML = "";
  groups.forEach((g) => addCommitteeGroup(g));
}

function getCommitteeFromForm() {
  return Array.from(document.querySelectorAll("#committee-groups .committee-group-editor"))
    .map((groupEl) => ({
      title: groupEl.querySelector(".group-title").value.trim(),
      names: Array.from(groupEl.querySelectorAll(".group-names .row-name"))
        .map((input) => input.value.trim())
        .filter(Boolean),
    }))
    .filter((g) => g.title || g.names.length);
}

async function fetchLiveShabbatHtml() {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/shabbat.html?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error("לא הצלחתי לטעון את הקובץ החי מ-GitHub");
  return resp.text();
}

async function fetchLiveSiteConfigJs() {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/js/site-config.js?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error("לא הצלחתי לטעון את הגדרות האתר מ-GitHub");
  return resp.text();
}

async function fetchLiveAboutHtml() {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/about.html?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error("לא הצלחתי לטעון את דף הקהילה מ-GitHub");
  return resp.text();
}

// ===== שיעורי תורה (js/shiurim-data.js) - רשימה משותפת המוצגת גם בדף הבית וגם בדף השבת =====
async function fetchLiveShiurimDataJs() {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/js/shiurim-data.js?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error("לא הצלחתי לטעון את רשימת השיעורים מ-GitHub");
  return resp.text();
}

function parseShiurimFromJs(jsText) {
  const match = jsText.match(/SHIURIM_LIST\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (e) {
    return [];
  }
}

function buildShiurimDataJs(rows) {
  const list = rows
    .map((r) => `  { label: "${r.label.replace(/"/g, '\\"')}", time: "${r.time}", hidden: ${r.hidden} },`)
    .join("\n");
  return `/* ===== שיעורי תורה במהלך השבוע - נערכים מעמוד הניהול (admin.html) =====
   הרשימה הזו מוצגת גם בדף השבת וגם בדף הבית (בכל אלמנט עם class="js-shiurim-list") -
   עריכה כאן דרך הניהול משתקפת בשני המקומות יחד. */
const SHIURIM_LIST = [
${list}
];
`;
}

// ===== "דף לוח זמנים" גנרי (כותרת + רשימת שורות) - לכל דף עם schedule:true ב-SITE_CONFIG =====
// (כמו צום גדליה, וכל דף עתידי מסוג זה שנוצר דרך "הוסף דף חדש" למטה)
async function fetchLiveScheduleDataJs(dataFile) {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${dataFile}?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error(`לא הצלחתי לטעון את ${dataFile} מ-GitHub`);
  return resp.text();
}

function parseScheduleDataJs(jsText) {
  const match = jsText.match(/SCHEDULE_DATA\s*=\s*(\{[\s\S]*?\n\});/);
  if (!match) return { title: "", rows: [] };
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (e) {
    return { title: "", rows: [] };
  }
}

function buildScheduleDataJs(title, rows) {
  const list = sortRowsByTime(rows)
    .map((r) => `    { label: "${r.label.replace(/"/g, '\\"')}", time: "${r.time}", hidden: ${r.hidden} },`)
    .join("\n");
  return `/* ===== לוח זמנים - נערך מעמוד הניהול (admin.html) =====
   שורה בלי time (מחרוזת ריקה) מוצגת כשורת הערה בלי שעה. */
const SCHEDULE_DATA = {
  title: "${title.replace(/"/g, '\\"')}",
  rows: [
${list}
  ],
};
`;
}

// יוצר בטופס הניהול, בזמן אמת, את הפיסקה (fieldset) לעריכת דף לוח-זמנים אחד
function addSchedulePageFieldset(page, data = { title: "", rows: [] }) {
  const container = document.getElementById("schedule-pages-container");
  const rowsId = `sched-${page.key}-rows`;
  const fieldset = document.createElement("details");
  fieldset.className = "admin-section schedule-page-fieldset";
  fieldset.dataset.key = page.key;
  fieldset.dataset.dataFile = page.dataFile;
  fieldset.dataset.rowsId = rowsId;
  fieldset.innerHTML = `
    <summary>לוח: ${page.label} (${page.url})</summary>
    <div class="admin-field">
      <label>כותרת הלוח</label>
      <input type="text" class="sched-title-input" value="${(data.title || page.label).replace(/"/g, "&quot;")}">
    </div>
    <div id="${rowsId}"></div>
    <button type="button" class="admin-add-btn sched-add-row-btn">+ הוסף שורה</button>
  `;
  fieldset.querySelector(".sched-add-row-btn").addEventListener("click", () => addRow(rowsId));
  container.appendChild(fieldset);
  (data.rows || []).forEach((r) => addRow(rowsId, r.label, r.time, r.hidden));
}

// טוען לטופס את כל דפי "לוח הזמנים" הרשומים כרגע ב-SITE_CONFIG (schedule:true)
async function renderSchedulePagesForm(extraPages) {
  const container = document.getElementById("schedule-pages-container");
  container.innerHTML = "";
  for (const page of extraPages.filter((p) => p.schedule)) {
    let data = { title: page.label, rows: [] };
    try {
      data = parseScheduleDataJs(await fetchLiveScheduleDataJs(page.dataFile));
    } catch (e) {
      // דף שנוצר הרגע וטרם נשמר - יתחיל ריק
    }
    addSchedulePageFieldset(page, data);
  }
}

function getSchedulePagesFromForm() {
  return Array.from(document.querySelectorAll(".schedule-page-fieldset")).map((fieldset) => ({
    key: fieldset.dataset.key,
    dataFile: fieldset.dataset.dataFile,
    title: fieldset.querySelector(".sched-title-input").value.trim(),
    rows: getRows(fieldset.dataset.rowsId),
  }));
}

// ===== לוח ראש השנה (js/rosh-hashana-data.js) - כותרת + 3 עמודות (ימים), כל אחת עם שורות =====
async function fetchLiveRoshHashanaDataJs() {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/js/rosh-hashana-data.js?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error("לא הצלחתי לטעון את לוח ראש השנה מ-GitHub");
  return resp.text();
}

function parseRoshHashanaFromJs(jsText) {
  const match = jsText.match(/ROSH_HASHANA_DATA\s*=\s*(\{[\s\S]*?\n\});/);
  if (!match) return { title: "", days: [{ label: "", rows: [] }, { label: "", rows: [] }, { label: "", rows: [] }] };
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (e) {
    return { title: "", days: [{ label: "", rows: [] }, { label: "", rows: [] }, { label: "", rows: [] }] };
  }
}

function buildRoshHashanaDataJs(title, days) {
  const daysJs = days.map((day) => {
    const rowsJs = sortRowsByTime(day.rows)
      .map((r) => `        { label: "${r.label.replace(/"/g, '\\"')}", time: "${r.time}", hidden: ${r.hidden} },`)
      .join("\n");
    return `    {\n      label: "${day.label.replace(/"/g, '\\"')}",\n      rows: [\n${rowsJs}\n      ],\n    },`;
  }).join("\n");
  return `/* ===== לוח זמני ראש השנה - נערך מעמוד הניהול (admin.html) =====
   מוצג הן בדף ראש השנה (rosh-hashana.html) והן בדף שבת (shabbat.html, כשהשבת הקרובה היא א' תשרי).
   כל יום הוא עמודה בפוסטר. שורה בלי time (מחרוזת ריקה) מוצגת כשורת הערה בלי שעה (כמו "מוסף"). */
const ROSH_HASHANA_DATA = {
  title: "${title.replace(/"/g, '\\"')}",
  days: [
${daysJs}
  ],
};
`;
}

// ===== לוח יום הכיפורים (js/kippur-data.js) - כותרת + כניסת/יציאת הצום + יום ערב + 2 עמודות =====
async function fetchLiveKippurDataJs() {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/js/kippur-data.js?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error("לא הצלחתי לטעון את לוח יום הכיפורים מ-GitHub");
  return resp.text();
}

function defaultKippurData() {
  return {
    title: "", fastStart: "", fastEnd: "",
    erevDay: { label: "", rows: [] },
    columns: [{ label: "", rows: [] }, { label: "", rows: [] }],
    footerLine1: "", footerLine2: "", closing: "",
  };
}

function parseKippurDataJs(jsText) {
  const match = jsText.match(/KIPPUR_DATA\s*=\s*(\{[\s\S]*?\n\});/);
  if (!match) return defaultKippurData();
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (e) {
    return defaultKippurData();
  }
}

// לא ממיינים שורות לפי שעה - הטורים ביום הכיפורים חוצים יממה (ליל כל נדרי ואז יום המחרת),
// והסדר הנכון נשמר בדיוק כפי שהוזן/סודר בניהול (עם כפתורי ↑/↓).
function buildKippurDataJs(data) {
  const rowsToJs = (rows) => rows
    .map((r) => `        { label: "${r.label.replace(/"/g, '\\"')}", time: "${r.time}", hidden: ${r.hidden} },`)
    .join("\n");
  const columnsJs = data.columns.map((col) => {
    return `    {\n      label: "${col.label.replace(/"/g, '\\"')}",\n      rows: [\n${rowsToJs(col.rows)}\n      ],\n    },`;
  }).join("\n");
  return `/* ===== לוח זמני יום הכיפורים - נערך מעמוד הניהול (admin.html) =====
   מוצג בדף kippur.html. אין מיון אוטומטי לפי שעה בטורי יוה"כ - כי הם חוצים יממה (ליל כל נדרי
   ואז יום המחרת) - הסדר הוא בדיוק סדר השורות כפי שנערך בניהול (עם כפתורי ↑/↓). */
const KIPPUR_DATA = {
  title: "${data.title.replace(/"/g, '\\"')}",
  fastStart: "${data.fastStart}",
  fastEnd: "${data.fastEnd}",
  erevDay: {
    label: "${data.erevDay.label.replace(/"/g, '\\"')}",
    rows: [
${rowsToJs(data.erevDay.rows)}
    ],
  },
  columns: [
${columnsJs}
  ],
  footerLine1: "${data.footerLine1.replace(/"/g, '\\"')}",
  footerLine2: "${data.footerLine2.replace(/"/g, '\\"')}",
  closing: "${data.closing.replace(/"/g, '\\"')}",
};
`;
}

// ===== שינויים בשחרית של שמחת תורה (js/simchat-torah-config.js) - שאר זמני היום נלקחים =====
// אוטומטית מ-js/shabbat-times-config.js (בדיוק כמו שבת רגילה) - כאן עורכים רק את בלוק השחרית.
async function fetchLiveSimchatTorahDataJs() {
  const resp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/js/simchat-torah-config.js?t=${Date.now()}`
  );
  if (!resp.ok) throw new Error("לא הצלחתי לטעון את לוח שמחת תורה מ-GitHub");
  return resp.text();
}

function parseSimchatTorahDataJs(jsText) {
  const match = jsText.match(/SIMCHAT_TORAH_DATA\s*=\s*(\{[\s\S]*?\n\});/);
  if (!match) return { title: "", shacharitRows: [] };
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (e) {
    return { title: "", shacharitRows: [] };
  }
}

// לא ממיינים לפי שעה - השורות נשמרות בדיוק בסדר שהוזן/סודר בניהול (עם כפתורי ↑/↓).
function buildSimchatTorahDataJs(title, rows) {
  const rowsJs = rows
    .map((r) => `    { label: "${r.label.replace(/"/g, '\\"')}", time: "${r.time}", hidden: ${r.hidden} },`)
    .join("\n");
  return `/* ===== שינויים בשחרית של שמחת תורה - נערך מעמוד הניהול (admin.html) =====
   מוצג בדף הייעודי (simchat-torah.html) ובלוח החלופי בתוך shabbat.html (כשהשבת הקרובה
   היא שמחת תורה - כ"ב תשרי). שאר זמני השבת (כניסה/יציאה/מנחה ערב/מנחה שבת/ערבית) זהים
   לשבת רגילה ונלקחים אוטומטית מ-js/shabbat-times-config.js - כאן עורכים רק את בלוק השחרית. */
const SIMCHAT_TORAH_DATA = {
  title: "${title.replace(/"/g, '\\"')}",
  shacharitRows: [
${rowsJs}
  ],
};
`;
}

function parseExtraPagesFromJs(jsText) {
  const match = jsText.match(/extraPages:\s*(\[[\s\S]*?\])\s*,?\s*\};/);
  if (!match) return [];
  try {
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${match[1]});`)();
  } catch (e) {
    return [];
  }
}

function renderExtraPagesForm(pages) {
  const container = document.getElementById("extra-pages-rows");
  container.innerHTML = "";
  pages.forEach((p) => {
    const row = document.createElement("div");
    row.className = "extra-page-row";
    row.dataset.key = p.key;
    row.dataset.url = p.url;
    row.dataset.schedule = p.schedule ? "true" : "false";
    row.dataset.dataFile = p.dataFile || "";
    row.innerHTML = `
      <input type="checkbox" class="extra-page-enabled" id="extra-${p.key}" ${p.enabled ? "checked" : ""}>
      <label for="extra-${p.key}">${p.label} (${p.url})</label>
      <button type="button" class="remove-page-btn">מחק דף</button>
    `;
    row.querySelector(".remove-page-btn").addEventListener("click", () => {
      row.remove();
      document.querySelector(`.schedule-page-fieldset[data-key="${p.key}"]`)?.remove();
    });
    container.appendChild(row);
  });
}

function getExtraPagesFromForm() {
  return Array.from(document.querySelectorAll("#extra-pages-rows .extra-page-row")).map((row) => ({
    key: row.dataset.key,
    url: row.dataset.url,
    label: row.querySelector("label").textContent.replace(/\s*\([^)]*\)\s*$/, ""),
    enabled: row.querySelector(".extra-page-enabled").checked,
    schedule: row.dataset.schedule === "true",
    dataFile: row.dataset.dataFile || undefined,
  }));
}

function buildSiteConfigJs(pages) {
  const list = pages
    .map((p) => {
      const extra = p.schedule ? `, schedule: true, dataFile: "${p.dataFile}"` : "";
      return `    { key: "${p.key}", label: "${p.label}", url: "${p.url}", enabled: ${p.enabled}${extra} },`;
    })
    .join("\n");
  return `/* ===== הגדרות אתר - אילו "דפים נוספים" (זמניים/עונתיים) פעילים כרגע =====
   הדפים הקבועים (בית / זמני תפילה / שבת קודש) תמיד מוצגים ולא ניתנים לכיבוי.
   דפים נוספים (כמו לימוד סוכות) אפשר להדליק/לכבות מעמוד הניהול (admin.html) -
   כשדף כבוי, הקישור אליו נעלם מהניווט בכל האתר, והדף עצמו מציג הודעה במקום התוכן. */
const SITE_CONFIG = {
  extraPages: [
${list}
  ],
};
`;
}

function addExtraPageRow(page) {
  const container = document.getElementById("extra-pages-rows");
  const row = document.createElement("div");
  row.className = "extra-page-row";
  row.dataset.key = page.key;
  row.dataset.url = page.url;
  row.dataset.schedule = page.schedule ? "true" : "false";
  row.dataset.dataFile = page.dataFile || "";
  row.innerHTML = `
    <input type="checkbox" class="extra-page-enabled" id="extra-${page.key}" checked>
    <label for="extra-${page.key}">${page.label} (${page.url})</label>
    <button type="button" class="remove-page-btn">מחק דף</button>
  `;
  row.querySelector(".remove-page-btn").addEventListener("click", () => {
    row.remove();
    document.querySelector(`.schedule-page-fieldset[data-key="${page.key}"]`)?.remove();
  });
  container.appendChild(row);
}

// בונה HTML מלא לדף חדש, באותו מבנה (header/nav/footer) כמו שאר דפי האתר
function buildNewPageHtml(title, bodyText) {
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `        <p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | השמחה שבאופק</title>
<link rel="icon" href="images/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<header class="site-header">
  <div class="container">
    <a class="brand" href="index.html">
      <img src="images/logo.png" alt="לוגו קהילת אוהב ישראל">
      <div class="brand-text">
        <h1>בית הכנסת השמחה שבאופק</h1>
        <p>קהילת אוהב ישראל | נתיבות</p>
      </div>
    </a>
    <button class="nav-toggle" aria-label="פתח תפריט">&#9776;</button>
    <nav class="main-nav">
      <a href="index.html">בית</a>
      <a href="zmanim.html">זמני תפילה</a>
      <a href="shabbat.html">שבת קודש</a>
      <span id="extra-nav-links"></span>
      <a href="about.html">הקהילה</a>
      <a href="donations.html">תרומות</a>
    </nav>
  </div>
</header>

<main>
  <section class="section">
    <div class="container" style="max-width:800px;">
      <h2 style="text-align:center;">${title}</h2>
${paragraphs}
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container">
    <p><strong>בית כנסת "השמחה שבאופק"</strong> ע"ש שמחה חלילי ואופק חלילי ז"ל</p>
    <p>ומרכז קהילתי "אוהב ישראל" ע"ש הרב ישראל פרידמן בן שלום זצ"ל</p>
    <p class="address">רח' קטיף 36, נתיבות</p>
    <div class="footer-qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https%3A%2F%2Fdavidhaiintel.github.io%2Fhasimcha-beofek%2Findex.html" alt="קוד QR לאתר">
      <span>סרקו להגעה לאתר</span>
    </div>
    <p>&copy; <span id="current-year"></span> קהילת אוהב ישראל</p>
    <p class="admin-link"><a href="admin.html">ניהול</a></p>
  </div>
</footer>

<script src="js/site-config.js"></script>
<script src="js/common.js"></script>
</body>
</html>
`;
}

// בונה HTML מלא ל"דף לוח זמנים" חדש (כותרת + שורות שעות, ניתן לעריכה מלאה מהניהול)
function buildNewSchedulePageHtml(title, dataFile) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | השמחה שבאופק</title>
<link rel="icon" href="images/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<header class="site-header">
  <div class="container">
    <a class="brand" href="index.html">
      <img src="images/logo.png" alt="לוגו קהילת אוהב ישראל">
      <div class="brand-text">
        <h1>בית הכנסת השמחה שבאופק</h1>
        <p>קהילת אוהב ישראל | נתיבות</p>
      </div>
    </a>
    <button class="nav-toggle" aria-label="פתח תפריט">&#9776;</button>
    <nav class="main-nav">
      <a href="index.html">בית</a>
      <a href="zmanim.html">זמני תפילה</a>
      <a href="shabbat.html">שבת קודש</a>
      <span id="extra-nav-links"></span>
      <a href="about.html">הקהילה</a>
      <a href="donations.html">תרומות</a>
    </nav>
  </div>
</header>

<main>
  <section class="section">
    <div class="container" style="max-width:800px;">
      <h2 style="text-align:center;" class="schedule-title"></h2>
      <ul class="shabbat-list js-schedule-list" style="max-width:400px; margin:20px auto 0;"></ul>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container">
    <p><strong>בית כנסת "השמחה שבאופק"</strong> ע"ש שמחה חלילי ואופק חלילי ז"ל</p>
    <p>ומרכז קהילתי "אוהב ישראל" ע"ש הרב ישראל פרידמן בן שלום זצ"ל</p>
    <p class="address">רח' קטיף 36, נתיבות</p>
    <div class="footer-qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https%3A%2F%2Fdavidhaiintel.github.io%2Fhasimcha-beofek%2Findex.html" alt="קוד QR לאתר">
      <span>סרקו להגעה לאתר</span>
    </div>
    <p>&copy; <span id="current-year"></span> קהילת אוהב ישראל</p>
    <p class="admin-link"><a href="admin.html">ניהול</a></p>
  </div>
</footer>

<script src="js/site-config.js"></script>
<script src="${dataFile}"></script>
<script src="js/common.js"></script>
</body>
</html>
`;
}

// יוצר קובץ חדש ב-GitHub (PUT ללא sha - כי הקובץ עדיין לא קיים)
async function createFileOnGithub(path, content, commitMessage, token) {
  const resp = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: commitMessage,
        content: b64EncodeUnicode(content),
        branch: GH_BRANCH,
      }),
    }
  );
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `יצירת ${path} נכשלה`);
  }
}

async function createNewPage() {
  const token = document.getElementById("gh-token").value.trim();
  const title = document.getElementById("new-page-title").value.trim();
  let slug = document.getElementById("new-page-slug").value.trim();
  const body = document.getElementById("new-page-body").value.trim();
  const pageType = document.getElementById("new-page-type").value;
  const msgEl = document.getElementById("create-page-msg");
  const showMsg2 = (text, ok) => {
    msgEl.style.display = "block";
    msgEl.className = "admin-msg " + (ok ? "ok" : "err");
    msgEl.textContent = text;
  };

  if (!token) return showMsg2("יש להזין GitHub Personal Access Token למעלה כדי ליצור דף.", false);
  if (!title || !slug) return showMsg2("יש למלא כותרת וכתובת לדף.", false);
  if (!slug.endsWith(".html")) slug += ".html";
  slug = slug.replace(/[^a-zA-Z0-9\-_.]/g, "");
  const key = slug.replace(/\.html$/, "");

  showMsg2("יוצר דף...", true);
  try {
    if (pageType === "schedule") {
      const dataFile = `js/${key}-data.js`;
      const html = buildNewSchedulePageHtml(title, dataFile);
      await createFileOnGithub(slug, html, `יצירת דף חדש: ${title}`, token);
      await createFileOnGithub(dataFile, buildScheduleDataJs(title, []), `יצירת לוח זמנים: ${title}`, token);
      const page = { key, label: title, url: slug, schedule: true, dataFile };
      addExtraPageRow(page);
      addSchedulePageFieldset(page, { title, rows: [] });
      showMsg2(`הדף "${title}" נוצר! אפשר כבר להוסיף שורות שעה בסעיף "${title}" למטה, ואז ללחוץ "שמור ופרסם באתר".`, true);
    } else {
      const html = buildNewPageHtml(title, body || "");
      await createFileOnGithub(slug, html, `יצירת דף חדש: ${title}`, token);
      addExtraPageRow({ key, label: title, url: slug });
      showMsg2(`הדף "${title}" נוצר! לחצו על "שמור ופרסם באתר" למטה כדי להוסיף אותו לניווט.`, true);
    }
    document.getElementById("new-page-title").value = "";
    document.getElementById("new-page-slug").value = "";
    document.getElementById("new-page-body").value = "";
  } catch (e) {
    showMsg2("שגיאה: " + e.message, false);
  }
}

async function loadIntoForm() {
  const html = await fetchLiveShabbatHtml();

  document.getElementById("weekday-rows").innerHTML = "";
  parseListFromHtml(html, "weekday-list").forEach((r) => addRow("weekday-rows", r.label, r.time, r.hidden));

  const shabbatTimesJs = await fetchLiveShabbatTimesConfigJs();
  const shabbatTimesData = parseShabbatTimesConfigJs(shabbatTimesJs);
  document.getElementById("parasha-title-input").value = shabbatTimesData.parashaTitle?.override || "";
  document.getElementById("shabbat-candle-override").value = shabbatTimesData.candleLighting?.override || "";
  document.getElementById("shabbat-ends-override").value = shabbatTimesData.shabbatEnds?.override || "";
  document.getElementById("shabbat-prayers-rows").innerHTML = "";
  shabbatTimesData.rows.forEach((r) => addRow("shabbat-prayers-rows", r.label, r.override, r.hidden, r.key));

  const shiurimJs = await fetchLiveShiurimDataJs();
  document.getElementById("shiurim-rows").innerHTML = "";
  parseShiurimFromJs(shiurimJs).forEach((r) => addRow("shiurim-rows", r.label, r.time, r.hidden));

  const rhJs = await fetchLiveRoshHashanaDataJs();
  const rhData = parseRoshHashanaFromJs(rhJs);
  document.getElementById("rh-title-input").value = rhData.title;
  [0, 1, 2].forEach((i) => {
    document.getElementById(`rh-day${i}-label`).value = rhData.days[i]?.label || "";
    document.getElementById(`rh-day${i}-rows`).innerHTML = "";
    (rhData.days[i]?.rows || []).forEach((r) => addRow(`rh-day${i}-rows`, r.label, r.time, r.hidden));
  });

  const kippurJs = await fetchLiveKippurDataJs();
  const kippurData = parseKippurDataJs(kippurJs);
  document.getElementById("kippur-title-input").value = kippurData.title;
  document.getElementById("kippur-fast-start-input").value = kippurData.fastStart;
  document.getElementById("kippur-fast-end-input").value = kippurData.fastEnd;
  document.getElementById("kippur-erev-label").value = kippurData.erevDay.label;
  document.getElementById("kippur-erev-rows").innerHTML = "";
  kippurData.erevDay.rows.forEach((r) => addRow("kippur-erev-rows", r.label, r.time, r.hidden));
  [0, 1].forEach((i) => {
    document.getElementById(`kippur-col${i}-label`).value = kippurData.columns[i]?.label || "";
    document.getElementById(`kippur-col${i}-rows`).innerHTML = "";
    (kippurData.columns[i]?.rows || []).forEach((r) => addRow(`kippur-col${i}-rows`, r.label, r.time, r.hidden));
  });
  document.getElementById("kippur-footer-line1").value = kippurData.footerLine1;
  document.getElementById("kippur-footer-line2").value = kippurData.footerLine2;
  document.getElementById("kippur-closing").value = kippurData.closing;

  const stJs = await fetchLiveSimchatTorahDataJs();
  const stData = parseSimchatTorahDataJs(stJs);
  document.getElementById("st-title-input").value = stData.title;
  document.getElementById("st-shacharit-rows").innerHTML = "";
  stData.shacharitRows.forEach((r) => addRow("st-shacharit-rows", r.label, r.time, r.hidden));

  const configJs = await fetchLiveSiteConfigJs();
  const extraPages = parseExtraPagesFromJs(configJs);
  renderExtraPagesForm(extraPages);
  await renderSchedulePagesForm(extraPages);

  const aboutHtml = await fetchLiveAboutHtml();
  renderCommitteeForm(parseCommitteeFromHtml(aboutHtml));
}

function showMsg(text, ok) {
  const el = document.getElementById("save-msg");
  el.style.display = "block";
  el.className = "admin-msg " + (ok ? "ok" : "err");
  el.textContent = text;
}

async function saveToGithub() {
  const token = document.getElementById("gh-token").value.trim();
  if (!token) {
    showMsg("יש להזין GitHub Personal Access Token כדי לשמור.", false);
    return;
  }
  showMsg("שומר...", true);

  try {
    await saveFileToGithub(
      GH_FILE_PATH,
      (currentHtml) => {
        const newWeekdayList = buildListHtml("weekday-list", getRows("weekday-rows"));
        return currentHtml.replace(/<ul class="shabbat-list" id="weekday-list">[\s\S]*?<\/ul>/, newWeekdayList);
      },
      `עדכון לוז שבת`,
      token
    );

    // מעדכן גם את עותק "תפילות ימי חול" בדף שמחת תורה הייעודי, כדי שיישאר מסונכרן
    await saveFileToGithub(
      "simchat-torah.html",
      (currentHtml) => {
        const newWeekdayList = buildListHtml("st-weekday-list", getRows("weekday-rows"));
        return currentHtml.replace(/<ul class="shabbat-list" id="st-weekday-list">[\s\S]*?<\/ul>/, newWeekdayList);
      },
      `עדכון תפילות ימי חול בדף שמחת תורה`,
      token
    );

    await saveFileToGithub(
      "js/shabbat-times-config.js",
      () => {
        const parashaOverride = document.getElementById("parasha-title-input").value.trim();
        const candleOverride = document.getElementById("shabbat-candle-override").value.trim();
        const shabbatEndsOverride = document.getElementById("shabbat-ends-override").value.trim();
        return buildShabbatTimesConfigJs(parashaOverride, candleOverride, shabbatEndsOverride, getRows("shabbat-prayers-rows"));
      },
      `עדכון זמני תפילות שבת`,
      token
    );

    await saveFileToGithub(
      "js/shiurim-data.js",
      () => buildShiurimDataJs(getRows("shiurim-rows")),
      `עדכון שיעורי תורה`,
      token
    );

    await saveFileToGithub(
      "js/rosh-hashana-data.js",
      () => {
        const title = document.getElementById("rh-title-input").value.trim();
        const days = [0, 1, 2].map((i) => ({
          label: document.getElementById(`rh-day${i}-label`).value.trim(),
          rows: getRows(`rh-day${i}-rows`),
        }));
        return buildRoshHashanaDataJs(title, days);
      },
      `עדכון לוח ראש השנה`,
      token
    );

    await saveFileToGithub(
      "js/kippur-data.js",
      () => buildKippurDataJs({
        title: document.getElementById("kippur-title-input").value.trim(),
        fastStart: document.getElementById("kippur-fast-start-input").value.trim(),
        fastEnd: document.getElementById("kippur-fast-end-input").value.trim(),
        erevDay: {
          label: document.getElementById("kippur-erev-label").value.trim(),
          rows: getRows("kippur-erev-rows"),
        },
        columns: [0, 1].map((i) => ({
          label: document.getElementById(`kippur-col${i}-label`).value.trim(),
          rows: getRows(`kippur-col${i}-rows`),
        })),
        footerLine1: document.getElementById("kippur-footer-line1").value.trim(),
        footerLine2: document.getElementById("kippur-footer-line2").value.trim(),
        closing: document.getElementById("kippur-closing").value.trim(),
      }),
      `עדכון לוח יום הכיפורים`,
      token
    );

    await saveFileToGithub(
      "js/simchat-torah-config.js",
      () => buildSimchatTorahDataJs(
        document.getElementById("st-title-input").value.trim(),
        getRows("st-shacharit-rows")
      ),
      `עדכון שינויי שחרית שמחת תורה`,
      token
    );

    // כל "דפי לוח הזמנים" הקיימים (schedule:true ב-SITE_CONFIG), כולל כאלו שנוספו הרגע
    for (const sp of getSchedulePagesFromForm()) {
      await saveFileToGithub(
        sp.dataFile,
        () => buildScheduleDataJs(sp.title, sp.rows),
        `עדכון ${sp.dataFile}`,
        token
      );
    }

    await saveFileToGithub(
      "js/site-config.js",
      () => buildSiteConfigJs(getExtraPagesFromForm()),
      `עדכון הגדרות דפים נוספים`,
      token
    );

    await saveFileToGithub(
      "about.html",
      (currentHtml) => currentHtml.replace(
        /<!-- COMMITTEE_START -->[\s\S]*?<!-- COMMITTEE_END -->/,
        buildCommitteeHtml(getCommitteeFromForm())
      ),
      `עדכון עמוד הקהילה`,
      token
    );

    showMsg("נשמר ופורסם בהצלחה! האתר יתעדכן תוך דקה-שתיים.", true);
  } catch (e) {
    showMsg("שגיאה: " + e.message, false);
  }
}

async function saveFileToGithub(path, transform, commitMessage, token) {
  const rawResp = await fetch(
    `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${path}?t=${Date.now()}`
  );
  if (!rawResp.ok) throw new Error(`לא הצלחתי לטעון את ${path}`);
  const current = await rawResp.text();
  const updated = transform(current);

  const metaResp = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`,
    { headers: { Authorization: `token ${token}` } }
  );
  if (!metaResp.ok) throw new Error(`לא הצלחתי לקרוא את פרטי ${path} מ-GitHub (בדוק את הטוקן)`);
  const meta = await metaResp.json();

  const putResp = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: b64EncodeUnicode(updated),
        sha: meta.sha,
        branch: GH_BRANCH,
      }),
    }
  );
  if (!putResp.ok) {
    const err = await putResp.json().catch(() => ({}));
    throw new Error(err.message || `השמירה של ${path} נכשלה`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-btn").addEventListener("click", async () => {
    const pw = document.getElementById("admin-password").value;
    if (pw !== ADMIN_PASSWORD) {
      document.getElementById("login-error").style.display = "block";
      return;
    }
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("editor-screen").style.display = "block";
    const savedToken = sessionStorage.getItem("gh_token");
    if (savedToken) document.getElementById("gh-token").value = savedToken;
    try {
      await loadIntoForm();
    } catch (e) {
      showMsg("שגיאה בטעינת הנתונים הקיימים: " + e.message, false);
    }
  });

  document.getElementById("reload-btn").addEventListener("click", async () => {
    try {
      await loadIntoForm();
      showMsg("נטען מחדש מהאתר החי.", true);
    } catch (e) {
      showMsg("שגיאה: " + e.message, false);
    }
  });

  document.querySelectorAll(".admin-add-btn").forEach((btn) => {
    btn.addEventListener("click", () => addRow(btn.dataset.target));
  });

  document.getElementById("save-btn").addEventListener("click", () => {
    sessionStorage.setItem("gh_token", document.getElementById("gh-token").value.trim());
    saveToGithub();
  });

  document.getElementById("create-page-btn").addEventListener("click", () => {
    sessionStorage.setItem("gh_token", document.getElementById("gh-token").value.trim());
    createNewPage();
  });

  document.getElementById("new-page-type").addEventListener("change", (e) => {
    document.getElementById("new-page-body-wrap").style.display = e.target.value === "schedule" ? "none" : "block";
  });

  document.getElementById("add-group-btn").addEventListener("click", () => addCommitteeGroup());
});
