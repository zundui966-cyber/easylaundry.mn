// security/passwordHash.js
// Нууц үгийг PBKDF2 алгоритмаар хэшлэх модуль

/**
 * Нууц үгийг хэшлэх
 * @param {string} password - Нууц үг
 * @returns {Promise<{salt: string, hash: string}>}
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 150000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);
  
  return {
    salt: saltArray.map(b => b.toString(16).padStart(2, '0')).join(''),
    hash: hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

/**
 * Нууц үгийг хадгалсан хэштэй харьцуулах
 * @param {string} password - Оруулсан нууц үг
 * @param {string} salt - Хадгалсан давс
 * @param {string} storedHash - Хадгалсан хэш
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, salt, storedHash) {
  const encoder = new TextEncoder();
  const saltBytes = new Uint8Array(salt.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 150000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const computedHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return computedHash === storedHash;
}

// Global functions for use in script.js
window.Security = window.Security || {};
window.Security.hashPassword = hashPassword;
window.Security.verifyPassword = verifyPassword;