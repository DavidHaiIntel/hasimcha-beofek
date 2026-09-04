// תפריט נייד ושנה נוכחית בפוטר
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // הסתרת קישורים (בניווט וגם כרטיסי "עוד באתר") לדפים נוספים שכובו מעמוד הניהול
  if (typeof SITE_CONFIG !== "undefined") {
    const currentPage = location.pathname.split("/").pop();
    SITE_CONFIG.extraPages.forEach((p) => {
      if (!p.enabled) {
        document.querySelectorAll(`a[href="${p.url}"]`).forEach((a) => {
          const card = a.closest(".info-card");
          (card || a).remove();
        });
        if (currentPage === p.url) {
          const main = document.querySelector("main");
          if (main) {
            main.innerHTML = `
              <section class="section">
                <div class="container" style="text-align:center; padding: 60px 20px;">
                  <h3>הפעילות "${p.label}" אינה פעילה כרגע</h3>
                  <p class="subtitle"><a href="index.html">חזרה לדף הבית</a></p>
                </div>
              </section>`;
          }
        }
      }
    });
  }

  // כפתור שיתוף בוואטסאפ צף (בכל עמוד ציבורי, לא בעמוד הניהול)
  if (!location.pathname.includes("admin.html")) {
    const text = encodeURIComponent(document.title + " - " + location.href);
    const link = document.createElement("a");
    link.href = `https://wa.me/?text=${text}`;
    link.target = "_blank";
    link.rel = "noopener";
    link.className = "whatsapp-share-btn";
    link.setAttribute("aria-label", "שתפו בוואטסאפ");
    link.title = "שתפו בוואטסאפ";
    link.innerHTML = `
      <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.22.6 4.3 1.65 6.09L4 29l8.06-1.6a12.9 12.9 0 0 0 3.96.63c6.62 0 12.02-5.4 12.02-12.02C28.04 8.4 22.64 3 16.02 3Zm0 21.9c-1.9 0-3.7-.5-5.24-1.44l-.38-.22-4.15.82.84-4.06-.25-.4a9.85 9.85 0 0 1-1.5-5.58c0-5.43 4.42-9.85 9.86-9.85 5.43 0 9.85 4.42 9.85 9.85 0 5.43-4.42 9.88-9.86 9.88Zm5.4-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"/>
      </svg>
    `;
    document.body.appendChild(link);
  }
});
