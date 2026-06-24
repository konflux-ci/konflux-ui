import * as React from 'react';
import { PUSH_BUILD_EVENT_TYPES, PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { useApplication } from '~/hooks/useApplications';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind } from '~/types';

const getTimeFromPipeline = (run: PipelineRunKind) => {
  const ts = run.status?.completionTime ?? run.status?.startTime ?? run.metadata?.creationTimestamp;
  return ts ? new Date(ts).getTime() : 0;
};

export const useLatestPushBuildPipelines = (
  namespace: string,
  applicationName: string,
  componentNames: string[] | undefined,
): [PipelineRunKind[], boolean, unknown] => {
  const [application, applicationLoaded] = useApplication(namespace, applicationName);

  const [pipelines, loaded, error, getNextPage] = usePipelineRunsV2(
    applicationLoaded ? namespace : null,
    React.useMemo(
      () => ({
        selector: {
          filterByCreationTimestampAfter: application?.metadata?.creationTimestamp,
          matchLabels: {
            [PipelineRunLabel.APPLICATION]: applicationName,
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
          },
          matchExpressions: [
            {
              key: PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL,
              operator: 'In',
              values: PUSH_BUILD_EVENT_TYPES,
            },
          ],
        },
      }),
      [applicationName, application],
    ),
  );

  const latestBuilds = React.useMemo(() => {
    if (error || !loaded || !componentNames || !pipelines) {
      return [];
    }

    const sortedPipelines = [...pipelines].sort(
      (a, b) => getTimeFromPipeline(b) - getTimeFromPipeline(a),
    );

    return componentNames.reduce<PipelineRunKind[]>((acc, componentName) => {
      const build = sortedPipelines.find(
        (pipeline) => pipeline.metadata?.labels?.[PipelineRunLabel.COMPONENT] === componentName,
      );
      if (build) {
        acc.push(build);
      }
      return acc;
    }, []);
  }, [componentNames, error, loaded, pipelines]);

  const missingComponentNames = React.useMemo(() => {
    if (!componentNames) {
      return [];
    }

    const foundNames = new Set(
      latestBuilds.map((build) => build.metadata.labels[PipelineRunLabel.COMPONENT]),
    );

    return componentNames.filter((name) => !foundNames.has(name));
  }, [componentNames, latestBuilds]);

  React.useEffect(() => {
    if (error || !loaded || !missingComponentNames.length) {
      return;
    }

    getNextPage?.();
  }, [error, getNextPage, loaded, missingComponentNames.length, pipelines]);

  return [latestBuilds, missingComponentNames.length === 0 || (loaded && !getNextPage), error];
};
