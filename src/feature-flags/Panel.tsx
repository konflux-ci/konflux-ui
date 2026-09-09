import React from 'react';
import {
  Switch,
  Stack,
  StackItem,
  Button,
  Label,
  Tooltip,
  Modal,
  ModalBody,
  ModalHeader,
} from '@patternfly/react-core';
import { createRawModalLauncher, RawComponentProps } from '~/components/modal/createModalLauncher';
import { guardSatisfied } from './conditions';
import { FlagKey, FLAGS, FLAGS_STATUS } from './flags';
import { useAllFlagsConditions, useFeatureFlags } from './hooks';
import { FeatureFlagsStore } from './store';
import { useFeatureFlagAnalytics } from './useFeatureFlagAnalytics';

export const FeatureFlagPanel: React.FC<RawComponentProps> = ({ onClose, modalProps }) => {
  const [flags, setFlag] = useFeatureFlags();
  const conditions = useAllFlagsConditions();

  const trackPanelClosed = useFeatureFlagAnalytics(flags);

  const handleClose = (event?: KeyboardEvent | React.MouseEvent) => {
    trackPanelClosed();
    onClose?.(event);
  };

  const flagList = Object.values(FLAGS).filter((flag) => {
    if (!flag.guard) return true;
    return guardSatisfied(flag.guard, conditions) || flag.guard.visibleInFeatureFlagPanel;
  });

  const { title, isOpen, variant, ...restModalProps } = modalProps ?? {};

  return (
    <Modal
      {...restModalProps}
      variant={variant}
      isOpen={isOpen}
      onClose={handleClose}
      data-test="feature-flag-panel"
    >
      <ModalHeader title={title} />
      <ModalBody>
        {flagList.length === 0 ? (
          <p>No experimental features found.</p>
        ) : (
          <Stack hasGutter>
            {flagList.map((flag) => {
              const { key, description, status } = flag;
              const isDisabled = !guardSatisfied(flag.guard, conditions);
              const flagKey = key as FlagKey;

              const switchComponent = (
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
                  isDisabled={isDisabled}
                  isChecked={flags[flagKey]}
                  onChange={(_, checked) => {
                    setFlag(flagKey, checked);
                  }}
                />
              );
              return (
                <StackItem key={flagKey}>
                  {isDisabled && flag.guard?.failureReason ? (
                    <Tooltip content={flag.guard.failureReason}>{switchComponent}</Tooltip>
                  ) : (
                    switchComponent
                  )}
                </StackItem>
              );
            })}
          </Stack>
        )}
        <div className="pf-v6-u-mt-lg">
          <Button
            variant="tertiary"
            onClick={() => {
              FeatureFlagsStore.resetAll();
            }}
            data-test="reset-feature-overrides-button"
          >
            Reset to Defaults
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
};

export const createFeatureFlagPanelModal = createRawModalLauncher(FeatureFlagPanel, {
  'data-test': 'feature-flag-panel',
  title: 'Feature Flags',
  variant: 'medium',
});
