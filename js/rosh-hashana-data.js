/* ===== לוח זמני ראש השנה - נערך מעמוד הניהול (admin.html) =====
   מוצג הן בדף ראש השנה (rosh-hashana.html) והן בדף שבת (shabbat.html, כשהשבת הקרובה היא א' תשרי).
   כל יום הוא עמודה בפוסטר. שורה בלי time (מחרוזת ריקה) מוצגת כשורת הערה בלי שעה (כמו "מוסף"). */
const ROSH_HASHANA_DATA = {
  title: "ראש השנה תשפ\"ז",
  days: [
    {
      label: "שישי, כ\"ט אלול",
      rows: [
        { label: "כניסת החג", time: "18:34", hidden: false },
        { label: "תפילת מנחה", time: "18:40", hidden: false },
        { label: "קבלת שבת וערבית", time: "", hidden: false },
      ],
    },
    {
      label: "שבת, א' תשרי",
      rows: [
        { label: "שחרית בנץ (עדות המזרח)", time: "5:30", hidden: false },
        { label: "שחרית (אשכנזי)", time: "7:30", hidden: false },
        { label: "קידוש (משוער)", time: "9:30", hidden: false },
        { label: "מוסף", time: "", hidden: false },
        { label: "תהילים לילדים", time: "16:30", hidden: false },
        { label: "לימוד הורים וילדים", time: "17:00", hidden: false },
        { label: "תפילת מנחה", time: "17:30", hidden: false },
        { label: "תשליך בכיכר האבנים (לנוהגים בשבת)", time: "", hidden: false },
        { label: "תפילת ערבית", time: "19:10", hidden: false },
      ],
    },
    {
      label: "ראשון, ב' תשרי",
      rows: [
        { label: "שחרית בנץ (עדות המזרח)", time: "5:30", hidden: false },
        { label: "תקיעות משוער", time: "7:25", hidden: false },
        { label: "שחרית (אשכנזי)", time: "7:30", hidden: false },
        { label: "קידוש (משוער)", time: "9:30", hidden: false },
        { label: "תקיעות שופר", time: "9:45", hidden: false },
        { label: "מוסף", time: "", hidden: false },
        { label: "תהילים לילדים", time: "16:30", hidden: false },
        { label: "לימוד הורים וילדים", time: "17:00", hidden: false },
        { label: "תקיעות לנשים", time: "17:15", hidden: false },
        { label: "תפילת מנחה", time: "17:30", hidden: false },
        { label: "תשליך בכיכר האבנים", time: "", hidden: false },
        { label: "תפילת ערבית של מוצאי החג", time: "19:20", hidden: false },
      ],
    },
  ],
};
