import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useRoleBindings } from '../../../hooks/useRoleBindings';
import { HttpError } from '../../../k8s/error';
import { RoleBindingModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import ErrorEmptyState from '../../../shared/components/empty-state/ErrorEmptyState';
import { AccessReviewResources } from '../../../types';
import PageAccessCheck from '../../PageAccess/PageAccessCheck';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
import { UserAccessFormPage } from './UserAccessFormPage';

const EditAccessPage: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { bindingName } = useParams<RouterParams>();
  const { namespace } = useWorkspaceInfo();
  const [roleBindings, loading, error] = useRoleBindings(namespace);
  const binding = roleBindings.find((roleBinding) =>
    roleBinding.subjects.some((subject) => subject.name === bindingName),
  );

  useDocumentTitle(`Edit access to namespace, ${namespace} | ${FULL_APPLICATION_TITLE}`);

  const accessReviewResources: AccessReviewResources = binding
    ? [{ model: RoleBindingModel, verb: 'update' }]
    : [{ model: RoleBindingModel, verb: 'create' }];

  if (error) {
    const httpError = HttpError.fromCode((error as { code: number }).code);
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode((error as { code: number }).code)}
        title={`Unable to load role binding ${bindingName}`}
        body={httpError.message}
      />
    );
  }

  if (loading) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  return (
    <PageAccessCheck accessReviewResources={accessReviewResources}>
      <UserAccessFormPage existingRb={binding} username={bindingName} edit />
    </PageAccessCheck>
  );
};
export default EditAccessPage;
