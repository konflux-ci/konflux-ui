import { useNavigate } from 'react-router-dom';
import { fireEvent, screen } from '@testing-library/dom';
import { mockPublicImageRepository } from '~/__data__/image-repository-data';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { useComponent } from '~/hooks/useComponents';
import { useImageProxyHost } from '~/hooks/useImageProxyHost';
import { useImageRepository } from '~/hooks/useImageRepository';
import {
  useLatestPushBuildPipelineRunForComponentV2,
  useLatestSuccessfulBuildPipelineRunForComponentV2,
} from '~/hooks/useLatestPushBuildPipeline';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { useAccessReviewForModel } from '~/utils/rbac';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '~/utils/test-utils';
import {
  mockComponent,
  mockLatestSuccessfulBuild,
  mockTaskRuns,
} from '../../__data__/mockComponentDetails';
import ComponentDetailsTab from '../ComponentDetailsTab';

jest.mock('~/components/modal/ModalProvider', () => ({
  ...jest.requireActual('~/components/modal/ModalProvider'),
  useModalLauncher: jest.fn(() => () => {}),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

jest.mock('~/hooks/useLatestPushBuildPipeline', () => ({
  useLatestSuccessfulBuildPipelineRunForComponentV2: jest.fn(),
  useLatestPushBuildPipelineRunForComponentV2: jest.fn(),
}));

jest.mock('~/hooks/useComponents', () => ({
  ...jest.requireActual('~/hooks/useComponents'),
  useComponent: jest.fn(),
}));

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

jest.mock('~/hooks/useImageRepository', () => ({
  useImageRepository: jest.fn(),
}));

jest.mock('~/hooks/useImageProxyHost', () => ({
  useImageProxyHost: jest.fn(),
}));

jest.mock('~/image-controller/conditional-checks', () => ({
  useIsImageControllerEnabled: jest.fn(),
}));

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

const useNavigateMock = useNavigate as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const useLatestSuccessfulBuildPipelineRunForComponentMock =
  useLatestSuccessfulBuildPipelineRunForComponentV2 as jest.Mock;
const useLatestPushBuildPipelineRunForComponentMock =
  useLatestPushBuildPipelineRunForComponentV2 as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;
const useTaskRunsV2Mock = useTaskRunsForPipelineRuns as jest.Mock;
const useImageProxyHostMock = useImageProxyHost as jest.Mock;
const useImageRepositoryMock = useImageRepository as jest.Mock;
const useIsImageControllerEnabledMock = useIsImageControllerEnabled as jest.Mock;
const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
describe('ComponentDetailTab', () => {
  let navigateMock: jest.Mock;
  const showModalMock = jest.fn();

  createUseParamsMock({
    applicationName: 'test-application',
    componentName: 'human-resources',
  });

  beforeEach(() => {
    useComponentMock.mockReturnValue([mockComponent, true]);
    useLatestPushBuildPipelineRunForComponentMock.mockReturnValue([
      mockLatestSuccessfulBuild,
      true,
    ]);
    useLatestSuccessfulBuildPipelineRunForComponentMock.mockReturnValue([
      mockLatestSuccessfulBuild,
      true,
    ]);
    useTaskRunsV2Mock.mockReturnValue([mockTaskRuns, true]);
    useImageProxyHostMock.mockReturnValue([null, true, null]);
    useImageRepositoryMock.mockReturnValue([null, true, null]);
    useIsImageControllerEnabledMock.mockReturnValue({ isImageControllerEnabled: true });
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
    useModalLauncherMock.mockImplementation(() => {
      return showModalMock;
    });
  });

  it('should indicate when there is no container image', () => {
    useComponentMock.mockReturnValue([
      { ...mockComponent, status: { ...mockComponent.status, containerImage: undefined } },
      true,
    ]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.queryByTestId('sbom-test')).toBeNull();
    expect(screen.queryByTestId('build-container-image-test')).toBeNull();
  });

  it('should allow the user to edit the pipeline build plan', () => {
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    const buildPipeline = screen.getByTestId('edit-build-pipeline');
    const editButton = buildPipeline.getElementsByClassName('pf-v5-c-label__content')[0];
    fireEvent.click(editButton);
    expect(showModalMock).toHaveBeenCalled();
  });

  it('should renderWithQueryClientAndRouter Component Nudges dependencies', () => {
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByTestId('component-nudges-dependencies')).toBeInTheDocument();
  });

  it('should not renderWithQueryClientAndRouter Component container image URL', () => {
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.queryByText('Latest image')).not.toBeInTheDocument();
  });

  it('should renderWithQueryClientAndRouter Component container image URL when latest build url not found', () => {
    useComponentMock.mockReturnValue([
      { ...mockComponent, status: { lastPromotedImage: 'test-url', ...mockComponent.status } },
      true,
    ]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('Latest image')).toBeInTheDocument();
    const latestImage = screen.getByTestId('component-latest-image');
    expect(latestImage.children[0].children[0].getAttribute('href')).toBe('https://test-url');
  });

  it('should renderWithQueryClientAndRouter Component latest build image URL when latest build exists', () => {
    useComponentMock.mockReturnValue([
      {
        ...mockComponent,
        status: {
          ...mockComponent.status,
          lastPromotedImage: 'build-container.image.url',
        },
      },
      true,
    ]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('Latest image')).toBeInTheDocument();
    const latestImage = screen.getByTestId('component-latest-image');
    expect(latestImage.children[0].children[0].getAttribute('href')).toBe(
      'https://build-container.image.url',
    );
  });

  it('should not show image repository visibility field when image controller is disabled', () => {
    useIsImageControllerEnabledMock.mockReturnValue({ isImageControllerEnabled: false });
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.queryByText('Image repository visibility')).not.toBeInTheDocument();
  });

  it('should show image repository visibility field even when user has no permissions', () => {
    useIsImageControllerEnabledMock.mockReturnValue({ isImageControllerEnabled: true });
    useAccessReviewForModelMock.mockReturnValue([false, true]);
    useImageRepositoryMock.mockReturnValue([null, true, null]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    // Field should still be visible, but permissions are checked inside ComponentImageRepositoryVisibility
    expect(screen.getByText('Image repository visibility')).toBeInTheDocument();
  });

  it('should show image repository visibility field when image controller is enabled and user has permission', () => {
    useIsImageControllerEnabledMock.mockReturnValue({ isImageControllerEnabled: true });
    useAccessReviewForModelMock.mockReturnValue([true, true]);
    useImageRepositoryMock.mockReturnValue([mockPublicImageRepository, true, null]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('Image repository visibility')).toBeInTheDocument();
  });

  // Note: Image repository fetching tests moved to ComponentImageRepositoryVisibility.spec.tsx
  // since the logic is now inside that component
});
