import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, type RenderOptions } from '@testing-library/react';
import { NuqsAdapter } from '~/shared/components/Filter';

/**
 * Renders a component wrapped in MemoryRouter + NuqsAdapter.
 * Use for testing filter components that read/write URL state.
 *
 * Does NOT include PatternFly Toolbar wrapping — add that in the test
 * file if the component requires it.
 */
export function renderWithNuqsRouter(
  ui: React.ReactElement,
  options?: RenderOptions & { initialEntries?: string[] },
) {
  const { initialEntries = ['/'], ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </MemoryRouter>
    ),
    ...renderOptions,
  });
}
