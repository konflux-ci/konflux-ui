import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { usePipelineRuns } from '../../hooks/usePipelineRuns';
import { useReleasePlan } from '../../hooks/useReleasePlans';
import { useRelease } from '../../hooks/useReleases';
import { HttpError } from '../../k8s/error';
import { RouterParams } from '../../routes/utils';
import { Table } from '../../shared';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import { useNamespace } from '../../shared/providers/Namespace';
import { PipelineRunKind } from '../../types';
import PipelineRunEmptyState from '../PipelineRun/PipelineRunEmptyState';
import { PipelineRunListHeaderForRelease } from '../PipelineRun/PipelineRunListView/PipelineRunListHeader';
import { PipelineRunListRowForRelease } from '../PipelineRun/PipelineRunListView/PipelineRunListRow';

const ReleasePipelineRunTab: React.FC<React.PropsWithChildren> = () => {
  const { applicationName, releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release] = useRelease(namespace, releaseName);
  const [releasePlan] = useReleasePlan(namespace, release?.spec?.releasePlan);

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRuns(
      namespace,
      React.useMemo(
        () => ({
          selector: {
            matchLabels: {
              [PipelineRunLabel.APPLICATION]: applicationName,
              [PipelineRunLabel.RELEASE_NAME]: releaseName,
            },
          },
        }),
        [applicationName, releaseName],
      ),
    );

  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = React.useMemo(
    () => ({
      name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    }),
    [unparsedFilters],
  );
  const { name: nameFilter } = filters;

  const filteredPipelineRuns = React.useMemo(
    () =>
      pipelineRuns ? pipelineRuns.filter((pr) => pr.metadata.name.indexOf(nameFilter) !== -1) : [],
    [pipelineRuns, nameFilter],
  );

  if (error) {
    const httpError = HttpError.fromCode(error ? (error as { code: number }).code : 404);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title="Unable to load pipeline runs"
        body={httpError?.message.length ? httpError?.message : 'Something went wrong'}
      />
    );
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!pipelineRuns || pipelineRuns.length === 0) {
    return <PipelineRunEmptyState applicationName={applicationName} />;
  }

  const DataToolbar = (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="name"
      setText={(name) => setFilters({ name })}
      onClearFilters={onClearFilters}
      dataTest="release-pipeline-run-list-toolbar"
    />
  );

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-pl-lg">
        Pipeline runs
      </Title>
      <Table
        data-test="release-pipeline-run__table"
        data={filteredPipelineRuns}
        aria-label="Pipeline Run List"
        Header={PipelineRunListHeaderForRelease}
        Row={PipelineRunListRowForRelease}
        Toolbar={DataToolbar}
        loaded
        customData={{
          releaseName,
          releasePlan,
          release,
        }}
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.uid,
        })}
        onRowsRendered={({ stopIndex }) => {
          if (
            loaded &&
            stopIndex === pipelineRuns.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            getNextPage?.();
          }
        }}
      />
    </>
  );
};

const ReleasePipelineRunTabWithContext = (
  props: React.ComponentProps<typeof ReleasePipelineRunTab>,
) => (
  <FilterContextProvider filterParams={['name']}>
    <ReleasePipelineRunTab {...props} />
  </FilterContextProvider>
);

export default ReleasePipelineRunTabWithContext;
