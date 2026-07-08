"use strict";

(function () {
  // --- Configuration & State ---
  const menuToggle = document.getElementById("menuToggle");
  const primaryNav = document.getElementById("primaryNav");
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
  const scrollProgress = document.getElementById("scrollProgress");
  const navActivePill = document.getElementById("navActivePill");
  const yearEl = document.getElementById("year");
  const projectsGrid = document.getElementById("projectsGrid");
  const filterContainer = document.getElementById("projectFilters");
  const projectFilterSummary = document.getElementById("projectFilterSummary");
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const cursorDot = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");
  const codeRain = document.getElementById("codeRain");
  const architectureBg = document.getElementById("architectureBg");

  // Store scroll/resize tasks to run in a unified loop
  const scrollTasks = [];
  const tiltBoundsUpdaters = [];
  let tiltResizeBound = false;

  const MOBILE_NAV_BREAKPOINT = 1080;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  function getHeaderOffset() {
    const rawValue = getComputedStyle(document.documentElement)
      .getPropertyValue("--header-offset")
      .trim();
    const parsedValue = Number.parseFloat(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : 112;
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

  function setupTypingHeadings() {
    const headings = Array.from(document.querySelectorAll(".section-heading h2"));

    headings.forEach((heading) => {
      if (heading.dataset.typingReady === "true") return;

      const headingText = heading.textContent.trim();
      if (!headingText) return;

      heading.dataset.typingReady = "true";
      heading.dataset.typingText = headingText;
      heading.setAttribute("aria-label", headingText);
      heading.classList.add("typing-heading");
      heading.style.setProperty("--typing-characters", headingText.length);

      if (prefersReducedMotion) {
        heading.classList.add("typing-complete");
        return;
      }

      heading.textContent = "";

      const textSpan = document.createElement("span");
      textSpan.className = "typing-text";
      textSpan.setAttribute("aria-hidden", "true");

      const cursorSpan = document.createElement("span");
      cursorSpan.className = "typing-cursor";
      cursorSpan.setAttribute("aria-hidden", "true");

      heading.append(textSpan, cursorSpan);
    });
  }

  function runHeadingTyping(root) {
    if (prefersReducedMotion) return;

    const headings = [];

    if (root && root.matches && root.matches(".typing-heading")) {
      headings.push(root);
    }

    if (root && root.querySelectorAll) {
      headings.push(...root.querySelectorAll(".typing-heading"));
    }

    headings.forEach((heading) => {
      if (heading.dataset.typingLooping === "true") return;

      const headingText = heading.dataset.typingText || "";
      const textSpan = heading.querySelector(".typing-text");
      if (!headingText || !textSpan) return;

      heading.dataset.typingLooping = "true";
      heading.classList.add("typing-active");

      const stepDuration = Math.max(
        42,
        Math.min(78, Math.round(1180 / headingText.length)),
      );
      const eraseDuration = Math.max(28, Math.round(stepDuration * 0.55));
      const holdDuration = 1800;
      const restartDuration = 520;

      function typeNextCharacter(characterIndex = 0) {
        characterIndex += 1;
        heading.classList.remove("typing-erasing");
        textSpan.textContent = headingText.slice(0, characterIndex);

        if (characterIndex < headingText.length) {
          window.setTimeout(() => typeNextCharacter(characterIndex), stepDuration);
          return;
        }

        window.setTimeout(() => erasePreviousCharacter(headingText.length), holdDuration);
      }

      function erasePreviousCharacter(characterIndex) {
        characterIndex -= 1;
        heading.classList.add("typing-erasing");
        textSpan.textContent = headingText.slice(0, characterIndex);

        if (characterIndex > 0) {
          window.setTimeout(() => erasePreviousCharacter(characterIndex), eraseDuration);
          return;
        }

        window.setTimeout(() => typeNextCharacter(0), restartDuration);
      }

      window.setTimeout(() => typeNextCharacter(0), 120);
    });
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

      if (isOpen) {
        const firstNavLink = primaryNav.querySelector("a");
        window.setTimeout(() => firstNavLink?.focus({ preventScroll: true }), 120);
      }
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", closeNavMenu);
    });

    primaryNav.addEventListener("click", function (event) {
      if (event.target === primaryNav) {
        closeNavMenu();
      }
    });

    document.addEventListener("click", function (event) {
      if (!primaryNav.classList.contains("open")) return;

      const clickedInsideNav = primaryNav.contains(event.target);
      const clickedToggle = menuToggle.contains(event.target);

      if (!clickedInsideNav && !clickedToggle) {
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
        menuToggle.focus({ preventScroll: true });
      }
    });
  }

  // --- Reveal System ---
  function applyRevealState(element) {
    element.classList.add("in-view");
    const animationName = String(element.dataset.animate || "").trim();

    runHeadingTyping(element);

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

  function normalizeProjectLinks(project) {
    if (Array.isArray(project.links) && project.links.length) {
      return project.links
        .filter((link) => link && link.href && link.label)
        .map((link) => ({
          label: link.label,
          href: link.href,
          icon: link.icon || "fa-solid fa-arrow-up-right-from-square",
        }));
    }

    const links = [];
    if (project.gitHubLink && project.gitHubLink !== "#") {
      links.push({
        label: "GitHub",
        href: project.gitHubLink,
        icon: "fa-brands fa-github",
      });
    }

    if (project.liveDemoLink && project.liveDemoLink !== "#") {
      links.push({
        label: "Demo",
        href: project.liveDemoLink,
        icon: "fa-solid fa-arrow-up-right-from-square",
      });
    }

    return links;
  }

  const projectFilterDefinitions = [
    { key: "All", label: "All", match: () => true },
    {
      key: ".NET",
      label: ".NET",
      match: (project) =>
        projectHasText(project, "ASP.NET Core") ||
        projectHasText(project, ".NET 10") ||
        projectHasText(project, ".NET Development"),
    },
    {
      key: "Backend",
      label: "Backend",
      match: (project) =>
        projectHasText(project, "Backend") ||
        projectHasText(project, "SQL Server") ||
        projectHasText(project, "ASP.NET Core") ||
        projectHasText(project, "Database"),
    },
    {
      key: "Full-Stack",
      label: "Full-Stack",
      match: (project) => projectHasText(project, "Full-Stack"),
    },
    {
      key: "Frontend",
      label: "Frontend",
      match: (project) =>
        projectHasText(project, "Frontend") ||
        projectHasText(project, "HTML") ||
        projectHasText(project, "CSS") ||
        projectHasText(project, "JavaScript") ||
        projectHasText(project, "Vue.js 3"),
    },
    {
      key: "SQL Server",
      label: "SQL Server",
      match: (project) => projectHasText(project, "SQL Server"),
    },
    {
      key: "Live",
      label: "Live",
      match: (project) =>
        projectHasBadge(project, "Live") ||
        normalizeProjectLinks(project).some((link) =>
          /live|demo/i.test(link.label),
        ),
    },
  ];

  function projectTextTokens(project) {
    return [
      project.title,
      project.role,
      project.outcome,
      project.description,
      ...(Array.isArray(project.badges) ? project.badges : []),
      ...(Array.isArray(project.tags) ? project.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function projectHasText(project, text) {
    return projectTextTokens(project).includes(String(text).toLowerCase());
  }

  function projectHasBadge(project, text) {
    if (!Array.isArray(project.badges)) return false;
    return project.badges.some(
      (badge) => String(badge).toLowerCase() === String(text).toLowerCase(),
    );
  }

  function findProjectFilter(filterKey) {
    return (
      projectFilterDefinitions.find((filter) => filter.key === filterKey) ||
      projectFilterDefinitions[0]
    );
  }

  function projectMatchesFilter(project, filterKey) {
    return findProjectFilter(filterKey).match(project);
  }

  function buildProjectCard(project, index) {
    const title = escapeHtml(project.title || "Project");
    const role = escapeHtml(project.role || "");
    const outcome = escapeHtml(project.outcome || "");
    const description = escapeHtml(project.description || "");
    const imageLight = escapeHtml(project.image || "");
    const imageDark = escapeHtml(project.imageDark || "");
    const imageLightWebp = escapeHtml(project.imageWebp || "");
    const imageDarkWebp = escapeHtml(project.imageDarkWebp || "");
    const badges = Array.isArray(project.badges) ? project.badges : [];
    const isFeatured =
      String(project.title || "").toLowerCase() === "saiyad" ||
      badges.includes("Main Project");
    const imageIsTall =
      Number(project.imageHeight || 0) > Number(project.imageWidth || 0);
    const badgesHtml = badges.length
      ? `<div class="project-badges" aria-label="Project highlights">
                    ${badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join("")}
                </div>`
      : "";
    const tags = Array.isArray(project.tags) ? project.tags : [];
    const tagsHtml = tags
      .map((tag) => `<span>${escapeHtml(tag)}</span>`)
      .join("");
    const projectStackHtml = tags.length
      ? `<div class="project-stack">
                    <p class="project-stack-label">Stack</p>
                    <div class="project-tags">${tagsHtml}</div>
                </div>`
      : "";
    const projectLinks = normalizeProjectLinks(project);
    const linksHtml = projectLinks
      .map(
        (link) =>
          `<a class="link-btn" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">
              <i class="${escapeHtml(link.icon)}" aria-hidden="true"></i>
              <span>${escapeHtml(link.label)}</span>
          </a>`,
      )
      .join("");
    const proofPoints = Array.isArray(project.proofPoints)
      ? project.proofPoints
      : [];
    const proofHtml = proofPoints.length
      ? `<div class="project-proof">
                    <p class="project-proof-label">Signals</p>
                    <ul>
                        ${proofPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
                    </ul>
                </div>`
      : "";

    const animateDelay = Math.min(index * 80, 420) + "ms";
    const animationName =
      index % 3 === 1
        ? "animate__fadeInLeft"
        : index % 3 === 2
          ? "animate__fadeInRight"
          : "animate__fadeInUp";
    const cardId = "project-" + escapeHtml(project.id || index + 1);

    const hasAltTheme = imageDark && imageDark !== imageLight;
    const buildImage = (src, webpSrc, className = "") => {
      if (!webpSrc) {
        return `<img src="${src}" class="${className}" alt="${title} preview" loading="lazy" decoding="async" fetchpriority="low" width="${project.imageWidth || 1280}" height="${project.imageHeight || 720}">`;
      }
      
      const img = `<img src="${src}" alt="${title} preview" loading="lazy" decoding="async" fetchpriority="low" width="${project.imageWidth || 1280}" height="${project.imageHeight || 720}">`;
      return `<picture class="${className}">
                        <source srcset="${webpSrc}" type="image/webp">
                        ${img}
                    </picture>`;
    };

    let imageHtml = buildImage(
      imageLight,
      imageLightWebp,
      hasAltTheme ? "image-light" : "",
    );

    if (hasAltTheme) {
      imageHtml += buildImage(imageDark, imageDarkWebp, "image-dark");
    }

    const projectMetaHtml =
      role || outcome
        ? `<div class="project-meta">
                    ${
                      role
                        ? `<p class="project-meta-line"><span class="project-meta-label">Role</span><span class="project-meta-value">${role}</span></p>`
                        : ""
                    }
                    ${
                      outcome
                        ? `<p class="project-meta-line"><span class="project-meta-label">Outcome</span><span class="project-meta-value">${outcome}</span></p>`
                        : ""
                    }
                </div>`
        : "";

    return `
            <article class="project-card${isFeatured ? " project-featured" : ""} reveal"
                    data-animate="${animationName}"
                    data-animate-duration="760ms"
                    data-animate-delay="${animateDelay}"
                    id="${cardId}"
                    data-stagger>
                <div class="project-image is-loading${imageIsTall ? " project-image-tall" : ""}">
                    ${imageHtml}
                </div>
                <div class="project-body">
                    <h3 class="project-title">${title}</h3>
                    ${badgesHtml}
                    ${projectMetaHtml}
                    <p class="project-description">${description}</p>
                    ${proofHtml}
                    ${projectStackHtml}
                    <div class="project-links">
                        ${linksHtml}
                    </div>
                </div>
            </article>`;
  }

  function renderProjects(filterTag = "All") {
    if (!projectsGrid) return;

    const allProjects = normalizeProjects(window.projects);
    let projectData = allProjects;
    const activeFilter = findProjectFilter(filterTag);

    if (activeFilter.key !== "All") {
      projectData = projectData.filter((p) =>
        projectMatchesFilter(p, activeFilter.key),
      );
    }

    if (projectFilterSummary) {
      const projectWord = projectData.length === 1 ? "project" : "projects";
      projectFilterSummary.textContent = `Showing ${projectData.length} ${projectWord} for ${activeFilter.label}.`;
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
      const markImageReady = () => {
        const wrap = imageEl.closest(".project-image");
        if (wrap) {
          wrap.classList.remove("is-loading");
          wrap.classList.add("image-ready", "shimmer");
          setTimeout(() => wrap.classList.remove("shimmer"), 1300);
        }
      };

      imageEl.addEventListener("error", () => {
        imageEl.style.display = "none";
        const wrap = imageEl.closest(".project-image");
        if (wrap) {
          const allImages = wrap.querySelectorAll("img");
          const hiddenImages = Array.from(allImages).filter(
            (img) => img.style.display === "none",
          );
          if (allImages.length === hiddenImages.length) {
            wrap.classList.remove("is-loading", "image-ready", "shimmer");
            wrap.innerHTML =
              '<div class="missing-image"><i class="fa-regular fa-image" aria-hidden="true"></i><span>Preview unavailable</span></div>';
          }
        }
      });

      imageEl.addEventListener("load", markImageReady);

      if (imageEl.complete && imageEl.naturalWidth > 0) {
        markImageReady();
      }
    });

    registerRevealElements(projectsGrid);
    setupProject3D();
  }

  function setupProjectFilters() {
    if (!filterContainer || filterContainer.dataset.initialized) return;

    const projectData = normalizeProjects(window.projects);
    const visibleFilters = projectFilterDefinitions
      .map((filter) => ({
        ...filter,
        count: projectData.filter((project) => filter.match(project)).length,
      }))
      .filter((filter) => filter.key === "All" || filter.count > 0);

    filterContainer.innerHTML = visibleFilters
      .map((filter) => {
        const countLabel = filter.key === "All" ? projectData.length : filter.count;
        return `<button class="filter-btn ${filter.key === "All" ? "active" : ""}" data-filter="${filter.key}" aria-pressed="${filter.key === "All" ? "true" : "false"}">${filter.label} <span>${countLabel}</span></button>`;
      })
      .join("");

    filterContainer.addEventListener("click", function (e) {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      filterContainer
        .querySelectorAll(".filter-btn")
        .forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
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

    const linkMap = new Map();
    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href) {
        linkMap.set(href, link);
      }

      String(link.dataset.activeSections || "")
        .split(/\s+/)
        .map((sectionId) => sectionId.trim())
        .filter(Boolean)
        .forEach((sectionId) => linkMap.set("#" + sectionId, link));
    });

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

    function movePillTo(link) {
      if (!navActivePill || !link) return;
      const linkRect = link.getBoundingClientRect();
      const navRect = link.parentElement.getBoundingClientRect();
      navActivePill.style.left = linkRect.left - navRect.left + "px";
      navActivePill.style.width = linkRect.width + "px";
      navActivePill.style.opacity = "1";
    }

    function setActiveSection(sectionId) {
      navLinks.forEach((l) => l.classList.remove("active"));
      const activeLink = linkMap.get("#" + sectionId);

      if (!activeLink) return;

      activeLink.classList.add("active");
      movePillTo(activeLink);

      updateNavButtons(sectionId);
    }

    const initialHash = String(window.location.hash || "").trim();
    if (initialHash && linkMap.has(initialHash)) {
      setActiveSection(initialHash.slice(1));
    } else {
      setActiveSection(sections[0].id);
    }

    const primaryNav = document.getElementById("primaryNav");
    if (primaryNav && navActivePill) {
      navLinks.forEach((link) => {
        link.addEventListener("mouseenter", () => movePillTo(link));
      });
      primaryNav.addEventListener("mouseleave", () => {
        const activeLink = primaryNav.querySelector("a.active");
        if (activeLink) movePillTo(activeLink);
      });
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

    const RATE_LIMIT_KEY = "portfolio-contact-last-submit";
    const RATE_LIMIT_MS = 60 * 1000;

    function setFormStatus(message, type) {
      formStatus.textContent = message;
      formStatus.classList.remove(
        "form-status--error",
        "form-status--success",
        "form-status--info",
      );

      if (type === "error") {
        formStatus.classList.add("form-status--error");
      }

      if (type === "success") {
        formStatus.classList.add("form-status--success");
      }

      if (type === "info") {
        formStatus.classList.add("form-status--info");
      }
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    function getFieldLabel(name) {
      return (
        {
          name: "Name",
          email: "Email",
          subject: "Subject",
          message: "Message",
        }[name] || "Field"
      );
    }

    function getStoredTimestamp() {
      try {
        return Number(localStorage.getItem(RATE_LIMIT_KEY) || "0");
      } catch (error) {
        return 0;
      }
    }

    function saveTimestamp(value) {
      try {
        localStorage.setItem(RATE_LIMIT_KEY, String(value));
      } catch (error) {
        // Ignore storage restrictions.
      }
    }

    function getRemainingCooldown() {
      const lastSubmitAt = getStoredTimestamp();
      const elapsed = Date.now() - lastSubmitAt;
      return Math.max(RATE_LIMIT_MS - elapsed, 0);
    }

    function formatCooldown(ms) {
      const totalSeconds = Math.ceil(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }

      return `${seconds}s`;
    }

    function updateLabelWidths() {
      fields.forEach((field) => {
        const control = field.closest(".field-control");
        const label = control?.querySelector("label");
        if (label && control) {
          const width = label.offsetWidth;
          control.style.setProperty("--lw", width + "px");
        }
      });
    }

    function validateField(field) {
      const name = field.getAttribute("name");
      const value = field.value.trim();
      let isValid = true;
      let message = "";
      let tone = "neutral";

      if (!value) {
        isValid = false;
        message = `${getFieldLabel(name)} is required.`;
      } else if (name === "email" && !isValidEmail(value)) {
        isValid = false;
        message = "Enter a valid email address, like name@example.com.";
      } else if (name === "name" && value.length < 2) {
        isValid = false;
        message = "Name must be at least 2 characters.";
      } else if (name === "subject" && value.length < 3) {
        isValid = false;
        message = "Subject must be at least 3 characters.";
      } else if (name === "message" && value.length < 10) {
        isValid = false;
        message = "Message must be at least 10 characters.";
      } else {
        tone = "success";

        if (name === "email") {
          message = "Email format looks good.";
        } else if (name === "message") {
          message = "Message looks ready to send.";
        } else {
          message = `${getFieldLabel(name)} looks good.`;
        }
      }

      if (field.hasAttribute("required") || value.length > 0) {
        updateFieldUI(field, isValid, message, tone);
      }
      return isValid;
    }

    function updateFieldUI(field, isValid, message, tone) {
      const wrapper = field.closest(".field-wrap");
      const msgEl = wrapper?.querySelector(".field-msg");

      if (!isValid) {
        field.classList.add("field-invalid");
        field.classList.remove("field-valid");
        if (msgEl) {
          msgEl.textContent = message;
          msgEl.classList.add("error");
          msgEl.classList.remove("success");
        }
      } else {
        field.classList.remove("field-invalid");
        field.classList.add("field-valid");
        if (msgEl) {
          msgEl.textContent = message;
          msgEl.classList.remove("error");
          msgEl.classList.toggle("success", tone === "success");
        }
      }
    }

    function clearFieldUI(field) {
      const wrapper = field.closest(".field-wrap");
      const msgEl = wrapper?.querySelector(".field-msg");
      field.classList.remove("field-invalid", "field-valid");
      if (msgEl) {
        msgEl.textContent = "";
        msgEl.classList.remove("error", "success");
      }
    }

    function getInvalidFieldMessages() {
      return fields
        .filter((field) => !validateField(field))
        .map((field) => {
          const msgEl = field.closest(".field-wrap")?.querySelector(".field-msg");
          return msgEl ? msgEl.textContent.trim() : "";
        })
        .filter(Boolean);
    }

    function createGlowField(field) {
      let control = field.closest(".field-control");
      if (!control) {
        control = document.createElement("div");
        control.className = "field-control";
        field.parentNode.insertBefore(control, field);
        control.appendChild(field);
      }

      const glow = document.createElement("span");
      glow.className = "field-glow";
      control.appendChild(glow);

      function updateGlow(event) {
        const rect = control.getBoundingClientRect();
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
        'input[type="text"]:not([name="_gotcha"]), input[type="email"], textarea',
      ),
    );
    fields.forEach((field) => {
      createGlowField(field);
      field.addEventListener("input", () => {
        validateField(field);
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

      const invalidMessages = getInvalidFieldMessages();
      const isFormValid = invalidMessages.length === 0;

      if (!isFormValid) {
        setFormStatus(
          `Please fix the following: ${invalidMessages.join(" ")}`,
          "error",
        );
        const firstInvalidField = fields.find((field) =>
          field.classList.contains("field-invalid"),
        );
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
        return;
      }

      const remainingCooldown = getRemainingCooldown();
      if (remainingCooldown > 0) {
        setFormStatus(
          `Please wait ${formatCooldown(remainingCooldown)} before sending another message.`,
          "info",
        );
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
      setFormStatus("Sending your message...", "info");

      const formData = new FormData(contactForm);
      fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      })
        .then((response) => {
          if (response.ok) {
            saveTimestamp(Date.now());
            setFormStatus(
              "Your message has been sent successfully. I'll review it and get back to you shortly.",
              "success",
            );
            fields.forEach(clearFieldUI);
            contactForm.reset();
          } else {
            setFormStatus(
              "Your message could not be sent right now. Please try again in a moment.",
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
        themeLabel.textContent =
          theme === "light" ? "Switch to Dark" : "Switch to Light";
      }

      if (themeToggle) {
        themeToggle.setAttribute(
          "aria-pressed",
          theme === "light" ? "true" : "false",
        );
        themeToggle.setAttribute(
          "aria-label",
          theme === "light" ? "Switch to dark theme" : "Switch to light theme",
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
    const mediumWidthCursor = window.matchMedia("(max-width: 1320px)").matches;
    if (
      !cursorDot ||
      !cursorRing ||
      !finePointer ||
      prefersReducedMotion ||
      mediumWidthCursor
    )
      return;

    const hoverSelector =
      "a, button, input, textarea, .project-card, .hero-avatar";
    let pointerX = -100,
      pointerY = -100;
    let ringX = -100,
      ringY = -100;
    let ringRafId = null;

    document.body.classList.add("cursor-ready");

    function markCursorActive() {
      document.body.classList.add("cursor-active");
    }

    function paintDot() {
      cursorDot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
    }

    function scheduleRingAnimation() {
      if (ringRafId) return;
      ringRafId = window.requestAnimationFrame(animateRing);
    }

    function animateRing() {
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;

      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      const isSettled =
        Math.abs(pointerX - ringX) < 0.1 && Math.abs(pointerY - ringY) < 0.1;

      if (isSettled) {
        ringRafId = null;
        return;
      }

      ringRafId = window.requestAnimationFrame(animateRing);
    }

    window.addEventListener("mousemove", function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      markCursorActive();
      paintDot();
      scheduleRingAnimation();
    });

    window.addEventListener("mouseout", function (event) {
      if (event.relatedTarget) return;

      pointerX = -100;
      pointerY = -100;
      document.body.classList.remove("cursor-active");
      paintDot();
      scheduleRingAnimation();
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
    scheduleRingAnimation();
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
        "state",
        "props",
        "route",
        "cache",
        "query",
        "merge",
        "branch",
        "deploy",
        "test",
        "build",
        "lint",
        "schema",
        "queue",
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
          ? 16
          : window.innerWidth >= 1000
            ? 12
            : window.innerWidth >= 760
              ? 9
              : 6;
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
        stream.style.opacity = (0.2 + Math.random() * 0.14).toFixed(2);
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
      if (card.dataset.tiltBound === "true") {
        return;
      }

      card.dataset.tiltBound = "true";
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

      const updateBounds = () => {
        if (!document.body.contains(card)) return;
        bounds = card.getBoundingClientRect();
      };

      tiltBoundsUpdaters.push(updateBounds);

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
        card.style.willChange = "transform";
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
        card.style.willChange = "";
        card.style.transform = "";
      });
    });

    if (!tiltResizeBound) {
      window.addEventListener("resize", function () {
        tiltBoundsUpdaters.forEach((updateBounds) => updateBounds());
      });
      tiltResizeBound = true;
    }
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
      avatar.style.willChange = "transform";
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
      avatar.style.willChange = "";
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

    function scrollToSection(section) {
      if (!section) return;
      window.scrollTo({
        top: Math.max(section.offsetTop - getHeaderOffset() + 8, 0),
        behavior: "smooth",
      });
    }

    upBtn.addEventListener("click", () => {
      const currentIdx = getCurrentSectionIndex();
      if (currentIdx > 0) {
        scrollToSection(sections[currentIdx - 1]);
      }
    });

    downBtn.addEventListener("click", () => {
      const currentIdx = getCurrentSectionIndex();
      if (currentIdx < sections.length - 1) {
        scrollToSection(sections[currentIdx + 1]);
      }
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
      if (!email || !navigator.clipboard?.writeText) {
        if (btnText) btnText.textContent = "Unavailable";
        setTimeout(() => {
          if (btnText) btnText.textContent = originalText;
        }, 2000);
        return;
      }

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
    const soundDefinitions = {
      ui: { src: "Sound effects/mouse-click.mp3", volume: 0.4 },
      rocket: { src: "Sound effects/rocket.mp3", volume: 0.5 },
    };
    const soundCache = {};

    function getSound(key) {
      if (soundCache[key]) {
        return soundCache[key];
      }

      const definition = soundDefinitions[key];
      if (!definition) {
        return null;
      }

      const sound = new Audio(definition.src);
      sound.volume = definition.volume;
      sound.preload = "none";
      soundCache[key] = sound;
      return sound;
    }

    // Priority-based mapping: put more specific selectors first
    const soundMap = [
      {
        selector: ".back-to-top",
        soundKey: "rocket",
      },
      {
        selector:
          ".button, .link-btn, .filter-btn, .theme-toggle, .nav-scroll-btn, .site-nav a",
        soundKey: "ui",
      },
    ];

    document.addEventListener("click", (event) => {
      const target = event.target;
      const match = soundMap.find((entry) => target.closest(entry.selector));

      if (!match) return;

      const sound = getSound(match.soundKey);
      if (!sound) return;

      sound.currentTime = 0;
      sound.play().catch(() => {});
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

  function setupBackToTop() {
    const backToTopBtn = document.getElementById("backToTop");
    if (!backToTopBtn) return;

    function toggleBackToTop() {
      const experienceSection = document.getElementById("experience");
      const revealPoint = experienceSection
        ? Math.max(experienceSection.offsetTop - getHeaderOffset(), 0)
        : 400;

      if (window.scrollY >= revealPoint) {
        backToTopBtn.classList.remove("hidden");
      } else {
        backToTopBtn.classList.add("hidden");
      }
    }

    scrollTasks.push(toggleBackToTop);

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  function setupArchitectureBackground() {
    if (!architectureBg || prefersReducedMotion) return;

    const ctx = architectureBg.getContext("2d", { alpha: true });
    if (!ctx) return;

    function getColor(token, fallback) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(token)
        .trim() || fallback;
    }

    const nodes = [
      { id: "n1", x: 0.1, y: 0.26, weight: 0.78, phase: 0.4 },
      { id: "n2", x: 0.22, y: 0.5, weight: 0.92, phase: 1.6 },
      { id: "n3", x: 0.34, y: 0.32, weight: 1.18, phase: 2.2 },
      { id: "n4", x: 0.47, y: 0.58, weight: 0.84, phase: 0.9 },
      { id: "n5", x: 0.58, y: 0.37, weight: 1.28, phase: 2.9 },
      { id: "n6", x: 0.72, y: 0.22, weight: 0.72, phase: 1.1 },
      { id: "n7", x: 0.78, y: 0.55, weight: 1.06, phase: 3.4 },
      { id: "n8", x: 0.92, y: 0.4, weight: 0.82, phase: 2.5 },
      { id: "n9", x: 0.64, y: 0.75, weight: 0.68, phase: 1.9 },
      { id: "n10", x: 0.18, y: 0.78, weight: 0.62, phase: 3.1 },
    ];
    const connections = [
      ["n1", "n3"],
      ["n2", "n3"],
      ["n2", "n4"],
      ["n3", "n5"],
      ["n4", "n5"],
      ["n4", "n9"],
      ["n5", "n6"],
      ["n5", "n7"],
      ["n6", "n8"],
      ["n7", "n8"],
      ["n7", "n9"],
      ["n2", "n10"],
    ];

    const pointer = { x: 0, y: 0 };
    let canvasWidth = 0;
    let canvasHeight = 0;
    let rafId = 0;

    function resize() {
      const width = Math.max(window.innerWidth, 320);
      const height = Math.max(window.innerHeight, 320);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.8);
      canvasWidth = width;
      canvasHeight = height;
      architectureBg.width = Math.round(width * pixelRatio);
      architectureBg.height = Math.round(height * pixelRatio);
      architectureBg.style.width = width + "px";
      architectureBg.style.height = height + "px";
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function project(node, seconds) {
      const driftX = Math.sin(seconds * 0.38 + node.phase) * 8 * node.weight;
      const driftY = Math.cos(seconds * 0.32 + node.phase * 1.4) * 6 * node.weight;
      const pointerShiftX = pointer.x * 8 * node.weight;
      const pointerShiftY = pointer.y * 5 * node.weight;
      return {
        x: node.x * canvasWidth + driftX + pointerShiftX,
        y: node.y * canvasHeight + driftY + pointerShiftY,
      };
    }

    function getCurvePoint(start, control, end, progress) {
      const inverse = 1 - progress;
      return {
        x:
          inverse * inverse * start.x +
          2 * inverse * progress * control.x +
          progress * progress * end.x,
        y:
          inverse * inverse * start.y +
          2 * inverse * progress * control.y +
          progress * progress * end.y,
      };
    }

    function drawConnection(start, end, accent, warm, progress, index, opacityScale) {
      const controlX = (start.x + end.x) / 2;
      const controlY =
        (start.y + end.y) / 2 -
        Math.abs(end.x - start.x) * (index % 2 === 0 ? 0.08 : -0.08);
      const control = { x: controlX, y: controlY };

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(controlX, controlY, end.x, end.y);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.16 * opacityScale;
      ctx.lineWidth = 1;
      ctx.stroke();

      const pulse = getCurvePoint(start, control, end, progress);
      const pulseLead = getCurvePoint(start, control, end, Math.min(progress + 0.08, 1));

      ctx.beginPath();
      ctx.moveTo(pulse.x, pulse.y);
      ctx.lineTo(pulseLead.x, pulseLead.y);
      ctx.strokeStyle = warm;
      ctx.globalAlpha = 0.58 * opacityScale;
      ctx.lineWidth = 2.1;
      ctx.stroke();
    }

    function drawNode(node, point, accent, warm, opacityScale) {
      const radius = 2.8 + node.weight * 2.2;
      const ringRadius = 14 + node.weight * 17;
      const isPrimary = node.weight > 1;
      const glow = isPrimary ? warm : accent;

      ctx.globalAlpha = (isPrimary ? 0.16 : 0.1) * opacityScale;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(point.x, point.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = (isPrimary ? 0.72 : 0.52) * opacityScale;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.32 * opacityScale;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(radius - 2, 1.8), 0, Math.PI * 2);
      ctx.fill();
    }

    function render(time) {
      const seconds = time * 0.001;
      const isLightTheme =
        document.documentElement.getAttribute("data-theme") === "light";
      const accent = getColor("--accent-2", isLightTheme ? "#147d78" : "#5fd0c6");
      const warm = getColor("--accent", isLightTheme ? "#b66b2a" : "#f2b35d");
      const visibleNodes =
        canvasWidth < 640
          ? nodes.filter((node, index) => node.weight >= 0.9 || index % 2 === 0)
          : nodes;
      const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
      const positionMap = new Map(
        visibleNodes.map((node) => [node.id, project(node, seconds)]),
      );
      const opacityScale = canvasWidth < 760 ? 0.72 : 1;

      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      connections.forEach(([fromId, toId], index) => {
        if (!visibleNodeIds.has(fromId) || !visibleNodeIds.has(toId)) return;

        const start = positionMap.get(fromId);
        const end = positionMap.get(toId);
        const progress = (seconds * 0.12 + index * 0.11) % 1;
        drawConnection(start, end, accent, warm, progress, index, opacityScale);
      });

      visibleNodes.forEach((node) => {
        drawNode(node, positionMap.get(node.id), accent, warm, opacityScale);
      });
    }

    function draw(time) {
      render(time);
      rafId = window.requestAnimationFrame(draw);
    }

    const themeObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === "data-theme")) {
        render(performance.now());
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true });

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true },
    );
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!document.hidden && !rafId) {
        rafId = window.requestAnimationFrame(draw);
      }
    });

    resize();
    rafId = window.requestAnimationFrame(draw);
  }

  // --- Init ---
  renderProjects();
  setupTypingHeadings();
  initScrollManager();
  setupScrollProgress();
  trackActiveSection();
  setupContactForm();
  setupThemeToggle();
  setupArchitectureBackground();
  setupOutcomeCounters();
  setupCopyEmail();
  setupMobileHaptics();
  registerRevealElements(document);
})();
