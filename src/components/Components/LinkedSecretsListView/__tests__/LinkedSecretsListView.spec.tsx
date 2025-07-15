import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
        {
          ...mockedSecret,
          metadata: {
            ...mockedSecret.metadata,
            name: 'build-pipeline-c7814-token-fbljb',
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

    expect(screen.getByText('Unable to load linked secrets')).toBeInTheDocument();
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

  it('should render filter toolbar and filter linked secrets based on name', () => {
    renderComponent();
    expect(screen.getByTestId('linked-secrets-list-toolbar')).toBeInTheDocument();
    const nameSearchInput = screen.getByTestId('name-input-filter');
    const searchInput = nameSearchInput.querySelector('.pf-v5-c-text-input-group__text-input');
    fireEvent.change(searchInput, { target: { value: 'pipeline' } });
    const linkedSecretsList = screen.getByLabelText('Linked Secrets List');
    const linkedSecretsListItems = within(linkedSecretsList).getAllByTestId(
      'linked-secrets-list-item',
    );
    expect(linkedSecretsListItems.length).toBe(2);
  });

  it('should clear filters from empty state', async () => {
    const view = renderComponent();
    expect(screen.getAllByTestId('linked-secrets-list-item')).toHaveLength(2);

    const nameSearchInput = screen.getByTestId('name-input-filter');
    const textFilterInput = nameSearchInput.querySelector('.pf-v5-c-text-input-group__text-input');
    await act(() => fireEvent.change(textFilterInput, { target: { value: 'no match' } }));

    view.rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <LinkedSecretsListView />
      </QueryClientProvider>,
    );
    expect(screen.queryAllByTestId('linked-secrets-list-item')).toHaveLength(0);

    const clearFilterButton = screen.getByRole('button', { name: 'Clear all filters' });
    fireEvent.click(clearFilterButton);

    view.rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <LinkedSecretsListView />
      </QueryClientProvider>,
    );

    expect(screen.getAllByTestId('linked-secrets-list-item')).toHaveLength(2);
  });
});
