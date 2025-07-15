import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useErrorState } from '~/shared/hooks/useErrorState';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useRoleBinding } from '../../../hooks/useRoleBindings';
import { RoleBindingModel } from '../../../models';
import { RouterParams } from '../../../routes/utils';
import { useNamespace } from '../../../shared/providers/Namespace';
import { AccessReviewResources } from '../../../types';
import PageAccessCheck from '../../PageAccess/PageAccessCheck';
import { UserAccessFormPage } from './UserAccessFormPage';

const EditAccessPage: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { bindingName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [binding, loaded, error] = useRoleBinding(namespace, bindingName);
  const errorState = useErrorState(error, loaded, 'role binding');

  useDocumentTitle(`Edit access to namespace, ${namespace} | ${FULL_APPLICATION_TITLE}`);

  const accessReviewResources: AccessReviewResources = binding
    ? [{ model: RoleBindingModel, verb: 'update' }]
    : [{ model: RoleBindingModel, verb: 'create' }];

  if (errorState) {
    return errorState;
  }

  if (!loaded) {
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
