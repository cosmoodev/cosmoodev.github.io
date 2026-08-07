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

  /* ===== 2. Космический след за курсором (мягкое расплывание) ===== */
  const trailCanvas = document.getElementById("trail");

  if (trailCanvas) {
    const ctx = trailCanvas.getContext("2d");
    let dots = [];
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    function resizeTrail() {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
    }
    resizeTrail();
    window.addEventListener("resize", resizeTrail);

    ctx.globalCompositeOperation = "lighter";

    window.addEventListener("pointermove", (e) => {
      const now = performance.now();
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);

      if (dist > 1 && now - lastTime > 16) {
        const n = Math.max(1, Math.min(3, Math.round(dist / 18)));
        for (let i = 0; i < n; i++) {
          const x = lastX + (dx * i) / n;
          const y = lastY + (dy * i) / n;
          dots.push({
            x,
            y,
            r: 16 + Math.random() * 22,
            life: 1,
            decay: 0.018 + Math.random() * 0.02,
            hue: 232 + Math.random() * 38
          });
        }
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
      }
      if (dots.length > 220) {
        dots.splice(0, dots.length - 220);
      }
    });

    function drawTrail() {
      ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      dots = dots.filter((d) => d.life > 0.02);

      for (const d of dots) {
        d.life -= d.decay;
        d.r += 0.7;

        const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        grad.addColorStop(0, `hsla(${d.hue}, 95%, 78%, ${0.32 * d.life})`);
        grad.addColorStop(0.4, `hsla(${d.hue}, 90%, 65%, ${0.16 * d.life})`);
        grad.addColorStop(1, `hsla(${d.hue}, 90%, 60%, 0)`);

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      requestAnimationFrame(drawTrail);
    }
    drawTrail();
  }

  /* ===== 3. Сжатие шапки при скролле + активная ссылка ===== */
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

  /* ===== 4. Мобильное меню ===== */
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

  /* ===== 5. Reveal-анимации при скролле ===== */
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

  /* ===== 6. Печатающийся текст в Hero ===== */
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
