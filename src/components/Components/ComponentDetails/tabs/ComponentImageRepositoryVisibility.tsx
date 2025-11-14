import * as React from 'react';
import { Button, ButtonVariant, Label, Spinner } from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons/dist/esm/icons';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentKind, ImageRepositoryKind, ImageRepositoryVisibility } from '~/types';
import { TrackEvents, useTrackEvent } from '~/utils/analytics';
import { createEditImageRepositoryVisibilityModal } from './EditImageRepositoryVisibilityModal';

type ComponentImageRepositoryVisibilityProps = {
  component: ComponentKind;
  imageRepository: ImageRepositoryKind;
  imageRepoLoaded: boolean;
  imageRepoError: unknown;
};

const ComponentImageRepositoryVisibility: React.FC<
  React.PropsWithChildren<ComponentImageRepositoryVisibilityProps>
> = ({ component, imageRepository, imageRepoLoaded, imageRepoError }) => {
  const namespace = useNamespace();
  const track = useTrackEvent();
  const showModal = useModalLauncher();

  const handleEditVisibility = () => {
    track(TrackEvents.ButtonClicked, {
      link_name: 'edit-image-repository-visibility',
      link_location: 'component-details',
      component_name: component?.metadata?.name,
      app_name: component?.spec?.application,
      namespace,
    });
    showModal(createEditImageRepositoryVisibilityModal({ imageRepository }));
  };

  // Handle loading state
  if (!imageRepoLoaded) {
    return <Spinner size="md" />;
  }

  // Handle error state
  if (imageRepoError) {
    return getErrorState(imageRepoError, imageRepoLoaded, 'image repository', true);
  }

  // Handle not found state
  if (!imageRepository) {
    return <>-</>;
  }

  const currentVisibility =
    imageRepository?.spec?.image?.visibility || ImageRepositoryVisibility.public;
  const isPrivate = currentVisibility === ImageRepositoryVisibility.private;

  return (
    <>
      <Label
        color={isPrivate ? 'orange' : 'blue'}
        icon={isPrivate ? <EyeSlashIcon /> : <EyeIcon />}
        data-test={`visibility-label-${currentVisibility}`}
      >
        {isPrivate ? 'Private' : 'Public'}
      </Label>{' '}
      <Button
        variant={ButtonVariant.link}
        isInline
        onClick={handleEditVisibility}
        data-test="edit-visibility-button"
      >
        Edit
      </Button>
    </>
  );
};

export default React.memo(ComponentImageRepositoryVisibility);
