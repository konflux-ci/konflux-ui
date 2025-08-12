import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { ConfigMap } from '~/types/configmap';
export const validWarningNotificationJson = {
  type: 'warning',
  summary: 'warning alert',
  created: '2025-08-10T11:08:17Z',
};

export const validInfoNotificationJson = {
  type: 'info',
  summary: 'info alert',
  created: '2025-08-10T11:08:17Z',
};

export const validDangerNotificationJson = {
  type: 'danger',
  summary: 'danger alert',
  created: '2025-08-10T11:08:17Z',
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
    creationTimestamp: '2025-08-10T11:08:17Z',
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
const firstValidCreated = new Date(now.getTime() - 120 * 60 * 1000).toISOString();
const secondValidCreated = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const thirdValidCreated = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

export const firstValidInfoNotificationJson = {
  title: 'first summary',
  type: 'info',
  summary: 'old alert',
  activeTimestamp: firstValidCreated,
};

export const secondValidInfoNotificationJson = {
  title: 'second summary',
  type: 'info',
  summary: 'newer alert',
  activeTimestamp: secondValidCreated,
};

export const thirdValidDangerNotificationJson = {
  title: 'third summary',
  type: 'danger',
  summary: 'newest alert',
};

export const firstValidInfoNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  metadata: {
    ...validInfoNotificationConfigMap.metadata,
    creationTimestamp: '2025-08-10T11:08:17Z',
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
    creationTimestamp: '2025-08-10T11:08:17Z',
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
    creationTimestamp: thirdValidCreated,
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
    creationTimestamp: '2025-08-10T11:08:17Z',
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

// Future timestamp test data
const futureTimestamp = new Date(Date.now() + 60 * 60 * 1000).toISOString();

export const futureTimestampNotificationJson = {
  type: 'info',
  summary: 'Future notification',
  activeTimestamp: futureTimestamp,
};

export const futureTimestampNotificationConfigMap: ConfigMap = {
  ...validInfoNotificationConfigMap,
  metadata: {
    ...validInfoNotificationConfigMap.metadata,
    name: 'future-notification',
  },
  data: {
    'notification-content.json': JSON.stringify(futureTimestampNotificationJson),
  },
};

// Invalid timestamp test data
export const invalidTimestampNotificationJson = {
  type: 'warning',
  summary: 'Invalid timestamp notification',
  activeTimestamp: 'invalid-date-string',
};

export const invalidTimestampNotificationConfigMap: ConfigMap = {
  ...validWarningNotificationConfigMap,
  metadata: {
    ...validWarningNotificationConfigMap.metadata,
    name: 'invalid-timestamp',
  },
  data: {
    'notification-content.json': JSON.stringify(invalidTimestampNotificationJson),
  },
};

// Missing activeTimestamp test data
export const missingActiveTimestampNotificationJson = {
  type: 'danger',
  summary: 'No activeTimestamp notification',
};

export const missingActiveTimestampNotificationConfigMap: ConfigMap = {
  ...validDangerNotificationConfigMap,
  metadata: {
    ...validDangerNotificationConfigMap.metadata,
    name: 'no-active-timestamp',
    creationTimestamp: '2025-08-10T10:00:00Z',
  },
  data: {
    'notification-content.json': JSON.stringify(missingActiveTimestampNotificationJson),
  },
};
