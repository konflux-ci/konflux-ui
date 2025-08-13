import { useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import AboutSection from '../AboutSection';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: jest.fn(() => []),
}));

const mockUseQuery = useQuery as jest.Mock;
const mockUseKonfluxPublicInfo = useKonfluxPublicInfo as jest.Mock;

describe('About section with status page card', () => {
  beforeEach(() => {
    mockUseQuery
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      })
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      });
    // eslint-disable-next-line camelcase
    mockUseKonfluxPublicInfo.mockReturnValue([{ status_page_url: 'https://status-page.local/' }]);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render everything correctly in about section', () => {
    render(<AboutSection />);
    screen.getByText('About');
    screen.getByText('Contact us');
    screen.getByText('Status Page');
  });

  it('should render the links correctly in about section', () => {
    render(<AboutSection />);
    expect(screen.getByRole('link', { name: 'repository' })).toBeInTheDocument();
    const statusLink = screen.getByRole('link', { name: 'View Status Page' });
    expect(statusLink).toBeInTheDocument();
    expect(statusLink).toHaveAttribute('href', 'https://status-page.local/');
    expect(statusLink).toHaveAttribute('target', '_blank');
    expect(statusLink).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(statusLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });
});

describe('About section without status page card due to missing url', () => {
  beforeEach(() => {
    mockUseQuery
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      })
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      });
    mockUseKonfluxPublicInfo.mockReturnValue([{}]);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render everything correctly in about section', () => {
    render(<AboutSection />);
    screen.getByText('About');
    screen.getByText('Contact us');
    expect(screen.queryByText('Status Page')).not.toBeInTheDocument();
  });

  it('should render the links correctly in about section', () => {
    render(<AboutSection />);
    expect(screen.getByRole('link', { name: 'repository' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View Status Page' })).not.toBeInTheDocument();
  });
});

describe('About section without status page card due to bad url', () => {
  beforeEach(() => {
    mockUseQuery
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      })
      .mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      });
    // eslint-disable-next-line camelcase
    mockUseKonfluxPublicInfo.mockReturnValue([{ status_page_url: 'badurl' }]);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render everything correctly in about section', () => {
    render(<AboutSection />);
    screen.getByText('About');
    screen.getByText('Contact us');
    expect(screen.queryByText('Status Page')).not.toBeInTheDocument();
  });

  it('should render the links correctly in about section', () => {
    render(<AboutSection />);
    expect(screen.getByRole('link', { name: 'repository' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View Status Page' })).not.toBeInTheDocument();
  });
});
