import * as React from 'react';
// import { PipelineRunKind } from '../../types';
import { FilterContextProvider } from '../Filter/generic/FilterContext';
import ReleaseMonitorListView from './ReleaseMonitorListView';

const ReleaseMonitor: React.FunctionComponent = () => {
  return (
    <FilterContextProvider
      filterParams={['name', 'status', 'application', 'releasePlan', 'namespace', 'component']}
    >
      <ReleaseMonitorListView />
    </FilterContextProvider>
  );
};

export default ReleaseMonitor;
