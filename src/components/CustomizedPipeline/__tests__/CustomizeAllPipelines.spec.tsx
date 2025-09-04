import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import CustomizeAllPipelines from '../CustomizeAllPipelines';

jest.mock('../../../hooks/useApplicationPipelineGitHubApp', () => ({
  useApplicationPipelineGitHubApp: jest.fn(() => ({
    name: 'test-app',
    url: 'https://github.com/test-app',
  })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('../../../hooks/useTektonResults');

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('CustomizeAllPipelines', () => {
  it('should render nothing while loading', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false]);
    const result = render(
      <CustomizeAllPipelines applicationName="" namespace="" modalProps={{ isOpen: true }} />,
    );
    expect(result.baseElement.textContent).toBe('');
  });

  it('should render error state', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true, { code: 400 }]);
    const result = render(
      <CustomizeAllPipelines applicationName="" namespace="" modalProps={{ isOpen: true }} />,
    );
    expect(result.getByText('Unable to load components')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true]);
    const result = render(
      <CustomizeAllPipelines applicationName="" namespace="" modalProps={{ isOpen: true }} />,
    );
    expect(result.getByText('No components')).toBeInTheDocument();
  });

  it('should render modal with components table', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [
        {
          metadata: {
            name: 'my-component',
            annotations: {},
          },
          spec: {
            application: 'test',
            source: {
              git: {
                url: 'https://github.com/org/test',
              },
            },
          },
        },
      ],
      true,
    ]);
    const result = render(
      <CustomizeAllPipelines applicationName="test" namespace="" modalProps={{ isOpen: true }} />,
    );
    expect(result.getByTestId('component-row', { exact: false })).toBeInTheDocument();
  });

  it('should call filter function for each component', () => {
    const component1 = { metadata: { name: 'c1' }, spec: { application: 'test' } };
    const component2 = { metadata: { name: 'c2' }, spec: { application: 'test' } };
    const filter = jest.fn(() => false);
    useK8sWatchResourceMock.mockReturnValue([[component1, component2], true]);
    const result = render(
      <CustomizeAllPipelines
        applicationName="test"
        namespace=""
        filter={filter}
        modalProps={{ isOpen: true }}
      />,
    );

    expect(result.getByText('No components')).toBeInTheDocument();
    expect(result.queryByTestId('component-row', { exact: false })).not.toBeInTheDocument();
    expect(filter).toHaveBeenCalledTimes(2);
    expect(filter).toHaveBeenNthCalledWith(1, component1, expect.anything(), expect.anything());
    expect(filter).toHaveBeenNthCalledWith(2, component2, expect.anything(), expect.anything());
  });
});
