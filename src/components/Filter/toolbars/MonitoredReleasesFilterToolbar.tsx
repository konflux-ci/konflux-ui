import * as React from 'react';
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
  const filtersRef = React.useRef(filters);
  React.useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  return (
    <BaseTextFilterToolbar
      text={name}
      label="Name"
      setText={(newName) => setFilters({ ...filtersRef.current, name: newName })}
      onClearFilters={onClearFilters}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={status}
        setValues={(newValues) => setFilters({ ...filtersRef.current, status: newValues })}
        options={statusOptions}
      />
      <MultiSelect
        label="Component"
        filterKey="component"
        values={component}
        setValues={(newValues) => setFilters({ ...filtersRef.current, component: newValues })}
        options={componentOptions}
      />
      <MultiSelect
        label="Application"
        filterKey="application"
        values={application}
        setValues={(newValues) => setFilters({ ...filtersRef.current, application: newValues })}
        options={applicationOptions}
      />
      <MultiSelect
        label="Release Plan"
        filterKey="releasePlan"
        values={releasePlan}
        setValues={(newValues) => setFilters({ ...filtersRef.current, releasePlan: newValues })}
        options={releasePlanOptions}
      />
      <MultiSelect
        label="Namespace"
        filterKey="namespace"
        values={namespace}
        setValues={(newValues) => setFilters({ ...filtersRef.current, namespace: newValues })}
        options={namespaceOptions}
      />
    </BaseTextFilterToolbar>
  );
};

export default MonitoredReleasesFilterToolbar;
