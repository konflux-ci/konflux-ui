import { Button } from '@patternfly/react-core';
import { useModalLauncher } from '../modal/ModalProvider';
import { createUnlinkSecretModalLauncher } from './UnlinkSecret';

const UnlinkSecretView = () => {
  const showModal = useModalLauncher();
  return (
    <>
      <Button
        onClick={() => {
          showModal(createUnlinkSecretModalLauncher()());
        }}
      >
        Unlink Secret
      </Button>
    </>
  );
};
export default UnlinkSecretView;
