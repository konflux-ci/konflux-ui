import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { ComponentKind } from '../../../types';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import CustomizeComponentPipeline from '../CustomizeComponentPipeline';

jest.mock('../../../hooks/useApplicationPipelineGitHubApp', () => ({
  useApplicationPipelineGitHubApp: jest.fn(() => ({
    name: 'test-app',
    url: 'https://github.com/test-app',
  })),
}));

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../../hooks/usePipelineRuns', () => ({
  usePipelineRuns: jest.fn(() => [[], true]),
}));

const useK8sWatchResourceMock = createK8sWatchResourceMock();

const mockComponent = {
  metadata: {
    name: `my-component`,
    annotations: {},
  },
  spec: {
    source: {
      git: {
        url: 'https://github.com/org/test',
      },
    },
  },
} as unknown as ComponentKind;

describe('CustomizeAllPipelines', () => {
  it('should render nothing while loading', () => {
    useK8sWatchResourceMock.mockReturnValueOnce([{}, false]);
    const result = render(
      <CustomizeComponentPipeline
        name="my-component"
        namespace="test"
        modalProps={{ isOpen: true }}
      />,
    );
    expect(result.baseElement.textContent).toBe('');
  });

  it('should render modal with components table', () => {
    useK8sWatchResourceMock.mockReturnValue([mockComponent, true]);
    const result = render(
      <CustomizeComponentPipeline
        name="my-component"
        namespace="test"
        modalProps={{ isOpen: true }}
      />,
    );
    expect(result.getByTestId('component-row', { exact: false })).toBeInTheDocument();
  });
});
