import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  TaskNode,
  Node,
  NodeModel,
  WithContextMenuProps,
  WithSelectionProps,
  withSelection,
} from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import { GROUP_INTEGRATION_TEST_DETAILS_PATH } from '~/routes/paths';
import { WarningIcon } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';

import './TestGraphNode.scss';

type TestGraphNodeData = {
  failFast?: boolean;
  groupName: string;
};

type TestGraphNodeProps = {
  element: Node<NodeModel, TestGraphNodeData>;
} & WithContextMenuProps &
  WithSelectionProps;

const TestGraphNode: React.FC<TestGraphNodeProps> = ({ element, ...rest }) => {
  const data = element.getData();
  const hasFailFast = data?.failFast;
  const namespace = useNamespace();
  const testName = element.getLabel();
  const groupName = data?.groupName;

  const tooltipContent =
    namespace && testName ? (
      <div className="testgraph-node__tooltip--content">
        <div className="testgraph-node__tooltip--title">{testName}</div>
        {hasFailFast && (
          <div className="testgraph-node__tooltip--warning">
            <WarningIcon aria-hidden="true" />
            Fail-fast enabled
          </div>
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
      </div>
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
