import * as React from 'react';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { MonitoredReleasesFilterState } from '~/components/Filter/utils/monitoredreleases-filter-utils';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
type MonitoredReleasesFilterToolbarProps = {
  filters: MonitoredReleasesFilterState;
  setFilters: (newFilters: MonitoredReleasesFilterState) => void;
  onClearFilters: () => void;
  statusOptions: { [key: string]: number };
  applicationOptions: { [key: string]: number };
  releasePlanOptions: { [key: string]: number };
  namespaceOptions: { [key: string]: number };
  componentOptions: { [key: string]: number };
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
}: MonitoredReleasesFilterToolbarProps) => {
  const { name, status, application, releasePlan, namespace, component } = filters;

  return (
    <BaseTextFilterToolbar
      text={name}
      label="name"
      setText={(newName) => setFilters({ ...filters, name: newName })}
      onClearFilters={onClearFilters}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={status}
        setValues={(newFilters) => setFilters({ ...filters, status: newFilters })}
        options={statusOptions}
      />
      <MultiSelect
        label="Application"
        filterKey="application"
        values={application}
        setValues={(newFilters) => setFilters({ ...filters, application: newFilters })}
        options={applicationOptions}
      />
      <MultiSelect
        label="Release Plan"
        filterKey="releasePlan"
        values={releasePlan}
        setValues={(newFilters) => setFilters({ ...filters, releasePlan: newFilters })}
        options={releasePlanOptions}
      />
      <MultiSelect
        label="NameSpace"
        filterKey="namespace"
        values={namespace}
        setValues={(newFilters) => setFilters({ ...filters, namespace: newFilters })}
        options={namespaceOptions}
      />
      <MultiSelect
        label="Component"
        filterKey="component"
        values={component}
        setValues={(newFilters) => setFilters({ ...filters, component: newFilters })}
        options={componentOptions}
      />
    </BaseTextFilterToolbar>
  );
};

export default MonitoredReleasesFilterToolbar;
