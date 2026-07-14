import { render, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { runStatus } from '~/consts/pipelinerun';
import { TaskRunKind } from '../../../../../types';
import TaskRunDetails from '../TaskRunDetails';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

describe('TaskRunDetails', () => {
  it('should handle skipped tasks', () => {
    const { container } = render(<TaskRunDetails status={runStatus.Skipped} />);
    expect(container).toHaveTextContent('This task was skipped.');
    expect(container).not.toHaveTextContent('Description');
  });

  it('should not display description for whitespace-only skipped task descriptions', () => {
    const { container } = render(
      <TaskRunDetails status={runStatus.Skipped} description="   " />,
    );
    expect(container).toHaveTextContent('This task was skipped.');
    expect(container).not.toHaveTextContent('Description');
  });

  it('should display pipeline task description for skipped tasks', () => {
    const result = render(
      <TaskRunDetails
        status={runStatus.Skipped}
        description="Reserve a Konflux EaaS namespace and kubeconfig secret."
      />,
    );
    expect(result.getByText('This task was skipped.')).toBeInTheDocument();
    expect(result.getByText('Description')).toBeInTheDocument();
    expect(
      result.getByText('Reserve a Konflux EaaS namespace and kubeconfig secret.'),
    ).toBeInTheDocument();
  });

  it('should display task description', () => {
    const result = render(
      <TaskRunDetails
        status={runStatus.Running}
        taskRun={
          {
            apiVersion: 'tekton.dev/v1',
            status: { taskSpec: { description: 'test' } },
          } as TaskRunKind
        }
      />,
    );
    expect(result.queryByText('Description')).toBeInTheDocument();
    expect(result.queryByText('test')).toBeInTheDocument();
  });

  it('should display pipeline task description for idle tasks without a TaskRun', () => {
    const result = render(
      <TaskRunDetails
        status={runStatus.Idle}
        description="Create an ephemeral OpenShift cluster on AWS HyperShift."
      />,
    );
    expect(result.getByText('Description')).toBeInTheDocument();
    expect(result.getByText('Create an ephemeral OpenShift cluster on AWS HyperShift.')).toBeInTheDocument();
  });

  it('should prefer TaskRun taskSpec description over pipeline task description', () => {
    const result = render(
      <TaskRunDetails
        status={runStatus.Running}
        description="Pipeline task description"
        taskRun={
          {
            apiVersion: 'tekton.dev/v1',
            status: { taskSpec: { description: 'Resolved task description' } },
          } as TaskRunKind
        }
      />,
    );
    expect(result.getByText('Resolved task description')).toBeInTheDocument();
    expect(result.queryByText('Pipeline task description')).not.toBeInTheDocument();
  });

  it('should display dash when idle task has no pipeline task description', () => {
    const result = render(<TaskRunDetails status={runStatus.Idle} />);
    const descriptionGroup = result.getByText('Description').closest('.pf-v5-c-description-list__group');
    expect(descriptionGroup).not.toBeNull();
    expect(within(descriptionGroup as HTMLElement).getByText('-')).toBeInTheDocument();
  });

  it('should display task results', () => {
    const result = render(
      <TaskRunDetails
        status={runStatus.Succeeded}
        taskRun={
          {
            apiVersion: 'tekton.dev/v1',
            status: {
              startTime: '2023-03-15T20:12:55Z',
              completionTime: '2023-03-15T20:13:13Z',
              results: [{ name: 'test-name', value: 'test-value' }],
            },
          } as TaskRunKind
        }
      />,
    );
    expect(result.queryByText('Started')).toBeInTheDocument();
    expect(result.queryByText('Duration')).toBeInTheDocument();
    expect(result.queryByText('18 seconds')).toBeInTheDocument();
    expect(result.queryByText('Results')).toBeInTheDocument();
    expect(result.queryByText('test-name')).toBeInTheDocument();
    expect(result.queryByText('test-value')).toBeInTheDocument();
    expect(result.container).not.toHaveTextContent('Fixable vulnerabilities scan');
  });

  it('should render task run vulnerabilities scan results', () => {
    const { container } = render(
      <TaskRunDetails
        status={runStatus.Succeeded}
        taskRun={
          {
            apiVersion: 'tekton.dev/v1',
            metadata: {
              labels: {
                'tekton.dev/pipelineTask': 'clair-scan',
              },
            },
            status: {
              results: [
                {
                  name: 'CLAIR_SCAN_RESULTS',
                  value: '{"vulnerabilities":{"critical":0,"high":0,"medium":1,"low":0}}',
                },
              ],
            },
          } as unknown as TaskRunKind
        }
      />,
    );
    expect(container).toHaveTextContent('Fixable vulnerabilities scan');
  });

  it('should render RunParamsList when spec params are available', () => {
    const result = render(
      <TaskRunDetails
        status={runStatus.Succeeded}
        taskRun={
          {
            apiVersion: 'tekton.dev/v1',
            spec: {
              params: [
                { name: 'param1', value: 'value1' },
                { name: 'param2', value: 'value2' },
              ],
            },
            status: {
              startTime: '2023-03-15T20:12:55Z',
              completionTime: '2023-03-15T20:13:13Z',
            },
          } as TaskRunKind
        }
      />,
    );
    expect(result.getByTestId('run-params-list')).toBeInTheDocument();
    expect(result.getByText('Parameters')).toBeInTheDocument();
    expect(result.getByText('param1')).toBeInTheDocument();
    expect(result.getByText('value1')).toBeInTheDocument();
    expect(result.getByText('param2')).toBeInTheDocument();
    expect(result.getByText('value2')).toBeInTheDocument();
  });

  it('should not render RunParamsList when spec params are not available', () => {
    const result = render(
      <TaskRunDetails
        status={runStatus.Succeeded}
        taskRun={
          {
            apiVersion: 'tekton.dev/v1',
            status: {
              startTime: '2023-03-15T20:12:55Z',
              completionTime: '2023-03-15T20:13:13Z',
            },
          } as TaskRunKind
        }
      />,
    );
    expect(result.queryByTestId('run-params-list')).not.toBeInTheDocument();
  });

  it('should not render RunParamsList when spec params array is empty', () => {
    const result = render(
      <TaskRunDetails
        status={runStatus.Succeeded}
        taskRun={
          {
            apiVersion: 'tekton.dev/v1',
            spec: {
              params: [],
            },
            status: {
              startTime: '2023-03-15T20:12:55Z',
              completionTime: '2023-03-15T20:13:13Z',
            },
          } as TaskRunKind
        }
      />,
    );
    expect(result.queryByTestId('run-params-list')).not.toBeInTheDocument();
  });
});
