import React from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { createReactRouterMock } from '../../../utils/test-utils';
import { TabsLayout } from '../TabsLayout';
import { TabProps } from '../types';

// Mock useDocumentTitle hook
jest.mock('../../../hooks/useDocumentTitle', () => ({
  useDocumentTitle: jest.fn(),
}));

const mockTabs: TabProps[] = [
  { key: 'index', label: 'Overview' },
  { key: 'details', label: 'Details' },
  { key: 'settings', label: 'Settings' },
];

const renderWithRouter = (ui: React.ReactElement, { route = '/', basePath = '/test' } = {}) => {
  const routes = createMemoryRouter(
    [
      {
        path: `${basePath}/*`,
        element: ui,
        children: [
          {
            index: true,
            element: <div>Overview Content</div>,
          },
          {
            path: 'details',
            element: <div>Details Content</div>,
          },
          {
            path: 'settings',
            element: <div>Settings Content</div>,
          },
        ],
      },
    ],
    { initialEntries: [`${basePath}${route}`] },
  );
  return render(<RouterProvider router={routes} />);
};

describe('TabsLayout', () => {
  const defaultProps = {
    id: 'test-tabs',
    tabs: mockTabs,
    headTitle: 'Test Page',
    baseURL: '/test',
  };

  it('renders all tabs with correct labels', () => {
    renderWithRouter(<TabsLayout {...defaultProps} />);

    mockTabs.forEach((tab) => {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    });
  });

  it('renders the first tab content by default', () => {
    renderWithRouter(<TabsLayout {...defaultProps} />);
    expect(screen.getByText('Overview Content')).toBeInTheDocument();
  });

  it('navigates to correct route when tab is clicked', () => {
    renderWithRouter(<TabsLayout {...defaultProps} />);

    fireEvent.click(screen.getByText('Details'));
    expect(screen.getByText('Details Content')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Settings Content')).toBeInTheDocument();
  });

  it('shows active tab based on current route', () => {
    renderWithRouter(<TabsLayout {...defaultProps} />, { route: '/details' });

    const detailsTab = screen.getByRole('tab', { name: 'Details' });
    expect(detailsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onTabSelect when tab is changed', () => {
    const onTabSelect = jest.fn();
    renderWithRouter(<TabsLayout {...defaultProps} onTabSelect={onTabSelect} />);

    fireEvent.click(screen.getByText('Details'));
    expect(onTabSelect).toHaveBeenCalledWith('details');
  });

  it('applies custom className and style', () => {
    const customProps = {
      ...defaultProps,
      className: 'custom-class',
      style: { marginTop: '20px' },
    };

    renderWithRouter(<TabsLayout {...customProps} />);

    const tabsContainer = screen.getByTestId('test-tabs__tabs');
    expect(tabsContainer).toHaveClass('custom-class');
    expect(tabsContainer).toHaveStyle({ marginTop: '20px' });
  });

  it('maintains trailing slash consistency in navigation', () => {
    const propsWithTrailingSlash = {
      ...defaultProps,
      baseURL: '/test/',
    };
    const mockNavigate = jest.fn();
    createReactRouterMock('useNavigate').mockImplementation(() => mockNavigate);

    renderWithRouter(<TabsLayout {...propsWithTrailingSlash} />);

    fireEvent.click(screen.getByTestId('test-tabs__tabItem details'));
    expect(mockNavigate).toHaveBeenCalledWith('/test/details');
  });

  it('sets correct data-test attributes', () => {
    renderWithRouter(<TabsLayout {...defaultProps} />);

    expect(screen.getByTestId('test-tabs__tabs')).toBeInTheDocument();
    expect(screen.getByTestId('test-tabs__tabItem overview')).toBeInTheDocument();
    expect(screen.getByTestId('test-tabs__tabItem details')).toBeInTheDocument();
    expect(screen.getByTestId('test-tabs__tabItem settings')).toBeInTheDocument();
  });
});
