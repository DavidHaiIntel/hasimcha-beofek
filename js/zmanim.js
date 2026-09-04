/* ===== חישוב זמני הנץ החמה (זריחה נראית) עבור נתיבות =====
   שיטת החישוב מבוססת על נוסחאות NOAA הסטנדרטיות (Jean Meeus).
   *** המקור העיקרי לזמני ההנץ הוא טבלת הנתונים האמיתיים מלוח "חי" (js/netz-data.js) ***
   הנוסחה כאן משמשת רק כגיבוי לתאריכים מחוץ לטווח הנתונים השמורים (מחוץ לתשפ"ו-תשפ"ז).
   בדקנו האם אפשר "לשחזר" את הנוסחה המדויקת של לוח "חי" ע"י התאמת זנית קבועה מול 739 נקודות
   נתונים אמיתיות (משתי השנים שנמשכו) - ומצאנו שזנית קבועה אחת *לא* משחזרת את התוצאה במדויק
   בכל השנה: יש סטיית תקן של כ-0.1° (עד כ-20-30 שניות טיפוסי, ולעיתים עד כ-2 דקות בימי קיצון).
   כלומר לוח "חי" כנראה משתמש במודל מורכב יותר (כנראה פרופיל אופק/גובה אמיתי של השטח סביב
   נתיבות בכל כיוון, ולא רק זנית קבועה) - שאי אפשר לשחזר במדויק בלי נתוני טופוגרפיה מלאים.
   הזנית 89.96° היא הממוצע הטוב ביותר שנמצא (מתוך 739 ימים), לשימוש כגיבוי בלבד. */
const SUNRISE_ZENITH = 89.96;
// שקיעה לצורך כניסת/יציאת שבת ותפילות - זנית "אזרחית" סטנדרטית (שונה מכיול ההנץ למעלה)
const SUNSET_ZENITH = 90.833;

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
  const cosHASet =
    Math.cos(toRad(SUNSET_ZENITH)) / (Math.cos(toRad(lat)) * Math.cos(toRad(decl))) -
    Math.tan(toRad(lat)) * Math.tan(toRad(decl));

  if (cosHA > 1 || cosHA < -1 || cosHASet > 1 || cosHASet < -1) {
    return { sunrise: null, sunset: null };
  }

  const HA = toDeg(Math.acos(cosHA));
  const HASet = toDeg(Math.acos(cosHASet));
  const solarNoonUTCmin = 720 - 4 * lon - eqTime;
  const sunriseUTCmin = solarNoonUTCmin - 4 * HA;
  const sunsetUTCmin = solarNoonUTCmin + 4 * HASet;

  const midnightUTC = Date.UTC(year, month - 1, day, 0, 0, 0);
  return {
    sunrise: new Date(midnightUTC + sunriseUTCmin * 60000),
    sunset: new Date(midnightUTC + sunsetUTCmin * 60000),
  };
}

// מחפש את זמן ההנץ בטבלת הנתונים האמיתית שנמשכה מלוח "חי" (NETZ_DATA), לפי תאריך עברי
function getHanetzFromRealData(date) {
  if (typeof NETZ_DATA === "undefined") return null;
  const parts = hebrewCivilFormatter.formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const month = parts.find((p) => p.type === "month")?.value;
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const timeStr = NETZ_DATA[year]?.[month]?.[day - 1];
  if (!timeStr) return null;
  const [h, m, s] = timeStr.split(":").map(Number);
  const result = new Date(date);
  result.setHours(h, m, s, 0);
  return result;
}

// מחזיר את זמני ההנץ ותחילת התפילה עבור אובייקט Date נתון
function getShulZmanim(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // קודם ננסה למשוך את הזמן המדויק מהטבלה האמיתית (לוח "חי") - אם קיים לתאריך זה
  let sunrise = getHanetzFromRealData(date);
  if (!sunrise) {
    // מחוץ לטווח הנתונים שנמשכו (NETZ_DATA) - חוזרים לחישוב אסטרונומי מקורב
    sunrise = calcSunTimes(y, m, d, NETIVOT.lat, NETIVOT.lon).sunrise;
  }
  if (!sunrise) return { hanetz: null, tefila: null };
  const tefila = new Date(sunrise.getTime() - MINUTES_BEFORE_HANETZ * 60000);
  return { hanetz: sunrise, tefila };
}

/* ===== ימים טובים (בישראל) - אין בהם מניין ותיקין ===== 
   בחול המועד (סוכות/פסח) יש תפילת ותיקין כרגיל - הם לא כלולים ברשימה.
   בראש השנה וביום כיפור כן יש תפילה (בשעה קבועה - ראו FIXED_TEFILA_DAYS למטה),
   ולכן הם לא כלולים ברשימה הזו. */
const YOM_TOV_DAYS = [
  { month: "Tishri", day: 15, name: "סוכות" },
  { month: "Tishri", day: 22, name: "שמיני עצרת / שמחת תורה" },
  { month: "Nisan", day: 15, name: "פסח" },
  { month: "Nisan", day: 21, name: "שביעי של פסח" },
  { month: "Sivan", day: 6, name: "שבועות" },
];

/* ===== ימים עם תחילת תפילה בשעה קבועה (קורבנות) במקום 18 דק' לפני הנץ ===== */
const FIXED_TEFILA_DAYS = [
  { month: "Tishri", day: 1, time: "5:30", name: "ראש השנה" },
  { month: "Tishri", day: 2, time: "5:30", name: "ראש השנה" },
  { month: "Tishri", day: 10, time: "5:20", name: "יום כיפור" },
];

const hebrewCivilFormatter = new Intl.DateTimeFormat("en-u-ca-hebrew", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

// מחזיר את פרטי היום: שבת, יום טוב (ללא ותיקין), ותפילה בשעה קבועה (אם יש)
function getDayStatus(date) {
  const isShabbat = date.getDay() === 6;
  let yomTov = null;
  let fixedTefila = null;
  try {
    const parts = hebrewCivilFormatter.formatToParts(date);
    const month = parts.find((p) => p.type === "month")?.value;
    const day = Number(parts.find((p) => p.type === "day")?.value);
    yomTov = YOM_TOV_DAYS.find((yt) => yt.month === month && yt.day === day) || null;
    fixedTefila = FIXED_TEFILA_DAYS.find((ft) => ft.month === month && ft.day === day) || null;
  } catch (e) {
    yomTov = null;
    fixedTefila = null;
  }
  return {
    isShabbat,
    isYomTov: !!yomTov,
    yomTovName: yomTov ? yomTov.name : "",
    fixedTefilaTime: fixedTefila ? fixedTefila.time : null,
    fixedTefilaName: fixedTefila ? fixedTefila.name : "",
  };
}

function formatTime(date) {
  if (!date) return "--:--";
  // חותך שניות (לא מעגל) - כך chaitables.com מציג את הזמן הרגיל שלו (למשל 6:23:30 -> "6:23")
  const truncated = new Date(Math.floor(date.getTime() / 60000) * 60000);
  return truncated.toLocaleTimeString("he-IL", {
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
  const { isShabbat, isYomTov, yomTovName, fixedTefilaTime, fixedTefilaName } = getDayStatus(now);
  const noVatikin = isShabbat || isYomTov;

  el.querySelector(".date-line").textContent = formatGregorian(now);
  el.querySelector(".hebrew-date").textContent = formatHebrewDate(now);
  el.querySelector('[data-zman="hanetz"] .value').textContent = formatTime(hanetz);
  const tefilaEl = el.querySelector('[data-zman="tefila"] .value');
  if (fixedTefilaTime) {
    tefilaEl.textContent = `${fixedTefilaTime} - קורבנות (${fixedTefilaName})`;
    tefilaEl.classList.remove("no-tefila");
  } else if (noVatikin) {
    tefilaEl.textContent = `אין מניין ותיקין (${isYomTov ? yomTovName : "שבת"})`;
    tefilaEl.classList.add("no-tefila");
  } else {
    tefilaEl.textContent = formatTime(tefila);
    tefilaEl.classList.remove("no-tefila");
  }
}

/* ===== רינדור בעמוד "זמני תפילה": טבלה חודשית (לפי חודש עברי) ===== */
const HEBREW_WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const GREGORIAN_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const hebrewMonthNameFormatter = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
  month: "long",
});
const hebrewMonthYearFormatter = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
  month: "long",
  year: "numeric",
});

// ממיר מספר (1-30) לאותיות עבריות (גימטריה), עם טיפול מיוחד ל-15/16
function toHebrewNumeral(num) {
  if (num === 15) return 'ט"ו';
  if (num === 16) return 'ט"ז';
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל"];
  const t = Math.floor(num / 10);
  const o = num % 10;
  const str = (tens[t] || "") + (ones[o] || "");
  if (str.length <= 1) return str + "׳"; // geresh
  return str.slice(0, -1) + "״" + str.slice(-1); // gershayim
}

// מזהה חודש עברי (שנה+חודש) לפי Intl, עבור תאריך גרגוריאני נתון
function getHebrewYM(date) {
  const parts = hebrewCivilFormatter.formatToParts(date);
  return {
    day: Number(parts.find((p) => p.type === "day")?.value),
    month: parts.find((p) => p.type === "month")?.value,
    year: Number(parts.find((p) => p.type === "year")?.value),
  };
}

// מוצא את היום הראשון (יום א') של החודש העברי שבו נופל התאריך הנתון
function findHebrewMonthStart(date) {
  const { day } = getHebrewYM(date);
  const start = new Date(date);
  start.setDate(start.getDate() - (day - 1));
  return start;
}

// מחזיר את כל התאריכים הגרגוריאניים של חודש עברי נתון, לפי תאריך תחילתו
function getHebrewMonthDays(monthStart) {
  const ym0 = getHebrewYM(monthStart);
  const days = [];
  const d = new Date(monthStart);
  while (true) {
    const ym = getHebrewYM(d);
    if (ym.month !== ym0.month || ym.year !== ym0.year) break;
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

let currentHebrewMonthStart = findHebrewMonthStart(new Date());

function renderMonthTable() {
  const wrap = document.getElementById("zman-table-body");
  const label = document.getElementById("current-month-label");
  if (!wrap || !label) return;

  const days = getHebrewMonthDays(currentHebrewMonthStart);
  label.textContent = hebrewMonthYearFormatter.format(currentHebrewMonthStart);

  const today = new Date();

  let rows = "";
  for (const date of days) {
    const { hanetz, tefila } = getShulZmanim(date);
    const weekday = HEBREW_WEEKDAYS[date.getDay()];
    const isToday = date.toDateString() === today.toDateString();
    const { isShabbat, isYomTov, yomTovName, fixedTefilaTime, fixedTefilaName } = getDayStatus(date);
    const noVatikin = isShabbat || isYomTov;
    const specialName = fixedTefilaTime ? fixedTefilaName : yomTovName;
    const classes = [isToday ? "today" : "", isShabbat ? "shabbat" : "", (isYomTov || fixedTefilaTime) ? "yom-tov" : ""]
      .filter(Boolean)
      .join(" ");
    let tefilaCell;
    if (fixedTefilaTime) {
      tefilaCell = `<span title="קורבנות - ${fixedTefilaName}">${fixedTefilaTime}</span>`;
    } else if (noVatikin) {
      tefilaCell = `<span class="no-tefila" title="אין מניין ותיקין - ${isYomTov ? yomTovName : "שבת"}">אין ותיקין</span>`;
    } else {
      tefilaCell = formatTime(tefila);
    }
    const gregorianDate = `${date.getDate()} ב${GREGORIAN_MONTHS[date.getMonth()]}`;
    const hebrewDate = `${toHebrewNumeral(getHebrewYM(date).day)} ב${hebrewMonthNameFormatter.format(date)}`;
    rows += `<tr class="${classes}">
      <td>${hebrewDate}${specialName ? ` (${specialName})` : ""}</td>
      <td>${gregorianDate}</td>
      <td>יום ${weekday}</td>
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
    const prevMonthLastDay = new Date(currentHebrewMonthStart);
    prevMonthLastDay.setDate(prevMonthLastDay.getDate() - 1);
    currentHebrewMonthStart = findHebrewMonthStart(prevMonthLastDay);
    renderMonthTable();
  });
  nextBtn.addEventListener("click", () => {
    const days = getHebrewMonthDays(currentHebrewMonthStart);
    const nextStart = days[days.length - 1];
    nextStart.setDate(nextStart.getDate() + 1);
    currentHebrewMonthStart = nextStart;
    renderMonthTable();
  });
}

/* ===== חישוב זמני שבת (כניסה/יציאה ותפילות) - עמוד shabbat.html =====
   כללים (סוכמו מול הקהילה):
   - כניסת שבת = שקיעת יום שישי פחות 10 דק'.
   - צאת שבת = שקיעת יום שבת ועוד 45 דק'.
   - שיר השירים = 10 דק' לפני מנחה של ערב שבת.
   - מנחה/קבלת שבת (ערב שבת) = שקיעת יום שישי פחות 8 דק', מעוגל לרבע-שעה הקרוב ביותר של 5 דק'.
   - שחרית של שבת = 8:30 בשעון קיץ, 8:00 בשעון חורף (קבוע, לא תלוי שקיעה).
   - לימוד הורים וילדים = 45 דק' לפני מנחה של שבת.
   - מנחה של שבת (צהריים) = בערך שעה לפני שקיעת יום שבת, מעוגל ל-15 דק' הקרובות.
   - ערבית מוצ"ש = 8 דק' לפני צאת שבת (המוצג למעלה). */
function roundToNearestMinutes(date, minutes) {
  const ms = minutes * 60000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

function isIsraelDST(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NETIVOT.timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
  return offset.includes("+3");
}

// מוצא את יום שישי ושבת הקרובים (או של השבוע הנוכחי אם היום כבר שישי/שבת)
function getShabbatDates(reference) {
  const d = new Date(reference);
  d.setHours(12, 0, 0, 0); // צהריים כדי להימנע מבעיות שינוי שעון
  const dow = d.getDay(); // 0=ראשון ... 5=שישי, 6=שבת
  let friday;
  if (dow === 6) {
    friday = new Date(d);
    friday.setDate(d.getDate() - 1);
  } else {
    const daysUntilFriday = (5 - dow + 7) % 7;
    friday = new Date(d);
    friday.setDate(d.getDate() + daysUntilFriday);
  }
  const saturday = new Date(friday);
  saturday.setDate(friday.getDate() + 1);
  return { friday, saturday };
}

function calcShabbatTimes(reference = new Date()) {
  const { friday, saturday } = getShabbatDates(reference);
  const fridaySun = calcSunTimes(
    friday.getFullYear(), friday.getMonth() + 1, friday.getDate(),
    NETIVOT.lat, NETIVOT.lon
  );
  const saturdaySun = calcSunTimes(
    saturday.getFullYear(), saturday.getMonth() + 1, saturday.getDate(),
    NETIVOT.lat, NETIVOT.lon
  );
  if (!fridaySun.sunset || !saturdaySun.sunset) return null;

  const candleLighting = new Date(fridaySun.sunset.getTime() - 10 * 60000);
  const shabbatEnds = new Date(saturdaySun.sunset.getTime() + 45 * 60000);
  const minchaErev = roundToNearestMinutes(
    new Date(fridaySun.sunset.getTime() - 8 * 60000), 5
  );
  const shirHashirim = new Date(minchaErev.getTime() - 10 * 60000);
  const shacharit = isIsraelDST(saturday) ? "8:30" : "8:00";
  const minchaShabbat = roundToNearestMinutes(
    new Date(saturdaySun.sunset.getTime() - 60 * 60000), 15
  );
  const limudHorim = new Date(minchaShabbat.getTime() - 45 * 60000);
  const arvitMotzash = new Date(shabbatEnds.getTime() - 8 * 60000);

  return {
    candleLighting, shabbatEnds, shirHashirim, minchaErev,
    shacharit, limudHorim, minchaShabbat, arvitMotzash,
  };
}

function renderShabbatTimes() {
  const el = document.getElementById("candle-time");
  if (!el) return; // לא בעמוד שבת
  const t = calcShabbatTimes();
  if (!t) return;
  document.getElementById("candle-time").textContent = formatTime(t.candleLighting);
  document.getElementById("shabbat-end-time").textContent = formatTime(t.shabbatEnds);
  document.getElementById("shir-hashirim-time").textContent = formatTime(t.shirHashirim);
  document.getElementById("mincha-erev-time").textContent = formatTime(t.minchaErev);
  document.getElementById("shacharit-time").textContent = t.shacharit;
  document.getElementById("limud-horim-time").textContent = formatTime(t.limudHorim);
  document.getElementById("mincha-shabbat-time").textContent = formatTime(t.minchaShabbat);
  document.getElementById("arvit-motzash-time").textContent = formatTime(t.arvitMotzash);
}

document.addEventListener("DOMContentLoaded", () => {
  renderTodayCard();
  renderMonthTable();
  initMonthNav();
  renderShabbatTimes();
  // בעמוד לוח הזמנים החודשי - למקד את הגלילה על שורת "היום" בטעינה הראשונית
  const todayRow = document.querySelector("#zman-table-body tr.today");
  if (todayRow) {
    todayRow.scrollIntoView({ block: "center" });
  }
});
