/* ===== זמני תפילות שבת - נערך מעמוד הניהול (admin.html) =====
   כל זמן מחושב אוטומטית כל שבוע (ראו calcShabbatTimes ב-js/zmanim.js) אלא אם יש override
   (שדה שעה לא ריק) - אז הוא נדרס לשעה הקבועה שהוזנה. שורות עם key מקושרות לחישוב האוטומטי;
   שורות בלי key (שנוספו ידנית) מציגות רק את ה-override. */
const SHABBAT_TIMES_CONFIG = {
  candleLighting: { override: "" },
  shabbatEnds: { override: "" },
  rows: [
    { key: "shirHashirim", label: "שיר השירים", override: "", hidden: false },
    { key: "minchaErev", label: "תפילת מנחה, קבלת שבת וערבית", override: "", hidden: false },
    { key: "shacharit", label: "שחרית של שבת", override: "", hidden: false },
    { key: "limudHorim", label: "לימוד הורים וילדים", override: "", hidden: false },
    { key: "minchaShabbat", label: "מנחה של שבת", override: "", hidden: false },
    { key: "arvitMotzash", label: "ערבית של מוצ\"ש", override: "", hidden: false },
    { key: "", label: "שיעור של הרב דוד אסולין לשבת תשובה", override: "10:30", hidden: false },
  ],
};
