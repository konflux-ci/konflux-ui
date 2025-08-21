import React from 'react';
import { Switch, Stack, StackItem, Button, Label } from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import { useUIInstance } from '~/hooks/useUIInstance';
import { FlagKey, FLAGS, FLAGS_STATUS } from './flags';
import { useFeatureFlags } from './hooks';
import { FeatureFlagsStore } from './store';

export const FeatureFlagPanel: React.FC = () => {
  const [flags, setFlag] = useFeatureFlags();
  const currentEnvironment = useUIInstance();

  const flagList = Object.values(FLAGS).filter((flag) => {
    if (!flag.environments) {
      return true;
    }
    return flag.environments.includes(currentEnvironment);
  });

  if (flagList.length === 0) {
    return <p>No experimental features found.</p>;
  }

  return (
    <Stack hasGutter>
      {flagList.map(({ key, description, status }) => {
        const flagKey = key as FlagKey;
        return (
          <StackItem key={flagKey}>
            <Switch
              id={flagKey}
              label={
                <>
                  {description}{' '}
                  <Label color={status === 'wip' ? 'orange' : 'green'}>
                    {FLAGS_STATUS[status]}
                  </Label>
                </>
              }
              isChecked={flags[flagKey]}
              onChange={(_, checked) => {
                setFlag(flagKey, checked);
              }}
            />
          </StackItem>
        );
      })}
    </Stack>
  );
};

export const createFeatureFlagPanelModal = createModalLauncher(FeatureFlagPanel, {
  'data-test': 'feature-flag-panel',
  title: 'Feature Flags',
  variant: 'medium',
  titleIconVariant: FlaskIcon,
  actions: [
    <Button
      key="reset-feature-overrides"
      variant="tertiary"
      onClick={() => {
        FeatureFlagsStore.resetAll();
      }}
    >
      Reset to Defaults
    </Button>,
  ],
});
