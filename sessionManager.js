// security/sessionManager.js
// Session болон Local storage-ийн аюулгүй удирдлага

/**
 * Бүрэн аюулгүй гарах үйлдэл
 * - localStorage цэвэрлэх
 * - sessionStorage цэвэрлэх
 * - Cookies устгах
 * - Хуудсыг дахин ачаалах
 */
function secureLogout() {
  // 1. Хэрэглэгчийн мэдээллийг устгах
  localStorage.removeItem('el_current_user');
  localStorage.removeItem('el_token');
  
  // 2. Бүх localStorage-г цэвэрлэх (болгоомжтой)
  // Зөвхөн EL-ээс эхэлсэн түлхүүрүүдийг устгах
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('el_') || key === 'currentUser')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // 3. sessionStorage цэвэрлэх
  sessionStorage.clear();
  
  // 4. Cookies устгах
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    }
  });
  
  // 5. Хэрэглэгчийн UI-г шинэчлэх
  const userBar = document.getElementById('userInfoBar');
  const loginBtn = document.getElementById('loginBtn');
  const myBookingsSection = document.getElementById('myBookingsSection');
  
  if (userBar) userBar.classList.remove('show');
  if (loginBtn) loginBtn.style.display = '';
  if (myBookingsSection) myBookingsSection.style.display = 'none';
  
  // 6. Захиалгын state-г дахин тохируулах
  if (window.booking) {
    window.booking = { location: null, machine: null, mode: null, date: null, time: null };
  }
  if (window.currentStep) window.currentStep = 1;
  
  // 7. Хуудсыг дахин ачаалах (цэвэр төлөвт оруулах)
  // showToast ашиглах (хэрэв функц байгаа бол)
  if (typeof showToast === 'function') {
    showToast('Амжилттай гарлаа', 'success');
  }
  
  // 8. Хуудасны зарим хэсгийг дахин рендер хийх
  setTimeout(() => {
    if (typeof renderCurrentStep === 'function') {
      renderCurrentStep();
    }
    if (typeof renderHeroCard === 'function') {
      renderHeroCard();
    }
  }, 100);
  
  // Security log
  console.log('[SECURITY] User logged out, all storage cleared');
}

/**
 * Сессийн хугацааг шалгах
 * @returns {boolean}
 */
function isSessionValid() {
  const user = localStorage.getItem('el_current_user');
  const token = localStorage.getItem('el_token');
  const loginTime = localStorage.getItem('el_login_time');
  
  if (!user || !token) return false;
  
  // 24 цагийн дараа session expired
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime);
    const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    if (elapsed > SESSION_DURATION) {
      secureLogout();
      return false;
    }
  }
  
  return true;
}

/**
 * Session шинэчлэх (keep-alive)
 */
function refreshSession() {
  if (localStorage.getItem('el_current_user')) {
    localStorage.setItem('el_login_time', Date.now().toString());
  }
}

/**
 * Гарах товчийг тохируулах
 */
function initLogoutButton() {
  const logoutBtn = document.getElementById('cn-logout-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  const adminLogoutBtn = document.querySelector('.btn-logout-sb');
  
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      secureLogout();
    };
  }
  
  if (mobileLogoutBtn) {
    mobileLogoutBtn.onclick = (e) => {
      e.preventDefault();
      secureLogout();
    };
  }
  
  if (adminLogoutBtn) {
    // Admin panel-д зориулсан logout
    adminLogoutBtn.onclick = (e) => {
      e.preventDefault();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'admin-index.html';
    };
  }
}

// Auto-init when DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initLogoutButton();
    // Session validity check every minute
    setInterval(() => {
      if (!isSessionValid()) {
        secureLogout();
      }
    }, 60000);
  });
}

window.Security = window.Security || {};
window.Security.secureLogout = secureLogout;
window.Security.isSessionValid = isSessionValid;
window.Security.refreshSession = refreshSession;
window.Security.initLogoutButton = initLogoutButton;