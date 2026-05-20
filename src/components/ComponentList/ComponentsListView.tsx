import * as React from 'react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import ComponentList from './ComponentList';

const ComponentsListView: React.FC = () => (
  <FilterContextProvider filterParams={['name']}>
    <ComponentList />
  </FilterContextProvider>
);

export default ComponentsListView;
