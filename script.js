(() => {
  "use strict";

  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const menuButton = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const header = document.getElementById("site-header");
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const sections = [...document.querySelectorAll("main section[id]")];

  function setTheme(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      void error;
    }
    if (themeToggle) {
      const next = theme === "dark" ? "светлую" : "тёмную";
      themeToggle.setAttribute("aria-label", `Включить ${next} тему`);
      themeToggle.title = `Включить ${next} тему`;
    }
  }

  if (themeToggle) {
    setTheme(root.dataset.theme === "light" ? "light" : "dark");
    themeToggle.addEventListener("click", () => {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  function buildStars() {
    const layer = document.querySelector(".stars");
    if (!layer) return;
    const count = Math.min(90, Math.max(28, Math.floor(window.innerWidth / 16)));
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement("span");
      const size = Math.random() * 1.4 + 0.7;
      star.className = "star";
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty("--dur", `${2.8 + Math.random() * 4.2}s`);
      star.style.animationDelay = `${Math.random() * 5}s`;
      fragment.appendChild(star);
    }
    layer.appendChild(fragment);
  }

  buildStars();

  let menuOpen = false;

  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuOpen = open;
    mobileMenu.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    const label = menuButton.querySelector(".menu-label");
    if (label) label.textContent = open ? "Закрыть" : "Меню";
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", () => setMenu(!menuOpen));
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenu(false);
        menuButton.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (menuOpen && header && !header.contains(event.target)) {
        setMenu(false);
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) setMenu(false);
    });
  }

  function updateActiveLink() {
    if (!sections.length) return;
    const marker = window.scrollY + 150;
    let activeId = "";
    sections.forEach((section) => {
      if (section.offsetTop <= marker) activeId = section.id;
    });
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (atBottom) activeId = sections[sections.length - 1].id;
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    updateActiveLink();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.querySelectorAll(".reveal").forEach((element) => {
    const parent = element.parentElement;
    if (!parent) return;
    const siblings = [...parent.querySelectorAll(":scope > .reveal")];
    const index = siblings.indexOf(element);
    const delay = Math.min(Math.max(index, 0) * 0.06, 0.24);
    element.style.setProperty("--delay", `${delay}s`);
  });

  const revealItems = [...document.querySelectorAll(".reveal")];

  function revealInView() {
    revealItems.forEach((item) => {
      if (item.classList.contains("visible")) return;
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) {
        item.classList.add("visible");
      }
    });
  }

  window.addEventListener("scroll", revealInView, { passive: true });
  revealInView();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    requestAnimationFrame(() => {
      revealItems.forEach((item) => {
        if (item.classList.contains("visible")) observer.unobserve(item);
      });
    });
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }
})();
