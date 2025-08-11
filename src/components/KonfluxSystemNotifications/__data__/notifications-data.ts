import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { ConfigMap } from '~/types/configmap';
export const validWarningNotificationJson = {
  type: 'warning',
  summary: 'warning alert',
  created: '',
};

export const validInfoNotificationJson = {
  type: 'info',
  summary: 'info alert',
  created: '',
};

export const validDangerNotificationJson = {
  type: 'danger',
  summary: 'danger alert',
  created: '',
};

export const validWarningNotificationConfigMap: ConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'test-alert',
    namespace: KONFLUX_INFO_NAMESPACE,
    labels: {
      'konflux.system.notification': 'true',
    },
  },
  data: {
    'notification-content.json': JSON.stringify(validWarningNotificationJson),
  },
};

export const validInfoNotificationConfigMap: ConfigMap = {
  ...validWarningNotificationConfigMap,
  data: {
    'notification-content.json': JSON.stringify(validInfoNotificationJson),
  },
};

export const validDangerNotificationConfigMap: ConfigMap = {
  ...validWarningNotificationConfigMap,
  data: {
    'notification-content.json': JSON.stringify(validDangerNotificationJson),
  },
};

export const validWarningNotification = {
  ...validWarningNotificationJson,
  component: validWarningNotificationConfigMap.metadata.name,
  title: '',
};

export const validDangerNotification = {
  ...validDangerNotificationJson,
  component: validDangerNotificationConfigMap.metadata.name,
  title: '',
};

export const validInfoNotification = {
  ...validInfoNotificationJson,
  component: validInfoNotificationConfigMap.metadata.name,
  title: '',
};

export const longSummary = 'A'.repeat(500);
export const validLongSummaryNotificationJson = {
  type: 'info',
  summary: longSummary,
  created: '',
};
export const validLongSummaryNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  data: {
    'notification-content.json': JSON.stringify(validLongSummaryNotificationJson),
  },
};

export const invalidDataNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  data: {
    'notification-content.json': 'invalid json content',
  },
};

export const invalidTypeNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  data: {
    'notification-content.json': JSON.stringify({
      type: 'invalid-type',
      summary: 'This has an invalid type',
    }),
  },
};

export const MissingTypeNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  data: {
    'notification-content.json': JSON.stringify({
      summary: 'This has no type',
    }),
  },
};

export const EmptySummaryNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  data: {
    'notification-content.json': JSON.stringify({
      type: 'info',
      summary: '',
    }),
  },
};

export const whitespaceSummaryNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  data: {
    'notification-content.json': JSON.stringify({
      type: 'info',
      summary: '   \n\t   ',
    }),
  },
};

export const missingSummaryNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  data: {
    'notification-content.json': JSON.stringify({
      type: 'info',
    }),
  },
};

export const noContentNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  data: {
    'other-content.json': JSON.stringify({
      type: 'info',
      summary: 'This is in wrong key',
    }),
  },
};

const now = new Date();
const firstValidCreated = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const secondValidCreated = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
const thirdValidCreated = new Date(now.getTime() + 120 * 60 * 1000).toISOString();

export const firstValidInfoNotificationJson = {
  title: 'first summary',
  type: 'info',
  summary: 'old alert',
  created: firstValidCreated,
};

export const secondValidInfoNotificationJson = {
  title: 'second summary',
  type: 'info',
  summary: 'newer alert',
  created: secondValidCreated,
};

export const thirdValidDangerNotificationJson = {
  title: 'third summary',
  type: 'danger',
  summary: 'newest alert',
  created: thirdValidCreated,
};

export const firstValidInfoNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  metadata: {
    ...validInfoNotificationConfigMap.metadata,
    creationTimestamp: firstValidCreated,
    name: 'old one',
  },
  data: {
    'notification-content.json': JSON.stringify(firstValidInfoNotificationJson),
  },
};

export const secondValidInfoNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  metadata: {
    ...validInfoNotificationConfigMap.metadata,
    creationTimestamp: secondValidCreated,
    name: 'newer one',
  },
  data: {
    'notification-content.json': JSON.stringify(secondValidInfoNotificationJson),
  },
};

export const thirdValidDangerNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  metadata: {
    ...validInfoNotificationConfigMap.metadata,
    creationTimestamp: secondValidCreated,
    name: 'newest one',
  },
  data: {
    'notification-content.json': JSON.stringify(thirdValidDangerNotificationJson),
  },
};

export const mockConfigMapWithArray = {
  ...validInfoNotificationConfigMap,
  metadata: {
    ...validInfoNotificationConfigMap.metadata,
    creationTimestamp: secondValidCreated,
    name: 'mixed one',
  },
  data: {
    'notification-content.json': JSON.stringify([
      firstValidInfoNotificationJson,
      secondValidInfoNotificationJson,
    ]),
  },
};

export const mockConfigMapWithMixedDataInArray = {
  ...mockConfigMapWithArray,
  data: {
    'notification-content.json': JSON.stringify([
      firstValidInfoNotificationJson,
      secondValidInfoNotificationJson,
      JSON.stringify({
        'notification-content.json': 'invalid json content',
      }),
    ]),
  },
};
