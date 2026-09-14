/* ===== לוח צום גדליה - נערך מעמוד הניהול (admin.html) =====
   מוצג בדף Gedalia.html. שורה בלי time (מחרוזת ריקה) מוצגת כשורת הערה בלי שעה.
   שם המשתנה SCHEDULE_DATA (לא GEDALIA_DATA) הוא מכוון - כל "דף לוח זמנים" (ראו site-config.js)
   טוען את קובץ הנתונים שלו לבד, כך שאין התנגשות בשימוש בשם גנרי אחד לכל דפי הלוח. */
const SCHEDULE_DATA = {
  title: "צום גדליה",
  rows: [
    { label: "מנחה", time: "18:25", hidden: false },
    { label: "ערבית", time: "19:10", hidden: false },
    { label: "לא תתקיים תפילת ערבית ב-21:00", time: "", hidden: false },
  ],
};
