# strapi-plugin-warning-tape

A strip of hazard tape across the top of the Strapi 5 admin, scrolling a message
of your choice — so nobody edits pre-production thinking it is production.

![The tape across the top of the Strapi admin](https://raw.githubusercontent.com/ihorsahaidak/strapi-plugin-warning-tape/main/docs/admin.png)

The environment name is read from the process, not from the database: colours and
text come out right on every deployment without a per-environment build, and a
database restored from another environment cannot make production look like
staging.

## Install

```bash
npm install strapi-plugin-warning-tape
```

Nothing else is required — the tape appears on the next admin build with the
colours of the environment it detects. Strapi rebuilds the admin automatically in
development; in production run `npm run build` again after installing.

## What it shows

The environment name is the first of these that is set:

`WARNING_TAPE_ENV`, `STRAPI_ENV`, `APP_ENV`, `ENVIRONMENT`, `ENV`, `NODE_ENV` —
or `env` in `config/plugins`, which overrides all of them.

That name is matched against the presets below (aliases included: `prod`, `live`,
`pre-prod`, `preproduction`, `stage`, `uat`, `recette`, `qa`, `ci`, `testing`,
`dev`, `develop`, `localhost`):

| Environment   | Label            | Background | Text      |
| ------------- | ---------------- | ---------- | --------- |
| `production`  | `PRODUCTION`     | `#d02b20`  | `#ffffff` |
| `preprod`     | `PRE-PRODUCTION` | `#f29d41`  | `#1f1f1f` |
| `staging`     | `STAGING`        | `#f0d000`  | `#1f1f1f` |
| `test`        | `TEST`           | `#9736e8`  | `#ffffff` |
| `development` | `DEVELOPMENT`    | `#4945ff`  | `#ffffff` |
| `local`       | `LOCAL`          | `#2f6846`  | `#ffffff` |

A name that matches nothing still works: it becomes its own label
(`shopin-qa-7` → `SHOPIN-QA-7`) on a neutral yellow.

![The same tape in three environments](https://raw.githubusercontent.com/ihorsahaidak/strapi-plugin-warning-tape/main/docs/tape.png)

The default message is `{env} environment`. `{env}` is replaced with the label
wherever it appears, so `Careful — this is {env}, not your laptop` works too.

## Settings

**Settings → Warning Tape → Tape** in the admin, with a live preview:

![The settings page](https://raw.githubusercontent.com/ihorsahaidak/strapi-plugin-warning-tape/main/docs/settings.png)

- **Show the tape** — off leaves the admin untouched, your settings are kept.
- **Message** — empty means the default; `{env}` expands.
- **Background / Text** — empty means the preset for the detected environment, so
  the same setting keeps making sense on every deployment.
- **Position** — top or bottom of the admin.
- **Height** (12–120px) and **scrolling speed** (pixels per second).
- **Hazard stripes** and **pause when the pointer is on it**.

These are stored in Strapi's core store, so everyone on that deployment sees the
same tape. Colours and a message you leave on "automatic" are the ones that
survive a database copied between environments — a message with `{env}` in it
will still be right, a message that spells out an environment will not.

## config/plugins

Everything the Settings page edits can be given a default in
`config/plugins.ts`, plus three options that only exist there:

```ts
export default ({ env }) => ({
  'warning-tape': {
    enabled: true,
    config: {
      // Defaults for the Settings page
      message: 'Careful — this is {env}',
      backgroundColor: null, // null = the preset for the detected environment
      textColor: null,
      speed: 60,             // pixels per second
      height: 32,
      position: 'top',       // or 'bottom'
      stripes: true,
      pauseOnHover: true,

      // Only here
      env: env('DEPLOY_ENV'), // overrides the detected environment name
      readOnly: env.bool('WARNING_TAPE_LOCKED', false),
      public: true,
    },
  },
});
```

- **`readOnly`** ignores the stored settings entirely and makes the Settings page
  read-only: the file is the tape. Worth switching on in production, where the
  banner is not something an editor should be able to turn off.
- **`public`** (default `true`) serves the banner before login, so the tape is
  there on the login screen — the moment you most want to know which environment
  you are typing a password into. It exposes nothing but the message, the colours
  and the environment name. Set it to `false` to require an admin session, and
  the tape then appears once you are logged in.

Bad values are rejected at boot with a message naming the option.

## Notes

- Colours accept hex, `rgb()`, `hsl()` and CSS keywords; anything else is
  refused, both in the API and in the form.
- The tape makes room for itself (`#strapi` gets matching padding) instead of
  covering the admin, so no content is hidden and no second scrollbar appears.
- It honours `prefers-reduced-motion`: the message is centred and still.
- The message is announced once as a `role="status"` region, not on every loop.

## Development

```bash
npm install
npm run build     # bundles admin/ and server/ into dist/
npm run verify    # checks the package exports
npm run watch:link # for `npm link` into a local Strapi project
```

## License

MIT
