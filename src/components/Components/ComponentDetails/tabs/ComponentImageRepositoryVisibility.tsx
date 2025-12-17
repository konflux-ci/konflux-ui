import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  Label,
  Skeleton,
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

  // Check if user has permission to update image repository
  const [canUpdateImageRepository] = useAccessReviewForModel(ImageRepositoryModel, 'update');

  // Fetch ImageRepository - will fail with error if user doesn't have permission
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    component?.metadata?.namespace,
    component?.metadata?.name,
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
  if (!imageRepoLoaded) {
    return <Skeleton aria-label="Loading image repository visibility" />;
  }

  // Handle error state
  if (imageRepoError) {
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

  const tooltipContent = !visibility
    ? 'The visibility has not been set yet.'
    : !canUpdateImageRepository
      ? 'You do not have permission to edit image repository visibility'
      : null;

  const content = (
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
          '-'
        )}
      </FlexItem>
      <FlexItem>{editButton}</FlexItem>
    </Flex>
  );

  return tooltipContent ? (
    <Tooltip content={tooltipContent}>
      <span style={{ display: 'inline-block' }}>{content}</span>
    </Tooltip>
  ) : (
    content
  );
};

export default React.memo(ComponentImageRepositoryVisibility);
