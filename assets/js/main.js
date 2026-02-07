
/* Akash Portfolio (Pro)
   - Mobile nav toggle
   - Scroll reveal animation
*/
(function () {
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when clicking a link (mobile)
    siteNav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        if (siteNav.classList.contains("open")) {
          siteNav.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      const clickedInside = siteNav.contains(target) || navToggle.contains(target);
      if (!clickedInside && siteNav.classList.contains("open")) {
        siteNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Scroll reveal
  const items = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  } else {
    // Fallback
    items.forEach((el) => el.classList.add("in"));
  }
})();
