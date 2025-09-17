import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { createUseParamsMock } from '../../../utils/test-utils';
import { mockReleases } from '../__data__/mock-release-data';
import ReleasesListRow from '../ReleasesListRow';
import ReleasesListView from '../ReleasesListView';

jest.useFakeTimers();

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResources: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

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
            {props.data.map((obj, i) => (
              <tr key={i}>
                <ReleasesListRow
                  obj={obj}
                  columns={null}
                  customData={{ applicationName: 'test-app' }}
                />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

const useMockReleases = useK8sAndKarchResources as jest.Mock;

const ReleasesList = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name', 'release plan', 'release snapshot']}>
      <ReleasesListView />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('ReleasesListView', () => {
  createUseParamsMock({ applicationName: 'test-app' });

  it('should render progress indicator while loading', async () => {
    useMockReleases.mockReturnValue({ data: [], isLoading: true });
    const wrapper = render(ReleasesList);
    expect(await wrapper.findByRole('progressbar')).toBeTruthy();
  });

  it('should render all columns', () => {
    useMockReleases.mockReturnValue({ data: mockReleases, isLoading: true });
    render(ReleasesList);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Created' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Release Plan' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Release Snapshot' })).toBeVisible();
  });

  it('should render empty state when no releases present', () => {
    useMockReleases.mockReturnValue({ data: [], isLoading: false, hasError: false });
    render(ReleasesList);
    expect(screen.queryByText('Learn more about setting up release plans')).toBeInTheDocument();
  });

  it('should render table', () => {
    useMockReleases.mockReturnValue({ data: mockReleases, isLoading: false });
    const wrapper = render(ReleasesList);
    const table = wrapper.container.getElementsByTagName('table');
    expect(table).toHaveLength(1);
  });

  it('should render filter toolbar', () => {
    useMockReleases.mockReturnValue({ data: mockReleases, isLoading: false });
    const wrapper = render(ReleasesList);
    screen.getByTestId('releases-filter-toolbar');
    expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1);
    expect(wrapper.container.getElementsByTagName('tr')).toHaveLength(4);
  });

  it('should sort by creation date by default', () => {
    useMockReleases.mockReturnValue({ data: mockReleases, isLoading: false });
    render(ReleasesList);
    expect(screen.getByRole('columnheader', { name: 'Created' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'none');
    const rows = screen.getAllByRole('row');
    expect(rows[1].children[0]).toHaveTextContent('test-release-2');
    expect(rows[2].children[0]).toHaveTextContent('test-release');
    expect(rows[3].children[0]).toHaveTextContent('test-release-3');
  });

  it('should sort by name on click', () => {
    useMockReleases.mockReturnValue({ data: mockReleases, isLoading: false });
    render(ReleasesList);
    const table = screen.getByRole('table');
    fireEvent.click(within(table).getByRole('button', { name: 'Name' }));
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.getByRole('columnheader', { name: 'Created' })).toHaveAttribute(
      'aria-sort',
      'none',
    );
    const rows = screen.getAllByRole('row');
    expect(rows[1].children[0]).toHaveTextContent('test-release');
    expect(rows[2].children[0]).toHaveTextContent('test-release-2');
    expect(rows[3].children[0]).toHaveTextContent('test-release-3');

    fireEvent.click(within(table).getByRole('button', { name: 'Name' }));
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(rows[1].children[0]).toHaveTextContent('test-release-3');
    expect(rows[2].children[0]).toHaveTextContent('test-release-2');
    expect(rows[3].children[0]).toHaveTextContent('test-release');
  });

  it('should allow filtering by name', () => {
    useMockReleases.mockReturnValue({ data: mockReleases, isLoading: false });
    render(ReleasesList);
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'test-release-2' } });
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(rows[1].children[0]).toHaveTextContent('test-release-2');
  });

  it('should allow filtering by release plan', () => {
    useMockReleases.mockReturnValue({ data: mockReleases, isLoading: false });
    render(ReleasesList);
    fireEvent.click(screen.getAllByRole('button')[0], { name: 'Name' });
    fireEvent.click(screen.getByRole('option', { name: 'Release plan' }));
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'test-plan-2' } });
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(rows[1].children[4]).toHaveTextContent('test-plan-2');
  });

  it('should allow filtering by release snapshot', () => {
    useMockReleases.mockReturnValue({ data: mockReleases, isLoading: false });
    render(ReleasesList);
    fireEvent.click(screen.getAllByRole('button')[0], { name: 'Name' });
    fireEvent.click(screen.getByRole('option', { name: 'Release snapshot' }));
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'test-snapshot-2' } });
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(rows[1].children[5]).toHaveTextContent('test-snapshot-2');
  });
});
