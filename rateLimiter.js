// security/rateLimiter.js
// Brute-force халдлагаас хамгаалах модуль

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 минут

const loginAttempts = {};

/**
 * Нэвтрэлтийн хязгаарлалтыг шалгах
 * @param {string} userId - Хэрэглэгчийн ID эсвэл IP
 * @returns {{allowed: boolean, remainingMs?: number}}
 */
function checkRateLimit(userId) {
  const now = Date.now();
  
  if (!loginAttempts[userId]) {
    loginAttempts[userId] = { count: 0, lockedUntil: 0 };
  }
  
  const record = loginAttempts[userId];
  
  if (record.lockedUntil > now) {
    return {
      allowed: false,
      remainingMs: record.lockedUntil - now,
      remainingMinutes: Math.ceil((record.lockedUntil - now) / 60000)
    };
  }
  
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    return {
      allowed: false,
      remainingMs: LOCKOUT_DURATION_MS,
      remainingMinutes: 15
    };
  }
  
  return { allowed: true };
}

/**
 * Амжилтгүй оролдлогыг бүртгэх
 * @param {string} userId
 */
function recordFailedAttempt(userId) {
  if (!loginAttempts[userId]) {
    loginAttempts[userId] = { count: 0, lockedUntil: 0 };
  }
  loginAttempts[userId].count++;
  
  // Security log (console эсвэл server руу илгээж болно)
  console.warn(`[SECURITY] Failed login attempt for ${userId} - Attempt #${loginAttempts[userId].count}`);
}

/**
 * Амжилттай нэвтрэлтийн дараа оролдлогыг дахин тохируулах
 * @param {string} userId
 */
function resetAttempts(userId) {
  delete loginAttempts[userId];
  console.log(`[SECURITY] Login attempts reset for ${userId}`);
}

/**
 * Хэрэглэгчийн үлдсэн оролдлогын тоог авах
 * @param {string} userId
 * @returns {number}
 */
function getRemainingAttempts(userId) {
  if (!loginAttempts[userId]) return MAX_LOGIN_ATTEMPTS;
  if (loginAttempts[userId].lockedUntil > Date.now()) return 0;
  return Math.max(0, MAX_LOGIN_ATTEMPTS - loginAttempts[userId].count);
}

window.Security = window.Security || {};
window.Security.checkRateLimit = checkRateLimit;
window.Security.recordFailedAttempt = recordFailedAttempt;
window.Security.resetAttempts = resetAttempts;
window.Security.getRemainingAttempts = getRemainingAttempts;
window.Security.MAX_LOGIN_ATTEMPTS = MAX_LOGIN_ATTEMPTS;