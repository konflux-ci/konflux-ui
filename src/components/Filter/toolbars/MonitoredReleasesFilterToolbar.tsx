import * as React from 'react';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { MonitoredReleasesFilterState } from '~/components/Filter/utils/monitoredreleases-filter-utils';

type MonitoredReleasesFilterToolbarProps = {
  filters: MonitoredReleasesFilterState;
  setFilters: (filters: MonitoredReleasesFilterState) => void; // Changed: remove React.Dispatch
  onClearFilters: () => void;
  statusOptions: { [key: string]: number };
  applicationOptions: { [key: string]: number };
  releasePlanOptions: { [key: string]: number };
  namespaceOptions: { [key: string]: number };
  componentOptions: { [key: string]: number };
};

// Update the implementation:
const MonitoredReleasesFilterToolbar: React.FC<MonitoredReleasesFilterToolbarProps> = ({
  filters,
  setFilters,
  onClearFilters,
  statusOptions,
  applicationOptions,
  releasePlanOptions,
  namespaceOptions,
  componentOptions,
}) => {
  const { name, status, application, releasePlan, namespace, component } = filters;

  return (
    <BaseTextFilterToolbar
      text={name}
      label="name"
      setText={(newName) => setFilters({ ...filters, name: newName })} // Changed: manual spread
      onClearFilters={onClearFilters}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={status}
        setValues={(newValues) => setFilters({ ...filters, status: newValues })} // Changed: manual spread
        options={statusOptions}
      />
      <MultiSelect
        label="Application"
        filterKey="application"
        values={application}
        setValues={(newValues) => setFilters({ ...filters, application: newValues })} // Changed: manual spread
        options={applicationOptions}
      />
      <MultiSelect
        label="Release Plan"
        filterKey="releasePlan"
        values={releasePlan}
        setValues={(newValues) => setFilters({ ...filters, releasePlan: newValues })} // Changed: manual spread
        options={releasePlanOptions}
      />
      <MultiSelect
        label="Namespace"
        filterKey="namespace"
        values={namespace}
        setValues={(newValues) => setFilters({ ...filters, namespace: newValues })} // Changed: manual spread
        options={namespaceOptions}
      />
      <MultiSelect
        label="Component"
        filterKey="component"
        values={component}
        setValues={(newValues) => setFilters({ ...filters, component: newValues })} // Changed: manual spread
        options={componentOptions}
      />
      {/* ... similar pattern for other MultiSelect components */}
    </BaseTextFilterToolbar>
  );
};

export default MonitoredReleasesFilterToolbar;
