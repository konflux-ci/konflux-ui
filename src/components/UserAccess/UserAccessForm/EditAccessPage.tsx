import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useSpaceBindingRequest } from '../../../hooks/useSpaceBindingRequests';
import { HttpError } from '../../../k8s/error';
import { SpaceBindingRequestModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import { AccessReviewResources } from '../../../types';
import PageAccessCheck from '../../PageAccess/PageAccessCheck';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
import { UserAccessFormPage } from './UserAccessFormPage';

const EditAccessPage: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { bindingName } = useParams<RouterParams>();
  const { workspace, workspaceResource } = useWorkspaceInfo();
  const binding = workspaceResource.status?.bindings?.find(
    (b) => b.masterUserRecord === bindingName,
  )?.bindingRequest;

  const accessReviewResources: AccessReviewResources = binding
    ? [{ model: SpaceBindingRequestModel, verb: 'update' }]
    : [{ model: SpaceBindingRequestModel, verb: 'create' }];

  useDocumentTitle(`Edit access to namespace, ${workspace} | ${FULL_APPLICATION_TITLE}`);

  const [existingSBR, loaded, loadErr] = useSpaceBindingRequest(
    binding.namespace,
    workspace,
    binding.name,
  );

  if (binding && loadErr) {
    const httpError = HttpError.fromCode((loadErr as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode((loadErr as { code: number }).code)}
        title={`Unable to load space binding request ${binding.name}`}
        body={httpError.message}
      />
    );
  }

  if (binding && !loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  return (
    <PageAccessCheck accessReviewResources={accessReviewResources}>
      <UserAccessFormPage existingSbr={existingSBR} username={bindingName} edit />
    </PageAccessCheck>
  );
};

export default EditAccessPage;
