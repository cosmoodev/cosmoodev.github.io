(() => {
  "use strict";

  const spaceBg = document.getElementById("space-bg");
  if (spaceBg) {
    const layer = document.createElement("div");
    layer.className = "stars";
    spaceBg.appendChild(layer);
    const count = Math.min(240, Math.floor(window.innerWidth / 6));
    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
      star.className = "star";
      const size = Math.random() * 2.5 + 1;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      if (size > 2.6) {
        star.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.9)";
      }
      star.style.setProperty("--dur", (Math.random() * 3 + 2) + "s");
      star.style.animationDelay = Math.random() * 4 + "s";
      layer.appendChild(star);
    }
  }

  const header = document.getElementById("site-header");
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = [...document.querySelectorAll("main section[id]")];

  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 8);

    const pos = window.scrollY + window.innerHeight / 3;
    let current = "";
    for (const section of sections) {
      if (section.offsetTop <= pos) current = section.id;
    }
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const themeBtn = document.getElementById("theme-toggle");

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }

  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "light" : "dark");
  });

  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  function setMenu(open) {
    mobileMenu.classList.toggle("open", open);
    menuBtn.textContent = open ? "Закрыть" : "Меню";
    menuBtn.setAttribute("aria-expanded", String(open));
  }

  menuBtn.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
  mobileMenu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => setMenu(false))
  );

  document.querySelectorAll(".reveal").forEach((el) => {
    const parent = el.parentElement;
    if (!parent) return;
    const siblings = parent.querySelectorAll(".reveal");
    const idx = Array.prototype.indexOf.call(siblings, el);
    el.style.transitionDelay = `${Math.min(idx * 0.07, 0.6)}s`;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  requestAnimationFrame(() => {
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("visible");
        observer.unobserve(el);
      }
    });
  });
})();
