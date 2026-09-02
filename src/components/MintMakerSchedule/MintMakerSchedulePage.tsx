import { PageSection, Stack, StackItem } from '@patternfly/react-core';
import { mintMakerScheduleFilterConfig } from '~/components/MintMakerSchedule/mintmaker-schedule-table-config';
import { MintMakerScheduleEmptyState } from '~/components/MintMakerSchedule/MintMakerScheduleEmptyState';
import { MintMakerScheduleManagerCard } from '~/components/MintMakerSchedule/MintMakerScheduleManagerCard';
import PageLayout from '~/components/PageLayout/PageLayout';
import { useMintMakerSchedule } from '~/hooks/useMintMakerSchedule';
import { HttpError } from '~/k8s/error';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { FilterToolbar, useFilteredData, useFilterState } from '~/shared/components/Filter';
import { TableContainer } from '~/shared/components/TableV2';
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
          <Stack hasGutter>
            {filteredSchedule.map((entry) => (
              <StackItem key={entry.manager}>
                <MintMakerScheduleManagerCard entry={entry} />
              </StackItem>
            ))}
          </Stack>
        </TableContainer>
      </PageSection>
    </PageLayout>
  );
};
