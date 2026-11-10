import * as React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Spinner,
  Stack,
} from '@patternfly/react-core';
import { VisualizationFactory } from '~/components/topology/factories';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { WarningIcon } from '~/shared';
import { getErrorState } from '~/shared/utils/error-utils';
import { testGraphComponentFactory } from './testgraph-component-factory';
import { testGraphLayoutFactory } from './testgraph-layout-factory';
import { getTestGraphModel } from './testgraph-model-utils';

import './TestGraphVisualization.scss';

type TestGraphVisualizationProps = {
  namespace: string;
  groupName: string;
};

const TestGraphVisualization: React.FC<TestGraphVisualizationProps> = ({
  namespace,
  groupName,
}) => {
  const [group, loaded, error] = useComponentGroup(namespace, groupName, true);
  const testGraph = group?.spec?.testGraph;

  const model = React.useMemo(() => {
    if (!testGraph || Object.keys(testGraph).length === 0) {
      return null;
    }
    return getTestGraphModel(testGraph, group?.metadata?.name ?? '', namespace);
  }, [group?.metadata?.name, namespace, testGraph]);

  const hasAnyFailFast = React.useMemo(() => {
    if (!model?.nodes) return false;
    return model.nodes.some((node) => node.data?.failFast === true);
  }, [model]);

  if (error || !loaded) {
    return (
      <Card isCompact className="testgraph-visualization">
        <CardTitle>Execution order</CardTitle>
        <CardBody aria-live="polite">
          {error ? (
            getErrorState(error, loaded, 'group')
          ) : (
            <Spinner size="md" aria-label="Loading execution order" />
          )}
        </CardBody>
      </Card>
    );
  }

  if (!model || !group) {
    return null;
  }

  return (
    <Card isCompact className="testgraph-visualization">
      <CardTitle>Execution order</CardTitle>
      <CardBody aria-live="polite">
        <div
          role="region"
          aria-label="Integration test execution order graph"
          className="testgraph-visualization__graph"
        >
          <Stack hasGutter>
            <VisualizationFactory
              componentFactory={testGraphComponentFactory}
              layoutFactory={testGraphLayoutFactory}
              model={model}
            />
            {hasAnyFailFast && (
              <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <WarningIcon aria-hidden="true" />
                </FlexItem>
                <FlexItem>
                  <Content component="p">
                    <strong>Fail-fast</strong> — if this test fails, subsequent stages will not run
                  </Content>
                </FlexItem>
              </Flex>
            )}
          </Stack>
        </div>
      </CardBody>
    </Card>
  );
};

export default TestGraphVisualization;
