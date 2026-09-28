'use strict';

const { color, text, number, bool, oneOf } = require('../utils/sanitize');
const { detectEnv, presetFor, presetKey, PRESETS, ENV_VARS } = require('../utils/env');
const { POSITIONS } = require('../config');

const STORE_KEY = 'settings';
const DEFAULT_MESSAGE = '{env} environment';

/** Keys an admin may store; everything else in a request body is dropped. */
const EDITABLE = [
  'enabled',
  'message',
  'backgroundColor',
  'textColor',
  'speed',
  'height',
  'position',
  'stripes',
  'pauseOnHover',
];

const store = (strapi) =>
  strapi.store({ type: 'plugin', name: 'warning-tape', key: STORE_KEY });

const pluginConfig = (strapi) => strapi.config.get('plugin::warning-tape', {}) ?? {};

/** Known keys, sane values. `null` survives: it means "back to automatic". */
const sanitizeStored = (raw, fallbacks) => {
  const input = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  const keep = (key, value) => {
    if (key in input) out[key] = value;
  };

  keep('enabled', bool(input.enabled, fallbacks.enabled));
  keep('message', input.message == null ? null : text(input.message, { max: 200 }));
  keep('backgroundColor', input.backgroundColor == null ? null : color(input.backgroundColor));
  keep('textColor', input.textColor == null ? null : color(input.textColor));
  keep('speed', number(input.speed, { min: 1, max: 1000, fallback: fallbacks.speed }));
  keep('height', number(input.height, { min: 12, max: 120, fallback: fallbacks.height }));
  keep('position', oneOf(input.position, POSITIONS, fallbacks.position));
  keep('stripes', bool(input.stripes, fallbacks.stripes));
  keep('pauseOnHover', bool(input.pauseOnHover, fallbacks.pauseOnHover));

  return out;
};

const applyEnv = (message, label) => String(message).split('{env}').join(label);

module.exports = ({ strapi }) => ({
  async read() {
    const config = pluginConfig(strapi);
    const stored = config.readOnly ? {} : (await store(strapi).get()) ?? {};
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

    return {
      enabled: bool(settings.enabled, true),
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
        position: oneOf(settings.position, POSITIONS, 'top'),
        stripes: bool(settings.stripes, true),
        pauseOnHover: bool(settings.pauseOnHover, true),
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
