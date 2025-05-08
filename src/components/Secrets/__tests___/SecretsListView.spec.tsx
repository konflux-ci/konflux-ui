import * as React from 'react';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { screen, render, fireEvent } from '@testing-library/react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { useSecrets } from '../../../hooks/useSecrets';
import { RemoteSecretStatusReason } from '../../../types';
import { mockServiceAccounts } from '../__data__/mock-secrets';
import SecretsListView from '../SecretsListView/SecretsListView';
import { sampleRemoteSecrets } from './secret-data';

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
    useSearchParams: () => React.useState(() => new URLSearchParams()),
    useParams: jest.fn(),
  };
});

jest.mock('../../../hooks/useSecrets', () => ({
  useSecrets: jest.fn(),
}));

jest.mock('~/hooks/useLinkedServiceAccounts', () => ({
  useLinkedServiceAccounts: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

jest.mock('../../../shared/components/table', () => {
  const actual = jest.requireActual('../../../shared/components/table');
  return {
    ...actual,
    Table: (props) => {
      const { data, Header, Row, filters, selected, match, kindObj, customData } = props;
      const cProps = { data, filters, selected, match, kindObj };
      const columns = Header(cProps);
      return (
        <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
          <TableHeader role="rowgroup" />
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <Row columns={null} obj={d} customData={customData} />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

const useSecretsMock = useSecrets as jest.Mock;
const mockUseLinkedServiceAccounts = useLinkedServiceAccounts as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

describe('Secrets List', () => {
  it('should render the loader if the secrets are not loaded', () => {
    useSecretsMock.mockReturnValue([[], false]);
    render(<SecretsListView />);
    screen.getByRole('progressbar');
  });
  it('should render the empty state if there are not remote secrets in the workspace', () => {
    useSecretsMock.mockReturnValue([[], true]);
    render(<SecretsListView />);
    expect(screen.queryByTestId('secrets-empty-state')).toBeInTheDocument();
  });

  it('should render all the remote secrets in the workspace', () => {
    useSecretsMock.mockReturnValue([
      [
        {
          ...sampleRemoteSecrets[RemoteSecretStatusReason.AwaitingData],
          type: 'kubernetes.io/dockerconfigjson',
        },
      ],
      true,
    ]);
    render(<SecretsListView />);

    expect(screen.queryByTestId('secrets-empty-state')).not.toBeInTheDocument();

    screen.getByText('test-secret-one');
    screen.getByText('Image pull');
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
    const r = render(<SecretsListView />);
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Search secrets');
    fireEvent.change(filter, {
      target: { value: 'test-secret-two' },
    });
    r.rerender(<SecretsListView />);
    expect(filter.value).toBe('test-secret-two');
    expect(screen.queryByText('test-secret-one')).not.toBeInTheDocument();
    screen.getByText('test-secret-two');
    screen.getByText('Key/value (1)');
  });
});

describe('Secrets List With Components', () => {
  beforeEach(() => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
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
      data: mockServiceAccounts,
      isLoading: false,
      isError: false,
    });
  });
  it('should render the loader if the secrets are not loaded', () => {
    useSecretsMock.mockReturnValue([[], false]);
    render(<SecretsListView />);

    screen.getByRole('progressbar');
  });

  it('should render the empty state if there are not remote secrets in the workspace', () => {
    useSecretsMock.mockReturnValue([[], true]);
    render(<SecretsListView />);

    expect(screen.queryByTestId('secrets-empty-state')).toBeInTheDocument();
  });

  it('should render all the remote secrets in the namespace', () => {
    render(<SecretsListView />);

    expect(screen.queryByTestId('secrets-empty-state')).not.toBeInTheDocument();
    screen.getByText('test-secret-one');
    screen.getByText('Image pull');
    screen.getByText('Components');
    expect(screen.getByTestId('components-count')).toHaveTextContent('2');
  });

  it('should render all the remote secrets with loading components in the namespace', () => {
    mockUseLinkedServiceAccounts.mockReturnValue({
      data: mockServiceAccounts,
      isLoading: true,
      isError: false,
    });
    render(<SecretsListView />);
    screen.getByText('Components');
    screen.getByRole('progressbar');
  });

  it('should render all the remote secrets with  error components in the namespace', () => {
    mockUseLinkedServiceAccounts.mockReturnValue({
      data: mockServiceAccounts,
      isLoading: false,
      isError: true,
    });
    render(<SecretsListView />);
    screen.getByText('Components');
    expect(screen.getByTestId('components-error')).toHaveTextContent('Error');
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
    const r = render(<SecretsListView />);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Search secrets');
    fireEvent.change(filter, {
      target: { value: 'test-secret-two' },
    });

    r.rerender(<SecretsListView />);

    expect(filter.value).toBe('test-secret-two');
    expect(screen.queryByText('test-secret-one')).not.toBeInTheDocument();

    screen.getByText('test-secret-two');
    screen.getByText('Key/value (1)');
  });
});
