import * as React from 'react';
import { GithubIcon } from '@patternfly/react-icons/dist/esm/icons/github-icon';
import { ServerIcon } from '@patternfly/react-icons/dist/esm/icons/server-icon';
import PipelineIcon from '../../../../../../assets/pipelineIcon.svg';
import { WorkflowNodeType } from '../types';

export const getWorkflowNodeIcon = (type: WorkflowNodeType): React.ReactNode => {
  switch (type) {
    case WorkflowNodeType.COMMIT:
    case WorkflowNodeType.COMPONENT:
      return <GithubIcon />;
    case WorkflowNodeType.STATIC_ENVIRONMENT:
    case WorkflowNodeType.MANAGED_ENVIRONMENT:
      return <ServerIcon />;
    case WorkflowNodeType.BUILD:
    case WorkflowNodeType.TESTS:
    case WorkflowNodeType.APPLICATION_TEST:
    case WorkflowNodeType.RELEASE:
    case WorkflowNodeType.PIPELINE:
    default:
      return <PipelineIcon />;
  }
};
