import { MemoryRouter } from 'react-router-dom';
import { fireEvent, waitFor, render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { createK8sWatchResourceMock } from '../../../../utils/test-utils';
import { MockIntegrationTests } from '../__data__/mock-integration-tests';
import IntegrationTestsListView from '../IntegrationTestsListView';

const navigateMock = jest.fn();
jest.useFakeTimers();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: () => navigateMock,
  useParams: () => ({ applicationName: 'test-app' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../shared/providers/Namespace', () => ({
  useNamespace: jest.fn(() => 'test-ns'),
}));

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const useK8sWatchResourceMock = createK8sWatchResourceMock();

const IntegrationTestsList = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name']}>
      <IntegrationTestsListView />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('IntegrationTestsListView', () => {
  it('should render the empty state if there are no integration tests', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);
    const wrapper = render(IntegrationTestsList);
    expect(wrapper.findByText('Test any code changes')).toBeTruthy();
  });

  it('should render a table when there are integration tests', () => {
    useK8sWatchResourceMock.mockReturnValue([MockIntegrationTests, true, undefined]);
    const wrapper = render(IntegrationTestsList);

    expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1);
    expect(wrapper.container.getElementsByTagName('tr')).toHaveLength(4);
    expect(screen.getByText('test-app-test-1'));
    expect(screen.getByText('test-app-test-2'));
  });

  it('should filter the table when a name is entered', () => {
    useK8sWatchResourceMock.mockReturnValue([MockIntegrationTests, true, undefined]);
    render(IntegrationTestsList);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, {
      target: { value: 'test-app-test-1' },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByText('test-app-test-1'));
    expect(screen.queryByText('test-app-test-2')).not.toBeInTheDocument();
  });

  it('should handle no matched tests', () => {
    useK8sWatchResourceMock.mockReturnValue([MockIntegrationTests, true, undefined]);
    render(IntegrationTestsList);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    fireEvent.change(filter, {
      target: { value: 'unmatched-name' },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.queryByText('test-app-test-1')).not.toBeInTheDocument();
    expect(screen.queryByText('test-app-test-2')).not.toBeInTheDocument();

    // clear the filter
    const clearFilterButton = screen.getAllByRole('button', { name: 'Clear all filters' })[0];
    fireEvent.click(clearFilterButton);

    expect(screen.queryByText('test-app-test-1')).toBeInTheDocument();
    expect(screen.queryByText('test-app-test-2')).toBeInTheDocument();
  });

  it('should show button to add integration test and it should redirect to add integration page', async () => {
    useK8sWatchResourceMock.mockReturnValue([MockIntegrationTests, true, undefined]);
    const integrationListView = render(IntegrationTestsList);
    fireEvent.click(integrationListView.getByTestId('add-integration-test'));

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/ns/test-ns/applications/test-app/integrationtests/add',
      ),
    );
  });

  it('should show the add integration test page on Add action', async () => {
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);
    const wrapper = render(IntegrationTestsList);
    const addButton = wrapper.getByTestId('add-integration-test');
    fireEvent.click(addButton);

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(
        '/ns/test-ns/applications/test-app/integrationtests/add',
      ),
    );
  });
});
