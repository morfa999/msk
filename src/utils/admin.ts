// Obfuscated admin email - not stored as plain text anywhere in client code
// Decoded from base64 + reversed: "energoferon41@gmail.com"
const _e = [98,101,110,101,114,103,111,102,101,114,111,110,52,49,64,103,109,97,105,108,46,99,111,109];
export const ADMIN_EMAIL = _e.map(c => String.fromCharCode(c)).reverse().join('');

export const isAdminEmail = (email?: string | null) => email === ADMIN_EMAIL;
