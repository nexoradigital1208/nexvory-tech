/**
 * Configuración pública del formulario comercial.
 * La URL /exec de Apps Script es un endpoint público, no una credencial.
 */
window.NEXVORY_CRM_CONFIG = Object.freeze({
  // Despliegue de producción de captación web.
  endpoint: "https://script.google.com/macros/s/AKfycbz2OZmAVEvtvRpZOA7fDacpaPr10peXo9D0Tf2daz1xdKkE_MjcIF08-7iEfdI7h_mBQQ/exec",
  timeoutMs: 25000,
});
