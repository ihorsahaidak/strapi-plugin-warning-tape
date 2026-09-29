'use strict';

const state = require('../utils/state');

const service = (strapi) => strapi.plugin('warning-tape').service('settings');

/** Nothing here is worth an error page: a broken tape is a tape that is off. */
const OFF = { enabled: false };

module.exports = ({ strapi }) => ({
  /**
   * Read by the admin bundle on every page load. The route is declared without
   * authentication (see ../register.js) so the tape also shows on the login
   * screen; when `public` is off, register puts the admin policy back and this
   * extra guard makes sure an anonymous caller is refused either way.
   */
  async find(ctx) {
    try {
      const settings = service(strapi);
      if (!settings.isPublic() && !ctx.state.user) {
        ctx.status = 401;
        ctx.body = { error: 'Unauthorized' };
        return;
      }
      ctx.body = await settings.resolve();
    } catch (error) {
      state.recordFailure('reading the tape config', error);
      strapi.log.warn(`[warning-tape] could not read the config: ${error.message}`);
      ctx.body = { ...OFF, warning: error.message };
    }
  },

  async describe(ctx) {
    try {
      ctx.body = await service(strapi).describe();
    } catch (error) {
      state.recordFailure('reading the settings', error);
      ctx.status = 500;
      ctx.body = { error: error.message, status: state.read() };
    }
  },

  async update(ctx) {
    try {
      ctx.body = await service(strapi).write(ctx.request.body);
    } catch (error) {
      ctx.throw(error.status ?? 500, error.message);
    }
  },

  async reset(ctx) {
    try {
      ctx.body = await service(strapi).reset();
    } catch (error) {
      ctx.throw(error.status ?? 500, error.message);
    }
  },
});
