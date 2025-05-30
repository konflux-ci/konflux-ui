import { Button } from '@patternfly/react-core';
import { SecretKind } from '~/types';
import { useModalLauncher } from '../modal/ModalProvider';
import { createUnlinkSecretModalLauncher } from './UnlinkSecret';

const UnlinkSecretView: React.FC = (secret: SecretKind) => {
  const showModal = useModalLauncher();
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          showModal(createUnlinkSecretModalLauncher()(secret));
        }}
      >
        Unlink
      </Button>
    </>
  );
};
export default UnlinkSecretView;
