// Shared input checks for the booking and contact forms.
// Plain functions with no Firebase or DOM code, so they can be tested on their own.

// Local part: letters, digits and the usual symbols, with single dots between parts
// (no leading, trailing or double dots). Domain: labels of letters, digits and hyphens
// (not starting or ending with a hyphen), then a letters-only ending of 2 to 24 characters.
export const EMAIL_RE =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

// Common misspellings of popular email domains and endings.
const DOMAIN_TYPOS = {
  "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmai.com": "gmail.com",
  "gnail.com": "gmail.com", "gmaill.com": "gmail.com", "gmail.co": "gmail.com",
  "gmail.con": "gmail.com", "gmail.cm": "gmail.com", "gmail.om": "gmail.com",
  "gmail.co.za": "gmail.com",
  "yahoo.con": "yahoo.com", "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com",
  "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com", "outlook.con": "outlook.com",
  "icloud.con": "icloud.com",
};
const BAD_ENDINGS = { con: "com", cmo: "com", comm: "com", ocm: "com", cpm: "com" };

/** Trims and lower-cases an email so the same address is always stored the same way. */
export function normaliseEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

/** Returns an error message, or "" when the email is valid. */
export function emailError(value) {
  const email = normaliseEmail(value);
  if (!email) return "Please enter your email address.";
  if (email.length > 150) return "The email address is too long.";
  if (/\s/.test(email)) return "The email address cannot contain spaces.";
  if ((email.match(/@/g) || []).length !== 1) return "The email address must contain one @ sign.";
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address, for example name@gmail.com.";

  const domain = email.split("@")[1];
  if (DOMAIN_TYPOS[domain]) {
    return `Did you mean ${email.split("@")[0]}@${DOMAIN_TYPOS[domain]}? Please check the spelling.`;
  }
  const ending = domain.split(".").pop();
  if (BAD_ENDINGS[ending]) {
    return `The email ending ".${ending}" looks wrong. Did you mean ".${BAD_ENDINGS[ending]}"?`;
  }
  return "";
}

/**
 * Turns any South African number format into 10 digits starting with 0.
 * "082 123 4567", "(082) 123-4567", "+27 82 123 4567" and "27821234567" all become "0821234567".
 * Returns "" when the value is not a South African number.
 */
export function normalisePhone(value) {
  let digits = String(value ?? "").trim().replace(/[\s().-]/g, "");
  if (digits.startsWith("+27")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("27") && digits.length === 11) digits = "0" + digits.slice(2);
  // 0 + area or network code (1 to 8) + 8 more digits = 10 digits.
  return /^0[1-8]\d{8}$/.test(digits) ? digits : "";
}

/** Returns an error message, or "" when the phone number is valid. */
export function phoneError(value, { required = true } = {}) {
  const raw = String(value ?? "").trim();
  if (!raw) return required ? "Please enter your phone number." : "";
  if (/[^\d\s()+.-]/.test(raw)) return "The phone number can only contain digits.";
  if (!normalisePhone(raw)) {
    return "Please enter a valid South African number, for example 082 123 4567 or +27 82 123 4567.";
  }
  const digits = normalisePhone(raw);
  if (/^0(\d)\1{8}$/.test(digits)) return "Please enter a real phone number.";
  return "";
}

/** Returns an error message, or "" when the name is valid. */
export function nameError(value) {
  const name = String(value ?? "").trim();
  if (!name) return "Please enter your full name.";
  if (name.length > 100) return "The name is too long (maximum 100 characters).";
  if (!/^[\p{L}][\p{L} '.-]*$/u.test(name)) return "The name can only contain letters, spaces, hyphens and apostrophes.";
  if ((name.match(/\p{L}/gu) || []).length < 2) return "Please enter your full name.";
  return "";
}
