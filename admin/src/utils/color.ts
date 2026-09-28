// Mirror of the server-side guard: the value lands in an inline style, so only
// shapes we recognise are allowed through.
const PATTERNS = [
  /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^rgba?\(\s*[\d.]+%?\s*[, ]\s*[\d.]+%?\s*[, ]\s*[\d.]+%?\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i,
  /^hsla?\(\s*[\d.]+(?:deg|rad|turn)?\s*[, ]\s*[\d.]+%\s*[, ]\s*[\d.]+%\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i,
  /^[a-z]{3,20}$/i,
];

export const isColor = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 40 && PATTERNS.some((p) => p.test(trimmed));
};

/** `<input type="color">` only speaks `#rrggbb`. */
export const toHex = (value: string): string => {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [, r, g, b] = value.match(/^#(.)(.)(.)$/i) as RegExpMatchArray;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  // Anything else (named colours, rgb(), hsl()) — let the browser convert it.
  try {
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    const match = computed.match(/\d+/g);
    if (!match) return '#000000';
    return `#${match
      .slice(0, 3)
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')}`;
  } catch {
    return '#000000';
  }
};
