import * as React from 'react';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { PipelineRunKind } from '../types';
import { useApplication } from './useApplications';
import { useComponents } from './useComponents';
import { usePipelineRunsV2 } from './usePipelineRunsV2';
import { GetNextPage, NextPageProps } from './useTektonResults';

const COMMIT_LABEL_FOR_PLR_TYPE = {
  [PipelineRunType.TEST]: PipelineRunLabel.TEST_SERVICE_COMMIT,
  [PipelineRunType.BUILD]: PipelineRunLabel.COMMIT_LABEL,
};

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
  const commitLabelKey = plrType ? COMMIT_LABEL_FOR_PLR_TYPE[plrType] : undefined;

  const options = React.useMemo(
    () => ({
      selector: {
        filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
        matchLabels: {
          [PipelineRunLabel.APPLICATION]: applicationName,
          ...(plrType && { [PipelineRunLabel.PIPELINE_TYPE]: plrType }),
          // Server-side commit filter when type is known
          ...(commitLabelKey && { [commitLabelKey]: commit }),
        },
        // Client-side commit filter when type is unknown (handles OR logic)
        ...(!commitLabelKey && { filterByCommit: commit }),
      },
      ...(limit && { limit }),
    }),
    [applicationName, commit, application, limit, plrType, commitLabelKey],
  );

  const [pipelineRuns, plrsLoaded, plrError, getNextPage, nextPageProps] = usePipelineRunsV2(
    enabled ? namespace : null,
    options,
  );

  return React.useMemo(() => {
    if (!plrsLoaded || plrError) {
      return [
        [],
        plrsLoaded,
        plrError,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ];
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
