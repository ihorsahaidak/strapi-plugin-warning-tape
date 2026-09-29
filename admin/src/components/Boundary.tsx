import * as React from 'react';
import { Alert, Box, Flex, Typography } from '@strapi/design-system';

import { readFailures, recordFailure } from '../utils/adminState';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

/**
 * A Strapi upgrade can change the components this page is built from. If that
 * happens the page says so, instead of blanking out the Settings area.
 */
class Boundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    recordFailure('rendering the settings page', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Box padding={8}>
        <Flex direction="column" alignItems="stretch" gap={4}>
          <Alert title="The warning tape settings could not be shown" variant="danger" closeLabel="Close">
            {this.state.error.message}
          </Alert>
          <Typography variant="pi" textColor="neutral600">
            This usually means the plugin is older than this Strapi. The tape itself switches off on
            its own in that case — updating strapi-plugin-warning-tape should bring both back.
          </Typography>
          {readFailures().map((failure) => (
            <Typography key={`${failure.where}-${failure.message}`} variant="pi" textColor="neutral600">
              {failure.where}: {failure.message}
            </Typography>
          ))}
        </Flex>
      </Box>
    );
  }
}

export default Boundary;
