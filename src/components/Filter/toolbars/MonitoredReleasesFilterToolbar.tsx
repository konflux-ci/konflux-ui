import * as React from 'react';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { MonitoredReleasesFilterState } from '~/components/Filter/utils/monitoredreleases-filter-utils';

type MonitoredReleasesFilterToolbarProps = {
  filters: MonitoredReleasesFilterState;
  setFilters: React.Dispatch<React.SetStateAction<MonitoredReleasesFilterState>>;
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
      setText={(newName) => setFilters((prev) => ({ ...prev, name: newName }))}
      onClearFilters={onClearFilters}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={status}
        setValues={(newValues) => setFilters((prev) => ({ ...prev, status: newValues }))}
        options={statusOptions}
      />
      <MultiSelect
        label="Application"
        filterKey="application"
        values={application}
        setValues={(newValues) => setFilters((prev) => ({ ...prev, application: newValues }))}
        options={applicationOptions}
      />
      <MultiSelect
        label="Release Plan"
        filterKey="releasePlan"
        values={releasePlan}
        setValues={(newValues) => setFilters((prev) => ({ ...prev, releasePlan: newValues }))}
        options={releasePlanOptions}
      />
      <MultiSelect
        label="Namespace"
        filterKey="namespace"
        values={namespace}
        setValues={(newValues) => setFilters((prev) => ({ ...prev, namespace: newValues }))}
        options={namespaceOptions}
      />
      <MultiSelect
        label="Component"
        filterKey="component"
        values={component}
        setValues={(newValues) => setFilters((prev) => ({ ...prev, component: newValues }))}
        options={componentOptions}
      />
    </BaseTextFilterToolbar>
  );
};

export default MonitoredReleasesFilterToolbar;
