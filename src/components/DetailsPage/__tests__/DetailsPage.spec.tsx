import * as React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { routerRenderer } from '../../../utils/test-utils';
import DetailsPage from '../DetailsPage';

// Mock useDocumentTitle hook
jest.mock('../../../hooks/useDocumentTitle', () => ({
  useDocumentTitle: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => React.useState(() => new URLSearchParams()),
  };
});

//

describe('DetailsPage', () => {
  const defaultProps = {
    headTitle: 'Test Page',
    title: 'Details',
    baseURL: '/test',
    tabs: [
      { key: 'tab1', label: 'Tab 1' },
      { key: 'tab2', label: 'Tab 2' },
    ],
  };

  describe('Basic Rendering', () => {
    it('should render the DetailsPage with basic props', () => {
      const { getByTestId } = routerRenderer(<DetailsPage {...defaultProps} />);
      expect(getByTestId('details')).toBeInTheDocument();
      expect(getByTestId('details__title')).toHaveTextContent('Details');
    });

    it('should render description when provided', () => {
      const description = 'Test description';
      routerRenderer(<DetailsPage {...defaultProps} description={description} />);
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('should render custom title component when provided', () => {
      const CustomTitle = () => <h1 data-test="custom-title">Custom Title</h1>;
      const { getByTestId } = routerRenderer(
        <DetailsPage {...defaultProps} title={<CustomTitle />} />,
      );
      expect(getByTestId('custom-title')).toBeInTheDocument();
    });

    it('should render preComponent when provided', () => {
      const PreComponent = () => <div data-test="pre-component">Pre Component</div>;
      const { getByTestId } = routerRenderer(
        <DetailsPage {...defaultProps} preComponent={<PreComponent />} />,
      );
      expect(getByTestId('pre-component')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      const Footer = () => <div data-test="footer">Footer Content</div>;
      const { getByTestId } = routerRenderer(<DetailsPage {...defaultProps} footer={<Footer />} />);
      expect(getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Breadcrumbs', () => {
    it('should render breadcrumbs when provided', () => {
      const breadcrumbs = [
        { name: 'Home', path: '/' },
        { name: 'Details Section', path: '/details' },
      ];
      routerRenderer(<DetailsPage {...defaultProps} breadcrumbs={breadcrumbs} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Details Section')).toBeInTheDocument();
    });

    it('should render custom breadcrumb elements', () => {
      const CustomBreadcrumb = () => <div data-test="custom-breadcrumb">Custom</div>;
      const breadcrumbs = [<CustomBreadcrumb key="custom" />];
      const { getByTestId } = routerRenderer(
        <DetailsPage {...defaultProps} breadcrumbs={breadcrumbs} />,
      );
      expect(getByTestId('custom-breadcrumb')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('should not render tabs section when tabs array is empty', () => {
      routerRenderer(<DetailsPage {...defaultProps} tabs={[]} />);
      expect(screen.queryByTestId('app-details__tabs')).not.toBeInTheDocument();
    });

    it('should handle tab selection correctly', async () => {
      const onTabSelect = jest.fn();
      routerRenderer(<DetailsPage {...defaultProps} onTabSelect={onTabSelect} />);

      const tab2 = screen.getByTestId('app-details__tabItem tab2');
      await act(async () => {
        await userEvent.click(tab2);
      });

      expect(onTabSelect).toHaveBeenCalledWith('tab2');
    });

    it('should render tabs with correct filled styling', () => {
      const tabsWithFilled = [
        { key: 'tab1', label: 'Tab 1', isFilled: true },
        { key: 'tab2', label: 'Tab 2', isFilled: false },
      ];
      routerRenderer(<DetailsPage {...defaultProps} tabs={tabsWithFilled} />);

      const tab1 = screen.getByTestId('app-details__tabItem tab1');
      expect(tab1.parentElement).toHaveClass('isFilled');
    });
  });

  describe('Actions Dropdown', () => {
    const actions = [
      {
        type: 'section-label',
        key: 'group1',
        label: 'Group 1',
      },
      {
        key: 'action1',
        label: 'Action 1',
        onClick: jest.fn(),
      },
      {
        type: 'separator',
        key: 'sep1',
        label: '',
      },
      {
        key: 'action2',
        label: 'Action 2',
        isDisabled: true,
        disabledTooltip: 'Disabled action',
      },
    ];

    it('should render actions dropdown when actions are provided', async () => {
      routerRenderer(<DetailsPage {...defaultProps} actions={actions} />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await act(async () => {
        await userEvent.click(actionsButton);
      });

      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });

    it('should handle hidden actions correctly', () => {
      const actionsWithHidden = [
        ...actions,
        {
          key: 'hidden',
          label: 'Hidden Action',
          hidden: true,
        },
      ];

      routerRenderer(<DetailsPage {...defaultProps} actions={actionsWithHidden} />);
      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      fireEvent.click(actionsButton);

      expect(screen.queryByText('Hidden Action')).not.toBeInTheDocument();
    });

    it('should handle action clicks correctly', async () => {
      const onClick = jest.fn();
      const clickableActions = [
        {
          key: 'clickable',
          label: 'Clickable Action',
          onClick,
        },
      ];

      routerRenderer(<DetailsPage {...defaultProps} actions={clickableActions} />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await act(async () => {
        await userEvent.click(actionsButton);
      });

      const actionItem = screen.getByText('Clickable Action');
      await act(async () => {
        await userEvent.click(actionItem);
      });

      expect(onClick).toHaveBeenCalled();
    });

    it('should handle separators with labels correctly', async () => {
      const actionsWithLabeledSeparator = [
        {
          type: 'separator',
          key: 'sep',
          label: 'Section',
        },
        {
          key: 'action',
          label: 'Action',
        },
      ];

      routerRenderer(<DetailsPage {...defaultProps} actions={actionsWithLabeledSeparator} />);

      const actionsButton = screen.getByRole('button', { name: /Actions/i });
      await act(async () => {
        await userEvent.click(actionsButton);
      });

      expect(screen.getByText('Section')).toBeInTheDocument();
    });
  });
});
