import * as React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Spinner,
} from '@patternfly/react-core';
import { VisualizationFactory } from '~/components/topology/factories';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { WarningIcon } from '~/shared';
import { getErrorState } from '~/shared/utils/error-utils';
import { testGraphComponentFactory } from './testgraph-component-factory';
import { testGraphLayoutFactory } from './testgraph-layout-factory';
import { getTestGraphModel } from './testgraph-model-utils';

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
    return getTestGraphModel(testGraph, group?.metadata?.name ?? '');
  }, [group?.metadata?.name, testGraph]);

  const hasAnyFailFast = React.useMemo(() => {
    if (!model?.nodes) return false;
    return model.nodes.some((node) => node.data?.failFast === true);
  }, [model]);

  if (error) {
    return (
      <Card isCompact style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
        <CardTitle>Execution order</CardTitle>
        <CardBody>{getErrorState(error, loaded, 'group')}</CardBody>
      </Card>
    );
  }

  if (!loaded) {
    return (
      <Card isCompact style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
        <CardTitle>Execution order</CardTitle>
        <CardBody>
          <Spinner size="md" aria-label="Loading execution order" />
        </CardBody>
      </Card>
    );
  }

  if (!model || !group) {
    return null;
  }

  return (
    <Card isCompact style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
      <CardTitle>Execution order</CardTitle>
      <CardBody>
        <div
          role="region"
          aria-label="Integration test execution order graph"
          style={{ overflow: 'auto' }}
        >
          <VisualizationFactory
            componentFactory={testGraphComponentFactory}
            layoutFactory={testGraphLayoutFactory}
            model={model}
          />
          {hasAnyFailFast && (
            <Flex
              direction={{ default: 'row' }}
              spaceItems={{ default: 'spaceItemsSm' }}
              style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}
            >
              <FlexItem>
                <WarningIcon aria-hidden="true" />
              </FlexItem>
              <FlexItem>
                <Content component="p" className="pf-v6-u-font-weight-bold">
                  Fail-fast
                </Content>
              </FlexItem>
              <FlexItem>
                <Content component="p">
                  {' '}
                  - if this test fails, subsequent stages will not run
                </Content>
              </FlexItem>
            </Flex>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default TestGraphVisualization;
