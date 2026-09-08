import { screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { setupVirtualizerMock, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import type { RoxctlCveTableRow } from '../types';
import { VulnerabilitiesTable } from '../VulnerabilitiesTable';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

beforeAll(() => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchEvent: jest.fn(),
  }));
});

beforeEach(() => {
  setupVirtualizerMock();
});

const mockData: RoxctlCveTableRow[] = [
  {
    cve: 'CVE-2024-21626',
    severity: 'CRITICAL',
    fixedBy: '1.1.12',
    summary: 'Critical runc vulnerability',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-21626',
    imageFullName: 'quay.io/test:latest',
    components: [{ name: 'runc', version: '1.1.4', source: 'OS' }],
  },
  {
    cve: 'CVE-2023-44487',
    severity: 'CRITICAL',
    fixedBy: '18.18.2',
    summary: 'Critical nodejs vulnerability',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2023-44487',
    imageFullName: 'quay.io/test:latest',
    components: [{ name: 'nodejs', version: '18.16.0', source: 'NODEJS' }],
  },
  {
    cve: 'CVE-2024-4068',
    severity: 'IMPORTANT_VULNERABILITY_SEVERITY',
    fixedBy: '3.0.3',
    summary: 'Important braces vulnerability',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-4068',
    imageFullName: 'quay.io/test:latest',
    components: [
      { name: 'braces', version: '3.0.2', source: 'NODEJS' },
      { name: 'micromatch', version: '4.0.5', source: 'NODEJS' },
    ],
  },
  {
    cve: 'CVE-2023-26136',
    severity: 'MODERATE_VULNERABILITY_SEVERITY',
    fixedBy: '4.1.3',
    summary: 'Moderate tough-cookie vulnerability',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2023-26136',
    imageFullName: 'quay.io/test:latest',
    components: [{ name: 'tough-cookie', version: '4.1.2', source: 'NODEJS' }],
  },
  {
    cve: 'CVE-2024-28849',
    severity: 'LOW',
    fixedBy: '1.15.6',
    summary: 'Low follow-redirects vulnerability',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-28849',
    imageFullName: 'quay.io/test:latest',
    components: [{ name: 'follow-redirects', version: '1.15.4', source: 'NODEJS' }],
  },
];

const renderTable = (data: RoxctlCveTableRow[] = mockData, searchParams = '') =>
  renderWithQueryClientAndRouter(
    <NuqsTestingAdapter searchParams={searchParams}>
      <VulnerabilitiesTable data={data} />
    </NuqsTestingAdapter>,
  );

describe('VulnerabilitiesTable', () => {
  it('renders a row for each unique CVE', () => {
    renderTable();

    expect(screen.getByText('CVE-2024-21626')).toBeInTheDocument();
    expect(screen.getByText('CVE-2023-44487')).toBeInTheDocument();
    expect(screen.getByText('CVE-2024-4068')).toBeInTheDocument();
    expect(screen.getByText('CVE-2023-26136')).toBeInTheDocument();
    expect(screen.getByText('CVE-2024-28849')).toBeInTheDocument();
  });

  it('renders severity labels with the correct text', () => {
    renderTable();

    const severityCells = screen.getAllByTestId('cve-severity');
    const labels = severityCells.map((cell) => cell.textContent?.trim());

    expect(labels.some((l) => l?.includes('Critical'))).toBe(true);
    expect(labels.some((l) => l?.includes('Important'))).toBe(true);
    expect(labels.some((l) => l?.includes('Moderate'))).toBe(true);
    expect(labels.some((l) => l?.includes('Low'))).toBe(true);
  });

  it('renders CVE IDs as external links', () => {
    renderTable();

    const links = screen.getAllByTestId('cve-link');
    expect(links.length).toBeGreaterThanOrEqual(1);

    const firstLink = links[0];
    expect(firstLink).toHaveAttribute('href');
    expect(firstLink).toHaveAttribute('target', '_blank');
    expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders fixed version with check icon', () => {
    renderTable();

    const fixedCells = screen.getAllByTestId('cve-fixed-version');
    expect(fixedCells.length).toBeGreaterThanOrEqual(1);
    expect(fixedCells[0].textContent).toContain('1.1.12');
  });

  it('renders multi-package CVE with count', () => {
    renderTable();

    expect(screen.getByText('braces (+1 more)')).toBeInTheDocument();
  });

  it('renders single-package CVE with just the package name', () => {
    renderTable();

    expect(screen.getByText('runc')).toBeInTheDocument();
    expect(screen.getByText('nodejs')).toBeInTheDocument();
  });

  it('shows no-data empty state when data is empty', () => {
    renderTable([]);

    screen.getByText('No fixable vulnerabilities found');
  });

  it('shows filtered empty state when filters match nothing', () => {
    renderTable(mockData, '?cve=nonexistent-cve-id-xyz');

    screen.getByText('No results found');
  });

  it('renders the filter toolbar', () => {
    renderTable();

    screen.getByPlaceholderText('Search by CVE ID...');
  });

  it('filters by CVE ID search param', () => {
    renderTable(mockData, '?cve=21626');

    expect(screen.getByText('CVE-2024-21626')).toBeInTheDocument();
    expect(screen.queryByText('CVE-2023-44487')).not.toBeInTheDocument();
  });

  it('filters by severity search param', () => {
    renderTable(mockData, '?severity=%5B%22low%22%5D');

    expect(screen.getByText('CVE-2024-28849')).toBeInTheDocument();
    expect(screen.queryByText('CVE-2024-21626')).not.toBeInTheDocument();
  });

  it('does not render the sort dropdown', () => {
    renderTable();

    expect(screen.queryByTestId('sort-dropdown')).not.toBeInTheDocument();
  });
});
