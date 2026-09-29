import pluginId from './pluginId';
import { mountTape } from './tape/mount';
import { guard } from './utils/adminState';

export default {
  register(app: any) {
    // Settings → Warning Tape
    guard('adding the settings section', () =>
      app.createSettingSection(
        {
          id: pluginId,
          intlLabel: { id: `${pluginId}.settings.section`, defaultMessage: 'Warning Tape' },
        },
        [
          {
            intlLabel: { id: `${pluginId}.settings.tape`, defaultMessage: 'Tape' },
            id: `${pluginId}-tape`,
            to: `${pluginId}/tape`,
            Component: () => import('./pages/Settings'),
          },
        ]
      )
    );
  },

  bootstrap() {
    // No injection zone spans the whole admin (let alone the login screen),
    // so the tape gets its own node next to `#strapi`. Everything the plugin
    // does to the admin is wrapped: a banner is never worth a broken admin.
    guard('mounting the tape', () => mountTape());
  },
};
