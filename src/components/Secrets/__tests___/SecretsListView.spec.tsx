import { MemoryRouter } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { screen, render, fireEvent, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useSecrets } from '../../../hooks/useSecrets';
import { RemoteSecretStatusReason } from '../../../types';
import SecretsListRow from '../SecretsListView/SecretsListRow';
import SecretsListView from '../SecretsListView/SecretsListView';
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

jest.mock('../../../hooks/useSecrets', () => ({
  useSecrets: jest.fn(),
}));

jest.mock('../../../shared/components/table', () => {
  const actual = jest.requireActual('../../../shared/components/table');
  return {
    ...actual,
    Table: (props) => {
      const { data, filters, selected, match, kindObj } = props;
      const cProps = { data, filters, selected, match, kindObj };
      const columns = props.Header(cProps);
      return (
        <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
          <TableHeader role="rowgroup" />
          <tbody>
            {props.data.map((d, i) => (
              <tr key={i}>
                <SecretsListRow columns={null} obj={d} customData={props.customData} />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

const useSecretsMock = useSecrets as jest.Mock;

const SecretsList = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name']}>
      <SecretsListView />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('Secrets List', () => {
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
    render(SecretsList);

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
});
