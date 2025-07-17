import * as React from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { RenderOptions, render } from '@testing-library/react';
import { createJestMockFunction } from './common';
import type { JestMockedFunction } from './type';

// React Router mock utilities

/**
 * Creates a mock for useParams hook with initial values
 */
export const createUseParamsMock = (
  initialValue: Record<string, string> = {},
): JestMockedFunction<() => Record<string, string>> => {
  const mockFn =
    createJestMockFunction<() => Record<string, string>>().mockReturnValue(initialValue);

  jest.spyOn(ReactRouterDom, 'useParams').mockImplementation(mockFn);

  return mockFn;
};

export const createReactRouterMock = (name: string): jest.Mock => {
  const mockFn = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(ReactRouterDom as any, name).mockImplementation(mockFn);

  return mockFn;
};

/**
 * Renders a component with BrowserRouter wrapper
 */
export const routerRenderer = (
  element: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) =>
  render(element, {
    wrapper: ({ children }) => React.createElement(ReactRouterDom.BrowserRouter, null, children),
    ...options,
  });
