import {
  DagreLayoutOptions,
  Graph,
  LayoutFactory,
  PipelineDagreLayout,
} from '@patternfly/react-topology';
import * as dagre from 'dagre';

const TESTGRAPH_LAYOUT_PROPS: dagre.GraphLabel = {
  nodesep: 20,
  ranksep: 50,
  edgesep: 40,
  ranker: 'network-simplex',
};

export const testGraphLayoutFactory: LayoutFactory = (_type, graph: Graph) => {
  return new PipelineDagreLayout(graph, {
    ...TESTGRAPH_LAYOUT_PROPS,
    ignoreGroups: false, // IMPORTANT: Enable groups for stage visualization
  } as DagreLayoutOptions);
};
