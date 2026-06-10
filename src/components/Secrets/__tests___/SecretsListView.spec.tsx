import { MemoryRouter } from 'react-router-dom';
import { Table, Thead, Tr, Th, Tbody } from '@patternfly/react-table';
import { screen, render, fireEvent, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { mockServiceAccounts } from '~/components/Secrets/__data__/mock-secrets';
import SecretsListRowWithComponents from '~/components/Secrets/SecretsListView/SecretsListRowWithComponents';
import SecretsListView from '~/components/Secrets/SecretsListView/SecretsListView';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { useSecrets } from '~/hooks/useSecrets';
import { RemoteSecretStatusReason } from '~/types';
import { useAccessReviewForModel } from '~/utils/rbac';
import { sampleRemoteSecrets } from './secret-data';

jest.useFakeTimers();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => (
      <a href={props.to} data-test={props['data-test']}>
        {props.children}
      </a>
    ),
    useNavigate: () => jest.fn(),
    useParams: jest.fn(),
  };
});

jest.mock('~/hooks/useSecrets', () => ({
  useSecrets: jest.fn(),
}));

jest.mock('~/hooks/useLinkedServiceAccounts', () => ({
  useLinkedServiceAccounts: jest.fn(),
}));

jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(() => 'test-ns'),
}));

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('~/shared/components/table', () => {
  const actual = jest.requireActual('~/shared/components/table');

  return {
    ...actual,
    Table: (props) => {
      const { data, filters, selected, match, kindObj } = props;
      const cProps = { data, filters, selected, match, kindObj };
      const columns = props.Header(cProps);

      return (
        <Table role="table" aria-label="table" variant="compact" borders={true}>
          <Thead>
            <Tr>
              {columns.map((col, idx) => (
                <Th key={idx} {...(col.props ?? {})}>
                  {col.title}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((d, i) => (
              <Tr key={i}>
                <SecretsListRowWithComponents
                  columns={columns}
                  obj={d}
                  customData={props.customData}
                />
              </Tr>
            ))}
          </Tbody>
        </Table>
      );
    },
  };
});

const useSecretsMock = useSecrets as jest.Mock;
const mockUseLinkedServiceAccounts = useLinkedServiceAccounts as jest.Mock;
const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

const SecretsList = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name']}>
      <SecretsListView />
    </FilterContextProvider>
  </MemoryRouter>
);
describe('Secrets List With Components and Status', () => {
  beforeEach(() => {
    mockUseIsOnFeatureFlag.mockImplementation((flag) => flag === 'edit-secret-page');
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    useSecretsMock.mockReturnValue([
      [
        {
          ...sampleRemoteSecrets[RemoteSecretStatusReason.AwaitingData],
          type: 'kubernetes.io/dockerconfigjson',
        },
      ],
      true,
    ]);
    mockUseLinkedServiceAccounts.mockReturnValue({
      linkedServiceAccounts: mockServiceAccounts,
      isLoading: false,
      error: null,
    });
  });

  it('should render the loader if the secrets are not loaded', () => {
    useSecretsMock.mockReturnValue([[], false]);
    render(SecretsList);

    screen.getByRole('progressbar');
  });

  it('should render the empty state if there are not remote secrets in the workspace', () => {
    useSecretsMock.mockReturnValue([[], true]);
    render(SecretsList);

    expect(screen.queryByTestId('secrets-empty-state')).toBeInTheDocument();
  });

  it('should render the error state if there is an error loading the secrets', () => {
    useSecretsMock.mockReturnValue([[], true, Error()]);
    render(SecretsList);
    expect(screen.getByText('Unable to load secrets')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render all the remote secrets in the namespace', () => {
    render(SecretsList);

    expect(screen.queryByTestId('secrets-empty-state')).not.toBeInTheDocument();
    screen.getByText('test-secret-one');
    screen.getByText('Image pull');
    screen.getByText('Components');
    expect(screen.getByTestId('components-content')).toHaveTextContent('2');
    screen.getByText('Status');
  });

  it('should render all the remote secrets with loading components in the namespace', () => {
    mockUseLinkedServiceAccounts.mockReturnValue({
      linkedServiceAccounts: mockServiceAccounts,
      isLoading: true,
      error: null,
    });
    render(SecretsList);
    screen.getByText('Components');
    screen.getByText('Status');
    screen.getByRole('progressbar');
  });

  it('should render all the remote secrets with  error components in the namespace', () => {
    mockUseLinkedServiceAccounts.mockReturnValue({
      linkedServiceAccounts: mockServiceAccounts,
      isLoading: false,
      error: {
        message: 'Forbidden',
      },
    });
    render(SecretsList);
    screen.getByText('Components');
    expect(screen.getByTestId('components-content')).toHaveTextContent('Error');
  });

  it('should filter the remote secrets in the workspace', () => {
    useSecretsMock.mockReturnValue([
      [
        {
          metadata: { name: 'test-secret-three' },
          ...sampleRemoteSecrets[RemoteSecretStatusReason.AwaitingData],
          type: 'kubernetes.io/dockerconfigjson',
        },
        {
          metadata: { name: 'test-secret-two' },
          ...sampleRemoteSecrets[RemoteSecretStatusReason.Injected],
          type: 'Opaque',
          data: { keys: ['test'] },
        },
      ],
      true,
    ]);
    render(SecretsList);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'test-secret-two' },
      });
      jest.advanceTimersByTime(700);
    });

    expect(filter.value).toBe('test-secret-two');
    expect(screen.queryByText('test-secret-one')).not.toBeInTheDocument();

    screen.getByText('test-secret-two');
    screen.getByText('Key/value (1)');
  });

  it('should render secret name as a link to the edit page', () => {
    render(SecretsList);

    const secretNameLink = screen.getByTestId('secret-name-link');
    expect(secretNameLink).toBeInTheDocument();
    expect(secretNameLink).toHaveAttribute(
      'href',
      '/ns/test-ns/secrets/edit?secretName=test-secret-one',
    );
    expect(secretNameLink).toHaveTextContent('test-secret-one');
  });

  it('should render secret name as plain text when user lacks patch permission', () => {
    useAccessReviewForModelMock.mockReturnValue([false, true]);
    render(SecretsList);

    const secretNameText = screen.getByTestId('secret-name');
    expect(secretNameText).toBeInTheDocument();
    expect(secretNameText).toHaveTextContent('test-secret-one');
    expect(screen.queryByTestId('secret-name-link')).not.toBeInTheDocument();
  });

  it('should render secret name as plain text when edit-secret-page flag is disabled', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    render(SecretsList);

    const secretNameText = screen.getByTestId('secret-name');
    expect(secretNameText).toBeInTheDocument();
    expect(secretNameText).toHaveTextContent('test-secret-one');
    expect(screen.queryByTestId('secret-name-link')).not.toBeInTheDocument();
  });
});
