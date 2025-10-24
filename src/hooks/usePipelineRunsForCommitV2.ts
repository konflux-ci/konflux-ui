import * as React from 'react';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { PipelineRunKind } from '../types';
import { useApplication } from './useApplications';
import { useComponents } from './useComponents';
import { usePipelineRunsV2 } from './usePipelineRunsV2';
import { GetNextPage, NextPageProps } from './useTektonResults';

export const usePipelineRunsForCommitV2 = (
  namespace: string,
  applicationName: string,
  commit: string,
  limit?: number,
  filterByComponents = true,
  plrType?: PipelineRunType,
): [PipelineRunKind[], boolean, unknown, GetNextPage, NextPageProps] => {
  const [components, componentsLoaded] = useComponents(namespace, applicationName);
  const [application] = useApplication(namespace, applicationName);

  const componentNames = React.useMemo(
    () => (componentsLoaded ? components.map((c) => c.metadata?.name) : []),
    [components, componentsLoaded],
  );

  const enabled = !!namespace && !!applicationName && !!commit;
  const [pipelineRuns, plrsLoaded, plrError, getNextPage, nextPageProps] = usePipelineRunsV2(
    enabled ? namespace : null,
    React.useMemo(
      () => ({
        selector: {
          filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
          matchLabels: {
            [PipelineRunLabel.APPLICATION]: applicationName,
            ...(plrType && { [PipelineRunLabel.PIPELINE_TYPE]: plrType }),
          },
          filterByCommit: commit,
        },
        ...(limit && { limit }),
      }),
      [applicationName, commit, application, limit, plrType],
    ),
  );

  return React.useMemo(() => {
    if (!plrsLoaded || plrError) {
      return [[], plrsLoaded, plrError, undefined, undefined];
    }
    return [
      pipelineRuns.filter((plr) =>
        filterByComponents
          ? componentNames.includes(plr.metadata?.labels?.[PipelineRunLabel.COMPONENT])
          : true,
      ),
      plrsLoaded,
      plrError,
      getNextPage,
      nextPageProps,
    ];
  }, [
    pipelineRuns,
    plrsLoaded,
    plrError,
    getNextPage,
    nextPageProps,
    filterByComponents,
    componentNames,
  ]);
};
