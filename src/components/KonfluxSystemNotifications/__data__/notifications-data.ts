import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { ConfigMap } from '~/types/configmap';
import { RawNotificationConfig, SystemNotificationConfig } from '~/types/notification-type';
export const validWarningNotificationJson: RawNotificationConfig = {
  type: 'warning',
  summary: 'warning alert',
};

export const validInfoNotificationJson: RawNotificationConfig = {
  type: 'info',
  summary: 'info alert',
};

export const validDangerNotificationJson: RawNotificationConfig = {
  type: 'danger',
  summary: 'danger alert',
};

export const validWarningNotificationConfigMap: ConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'test-notification',
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

export const validWarningNotification: SystemNotificationConfig = {
  ...validWarningNotificationJson,
  title: 'test-notification',
  created: '2025-08-10T11:08:17Z',
};

export const validDangerNotification: SystemNotificationConfig = {
  ...validDangerNotificationJson,
  title: 'test-notification',
  created: '2025-08-10T11:08:17Z',
};

export const validInfoNotification: SystemNotificationConfig = {
  ...validInfoNotificationJson,
  title: 'test-notification',
  created: '2025-08-10T11:08:17Z',
};

export const longSummary = 'A'.repeat(500);
export const validLongSummaryNotificationJson: RawNotificationConfig = {
  type: 'info',
  summary: longSummary,
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
const firstValidCreated = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // two hours ago
const secondValidCreated = new Date(now.getTime() - 59 * 60 * 1000).toISOString(); // 59 minutes agao
const thirdValidCreated = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // 30 minutes agao

export const firstValidInfoNotificationJson: RawNotificationConfig = {
  title: 'first summary',
  type: 'info',
  summary: 'old alert',
  activeTimestamp: firstValidCreated,
};

const { activeTimestamp: firstActive, ...firstRest } = firstValidInfoNotificationJson;
export const firstValidInfoNotification: SystemNotificationConfig = {
  ...firstRest,
  created: firstActive,
};

export const secondValidInfoNotificationJson: RawNotificationConfig = {
  title: 'second summary',
  type: 'info',
  summary: 'newer alert',
  activeTimestamp: secondValidCreated,
};

const { activeTimestamp: secondActive, ...secondRest } = secondValidInfoNotificationJson;
export const secondValidInfoNotification: SystemNotificationConfig = {
  ...secondRest,
  created: secondActive,
};

export const thirdValidDangerNotificationJson: RawNotificationConfig = {
  title: 'third summary',
  type: 'danger',
  summary: 'newest alert',
  activeTimestamp: thirdValidCreated,
};

const { activeTimestamp: thirdActive, ...thirdRest } = thirdValidDangerNotificationJson;
export const thirdValidDangerNotification: SystemNotificationConfig = {
  ...thirdRest,
  created: thirdActive,
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
const futureTimestamp = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // one hour later

export const futureTimestampNotificationJson: RawNotificationConfig = {
  type: 'info',
  summary: 'Future notification',
  activeTimestamp: futureTimestamp,
};

const { activeTimestamp: furtureActive, ...furtureRest } = futureTimestampNotificationJson;
export const furtureValidInfoNotification: SystemNotificationConfig = {
  ...furtureRest,
  created: furtureActive,
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
export const invalidTimestampNotificationJson: RawNotificationConfig = {
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
export const missingActiveTimestampNotificationJson: RawNotificationConfig = {
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
