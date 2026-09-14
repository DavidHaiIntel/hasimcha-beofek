/* ===== הגדרות אתר - אילו "דפים נוספים" (זמניים/עונתיים) פעילים כרגע =====
   הדפים הקבועים (בית / זמני תפילה / שבת קודש) תמיד מוצגים ולא ניתנים לכיבוי.
   דפים נוספים (כמו לימוד סוכות) אפשר להדליק/לכבות מעמוד הניהול (admin.html) -
   כשדף כבוי, הקישור אליו נעלם מהניווט בכל האתר, והדף עצמו מציג הודעה במקום התוכן.
   דף עם schedule:true הוא "דף לוח זמנים" (כותרת + שורות שעות) - ניתן לעריכה מלאה מהניהול,
   והתוכן שלו נשמר בקובץ JS נפרד (dataFile). */
const SITE_CONFIG = {
  extraPages: [
    { key: "sukkot", label: "לימוד סוכות", url: "sukkot.html", enabled: true },
    { key: "rosh-hashana", label: "ראש השנה", url: "rosh-hashana.html", enabled: false },
    { key: "Gedalia", label: "צום גדליה", url: "Gedalia.html", enabled: true, schedule: true, dataFile: "js/gedalia-data.js" },
  ],
};
