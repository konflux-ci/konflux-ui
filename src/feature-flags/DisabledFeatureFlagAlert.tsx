import * as React from 'react';
import { Alert, AlertActionLink, Bullseye } from '@patternfly/react-core';
import type { FlagKey } from './flags';
import { useFeatureFlags } from './hooks';

interface DisabledFeatureFlagAlertProps {
  flag: FlagKey;
  title: React.ReactNode;
  actionLabel: React.ReactNode;
  dataTest?: string;
}

export const DisabledFeatureFlagAlert: React.FC<DisabledFeatureFlagAlertProps> = ({
  flag,
  title,
  actionLabel,
  dataTest,
}: DisabledFeatureFlagAlertProps) => {
  const [, setFlag] = useFeatureFlags();

  return (
    <Bullseye>
      <Alert
        variant="warning"
        data-test={dataTest}
        title={title}
        isInline
        actionLinks={
          <AlertActionLink onClick={() => setFlag(flag, true)}>{actionLabel}</AlertActionLink>
        }
      />
    </Bullseye>
  );
};
