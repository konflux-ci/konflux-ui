import React from 'react';
import { screen } from '@testing-library/react';
import { useIssues } from '~/kite/kite-hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import IssuesListPage from '../IssuesListPage';

jest.mock('~/kite/kite-hooks', () => ({
  useIssues: jest.fn(),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: () => jest.fn(),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
  };
});

const mockUseIssues = useIssues as jest.Mock;

describe('IssuesListPage Component', () => {
  beforeEach(() => {
    mockUseNamespaceHook('test-namespace');
    jest.clearAllMocks();
  });

  it('should render the list page content', () => {
    mockUseIssues.mockReturnValue({
      data: { data: [], total: 0, limit: 10, offset: 0 },
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<IssuesListPage />);

    expect(screen.getByText('This list shows current Konflux issues.')).toBeInTheDocument();
  });

  it('should render as a React functional component', () => {
    const component = <IssuesListPage />;

    expect(React.isValidElement(component)).toBe(true);
  });

  it('should not crash when rendered', () => {
    renderWithQueryClient(<IssuesListPage />);

    expect(screen.getByText('Issues')).toBeInTheDocument();
  });

  it('should render the expected text content', () => {
    renderWithQueryClient(<IssuesListPage />);

    expect(screen.getByText('This list shows current Konflux issues.')).toBeInTheDocument();
  });
});
