import { RunStatus } from '@patternfly/react-topology';
import { runStatus } from '../../utils/pipeline-utils';
import { DEFAULT_CHAR_WIDTH, NODE_ICON_WIDTH, NODE_PADDING } from './const';

export const runStatusToRunStatus = (status: runStatus): RunStatus => {
  switch (status) {
    case runStatus.Succeeded:
      return RunStatus.Succeeded;
    case runStatus.Failed:
      return RunStatus.Failed;
    case runStatus.Running:
      return RunStatus.Running;
    case runStatus['In Progress']:
      return RunStatus.InProgress;
    case runStatus.FailedToStart:
    case runStatus.PipelineNotStarted:
      return RunStatus.FailedToStart;
    case runStatus.Skipped:
      return RunStatus.Skipped;
    case runStatus.Cancelled:
    case runStatus.Cancelling:
    case runStatus.TestFailed:
    case runStatus.TestWarning:
      return RunStatus.Cancelled;
    case runStatus.Pending:
      return RunStatus.Pending;
    case runStatus.Idle:
      return RunStatus.Idle;
    default:
      return RunStatus.Pending;
  }
};

export const getTextWidth = (text: string, font: string = '0.875rem RedHatText'): number => {
  if (!text || text.length === 0) {
    return 0;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext?.('2d');
  if (!context) {
    return text.length * DEFAULT_CHAR_WIDTH;
  }
  context.font = font;
  const { width } = context.measureText(text);

  return width || text.length * DEFAULT_CHAR_WIDTH;
};

export const getLabelWidth = (label: string): number =>
  getTextWidth(label) + NODE_PADDING * 2 + NODE_ICON_WIDTH;
