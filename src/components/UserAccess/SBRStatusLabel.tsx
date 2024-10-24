import * as React from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import { useSpaceBindingRequest } from '../../hooks/useSpaceBindingRequests';
import { WorkspaceBinding } from '../../types';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';

export const SBRStatusLabel: React.FC<
  React.PropsWithChildren<{ sbr: WorkspaceBinding['bindingRequest'] }>
> = ({ sbr }) => {
  const { workspace } = useWorkspaceInfo();
  const [binding, loaded] = useSpaceBindingRequest(sbr.namespace, workspace, sbr.name);
  const status = binding?.status?.conditions?.[0];

  if (!loaded || !status) {
    return <>-</>;
  }

  if (status.reason === 'Provisioned') {
    return <Label color="green">{status.reason}</Label>;
  }

  return (
    <Tooltip content={status.message}>
      <Label color="gold">{status.reason}</Label>
    </Tooltip>
  );
};
