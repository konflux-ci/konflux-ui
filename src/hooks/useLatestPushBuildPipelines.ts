import * as React from 'react';
import { PUSH_BUILD_EVENT_TYPES, PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { useApplication } from '~/hooks/useApplications';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind } from '~/types';

export const useLatestPushBuildPipelines = (
  namespace: string,
  applicationName: string,
  componentNames: string[] | undefined,
): [PipelineRunKind[], boolean, unknown] => {
  const [foundNames, setFoundNames] = React.useState<string[]>([]);
  const [latestBuilds, setLatestBuilds] = React.useState<PipelineRunKind[]>([]);
  const [application, applicationLoaded] = useApplication(namespace, applicationName);

  React.useEffect(() => {
    setFoundNames([]);
  }, [componentNames]);

  const neededNames = React.useMemo(
    () => (componentNames ? componentNames.filter((n) => !foundNames.includes(n)) : []),
    [componentNames, foundNames],
  );

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
              values: [...PUSH_BUILD_EVENT_TYPES],
            },
          ],
        },
      }),
      [applicationName, application],
    ),
  );

  React.useEffect(() => {
    let canceled = false;

    if (error || !loaded || !componentNames || !pipelines) {
      return;
    }

    const getTimeFromPipelines = (run: PipelineRunKind) => {
      const ts =
        run.status?.completionTime ?? run.status?.startTime ?? run.metadata?.creationTimestamp;
      return ts ? new Date(ts).getTime() : 0;
    };
    const sortedPipelines = [...pipelines].sort(
      (a, b) => getTimeFromPipelines(b) - getTimeFromPipelines(a),
    );

    const builds = neededNames.reduce<PipelineRunKind[]>((acc, componentName) => {
      const build = sortedPipelines.find(
        (pipeline) => pipeline.metadata?.labels?.[PipelineRunLabel.COMPONENT] === componentName,
      );
      if (build) {
        acc.push(build);
      }
      return acc;
    }, []);

    const newNames = builds.map((build) => build.metadata.labels[PipelineRunLabel.COMPONENT]);

    if (!newNames.length) {
      if (neededNames.length) {
        getNextPage?.();
      }
    } else {
      if (!canceled) {
        if (builds.length) {
          setFoundNames((prev) => [...prev, ...newNames]);
          setLatestBuilds((prev) => [...prev, ...builds]);
        }
      }
    }

    return () => {
      canceled = true;
    };
  }, [componentNames, error, getNextPage, loaded, neededNames, pipelines]);

  return [latestBuilds, neededNames.length === 0 || (loaded && !getNextPage), error];
};
