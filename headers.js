// security/headers.js
// HTTP Security Headers - CSP болон бусад хамгаалалтын толгой хэсгүүд

/**
 * Аюулгүй байдлын HTTP толгой хэсгүүдийг тохируулах
 * Энэ функцийг сервер талд (Express.js) ашиглана
 */
function getSecurityHeaders() {
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com 'strict-dynamic'",
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.qpay.mn",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join('; ');
  
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()',
    'X-XSS-Protection': '1; mode=block',
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache'
  };
}

/**
 * Meta тагуудаар CSP хэрэгжүүлэх (client-side fallback)
 */
function applyMetaSecurityHeaders() {
  // CSP meta tag (limited support)
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;";
  document.head.appendChild(meta);
  
  // Referrer policy
  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerMeta);
}

// Apply immediately when script loads
if (typeof document !== 'undefined') {
  applyMetaSecurityHeaders();
}

window.Security = window.Security || {};
window.Security.getSecurityHeaders = getSecurityHeaders;