import React from 'react';
import { Switch, Stack, StackItem, Button, Label } from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import { FLAGS, FLAGS_STATUS } from './flags';
import { useFeatureFlags } from './hooks';
import { FeatureFlagsStore } from './store';

export const FeatureFlagPanel: React.FC = () => {
  const [flags, setFlag] = useFeatureFlags();

  return (
    <Stack hasGutter>
      {Object.values(FLAGS).map(({ key, description, status }) => (
        <StackItem key={key}>
          <Switch
            id={key}
            label={
              <>
                {description}{' '}
                <Label color={status === 'wip' ? 'orange' : 'green'}>{FLAGS_STATUS[status]}</Label>
              </>
            }
            isChecked={flags[key]}
            onChange={(_, checked) => {
              setFlag(key, checked);
            }}
          />
        </StackItem>
      ))}
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
