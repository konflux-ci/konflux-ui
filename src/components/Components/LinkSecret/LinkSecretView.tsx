import { Button } from '@patternfly/react-core';
import { useModalLauncher } from '../../modal/ModalProvider';
import { createLinkSecretModalLauncher } from './LinkSecret';

export const LinkSecretView = () => {
  const showModal = useModalLauncher();
  return (
    <>
      <Button variant="secondary" onClick={() => showModal(createLinkSecretModalLauncher()())}>
        Link Secrets
      </Button>
    </>
  );
};
