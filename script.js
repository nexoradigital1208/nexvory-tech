const cards = [...document.querySelectorAll(".project-card")];
const projectMenu = document.querySelector(".project-menu");
const zoomButton = projectMenu.querySelector('[data-action="zoom"]');
const openLink = projectMenu.querySelector('[data-action="open"]');
const similarButton = projectMenu.querySelector('[data-action="similar"]');
const privateState = projectMenu.querySelector(".private-state");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const closeLightboxButton = lightbox.querySelector(".lightbox-close");
const cursorGlow = document.querySelector(".cursor-glow");
const quoteForm = document.querySelector("#quote-form");
const formStatus = document.querySelector("#form-status");
const quoteSubmitButton = quoteForm.querySelector(".submit-button");
const quoteWhatsAppLink = document.querySelector("#quote-whatsapp-link");
const crmResponseFrame = document.querySelector("#crm-response-frame");
const crmConfig = window.NEXVORY_CRM_CONFIG || {};
let activeCard = null;
let lastFocusedElement = null;
let formStartedAt = Date.now();
let pendingCrmSubmission = null;
let crmResponseTimeout = 0;

// Número en formato internacional: código de país + número, sin +, espacios ni símbolos.
const WHATSAPP_NUMBER = "51921584279";
const WHATSAPP_MESSAGE = "Hola, equipo de Nexvory Tech. 👋 Estoy interesado en sus servicios tecnológicos y quisiera recibir más información.";
const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

function createWhatsAppUrl(message) {
  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message.trim())}`;
}

function openWhatsApp(message) {
  window.open(createWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

document.querySelector("#whatsapp-link").href = createWhatsAppUrl(WHATSAPP_MESSAGE);
document.querySelectorAll(".js-whatsapp").forEach((link) => {
  link.href = createWhatsAppUrl(link.dataset.message || WHATSAPP_MESSAGE);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

document.querySelectorAll(".service-card").forEach((card) => {
  card.querySelector(".service-link").addEventListener("click", () => {
    const message = `Hola, equipo de Nexvory Tech. Estoy interesado en ${card.dataset.service}. Me gustaría solicitar información y una cotización.\n\nOrigen: Página web de Nexvory Tech.`;
    openWhatsApp(message);
  });
});

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
  const menuHalfHeight = 108;
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
similarButton.addEventListener("click", () => {
  if (!activeCard) return;
  const projectName = activeCard.querySelector("h3").textContent.trim();
  openWhatsApp(`Hola, equipo de Nexvory Tech. Estoy interesado en desarrollar un proyecto similar a ${projectName}. Me gustaría recibir información y una cotización.\n\nOrigen: Página web de Nexvory Tech.`);
  closeMenu();
});
closeLightboxButton.addEventListener("click", closeLightbox);

function getLeadData(formData) {
  return {
    name: formData.get("name").trim(),
    company: formData.get("company").trim(),
    email: formData.get("email").trim(),
    phone: formData.get("phone").trim(),
    service: formData.get("service").trim(),
    budget: formData.get("budget").trim(),
    timeline: formData.get("timeline").trim(),
    description: formData.get("description").trim(),
    source: "Página web de Nexvory Tech",
    createdAt: new Date().toISOString(),
    commercialStatus: "Cliente nuevo",
  };
}

function createSubmissionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function getCrmEndpoint() {
  const endpoint = String(crmConfig.endpoint || "").trim();
  return /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(endpoint)
    ? endpoint
    : "";
}

function getLeadFingerprint(lead) {
  return JSON.stringify([
    lead.name,
    lead.company,
    lead.email,
    lead.phone,
    lead.service,
    lead.budget,
    lead.timeline,
    lead.description,
  ]);
}

function buildQuoteWhatsAppMessage(lead) {
  return `Hola, equipo de Nexvory Tech.

Mi solicitud ya fue registrada en su página web y quisiera continuar con la cotización.

Nombre: ${lead.name}
Empresa: ${lead.company || "No indicada"}
Correo: ${lead.email}
WhatsApp: ${lead.phone}
Servicio solicitado: ${lead.service}
Presupuesto estimado: ${lead.budget || "Por definir"}
Plazo aproximado: ${lead.timeline || "Por definir"}
Descripción del proyecto: ${lead.description}

Origen: ${lead.source}.`;
}

function setFormStatus(message, state = "") {
  formStatus.textContent = message;
  formStatus.classList.toggle("is-success", state === "success");
  formStatus.classList.toggle("is-pending", state === "pending");
}

function setQuoteControlsDisabled(disabled) {
  quoteForm.querySelectorAll("input, select, textarea").forEach((control) => {
    control.disabled = disabled;
  });
  quoteSubmitButton.disabled = disabled;
  quoteForm.setAttribute("aria-busy", disabled.toString());
}

function setSubmitButtonLabel(label, arrow = "→") {
  quoteSubmitButton.innerHTML = `${label} <span>${arrow}</span>`;
}

function isTrustedAppsScriptOrigin(origin) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      hostname === "script.google.com" ||
      hostname === "script.googleusercontent.com" ||
      hostname.endsWith("-script.googleusercontent.com")
    );
  } catch {
    return false;
  }
}

function isResponseFrameWindow(source) {
  if (!source || source === window || !crmResponseFrame.contentWindow) return false;
  const windowsToInspect = [{ frameWindow: crmResponseFrame.contentWindow, depth: 0 }];

  while (windowsToInspect.length) {
    const current = windowsToInspect.shift();
    if (current.frameWindow === source) return true;
    if (current.depth >= 3) continue;

    try {
      for (let index = 0; index < current.frameWindow.length; index += 1) {
        windowsToInspect.push({ frameWindow: current.frameWindow.frames[index], depth: current.depth + 1 });
      }
    } catch {
      // Apps Script utiliza marcos cross-origin; nunca se inspecciona su contenido.
    }
  }

  return false;
}

function submitLeadToCrm(lead, submissionId) {
  const endpoint = getCrmEndpoint();
  if (!endpoint) {
    setFormStatus("Falta configurar el endpoint seguro del CRM antes de enviar.");
    return;
  }

  const fingerprint = getLeadFingerprint(lead);
  pendingCrmSubmission = { submissionId, fingerprint, lead, inFlight: true };
  setQuoteControlsDisabled(true);
  setSubmitButtonLabel("Registrando…", "");
  quoteWhatsAppLink.hidden = true;
  setFormStatus("Registrando tu solicitud de forma segura…", "pending");

  const outboundForm = document.createElement("form");
  outboundForm.method = "POST";
  outboundForm.action = endpoint;
  outboundForm.target = crmResponseFrame.name;
  outboundForm.hidden = true;

  const fields = {
    submissionId,
    pageOrigin: window.location.origin,
    formStartedAt: String(formStartedAt),
    website: quoteForm.elements.website.value,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    email: lead.email,
    service: lead.service,
    budget: lead.budget,
    timeline: lead.timeline,
    description: lead.description,
    privacyAccepted: quoteForm.elements.privacy.checked ? "true" : "false",
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value || "");
    outboundForm.append(input);
  });

  document.body.append(outboundForm);
  window.clearTimeout(crmResponseTimeout);
  crmResponseTimeout = window.setTimeout(() => {
    if (!pendingCrmSubmission || pendingCrmSubmission.submissionId !== submissionId) return;
    pendingCrmSubmission.inFlight = false;
    setQuoteControlsDisabled(false);
    setSubmitButtonLabel("Reintentar registro");
    setFormStatus("No pudimos verificar el registro. Revisa tu conexión e intenta nuevamente.");
  }, Number(crmConfig.timeoutMs) || 25000);

  outboundForm.submit();
  outboundForm.remove();
}

function validateQuoteForm() {
  let firstInvalid = null;
  quoteForm.querySelectorAll(".form-field").forEach((field) => {
    const control = field.querySelector("input, select, textarea");
    const error = field.querySelector(".field-error");
    let message = "";
    const value = control.value.trim();

    if (control.required && !value) message = "Este campo es obligatorio.";
    else if (control.type === "email" && !control.validity.valid) message = "Ingresa un correo electrónico válido.";
    else if (control.name === "phone" && !/^[0-9+() -]{7,20}$/.test(value)) message = "Ingresa un número de teléfono válido.";
    else if (!control.validity.valid) message = "Revisa el formato de este campo.";

    field.classList.toggle("is-invalid", Boolean(message));
    control.setAttribute("aria-invalid", Boolean(message).toString());
    error.textContent = message;
    if (message && !firstInvalid) firstInvalid = control;
  });

  const privacy = quoteForm.elements.privacy;
  if (!privacy.checked && !firstInvalid) firstInvalid = privacy;
  return firstInvalid;
}

quoteForm.addEventListener("input", (event) => {
  const field = event.target.closest(".form-field");
  if (field) {
    field.classList.remove("is-invalid");
    field.querySelector(".field-error").textContent = "";
    event.target.removeAttribute("aria-invalid");
  }
  if (!pendingCrmSubmission?.inFlight) {
    pendingCrmSubmission = null;
    quoteWhatsAppLink.hidden = true;
    quoteSubmitButton.disabled = false;
    setSubmitButtonLabel("Registrar solicitud");
    setFormStatus("");
  }
});

quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const firstInvalid = validateQuoteForm();
  if (firstInvalid || !quoteForm.elements.privacy.checked) {
    setFormStatus(!quoteForm.elements.privacy.checked
      ? "Completa los campos obligatorios y acepta el uso de datos para continuar."
      : "Revisa los campos señalados antes de continuar.");
    (firstInvalid || quoteForm.elements.privacy).focus();
    return;
  }

  const lead = getLeadData(new FormData(quoteForm));
  const fingerprint = getLeadFingerprint(lead);
  const submissionId = pendingCrmSubmission?.fingerprint === fingerprint
    ? pendingCrmSubmission.submissionId
    : createSubmissionId();
  submitLeadToCrm(lead, submissionId);
});

window.addEventListener("message", (event) => {
  if (!pendingCrmSubmission?.inFlight) return;
  if (!isTrustedAppsScriptOrigin(event.origin)) return;
  if (!isResponseFrameWindow(event.source)) {
    console.warn("Se ignoró una respuesta del CRM emitida por una ventana inesperada.");
    return;
  }

  const result = event.data;
  if (!result || result.type !== "nexvory-crm-result") return;
  if (result.requestId !== pendingCrmSubmission.submissionId) return;

  window.clearTimeout(crmResponseTimeout);
  pendingCrmSubmission.inFlight = false;
  setQuoteControlsDisabled(false);

  if (result.ok === true && result.registered === true) {
    const lead = pendingCrmSubmission.lead;
    quoteWhatsAppLink.href = createWhatsAppUrl(buildQuoteWhatsAppMessage(lead));
    quoteWhatsAppLink.hidden = false;
    quoteSubmitButton.disabled = true;
    setSubmitButtonLabel("Solicitud registrada", "✓");
    setFormStatus(
      result.duplicate
        ? "Tu solicitud ya estaba registrada. Puedes continuar por WhatsApp."
        : "¡Solicitud registrada correctamente! Puedes continuar por WhatsApp.",
      "success",
    );
    return;
  }

  setSubmitButtonLabel("Reintentar registro");
  setFormStatus(result.message || "El CRM no pudo confirmar el registro. Intenta nuevamente.");
});

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
