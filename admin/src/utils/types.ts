export type TapePosition = 'top' | 'bottom';

/** What `GET /warning-tape/config` returns: every value already decided. */
export type TapeConfig = {
  enabled: boolean;
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

/** The editable half of the config; `null` means "use the environment preset". */
export type TapeSettings = {
  enabled: boolean;
  message: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  speed: number;
  height: number;
  position: TapePosition;
  stripes: boolean;
  pauseOnHover: boolean;
};

export type EnvPreset = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

export type TapeDescription = {
  resolved: TapeConfig;
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
