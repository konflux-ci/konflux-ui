import {
  ComponentFactory,
  ModelKind,
  GraphComponent,
  TaskEdge,
  DefaultGroup,
} from '@patternfly/react-topology';
import { TestGraphNodeType } from './testgraph-visualization-types';
import TestGraphNode from './TestGraphNode';

export const testGraphComponentFactory: ComponentFactory = (kind, type) => {
  if (kind === ModelKind.graph) {
    return GraphComponent;
  }
  if (kind === ModelKind.edge) {
    return TaskEdge;
  }

  switch (type) {
    case TestGraphNodeType.GROUP:
      return DefaultGroup;
    case TestGraphNodeType.TEST_NODE:
      return TestGraphNode;
    default:
      return undefined;
  }
};
