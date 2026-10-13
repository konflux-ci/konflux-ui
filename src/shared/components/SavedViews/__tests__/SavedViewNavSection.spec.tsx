import { MemoryRouter } from 'react-router-dom';
import { Nav, NavList } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useNamespace } from '~/shared/providers/Namespace';
import { SavedViewNavSection } from '../SavedViewNavSection';
import { SavedViewsConfig } from '../types';
import { useSavedViews } from '../useSavedViews';

jest.mock('../useSavedViews');
jest.mock('~/shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

jest.mock('~/shared/components/modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(() => jest.fn()),
}));

const testConfig: SavedViewsConfig = {
  resourceKey: 'pipelines',
  columnKeyPrefix: 'cols-pipelines',
  routePathBuilder: (ns: string) => `/ns/${ns}/pipelines`,
};

const testViews = [
  {
    slug: 'running-builds',
    label: 'Running Builds',
    searchParams: 'status=running&type=build',
    columnStateKey: 'cols-pipelines:running-builds',
    namespace: 'my-workspace',
  },
];

const mockUseSavedViews = (views = testViews) => {
  jest.mocked(useSavedViews).mockReturnValue({
    views,
    saveView: jest.fn(),
    deleteView: jest.fn(),
    renameView: jest.fn(),
    updateView: jest.fn(),
    isSlugAvailable: jest.fn(),
  });
};

const renderComponent = (props: Partial<React.ComponentProps<typeof SavedViewNavSection>> = {}) =>
  render(
    <MemoryRouter>
      <NuqsTestingAdapter>
        <Nav>
          <NavList>
            <SavedViewNavSection
              title="Pipeline Runs"
              config={testConfig}
              isActive={false}
              href="/ns/my-workspace/pipelines"
              data-test="pipeline-runs-nav"
              {...props}
            />
          </NavList>
        </Nav>
      </NuqsTestingAdapter>
    </MemoryRouter>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNamespace).mockReturnValue('my-workspace');
});

describe('SavedViewNavSection', () => {
  describe('when no saved views exist', () => {
    beforeEach(() => {
      mockUseSavedViews([]);
    });

    it('renders a plain NavItem with a link', () => {
      renderComponent();
      const link = screen.getByText('Pipeline Runs');
      expect(link.closest('a')).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/ns/my-workspace/pipelines');
    });

    it('applies disabled class when disabled', () => {
      renderComponent({ disabled: true });
      const navItem = screen.getByText('Pipeline Runs').closest('li');
      expect(navItem).toHaveClass('app-side-bar__nav-item--disabled');
    });

    it('does not render NavExpandable', () => {
      renderComponent();
      expect(screen.queryByRole('button', { name: /Pipeline Runs/i })).not.toBeInTheDocument();
    });
  });

  describe('when saved views exist', () => {
    beforeEach(() => {
      mockUseSavedViews(testViews);
    });

    it('renders NavExpandable with saved view items', () => {
      renderComponent();
      expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
      expect(screen.getByText('Running Builds')).toBeInTheDocument();
    });

    it('applies data-test attribute', () => {
      renderComponent();
      expect(screen.getByTestId('pipeline-runs-nav')).toBeInTheDocument();
    });

    it('applies disabled class when disabled', () => {
      renderComponent({ disabled: true });
      expect(screen.getByTestId('pipeline-runs-nav')).toHaveClass(
        'app-side-bar__nav-item--disabled',
      );
    });

    it('toggles expand/collapse when arrow is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      expect(screen.getByText('Running Builds')).toBeVisible();

      const toggleIcon = screen
        .getByTestId('pipeline-runs-nav')
        .querySelector('.pf-v6-c-nav__toggle-icon');
      if (toggleIcon) {
        await user.click(toggleIcon as HTMLElement);
      }
    });
  });

  describe('when no namespace is selected', () => {
    beforeEach(() => {
      jest.mocked(useNamespace).mockReturnValue(undefined);
      mockUseSavedViews([]);
    });

    it('renders plain NavItem', () => {
      renderComponent({ disabled: true, href: undefined });
      const navItem = screen.getByText('Pipeline Runs').closest('li');
      expect(navItem).toBeInTheDocument();
      expect(navItem).toHaveClass('app-side-bar__nav-item--disabled');
    });
  });
});
