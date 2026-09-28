import * as React from 'react';
import { Box, Button, Field, Flex, TextInput, Typography } from '@strapi/design-system';

import { isColor, toHex } from '../utils/color';

type Props = {
  label: string;
  hint: string;
  /** `null` means "follow the environment preset". */
  value: string | null;
  auto: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
};

/** Swatch + text box for one value; the swatch only speaks hex, the box takes anything. */
const ColorField = ({ label, hint, value, auto, disabled, onChange }: Props) => {
  const [draft, setDraft] = React.useState(value ?? '');

  React.useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const effective = value ?? auto;
  const invalid = draft.trim() !== '' && !isColor(draft);

  return (
    <Field.Root name={label} hint={hint} error={invalid ? 'Not a CSS colour.' : undefined}>
      <Field.Label>{label}</Field.Label>
      <Flex gap={2} alignItems="center">
        <Box
          tag="input"
          type="color"
          aria-label={`${label} picker`}
          disabled={disabled}
          value={toHex(effective)}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          style={{
            width: '3.6rem',
            height: '3.6rem',
            padding: 0,
            border: 'none',
            background: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        <Box grow={1}>
          <TextInput
            aria-label={label}
            disabled={disabled}
            placeholder={`${auto} (automatic)`}
            value={draft}
            hasError={invalid}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const next = event.target.value;
              setDraft(next);
              if (next.trim() === '') onChange(null);
              else if (isColor(next)) onChange(next.trim());
            }}
          />
        </Box>
        {value === null ? (
          <Typography variant="pi" textColor="neutral500">
            automatic
          </Typography>
        ) : (
          <Button variant="tertiary" size="S" disabled={disabled} onClick={() => onChange(null)}>
            Automatic
          </Button>
        )}
      </Flex>
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
};

export default ColorField;
