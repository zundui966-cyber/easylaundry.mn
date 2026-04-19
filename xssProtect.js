// security/xssProtect.js
// XSS (Cross-Site Scripting) халдлагаас хамгаалах модуль

/**
 * HTML тусгай тэмдэгтүүдийг escape хийх
 * @param {any} str - Оролтын өгөгдөл
 * @returns {string} - Аюулгүй мөр
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * HTML доторх атрибутын утгыг escape хийх
 * @param {string} str
 * @returns {string}
 */
function escapeAttribute(str) {
  return escapeHtml(str).replace(/&quot;/g, '&#34;');
}

/**
 * JavaScript мөр дотор аюулгүйгээр оруулах
 * @param {string} str
 * @returns {string}
 */
function escapeJsString(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * URL параметрт аюулгүйгээр оруулах
 * @param {string} str
 * @returns {string}
 */
function escapeUrlParam(str) {
  return encodeURIComponent(String(str));
}

/**
 * DOM элемент үүсгэх үед аюулгүйгээр textContent ашиглах
 * @param {string} tagName
 * @param {string} text
 * @param {object} attributes
 * @returns {HTMLElement}
 */
function createSafeElement(tagName, text, attributes = {}) {
  const el = document.createElement(tagName);
  el.textContent = text; // XSS-ээс хамгаалсан
  
  for (const [key, value] of Object.entries(attributes)) {
    el.setAttribute(key, escapeAttribute(value));
  }
  
  return el;
}

window.Security = window.Security || {};
window.Security.escapeHtml = escapeHtml;
window.Security.escapeAttribute = escapeAttribute;
window.Security.escapeJsString = escapeJsString;
window.Security.escapeUrlParam = escapeUrlParam;
window.Security.createSafeElement = createSafeElement;

// Global function for backward compatibility
window.escapeHtml = escapeHtml;