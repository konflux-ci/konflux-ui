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
    status,
    application,
    releasePlan,
    namespace,
    component,
    product,
    productVersion,
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
        values={status}
        setValues={(newValues) => setFilters({ ...filters, status: newValues })}
        options={statusOptions}
      />
      <MultiSelect
        label="Component"
        filterKey="component"
        values={component}
        setValues={(newValues) => setFilters({ ...filters, component: newValues })}
        options={componentOptions}
      />
      <MultiSelect
        label="Application"
        filterKey="application"
        values={application}
        setValues={(newValues) => setFilters({ ...filters, application: newValues })}
        options={applicationOptions}
      />
      <MultiSelect
        label="Release Plan"
        filterKey="releasePlan"
        values={releasePlan}
        setValues={(newValues) => setFilters({ ...filters, releasePlan: newValues })}
        options={releasePlanOptions}
      />
      <MultiSelect
        label="Namespace"
        filterKey="namespace"
        values={namespace}
        setValues={(newValues) => setFilters({ ...filters, namespace: newValues })}
        options={namespaceOptions}
      />
      <MultiSelect
        label="Product"
        filterKey="product"
        values={product}
        setValues={(newValues) => setFilters({ ...filters, product: newValues })}
        options={productOptions}
      />
      <MultiSelect
        label="Product Version"
        filterKey="productVersion"
        values={productVersion}
        setValues={(newValues) => setFilters({ ...filters, productVersion: newValues })}
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
