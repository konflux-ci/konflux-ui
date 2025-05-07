import { Button } from '@patternfly/react-core';
import { useModalLauncher } from '../modal/ModalProvider';
import { createDeleteModalLauncher2 } from './LinkSecret';

export const LinkSecretView = () => {
  const showModal = useModalLauncher();
  return (
    <>
      <Button onClick={() => showModal(createDeleteModalLauncher2('')())}>Link Secrets</Button>
    </>
  );
};
