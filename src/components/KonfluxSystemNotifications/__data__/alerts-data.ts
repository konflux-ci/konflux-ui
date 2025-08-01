import { KONFLUX_INFO_NAMESPACE } from '~/consts/constants';
import { ConfigMap } from '~/types/configmap';
import { MAX_ALERT_SUMMARY_LENGTH } from '../useSystemNotifications';
export const validWarningAlertsJson = {
  type: 'warning',
  summary: 'warning alert',
  created: '',
};

export const validInfoAlertsJson = {
  type: 'info',
  summary: 'info alert',
  created: '',
};

export const validDangerAlertsJson = {
  type: 'danger',
  summary: 'danger alert',
  created: '',
};

export const validWarningAlertsConfigMap: ConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'test-alert',
    namespace: KONFLUX_INFO_NAMESPACE,
    labels: {
      'konflux.system.alert': 'true',
    },
  },
  data: {
    'alert-content.json': JSON.stringify(validWarningAlertsJson),
  },
};

export const validInfoAlertsConfigMap: ConfigMap = {
  ...validWarningAlertsConfigMap,
  data: {
    'alert-content.json': JSON.stringify(validInfoAlertsJson),
  },
};

export const validDangerAlertsConfigMap: ConfigMap = {
  ...validWarningAlertsConfigMap,
  data: {
    'alert-content.json': JSON.stringify(validDangerAlertsJson),
  },
};

const longSummary = 'A'.repeat(MAX_ALERT_SUMMARY_LENGTH + 100);
export const validLongSummaryAlertsJson = {
  type: 'info',
  summary: longSummary,
  created: '',
};
export const validLongSummaryAlertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  data: {
    'alert-content.json': JSON.stringify(validLongSummaryAlertsJson),
  },
};

export const invalidDataSystemAlertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  data: {
    'alert-content.json': 'invalid json content',
  },
};

export const invalidTypeSystemAlertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  data: {
    'alert-content.json': JSON.stringify({
      type: 'invalid-type',
      summary: 'This has an invalid type',
    }),
  },
};

export const MissingTypeSystemAlertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  data: {
    'alert-content.json': JSON.stringify({
      summary: 'This has no type',
    }),
  },
};

export const EmptySummarySystemALertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  data: {
    'alert-content.json': JSON.stringify({
      type: 'info',
      summary: '',
    }),
  },
};

export const whitespaceSummarySystemALertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  data: {
    'alert-content.json': JSON.stringify({
      type: 'info',
      summary: '   \n\t   ',
    }),
  },
};

export const missingSummarySystemAlertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  data: {
    'alert-content.json': JSON.stringify({
      type: 'info',
    }),
  },
};

export const noContentSystemAlertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
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

export const firstValidInfoAlertsJson = {
  type: 'info',
  summary: 'old alert',
  created: firstValidCreated,
};

export const secondValidInfoAlertsJson = {
  type: 'info',
  summary: 'latest alert',
  created: secondValidCreated,
};

export const firstValidInfoAlertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  metadata: {
    ...validInfoAlertsConfigMap.metadata,
    creationTimestamp: firstValidCreated,
    name: 'old one',
  },
  data: {
    'alert-content.json': JSON.stringify(firstValidInfoAlertsJson),
  },
};

export const secondValidInfoAlertsConfigMap: ConfigMap = {
  ...validInfoAlertsConfigMap,
  metadata: {
    ...validInfoAlertsConfigMap.metadata,
    creationTimestamp: secondValidCreated,
    name: 'latest one',
  },
  data: {
    'alert-content.json': JSON.stringify(secondValidInfoAlertsJson),
  },
};
