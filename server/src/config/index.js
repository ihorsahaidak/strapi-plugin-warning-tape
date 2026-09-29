'use strict';

const { color, text, number, bool, oneOf } = require('../utils/sanitize');

/**
 * Defaults for what the admin UI stores in the database. Two exceptions:
 * `readOnly` ignores the stored settings (the file wins), and `env` overrides
 * the detected environment. `null` = take it from the environment preset.
 */
const defaults = {
  enabled: true,
  readOnly: false,
  /** Serve the tape config to anonymous callers, so it shows on the login screen. */
  public: true,
  /** Run on a Strapi major this plugin was not written for, at your own risk. */
  ignoreVersionCheck: false,
  env: null,
  message: null,
  backgroundColor: null,
  textColor: null,
  /** Scrolling speed, in pixels per second. */
  speed: 60,
  height: 32,
  position: 'top',
  stripes: true,
  pauseOnHover: true,
};

const POSITIONS = ['top', 'bottom'];

const validator = (config = {}) => {
  const bad = (key, expected) => {
    throw new Error(`[warning-tape] config.${key} is invalid — expected ${expected}.`);
  };

  for (const key of ['enabled', 'readOnly', 'public', 'stripes', 'pauseOnHover', 'ignoreVersionCheck']) {
    if (config[key] != null && bool(config[key], null) === null) bad(key, 'a boolean');
  }
  for (const key of ['backgroundColor', 'textColor']) {
    if (config[key] != null && color(config[key]) === null) bad(key, 'a CSS colour');
  }
  for (const key of ['env', 'message']) {
    if (config[key] != null && text(config[key]) === null) bad(key, 'a non-empty string');
  }
  if (config.position != null && oneOf(config.position, POSITIONS, null) === null) {
    bad('position', `one of ${POSITIONS.join(', ')}`);
  }
  if (config.speed != null && number(config.speed, { min: 1, max: 1000, fallback: null }) === null) {
    bad('speed', 'a number of pixels per second');
  }
  if (config.height != null && number(config.height, { min: 12, max: 120, fallback: null }) === null) {
    bad('height', 'a number of pixels');
  }
};

module.exports = { default: defaults, validator, POSITIONS };
