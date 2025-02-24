import React from 'react';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useNamespace } from '../../../shared/providers/Namespace';
import { UserAccessFormPage } from './UserAccessFormPage';

const GrantAccessPage: React.FC<React.PropsWithChildren<unknown>> = () => {
  const namespace = useNamespace();

  useDocumentTitle(`Grant access to workspace, ${namespace} | ${FULL_APPLICATION_TITLE}`);

  return <UserAccessFormPage />;
};

export default GrantAccessPage;
