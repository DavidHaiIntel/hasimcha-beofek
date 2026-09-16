/* ===== לוח זמני יום הכיפורים - נערך מעמוד הניהול (admin.html) =====
   מוצג בדף kippur.html. "ערב יוה"כ" הוא טור בודד (יום אחד), ו-columns הם שני המניינים
   ביום הכיפורים עצמו (למשל אשכנזי/עדות המזרח) - כל אחד ברשימה נפרדת.
   הערה חשובה: אין מיון אוטומטי לפי שעה בטורי יוה"כ - כי הם חוצים יממה (ליל כל נדרי ואז
   יום המחרת), ומיון גולמי לפי שעון-יום היה מערבב את הסדר (ראו התיקון המקביל בזמני שבת).
   הסדר בתצוגה הוא בדיוק סדר השורות כפי שמוגדר כאן / כפי שנערך בניהול (עם כפתורי ↑/↓). */
const KIPPUR_DATA = {
  title: "זמני תפילות ליום הכיפורים תשפ\"ז",
  fastStart: "18:18",
  fastEnd: "19:16",
  erevDay: {
    label: "ראשון, ט' תשרי",
    rows: [
      { label: "סליחות ע\"מ", time: "5:15", hidden: false },
      { label: "סליחות אשכנזי", time: "6:00", hidden: false },
      { label: "שחרית ותיקין", time: "6:14", hidden: false },
      { label: "מנחה", time: "13:00", hidden: false },
    ],
  },
  columns: [
    {
      label: "מניין אשכנזי (אולם תפילה)",
      rows: [
        { label: "תפילת זכה", time: "18:25", hidden: false },
        { label: "כל נדרי", time: "18:40", hidden: false },
        { label: "שחרית", time: "7:30", hidden: false },
        { label: "יזכור", time: "10:00", hidden: false },
        { label: "מנחה", time: "16:30", hidden: false },
        { label: "נעילה (משוער)", time: "17:50", hidden: false },
      ],
    },
    {
      label: "מניין עדות המזרח (חדר לימוד)",
      rows: [
        { label: "לך אלי תשוקתי", time: "18:30", hidden: false },
        { label: "שחרית ותיקין (קרבנות)", time: "5:20", hidden: false },
        { label: "מנחה", time: "16:00", hidden: false },
        { label: "נעילה", time: "18:00", hidden: false },
      ],
    },
  ],
  footerLine1: "תקיעת שופר ברוב עם",
  footerLine2: "ערבית וברכת הלבנה",
  closing: "גמר חתימה טובה",
};
