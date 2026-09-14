const cards = [...document.querySelectorAll(".project-card")];
const projectMenu = document.querySelector(".project-menu");
const zoomButton = projectMenu.querySelector('[data-action="zoom"]');
const openLink = projectMenu.querySelector('[data-action="open"]');
const privateState = projectMenu.querySelector(".private-state");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const closeLightboxButton = lightbox.querySelector(".lightbox-close");
const cursorGlow = document.querySelector(".cursor-glow");
let activeCard = null;
let lastFocusedElement = null;

// Número en formato internacional: código de país + número, sin +, espacios ni símbolos.
const WHATSAPP_NUMBER = "51921584279";
const WHATSAPP_MESSAGE = "Hola, quiero más información, estoy interesado en sus proyectos.";
document.querySelector("#whatsapp-link").href =
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

document.querySelector("#year").textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px" },
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
  revealObserver.observe(element);
});

// Evita contenido oculto si el navegador restaura la página directamente en un ancla.
window.setTimeout(() => {
  document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => {
    element.classList.add("is-visible");
  });
}, 1200);

function positionMenu(card, pointerEvent) {
  const rect = card.getBoundingClientRect();
  const menuHalfWidth = 145;
  const menuHalfHeight = 70;
  const preferredX = pointerEvent?.clientX ?? rect.left + rect.width / 2;
  const preferredY = pointerEvent?.clientY ?? rect.top + Math.min(rect.height / 2, 220);
  const x = Math.max(menuHalfWidth + 12, Math.min(window.innerWidth - menuHalfWidth - 12, preferredX));
  const y = Math.max(menuHalfHeight + 12, Math.min(window.innerHeight - menuHalfHeight - 12, preferredY));
  projectMenu.style.left = `${x}px`;
  projectMenu.style.top = `${y}px`;
}

function openMenu(card, event) {
  if (activeCard === card && projectMenu.classList.contains("is-open")) {
    closeMenu();
    return;
  }
  activeCard = card;
  positionMenu(card, event);
  const isPrivate = card.dataset.private === "true";
  openLink.hidden = isPrivate;
  privateState.classList.toggle("is-visible", isPrivate);
  if (!isPrivate) openLink.href = card.dataset.url;
  projectMenu.classList.add("is-open");
  projectMenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("menu-open");
}

function closeMenu() {
  projectMenu.classList.remove("is-open");
  projectMenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("menu-open");
  activeCard = null;
}

function openLightbox() {
  if (!activeCard) return;
  lastFocusedElement = document.activeElement;
  lightboxImage.src = activeCard.dataset.image;
  lightboxImage.alt = `Vista ampliada de ${activeCard.querySelector("h3").textContent}`;
  closeMenu();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  closeLightboxButton.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  window.setTimeout(() => { lightboxImage.src = ""; }, 450);
  lastFocusedElement?.focus();
}

cards.forEach((card) => {
  const visual = card.querySelector(".project-visual");

  card.addEventListener("click", (event) => {
    event.preventDefault();
    openMenu(card, event);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu(card);
    }
  });

  card.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 5;
    const rotateX = (0.5 - y) * 5;
    visual.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    visual.style.setProperty("--glare-x", `${x * 100}%`);
    visual.style.setProperty("--glare-y", `${y * 100}%`);
  });

  card.addEventListener("pointerleave", () => {
    visual.style.transform = "";
  });
});

zoomButton.addEventListener("click", openLightbox);
openLink.addEventListener("click", () => window.setTimeout(closeMenu, 80));
closeLightboxButton.addEventListener("click", closeLightbox);

document.addEventListener("pointerdown", (event) => {
  if (!projectMenu.contains(event.target) && !event.target.closest(".project-card")) closeMenu();
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (lightbox.classList.contains("is-open")) closeLightbox();
    else closeMenu();
  }
});

window.addEventListener("resize", closeMenu);
window.addEventListener("scroll", closeMenu, { passive: true });

window.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  cursorGlow.animate(
    { left: `${event.clientX}px`, top: `${event.clientY}px` },
    { duration: 900, fill: "forwards", easing: "cubic-bezier(.22,1,.36,1)" },
  );
});
