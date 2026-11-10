import * as React from 'react';
import { Link } from 'react-router-dom';
import { Flex, Stack } from '@patternfly/react-core';
import {
  TaskNode,
  Node,
  NodeModel,
  WithSelectionProps,
  withSelection,
} from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import { GROUP_INTEGRATION_TEST_DETAILS_PATH } from '~/routes/paths';
import { WarningIcon } from '~/shared';

import './TestGraphNode.scss';

type TestGraphNodeData = {
  failFast?: boolean;
  groupName: string;
  namespace: string;
};

type TestGraphNodeProps = {
  element: Node<NodeModel, TestGraphNodeData>;
} & WithSelectionProps;

const TestGraphNode: React.FC<TestGraphNodeProps> = ({ element, ...rest }) => {
  const data = element.getData();
  const hasFailFast = data?.failFast;
  const testName = element.getLabel();
  const groupName = data?.groupName;
  const namespace = data?.namespace;

  const tooltipContent =
    namespace && testName ? (
      <Stack hasGutter className="testgraph-node__tooltip--content">
        <div className="testgraph-node__tooltip--title">{testName}</div>
        {hasFailFast && (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsXs' }}
            className="testgraph-node__tooltip--warning"
          >
            <WarningIcon aria-hidden="true" />
            Fail-fast enabled
          </Flex>
        )}
        <Link
          className="testgraph-node__tooltip--link"
          to={GROUP_INTEGRATION_TEST_DETAILS_PATH.createPath({
            groupName,
            workspaceName: namespace,
            integrationTestName: testName,
          })}
          aria-label={`View test details for ${testName}`}
        >
          View test details
        </Link>
      </Stack>
    ) : (
      testName
    );

  return (
    <TaskNode
      element={element as Node}
      leadIcon={hasFailFast ? <WarningIcon aria-label="Fail-fast enabled" /> : undefined}
      truncateLength={Infinity}
      toolTip={tooltipContent}
      {...rest}
    />
  );
};

export default withSelection()(observer(TestGraphNode));
