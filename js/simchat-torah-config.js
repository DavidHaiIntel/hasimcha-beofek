/* ===== שינויים בשחרית של שמחת תורה - נערך מעמוד הניהול (admin.html) =====
   מוצג בדף הייעודי (simchat-torah.html) ובלוח החלופי בתוך shabbat.html (כשהשבת הקרובה
   היא שמחת תורה - כ"ב תשרי). שאר זמני השבת (כניסה/יציאה/מנחה ערב/מנחה שבת/ערבית) זהים
   לשבת רגילה ונלקחים אוטומטית מ-js/shabbat-times-config.js - כאן עורכים רק את בלוק השחרית. */
const SIMCHAT_TORAH_DATA = {
  title: "שמחת תורה תשפ\"ז",
  shacharitRows: [
    { label: "תפילת שחרית", time: "8:00", hidden: false },
    { label: "עליות לתורה", time: "", hidden: false },
    { label: "הקפות", time: "", hidden: false },
    { label: "קידוש (משוער)", time: "9:30", hidden: false },
    { label: "הקפות, חתנים, יזכור", time: "", hidden: false },
    { label: "תיקון הגשם ומוסף", time: "11:30", hidden: false },
  ],
};
