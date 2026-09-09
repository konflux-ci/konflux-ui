import * as React from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { CliLoginContent } from './CliLoginContent';
import { useCliLogin } from './useCliLogin';

export const CliLoginModal: React.FC<ComponentProps> = () => {
  const [cliLogin, loaded, error] = useCliLogin();
  return <CliLoginContent cliLogin={cliLogin} loaded={loaded} error={error} />;
};

export const createCliLoginModal = createModalLauncher(CliLoginModal, {
  'data-test': 'cli-login-modal',
  'aria-label': 'Copy login command',
  variant: ModalVariant.medium,
});
