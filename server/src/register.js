'use strict';

const compat = require('./utils/compat');
const state = require('./utils/state');

/**
 * Two things at boot, both written so that a failure switches the tape off
 * rather than stopping Strapi:
 *
 * - check that this is a Strapi the plugin knows;
 * - with `public: false`, put the admin policy back on `GET /config`, which is
 *   declared with `auth: false` so the tape can render on the login screen.
 */
module.exports = ({ strapi }) => {
  const plugin = strapi.plugin('warning-tape');
  const settings = plugin?.service?.('settings');

  try {
    const compatibility = settings
      ? settings.compatibility()
      : compat.check(strapi, { ignore: false });

    state.setCompatibility(compatibility);

    if (!compatibility.ok) {
      strapi.log.warn(`[warning-tape] ${compatibility.reason}`);
      return;
    }
  } catch (error) {
    state.recordFailure('checking the Strapi version', error);
    strapi.log.warn(`[warning-tape] could not check the Strapi version: ${error.message}`);
  }

  try {
    if (settings?.isPublic()) return;

    const route = plugin.routes?.admin?.routes?.find((candidate) => candidate.path === '/config');

    if (route) {
      route.config = { policies: ['admin::isAuthenticatedAdmin'] };
    } else {
      // The controller refuses anonymous callers on its own, so the config stays
      // private — the tape simply will not render. Worth a line in the log.
      state.recordFailure('protecting the config route', new Error('route not found'));
      strapi.log.warn(
        '[warning-tape] could not find the /config route to protect; the tape will stay hidden.'
      );
    }
  } catch (error) {
    state.recordFailure('protecting the config route', error);
    strapi.log.warn(`[warning-tape] could not protect the config route: ${error.message}`);
  }
};
