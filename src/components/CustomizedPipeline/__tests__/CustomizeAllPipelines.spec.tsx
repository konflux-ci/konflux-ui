import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IMPORT_PATH } from '../../../routes/paths';
import { renderWithQueryClient } from '../../../unit-test-utils/mock-react-query';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import CustomizeAllPipelines from '../CustomizeAllPipelines';

jest.mock('../../../hooks/useApplicationPipelineGitHubApp', () => ({
  useApplicationPipelineGitHubApp: jest.fn(() => ({
    name: 'test-app',
    url: 'https://github.com/test-app',
  })),
}));

jest.mock('react-router-dom', () => ({
  Link: (props) => (
    <a {...props} href={props.to}>
      {props.children}
    </a>
  ),
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
    const result = renderWithQueryClient(
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

  describe('empty state add component action', () => {
    beforeEach(() => {
      useK8sWatchResourceMock.mockReturnValue([[], true]);
    });

    it('should render add component link with import path and application query param', () => {
      render(
        <CustomizeAllPipelines
          applicationName="my-app"
          namespace="test-ns"
          modalProps={{ isOpen: true }}
        />,
      );

      expect(screen.getByRole('link', { name: 'Add component' })).toHaveAttribute(
        'href',
        `${IMPORT_PATH.createPath({ workspaceName: 'test-ns' })}?application=my-app`,
      );
    });

    it('should call onClose when add component is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(
        <CustomizeAllPipelines
          applicationName="my-app"
          namespace="test-ns"
          onClose={onClose}
          modalProps={{ isOpen: true }}
        />,
      );

      await user.click(screen.getByRole('link', { name: 'Add component' }));

      expect(onClose).toHaveBeenCalled();
    });
  });
});
