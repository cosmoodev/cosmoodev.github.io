(() => {
  "use strict";

  /* ===== 1. Генерация звёздного фона ===== */
  const starsWrap = document.getElementById("stars");
  const STAR_COUNT = window.innerWidth < 768 ? 60 : 120;

  function createStars() {
    starsWrap.innerHTML = "";
    for (let i = 0; i < STAR_COUNT; i++) {
      const star = document.createElement("span");
      const size = Math.random() * 2 + 1;
      star.className = "star";
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      star.style.animationDuration = `${3 + Math.random() * 5}s`;
      starsWrap.appendChild(star);
    }
  }
  createStars();
  window.addEventListener("resize", () => {
    const count = window.innerWidth < 768 ? 60 : 120;
    if (count !== STAR_COUNT) createStars();
  });

  /* ===== 2. Сжатие шапки при скролле + активная ссылка ===== */
  const header = document.getElementById("site-header");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = [...document.querySelectorAll("main section[id]")];

  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 24);

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

  /* ===== 3. Мобильное меню ===== */
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const iconBurger = document.getElementById("icon-burger");
  const iconClose = document.getElementById("icon-close");

  function toggleMenu(force) {
    const open = force !== undefined ? force : mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden", !open);
    iconBurger.classList.toggle("hidden", open);
    iconClose.classList.toggle("hidden", !open);
    menuBtn.setAttribute("aria-expanded", String(open));
  }

  menuBtn.addEventListener("click", () => toggleMenu());
  mobileMenu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => toggleMenu(false))
  );

  /* ===== 4. Reveal-анимации при скролле ===== */
  const revealEls = document.querySelectorAll(".reveal");
  const skillBars = document.querySelectorAll(".skill-bar");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");

          entry.target.querySelectorAll(".skill-bar").forEach((bar) => {
            bar.style.width = `${bar.dataset.width}%`;
          });

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealEls.forEach((el) => observer.observe(el));
  skillBars.forEach((bar) => {
    const section = bar.closest("section");
    if (section) observer.observe(section);
  });

  /* ===== 5. Печатающийся текст в Hero ===== */
  const typedEl = document.getElementById("typed");
  const phrases = ["современные интерфейсы.", "интерактивные впечатления.", "продукты, которые любят."];
  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function type() {
    const current = phrases[phraseIdx];

    if (!deleting) {
      charIdx++;
      typedEl.textContent = current.slice(0, charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(type, 2000);
        return;
      }
    } else {
      charIdx--;
      typedEl.textContent = current.slice(0, charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
      }
    }
    setTimeout(type, deleting ? 40 : 80);
  }
  type();
})();
