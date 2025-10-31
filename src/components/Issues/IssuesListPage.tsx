import * as React from 'react';
import { FilterContextProvider } from '../Filter/generic/FilterContext';
import IssueListView from './IssuesListView/IssueListView';

const IssuesListPage: React.FunctionComponent = () => {
  return (
    <FilterContextProvider filterParams={['name', 'status', 'severity']}>
      <IssueListView />
    </FilterContextProvider>
  );
};
export default IssuesListPage;
