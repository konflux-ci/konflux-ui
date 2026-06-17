import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { screen, fireEvent, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { componentCRMocks } from '../../../Components/__data__/mock-data';
import SnapshotComponentsList from '../SnapshotComponentsList';

jest.useFakeTimers();

const mockComponents = componentCRMocks.reduce((acc, mock) => {
  acc.push({ ...mock, spec: { ...mock.spec, application: 'test-app' } });
  return acc;
}, []);

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../../../shared', () => {
  const actual = jest.requireActual('../../../../shared');
  const SharedTable = actual.Table;
  return {
    ...actual,
    Table: (props) => <SharedTable {...props} virtualize={false} />,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

const SnapshotComponents = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name']}>
      <SnapshotComponentsList applicationName="test-app" components={mockComponents} />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('SnapshotComponentsList', () => {
  it('should render empty state when no components are passed', () => {
    renderWithQueryClient(
      <MemoryRouter>
        <FilterContextProvider filterParams={['name']}>
          <SnapshotComponentsList applicationName="test-app" components={[]} />
        </FilterContextProvider>
      </MemoryRouter>,
    );
    screen.getByText('Add component');
  });

  it('should render correct columns and titles', () => {
    renderWithQueryClient(SnapshotComponents);
    screen.getByText('Components');
    screen.getByText('Component builds that are included in this snapshot');
    screen.getByText('Name');
    screen.getByText('Container Image');
    screen.getByText('Git URL');
    screen.getByText('Revision');
  });

  it('should render component row', () => {
    renderWithQueryClient(SnapshotComponents);
    screen.queryByText('nodejs');
    screen.queryByText('main');
    screen.queryByText('https://github.com/nodeshift-starters/devfile-sample.git');
  });

  it('should render multiple components', () => {
    renderWithQueryClient(SnapshotComponents);
    screen.queryByText('nodejs');
    screen.queryByText('basic-node-js');
    screen.queryByText('https://github.com/nodeshift-starters/devfile-sample');
    screen.queryByText('main');
    screen.queryByText('https://github.com/nodeshift-starters/devfile-sample.git');
  });

  it('should render filter toolbar ', () => {
    renderWithQueryClient(SnapshotComponents);
    expect(screen.getByTestId('component-list-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('name-input-filter')).toBeInTheDocument();
  });

  it('should filter components based on name', () => {
    renderWithQueryClient(SnapshotComponents);
    const nameSearchInput = screen.getByPlaceholderText('Filter by name...');
    act(() => {
      fireEvent.change(nameSearchInput, { target: { value: 'basic-node-js' } });
      jest.advanceTimersByTime(700);
    });

    screen.queryByText('basic-node-js');
    expect(screen.queryByText('nodejs')).not.toBeInTheDocument();
  });

  it('should filter components when name filter has surrounding whitespace', () => {
    renderWithQueryClient(SnapshotComponents);
    expect(screen.getAllByTestId('snapshot-component-list-row')).toHaveLength(2);
    const nameSearchInput = screen.getByPlaceholderText('Filter by name...');
    act(() => {
      fireEvent.change(nameSearchInput, { target: { value: '  basic-node-js  ' } });
      jest.advanceTimersByTime(700);
    });
    expect(screen.getAllByTestId('snapshot-component-list-row')).toHaveLength(1);
  });

  it('should render emptystate', () => {
    renderWithQueryClient(SnapshotComponents);
    expect(screen.getByTestId('component-list-toolbar')).toBeInTheDocument();
    const nameSearchInput = screen.getByPlaceholderText('Filter by name...');
    act(() => {
      fireEvent.change(nameSearchInput, { target: { value: 'no-match' } });
      jest.advanceTimersByTime(700);
    });
    expect(screen.queryByText('nodejs')).not.toBeInTheDocument();
    expect(screen.queryByText('basic-node-js')).not.toBeInTheDocument();
    screen.queryByText('No components found attached to this snapshot');
  });
});
