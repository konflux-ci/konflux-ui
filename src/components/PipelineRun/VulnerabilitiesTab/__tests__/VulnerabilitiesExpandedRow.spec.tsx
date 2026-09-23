import { screen } from '@testing-library/react';
import type { RoxctlCveTableRow } from '~/components/PipelineRun/VulnerabilitiesTab/types';
import { VulnerabilitiesExpandedRow } from '~/components/PipelineRun/VulnerabilitiesTab/VulnerabilitiesExpandedRow';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';

const multiPackageCve = {
  cve: 'CVE-2024-4068',
  severity: 'IMPORTANT_VULNERABILITY_SEVERITY',
  summary: 'A vulnerability in braces can cause uncontrolled resource consumption.',
  link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-4068',
  links: [
    'https://nvd.nist.gov/vuln/detail/CVE-2024-4068',
    'https://security.example.com/CVE-2024-4068',
    'https://access.redhat.com/errata/RHSA-2024:4487',
    'https://security.example.com/CVE-2024-4068',
  ],
  advisory: [
    {
      name: 'RHSA-2024:4487',
      link: 'https://access.redhat.com/errata/RHSA-2024:4487',
    },
  ],
  fixedBy: '3.0.3',
  components: [
    { name: 'braces', version: '3.0.2', source: 'NODEJS' },
    { name: 'micromatch', version: '4.0.5', source: 'NODEJS' },
  ],
} satisfies RoxctlCveTableRow;

describe('VulnerabilitiesExpandedRow', () => {
  it('renders unique references with advisory names without repeating the CVE link', () => {
    renderWithQueryClientAndRouter(<VulnerabilitiesExpandedRow vulnerability={multiPackageCve} />);

    screen.getByText('A vulnerability in braces can cause uncontrolled resource consumption.');
    screen.getByText('References');
    const advisoryLink = screen.getByRole('link', {
      name: 'RHSA-2024:4487',
    });
    expect(advisoryLink).toHaveAttribute(
      'href',
      'https://access.redhat.com/errata/RHSA-2024:4487',
    );
    expect(advisoryLink).toHaveAttribute('target', '_blank');
    const generalReference = screen.getByRole('link', {
      name: 'https://security.example.com/CVE-2024-4068',
    });
    expect(generalReference).toHaveAttribute(
      'href',
      'https://security.example.com/CVE-2024-4068',
    );
    expect(
      screen.getAllByRole('link', { name: 'https://security.example.com/CVE-2024-4068' }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole('link', {
        name: 'https://nvd.nist.gov/vuln/detail/CVE-2024-4068',
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Advisory')).not.toBeInTheDocument();
    expect(screen.queryByText('Advisory Link')).not.toBeInTheDocument();
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
    expect(screen.queryByText('Updated')).not.toBeInTheDocument();
  });

  it('omits references when an older scan only provides the CVE link', () => {
    renderWithQueryClientAndRouter(
      <VulnerabilitiesExpandedRow
        vulnerability={{
          ...multiPackageCve,
          advisory: undefined,
          links: [multiPackageCve.link],
        }}
      />,
    );

    expect(screen.queryByText('References')).not.toBeInTheDocument();
  });

  it('lists every affected package when the CVE spans multiple components', () => {
    renderWithQueryClientAndRouter(<VulnerabilitiesExpandedRow vulnerability={multiPackageCve} />);

    screen.getByText('Affected packages');
    screen.getByText('braces 3.0.2 (NODEJS)');
    screen.getByText('micromatch 4.0.5 (NODEJS)');
  });

  it('does not repeat package details for a single-component CVE', () => {
    renderWithQueryClientAndRouter(
      <VulnerabilitiesExpandedRow
        vulnerability={{ ...multiPackageCve, components: [multiPackageCve.components[0]] }}
      />,
    );

    expect(screen.queryByText('Affected packages')).not.toBeInTheDocument();
  });
});
