'use strict';

/**
 * `GET /config` carries nothing but the banner (message, colours, environment
 * name), so by default it answers before login — that is the whole point: you
 * want to see which environment you are signing into. Set `public: false` in
 * `config/plugins` to require an admin session instead.
 */
const authenticated = { policies: ['admin::isAuthenticatedAdmin'] };

module.exports = {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/config',
        handler: 'tape.find',
        config: { auth: false },
      },
      {
        method: 'GET',
        path: '/settings',
        handler: 'tape.describe',
        config: authenticated,
      },
      {
        method: 'PUT',
        path: '/settings',
        handler: 'tape.update',
        config: authenticated,
      },
      {
        method: 'POST',
        path: '/settings/reset',
        handler: 'tape.reset',
        config: authenticated,
      },
    ],
  },
};
