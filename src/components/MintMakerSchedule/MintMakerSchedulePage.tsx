import { PageSection } from '@patternfly/react-core';
import {
  mintMakerScheduleFilterConfig,
  mintMakerScheduleTableColumns,
} from '~/components/MintMakerSchedule/mintmaker-schedule-table-config';
import { MintMakerScheduleEmptyState } from '~/components/MintMakerSchedule/MintMakerScheduleEmptyState';
import PageLayout from '~/components/PageLayout/PageLayout';
import { useMintMakerSchedule } from '~/hooks/useMintMakerSchedule';
import { HttpError } from '~/k8s/error';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import { Table, TableContainer } from '~/shared/components/TableV2';
import { getErrorState } from '~/shared/utils/error-utils';
import { MintMakerScheduleNotFoundState } from './MintMakerScheduleNotFoundState';

export const MintMakerSchedulePage = () => {
  const [schedule, loaded, error] = useMintMakerSchedule();
  const { clientFilterValues, clearAll, isFiltered } = useFilterState(
    mintMakerScheduleFilterConfig,
  );

  const { filteredData: filteredSchedule } = useFilteredData(
    mintMakerScheduleFilterConfig,
    schedule ?? [],
    clientFilterValues,
  );

  if (error) {
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as HttpError).code
        : undefined;
    if (loaded && errorCode === 404) {
      return (
        <PageLayout title="MintMaker Schedule" description="Upcoming scheduled dependency updates">
          <PageSection>
            <MintMakerScheduleNotFoundState />
          </PageSection>
        </PageLayout>
      );
    }
    return getErrorState(error, loaded, 'MintMaker schedule');
  }

  return (
    <PageLayout title="MintMaker Schedule" description="Upcoming scheduled dependency updates">
      <PageSection>
        <TableContainer
          data={filteredSchedule}
          unfilteredData={schedule ?? []}
          loaded={loaded}
          emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
          noDataState={<MintMakerScheduleEmptyState />}
          toolbar={
            isFiltered || schedule?.length > 0 ? (
              <FilterToolbar configs={mintMakerScheduleFilterConfig} />
            ) : undefined
          }
        >
          <Table
            data={filteredSchedule}
            columns={mintMakerScheduleTableColumns}
            getRowId={(row) => row.manager}
            aria-label="MintMaker schedule list"
            enableSorting
          />
        </TableContainer>
      </PageSection>
    </PageLayout>
  );
};
