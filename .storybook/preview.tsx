import React from 'react';
import type { Preview } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

// PatternFly 5 CSS
import '@patternfly/patternfly/patternfly.min.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
