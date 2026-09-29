'use strict';

/**
 * The plugin is written against the Strapi 5 plugin API. On a major upgrade it
 * switches itself off and says so, instead of taking the admin down with it.
 */
const SUPPORTED_MAJOR = 5;
const SUPPORTED_RANGE = '>=5.0.0 <6.0.0';

const majorOf = (version) => {
  const match = /(\d+)\./.exec(String(version ?? ''));
  return match ? Number(match[1]) : null;
};

/** Strapi has moved this around before, so try every place it has lived. */
const detectVersion = (strapi) => {
  const sources = [
    () => strapi?.config?.get?.('info.strapi'),
    () => strapi?.config?.info?.strapi,
    () => strapi?.config?.get?.('info.dependencies.@strapi/strapi'),
    () => require('@strapi/strapi/package.json').version,
  ];

  for (const read of sources) {
    try {
      const value = read();
      if (typeof value === 'string' && /\d/.test(value)) return value.replace(/^\D+/, '');
    } catch {
      /* next source */
    }
  }
  return null;
};

const verdict = (version, { ignore = false } = {}) => {
  const major = majorOf(version);
  const base = { version, supported: SUPPORTED_RANGE };

  if (ignore) return { ...base, ok: true, ignored: true };
  // An unreadable version is not a reason to switch off — that would take the
  // tape down on a Strapi that only moved the field.
  if (major === null) return { ...base, ok: true, unknown: true };
  if (major === SUPPORTED_MAJOR) return { ...base, ok: true };

  return {
    ...base,
    ok: false,
    reason:
      `Strapi ${version} is outside the range this version of strapi-plugin-warning-tape ` +
      `supports (${SUPPORTED_RANGE}), so the tape is switched off. Update the plugin, or set ` +
      `\`ignoreVersionCheck: true\` in config/plugins to run it anyway.`,
  };
};

const check = (strapi, options) => verdict(detectVersion(strapi), options);

module.exports = { SUPPORTED_MAJOR, SUPPORTED_RANGE, majorOf, detectVersion, verdict, check };
