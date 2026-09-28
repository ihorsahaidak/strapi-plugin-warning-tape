import pluginId from '../pluginId';
import type { TapeConfig } from './types';

/** The tape lives outside the React tree, so: no `useFetchClient`, plain fetch. */
const backendURL = (): string => {
  const url = (window as any).strapi?.backendURL;
  return typeof url === 'string' ? url.replace(/\/$/, '') : '';
};

/** The admin session token, wherever this browser kept it ("remember me" or not). */
const jwt = (): string | null => {
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = storage?.getItem('jwtToken');
      if (!raw) continue;
      const token = raw.startsWith('"') ? JSON.parse(raw) : raw;
      if (typeof token === 'string' && token) return token;
    } catch {
      /* storage can throw outright in private mode */
    }
  }
  return null;
};

export async function fetchTapeConfig(): Promise<TapeConfig> {
  const token = jwt();
  const response = await fetch(`${backendURL()}/${pluginId}/config`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });

  if (!response.ok) throw new Error(`warning-tape: config request failed (${response.status})`);

  return (await response.json()) as TapeConfig;
}
