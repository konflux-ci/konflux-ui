import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { t_global_color_status_success_100 as successColor } from '@patternfly/react-tokens/dist/js/t_global_color_status_success_100';
import {
  CriticalIcon,
  HighIcon,
  MediumIcon,
  LowIcon,
  UnknownIcon,
} from '~/components/PipelineRun/ScanDetailStatus';
import { defineFilters } from '~/shared/components/Filter';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { textMatch } from '~/utils/text-filter-utils';
import { severityLabel, severityWeight, imageColumnValue } from './roxctl-utils';
import type { RoxctlCveTableRow, RoxctlSeverity } from './types';

export const VULNERABILITIES_TABLE_COLUMN_STATE_KEY = 'vulnerabilities-table';

const SeverityIcon = ({ severity }: { severity: RoxctlSeverity }) => {
  switch (severity) {
    case 'CRITICAL':
    case 'CRITICAL_VULNERABILITY_SEVERITY':
      return <CriticalIcon />;
    case 'HIGH':
    case 'IMPORTANT_VULNERABILITY_SEVERITY':
      return <HighIcon />;
    case 'MEDIUM':
    case 'MODERATE_VULNERABILITY_SEVERITY':
      return <MediumIcon />;
    case 'LOW':
    case 'LOW_VULNERABILITY_SEVERITY':
      return <LowIcon />;
    default:
      return <UnknownIcon />;
  }
};

export const VULNERABILITIES_TABLE_COLUMNS: ColumnDefinition<RoxctlCveTableRow>[] = [
  {
    id: 'cveId',
    header: 'CVE ID',
    accessorFn: (row) => row.cve,
    size: 2,
    sortable: true,
    nonHidable: true,
    cell: (info) => {
      const row = info.row.original;
      return (
        <span>
          {row.link ? (
            <ExternalLink href={row.link} dataTestID="cve-link">
              {row.cve}
            </ExternalLink>
          ) : (
            row.cve
          )}
        </span>
      );
    },
  },
  {
    id: 'severity',
    header: 'Severity',
    accessorFn: (row) => row.severity,
    size: 2,
    sortable: true,
    sortFn: (rowA, rowB) =>
      severityWeight(rowA.original.severity) - severityWeight(rowB.original.severity),
    cell: (info) => {
      const severity = info.row.original.severity;
      return (
        <span data-test="cve-severity">
          <SeverityIcon severity={severity} /> {severityLabel(severity)}
        </span>
      );
    },
  },
  {
    id: 'package',
    header: 'Package',
    accessorFn: (row) => row.components[0]?.name ?? '',
    size: 2,
    sortable: true,
    cell: (info) => {
      const { components } = info.row.original;
      if (components.length === 0) return '-';
      if (components.length === 1) return components[0].name;
      return `${components[0].name} (+${components.length - 1} more)`;
    },
  },
  {
    id: 'packageVersion',
    header: 'Package version',
    accessorFn: (row) => row.components[0]?.version ?? '',
    size: 2,
    cell: (info) => {
      const { components } = info.row.original;
      return components[0]?.version ?? '-';
    },
  },
  {
    id: 'componentSource',
    header: 'Component source',
    accessorFn: (row) => row.components[0]?.source ?? '',
    size: 2,
    visibleFrom: 'lg',
    cell: (info) => {
      const source = info.row.original.components[0]?.source;
      return source ?? '-';
    },
  },
  {
    id: 'fixedInVersion',
    header: 'Fixed in version',
    accessorFn: (row) => row.fixedBy ?? '',
    size: 2,
    sortable: true,
    cell: (info) => {
      const fixedBy = info.row.original.fixedBy;
      if (!fixedBy) return '-';
      const display = fixedBy.startsWith('0:') ? fixedBy.slice(2) : fixedBy;
      return (
        <span data-test="cve-fixed-version">
          <CheckCircleIcon color={successColor.value} /> {display}
        </span>
      );
    },
  },
  {
    id: 'image',
    header: 'Image',
    accessorFn: (row) => imageColumnValue(row) ?? '',
    size: 2,
    visibleFrom: 'xl',
    cell: (info) => imageColumnValue(info.row.original) ?? '-',
  },
];

const SEVERITY_DISPLAY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Critical', value: 'critical' },
  { label: 'Important', value: 'important' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Low', value: 'low' },
  { label: 'Unknown', value: 'unknown' },
];

const matchesSeverityFilter = (severity: RoxctlSeverity, filterValue: string): boolean => {
  const label = severityLabel(severity).toLowerCase();
  return label === filterValue;
};

export const vulnerabilitiesFilterConfigs = defineFilters<RoxctlCveTableRow>()([
  {
    type: 'search',
    param: 'cve',
    label: 'Search by CVE ID',
    placeholder: 'Search by CVE ID...',
    filterFn: (item, value) => textMatch(item.cve, value),
  },
  {
    type: 'multiSelect',
    param: 'package',
    label: 'Package',
    filterFn: (item, values) =>
      item.components.some((c) => values.includes(c.name)),
  },
  {
    type: 'multiSelect',
    param: 'severity',
    label: 'Severity',
    filterFn: (item, values) =>
      values.some((v) => matchesSeverityFilter(item.severity, v)),
  },
  {
    type: 'multiSelect',
    param: 'image',
    label: 'Image',
    filterFn: (item, values) => values.includes(imageColumnValue(item) ?? ''),
  },
] as const);

export const buildVulnerabilityFilterOptions = (data: RoxctlCveTableRow[]) => {
  const packages = new Set<string>();
  const images = new Set<string>();

  for (const row of data) {
    for (const comp of row.components) {
      packages.add(comp.name);
    }
    const image = imageColumnValue(row);
    if (image) {
      images.add(image);
    }
  }

  return {
    severity: SEVERITY_DISPLAY_OPTIONS,
    package: Array.from(packages)
      .sort()
      .map((name) => ({ label: name, value: name })),
    image: Array.from(images)
      .sort()
      .map((name) => ({ label: name, value: name })),
  };
};
