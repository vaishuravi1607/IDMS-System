export function isPasswordStrong(password) {
  if (typeof password !== "string" || password.length < 8) return false;
  return /[A-Z]/.test(password) && /\d/.test(password);
}

export const PASSWORD_REQUIREMENT_TEXT =
  "Password must be at least 8 characters and include one uppercase letter and one number.";
