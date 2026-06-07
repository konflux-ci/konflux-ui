import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { Nav, NavList } from '@patternfly/react-core';
import { render, screen, fireEvent } from '@testing-library/react';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { SavedViewNavItems } from '../SavedViewNavItems';
import { SavedView, SavedViewsConfig } from '../types';
import { useSavedViews } from '../useSavedViews';

jest.mock('../useSavedViews');
jest.mock('~/components/modal/ModalProvider');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
}));

const mockRenameView = jest.fn();
const mockDeleteView = jest.fn();
const mockShowModal = jest.fn();

const testConfig: SavedViewsConfig = {
  resourceKey: 'pipelines',
  columnKeyPrefix: 'cols-pipelines',
  routePath: 'ns/:workspaceName/pipelines',
};

const testViews: SavedView[] = [
  {
    slug: 'running-builds',
    label: 'Running Builds',
    searchParams: 'status=running&type=build',
    columnStateKey: 'cols-pipelines:running-builds',
  },
  {
    slug: 'failed-tests',
    label: 'Failed Tests',
    searchParams: 'status=failed&type=test',
    columnStateKey: 'cols-pipelines:failed-tests',
  },
];

const renderComponent = (viewParam = '') => {
  const searchParams = new URLSearchParams(viewParam ? `view=${viewParam}` : '');
  jest.mocked(useSearchParams).mockReturnValue([searchParams, jest.fn()]);

  return render(
    <MemoryRouter>
      <Nav>
        <NavList>
          <SavedViewNavItems config={testConfig} namespace="my-workspace" />
        </NavList>
      </Nav>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSavedViews).mockReturnValue({
    views: testViews,
    saveView: jest.fn(),
    deleteView: mockDeleteView,
    renameView: mockRenameView,
    updateView: jest.fn(),
    isSlugAvailable: jest.fn(),
  });
  jest.mocked(useModalLauncher).mockReturnValue(mockShowModal);
});

describe('SavedViewNavItems', () => {
  it('renders nav items for each saved view', () => {
    renderComponent();
    expect(screen.getByText('Running Builds')).toBeInTheDocument();
    expect(screen.getByText('Failed Tests')).toBeInTheDocument();
  });

  it('builds correct href with namespace and params', () => {
    renderComponent();
    const link = screen.getByText('Running Builds').closest('a');
    expect(link).toHaveAttribute(
      'href',
      '/ns/my-workspace/pipelines?status=running&type=build&view=running-builds',
    );
  });

  it('returns null when views array is empty', () => {
    jest.mocked(useSavedViews).mockReturnValue({
      views: [],
      saveView: jest.fn(),
      deleteView: jest.fn(),
      renameView: jest.fn(),
      updateView: jest.fn(),
      isSlugAvailable: jest.fn(),
    });
    const { container } = renderComponent();
    expect(container.querySelector('[data-test^="saved-view-nav-"]')).toBeNull();
  });

  it('marks nav item as active when view param matches slug', () => {
    renderComponent('running-builds');
    const navItem = screen.getByTestId('saved-view-nav-running-builds');
    expect(navItem).toHaveClass('pf-m-current');
  });

  it('does not mark nav item as active when view param does not match', () => {
    renderComponent('other-view');
    const navItem = screen.getByTestId('saved-view-nav-running-builds');
    expect(navItem).not.toHaveClass('pf-m-current');
  });

  it('opens kebab menu with Rename and Delete options', () => {
    renderComponent();
    const kebab = screen.getByTestId('saved-view-kebab-running-builds');
    fireEvent.click(kebab);
    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('launches rename modal on Rename click', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('saved-view-kebab-running-builds'));
    fireEvent.click(screen.getByText('Rename'));
    expect(mockShowModal).toHaveBeenCalledTimes(1);
  });

  it('launches delete modal on Delete click', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('saved-view-kebab-running-builds'));
    fireEvent.click(screen.getByText('Delete'));
    expect(mockShowModal).toHaveBeenCalledTimes(1);
  });
});
