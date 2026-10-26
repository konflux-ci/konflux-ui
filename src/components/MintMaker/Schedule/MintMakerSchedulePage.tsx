import React from 'react';
import { Flex, PageSection } from '@patternfly/react-core';
import PageLayout from '~/components/PageLayout/PageLayout';
import { useMintMakerSchedule } from '~/hooks/useMintMakerSchedule';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { getErrorState } from '~/shared/utils/error-utils';
import {
  MINTMAKER_SCHEDULE_COLUMN_STATE_KEY,
  getMintMakerScheduleTableColumns,
  mintMakerScheduleFilterConfig,
} from './mintmaker-schedule-table-config';
import { MintMakerScheduleEmptyState } from './MintMakerScheduleEmptyState';
import { MintMakerScheduleExpandedContent } from './MintMakerScheduleExpandedContent';
import { MintMakerScheduleNotFoundState } from './MintMakerScheduleNotFoundState';

export const MintMakerSchedulePage = () => {
  const [schedule, loaded, error] = useMintMakerSchedule();
  const columns = React.useMemo(() => getMintMakerScheduleTableColumns(), []);
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(
    mintMakerScheduleFilterConfig,
  );

  const scheduleList = schedule ?? [];
  const { filteredData } = useFilteredData(
    mintMakerScheduleFilterConfig,
    scheduleList,
    clientFilterValues,
  );

  if (error) {
    const errorCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'number'
        ? error.code
        : undefined;
    if (loaded && errorCode === 404) {
      return (
        <PageLayout
          title="Dependency updates schedule"
          description="Upcoming scheduled dependency updates"
        >
          <PageSection>
            <MintMakerScheduleNotFoundState />
          </PageSection>
        </PageLayout>
      );
    }
    return getErrorState(error, loaded, 'Dependency updates schedule');
  }

  return (
    <PageLayout title="Dependency updates schedule">
      <PageSection>
        <Flex direction={{ default: 'column' }}>
          <TableContainer
            data={filteredData}
            unfilteredData={scheduleList}
            loaded={loaded}
            emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
            noDataState={<MintMakerScheduleEmptyState />}
            toolbar={
              isFiltered || scheduleList.length > 0 ? (
                <FilterToolbar configs={mintMakerScheduleFilterConfig} />
              ) : undefined
            }
          >
            <Table
              data={filteredData}
              columns={columns}
              getRowId={(row) => row.manager}
              aria-label="MintMaker schedule"
              data-test="mintmaker-schedule-table"
              enableExpansion
              expandedContent={(entry) => <MintMakerScheduleExpandedContent entry={entry} />}
              columnStateKey={MINTMAKER_SCHEDULE_COLUMN_STATE_KEY}
            />
          </TableContainer>
        </Flex>
      </PageSection>
    </PageLayout>
  );
};
