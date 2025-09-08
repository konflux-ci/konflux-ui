import { Button } from '@patternfly/react-core';
import { SecretKind } from '~/types';
import { useModalLauncher } from '../../modal/ModalProvider';
import { createUnlinkSecretModalLauncher } from './UnlinkSecret';

type UnlinkSecretViewProps = {
  secret: SecretKind;
};
const UnlinkSecretView: React.FC<UnlinkSecretViewProps> = (secret) => {
  const showModal = useModalLauncher();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        showModal(createUnlinkSecretModalLauncher()(secret));
      }}
    >
      Unlink
    </Button>
  );
};
export default UnlinkSecretView;
