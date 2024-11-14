import React from 'react';
import { FULL_APPLICATION_TITLE } from '../../../consts/labels';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
import { UserAccessFormPage } from './UserAccessFormPage';

const GrantAccessPage: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { workspace } = useWorkspaceInfo();

  useDocumentTitle(`Grant access to workspace, ${workspace} | ${FULL_APPLICATION_TITLE}`);

  return <UserAccessFormPage />;
};

export default GrantAccessPage;
