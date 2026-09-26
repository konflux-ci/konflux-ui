import { PipelineRunEventType } from '~/consts/pipelinerun';
import { getEventTypeLabel, PIPELINE_RUN_EVENT_TYPE_OPTIONS } from '../pipeline-run-filter-utils';

describe('getEventTypeLabel', () => {
  it('should return "Pull Request" for pull_request event with github provider', () => {
    expect(getEventTypeLabel(PipelineRunEventType.PULL, 'github')).toBe('Pull Request');
  });

  it('should return "Merge Request" for pull_request event with gitlab provider', () => {
    expect(getEventTypeLabel(PipelineRunEventType.PULL, 'gitlab')).toBe('Merge Request');
  });

  it('should return "Pull Request" for pull_request event when provider is undefined', () => {
    expect(getEventTypeLabel(PipelineRunEventType.PULL)).toBe('Pull Request');
  });

  it('should return "Push" for push events regardless of provider', () => {
    expect(getEventTypeLabel(PipelineRunEventType.PUSH, 'gitlab')).toBe('Push');
    expect(getEventTypeLabel(PipelineRunEventType.PUSH, 'github')).toBe('Push');
  });

  it('should return "Push" for GitLab Push events', () => {
    expect(getEventTypeLabel(PipelineRunEventType.GITLAB_PUSH, 'gitlab')).toBe('Push');
  });

  it('should return "Test All Comment" for test-all-comment event type', () => {
    expect(getEventTypeLabel(PipelineRunEventType.TEST_ALL_COMMENT)).toBe('Test All Comment');
  });

  it('should humanize unknown event types by replacing hyphens and capitalizing first letter', () => {
    expect(getEventTypeLabel('unknown-event')).toBe('Unknown event');
    expect(getEventTypeLabel('some-new-event')).toBe('Some new event');
  });

  it('should capitalize a single-word unknown event type', () => {
    expect(getEventTypeLabel('group')).toBe('Group');
  });

  it('should return "-" for undefined or empty event types', () => {
    expect(getEventTypeLabel(undefined)).toBe('-');
    expect(getEventTypeLabel('')).toBe('-');
  });
});

describe('PIPELINE_RUN_EVENT_TYPE_OPTIONS', () => {
  it('should not contain duplicate labels', () => {
    const labels = PIPELINE_RUN_EVENT_TYPE_OPTIONS.map((o) => o.label);
    expect(labels).toStrictEqual([...new Set(labels)]);
  });

  it('should contain a single "Push" option that covers both GitHub and GitLab push events', () => {
    const pushOptions = PIPELINE_RUN_EVENT_TYPE_OPTIONS.filter((o) => o.label === 'Push');
    expect(pushOptions).toHaveLength(1);
  });

  it('should contain a "Test All Comment" option', () => {
    const option = PIPELINE_RUN_EVENT_TYPE_OPTIONS.find((o) => o.label === 'Test All Comment');
    expect(option).toBeDefined();
  });

  it('should contain a "Retest All Comment" option', () => {
    const option = PIPELINE_RUN_EVENT_TYPE_OPTIONS.find((o) => o.label === 'Retest All Comment');
    expect(option).toBeDefined();
  });
});
