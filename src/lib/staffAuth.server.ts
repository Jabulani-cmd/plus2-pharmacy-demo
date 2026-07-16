// Server-only staff credentials. Never import from client code.
// File name ends in `.server.ts` so the bundler excludes it from client bundles.
export const STAFF_PASSWORDS: Record<string, string> = {
  "sysadmin@kingspharmacy.co.zw": "SysAdmin1234!",
  "admin@kingspharmacy.co.zw": "Admin1234!",
  "pharmacist@kingspharmacy.co.zw": "Staff1234!",
  "manager@kingspharmacy.co.zw": "Staff1234!",
  "dispatcher@kingspharmacy.co.zw": "Staff1234!",
  "dispatcher.6thave@kingspharmacy.co.zw": "Staff1234!",
  "dispatcher.oldmutual@kingspharmacy.co.zw": "Staff1234!",
  "dispatcher.ascot@kingspharmacy.co.zw": "Staff1234!",
  "cashier@kingspharmacy.co.zw": "Staff1234!",
  "inventory@kingspharmacy.co.zw": "Staff1234!",
};

export function verifyStaffPasswordServer(email: string, password: string): boolean {
  const expected = STAFF_PASSWORDS[email.toLowerCase()];
  if (!expected) return false;
  // Constant-time-ish compare
  if (expected.length !== password.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ password.charCodeAt(i);
  return diff === 0;
}