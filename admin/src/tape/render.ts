import type { TapeConfig } from '../utils/types';

const CLASS = 'strapi-warning-tape';
const STYLE_ID = 'strapi-warning-tape-styles';

// Horizontal period of the -45° stripes: a 28px band pair across the diagonal
// is 28 / cos(45°) across the width. Slide by exactly that and no seam shows.
const STRIPE_PERIOD = 39.6;

/** ~40 fast tries then a 2s heartbeat, giving up after about ten minutes. */
const MAX_RETRIES = 340;

const CSS = `
.${CLASS} {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  height: var(--wt-height);
  background: var(--wt-bg);
  color: var(--wt-fg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, sans-serif;
  font-size: var(--wt-font-size);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  user-select: none;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25), 0 1px 4px rgba(0, 0, 0, 0.2);
}

.${CLASS}__stripes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(0, 0, 0, 0.32) 0 14px,
    rgba(0, 0, 0, 0) 14px 28px
  );
  background-size: ${STRIPE_PERIOD}px 100%;
  animation: ${CLASS}-stripes var(--wt-stripe-duration) linear infinite;
}

.${CLASS}__track {
  display: flex;
  flex: none;
  white-space: nowrap;
  will-change: transform;
  animation: ${CLASS}-scroll var(--wt-duration) linear infinite;
}

.${CLASS}__group {
  display: flex;
  flex: none;
}

.${CLASS}__item {
  display: inline-flex;
  align-items: center;
  gap: 2.5em;
  padding-right: 2.5em;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.${CLASS}__item::after {
  content: "\\25C6";
  font-size: 0.7em;
  opacity: 0.6;
  letter-spacing: 0;
}

.${CLASS}--static {
  justify-content: center;
}

.${CLASS}--static .${CLASS}__track,
.${CLASS}--static .${CLASS}__stripes {
  animation: none;
}

.${CLASS}--static .${CLASS}__item {
  gap: 0;
  padding-right: 0;
}

.${CLASS}--static .${CLASS}__item::after {
  content: none;
}

.${CLASS}--pausable:hover .${CLASS}__track,
.${CLASS}--pausable:hover .${CLASS}__stripes {
  animation-play-state: paused;
}

@keyframes ${CLASS}-scroll {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(calc(-1 * var(--wt-shift)), 0, 0); }
}

@keyframes ${CLASS}-stripes {
  from { background-position-x: 0; }
  to { background-position-x: -${STRIPE_PERIOD}px; }
}

@media (prefers-reduced-motion: reduce) {
  .${CLASS}__track,
  .${CLASS}__stripes {
    animation: none !important;
  }
}
`;

/** One stylesheet for every tape on the page — the global one and any preview. */
const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
};

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const makeItem = (message: string) => {
  const item = document.createElement('span');
  item.className = `${CLASS}__item`;
  // textContent, never innerHTML: the message is whatever an admin typed.
  item.textContent = message;
  return item;
};

export type TapeHandle = {
  element: HTMLElement;
  update: (config: TapeConfig) => void;
  destroy: () => void;
};

/** Used by both the mounted banner and the Settings preview, so they can't drift. */
export function createTape(config: TapeConfig): TapeHandle {
  injectStyles();

  const element = document.createElement('div');
  const stripes = document.createElement('div');
  const track = document.createElement('div');

  stripes.className = `${CLASS}__stripes`;
  track.className = `${CLASS}__track`;
  element.append(stripes, track);

  let current = config;
  let retry = 0;
  let timer: number | undefined;

  const layout = () => {
    const width = element.clientWidth;

    // Not laid out yet: still detached, or in a tab the browser has never
    // rendered. Come back for it on a timer — in a hidden tab, timers are the
    // only thing that still runs. requestAnimationFrame does not, and neither
    // does ResizeObserver, so this is also the only way back from a tape that
    // was built while the tab was in the background.
    if (!width) {
      if (retry > MAX_RETRIES) return;
      // Try hard for the first few seconds, then settle into a slow heartbeat.
      const delay = retry < 40 ? 100 : 2000;
      retry += 1;
      window.clearTimeout(timer);
      timer = window.setTimeout(layout, delay);
      return;
    }

    retry = 0;
    track.textContent = '';

    if (prefersReducedMotion()) {
      const group = document.createElement('div');
      group.className = `${CLASS}__group`;
      group.appendChild(makeItem(current.message));
      track.appendChild(group);
      return;
    }

    // Measure one copy, then repeat it until a group is wider than the tape:
    // two such groups side by side make the loop seamless.
    const probe = document.createElement('div');
    probe.className = `${CLASS}__group`;
    probe.appendChild(makeItem(current.message));
    track.appendChild(probe);
    const itemWidth = probe.clientWidth || 1;

    const repeats = Math.max(1, Math.ceil(width / itemWidth) + 1);
    for (let i = 1; i < repeats; i += 1) probe.appendChild(makeItem(current.message));

    const shift = probe.clientWidth;
    track.appendChild(probe.cloneNode(true));

    element.style.setProperty('--wt-shift', `${shift}px`);
    element.style.setProperty('--wt-duration', `${Math.max(1, shift / current.speed)}s`);
  };

  const update = (next: TapeConfig) => {
    current = next;
    const fontSize = Math.max(9, Math.min(18, Math.round(next.height * 0.42)));

    element.className = [
      CLASS,
      next.pauseOnHover ? `${CLASS}--pausable` : '',
      prefersReducedMotion() ? `${CLASS}--static` : '',
    ]
      .filter(Boolean)
      .join(' ');
    element.setAttribute('role', 'status');
    element.setAttribute('aria-label', next.message);
    element.title = next.message;

    element.style.setProperty('--wt-height', `${next.height}px`);
    element.style.setProperty('--wt-bg', next.backgroundColor);
    element.style.setProperty('--wt-fg', next.textColor);
    element.style.setProperty('--wt-font-size', `${fontSize}px`);
    element.style.setProperty(
      '--wt-stripe-duration',
      `${Math.max(0.2, STRIPE_PERIOD / next.speed)}s`
    );
    stripes.style.display = next.stripes ? '' : 'none';

    retry = 0;
    layout();
  };

  update(config);

  // The tape's own box never changes when we fill it (fixed height, hidden
  // overflow), so measuring from here cannot loop. The observer only delivers
  // while the tab renders, hence the two listeners next to it.
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(layout);
  observer?.observe(element);

  const relayout = () => layout();
  window.addEventListener('resize', relayout);
  document.addEventListener('visibilitychange', relayout);

  return {
    element,
    update,
    destroy() {
      window.clearTimeout(timer);
      window.removeEventListener('resize', relayout);
      document.removeEventListener('visibilitychange', relayout);
      observer?.disconnect();
      element.remove();
    },
  };
}
