import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import componentsIcon from '../../../assets/Components.svg';
import gitAppIcon from '../../../assets/git-app.svg';
import WhatsNextSection, { WhatsNextItem } from '../WhatsNextSection';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => (
      <a href={props.to} data-test={props.to}>
        {props.children}
      </a>
    ),
  };
});

const mockOnClick = jest.fn();

const mockWhatsNextItems: WhatsNextItem[] = [
  {
    id: 0,
    title: 'React router action',
    description: 'Sample action to take user to a router link inside the app.',
    icon: componentsIcon,
    cta: {
      label: 'Take me to router link',
      href: '/application/import',
    },
    helpLink: 'mock-help-id',
  },
  {
    id: 1,
    title: 'External link action',
    description: 'Sample action to take user to an external link.',
    icon: gitAppIcon,
    cta: {
      label: 'Take me to external link',
      href: 'https://github.com/sample-user/sample-app',
      external: true,
    },
  },
  {
    id: 2,
    title: 'On click action',
    description: 'Sample action to trigger an onClick action.',
    icon: gitAppIcon,
    cta: {
      label: 'Trigger onClick',
      onClick: mockOnClick,
    },
  },
];

describe('Whats Next Section', () => {
  it('should render whats next section with correct title and description', () => {
    render(<WhatsNextSection whatsNextItems={[mockWhatsNextItems[0]]} />);
    screen.getByText("What's next?");
    screen.getByText('React router action');
    screen.getByText('Sample action to take user to a router link inside the app.');
  });

  it('should render whats next item with react router link and learn more button', () => {
    render(<WhatsNextSection whatsNextItems={[mockWhatsNextItems[0]]} />);
    const cta = screen.getByText('Take me to router link').closest('a');
    expect(cta).toHaveAttribute('href', '/application/import');
    expect(cta).toHaveAttribute('data-test', '/application/import');
    screen.getByText('Learn more');
  });

  it('should render whats next item with external link and no learn more button', () => {
    render(<WhatsNextSection whatsNextItems={[mockWhatsNextItems[1]]} />);
    const cta = screen.getByText('Take me to external link').closest('a');
    expect(cta).toHaveAttribute('href', 'https://github.com/sample-user/sample-app');
    expect(cta).toHaveAttribute('target', '_blank');
    expect(cta).toHaveAttribute('rel', 'noreferrer');
    expect(screen.queryByText('Learn more')).not.toBeInTheDocument();
  });

  it('should render whats next item with onClick handler', () => {
    render(<WhatsNextSection whatsNextItems={[mockWhatsNextItems[2]]} />);
    act(() => {
      const trigger = screen.getByText('Trigger onClick');
      fireEvent.click(trigger);
    });
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('it should close the card when clicked on close button', () => {
    render(<WhatsNextSection whatsNextItems={[mockWhatsNextItems[0]]} />);
    expect(screen.getByText('React router action')).toBeInTheDocument();
    expect(screen.getByText('Take me to router link')).toBeInTheDocument();

    act(() => {
      const trigger = screen.getByTestId('close-button');
      fireEvent.click(trigger);
    });

    expect(mockOnClick).toHaveBeenCalled();
    expect(screen.queryByText('React router action')).not.toBeInTheDocument();
    expect(screen.queryByText('Take me to router link')).not.toBeInTheDocument();
  });
});
