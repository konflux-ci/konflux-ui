import React from 'react';
import { Switch, Stack, StackItem, Button, Label } from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import HelpTooltipIcon from '~/shared/components/help-tooltip/HelpTooltipIcon';
import { guardSatisfied } from './conditions';
import { FlagKey, FLAGS, FLAGS_STATUS } from './flags';
import { useAllFlagsConditions, useFeatureFlags } from './hooks';
import { FeatureFlagsStore } from './store';

export const FeatureFlagPanel: React.FC = () => {
  const [flags, setFlag] = useFeatureFlags();
  const conditions = useAllFlagsConditions();

  const flagList = Object.values(FLAGS).filter((flag) => {
    if (!flag.guard) return true;
    return guardSatisfied(flag.guard, conditions) || flag.guard.visibleInFeatureFlagPanel;
  });

  if (flagList.length === 0) {
    return <p>No experimental features found.</p>;
  }

  return (
    <Stack hasGutter>
      {flagList.map((flag) => {
        const { key, description, status } = flag;
        const isDisabled = !guardSatisfied(flag.guard, conditions);
        const flagKey = key as FlagKey;

        return (
          <StackItem key={flagKey}>
            <Switch
              id={flagKey}
              label={
                <>
                  {description}{' '}
                  <Label color={status === 'wip' ? 'orange' : 'green'}>{FLAGS_STATUS[status]}</Label>
                  {isDisabled && flag.guard?.failureReason ? (
                    <>
                      {' '}
                      <HelpTooltipIcon content={flag.guard.failureReason} />
                    </>
                  ) : null}
                </>
              }
              isDisabled={isDisabled}
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
      data-test="reset-feature-overrides-button"
    >
      Reset to Defaults
    </Button>,
  ],
});
