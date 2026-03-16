import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
} from '@patternfly/react-core';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { PIPELINE_RUNS_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';

export interface CommitIntegrationTestsListProps {
  componentName?: string;
}

export const CommitIntegrationTestsList: React.FC<CommitIntegrationTestsListProps> = ({
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
    const forComponent = componentName
      ? runs.filter((plr) => plr.metadata?.labels?.[PipelineRunLabel.COMPONENT] === componentName)
      : runs;
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
        <List isPlain>
          {pipelineRunsToShow.map((plr) => (
            <ListItem key={plr.metadata?.name} data-test={`pipeline-run-row-${plr.metadata?.name}`}>
              <Link
                to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName,
                  pipelineRunName: plr.metadata?.name ?? '',
                })}
              >
                {plr.metadata?.name}
              </Link>
            </ListItem>
          ))}
        </List>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};
