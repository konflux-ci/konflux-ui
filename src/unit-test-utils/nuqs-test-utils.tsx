import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  render,
  renderHook,
  type RenderOptions,
  type RenderHookOptions,
} from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

type NuqsTestRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  searchParams?: string | Record<string, string> | URLSearchParams;
};

/**
 * Creates a wrapper component with NuqsTestingAdapter + MemoryRouter.
 * Use as a wrapper for any test that renders components using nuqs hooks.
 */
export const createNuqsWrapper = (
  searchParams?: string | Record<string, string> | URLSearchParams,
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter>
      <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>
    </MemoryRouter>
  );
  Wrapper.displayName = 'NuqsTestWrapper';
  return Wrapper;
};

/**
 * Renders a component wrapped in MemoryRouter + NuqsTestingAdapter.
 * Use for testing filter components that read/write URL state.
 *
 * Does NOT include PatternFly Toolbar wrapping — add that in the test
 * file if the component requires it.
 */
export const renderWithNuqs = (ui: React.ReactElement, options?: NuqsTestRenderOptions) => {
  const { searchParams, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: createNuqsWrapper(searchParams),
    ...renderOptions,
  });
};

/**
 * @deprecated Use renderWithNuqs instead.
 */
export function renderWithNuqsRouter(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return renderWithNuqs(ui, options);
}

/**
 * Render a hook wrapped in NuqsTestingAdapter + MemoryRouter.
 */
export const renderHookWithNuqs = <TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps> & {
    searchParams?: string | Record<string, string> | URLSearchParams;
  },
) => {
  const { searchParams, ...hookOptions } = options ?? {};
  return renderHook(hook, {
    wrapper: createNuqsWrapper(searchParams),
    ...hookOptions,
  });
};
