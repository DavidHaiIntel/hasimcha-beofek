/* ===== Service Worker - פתרון בעיית מטמון (cache) בטלפונים =====
   הבעיה: ב-GitHub Pages אי אפשר לשלוט בכותרות ה-HTTP cache, ודפדפנים (בעיקר בניידים)
   שומרים את ה-HTML עצמו במטמון. לכן גם אחרי שמעלים גרסה חדשה של קבצי ה-JS (עם ?v=N),
   הדפדפן טוען HTML ישן שמצביע על גרסאות ישנות - והמשתמש רואה שעות/תוכן לא מעודכנים.

   הפתרון: אסטרטגיית "רשת-תחילה" (network-first) שעוקפת את מטמון ה-HTTP (cache: "reload").
   כשיש אינטרנט - תמיד נטענת הגרסה העדכנית ביותר מהשרת. כשאין אינטרנט - נופלים למטמון
   המקומי כגיבוי בלבד (כדי שהאתר עדיין ייפתח). כך כולם רואים תמיד את העדכון האחרון.

   עדכון ה-Service Worker עצמו: skipWaiting + clients.claim מחילים גרסה חדשה מיד,
   בלי צורך לסגור את כל הכרטיסיות. */
const CACHE = "ohev-cache-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // בקשות לשרתים חיצוניים (GitHub API, גופנים, QR, Hebcal) - משאירים לדפדפן לטפל כרגיל
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // תמונות (לוגו וכו') לא משתנות - מגישים מהמטמון תחילה כדי לא להוריד אותן שוב ושוב בכל טעינה.
      // אם צריך להחליף תמונה בעתיד - לעדכן את שם ה-CACHE (למשל v3) וההורדה תתבצע מחדש פעם אחת.
      if (req.destination === "image") {
        const cachedImg = await cache.match(req);
        if (cachedImg) return cachedImg;
        const freshImg = await fetch(req);
        cache.put(req, freshImg.clone());
        return freshImg;
      }
      try {
        // רשת-תחילה: מושכים תמיד טרי מהשרת, תוך עקיפת מטמון ה-HTTP (reload)
        const fresh = await fetch(req, { cache: "reload" });
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        // אין רשת - נופלים לגיבוי מהמטמון המקומי כדי שהאתר עדיין ייפתח
        const cached = await cache.match(req);
        if (cached) return cached;
        throw err;
      }
    })()
  );
});
