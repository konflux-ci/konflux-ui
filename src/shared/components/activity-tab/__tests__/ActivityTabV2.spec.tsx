import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, screen } from '@testing-library/react';
import { createTestQueryClient, routerRenderer } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ActivityTabV2 } from '../ActivityTabV2';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useParams: jest.fn(),
  };
});

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(() => [{}, true, undefined]),
  useComponents: jest.fn(() => [[], true, undefined]),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
}));

jest.mock('~/hooks/useScanResults', () => ({
  usePLRVulnerabilities: jest.fn(() => ({})),
}));

const useNavigateMock = useNavigate as jest.Mock;
const useParamsMock = useParams as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('test-ns');

describe('ActivityTabV2', () => {
  let navigateMock: jest.Mock;
  let queryClient: QueryClient;

  const renderWithProviders = (element: React.ReactElement) => {
    return routerRenderer(
      React.createElement(QueryClientProvider, { client: queryClient }, element),
    );
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useParamsMock.mockReturnValue({
      componentName: 'test-component',
      workspaceName: 'test-ns',
    });
    useNamespaceMock.mockReturnValue('test-ns');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate to pipeline runs tab when clicked', () => {
    renderWithProviders(<ActivityTabV2 />);

    const plrTab = screen.getByTestId('activity__tabItem pipelineruns');
    act(() => {
      fireEvent.click(plrTab);
    });

    expect(navigateMock).toHaveBeenCalledWith(expect.stringContaining('/activity/pipelineruns'));
  });

  it('should display the correct active tab', () => {
    useParamsMock.mockReturnValue({
      componentName: 'test-component',
      workspaceName: 'test-ns',
      activityTab: 'pipelineruns',
    });
    const activitiesPage = renderWithProviders(<ActivityTabV2 />);
    const tabs = activitiesPage.getByTestId('activities-tabs-id');
    const activeTab = tabs.querySelector(
      '.pf-v5-c-tabs__item.pf-m-current .pf-v5-c-tabs__item-text',
    );
    expect(activeTab).toHaveTextContent('Pipeline runs');
  });
});
