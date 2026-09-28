'use strict';

/**
 * `GET /warning-tape/config` is declared with `auth: false` so the tape can
 * render on the login screen. With `public: false` we put the admin policy back
 * here — routes are only mounted later, during bootstrap, so this still counts.
 */
module.exports = ({ strapi }) => {
  if (strapi.plugin('warning-tape').service('settings').isPublic()) return;

  const route = strapi
    .plugin('warning-tape')
    .routes?.admin?.routes?.find((candidate) => candidate.path === '/config');

  if (route) {
    route.config = { policies: ['admin::isAuthenticatedAdmin'] };
  } else {
    // The controller refuses anonymous callers on its own, so the config stays
    // private — the tape simply will not render. Worth a line in the log.
    strapi.log.warn(
      '[warning-tape] could not find the /config route to protect; the tape will stay hidden.'
    );
  }
};
