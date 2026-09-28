'use strict';

// Colours end up in an inline style, so only shapes we recognise get through:
// hex, rgb()/rgba(), hsl()/hsla() and plain CSS colour keywords.
const COLOR_PATTERNS = [
  /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^rgba?\(\s*[\d.]+%?\s*[, ]\s*[\d.]+%?\s*[, ]\s*[\d.]+%?\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i,
  /^hsla?\(\s*[\d.]+(?:deg|rad|turn)?\s*[, ]\s*[\d.]+%\s*[, ]\s*[\d.]+%\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i,
  /^[a-z]{3,20}$/i,
];

const color = (value, fallback = null) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.length > 40) return fallback;
  return COLOR_PATTERNS.some((pattern) => pattern.test(trimmed)) ? trimmed : fallback;
};

const text = (value, { max = 200, fallback = null } = {}) => {
  if (typeof value !== 'string') return fallback;
  // Control characters would break the single-line marquee.
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return cleaned ? cleaned.slice(0, max) : fallback;
};

const number = (value, { min, max, fallback }) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
};

const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);

const oneOf = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

module.exports = { color, text, number, bool, oneOf };
