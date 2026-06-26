import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import Issues from '../Issues';

// Mock react-router-dom since DetailsPage uses it
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/issues', state: null, search: '', hash: '', key: 'default' }),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  useResolvedPath: () => ({ pathname: '/issues' }),
}));

// Mock useDocumentTitle hook used by TabsLayout
jest.mock('../../../hooks/useDocumentTitle', () => ({
  useDocumentTitle: jest.fn(),
}));

describe('Issues Component', () => {
  it('should render the Issues page with correct content', () => {
    render(
      <MemoryRouter initialEntries={['/issues']}>
        <Issues />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /Issues/i })).toBeInTheDocument();
    expect(
      screen.getByText('Summary of issues in your Konflux content at any given point in time'),
    ).toBeInTheDocument();

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Issues/i })).toBeInTheDocument();
  });
});
