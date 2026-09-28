'use strict';

const service = (strapi) => strapi.plugin('warning-tape').service('settings');

module.exports = ({ strapi }) => ({
  /**
   * Read by the admin bundle on every page load. The route is declared without
   * authentication (see ../register.js) so the tape also shows on the login
   * screen; when `public` is off, register puts the admin policy back and this
   * extra guard makes sure an anonymous caller is refused either way.
   */
  async find(ctx) {
    const settings = service(strapi);
    if (!settings.isPublic() && !ctx.state.user) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized' };
      return;
    }
    ctx.body = await settings.resolve();
  },

  async describe(ctx) {
    ctx.body = await service(strapi).describe();
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
