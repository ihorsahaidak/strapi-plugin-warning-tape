import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Field,
  Flex,
  Grid,
  NumberInput,
  SingleSelect,
  SingleSelectOption,
  Switch,
  TextInput,
  Typography,
} from '@strapi/design-system';
import { Check, ArrowClockwise } from '@strapi/icons';
import { Layouts, Page, useFetchClient, useNotification } from '@strapi/strapi/admin';

import ColorField from '../components/ColorField';
import TapePreview from '../components/TapePreview';
import pluginId from '../pluginId';
import { refreshTape } from '../tape/mount';
import type { TapeConfig, TapeDescription, TapeSettings } from '../utils/types';

const expand = (message: string, envLabel: string) => message.split('{env}').join(envLabel);

/** What the tape would look like with the unsaved form values. */
const previewConfig = (data: TapeDescription, draft: TapeSettings): TapeConfig => {
  const rawMessage = draft.message ?? data.auto.message;

  return {
    enabled: draft.enabled,
    env: data.env,
    envLabel: data.auto.envLabel,
    rawMessage,
    message: expand(rawMessage, data.auto.envLabel),
    backgroundColor: draft.backgroundColor ?? data.auto.backgroundColor,
    textColor: draft.textColor ?? data.auto.textColor,
    speed: draft.speed,
    height: draft.height,
    position: draft.position,
    stripes: draft.stripes,
    pauseOnHover: draft.pauseOnHover,
  };
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <Box padding={5} background="neutral0" hasRadius shadow="tableShadow" borderColor="neutral150">
    {children}
  </Box>
);

const SettingsPage = () => {
  const { get, put, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [data, setData] = React.useState<TapeDescription | null>(null);
  const [draft, setDraft] = React.useState<TapeSettings | null>(null);
  const [saving, setSaving] = React.useState(false);

  const apply = (body: unknown) => {
    const description = body as TapeDescription;
    setData(description);
    setDraft(description.settings);
  };

  const load = React.useCallback(
    (promise: Promise<{ data: unknown }>) =>
      promise
        .then(({ data: body }) => apply(body))
        .catch(() => {
          toggleNotification({ type: 'danger', message: 'Could not load the warning tape settings.' });
        }),
    [toggleNotification]
  );

  React.useEffect(() => {
    void load(get(`/${pluginId}/settings`));
  }, [get, load]);

  if (!data || !draft) return <Page.Loading />;

  const locked = data.readOnly;
  const set = <K extends keyof TapeSettings>(key: K, value: TapeSettings[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    setSaving(true);
    try {
      const { data: body } = await put(`/${pluginId}/settings`, draft);
      apply(body);
      void refreshTape();
      toggleNotification({ type: 'success', message: 'Warning tape saved.' });
    } catch {
      toggleNotification({ type: 'danger', message: 'Saving the warning tape failed.' });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      const { data: body } = await post(`/${pluginId}/settings/reset`, {});
      apply(body);
      void refreshTape();
      toggleNotification({ type: 'success', message: 'Back to the defaults for this environment.' });
    } catch {
      toggleNotification({ type: 'danger', message: 'Resetting the warning tape failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layouts.Root>
      <Page.Main>
        <Layouts.Header
          title="Warning Tape"
          subtitle="A strip of hazard tape across the admin, scrolling a message of your choice — so nobody edits pre-production thinking it is production."
          primaryAction={
            <Flex gap={2}>
              <Button
                variant="tertiary"
                startIcon={<ArrowClockwise />}
                disabled={locked || saving}
                onClick={reset}
              >
                Reset
              </Button>
              <Button startIcon={<Check />} loading={saving} disabled={locked} onClick={save}>
                Save
              </Button>
            </Flex>
          }
        />
        <Layouts.Content>
          <Flex direction="column" alignItems="stretch" gap={4}>
            {locked ? (
              <Alert closeLabel="Close" title="Locked by the server configuration" variant="default">
                `warning-tape` runs with `readOnly: true` in config/plugins, so the tape is
                whatever that file says and these fields are read-only.
              </Alert>
            ) : null}

            <Card>
              <Flex direction="column" alignItems="stretch" gap={3}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Typography variant="delta" tag="h2">
                    Preview
                  </Typography>
                  <Flex gap={2} alignItems="center">
                    <Typography variant="pi" textColor="neutral600">
                      Environment
                    </Typography>
                    <Box
                      background="neutral150"
                      padding={1}
                      paddingLeft={2}
                      paddingRight={2}
                      hasRadius
                    >
                      <Typography variant="pi" fontWeight="bold">
                        {data.env}
                      </Typography>
                    </Box>
                  </Flex>
                </Flex>
                <Box overflow="hidden" hasRadius>
                  <TapePreview config={previewConfig(data, draft)} />
                </Box>
                <Typography variant="pi" textColor="neutral600">
                  Detected from {data.envSources.join(', ')} — the first one that is set wins, and
                  `env` in config/plugins overrides them all.{' '}
                  {data.envPreset
                    ? `Matched the "${data.envPreset}" preset.`
                    : 'No preset matched this name, so the automatic colours are the neutral ones.'}
                </Typography>
              </Flex>
            </Card>

            <Card>
              <Flex justifyContent="space-between" alignItems="center" gap={4}>
                <Flex direction="column" alignItems="flex-start" gap={1}>
                  <Typography variant="delta" tag="h2">
                    Show the tape
                  </Typography>
                  <Typography variant="pi" textColor="neutral600">
                    While this is off the admin looks untouched — your settings are kept.
                  </Typography>
                </Flex>
                <Switch
                  checked={draft.enabled}
                  onCheckedChange={(checked: boolean) => set('enabled', checked)}
                  onLabel="On"
                  offLabel="Off"
                  disabled={locked}
                  aria-label="Show the tape"
                />
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" alignItems="stretch" gap={5}>
                <Typography variant="delta" tag="h2">
                  Message and colours
                </Typography>

                <Field.Root
                  name="message"
                  hint={`Leave empty for the default ("${data.auto.message}"). {env} becomes ${data.auto.envLabel}.`}
                >
                  <Field.Label>Message</Field.Label>
                  <TextInput
                    disabled={locked}
                    placeholder={data.auto.message}
                    value={draft.message ?? ''}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      set('message', event.target.value === '' ? null : event.target.value)
                    }
                  />
                  <Field.Hint />
                </Field.Root>

                <Grid.Root gap={5}>
                  <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                    <ColorField
                      label="Background"
                      hint="Empty follows the environment preset."
                      value={draft.backgroundColor}
                      auto={data.auto.backgroundColor}
                      disabled={locked}
                      onChange={(value) => set('backgroundColor', value)}
                    />
                  </Grid.Item>
                  <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                    <ColorField
                      label="Text"
                      hint="Empty follows the environment preset."
                      value={draft.textColor}
                      auto={data.auto.textColor}
                      disabled={locked}
                      onChange={(value) => set('textColor', value)}
                    />
                  </Grid.Item>
                </Grid.Root>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" alignItems="stretch" gap={5}>
                <Typography variant="delta" tag="h2">
                  Look and motion
                </Typography>

                <Grid.Root gap={5}>
                  <Grid.Item col={4} s={12} direction="column" alignItems="stretch">
                    <Field.Root name="position">
                      <Field.Label>Position</Field.Label>
                      <SingleSelect
                        disabled={locked}
                        value={draft.position}
                        onChange={(value: string | number) =>
                          set('position', value === 'bottom' ? 'bottom' : 'top')
                        }
                      >
                        <SingleSelectOption value="top">Top of the admin</SingleSelectOption>
                        <SingleSelectOption value="bottom">Bottom of the admin</SingleSelectOption>
                      </SingleSelect>
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item col={4} s={12} direction="column" alignItems="stretch">
                    <Field.Root name="height" hint="12 to 120 pixels.">
                      <Field.Label>Height</Field.Label>
                      <NumberInput
                        disabled={locked}
                        value={draft.height}
                        onValueChange={(value?: number) => set('height', value ?? 32)}
                      />
                      <Field.Hint />
                    </Field.Root>
                  </Grid.Item>
                  <Grid.Item col={4} s={12} direction="column" alignItems="stretch">
                    <Field.Root name="speed" hint="Pixels per second, 1 to 1000.">
                      <Field.Label>Scrolling speed</Field.Label>
                      <NumberInput
                        disabled={locked}
                        value={draft.speed}
                        onValueChange={(value?: number) => set('speed', value ?? 60)}
                      />
                      <Field.Hint />
                    </Field.Root>
                  </Grid.Item>
                </Grid.Root>

                <Flex gap={6} wrap="wrap">
                  <Flex gap={3} alignItems="center">
                    <Switch
                      checked={draft.stripes}
                      onCheckedChange={(checked: boolean) => set('stripes', checked)}
                      onLabel="On"
                      offLabel="Off"
                      disabled={locked}
                      aria-label="Hazard stripes"
                    />
                    <Typography>Hazard stripes</Typography>
                  </Flex>
                  <Flex gap={3} alignItems="center">
                    <Switch
                      checked={draft.pauseOnHover}
                      onCheckedChange={(checked: boolean) => set('pauseOnHover', checked)}
                      onLabel="On"
                      offLabel="Off"
                      disabled={locked}
                      aria-label="Pause on hover"
                    />
                    <Typography>Pause when the pointer is on it</Typography>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        </Layouts.Content>
      </Page.Main>
    </Layouts.Root>
  );
};

export default SettingsPage;
