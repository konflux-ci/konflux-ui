import {
  DEFAULT_IMAGE_PULL_KEY_VALUES,
  DEFAULT_OPAQUE_KEY_VALUES,
  DEFAULT_OPAQUE_LABELS,
} from '~/consts/secrets';
import { BuildTimeSecret, KeyValueEntry, SecretTypeDropdownLabel } from '~/types';
import {
  findExistingOpaqueSecretByName,
  getSupportedPartnerTaskKeyValuePairs,
  isPartnerTask,
  isUsingExistingClusterSecret,
  supportedPartnerTasksSecrets,
} from '~/utils/secrets/secret-utils';

export const getKeyValuesWithoutReadOnlyKeys = (keyValues: KeyValueEntry[]): KeyValueEntry[] => {
  const filtered = keyValues.filter((kv) => !kv.readOnlyKey);
  return filtered.length ? filtered : DEFAULT_OPAQUE_KEY_VALUES;
};

export const getResetKeyValuesForImage = (keyValues: KeyValueEntry[]): KeyValueEntry[] => {
  const userKeys = keyValues.filter((kv) => !kv.readOnlyKey && (!!kv.key || !!kv.value));
  return [...userKeys, ...DEFAULT_IMAGE_PULL_KEY_VALUES];
};

export const getEditableKeyValues = (keyValues: KeyValueEntry[]): KeyValueEntry[] => {
  const source = keyValues.length ? keyValues : DEFAULT_OPAQUE_KEY_VALUES;
  return source.map((kv) => ({
    ...kv,
    readOnlyKey: false,
    readOnlyValue: false,
  }));
};

export const getOpaqueFieldsFromExistingSecret = (
  secretName: string,
  existingSecrets: BuildTimeSecret[],
): { keyValues?: KeyValueEntry[]; labels: KeyValueEntry[] } => {
  if (isPartnerTask(secretName, supportedPartnerTasksSecrets)) {
    if (isUsingExistingClusterSecret(secretName, SecretTypeDropdownLabel.opaque, existingSecrets)) {
      const matched = findExistingOpaqueSecretByName(secretName, existingSecrets);
      return {
        keyValues: matched?.opaque?.keyValuePairs,
        labels: matched?.labels?.length ? matched.labels : DEFAULT_OPAQUE_LABELS,
      };
    }

    return {
      keyValues: [...getSupportedPartnerTaskKeyValuePairs(secretName)],
      labels: DEFAULT_OPAQUE_LABELS,
    };
  }

  const matched = findExistingOpaqueSecretByName(secretName, existingSecrets);
  return {
    keyValues: matched?.opaque?.keyValuePairs,
    labels: matched?.labels?.length ? matched.labels : DEFAULT_OPAQUE_LABELS,
  };
};

export type OpaqueSecretSyncTransition =
  | { action: 'none' }
  | { action: 'populateFromExisting'; secretName: string }
  | { action: 'makeEditable' }
  | { action: 'resetOpaque' };

export const getOpaqueSecretSyncTransition = ({
  previousName,
  currentName,
  currentType,
  existingSecrets,
}: {
  previousName: string;
  currentName: string;
  currentType: string;
  existingSecrets: BuildTimeSecret[];
}): OpaqueSecretSyncTransition => {
  if (currentType !== SecretTypeDropdownLabel.opaque || previousName === currentName) {
    return { action: 'none' };
  }

  const wasUsingExistingCluster = isUsingExistingClusterSecret(
    previousName,
    currentType,
    existingSecrets,
  );

  const isUsingExistingClusterNow = isUsingExistingClusterSecret(
    currentName,
    currentType,
    existingSecrets,
  );

  if (isUsingExistingClusterNow) {
    return { action: 'populateFromExisting', secretName: currentName };
  }

  if (wasUsingExistingCluster) {
    return { action: 'makeEditable' };
  }

  if (
    isPartnerTask(previousName, supportedPartnerTasksSecrets) &&
    !isPartnerTask(currentName, supportedPartnerTasksSecrets)
  ) {
    return { action: 'resetOpaque' };
  }

  return { action: 'none' };
};
