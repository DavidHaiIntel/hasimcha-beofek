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

function addRow(containerId, label = "", time = "") {
  const container = document.getElementById(containerId);
  const row = document.createElement("div");
  row.className = "admin-row";
  row.innerHTML = `
    <input type="text" class="row-label" placeholder="תיאור" value="${label.replace(/"/g, "&quot;")}">
    <input type="text" class="row-time" placeholder="שעה" value="${time.replace(/"/g, "&quot;")}">
    <button type="button" class="remove-row-btn">הסר</button>
  `;
  row.querySelector(".remove-row-btn").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function getRows(containerId) {
  const container = document.getElementById(containerId);
  return Array.from(container.querySelectorAll(".admin-row")).map((row) => ({
    label: row.querySelector(".row-label").value.trim(),
    time: row.querySelector(".row-time").value.trim(),
  })).filter((r) => r.label || r.time);
}

function buildListHtml(id, rows) {
  const items = rows
    .map((r) => `              <li><span>${r.label}</span><span class="time">${r.time}</span></li>`)
    .join("\n");
  return `<ul class="shabbat-list" id="${id}">\n${items}\n            </ul>`;
}

function parseListFromHtml(html, id) {
  const re = new RegExp(`<ul class="shabbat-list" id="${id}">([\\s\\S]*?)</ul>`);
  const match = html.match(re);
  if (!match) return [];
  const liRe = /<li><span>([\s\S]*?)<\/span><span class="time"[^>]*>([\s\S]*?)<\/span><\/li>/g;
  const rows = [];
  let m;
  while ((m = liRe.exec(match[1])) !== null) {
    rows.push({ label: m[1].trim(), time: m[2].trim() });
  }
  return rows;
}

function parseTitleFromHtml(html) {
  const match = html.match(/<h3 id="parasha-title">([\s\S]*?)<\/h3>/);
  return match ? match[1].trim() : "";
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
    `;
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

async function loadIntoForm() {
  const html = await fetchLiveShabbatHtml();
  document.getElementById("parasha-title-input").value = parseTitleFromHtml(html);

  document.getElementById("weekday-rows").innerHTML = "";
  parseListFromHtml(html, "weekday-list").forEach((r) => addRow("weekday-rows", r.label, r.time));

  document.getElementById("shiurim-rows").innerHTML = "";
  parseListFromHtml(html, "shiurim-list").forEach((r) => addRow("shiurim-rows", r.label, r.time));

  const configJs = await fetchLiveSiteConfigJs();
  renderExtraPagesForm(parseExtraPagesFromJs(configJs));
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
        const newShiurimList = buildListHtml("shiurim-list", getRows("shiurim-rows"));
        return currentHtml
          .replace(/<h3 id="parasha-title">[\s\S]*?<\/h3>/, `<h3 id="parasha-title">${newTitle}</h3>`)
          .replace(/<ul class="shabbat-list" id="weekday-list">[\s\S]*?<\/ul>/, newWeekdayList)
          .replace(/<ul class="shabbat-list" id="shiurim-list">[\s\S]*?<\/ul>/, newShiurimList);
      },
      `עדכון לוז שבת`,
      token
    );

    await saveFileToGithub(
      "js/site-config.js",
      () => buildSiteConfigJs(getExtraPagesFromForm()),
      `עדכון הגדרות דפים נוספים`,
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
});
