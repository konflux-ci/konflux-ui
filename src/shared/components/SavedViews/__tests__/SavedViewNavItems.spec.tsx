import { MemoryRouter } from 'react-router-dom';
import { Nav, NavList } from '@patternfly/react-core';
import { render, screen, fireEvent } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { SavedViewNavItems } from '../SavedViewNavItems';
import { SavedViewsConfig } from '../types';
import { useSavedViews } from '../useSavedViews';

jest.mock('../useSavedViews');
jest.mock('~/shared/components/modal/ModalProvider');

const mockRenameView = jest.fn();
const mockDeleteView = jest.fn();
const mockShowModal = jest.fn();

const testConfig: SavedViewsConfig = {
  resourceKey: 'pipelines',
  columnKeyPrefix: 'cols-pipelines',
  routePath: 'ns/my-workspace/pipelines',
};

const testViews = [
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

const renderComponent = (searchParams?: Record<string, string>) =>
  render(
    <MemoryRouter>
      <NuqsTestingAdapter searchParams={searchParams}>
        <Nav>
          <NavList>
            <SavedViewNavItems config={testConfig} />
          </NavList>
        </Nav>
      </NuqsTestingAdapter>
    </MemoryRouter>,
  );

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
    renderComponent({ view: 'running-builds' });
    const navItem = screen.getByTestId('saved-view-nav-running-builds');
    expect(navItem.closest('a')).toHaveClass('pf-m-current');
  });

  it('does not mark nav item as active when view param does not match', () => {
    renderComponent({ view: 'other-view' });
    const navItem = screen.getByTestId('saved-view-nav-running-builds');
    expect(navItem.closest('a')).not.toHaveClass('pf-m-current');
  });

  it('shows Rename and Delete actions for each view', () => {
    renderComponent();
    expect(screen.getByTestId('saved-view-rename-running-builds')).toBeInTheDocument();
    expect(screen.getByTestId('saved-view-delete-running-builds')).toBeInTheDocument();
  });

  it('launches rename modal on Rename click', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('saved-view-rename-running-builds'));
    expect(mockShowModal).toHaveBeenCalledTimes(1);
  });

  it('launches delete modal on Delete click', () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('saved-view-delete-running-builds'));
    expect(mockShowModal).toHaveBeenCalledTimes(1);
  });
});
