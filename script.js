(() => {
  "use strict";

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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();
