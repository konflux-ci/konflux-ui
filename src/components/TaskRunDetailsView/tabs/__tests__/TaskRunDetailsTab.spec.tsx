import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { configure, render, screen } from '@testing-library/react';
import { useK8sWatchResource } from '../../../../k8s';
import TaskRunDetailsTab from '../TaskRunDetailsTab';

jest.mock('../../../../k8s', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('../../../../utils/workspace-context-utils', () => ({
  useWorkspaceInfo: jest.fn(() => ({ namespace: 'test-ns', workspace: 'test-ws' })),
}));

jest.mock('../../../topology/factories/VisualizationFactory', () => () => <div />);

configure({ testIdAttribute: 'data-test' });

const watchResourceMock = useK8sWatchResource as jest.Mock;

describe('TaskRunDetailsTab', () => {
  it('should render the taskrun details tab', () => {
    watchResourceMock.mockReturnValue([[], true]);
    render(<TaskRunDetailsTab />, {
      wrapper: BrowserRouter,
    });
    expect(screen.queryByText('Task run details')).toBeInTheDocument();
  });

  it('should render the taskrun details tab for embeddedt taskrun', () => {
    watchResourceMock.mockReturnValue([[], true]);
    render(<TaskRunDetailsTab />, {
      wrapper: BrowserRouter,
    });
    expect(screen.queryByText('Task run details')).toBeInTheDocument();
  });

  it('should render the taskrun and task name and description', () => {
    watchResourceMock.mockReturnValue([[], true]);
    render(<TaskRunDetailsTab />, {
      wrapper: BrowserRouter,
    });
    expect(screen.queryByText('example')).toBeInTheDocument();
    expect(screen.queryByText('example-task')).toBeInTheDocument();
    expect(screen.queryByText('Task description goes here.')).toBeInTheDocument();
  });

  it('should render the plr link', () => {
    watchResourceMock.mockReturnValue([[], true]);
    render(<TaskRunDetailsTab />, {
      wrapper: BrowserRouter,
    });
    expect(screen.queryByRole('link', { name: /example-pipelinerun/ })).toBeInTheDocument();
  });

  it('should render application link', () => {
    watchResourceMock.mockReturnValue([[], true]);
    render(<TaskRunDetailsTab />, {
      wrapper: BrowserRouter,
    });
    expect(screen.queryByRole('link', { name: /example-app/ })).toBeInTheDocument();
  });

  it('should render log link', () => {
    watchResourceMock.mockReturnValue([[], true]);
    render(<TaskRunDetailsTab />, {
      wrapper: BrowserRouter,
    });
    expect(screen.queryByRole('link', { name: /logs/ })).toBeInTheDocument();
  });

  it('should render results', () => {
    watchResourceMock.mockReturnValue([[], true]);
    render(<TaskRunDetailsTab />, {
      wrapper: BrowserRouter,
    });
    expect(screen.queryByText('Results')).toBeInTheDocument();
    expect(screen.queryByText('resultName')).toBeInTheDocument();
    expect(screen.queryByText('resultValue')).toBeInTheDocument();
  });
});
