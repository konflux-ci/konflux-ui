import { ApplicationModel, ComponentModel } from '../../models';
import { ApplicationKind, ComponentKind } from '../../types';
import { createDeleteModalLauncher } from './DeleteResourceModal';

export const applicationDeleteModal = (applicationObj: ApplicationKind) =>
  createDeleteModalLauncher(applicationObj.kind)({
    obj: applicationObj,
    model: ApplicationModel,
    displayName: applicationObj.spec.displayName || applicationObj.metadata.name,
    description: (
      <>
        The application{' '}
        <strong>{applicationObj.spec.displayName || applicationObj.metadata.name}</strong>, its
        components, and any related images in namespace{' '}
        <strong>{applicationObj.metadata.namespace}</strong> will be permanently deleted.
      </>
    ),
  });

export const componentDeleteModal = (component: ComponentKind) =>
  createDeleteModalLauncher(component.kind)({
    obj: component,
    model: ComponentModel,
    description: (
      <>
        The component <strong>{component.metadata.name}</strong> and all of its images in namespace{' '}
        <strong>{component.metadata.namespace}</strong> will be permanently deleted.
      </>
    ),
  });
