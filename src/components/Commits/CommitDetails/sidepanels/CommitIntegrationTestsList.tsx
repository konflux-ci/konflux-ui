import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  List,
  ListItem,
} from '@patternfly/react-core';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { PIPELINE_RUNS_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { pipelineRunStatus } from '~/utils/pipeline-utils';

export interface CommitIntegrationTestsListProps {
  componentName?: string;
  integrationTestScenario: string;
}

export const CommitIntegrationTestsList: React.FC<CommitIntegrationTestsListProps> = ({
  componentName,
  integrationTestScenario,
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
    if (!integrationTestScenario) {
      return [];
    }
    return runs.filter((plr) => {
      const scenario = plr.metadata?.labels?.[PipelineRunLabel.TEST_SERVICE_SCENARIO];
      const matchesScenario = scenario === integrationTestScenario;
      const matchesComponent = componentName
        ? plr.metadata?.labels?.[PipelineRunLabel.COMPONENT] === componentName
        : true;
      return matchesScenario && matchesComponent;
    });
  }, [pipelineRuns, componentName, integrationTestScenario]);

  if (!integrationTestScenario || !loaded || error || !applicationName || !commitName) {
    return null;
  }

  if (pipelineRunsToShow.length === 0) {
    return null;
  }

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Test pipeline runs</DescriptionListTerm>
      <DescriptionListDescription>
        <List isPlain>
          {pipelineRunsToShow.map((plr) => {
            const plrName = plr.metadata?.name ?? '';
            const status = pipelineRunStatus(plr);
            return (
              <ListItem key={plrName} data-test={`pipeline-run-row-${plrName}`}>
                <Flex
                  alignItems={{ default: 'alignItemsCenter' }}
                  gap={{ default: 'gapSm' }}
                  flexWrap={{ default: 'wrap' }}
                >
                  <FlexItem>
                    <StatusIconWithText
                      status={status}
                      dataTestAttribute={`pipeline-run-status-${plrName}`}
                    />
                  </FlexItem>
                  <FlexItem>
                    <Link
                      to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                        workspaceName: namespace,
                        applicationName,
                        pipelineRunName: plrName,
                      })}
                      aria-label={`${plrName}, ${status}`}
                    >
                      {plrName}
                    </Link>
                  </FlexItem>
                </Flex>
              </ListItem>
            );
          })}
        </List>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};
