'use strict';

/** Presets: `label` is what `{env}` expands to, the colours are the fallback. */
const PRESETS = {
  production: { label: 'PRODUCTION', backgroundColor: '#d02b20', textColor: '#ffffff' },
  preprod: { label: 'PRE-PRODUCTION', backgroundColor: '#f29d41', textColor: '#1f1f1f' },
  staging: { label: 'STAGING', backgroundColor: '#f0d000', textColor: '#1f1f1f' },
  test: { label: 'TEST', backgroundColor: '#9736e8', textColor: '#ffffff' },
  development: { label: 'DEVELOPMENT', backgroundColor: '#4945ff', textColor: '#ffffff' },
  local: { label: 'LOCAL', backgroundColor: '#2f6846', textColor: '#ffffff' },
};

const UNKNOWN_PRESET = { backgroundColor: '#ffd233', textColor: '#1f1f1f' };

const ALIASES = {
  prod: 'production',
  production: 'production',
  live: 'production',
  preprod: 'preprod',
  'pre-prod': 'preprod',
  preproduction: 'preprod',
  'pre-production': 'preprod',
  staging: 'staging',
  stage: 'staging',
  uat: 'staging',
  recette: 'staging',
  test: 'test',
  testing: 'test',
  qa: 'test',
  ci: 'test',
  dev: 'development',
  develop: 'development',
  development: 'development',
  local: 'local',
  localhost: 'local',
};

/** The env vars we look at, most specific first. */
const ENV_VARS = ['WARNING_TAPE_ENV', 'STRAPI_ENV', 'APP_ENV', 'ENVIRONMENT', 'ENV', 'NODE_ENV'];

const detectEnv = () => {
  for (const name of ENV_VARS) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return 'development';
};

/** Map a free-form env name onto a preset key, or null when we don't know it. */
const presetKey = (env) => ALIASES[String(env ?? '').trim().toLowerCase()] ?? null;

const presetFor = (env) => {
  const key = presetKey(env);
  if (key) return PRESETS[key];
  // Unknown env names still get a label — their own name, shouted.
  return { ...UNKNOWN_PRESET, label: String(env ?? '').trim().toUpperCase() || 'UNKNOWN' };
};

module.exports = { PRESETS, ENV_VARS, detectEnv, presetKey, presetFor };
