import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  Label,
  Spinner,
  Tooltip,
} from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons/dist/esm/icons';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { useImageRepository } from '~/hooks/useImageRepository';
import { ImageRepositoryModel } from '~/models';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentKind, ImageRepositoryVisibility } from '~/types';
import { TrackEvents, useTrackEvent } from '~/utils/analytics';
import { useAccessReviewForModel } from '~/utils/rbac';
import { createEditImageRepositoryVisibilityModal } from './EditImageRepositoryVisibilityModal';

type ComponentImageRepositoryVisibilityProps = {
  component: ComponentKind;
};

const ComponentImageRepositoryVisibility: React.FC<
  React.PropsWithChildren<ComponentImageRepositoryVisibilityProps>
> = ({ component }) => {
  const namespace = useNamespace();
  const track = useTrackEvent();
  const showModal = useModalLauncher();

  // Check if user has permission to list/view image repository
  const [canListImageRepository] = useAccessReviewForModel(ImageRepositoryModel, 'list');

  // Check if user has permission to update image repository
  const [canUpdateImageRepository] = useAccessReviewForModel(ImageRepositoryModel, 'update');

  // Only fetch ImageRepository if user has list permission
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    canListImageRepository ? component?.metadata?.namespace : null,
    canListImageRepository ? component?.metadata?.name : null,
    false,
  );

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
  if (canListImageRepository && !imageRepoLoaded) {
    return <Spinner size="md" />;
  }

  // Handle error state
  if (canListImageRepository && imageRepoError) {
    return getErrorState(imageRepoError, imageRepoLoaded, 'image repository', true);
  }

  const visibility = imageRepository?.spec?.image?.visibility;
  const isPrivate = visibility === ImageRepositoryVisibility.private;

  const editButton = (
    <Button
      variant={ButtonVariant.link}
      isInline
      isDisabled={!canUpdateImageRepository}
      onClick={handleEditVisibility}
      data-test="edit-visibility-button"
    >
      Edit
    </Button>
  );

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      <FlexItem>
        {visibility ? (
          <Label
            color={isPrivate ? 'orange' : 'blue'}
            icon={isPrivate ? <EyeSlashIcon /> : <EyeIcon />}
            data-test={`visibility-label-${visibility}`}
          >
            {visibility}
          </Label>
        ) : (
          <Tooltip
            content={
              canListImageRepository
                ? 'The visibility has not been set yet.'
                : 'You do not have permission to view image repository visibility'
            }
          >
            <span data-test="visibility-placeholder">-</span>
          </Tooltip>
        )}
      </FlexItem>
      <FlexItem>
        {canUpdateImageRepository ? (
          editButton
        ) : (
          <Tooltip content="You do not have permission to edit image repository visibility">
            <span style={{ display: 'inline-block' }}>{editButton}</span>
          </Tooltip>
        )}
      </FlexItem>
    </Flex>
  );
};

export default React.memo(ComponentImageRepositoryVisibility);
