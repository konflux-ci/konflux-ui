import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { PACState } from '../../../../hooks/usePACState';
import { useTRPipelineRuns } from '../../../../hooks/useTektonResults';
import { ComponentGroupVersionKind, PipelineRunGroupVersionKind } from '../../../../models';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../../../utils/test-utils';
import { componentCRMocks } from '../../__data__/mock-data';
import { mockPipelineRuns } from '../../__data__/mock-pipeline-run';
import ComponentListView from '../ComponentListView';
import { getContainerImageLink } from '../ComponentsListRow';

jest.useFakeTimers();

const mockComponents = componentCRMocks.reduce((acc, mock) => {
  acc.push({ ...mock, spec: { ...mock.spec, application: 'test-app' } });
  return acc;
}, []);

jest.mock('../../../../hooks/useTektonResults');

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

jest.mock('../../../../hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('../../../../hooks/usePipelineRuns', () => ({
  ...jest.requireActual('../../../../hooks/usePipelineRuns'),
  useLatestBuildPipelineRunForComponent: () => [mockPipelineRuns[0], true],
}));

jest.mock('../../../../utils/component-utils', () => {
  const actual = jest.requireActual('../../../../utils/component-utils');
  return {
    ...actual,
    useURLForComponentPRs: jest.fn(),
  };
});

jest.mock('../../../../hooks/usePACStatesForComponents', () => {
  const actual = jest.requireActual('../../../../hooks/usePACState');
  return {
    ...actual,
    __esModule: true,
    default: () => {
      return { comp: PACState.pending };
    },
  };
});

const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;

const getMockedResources = (kind) => {
  if (!kind) {
    return [[], true];
  }
  if (kind.groupVersionKind === ComponentGroupVersionKind) {
    return [mockComponents, true];
  }
  if (kind?.groupVersionKind === PipelineRunGroupVersionKind) {
    return [mockPipelineRuns, true];
  }
  return [[], true];
};

const ComponentList = () => (
  <FilterContextProvider filterParams={['name', 'status']}>
    <ComponentListView applicationName="test-app" />
  </FilterContextProvider>
);

describe('ComponentListViewPage', () => {
  beforeEach(() => {
    useK8sWatchResourceMock.mockImplementation(getMockedResources);
  });

  mockUseNamespaceHook('test-ns');

  it('should render skeleton if data is not loaded', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false]);
    render(<ComponentList />);
    screen.getByTestId('data-table-skeleton');
  });

  it('should render button to add components', () => {
    render(<ComponentList />);
    const button = screen.getByText('Add component');
    expect(button).toBeInTheDocument();
    expect(button.closest('a').href).toBe(
      'http://localhost/ns/test-ns/import?application=test-app',
    );
  });

  it('should render filter toolbar and filter components based on name', () => {
    render(<ComponentList />);
    expect(screen.getByTestId('component-list-toolbar')).toBeInTheDocument();
    const nameSearchInput = screen.getByTestId('name-input-filter');
    const searchInput = nameSearchInput.querySelector('.pf-v5-c-text-input-group__text-input');
    fireEvent.change(searchInput, { target: { value: 'nodejs' } });
    const componentList = screen.getByTestId('component-list');
    const componentListItems = within(componentList).getAllByTestId('component-list-item');
    expect(componentListItems.length).toBe(2);
  });

  it('should show a warning when showMergeStatus is set', () => {
    render(<ComponentList />);
    screen.getByTestId('components-unmerged-build-pr');
  });
  it('should filter components by status', () => {
    const view = render(<ComponentList />);

    expect(view.getAllByTestId('component-list-item')).toHaveLength(2);

    // interact with filters
    const filterMenuButton = view.getByRole('button', { name: /status filter menu/i });
    fireEvent.click(filterMenuButton);

    const successCb = view.getByLabelText(/succeeded/i, {
      selector: 'input',
    }) as HTMLInputElement;
    fireEvent.click(successCb);
    view.rerender(<ComponentList />);

    expect(successCb.checked).toBe(true);
    expect(view.queryAllByTestId('component-list-item')).toHaveLength(1);
    fireEvent.click(successCb);
    view.rerender(<ComponentList />);

    expect(view.queryAllByTestId('component-list-item')).toHaveLength(2);

    const pendingCb = view.getByLabelText(/pending/i, {
      selector: 'input',
    }) as HTMLInputElement;
    fireEvent.click(pendingCb);
    view.rerender(<ComponentList />);

    expect(pendingCb.checked).toBe(true);
    expect(view.queryAllByTestId('component-list-item')).toHaveLength(1);
    fireEvent.click(pendingCb);
    view.rerender(<ComponentList />);

    // clear the filter
    expect(pendingCb.checked).toBe(false);
    expect(view.queryAllByTestId('component-list-item')).toHaveLength(2);
  });
  it('should clear filters from empty state', () => {
    const view = render(<ComponentList />);
    expect(screen.getAllByTestId('component-list-item')).toHaveLength(2);

    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by name...');
    act(() => {
      fireEvent.change(filter, {
        target: { value: 'no match' },
      });
    });
    act(() => jest.advanceTimersByTime(700));

    view.rerender(<ComponentList />);
    expect(screen.queryAllByTestId('component-list-item')).toHaveLength(0);

    const clearFilterButton = screen.getByRole('button', { name: 'Clear all filters' });
    fireEvent.click(clearFilterButton);

    view.rerender(<ComponentList />);

    expect(screen.getAllByTestId('component-list-item')).toHaveLength(2);
  });

  it('should get more data if there is another page', () => {
    const getNextPageMock = jest.fn();
    useTRPipelineRunsMock.mockReturnValue([[], true, undefined, getNextPageMock]);
    render(<ComponentList />);
    expect(getNextPageMock).toHaveBeenCalled();
  });
});

describe('getContainerImageLink', () => {
  it('should return valid container image url', () => {
    expect(getContainerImageLink('https://quay.io/repo/image')).toEqual(
      'https://quay.io/repo/image',
    );
    expect(getContainerImageLink('quay.io/repo/image')).toEqual('https://quay.io/repo/image');
    expect(getContainerImageLink('quay.io/repo/image@sha256:asd23412s1243')).toEqual(
      'https://quay.io/repo/image',
    );
    expect(getContainerImageLink('https://quay.io/repo/image@sha256:asd23412s1243')).toEqual(
      'https://quay.io/repo/image',
    );
  });
});
