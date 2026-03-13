import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { PIPELINE_RUNS_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';

export interface CommitPipelineRunsListProps {
  componentName?: string;
}

export const CommitPipelineRunsList: React.FC<CommitPipelineRunsListProps> = ({
  componentName,
}) => {
  const { applicationName, commitName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const [pipelineRuns, loaded, error] = usePipelineRunsForCommitV2(
    namespace,
    applicationName,
    commitName,
    undefined,
    false,
    PipelineRunType.TEST,
  );

  const pipelineRunsToShow = React.useMemo(() => {
    const runs = pipelineRuns ?? [];
    const withName = runs.filter((plr) => plr.metadata?.name);
    const forComponent = componentName
      ? withName.filter(
          (plr) => plr.metadata?.labels?.[PipelineRunLabel.COMPONENT] === componentName,
        )
      : withName;
    return forComponent;
  }, [pipelineRuns, componentName]);

  if (!loaded || error || !applicationName || !commitName) {
    return null;
  }

  if (pipelineRunsToShow.length === 0) {
    return null;
  }

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Integration tests</DescriptionListTerm>
      <DescriptionListDescription>
        <ul
          className="pf-v5-c-description-list__group-list"
          style={{ listStyle: 'none', paddingLeft: 0 }}
        >
          {pipelineRunsToShow.map((plr) => (
            <li
              key={plr.metadata?.name}
              className="pf-v5-u-mb-sm"
              data-test={`pipeline-run-row-${plr.metadata?.name}`}
            >
              <Link
                to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName,
                  pipelineRunName: plr.metadata?.name ?? '',
                })}
              >
                {plr.metadata?.name}
              </Link>
            </li>
          ))}
        </ul>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};
