import React from 'react';
import { render, screen } from '@testing-library/react';
import IssuesOverview from '../IssuesOverview';

describe('IssuesOverview Component', () => {
  it('should render the overview content', () => {
    render(<IssuesOverview />);

    expect(screen.getByText('Issues OverView Tab')).toBeInTheDocument();
  });

  it('should render as a React functional component', () => {
    const component = <IssuesOverview />;

    expect(React.isValidElement(component)).toBe(true);
  });

  it('should not crash when rendered', () => {
    expect(() => render(<IssuesOverview />)).not.toThrow();
  });

  it('should render the expected text content', () => {
    const { container } = render(<IssuesOverview />);

    expect(container.textContent).toBe('Issues OverView Tab');
  });
});
