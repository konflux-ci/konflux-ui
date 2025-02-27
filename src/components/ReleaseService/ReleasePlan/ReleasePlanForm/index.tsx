import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useReleasePlan } from '../../../../hooks/useReleasePlans';
import { RouterParams } from '../../../../routes/utils';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { ReleasePlanFormPage } from './ReleasePlanFormPage';

export const ReleasePlanCreateFormPage: React.FC = () => {
  return <ReleasePlanFormPage />;
};

export const ReleasePlanEditFormPage: React.FC = () => {
  const { releasePlanName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [releasePlan, loaded] = useReleasePlan(namespace, releasePlanName);
  return loaded ? (
    <ReleasePlanFormPage releasePlan={releasePlan} />
  ) : (
    <Bullseye>
      <Spinner size="xl" />
    </Bullseye>
  );
};
