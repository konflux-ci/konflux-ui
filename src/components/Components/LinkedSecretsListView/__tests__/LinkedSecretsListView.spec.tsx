import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { mockedSecret } from '../../../../hooks/__data__/mock-data';
import { useComponent } from '../../../../hooks/useComponents';
import { useLinkedSecrets } from '../../../../hooks/useLinkedSecrets';
import { createTestQueryClient } from '../../../../utils/test-utils';
import { mockComponentsData } from '../../../ApplicationDetails/__data__';
import { LinkedSecretsListView } from '../LinkedSecretsListView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));
jest.mock('../../../../hooks/useLinkedSecrets', () => ({
  useLinkedSecrets: jest.fn(),
}));
jest.mock('../../../../hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

const useLinkedSecretsMock = useLinkedSecrets as jest.Mock;
const useComponentMock = useComponent as jest.Mock;

const renderComponent = () => {
  const queryClient = createTestQueryClient();
  return render(<LinkedSecretsListView />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
  });
};

describe('LinkedSecretsListView', () => {
  beforeEach(() => {
    useLinkedSecretsMock.mockReturnValue([
      [
        {
          ...mockedSecret,
          metadata: {
            ...mockedSecret.metadata,
            name: 'build-pipeline-c7814-dockercfg-bksxm',
            deletionTimestamp: undefined,
          },
        },
      ],
      true,
    ]);
    useComponentMock.mockReturnValue([mockComponentsData[0], true]);
  });

  it('should render spinner if application data is not loaded', () => {
    useLinkedSecretsMock.mockReturnValue([[], false]);
    renderComponent();
    screen.getByTestId('spinner');
  });

  it("it should render error empty state component if there's an API error", () => {
    useLinkedSecretsMock.mockReturnValue([[], true, new Error('Error when fetching secrets')]);
    renderComponent();

    expect(screen.getByTestId('linked-secrets-list-view_error-empty-state')).toBeInTheDocument();
  });

  it('should render empty message component if no data is returned', () => {
    useLinkedSecretsMock.mockReturnValue([[], true]);
    renderComponent();

    expect(screen.getByTestId('linked-secrets-list-no-data-empty-message')).toBeInTheDocument();
  });

  it('should render correct columns when linkedSecrets are present', () => {
    renderComponent();
    screen.queryByText('Secret name');
    screen.queryByText('Type');
    screen.queryByText('Labels');
    screen.queryAllByText('Actions');
  });

  it('should render entire linkedSecrets list', () => {
    renderComponent();
    expect(screen.queryByText('build-pipeline-c7814-dockercfg-bksxm')).toBeInTheDocument();
  });
});
