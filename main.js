"use strict";

(function () {
    const menuToggle = document.getElementById("menuToggle");
    const primaryNav = document.getElementById("primaryNav");
    const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
    const MOBILE_NAV_BREAKPOINT = 1080;
    const sectionIndicatorLabel = document.getElementById("sectionIndicatorLabel");
    const scrollProgress = document.getElementById("scrollProgress");
    const navActivePill = document.getElementById("navActivePill");
    const yearEl = document.getElementById("year");
    const projectsGrid = document.getElementById("projectsGrid");
    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");
    const themeToggle = document.getElementById("themeToggle");
    const themeLabel = document.getElementById("themeLabel");
    const cursorDot = document.getElementById("cursorDot");
    const cursorRing = document.getElementById("cursorRing");
    const codeRain = document.getElementById("codeRain");

    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    function closeNavMenu() {
        if (!menuToggle || !primaryNav) {
            return;
        }

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

    function startHeadingTyping(heading) {
        if (!heading || heading.dataset.typingStarted === "true") {
            return;
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const base = heading.querySelector(".typing-base");
        const overlay = heading.querySelector(".typing-overlay");
        const rawText =
            heading.dataset.text ||
            (base ? base.textContent : "") ||
            heading.textContent ||
            "";
        const fullText = String(rawText).trim();
        if (!fullText) {
            heading.dataset.typingStarted = "true";
            return;
        }

        heading.dataset.text = fullText;
        heading.dataset.typingStarted = "true";

        if (base) {
            base.textContent = fullText;
        }

        const targetOverlay = overlay || (function () {
            const span = document.createElement("span");
            span.className = "typing-overlay";
            span.setAttribute("aria-hidden", "true");
            heading.appendChild(span);
            return span;
        })();

        if (prefersReducedMotion) {
            targetOverlay.textContent = fullText;
            return;
        }

        const speed = 60;
        const pause = 3000;
        const initialDelay = 600;

        function runTyping() {
            targetOverlay.textContent = "";
            targetOverlay.classList.add("typing");

            let index = 0;
            const intervalId = window.setInterval(function () {
                index += 1;
                targetOverlay.textContent = fullText.slice(0, index);

                if (index >= fullText.length) {
                    window.clearInterval(intervalId);
                    targetOverlay.classList.remove("typing");
                    window.setTimeout(runTyping, pause);
                }
            }, speed);
        }

        window.setTimeout(runTyping, initialDelay);
    }

    function applyRevealState(element) {
        element.classList.add("in-view");

        const animationName = String(element.dataset.animate || "").trim();
        if (!animationName) {
            return;
        }

        element.classList.add("animate__animated", animationName);

        const animationDuration = String(
            element.dataset.animateDuration || "",
        ).trim();
        const animationDelay = String(element.dataset.animateDelay || "").trim();

        if (animationDuration) {
            element.style.setProperty("--animate-duration", animationDuration);
        }

        if (animationDelay) {
            element.style.setProperty("--animate-delay", animationDelay);
        }

        const staggerItems = Array.from(element.querySelectorAll("[data-stagger]"));
        if (staggerItems.length) {
            staggerItems.forEach(function (item, index) {
                item.style.setProperty("--stagger-delay", index * 110 + "ms");
                item.classList.add("stagger-in");
            });
        }

        const heroTitle = element.querySelector(".hero-title[data-typing]");
        if (heroTitle) {
            startHeadingTyping(heroTitle);
        }

        const heading = element.querySelector(".section-heading h2");
        if (heading) {
            startHeadingTyping(heading);
        }
    }

    const revealObserver =
        "IntersectionObserver" in window
            ? new IntersectionObserver(
                function (entries, observer) {
                    entries.forEach(function (entry) {
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

        elements.forEach(function (element) {
            revealObserver.observe(element);
        });
    }

    function escapeHtml(input) {
        return String(input)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function normalizeProjects(value) {
        if (Array.isArray(value)) {
            return value;
        }

        if (value && typeof value === "object") {
            return Object.values(value);
        }

        return [];
    }

    function buildProjectCard(project, index) {
        const title = escapeHtml(project.title || "Untitled Project");
        const description = escapeHtml(
            project.description || "No description available.",
        );
        const image = escapeHtml(project.image || "");
        const imageWidth = Number(project.imageWidth) || 1280;
        const imageHeight = Number(project.imageHeight) || 720;
        const gitHubLink = escapeHtml(project.gitHubLink || "#");
        const tags = Array.isArray(project.tags) ? project.tags : [];
        const tagsHtml = tags
            .map(function (tag) {
                return "<span>" + escapeHtml(tag) + "</span>";
            })
            .join("");
        const delay = Math.min(index * 75, 320);
        const animateDelay = Math.min(index * 80, 420) + "ms";
        const animationName =
            index % 3 === 1
                ? "animate__fadeInLeft"
                : index % 3 === 2
                    ? "animate__fadeInRight"
                    : "animate__fadeInUp";
        const cardId = "project-" + escapeHtml(project.id || index + 1);

        return (
            '<article class="project-card reveal" data-animate="' +
            animationName +
            '" data-animate-duration="760ms" data-animate-delay="' +
            animateDelay +
            '" style="transition-delay:' +
            delay +
            'ms" id="' +
            cardId +
            '" data-stagger>' +
            '<div class="project-image">' +
            '<img src="' +
            image +
            '" alt="' +
            title +
            ' preview" loading="lazy" decoding="async" width="' +
            imageWidth +
            '" height="' +
            imageHeight +
            '">' +
            "</div>" +
            '<div class="project-body">' +
            '<h3 class="project-title">' +
            title +
            "</h3>" +
            '<p class="project-description">' +
            description +
            "</p>" +
            '<div class="project-tags">' +
            tagsHtml +
            "</div>" +
            '<div class="project-links">' +
            '<a class="link-btn" href="' +
            gitHubLink +
            '" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github" aria-hidden="true"></i><span>GitHub</span></a>' +
            "</div>" +
            "</div>" +
            "</article>"
        );
    }

    function renderProjects() {
        if (!projectsGrid) {
            return;
        }

        const projectData = normalizeProjects(window.projects);

        if (!projectData.length) {
            projectsGrid.innerHTML =
                '<p class="no-projects">Projects will appear here soon.</p>';
            return;
        }

        projectsGrid.innerHTML = projectData
            .map(function (project, index) {
                return buildProjectCard(project, index);
            })
            .join("");

        Array.from(projectsGrid.querySelectorAll("img")).forEach(
            function (imageEl) {
                imageEl.addEventListener("error", function () {
                    const wrap = imageEl.closest(".project-image");
                    if (!wrap) {
                        return;
                    }

                    wrap.innerHTML =
                        '<div class="missing-image">Preview unavailable</div>';
                });

                imageEl.addEventListener("load", function () {
                    const wrap = imageEl.closest(".project-image");
                    if (wrap) {
                        wrap.classList.add("shimmer");
                        window.setTimeout(function () {
                            wrap.classList.remove("shimmer");
                        }, 1300);
                    }
                });
            },
        );

        registerRevealElements(projectsGrid);

        Array.from(projectsGrid.querySelectorAll(".project-tags")).forEach(
            function (tagGroup) {
                const tags = Array.from(tagGroup.querySelectorAll("span"));
                tags.forEach(function (tag, index) {
                    window.setTimeout(function () {
                        tag.classList.add("tag-in");
                    }, 120 + index * 80);
                });
            },
        );
    }

    function setupScrollProgress() {
        if (!scrollProgress) {
            return;
        }

        let ticking = false;

        function updateProgress() {
            const documentHeight =
                document.documentElement.scrollHeight - window.innerHeight;
            const ratio =
                documentHeight > 0
                    ? Math.min(window.scrollY / documentHeight, 1)
                    : 0;

            scrollProgress.style.transform =
                "scaleX(" + ratio.toFixed(4) + ")";
            ticking = false;
        }

        function queueUpdate() {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(updateProgress);
        }

        window.addEventListener("scroll", queueUpdate, { passive: true });
        window.addEventListener("resize", queueUpdate);
        updateProgress();
    }

    function trackActiveSection() {
        const sections = Array.from(document.querySelectorAll("main section[id]"));
        if (!sections.length || !navLinks.length) {
            return;
        }

        const linkMap = new Map(
            navLinks.map(function (link) {
                return [link.getAttribute("href") || "", link];
            }),
        );

        function setActiveSection(sectionId) {
            navLinks.forEach(function (link) {
                link.classList.remove("active");
            });

            const activeLink = linkMap.get("#" + sectionId);
            if (!activeLink) {
                return;
            }

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
        }

        const initialHash = String(window.location.hash || "").trim();
        if (initialHash && linkMap.has(initialHash)) {
            setActiveSection(initialHash.slice(1));
        } else {
            setActiveSection(sections[0].id);
        }

        if (!("IntersectionObserver" in window)) {
            return;
        }

        const sectionObserver = new IntersectionObserver(
            function (entries) {
                const visibleEntries = entries
                    .filter(function (entry) {
                        return entry.isIntersecting;
                    })
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

        sections.forEach(function (section) {
            sectionObserver.observe(section);
        });
    }

    function setupContactForm() {
        if (!contactForm || !formStatus) {
            return;
        }

        const emailInput = contactForm.querySelector('input[name="email"]');

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

        function createGlowField(field) {
            const wrapper = document.createElement("div");
            wrapper.className = "field-wrap";
            field.parentNode.insertBefore(wrapper, field);
            wrapper.appendChild(field);

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
            });

            field.addEventListener("mousemove", updateGlow);
            field.addEventListener("focus", function (event) {
                updateGlow(event);
            });
        }

        const fields = Array.from(
            contactForm.querySelectorAll("input[type=\"text\"], input[type=\"email\"], textarea"),
        );
        fields.forEach(createGlowField);

        if (emailInput) {
            emailInput.addEventListener("input", function () {
                if (emailInput.classList.contains("field-invalid") && isValidEmail(emailInput.value.trim())) {
                    emailInput.classList.remove("field-invalid");
                    setFormStatus("", "");
                }
            });
        }

        contactForm.setAttribute("novalidate", "novalidate");

        contactForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const name = String(formData.get("name") || "").trim();
            const email = String(formData.get("email") || "").trim();
            const message = String(formData.get("message") || "").trim();
            const targetEmail = String(contactForm.dataset.contactEmail || "").trim();
            if (emailInput) {
                emailInput.classList.remove("field-invalid");
            }

            if (!name || !email || !message) {
                setFormStatus("Please fill in all fields before sending.", "error");
                return;
            }

            if (!isValidEmail(email)) {
                if (emailInput) {
                    emailInput.classList.add("field-invalid");
                    emailInput.focus();
                }

                setFormStatus("That email doesn't look valid. Try format: name@example.com", "error");
                return;
            }

            if (!targetEmail || targetEmail === "your.email@example.com") {
                setFormStatus(
                    "Update data-contact-email in index.html to activate sending.",
                    "error",
                );
                return;
            }

            const subject = encodeURIComponent("Portfolio message from " + name);
            const body = encodeURIComponent(
                "Name: " + name + "\nEmail: " + email + "\n\n" + message,
            );
            window.location.href =
                "mailto:" + targetEmail + "?subject=" + subject + "&body=" + body;

            setFormStatus("Opening your email app...", "success");
            contactForm.reset();
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

        themeToggle.addEventListener("click", function () {
            const currentTheme =
                document.documentElement.getAttribute("data-theme") === "light"
                    ? "light"
                    : "dark";
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(nextTheme);
            saveTheme(nextTheme);
        });
    }

    function setupHeroTyping() {
        const target = document.querySelector(".hero-subtext[data-typing]");
        if (!target) {
            return;
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const fullText = String(target.dataset.text || target.textContent || "").trim();
        if (!fullText) {
            return;
        }

        if (prefersReducedMotion) {
            target.textContent = fullText;
            return;
        }

        target.textContent = "";
        target.classList.add("typing");

        let index = 0;
        const speed = 18;

        const intervalId = window.setInterval(function () {
            index += 1;
            target.textContent = fullText.slice(0, index);

            if (index >= fullText.length) {
                window.clearInterval(intervalId);
                target.classList.remove("typing");
            }
        }, speed);
    }

    function setupOutcomeCounters() {
        const counters = Array.from(document.querySelectorAll(".outcome-value[data-count]"));
        if (!counters.length) {
            return;
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
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

        const observer = "IntersectionObserver" in window
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

        counters.forEach(function (counter) {
            observer.observe(counter);
        });
    }

    function setupCursorTracker() {
        if (!cursorDot || !cursorRing) {
            return;
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const finePointer = window.matchMedia("(pointer: fine)").matches;
        if (!finePointer || prefersReducedMotion) {
            return;
        }

        const hoverSelector = "a, button, input, textarea, .project-card";
        let pointerX = -100;
        let pointerY = -100;
        let ringX = -100;
        let ringY = -100;

        document.body.classList.add("cursor-ready");

        function paintDot() {
            cursorDot.style.transform =
                "translate3d(" +
                pointerX +
                "px, " +
                pointerY +
                "px, 0) translate(-50%, -50%)";
        }

        function animateRing() {
            ringX += (pointerX - ringX) * 0.18;
            ringY += (pointerY - ringY) * 0.18;

            cursorRing.style.transform =
                "translate3d(" +
                ringX +
                "px, " +
                ringY +
                "px, 0) translate(-50%, -50%)";
            window.requestAnimationFrame(animateRing);
        }

        window.addEventListener("mousemove", function (event) {
            pointerX = event.clientX;
            pointerY = event.clientY;
            paintDot();
        });

        window.addEventListener("mouseout", function (event) {
            if (event.relatedTarget || event.toElement) {
                return;
            }

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

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

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
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        if (prefersReducedMotion) {
            return;
        }

        const blobs = Array.from(document.querySelectorAll(".bg-gradient"));
        if (!blobs.length) {
            return;
        }

        let ticking = false;

        function updateParallax() {
            const scrollTop = window.scrollY || window.pageYOffset || 0;
            const directionMultiplier = scrollTop * 0.08;

            blobs.forEach(function (blob, index) {
                const speed = Number(blob.dataset.parallax) || 0.12;
                const direction = index % 2 === 0 ? 1 : -1;
                const offsetY = directionMultiplier * speed;
                const offsetX = directionMultiplier * speed * 0.6 * direction;
                blob.style.setProperty("--parallax-x", offsetX.toFixed(2) + "px");
                blob.style.setProperty("--parallax-y", offsetY.toFixed(2) + "px");
            });

            ticking = false;
        }

        function requestUpdate() {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(updateParallax);
        }

        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);
        updateParallax();
    }

    function setupProject3D() {
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const finePointer = window.matchMedia("(pointer: fine)").matches;
        if (prefersReducedMotion || !finePointer) {
            return;
        }

        const cards = Array.from(document.querySelectorAll(".project-card"));
        if (!cards.length) {
            return;
        }

        cards.forEach(function (card) {
            let bounds = null;
            let targetX = 0;
            let targetY = 0;
            let currentX = 0;
            let currentY = 0;
            let rafId = null;

            function updateBounds() {
                bounds = card.getBoundingClientRect();
            }

            function animate() {
                currentX += (targetX - currentX) * 0.15;
                currentY += (targetY - currentY) * 0.15;
                card.style.transform =
                    "perspective(1200px) rotateX(" +
                    currentX.toFixed(2) +
                    "deg) rotateY(" +
                    currentY.toFixed(2) +
                    "deg) translateY(-6px) scale(1.02)";
                rafId = window.requestAnimationFrame(animate);
            }

            card.addEventListener("mouseenter", function () {
                updateBounds();
                targetX = 0;
                targetY = 0;
                if (!rafId) {
                    rafId = window.requestAnimationFrame(animate);
                }
            });

            card.addEventListener("mousemove", function (event) {
                if (!bounds || bounds.width === 0 || bounds.height === 0) {
                    return;
                }

                const relX = (event.clientX - bounds.left) / bounds.width;
                const relY = (event.clientY - bounds.top) / bounds.height;
                const tiltY = (relX - 0.5) * 10;
                const tiltX = (relY - 0.5) * -10;
                targetX = tiltX;
                targetY = tiltY;
            });

            card.addEventListener("mouseleave", function () {
                targetX = 0;
                targetY = 0;
                currentX = 0;
                currentY = 0;
                if (rafId) {
                    window.cancelAnimationFrame(rafId);
                    rafId = null;
                }
                card.style.transform = "";
            });

            window.addEventListener("resize", updateBounds);
        });
    }

    renderProjects();
    setupScrollProgress();
    trackActiveSection();
    setupContactForm();
    setupThemeToggle();
    setupHeroTyping();
    setupHeroParallax();
    setupProject3D();
    setupOutcomeCounters();
    setupCodeRain();
    setupCursorTracker();
    registerRevealElements(document);
})();
