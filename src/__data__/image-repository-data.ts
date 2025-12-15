import { ImageRepositoryKind, ImageRepositoryVisibility } from '../types';

export const mockPublicImageRepository: ImageRepositoryKind = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'ImageRepository',
  metadata: {
    name: 'test-component',
    namespace: 'test-ns',
  },
  spec: {
    image: {
      visibility: ImageRepositoryVisibility.public,
    },
  },
};

export const mockPrivateImageRepository: ImageRepositoryKind = {
  ...mockPublicImageRepository,
  spec: {
    image: {
      visibility: ImageRepositoryVisibility.private,
    },
  },
};

export const mockImageRepositoryWithoutVisibility: ImageRepositoryKind = {
  ...mockPublicImageRepository,
  spec: {
    image: {},
  },
};
