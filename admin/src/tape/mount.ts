import { fetchTapeConfig } from '../utils/api';
import { createTape, type TapeHandle } from './render';
import type { TapeConfig } from '../utils/types';

const HOST_ID = 'strapi-warning-tape-host';
const LAYOUT_STYLE_ID = 'strapi-warning-tape-layout';

/** The admin is mounted in `#strapi`, which the shell sizes to `height: 100%`. */
const APP_SELECTOR = '#strapi';

let host: HTMLElement | null = null;
let tape: TapeHandle | null = null;
let retry = 0;
let timer: number | undefined;

/**
 * Make room instead of covering. `#strapi` is `height: 100%`, so padding it is
 * enough for the app itself — but the layout inside sizes itself in `vh`, which
 * ignores that padding and would leave a scrollbar exactly one tape tall, hence
 * the cap on the first levels below it.
 */
const applyLayout = (config: TapeConfig | null) => {
  let style = document.getElementById(LAYOUT_STYLE_ID) as HTMLStyleElement | null;

  if (!config) {
    style?.remove();
    return;
  }

  if (!style) {
    style = document.createElement('style');
    style.id = LAYOUT_STYLE_ID;
    document.head.appendChild(style);
  }

  const side = config.position === 'bottom' ? 'bottom' : 'top';
  style.textContent = `
${APP_SELECTOR} {
  box-sizing: border-box;
  padding-${side}: ${config.height}px;
}
${APP_SELECTOR} > div,
${APP_SELECTOR} > div > div,
${APP_SELECTOR} > div > div > div {
  max-height: calc(100vh - ${config.height}px);
}
#${HOST_ID} {
  position: fixed;
  ${side}: 0;
  left: 0;
  right: 0;
  z-index: 2147483000;
}
`;
};

const teardown = () => {
  tape?.destroy();
  tape = null;
  host?.remove();
  host = null;
  applyLayout(null);
};

const paint = (config: TapeConfig) => {
  if (!config.enabled) {
    teardown();
    return;
  }

  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);
  }

  if (tape) {
    tape.update(config);
  } else {
    tape = createTape(config);
    host.appendChild(tape.element);
  }

  applyLayout(config);
};

/** Retries with a widening delay: with `public: false` this only works once logged in. */
export async function refreshTape(): Promise<void> {
  window.clearTimeout(timer);

  try {
    paint(await fetchTapeConfig());
    retry = 0;
  } catch {
    if (retry >= 6) return;
    const delay = Math.min(30000, 2000 * 2 ** retry);
    retry += 1;
    timer = window.setTimeout(refreshTape, delay);
  }
}

export function mountTape(): void {
  if (typeof document === 'undefined') return;

  const start = () => {
    void refreshTape();
    // A login in this tab leaves no other trace we can listen for.
    window.addEventListener('focus', () => {
      if (!tape) void refreshTape();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}
