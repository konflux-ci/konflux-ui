import * as React from 'react';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { useDeepCompareMemoize } from '~/shared';

export type ConformaFilters = {
  name: string;
  status: string[];
  component: string[];
  policyExceptionOnly: boolean;
};

export const useConformaFilters = (): ConformaFilters => {
  const { filters } = React.useContext(FilterContext);
  return useDeepCompareMemoize({
    name: filters.name ? (filters.name as string) : '',
    status: filters.status ? (filters.status as string[]) : [],
    component: filters.component ? (filters.component as string[]) : [],
    policyExceptionOnly: filters.policy_exception_only === true,
  });
};
