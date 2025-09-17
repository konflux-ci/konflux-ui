import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
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

jest.mock('../../../../utils/component-utils', () => {
  const actual = jest.requireActual('../../../utils/component-utils');
  return {
    ...actual,
    useURLForComponentPRs: jest.fn(),
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
  it('should render correct columns and titles', () => {
    render(SnapshotComponents);
    screen.getByText('Components');
    screen.getByText('Component builds that are included in this snapshot');
    screen.getByText('Name');
    screen.getByText('Container Image');
    screen.getByText('Git URL');
    screen.getByText('Revision');
  });

  it('should render component row', () => {
    render(SnapshotComponents);
    screen.queryByText('nodejs');
    screen.queryByText('main');
    screen.queryByText('https://github.com/nodeshift-starters/devfile-sample.git');
  });

  it('should render multiple components', () => {
    render(SnapshotComponents);
    screen.queryByText('nodejs');
    screen.queryByText('basic-node-js');
    screen.queryByText('https://github.com/nodeshift-starters/devfile-sample');
    screen.queryByText('main');
    screen.queryByText('https://github.com/nodeshift-starters/devfile-sample.git');
  });

  it('should render filter toolbar ', () => {
    render(SnapshotComponents);
    expect(screen.getByTestId('component-list-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('name-input-filter')).toBeInTheDocument();
  });

  it('should filter components based on name', () => {
    render(SnapshotComponents);
    const nameSearchInput = screen.getByPlaceholderText('Filter by name...');
    act(() => {
      fireEvent.change(nameSearchInput, { target: { value: 'basic-node-js' } });
      jest.advanceTimersByTime(700);
    });

    screen.queryByText('basic-node-js');
    expect(screen.queryByText('nodejs')).not.toBeInTheDocument();
  });

  it('should render emptystate', () => {
    render(SnapshotComponents);
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
