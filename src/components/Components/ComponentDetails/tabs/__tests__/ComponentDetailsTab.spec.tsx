import { useNavigate } from 'react-router-dom';
import { fireEvent, screen } from '@testing-library/dom';
import { mockPublicImageRepository } from '~/__data__/image-repository-data';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { useComponent } from '~/hooks/useComponents';
import { useImageRepository } from '~/hooks/useImageRepository';
import {
  useLatestPushBuildPipelineRunForComponentV2,
  useLatestSuccessfulBuildPipelineRunForComponentV2,
} from '~/hooks/useLatestPushBuildPipeline';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
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

const useNavigateMock = useNavigate as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const useLatestSuccessfulBuildPipelineRunForComponentMock =
  useLatestSuccessfulBuildPipelineRunForComponentV2 as jest.Mock;
const useLatestPushBuildPipelineRunForComponentMock =
  useLatestPushBuildPipelineRunForComponentV2 as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;
const useTaskRunsV2Mock = useTaskRunsForPipelineRuns as jest.Mock;
const useImageRepositoryMock = useImageRepository as jest.Mock;
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
    useImageRepositoryMock.mockReturnValue([null, true, null]);
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
      { ...mockComponent, spec: { containerImage: 'test-url', ...mockComponent.spec } },
      true,
    ]);
    useLatestPushBuildPipelineRunForComponentMock.mockReturnValue([
      {
        ...mockLatestSuccessfulBuild,
        status: {
          results: [
            {
              description: '',
              name: 'IMAGE_URL',
              value: 'build-container.image.url',
            },
          ],
          ...mockLatestSuccessfulBuild.status,
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

  it('should not show image repository visibility field when user has no permission', () => {
    useImageRepositoryMock.mockReturnValue([null, true, { code: 403 }]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.queryByText('Image repository visibility')).not.toBeInTheDocument();
  });

  it('should show image repository visibility field when user has permission', () => {
    useImageRepositoryMock.mockReturnValue([mockPublicImageRepository, true, null]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.getByText('Image repository visibility')).toBeInTheDocument();
  });

  it('should not show image repository visibility field while loading', () => {
    useImageRepositoryMock.mockReturnValue([null, false, null]);
    renderWithQueryClientAndRouter(<ComponentDetailsTab />);
    expect(screen.queryByText('Image repository visibility')).not.toBeInTheDocument();
  });
});
