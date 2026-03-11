import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { sampleBuildPipelines } from '../../../../ApplicationDetails/tabs/overview/visualization/hooks/__data__/workflow-data';
import { SnapshotCreationStatus } from '../SnapshotCreationStatus';

const createPipelineRunWithAnnotation = (annotationValue: string): PipelineRunKind =>
  ({
    ...sampleBuildPipelines[0],
    metadata: {
      ...sampleBuildPipelines[0].metadata,
      annotations: {
        ...sampleBuildPipelines[0].metadata?.annotations,
        [PipelineRunLabel.CREATE_SNAPSHOT_STATUS]: annotationValue,
      },
    },
  }) as PipelineRunKind;

describe('SnapshotCreationStatus', () => {
  describe('when no pipeline run or invalid annotation', () => {
    it('should render nothing when pipelineRun is undefined', () => {
      render(<SnapshotCreationStatus />);

      expect(screen.queryByText('Snapshot creation status')).not.toBeInTheDocument();
    });

    it('should render nothing when pipelineRun has no annotations', () => {
      render(<SnapshotCreationStatus pipelineRun={{ metadata: {} } as PipelineRunKind} />);

      expect(screen.queryByText('Snapshot creation status')).not.toBeInTheDocument();
    });

    it('should render nothing when annotation is empty string', () => {
      render(<SnapshotCreationStatus pipelineRun={createPipelineRunWithAnnotation('')} />);

      expect(screen.queryByText('Snapshot creation status')).not.toBeInTheDocument();
    });

    it('should render nothing when annotation is invalid JSON', () => {
      render(<SnapshotCreationStatus pipelineRun={createPipelineRunWithAnnotation('not-json')} />);

      expect(screen.queryByText('Snapshot creation status')).not.toBeInTheDocument();
    });
  });

  describe('when snapshot status is successful', () => {
    it('should render the term and message as plain text', () => {
      render(
        <SnapshotCreationStatus
          pipelineRun={createPipelineRunWithAnnotation(
            JSON.stringify({ message: 'Snapshot created' }),
          )}
        />,
      );

      expect(screen.getByText('Snapshot creation status')).toBeInTheDocument();
      expect(screen.getByText('Snapshot created')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('when snapshot status is failed', () => {
    it('should render the term and an Alert with the message as title', () => {
      render(
        <SnapshotCreationStatus
          pipelineRun={createPipelineRunWithAnnotation(
            JSON.stringify({ status: 'failed', message: 'Snapshot failed' }),
          )}
        />,
      );

      expect(screen.getByText('Snapshot creation status')).toBeInTheDocument();
      expect(screen.getByText('Snapshot failed')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Snapshot failed/ })).toBeInTheDocument();
    });

    it('should render nothing when status is failed but message is missing', () => {
      render(
        <SnapshotCreationStatus
          pipelineRun={createPipelineRunWithAnnotation(JSON.stringify({ status: 'failed' }))}
        />,
      );

      expect(screen.queryByText('Snapshot creation status')).not.toBeInTheDocument();
    });
  });

  describe('when valid JSON but no message', () => {
    it('should render nothing when annotation has no message', () => {
      render(
        <SnapshotCreationStatus
          pipelineRun={createPipelineRunWithAnnotation(JSON.stringify({}))}
        />,
      );

      expect(screen.queryByText('Snapshot creation status')).not.toBeInTheDocument();
    });

    it('should render nothing when status is success but message is missing', () => {
      render(
        <SnapshotCreationStatus
          pipelineRun={createPipelineRunWithAnnotation(JSON.stringify({ status: 'success' }))}
        />,
      );

      expect(screen.queryByText('Snapshot creation status')).not.toBeInTheDocument();
    });
  });
});
