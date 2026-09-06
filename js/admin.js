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

function addRow(containerId, label = "", time = "", hidden = false) {
  const container = document.getElementById(containerId);
  const row = document.createElement("div");
  row.className = "admin-row";
  row.dataset.hidden = hidden ? "true" : "false";
  row.innerHTML = `
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
  container.appendChild(row);
}

function getRows(containerId) {
  const container = document.getElementById(containerId);
  return Array.from(container.querySelectorAll(".admin-row")).map((row) => ({
    label: row.querySelector(".row-label").value.trim(),
    time: row.querySelector(".row-time").value.trim(),
    hidden: row.dataset.hidden === "true",
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

function parseTitleFromHtml(html) {
  const match = html.match(/<h3 id="parasha-title">([\s\S]*?)<\/h3>/);
  return match ? match[1].trim() : "";
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
  const groupEl = document.createElement("div");
  groupEl.className = "committee-group-editor";
  groupEl.innerHTML = `
    <div class="admin-field">
      <label>שם הקבוצה</label>
      <input type="text" class="group-title" value="${group.title.replace(/"/g, "&quot;")}">
    </div>
    <div class="group-names"></div>
    <button type="button" class="admin-add-btn add-name-btn">+ הוסף שם</button>
    <button type="button" class="remove-page-btn remove-group-btn">מחק קבוצה</button>
  `;
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
    const rowsJs = day.rows
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
    row.innerHTML = `
      <input type="checkbox" class="extra-page-enabled" id="extra-${p.key}" ${p.enabled ? "checked" : ""}>
      <label for="extra-${p.key}">${p.label} (${p.url})</label>
      <button type="button" class="remove-page-btn">מחק דף</button>
    `;
    row.querySelector(".remove-page-btn").addEventListener("click", () => row.remove());
    container.appendChild(row);
  });
}

function getExtraPagesFromForm() {
  return Array.from(document.querySelectorAll("#extra-pages-rows .extra-page-row")).map((row) => ({
    key: row.dataset.key,
    url: row.dataset.url,
    label: row.querySelector("label").textContent.replace(/\s*\([^)]*\)\s*$/, ""),
    enabled: row.querySelector(".extra-page-enabled").checked,
  }));
}

function buildSiteConfigJs(pages) {
  const list = pages
    .map((p) => `    { key: "${p.key}", label: "${p.label}", url: "${p.url}", enabled: ${p.enabled} },`)
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
  row.innerHTML = `
    <input type="checkbox" class="extra-page-enabled" id="extra-${page.key}" checked>
    <label for="extra-${page.key}">${page.label} (${page.url})</label>
    <button type="button" class="remove-page-btn">מחק דף</button>
  `;
  row.querySelector(".remove-page-btn").addEventListener("click", () => row.remove());
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
    const html = buildNewPageHtml(title, body || "");
    await createFileOnGithub(slug, html, `יצירת דף חדש: ${title}`, token);
    addExtraPageRow({ key, label: title, url: slug });
    showMsg2(`הדף "${title}" נוצר! לחצו על "שמור ופרסם באתר" למטה כדי להוסיף אותו לניווט.`, true);
    document.getElementById("new-page-title").value = "";
    document.getElementById("new-page-slug").value = "";
    document.getElementById("new-page-body").value = "";
  } catch (e) {
    showMsg2("שגיאה: " + e.message, false);
  }
}

async function loadIntoForm() {
  const html = await fetchLiveShabbatHtml();
  document.getElementById("parasha-title-input").value = parseTitleFromHtml(html);

  document.getElementById("weekday-rows").innerHTML = "";
  parseListFromHtml(html, "weekday-list").forEach((r) => addRow("weekday-rows", r.label, r.time, r.hidden));

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

  const configJs = await fetchLiveSiteConfigJs();
  renderExtraPagesForm(parseExtraPagesFromJs(configJs));

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
        const newTitle = document.getElementById("parasha-title-input").value.trim();
        const newWeekdayList = buildListHtml("weekday-list", getRows("weekday-rows"));
        return currentHtml
          .replace(/<h3 id="parasha-title">[\s\S]*?<\/h3>/, `<h3 id="parasha-title">${newTitle}</h3>`)
          .replace(/<ul class="shabbat-list" id="weekday-list">[\s\S]*?<\/ul>/, newWeekdayList);
      },
      `עדכון לוז שבת`,
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

  document.getElementById("add-group-btn").addEventListener("click", () => addCommitteeGroup());
});
