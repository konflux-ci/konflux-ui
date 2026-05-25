import React from 'react';
import { Alert, AlertActionLink } from '@patternfly/react-core';
import {
  useAreSecretSensitiveFieldsHidden,
  useOptionalSecretEditSensitive,
} from './SecretEditSensitiveContext';

type SensitiveValuesRevealBannerProps = {
  onReveal: () => void | Promise<void>;
};

export const SensitiveValuesRevealBanner: React.FC<SensitiveValuesRevealBannerProps> = ({
  onReveal,
}) => {
  const sensitive = useOptionalSecretEditSensitive();
  const sensitiveFieldsHidden = useAreSecretSensitiveFieldsHidden();

  if (!sensitive) {
    return null;
  }

  const handleToggle = () => {
    if (sensitiveFieldsHidden) {
      void onReveal();
      return;
    }
    sensitive.clearFullSecretAndSensitiveFields();
  };

  return (
    <div className="pf-v5-u-mb-md">
      <Alert
        variant="info"
        isInline
        title={
          sensitiveFieldsHidden ? 'Sensitive values are hidden' : 'Sensitive values are visible'
        }
        actionLinks={
          <AlertActionLink onClick={handleToggle}>
            {sensitiveFieldsHidden ? 'Show values' : 'Hide values'}
          </AlertActionLink>
        }
      >
        For security, secret values are hidden by default. Click &quot;
        {sensitiveFieldsHidden ? 'Show values' : 'Hide values'}&quot; to toggle visibility.
      </Alert>
    </div>
  );
};
