"use strict";

(function () {
  // --- Configuration & State ---
  const menuToggle = document.getElementById("menuToggle");
  const primaryNav = document.getElementById("primaryNav");
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
  const sectionIndicatorLabel = document.getElementById(
    "sectionIndicatorLabel",
  );
  const scrollProgress = document.getElementById("scrollProgress");
  const navActivePill = document.getElementById("navActivePill");
  const yearEl = document.getElementById("year");
  const projectsGrid = document.getElementById("projectsGrid");
  const filterContainer = document.getElementById("projectFilters");
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const cursorDot = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");
  const codeRain = document.getElementById("codeRain");

  // Store scroll/resize tasks to run in a unified loop
  const scrollTasks = [];

  const MOBILE_NAV_BREAKPOINT = 1080;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // --- Utilities ---
  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // Centralized Scroll Manager using requestAnimationFrame
  function initScrollManager() {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          scrollTasks.forEach((task) => task());
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial run
    requestAnimationFrame(() => {
      scrollTasks.forEach((task) => task());
    });
  }

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function escapeHtml(input) {
    return String(input).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
  }

  // --- Navigation UI ---
  function closeNavMenu() {
    if (!menuToggle || !primaryNav) return;

    primaryNav.classList.remove("open");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    document.body.classList.remove("nav-open");
  }

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", function () {
      const isOpen = primaryNav.classList.toggle("open");
      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu",
      );
      document.body.classList.toggle("nav-open", isOpen);
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", closeNavMenu);
    });

    primaryNav.addEventListener("click", function (event) {
      if (event.target === primaryNav) {
        closeNavMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > MOBILE_NAV_BREAKPOINT) {
        closeNavMenu();
      }

      if (navActivePill) {
        const activeLink = primaryNav.querySelector("a.active");
        if (activeLink) {
          const linkRect = activeLink.getBoundingClientRect();
          const navRect = activeLink.parentElement.getBoundingClientRect();
          navActivePill.style.left = linkRect.left - navRect.left + "px";
          navActivePill.style.width = linkRect.width + "px";
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeNavMenu();
      }
    });
  }

  // --- Interactive Components ---
  function startHeadingTyping(heading) {
    if (!heading || heading.dataset.typingStarted === "true") return;

    const base = heading.querySelector(".typing-base");
    const overlay = heading.querySelector(".typing-overlay");
    const rawText =
      heading.dataset.text ||
      (base ? base.textContent : "") ||
      heading.textContent ||
      "";
    const variants = String(heading.dataset.texts || "")
      .split("|")
      .map((t) => t.trim())
      .filter(Boolean);

    const fullText = String(rawText).trim();
    const textList = variants.length ? variants : fullText ? [fullText] : [];
    if (!textList.length) {
      heading.dataset.typingStarted = "true";
      return;
    }

    heading.dataset.text = textList[0];
    heading.dataset.typingStarted = "true";

    if (base) base.textContent = textList[0];

    const targetOverlay =
      overlay ||
      (function () {
        const span = document.createElement("span");
        span.className = "typing-overlay";
        span.setAttribute("aria-hidden", "true");
        heading.appendChild(span);
        return span;
      })();

    if (prefersReducedMotion) {
      targetOverlay.textContent = textList[0];
      return;
    }

    const speed = 60;
    const pause = 3000;
    const initialDelay = 600;
    let phraseIndex = 0;

    function runTyping() {
      const phrase = textList[phraseIndex];
      targetOverlay.textContent = "";
      targetOverlay.classList.add("typing");

      let index = 0;
      const intervalId = window.setInterval(function () {
        index += 1;
        targetOverlay.textContent = phrase.slice(0, index);

        if (index >= phrase.length) {
          window.clearInterval(intervalId);
          targetOverlay.classList.remove("typing");
          phraseIndex = (phraseIndex + 1) % textList.length;
          window.setTimeout(runTyping, pause);
        }
      }, speed);
    }

    window.setTimeout(runTyping, initialDelay);
  }

  // --- Reveal System ---
  function applyRevealState(element) {
    element.classList.add("in-view");
    const animationName = String(element.dataset.animate || "").trim();

    if (!animationName) return;
    element.classList.add("animate__animated", animationName);

    const animationDuration = String(
      element.dataset.animateDuration || "",
    ).trim();
    const animationDelay = String(element.dataset.animateDelay || "").trim();

    if (animationDuration)
      element.style.setProperty("--animate-duration", animationDuration);
    if (animationDelay)
      element.style.setProperty("--animate-delay", animationDelay);

    element.querySelectorAll("[data-stagger]").forEach((item, idx) => {
      item.style.setProperty("--stagger-delay", idx * 110 + "ms");
      item.classList.add("stagger-in");
    });

    const textReveal = element.querySelector(
      ".hero-title[data-typing], .section-heading h2",
    );
    if (textReveal) startHeadingTyping(textReveal);
  }

  const revealObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                applyRevealState(entry.target);
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.16 },
        )
      : null;

  function registerRevealElements(root) {
    const elements = Array.from((root || document).querySelectorAll(".reveal"));

    if (!revealObserver) {
      elements.forEach(function (element) {
        applyRevealState(element);
      });
      return;
    }
    elements.forEach((el) => revealObserver.observe(el));
  }

  // --- Projects Logic ---
  function normalizeProjects(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return Object.values(value);
    return [];
  }

  function buildProjectCard(project, index) {
    const title = escapeHtml(project.title || "Project");
    const description = escapeHtml(project.description || "");
    const imageLight = escapeHtml(project.image || "");
    const imageDark = escapeHtml(project.imageDark || "");
    const gitHubLink = escapeHtml(project.gitHubLink || "#");
    const liveDemoLink =
      project.liveDemoLink && project.liveDemoLink !== "#"
        ? escapeHtml(project.liveDemoLink)
        : null;

    const tags = Array.isArray(project.tags) ? project.tags : [];
    const tagsHtml = tags
      .map((tag) => `<span>${escapeHtml(tag)}</span>`)
      .join("");

    const liveBtnHtml = liveDemoLink
      ? `<a class="link-btn" href="${liveDemoLink}" target="_blank" rel="noopener noreferrer">
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
            <span>Demo</span>
        </a>`
      : "";

    const delay = Math.min(index * 75, 320);
    const animateDelay = Math.min(index * 80, 420) + "ms";
    const animationName =
      index % 3 === 1
        ? "animate__fadeInLeft"
        : index % 3 === 2
          ? "animate__fadeInRight"
          : "animate__fadeInUp";
    const cardId = "project-" + escapeHtml(project.id || index + 1);

    const hasAltTheme = imageDark && imageDark !== imageLight;
    let imageHtml = `<img src="${imageLight}" class="${hasAltTheme ? "image-light" : ""}" alt="${title} preview" loading="lazy" decoding="async" width="${project.imageWidth || 1280}" height="${project.imageHeight || 720}">`;

    if (hasAltTheme) {
      imageHtml += `<img src="${imageDark}" class="image-dark" alt="${title} preview" loading="lazy" decoding="async" width="${project.imageWidth || 1280}" height="${project.imageHeight || 720}">`;
    }

    return `
            <article class="project-card reveal"
                     data-animate="${animationName}"
                     data-animate-duration="760ms"
                     data-animate-delay="${animateDelay}"
                     data-aos="fade-up"
                     style="transition-delay:${delay}ms"
                     id="${cardId}"
                     data-stagger>
                <div class="project-image">
                    ${imageHtml}
                </div>
                <div class="project-body">
                    <h3 class="project-title">${title}</h3>
                    <p class="project-description">${description}</p>
                    <div class="project-tags">${tagsHtml}</div>
                    <div class="project-links">
                        <a class="link-btn" href="${gitHubLink}" target="_blank" rel="noopener noreferrer">
                            <i class="fa-brands fa-github" aria-hidden="true"></i>
                            <span>GitHub</span>
                        </a>
                        ${liveBtnHtml}
                    </div>
                </div>
            </article>`;
  }

  function renderProjects(filterTag = "All") {
    if (!projectsGrid) return;

    let projectData = normalizeProjects(window.projects);

    if (filterTag !== "All") {
      projectData = projectData.filter((p) => p.tags.includes(filterTag));
    }

    if (!projectData || projectData.length === 0) {
      projectsGrid.innerHTML =
        '<p class="no-projects">Projects will appear here soon.</p>';
      return;
    }

    projectsGrid.innerHTML = projectData
      .map((p, i) => buildProjectCard(p, i))
      .join("");

    setupProjectFilters();

    // Handle Image loading/errors
    projectsGrid.querySelectorAll("img").forEach((imageEl) => {
      imageEl.addEventListener("error", () => {
        imageEl.style.display = "none";
        const wrap = imageEl.closest(".project-image");
        if (wrap) {
          const allImages = wrap.querySelectorAll("img");
          const hiddenImages = Array.from(allImages).filter(
            (img) => img.style.display === "none",
          );
          if (allImages.length === hiddenImages.length) {
            wrap.innerHTML =
              '<div class="missing-image">Preview unavailable</div>';
          }
        }
      });

      imageEl.addEventListener("load", () => {
        const wrap = imageEl.closest(".project-image");
        if (wrap) {
          wrap.classList.add("shimmer");
          setTimeout(() => wrap.classList.remove("shimmer"), 1300);
        }
      });
    });

    registerRevealElements(projectsGrid);
    if (typeof AOS !== "undefined") AOS.refresh();
  }

  function setupProjectFilters() {
    if (!filterContainer || filterContainer.dataset.initialized) return;

    const projectData = normalizeProjects(window.projects);
    const allTags = projectData.flatMap((p) => p.tags || []);
    const uniqueTags = ["All", ...new Set(allTags)];

    filterContainer.innerHTML = uniqueTags
      .map(
        (tag) =>
          `<button class="filter-btn ${tag === "All" ? "active" : ""}" data-filter="${tag}">${tag}</button>`,
      )
      .join("");

    filterContainer.addEventListener("click", function (e) {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      filterContainer
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProjects(btn.dataset.filter);
    });

    filterContainer.dataset.initialized = "true";
  }
  function setupScrollProgress() {
    if (!scrollProgress) {
      return;
    }

    function updateProgress() {
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio =
        documentHeight > 0 ? Math.min(window.scrollY / documentHeight, 1) : 0;

      scrollProgress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }

    scrollTasks.push(updateProgress);
  }

  function trackActiveSection() {
    const sections = Array.from(document.querySelectorAll("main section[id]"));
    if (!sections.length || !navLinks.length) return;

    const linkMap = new Map(
      navLinks.map((link) => [link.getAttribute("href") || "", link]),
    );

    const upBtn = document.getElementById("navUp");
    const downBtn = document.getElementById("navDown");

    function updateNavButtons(sectionId) {
      if (!upBtn || !downBtn) return;
      const currentIdx = sections.findIndex((s) => s.id === sectionId);

      // Hide UP if at first section
      if (currentIdx <= 0) upBtn.classList.add("hidden");
      else upBtn.classList.remove("hidden");

      // Hide DOWN if at last section
      if (currentIdx === sections.length - 1 || currentIdx === -1)
        downBtn.classList.add("hidden");
      else downBtn.classList.remove("hidden");
    }

    function setActiveSection(sectionId) {
      navLinks.forEach((l) => l.classList.remove("active"));
      const activeLink = linkMap.get("#" + sectionId);

      if (!activeLink) return;

      activeLink.classList.add("active");
      if (sectionIndicatorLabel) {
        const label = String(
          activeLink.dataset.label || activeLink.textContent || "",
        )
          .replace(/\s+/g, " ")
          .trim();
        sectionIndicatorLabel.textContent = label || "Section";
      }

      if (navActivePill) {
        const linkRect = activeLink.getBoundingClientRect();
        const navRect = activeLink.parentElement.getBoundingClientRect();
        navActivePill.style.left = linkRect.left - navRect.left + "px";
        navActivePill.style.width = linkRect.width + "px";
        navActivePill.style.opacity = "1";
      }

      updateNavButtons(sectionId);
    }

    const initialHash = String(window.location.hash || "").trim();
    if (initialHash && linkMap.has(initialHash)) {
      setActiveSection(initialHash.slice(1));
    } else {
      setActiveSection(sections[0].id);
    }

    if (!("IntersectionObserver" in window)) return;

    const sectionObserver = new IntersectionObserver(
      function (entries) {
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort(function (left, right) {
            return right.intersectionRatio - left.intersectionRatio;
          });

        if (!visibleEntries.length) {
          return;
        }

        setActiveSection(visibleEntries[0].target.id);
      },
      {
        rootMargin: "-36% 0px -48% 0px",
        threshold: [0.1, 0.25, 0.45, 0.65],
      },
    );

    sections.forEach((s) => sectionObserver.observe(s));
  }

  // --- Form & Theme ---
  function setupContactForm() {
    if (!contactForm || !formStatus) return;

    function setFormStatus(message, type) {
      formStatus.textContent = message;
      formStatus.classList.remove("form-status--error", "form-status--success");

      if (type === "error") {
        formStatus.classList.add("form-status--error");
      }

      if (type === "success") {
        formStatus.classList.add("form-status--success");
      }
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    function updateLabelWidths() {
      fields.forEach((field) => {
        const wrapper = field.closest(".field-wrap");
        const label = wrapper?.querySelector("label");
        if (label && wrapper) {
          const width = label.offsetWidth;
          wrapper.style.setProperty("--lw", width + "px");
        }
      });
    }

    function validateField(field) {
      const name = field.getAttribute("name");
      const value = field.value.trim();
      let isValid = true;

      if (!value) {
        isValid = false;
      } else if (name === "email" && !isValidEmail(value)) {
        isValid = false;
      } else if (name === "message" && value.length < 10) {
        isValid = false;
      }

      if (field.hasAttribute("required") || value.length > 0) {
        updateFieldUI(field, isValid);
      }
      return isValid;
    }

    function updateFieldUI(field, isValid) {
      if (!isValid) {
        field.classList.add("field-invalid");
        field.classList.remove("field-valid");
      } else {
        field.classList.remove("field-invalid");
        field.classList.add("field-valid");
      }
    }

    function createGlowField(field) {
      let wrapper = field.closest(".field-wrap");
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.className = "field-wrap";
        field.parentNode.insertBefore(wrapper, field);
        wrapper.appendChild(field);
      }

      const glow = document.createElement("span");
      glow.className = "field-glow";
      wrapper.appendChild(glow);

      function updateGlow(event) {
        const rect = wrapper.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        glow.style.setProperty("--focus-x", x.toFixed(2) + "%");
        glow.style.setProperty("--focus-y", y.toFixed(2) + "%");
      }

      field.addEventListener("focus", function () {
        glow.classList.add("active");
      });

      field.addEventListener("blur", function () {
        glow.classList.remove("active");
        validateField(field);
      });

      field.addEventListener("mousemove", updateGlow);
      field.addEventListener("focus", function (event) {
        updateGlow(event);
      });
    }

    const fields = Array.from(
      contactForm.querySelectorAll(
        'input[type="text"], input[type="email"], textarea',
      ),
    );
    fields.forEach((field) => {
      createGlowField(field);
      field.addEventListener("input", () => {
        if (field.classList.contains("field-invalid")) validateField(field);
      });
    });

    // Initialize dynamic notches after fonts are ready
    if (document.fonts) {
      document.fonts.ready.then(updateLabelWidths);
    } else {
      setTimeout(updateLabelWidths, 500);
    }

    window.addEventListener("resize", updateLabelWidths);

    contactForm.setAttribute("novalidate", "novalidate");

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      let isFormValid = true;
      fields.forEach((field) => {
        if (!validateField(field)) isFormValid = false;
      });

      if (!isFormValid) {
        setFormStatus("Please correct the errors before submitting.", "error");
        return;
      }

      const endpoint = String(
        contactForm.dataset.formspreeEndpoint || "",
      ).trim();

      if (!endpoint) {
        setFormStatus("Form configuration error. Missing endpoint.", "error");
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const submitBtnText = submitBtn ? submitBtn.querySelector("span") : null;
      const originalBtnText = submitBtnText
        ? submitBtnText.textContent
        : "Send Message";

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
      }

      if (submitBtnText) submitBtnText.textContent = "Sending...";
      setFormStatus("Sending message...", "success");

      const formData = new FormData(contactForm);
      fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      })
        .then((response) => {
          if (response.ok) {
            setFormStatus(
              "Message sent! I'll get back to you soon.",
              "success",
            );
            fields.forEach((f) => f.classList.remove("field-valid"));
            contactForm.reset();
          } else {
            setFormStatus(
              "Oops! Something went wrong. Please try again.",
              "error",
            );
          }
        })
        .catch(() => {
          setFormStatus(
            "Connection error. Please check your internet.",
            "error",
          );
        })
        .finally(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove("is-loading");
          }

          if (submitBtnText) submitBtnText.textContent = originalBtnText;
        });
    });
  }

  function setupThemeToggle() {
    const THEME_KEY = "portfolio-theme";
    const root = document.documentElement;

    function applyTheme(theme) {
      root.setAttribute("data-theme", theme);

      if (themeLabel) {
        themeLabel.textContent = theme === "light" ? "Dark" : "Light";
      }

      if (themeToggle) {
        themeToggle.setAttribute(
          "aria-pressed",
          theme === "light" ? "true" : "false",
        );
      }
    }

    function readSavedTheme() {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch (error) {
        return null;
      }
    }

    function saveTheme(theme) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (error) {
        // Ignore storage restrictions.
      }
    }

    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    const savedTheme = readSavedTheme();
    const initialTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : prefersLight
          ? "light"
          : "dark";

    applyTheme(initialTheme);

    if (!themeToggle) {
      return;
    }

    themeToggle.addEventListener("click", function (event) {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      if (!document.startViewTransition || prefersReducedMotion) {
        applyTheme(nextTheme);
        saveTheme(nextTheme);
        return;
      }

      // Get coordinates of the toggle or click to set as the circle center
      const rect = themeToggle.getBoundingClientRect();
      const x = event.clientX ?? rect.left + rect.width / 2;
      const y = event.clientY ?? rect.top + rect.height / 2;

      // Calculate the radius needed to cover the entire screen
      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      );

      root.style.setProperty("--transition-x", x + "px");
      root.style.setProperty("--transition-y", y + "px");
      root.style.setProperty("--transition-r", endRadius + "px");

      document.startViewTransition(function () {
        applyTheme(nextTheme);
        saveTheme(nextTheme);
      });
    });
  }

  // --- Counters & Visual Effects ---
  function setupOutcomeCounters() {
    const counters = Array.from(
      document.querySelectorAll(".outcome-value[data-count]"),
    );
    if (!counters.length) {
      return;
    }

    if (prefersReducedMotion) {
      counters.forEach(function (counter) {
        const target = Number(counter.dataset.count) || 0;
        const suffix = counter.dataset.suffix || "";
        counter.textContent = target + suffix;
      });
      return;
    }

    function animateCounter(counter) {
      const target = Number(counter.dataset.count) || 0;
      const suffix = counter.dataset.suffix || "";
      const duration = 1400;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const value = Math.round(target * progress);
        counter.textContent = value + suffix;
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);
    }

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            function (entries, obs) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  animateCounter(entry.target);
                  obs.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.6 },
          )
        : null;

    if (!observer) {
      counters.forEach(animateCounter);
      return;
    }

    counters.forEach((c) => observer.observe(c));
  }

  function setupCursorTracker() {
    if (!cursorDot || !cursorRing || !finePointer || prefersReducedMotion)
      return;

    const hoverSelector =
      "a, button, input, textarea, .project-card, .hero-avatar";
    let pointerX = -100,
      pointerY = -100;
    let ringX = -100,
      ringY = -100;

    document.body.classList.add("cursor-ready");

    function paintDot() {
      cursorDot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
    }

    function animateRing() {
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;

      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      window.requestAnimationFrame(animateRing);
    }

    window.addEventListener("mousemove", function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      paintDot();
    });

    window.addEventListener("mouseout", function (event) {
      if (event.relatedTarget || event.toElement) return;

      pointerX = -100;
      pointerY = -100;
      paintDot();
    });

    document.addEventListener("mouseover", function (event) {
      if (event.target.closest(hoverSelector)) {
        document.body.classList.add("cursor-hover");
      }
    });

    document.addEventListener("mouseout", function (event) {
      if (!event.target.closest(hoverSelector)) {
        return;
      }

      if (
        event.relatedTarget &&
        event.relatedTarget.closest &&
        event.relatedTarget.closest(hoverSelector)
      ) {
        return;
      }

      document.body.classList.remove("cursor-hover");
    });

    paintDot();
    animateRing();
  }

  function setupCodeRain() {
    if (!codeRain) {
      return;
    }

    function renderCodeRain() {
      codeRain.innerHTML = "";

      if (prefersReducedMotion) {
        return;
      }

      const viewportHeight = Math.max(window.innerHeight, 640);

      const snippets = [
        "const",
        "let",
        "async",
        "await",
        "return",
        "class",
        "=>",
        "{ }",
        "if ()",
        "else",
        "null",
        "true",
        "false",
        "public",
        "private",
        "C#",
        ".NET",
        "API",
        "JWT",
        "SQL",
        "SELECT",
        "JOIN",
        "MVC",
        "EF Core",
        "[HttpGet]",
        "[HttpPost]",
        "POST",
        "GET",
        "<div>",
        "0011010",
        "1011001",
        "0101010",
        "0011001",
        "0010110",
        "0010101",
        "</>",
        "<span>",
        "</span>",
        "function",
        "import",
        "export",
      ];
      const streamCount =
        window.innerWidth >= 1280
          ? 24
          : window.innerWidth >= 1000
            ? 18
            : window.innerWidth >= 760
              ? 14
              : 10;
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < streamCount; i += 1) {
        const stream = document.createElement("div");
        const lineCount = 11 + Math.floor(Math.random() * 8);
        const lines = [];

        for (let line = 0; line < lineCount; line += 1) {
          const token = snippets[Math.floor(Math.random() * snippets.length)];
          if (Math.random() < 0.28) {
            lines.push(
              '<span class="code-hot">' + escapeHtml(token) + "</span>",
            );
          } else {
            lines.push(escapeHtml(token));
          }
        }

        stream.className = "code-stream";
        stream.innerHTML = lines.join("\n");
        stream.style.left =
          ((i + Math.random() * 0.85) * (100 / streamCount)).toFixed(2) + "%";
        stream.style.fontSize = (11.5 + Math.random() * 4).toFixed(2) + "px";
        stream.style.opacity = (0.62 + Math.random() * 0.34).toFixed(2);
        stream.style.setProperty(
          "--fall-distance",
          (viewportHeight + 220 + Math.random() * 240).toFixed(0) + "px",
        );
        stream.style.animationDuration =
          (14 + Math.random() * 12).toFixed(2) + "s";
        stream.style.animationDelay = (-Math.random() * 22).toFixed(2) + "s";
        fragment.appendChild(stream);
      }
      codeRain.appendChild(fragment);
    }

    let resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(renderCodeRain, 150);
    });

    renderCodeRain();
  }

  function setupHeroParallax() {
    if (prefersReducedMotion) return;
    const blobs = Array.from(document.querySelectorAll(".bg-gradient"));
    if (!blobs.length) return;

    function updateParallax() {
      const scrollTop = window.scrollY || window.pageYOffset || 0;
      const directionMultiplier = scrollTop * 0.08;

      blobs.forEach(function (blob, index) {
        const speed = Number(blob.dataset.parallax) || 0.12;
        const direction = index % 2 === 0 ? 1 : -1;
        const offsetY = directionMultiplier * speed;
        const offsetX = directionMultiplier * speed * 0.6 * direction;
        blob.style.setProperty("--parallax-x", `${offsetX.toFixed(2)}px`);
        blob.style.setProperty("--parallax-y", `${offsetY.toFixed(2)}px`);
      });
    }

    scrollTasks.push(updateParallax);
  }

  function setupProject3D() {
    if (prefersReducedMotion || !finePointer) {
      return;
    }
    const cards = Array.from(
      document.querySelectorAll(
        ".project-card, .now-card, .meta-card, .proof-card, .outcome-card, .experience-card",
      ),
    );
    if (!cards.length) return;

    cards.forEach(function (card) {
      let bounds = null;
      let targetX = 0,
        targetY = 0;
      let currentX = 0,
        currentY = 0;
      let targetScale = 1,
        currentScale = 1;
      let mouseX = 50,
        mouseY = 50;
      let rafId = null;

      const updateBounds = () => (bounds = card.getBoundingClientRect());

      function animate() {
        currentX += (targetX - currentX) * 0.15;
        currentY += (targetY - currentY) * 0.15;
        currentScale += (targetScale - currentScale) * 0.08;
        card.style.transform = `perspective(1200px) rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg) translateY(-6px) scale(${currentScale.toFixed(3)})`;
        card.style.setProperty("--mouse-x", `${mouseX.toFixed(2)}%`);
        card.style.setProperty("--mouse-y", `${mouseY.toFixed(2)}%`);

        rafId = window.requestAnimationFrame(animate);
      }

      card.addEventListener("mouseenter", function () {
        updateBounds();
        targetScale = 1.03;
        targetX = 0;
        targetY = 0;
        if (!rafId) rafId = window.requestAnimationFrame(animate);
      });

      card.addEventListener("mousemove", function (event) {
        if (!bounds || bounds.width === 0) return;
        const relX = (event.clientX - bounds.left) / bounds.width;
        const relY = (event.clientY - bounds.top) / bounds.height;
        targetY = (relX - 0.5) * 10;
        targetX = (relY - 0.5) * -10;
        mouseX = relX * 100;
        mouseY = relY * 100;
      });

      card.addEventListener("mouseleave", function () {
        targetX = 0;
        targetY = 0;
        currentX = 0;
        currentY = 0;
        targetScale = 1;
        currentScale = 1;
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        card.style.transform = "";
      });

      window.addEventListener("resize", updateBounds);
    });
  }

  function setupAvatar3D() {
    if (prefersReducedMotion || !finePointer) return;
    const avatar = document.querySelector(".hero-avatar");
    if (!avatar) return;

    let bounds = null;
    let targetX = 0,
      targetY = 0;
    let currentX = 0,
      currentY = 0;
    let targetScale = 1,
      currentScale = 1;
    let rafId = null;

    const updateBounds = () => {
      bounds = avatar.getBoundingClientRect();
    };

    function animate() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      currentScale += (targetScale - currentScale) * 0.06;
      avatar.style.transform = `perspective(1000px) rotateX(${currentX.toFixed(2)}deg) rotateY(${currentY.toFixed(2)}deg) scale(${currentScale.toFixed(3)})`;
      rafId = window.requestAnimationFrame(animate);
    }

    avatar.addEventListener("mouseenter", () => {
      updateBounds();
      targetScale = 1.05;
      avatar.style.transition = "none";
      if (!rafId) rafId = window.requestAnimationFrame(animate);
    });

    avatar.addEventListener("mousemove", (e) => {
      if (!bounds) return;
      const relX = (e.clientX - bounds.left) / bounds.width;
      const relY = (e.clientY - bounds.top) / bounds.height;
      targetY = (relX - 0.5) * 15;
      targetX = (relY - 0.5) * -15;
    });

    avatar.addEventListener("mouseleave", () => {
      targetX = 0;
      targetY = 0;
      currentX = 0;
      currentY = 0;
      targetScale = 1;
      currentScale = 1;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      avatar.style.transition = "";
      avatar.style.transform = "";
    });

    window.addEventListener("resize", updateBounds);
  }

  function setupSectionNavigation() {
    const sections = Array.from(document.querySelectorAll("section[id]"));
    const upBtn = document.getElementById("navUp");
    const downBtn = document.getElementById("navDown");
    if (!upBtn || !downBtn || sections.length === 0) return;

    function getCurrentSectionIndex() {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      let currentIdx = 0;
      sections.forEach((section, index) => {
        if (scrollPos >= section.offsetTop) {
          currentIdx = index;
        }
      });
      return currentIdx;
    }

    upBtn.addEventListener("click", () => {
      const currentIdx = getCurrentSectionIndex();
      if (currentIdx > 0) {
        window.scrollTo({
          top: sections[currentIdx - 1].offsetTop,
          behavior: "smooth",
        });
      }
    });

    downBtn.addEventListener("click", () => {
      const currentIdx = getCurrentSectionIndex();
      if (currentIdx < sections.length - 1) {
        window.scrollTo({
          top: sections[currentIdx + 1].offsetTop,
          behavior: "smooth",
        });
      }
    });
  }

  function setupBackToTop() {
    const backToTopBtn = document.getElementById("backToTop");
    if (!backToTopBtn) return;

    scrollTasks.push(() => {
      backToTopBtn.classList.toggle("show", window.scrollY > 500);
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  function setupCopyEmail() {
    const copyBtn = document.getElementById("copyEmailBtn");
    if (!copyBtn) return;

    const email = copyBtn.dataset.email;
    const btnText = copyBtn.querySelector("span");
    const btnIcon = copyBtn.querySelector("i");
    const originalText = btnText ? btnText.textContent : "";
    const originalIconClass = btnIcon ? btnIcon.className : "";

    copyBtn.addEventListener("click", () => {
      navigator.clipboard
        .writeText(email)
        .then(() => {
          copyBtn.classList.add("copy-success");
          if (btnText) btnText.textContent = "Copied!";
          if (btnIcon) btnIcon.className = "fa-solid fa-check";

          setTimeout(() => {
            copyBtn.classList.remove("copy-success");
            if (btnText) btnText.textContent = originalText;
            if (btnIcon) btnIcon.className = originalIconClass;
          }, 2000);
        })
        .catch(() => {
          if (btnText) btnText.textContent = "Error";
          setTimeout(() => {
            if (btnText) btnText.textContent = originalText;
          }, 2000);
        });
    });
  }

  function setupClickSounds() {
    const clickSound = new Audio("mouse-click.mp3");
    clickSound.preload = "auto";
    clickSound.volume = 0.4;

    // Using event delegation to handle both static and dynamically rendered buttons
    const interactiveSelector =
      ".button, .link-btn, .filter-btn, .theme-toggle, .nav-scroll-btn, .back-to-top, .site-nav a";

    document.addEventListener("click", (event) => {
      if (event.target.closest(interactiveSelector)) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
      }
    });
  }

  function setupMobileHaptics() {
    const mobileActions = document.querySelector(".mobile-actions");
    if (!mobileActions) return;

    mobileActions.addEventListener("click", (event) => {
      if (event.target.closest(".mobile-action") && "vibrate" in navigator) {
        navigator.vibrate(15);
      }
    });
  }

  // --- Init ---
  renderProjects();
  initScrollManager();
  setupScrollProgress();
  trackActiveSection();
  setupContactForm();
  setupThemeToggle();
  setupHeroParallax();
  setupProject3D();
  setupAvatar3D();
  setupOutcomeCounters();
  setupCodeRain();
  setupCursorTracker();
  setupSectionNavigation();
  setupBackToTop();
  setupCopyEmail();
  setupClickSounds();
  setupMobileHaptics();
  registerRevealElements(document);

  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 1200,
      easing: "ease-in-out",
      once: true,
    });
  }
})();
