import * as React from 'react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
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
  pageSize?: number,
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
          },
          filterByCommit: commit,
        },
        ...(limit && { limit }),
        ...(pageSize && { pageSize }),
      }),
      [applicationName, commit, application, limit, pageSize],
    ),
  );

  return React.useMemo(() => {
    if (plrError) {
      return [[], plrsLoaded, plrError, undefined, undefined];
    }
    // If filtering by components but component names are not loaded yet, avoid premature empty result
    if (filterByComponents && !componentNames.length && plrsLoaded) {
      return [[], false, undefined, undefined, undefined];
    }
    const filtered = pipelineRuns.filter((plr) =>
      filterByComponents
        ? componentNames.includes(plr.metadata?.labels?.[PipelineRunLabel.COMPONENT])
        : true,
    );
    return [filtered, plrsLoaded, undefined, getNextPage, nextPageProps];
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
