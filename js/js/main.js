(() => {
  const INTRO_STORAGE_KEY = "albor_intro_seen_v1";

  const introEl = document.getElementById("intro");
  const introVideo = document.getElementById("introVideo");
  const skipIntroBtn = document.getElementById("skipIntro");
  const progressBar = document.getElementById("introProgressBar");

  const menuToggleBtn = document.getElementById("menuToggle");
  const menuCloseBtn = document.getElementById("menuClose");
  const menuOverlay = document.getElementById("menuOverlay");

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let introDismissed = false;
  let lastFocusedBeforeMenu = null;

  /* 1. INTRO AUDIOVISUAL CON RESCATE EN MÓVIL */
  function finishIntro({ immediate = false, markSeen = true } = {}) {
    if (introDismissed) return;
    introDismissed = true;

    if (markSeen) {
      try { sessionStorage.setItem(INTRO_STORAGE_KEY, "1"); } catch (_) {}
    }
    if (introVideo && !introVideo.paused) introVideo.pause();
    if (!introEl) return;

    if (immediate || reducedMotionQuery.matches) {
      introEl.classList.add("is-done");
      return;
    }

    introEl.classList.add("is-leaving");
    const onTransitionEnd = (event) => {
      if (event.target !== introEl) return;
      introEl.classList.add("is-done");
      introEl.removeEventListener("transitionend", onTransitionEnd);
    };
    introEl.addEventListener("transitionend", onTransitionEnd);
    window.setTimeout(() => introEl.classList.add("is-done"), 700);
  }

  function updateIntroProgress() {
    if (!introVideo || !progressBar || !introVideo.duration) return;
    const pct = Math.min(100, Math.max(0, (introVideo.currentTime / introVideo.duration) * 100));
    progressBar.style.width = `${pct}%`;
  }

  function initIntro() {
    if (!introEl) return;

    let alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem(INTRO_STORAGE_KEY) === "1"; } catch (_) {}

    if (alreadySeen || reducedMotionQuery.matches) {
      finishIntro({ immediate: true, markSeen: false });
      return;
    }

    if (skipIntroBtn) {
      skipIntroBtn.addEventListener("click", () => {
        finishIntro({ immediate: false, markSeen: true });
        if (menuToggleBtn) menuToggleBtn.focus({ preventScroll: true });
      });
    }

    if (introVideo) {
      introVideo.muted = true;
      introVideo.playsInline = true;
      introVideo.addEventListener("timeupdate", updateIntroProgress);
      introVideo.addEventListener("ended", () => finishIntro({ immediate: false, markSeen: true }));
      introVideo.addEventListener("error", () => finishIntro({ immediate: true, markSeen: false }));

      const sourceEl = introVideo.querySelector("source");
      if (sourceEl) {
        sourceEl.addEventListener("error", () => finishIntro({ immediate: true, markSeen: false }));
      }

      // Si el navegador móvil bloquea autoplay o tarda demasiado, nunca deja al usuario atrapado
      const fallbackTimer = window.setTimeout(() => {
        if (introVideo.paused || introVideo.readyState < 2) {
          finishIntro({ immediate: false, markSeen: false });
        }
      }, 4500);

      introVideo.addEventListener("playing", () => window.clearTimeout(fallbackTimer), { once: true });

      const playPromise = introVideo.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          window.clearTimeout(fallbackTimer);
          finishIntro({ immediate: true, markSeen: false });
        });
      }
    } else {
      finishIntro({ immediate: true, markSeen: false });
    }
  }

  /* 2. MENÚ OVERLAY */
  function isMenuOpen() {
    return Boolean(menuOverlay && menuOverlay.classList.contains("is-open"));
  }

  function openMenu() {
    if (!menuOverlay || !menuToggleBtn || isMenuOpen()) return;
    lastFocusedBeforeMenu = document.activeElement;
    menuOverlay.classList.add("is-open");
    menuOverlay.setAttribute("aria-hidden", "false");
    menuOverlay.removeAttribute("inert");
    menuToggleBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-locked");
    if (menuCloseBtn) menuCloseBtn.focus({ preventScroll: true });
  }

  function closeMenu({ restoreFocus = true } = {}) {
    if (!menuOverlay || !menuToggleBtn || !isMenuOpen()) return;
    menuOverlay.classList.remove("is-open");
    menuOverlay.setAttribute("aria-hidden", "true");
    menuOverlay.setAttribute("inert", "");
    menuToggleBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");

    if (restoreFocus) {
      const target = lastFocusedBeforeMenu && typeof lastFocusedBeforeMenu.focus === "function"
        ? lastFocusedBeforeMenu
        : menuToggleBtn;
      target.focus({ preventScroll: true });
    }
    lastFocusedBeforeMenu = null;
  }

  function initMenu() {
    if (menuToggleBtn) {
      menuToggleBtn.addEventListener("click", () => (isMenuOpen() ? closeMenu() : openMenu()));
    }
    if (menuCloseBtn) menuCloseBtn.addEventListener("click", () => closeMenu());
    if (menuOverlay) {
      menuOverlay.addEventListener("click", (event) => {
        if (event.target.classList.contains("menu-overlay__backdrop")) closeMenu();
      });
      menuOverlay.querySelectorAll("[data-menu-link]").forEach((link) => {
        link.addEventListener("click", () => closeMenu({ restoreFocus: false }));
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isMenuOpen()) {
        event.preventDefault();
        closeMenu();
      }
    });
  }

  /* 3. MODAL DE PROYECTOS */
  const PROJECTS_DATA = [
    {
      kicker: "01 · ATMÓSFERA URBANA · 2026",
      title: "Territorio Urbano & Reflejos",
      desc: "Observación de arquitectura contemporánea, espacio abierto y luz natural como base gráfica para ALBOR.",
      img: "assets/img/proyecto-01.webp",
      alt: "Fotografía arquitectónica urbana",
      tags: ["Dirección visual", "Fotografía", "Entorno"]
    },
    {
      kicker: "02 · EXPLORACIÓN 3D · 2026",
      title: "Volúmenes Carmesí",
      desc: "Investigación de relieves orgánicos, iluminación rasante y materialidad táctil antes de su fabricación física.",
      img: "assets/img/proyecto-02.webp",
      alt: "Render escultórico orgánico en tonos carmesí",
      tags: ["Modelado 3D", "Textura", "Prototipo"]
    },
    {
      kicker: "03 · OBJETO & FORMA · 2026",
      title: "Carácter Volumétrico",
      desc: "Búsqueda expresiva y lúdica desde el volumen digital, probando proporciones y color saturado.",
      img: "assets/img/proyecto-03.webp",
      alt: "Escultura 3D en tono amarillo cálido",
      tags: ["Volumen", "Color", "Diseño de autor"]
    },
    {
      kicker: "04 · COLLAGE GRÁFICO · 2026",
      title: "Ventanas Circulares",
      desc: "Composición que cruza fotografía botánica con recortes circulares, bloques de color y líneas geométricas.",
      img: "assets/img/proyecto-04.webp",
      alt: "Collage gráfico con recorte circular botánico",
      tags: ["Collage digital", "Gráfica", "Composición"]
    }
  ];

  function initProjectsModal() {
    const modal = document.getElementById("projectModal");
    const closeBtn = document.getElementById("closeProjectModal");
    const modalMedia = document.getElementById("modalProjectMedia");
    const modalImg = document.getElementById("modalProjectImg");
    const modalKicker = document.getElementById("modalProjectKicker");
    const modalTitle = document.getElementById("modalProjectTitle");
    const modalDesc = document.getElementById("modalProjectDesc");
    const modalTags = document.getElementById("modalProjectTags");

    if (!modal) return;
    let lastTrigger = null;

    document.querySelectorAll("[data-project-index]").forEach((card) => {
      const btn = card.querySelector(".project-card__trigger");
      if (!btn) return;
      btn.addEventListener("click", () => {
        const idx = Number(card.getAttribute("data-project-index"));
        const item = PROJECTS_DATA[idx];
        if (!item) return;

        lastTrigger = btn;
        modalKicker.textContent = item.kicker;
        modalTitle.textContent = item.title;
        modalDesc.textContent = item.desc;

        modalMedia.classList.remove("is-missing");
        modalImg.src = item.img;
        modalImg.alt = item.alt;
        modalImg.onerror = () => modalMedia.classList.add("is-missing");

        modalTags.innerHTML = item.tags.map((tag) => `<li>${tag}</li>`).join("");

        if (typeof modal.showModal === "function") modal.showModal();
        else modal.setAttribute("open", "");
      });
    });

    function closeProjectModal() {
      if (typeof modal.close === "function") modal.close();
      else modal.removeAttribute("open");
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    }

    if (closeBtn) closeBtn.addEventListener("click", closeProjectModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeProjectModal();
    });
  }

  /* 4. FORMULARIO DE CONTACTO DIRECTO (SIN BACKEND) */
  function initContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("contactStatus");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      status.textContent = "Completa tu nombre, correo y mensaje para continuar.";
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    status.textContent = "Enviando mensaje...";
    if (submitBtn) submitBtn.disabled = true;

    try {
          const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
          });
          const result = await response.json(); 
          
      if (result.success) {
        status.textContent = "¡Mensaje enviado! Gracias por escribir a ALBOR.";
        form.reset();
      } else {
  status.textContent = result.message || "Error al enviar.";
}
    } catch (_) {
      status.textContent = "Error de conexión. Revisa tu red o usa nuestros canales directos.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

  initIntro();
  initMenu();
  initProjectsModal();
  initContactForm();
})();
