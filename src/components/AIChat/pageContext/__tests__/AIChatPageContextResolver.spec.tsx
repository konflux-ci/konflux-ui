import * as React from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { act, render, screen } from '@testing-library/react';
import { getAIChatPageContextEntry } from '~/components/AIChat/pageContext/registry';
import { withRoutePatterns } from '~/routes/with-route-patterns';
import { AIChatPageContextProvider, useAIChatPageContext } from '../AIChatPageContext';
import { AIChatPageContextResolver } from '../AIChatPageContextResolver';

jest.mock('~/components/AIChat/pageContext/registry', () => ({
  getAIChatPageContextEntry: jest.fn(),
}));

const getAIChatPageContextEntryMock = getAIChatPageContextEntry as jest.Mock;

const MarkerSource: React.FC = () => <div data-test="ai-chat-page-context-source" />;

const Snapshot: React.FC = () => {
  const pageContext = useAIChatPageContext();
  return <div data-test="ai-chat-page-context">{pageContext ? 'has-page' : 'empty'}</div>;
};

const renderResolver = (initialEntry: string) => {
  const router = createMemoryRouter(
    withRoutePatterns([
      {
        path: '/ns/:workspaceName/applications',
        element: (
          <>
            <AIChatPageContextResolver />
            <Snapshot />
          </>
        ),
      },
      {
        path: '/other',
        element: (
          <>
            <AIChatPageContextResolver />
            <Snapshot />
          </>
        ),
      },
    ]),
    { initialEntries: [initialEntry] },
  );

  render(
    <AIChatPageContextProvider>
      <RouterProvider router={router} />
    </AIChatPageContextProvider>,
  );

  return router;
};

describe('AIChatPageContextResolver', () => {
  beforeEach(() => {
    getAIChatPageContextEntryMock.mockImplementation((routePattern: string) =>
      routePattern === '/ns/:workspaceName/applications'
        ? {
            id: 'application-list',
            routePattern,
            Source: MarkerSource,
          }
        : undefined,
    );
  });

  it('should mount the catalog source for the current route', () => {
    renderResolver('/ns/demo/applications');

    expect(screen.getByTestId('ai-chat-page-context-source')).toBeInTheDocument();
    expect(screen.getByTestId('ai-chat-page-context')).toHaveTextContent('empty');
  });

  it('should mount nothing when the route is not in the catalog', async () => {
    const router = renderResolver('/ns/demo/applications');

    expect(screen.getByTestId('ai-chat-page-context-source')).toBeInTheDocument();

    await act(async () => {
      await router.navigate('/other');
    });

    expect(screen.queryByTestId('ai-chat-page-context-source')).not.toBeInTheDocument();
    expect(screen.getByTestId('ai-chat-page-context')).toHaveTextContent('empty');
  });
});
