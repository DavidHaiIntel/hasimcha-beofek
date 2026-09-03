/* ===== חישוב זמני הנץ החמה (זריחה נראית) עבור נתיבות =====
   שיטת החישוב מבוססת על נוסחאות NOAA הסטנדרטיות (Jean Meeus).
   הזנית כויל ידנית מול לוח "חי" (chaitables.com) בנתיבות, סוג לוח "זריחה נראית":
   ב-21 באלול תשפ"ו לוח "חי" נותן הנץ 6:23, לעומת 90.833° (זריחה תיאורטית) שנותן 6:18-6:19.
   הזנית 89.93° מיישרת את התוצאה שלנו ללוח "חי" (הפרש ~5 דק', כנראה עקב גובה אופק/שיטת חישוב שונה). */
const SUNRISE_ZENITH = 89.93;

const NETIVOT = {
  lat: 31.4231,
  lon: 34.5878,
  timeZone: "Asia/Jerusalem",
};

// כמה דקות לפני הנץ מתחילה התפילה (הודו) - ניתן לעדכן כאן במידת הצורך
const MINUTES_BEFORE_HANETZ = 18;

function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }
function normalizeDeg(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

// מספר יום יוליאני (JD) בצהריים UTC עבור תאריך גרגוריאני נתון
function julianDayNumber(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * מחשב את זמני הזריחה (הנץ) והשקיעה (UTC, כאובייקטי Date) עבור תאריך ומיקום נתונים.
 * @param {number} year שנה גרגוריאנית
 * @param {number} month חודש (1-12)
 * @param {number} day יום בחודש
 * @param {number} lat קו רוחב (מעלות, צפון חיובי)
 * @param {number} lon קו אורך (מעלות, מזרח חיובי)
 * @returns {{sunrise: Date|null, sunset: Date|null}}
 */
function calcSunTimes(year, month, day, lat, lon) {
  const jd = julianDayNumber(year, month, day);
  const T = (jd - 2451545.0) / 36525;

  const L0 = normalizeDeg(280.46646 + T * (36000.76983 + T * 0.0003032));
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(toRad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(toRad(2 * M)) * (0.019993 - 0.000101 * T) +
    Math.sin(toRad(3 * M)) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(toRad(omega));
  const meanObliq =
    23 +
    (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const obliqCorr = meanObliq + 0.00256 * Math.cos(toRad(omega));
  const decl = toDeg(
    Math.asin(Math.sin(toRad(obliqCorr)) * Math.sin(toRad(appLong)))
  );
  const y2 = Math.pow(Math.tan(toRad(obliqCorr / 2)), 2);
  const eqTime =
    4 *
    toDeg(
      y2 * Math.sin(2 * toRad(L0)) -
        2 * e * Math.sin(toRad(M)) +
        4 * e * y2 * Math.sin(toRad(M)) * Math.cos(2 * toRad(L0)) -
        0.5 * y2 * y2 * Math.sin(4 * toRad(L0)) -
        1.25 * e * e * Math.sin(2 * toRad(M))
    );

  const zenith = SUNRISE_ZENITH; // כויל מול לוח "חי" (ראו הערה בראש הקובץ)
  const cosHA =
    Math.cos(toRad(zenith)) / (Math.cos(toRad(lat)) * Math.cos(toRad(decl))) -
    Math.tan(toRad(lat)) * Math.tan(toRad(decl));

  if (cosHA > 1 || cosHA < -1) {
    return { sunrise: null, sunset: null };
  }

  const HA = toDeg(Math.acos(cosHA));
  const solarNoonUTCmin = 720 - 4 * lon - eqTime;
  const sunriseUTCmin = solarNoonUTCmin - 4 * HA;
  const sunsetUTCmin = solarNoonUTCmin + 4 * HA;

  const midnightUTC = Date.UTC(year, month - 1, day, 0, 0, 0);
  return {
    sunrise: new Date(midnightUTC + sunriseUTCmin * 60000),
    sunset: new Date(midnightUTC + sunsetUTCmin * 60000),
  };
}

// מחזיר את זמני ההנץ ותחילת התפילה עבור אובייקט Date נתון
function getShulZmanim(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const { sunrise } = calcSunTimes(y, m, d, NETIVOT.lat, NETIVOT.lon);
  if (!sunrise) return { hanetz: null, tefila: null };
  const tefila = new Date(sunrise.getTime() - MINUTES_BEFORE_HANETZ * 60000);
  return { hanetz: sunrise, tefila };
}

/* ===== ימים טובים (בישראל) - אין בהם מניין ותיקין ===== 
   בחול המועד (סוכות/פסח) יש תפילת ותיקין כרגיל - הם לא כלולים ברשימה. */
const YOM_TOV_DAYS = [
  { month: "Tishri", day: 1, name: "ראש השנה" },
  { month: "Tishri", day: 2, name: "ראש השנה" },
  { month: "Tishri", day: 10, name: "יום כיפור" },
  { month: "Tishri", day: 15, name: "סוכות" },
  { month: "Tishri", day: 22, name: "שמיני עצרת / שמחת תורה" },
  { month: "Nisan", day: 15, name: "פסח" },
  { month: "Nisan", day: 21, name: "שביעי של פסח" },
  { month: "Sivan", day: 6, name: "שבועות" },
];

const hebrewCivilFormatter = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

// מחזיר את פרטי היום: שבת ו/או יום טוב (שבהם אין מניין ותיקין)
function getDayStatus(date) {
  const isShabbat = date.getDay() === 6;
  let yomTov = null;
  try {
    const parts = hebrewCivilFormatter.formatToParts(date);
    const month = parts.find((p) => p.type === "month")?.value;
    const day = Number(parts.find((p) => p.type === "day")?.value);
    yomTov = YOM_TOV_DAYS.find((yt) => yt.month === month && yt.day === day) || null;
  } catch (e) {
    yomTov = null;
  }
  return { isShabbat, isYomTov: !!yomTov, yomTovName: yomTov ? yomTov.name : "" };
}

function formatTime(date) {
  if (!date) return "--:--";
  return date.toLocaleTimeString("he-IL", {
    timeZone: NETIVOT.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatGregorian(date) {
  return date.toLocaleDateString("he-IL", {
    timeZone: NETIVOT.timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatHebrewDate(date) {
  try {
    return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      timeZone: NETIVOT.timeZone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return "";
  }
}

/* ===== רינדור בעמוד הבית: כרטיס "זמני היום" ===== */
function renderTodayCard() {
  const el = document.getElementById("today-zman-card");
  if (!el) return;
  const now = new Date();
  const { hanetz, tefila } = getShulZmanim(now);
  const { isShabbat, isYomTov, yomTovName } = getDayStatus(now);
  const noVatikin = isShabbat || isYomTov;

  el.querySelector(".date-line").textContent = formatGregorian(now);
  el.querySelector(".hebrew-date").textContent = formatHebrewDate(now);
  el.querySelector('[data-zman="hanetz"] .value').textContent = formatTime(hanetz);
  const tefilaEl = el.querySelector('[data-zman="tefila"] .value');
  if (noVatikin) {
    tefilaEl.textContent = `אין מניין ותיקין (${isYomTov ? yomTovName : "שבת"})`;
    tefilaEl.classList.add("no-tefila");
  } else {
    tefilaEl.textContent = formatTime(tefila);
    tefilaEl.classList.remove("no-tefila");
  }
}

/* ===== רינדור בעמוד "זמני תפילה": טבלה חודשית ===== */
const HEBREW_WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

let currentMonthView = new Date();

function renderMonthTable() {
  const wrap = document.getElementById("zman-table-body");
  const label = document.getElementById("current-month-label");
  if (!wrap || !label) return;

  const year = currentMonthView.getFullYear();
  const month = currentMonthView.getMonth(); // 0-11
  label.textContent = `${HEBREW_MONTHS[month]} ${year}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  let rows = "";
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const { hanetz, tefila } = getShulZmanim(date);
    const weekday = HEBREW_WEEKDAYS[date.getDay()];
    const isToday = isCurrentMonth && today.getDate() === d;
    const { isShabbat, isYomTov, yomTovName } = getDayStatus(date);
    const noVatikin = isShabbat || isYomTov;
    const classes = [isToday ? "today" : "", isShabbat ? "shabbat" : "", isYomTov ? "yom-tov" : ""]
      .filter(Boolean)
      .join(" ");
    const tefilaCell = noVatikin
      ? `<span class="no-tefila" title="אין מניין ותיקין - ${isYomTov ? yomTovName : "שבת"}">אין ותיקין</span>`
      : formatTime(tefila);
    rows += `<tr class="${classes}">
      <td>${d} ${HEBREW_MONTHS[month]}</td>
      <td>יום ${weekday}${isYomTov ? ` (${yomTovName})` : ""}</td>
      <td class="time">${formatTime(hanetz)}</td>
      <td class="time">${tefilaCell}</td>
    </tr>`;
  }
  wrap.innerHTML = rows;
}

function initMonthNav() {
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");
  if (!prevBtn || !nextBtn) return;
  prevBtn.addEventListener("click", () => {
    currentMonthView.setMonth(currentMonthView.getMonth() - 1);
    renderMonthTable();
  });
  nextBtn.addEventListener("click", () => {
    currentMonthView.setMonth(currentMonthView.getMonth() + 1);
    renderMonthTable();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTodayCard();
  renderMonthTable();
  initMonthNav();
});
