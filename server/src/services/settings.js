'use strict';

const { color, text, number, bool, oneOf } = require('../utils/sanitize');
const { detectEnv, presetFor, presetKey, PRESETS, ENV_VARS } = require('../utils/env');
const { POSITIONS } = require('../config');
const compat = require('../utils/compat');
const state = require('../utils/state');

const STORE_KEY = 'settings';
const DEFAULT_MESSAGE = '{env} environment';

/**
 * Keys an admin may store; everything else in a request body is dropped.
 * `position` and `pauseOnHover` are deliberately not here — they are set once in
 * config/plugins, not per editor.
 */
const EDITABLE = ['enabled', 'message', 'backgroundColor', 'textColor', 'speed', 'height', 'stripes'];

const store = (strapi) =>
  strapi.store({ type: 'plugin', name: 'warning-tape', key: STORE_KEY });

const pluginConfig = (strapi) => strapi.config.get('plugin::warning-tape', {}) ?? {};

/** Known keys, sane values. `null` survives: it means "back to automatic". */
const sanitizeStored = (raw, fallbacks) => {
  const input = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  const keep = (key, value) => {
    if (key in input && EDITABLE.includes(key)) out[key] = value;
  };

  keep('enabled', bool(input.enabled, fallbacks.enabled));
  keep('message', input.message == null ? null : text(input.message, { max: 200 }));
  keep('backgroundColor', input.backgroundColor == null ? null : color(input.backgroundColor));
  keep('textColor', input.textColor == null ? null : color(input.textColor));
  keep('speed', number(input.speed, { min: 1, max: 1000, fallback: fallbacks.speed }));
  keep('height', number(input.height, { min: 12, max: 120, fallback: fallbacks.height }));
  keep('stripes', bool(input.stripes, fallbacks.stripes));

  return out;
};

const applyEnv = (message, label) => String(message).split('{env}').join(label);

module.exports = ({ strapi }) => ({
  /** The compatibility verdict, computed once at register and cached from there. */
  compatibility() {
    const known = state.read().compatibility;
    if (known) return known;
    const result = compat.check(strapi, { ignore: bool(pluginConfig(strapi).ignoreVersionCheck, false) });
    state.setCompatibility(result);
    return result;
  },

  status() {
    return { ...state.read(), compatibility: this.compatibility() };
  },

  async read() {
    const config = pluginConfig(strapi);
    let stored = {};

    if (!config.readOnly) {
      try {
        stored = (await store(strapi).get()) ?? {};
      } catch (error) {
        // A store that cannot be read (a schema change, a broken connection) is
        // not worth an error page: fall back to the file's values.
        state.recordFailure('reading the stored settings', error);
      }
    }

    const settings = { ...config };

    for (const key of EDITABLE) {
      if (key in stored && stored[key] !== undefined) settings[key] = stored[key];
    }

    return { config, stored, settings };
  },

  /** What the admin paints: automatic values replaced by this env's preset. */
  async resolve() {
    const { config, settings } = await this.read();
    const env = text(config.env, { max: 60 }) ?? detectEnv();
    const preset = presetFor(env);
    const rawMessage = text(settings.message, { max: 200 }) ?? DEFAULT_MESSAGE;
    const compatibility = this.compatibility();
    const failure = state.read().failures[0];

    return {
      enabled: bool(settings.enabled, true) && compatibility.ok,
      // Why the admin is not painting anything, for the Settings page to show.
      disabled: compatibility.ok
        ? undefined
        : { reason: compatibility.reason, strapi: compatibility.version, supported: compatibility.supported },
      warning: failure ? `${failure.where}: ${failure.message}` : undefined,
      env,
      envLabel: preset.label,
      /** The stored template, so the Settings page can show `{env}` unexpanded. */
      rawMessage,
      message: applyEnv(rawMessage, preset.label),
      backgroundColor: color(settings.backgroundColor) ?? preset.backgroundColor,
      textColor: color(settings.textColor) ?? preset.textColor,
      speed: number(settings.speed, { min: 1, max: 1000, fallback: 60 }),
      height: number(settings.height, { min: 12, max: 120, fallback: 32 }),
      position: oneOf(settings.position, POSITIONS, 'top'),
      stripes: bool(settings.stripes, true),
      pauseOnHover: bool(settings.pauseOnHover, true),
    };
  },

  /** Everything the Settings page needs: values, what is automatic, what is locked. */
  async describe() {
    const { config, settings } = await this.read();
    const env = text(config.env, { max: 60 }) ?? detectEnv();

    const preset = presetFor(env);

    return {
      resolved: await this.resolve(),
      status: this.status(),
      /** What each "automatic" value resolves to right now, for the preview. */
      auto: {
        message: DEFAULT_MESSAGE,
        envLabel: preset.label,
        backgroundColor: preset.backgroundColor,
        textColor: preset.textColor,
      },
      settings: {
        enabled: bool(settings.enabled, true),
        message: text(settings.message, { max: 200 }),
        backgroundColor: color(settings.backgroundColor),
        textColor: color(settings.textColor),
        speed: number(settings.speed, { min: 1, max: 1000, fallback: 60 }),
        height: number(settings.height, { min: 12, max: 120, fallback: 32 }),
        stripes: bool(settings.stripes, true),
      },
      env,
      envPreset: presetKey(env),
      envSources: ENV_VARS,
      presets: PRESETS,
      defaultMessage: DEFAULT_MESSAGE,
      readOnly: bool(config.readOnly, false),
    };
  },

  async write(body) {
    const { config, stored } = await this.read();
    if (config.readOnly) {
      throw Object.assign(new Error('The warning tape is locked by config/plugins.'), {
        status: 403,
      });
    }

    const next = sanitizeStored({ ...stored, ...(body ?? {}) }, config);
    await store(strapi).set({ value: next });
    return this.describe();
  },

  async reset() {
    const { config } = await this.read();
    if (config.readOnly) {
      throw Object.assign(new Error('The warning tape is locked by config/plugins.'), {
        status: 403,
      });
    }
    await store(strapi).set({ value: {} });
    return this.describe();
  },

  isPublic() {
    return bool(pluginConfig(strapi).public, true);
  },
});
