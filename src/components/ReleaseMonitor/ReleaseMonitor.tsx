import * as React from 'react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import ReleaseMonitorListView from './ReleaseMonitorListView';

const ReleaseMonitor: React.FunctionComponent = () => {
  return (
    <FilterContextProvider
      filterParams={[
        'name',
        'status',
        'application',
        'releasePlan',
        'namespace',
        'component',
        'showLatest',
      ]}
    >
      <ReleaseMonitorListView />
    </FilterContextProvider>
  );
};

export default ReleaseMonitor;
