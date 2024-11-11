import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useReleasePlan } from '../../../../hooks/useReleasePlans';
import { RouterParams } from '../../../../routes/utils';
import { useWorkspaceInfo } from '../../../Workspace/useWorkspaceInfo';
import { ReleasePlanFormPage } from './ReleasePlanFormPage';

export const ReleasePlanCreateFormPage: React.FC = () => {
  return <ReleasePlanFormPage />;
};

export const ReleasePlanEditFormPage: React.FC = () => {
  const { releasePlanName } = useParams<RouterParams>();
  const { workspace, namespace } = useWorkspaceInfo();
  const [releasePlan, loaded] = useReleasePlan(namespace, workspace, releasePlanName);
  return loaded ? (
    <ReleasePlanFormPage releasePlan={releasePlan} />
  ) : (
    <Bullseye>
      <Spinner size="xl" />
    </Bullseye>
  );
};
