// Plain validation helpers (no Firebase needed, so they are easy to unit test).
const isNonEmptyString = (v, max = 500) =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

const isValidEmail = (v) =>
  typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Digits only, 9 to 15 characters (a leading + is allowed).
const isValidPhone = (v) => typeof v === 'string' && /^\+?\d{9,15}$/.test(v);

const isPositiveInt = (v) => Number.isInteger(v) && v > 0 && v <= 100000;

// Expects YYYY-MM-DD and a real calendar date.
const isValidDate = (v) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === v;
};

module.exports = { isNonEmptyString, isValidEmail, isValidPhone, isPositiveInt, isValidDate };
