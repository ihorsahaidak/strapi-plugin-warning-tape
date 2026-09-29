'use strict';

/** What went wrong at runtime, so the Settings page can show it. */
const state = { compatibility: null, failures: [] };

const setCompatibility = (compatibility) => {
  state.compatibility = compatibility;
};

const recordFailure = (where, error) => {
  const message = String(error?.message ?? error ?? 'unknown error');
  if (state.failures.some((failure) => failure.where === where && failure.message === message)) return;
  state.failures = [...state.failures, { where, message, at: new Date().toISOString() }].slice(-5);
};

const read = () => ({
  compatibility: state.compatibility,
  failures: state.failures,
});

module.exports = { setCompatibility, recordFailure, read };
