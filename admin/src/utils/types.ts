export type TapePosition = 'top' | 'bottom';

/** What `GET /warning-tape/config` returns: every value already decided. */
export type TapeConfig = {
  enabled: boolean;
  /** Set when the plugin switched itself off — an unsupported Strapi, usually. */
  disabled?: { reason: string; strapi: string | null; supported: string };
  /** Something went wrong on the server but the tape still works. */
  warning?: string;
  env: string;
  envLabel: string;
  /** The stored template, `{env}` still in place. */
  rawMessage: string;
  /** The template with `{env}` expanded — this is what the tape shows. */
  message: string;
  backgroundColor: string;
  textColor: string;
  /** Pixels per second. */
  speed: number;
  height: number;
  position: TapePosition;
  stripes: boolean;
  pauseOnHover: boolean;
};

/**
 * The editable half of the config; `null` means "use the environment preset".
 * `position` and `pauseOnHover` are not here: they belong to config/plugins.
 */
export type TapeSettings = {
  enabled: boolean;
  message: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  speed: number;
  height: number;
  stripes: boolean;
};

export type EnvPreset = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

export type Compatibility = {
  ok: boolean;
  version: string | null;
  supported: string;
  reason?: string;
  ignored?: boolean;
  unknown?: boolean;
};

export type TapeStatus = {
  compatibility: Compatibility;
  failures: Array<{ where: string; message: string; at: string }>;
};

export type TapeDescription = {
  resolved: TapeConfig;
  status: TapeStatus;
  /** What the "automatic" values resolve to for this environment. */
  auto: {
    message: string;
    envLabel: string;
    backgroundColor: string;
    textColor: string;
  };
  settings: TapeSettings;
  env: string;
  envPreset: string | null;
  envSources: string[];
  presets: Record<string, EnvPreset>;
  defaultMessage: string;
  readOnly: boolean;
};
