(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.getElementById("site-header");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (menuToggle && mobileMenu) {
    const closeMenu = (returnFocus = false) => {
      mobileMenu.hidden = true;
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "Меню";
      if (returnFocus) menuToggle.focus();
    };

    menuToggle.addEventListener("click", () => {
      const open = mobileMenu.hidden;
      mobileMenu.hidden = !open;
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.textContent = open ? "Закрыть" : "Меню";
      if (open) {
        const firstLink = mobileMenu.querySelector("a");
        if (firstLink) firstLink.focus();
      }
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !mobileMenu.hidden) closeMenu(true);
    });

    document.addEventListener("click", (event) => {
      if (mobileMenu.hidden) return;
      if (mobileMenu.contains(event.target) || menuToggle.contains(event.target)) return;
      closeMenu();
    });
  }

  const sectionIds = ["about", "menu", "gallery", "booking"];
  const navLinks = [...document.querySelectorAll(".desktop-nav a")];

  if (navLinks.length) {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const setCurrent = (id) => {
      navLinks.forEach((link) => {
        const current = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("is-current", current);
        if (current) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  const filterButtons = [...document.querySelectorAll(".filter")];
  const menuItems = [...document.querySelectorAll(".menu-item")];

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      menuItems.forEach((item) => {
        item.hidden = filter !== "all" && item.dataset.category !== filter;
      });
    });
  });

  const form = document.getElementById("booking-form");
  const status = document.getElementById("form-status");

  if (form) {
    const name = document.getElementById("name");
    const phone = document.getElementById("phone");
    const date = document.getElementById("date");
    const time = document.getElementById("time");
    const guests = document.getElementById("guests");
    const fields = [name, phone, date, time, guests];

    const today = new Date();
    const isoDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    date.min = isoDate;

    const setError = (field, message) => {
      const target = form.querySelector(`[data-error-for="${field.id}"]`);
      if (target) target.textContent = message;
      field.setAttribute("aria-invalid", message ? "true" : "false");
    };

    const clearStatus = () => {
      status.textContent = "";
      status.classList.remove("is-success");
    };

    fields.forEach((field) => {
      field.addEventListener("input", () => {
        setError(field, "");
        clearStatus();
      });
      field.addEventListener("change", () => {
        setError(field, "");
        clearStatus();
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearStatus();

      let valid = true;

      if (name.value.trim().length < 2) {
        setError(name, "Напишите имя");
        valid = false;
      } else setError(name, "");

      const digits = phone.value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        setError(phone, "Введите телефон в формате +7 900 000-00-00");
        valid = false;
      } else setError(phone, "");

      if (!date.value) {
        setError(date, "Выберите дату");
        valid = false;
      } else if (date.value < isoDate) {
        setError(date, "Дата уже прошла");
        valid = false;
      } else setError(date, "");

      if (!time.value) {
        setError(time, "Выберите время");
        valid = false;
      } else if (time.value < "08:00" || time.value > "21:30") {
        setError(time, "Мы работаем с 08:00 до 22:00");
        valid = false;
      } else setError(time, "");

      if (!guests.value) {
        setError(guests, "Укажите количество гостей");
        valid = false;
      } else setError(guests, "");

      if (!valid) {
        const firstInvalid = fields.find((field) => field.getAttribute("aria-invalid") === "true");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      status.textContent = "Спасибо. Это демо-форма: данные никуда не отправляются.";
      status.classList.add("is-success");
      form.reset();
      fields.forEach((field) => setError(field, ""));
    });
  }

  if (!reduceMotion) {
    const targets = [
      ...document.querySelectorAll(
        ".hero-copy > *, .about-grid > *, .menu-head > *, .menu-item, .art-card, .booking-copy > *, .booking-form"
      ),
    ];

    targets.forEach((target, index) => {
      target.classList.add("reveal");
      target.style.transitionDelay = `${Math.min(index * 0.035, 0.35)}s`;
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );

    targets.forEach((target) => revealObserver.observe(target));

    requestAnimationFrame(() => {
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          target.classList.add("is-visible");
          revealObserver.unobserve(target);
        }
      });
    });
  }
})();
