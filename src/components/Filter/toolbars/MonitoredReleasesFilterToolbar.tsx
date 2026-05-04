import * as React from 'react';
import { Switch } from '@patternfly/react-core';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { MonitoredReleasesFilterState } from '~/components/Filter/utils/monitoredreleases-filter-utils';

type MonitoredReleasesFilterToolbarProps = {
  filters: MonitoredReleasesFilterState;
  setFilters: (filters: MonitoredReleasesFilterState) => void;
  onClearFilters: () => void;
  statusOptions: { [key: string]: number };
  applicationOptions: { [key: string]: number };
  releasePlanOptions: { [key: string]: number };
  namespaceOptions: { [key: string]: number };
  componentOptions: { [key: string]: number };
  productOptions: { [key: string]: number };
  productVersionOptions: { [key: string]: number };
};

const MonitoredReleasesFilterToolbar: React.FC<MonitoredReleasesFilterToolbarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  statusOptions,
  applicationOptions,
  releasePlanOptions,
  namespaceOptions,
  componentOptions,
  productOptions,
  productVersionOptions,
}: MonitoredReleasesFilterToolbarProps) => {
  const {
    name,
    statuses,
    applications,
    releasePlans,
    namespaces,
    components,
    products,
    productVersions,
    showLatest,
  } = filters;

  return (
    <BaseTextFilterToolbar
      text={name}
      label="name"
      setText={(newValues) => setFilters({ ...filters, name: newValues })}
      onClearFilters={onClearFilters}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={statuses}
        setValues={(newValues) => setFilters({ ...filters, statuses: newValues })}
        options={statusOptions}
      />
      <MultiSelect
        label="Component"
        filterKey="component"
        values={components}
        setValues={(newValues) => setFilters({ ...filters, components: newValues })}
        options={componentOptions}
      />
      <MultiSelect
        label="Application"
        filterKey="application"
        values={applications}
        setValues={(newValues) => setFilters({ ...filters, applications: newValues })}
        options={applicationOptions}
      />
      <MultiSelect
        label="Release Plan"
        filterKey="releasePlan"
        values={releasePlans}
        setValues={(newValues) => setFilters({ ...filters, releasePlans: newValues })}
        options={releasePlanOptions}
      />
      <MultiSelect
        label="Namespace"
        filterKey="namespace"
        values={namespaces}
        setValues={(newValues) => setFilters({ ...filters, namespaces: newValues })}
        options={namespaceOptions}
        hasInlineFilter={true}
      />
      <MultiSelect
        label="Product"
        filterKey="product"
        values={products}
        setValues={(newValues) => setFilters({ ...filters, products: newValues })}
        options={productOptions}
      />
      <MultiSelect
        label="Product Version"
        filterKey="productVersion"
        values={productVersions}
        setValues={(newValues) => setFilters({ ...filters, productVersions: newValues })}
        options={productVersionOptions}
      />
      <Switch
        id="show-latest-switch"
        label="Show latest release for each component"
        isChecked={showLatest}
        onChange={(_event, checked) => setFilters({ ...filters, showLatest: checked })}
      />
    </BaseTextFilterToolbar>
  );
};

export default MonitoredReleasesFilterToolbar;
