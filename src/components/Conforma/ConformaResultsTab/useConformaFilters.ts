import * as React from 'react';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { useDeepCompareMemoize } from '~/shared';

export type ConformaFilters = {
  name: string;
  status: string[];
};

export const useConformaFilters = (): ConformaFilters => {
  const { filters } = React.useContext(FilterContext);
  return useDeepCompareMemoize({
    name: filters.name ? (filters.name as string) : '',
    status: filters.status ? (filters.status as string[]) : [],
  });
};
