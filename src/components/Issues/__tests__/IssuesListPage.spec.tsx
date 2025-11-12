import React from 'react';
import { render, screen } from '@testing-library/react';
import IssuesListPage from '../IssuesListPage';

describe('IssuesListPage Component', () => {
  it('should render the list page content', () => {
    render(<IssuesListPage />);

    expect(screen.getByText('Issues List Page')).toBeInTheDocument();
  });

  it('should render as a React functional component', () => {
    const component = <IssuesListPage />;

    expect(React.isValidElement(component)).toBe(true);
  });

  it('should not crash when rendered', () => {
    expect(() => render(<IssuesListPage />)).not.toThrow();
  });

  it('should render the expected text content', () => {
    const { container } = render(<IssuesListPage />);

    expect(container.textContent).toBe('Issues List Page');
  });
});
