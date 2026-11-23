import { NudgeConfigKind } from '~/types';

export const mockNudgeConfig: NudgeConfigKind = {
  apiVersion: 'appstudio.redhat.com/v1beta2',
  kind: 'NudgeConfig',
  metadata: { name: 'nudge-config', namespace: 'test-ns' },
  spec: {
    nudges: [
      { from: 'app1', to: 'app2' },
      { from: 'app2', to: 'app3', mode: 'validated' },
      { from: 'app4', to: 'app1', mode: 'immediate' },
    ],
  },
};
