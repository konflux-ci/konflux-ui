import React from 'react';
import { Alert, Button, Flex, FlexItem } from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons/dist/esm/icons';
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
      />
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        gap={{ default: 'gapSm' }}
        className="pf-v5-u-mt-sm"
      >
        <FlexItem>
          {sensitiveFieldsHidden ? 'To show secret values' : 'To hide secret values'}
        </FlexItem>
        <FlexItem>
          <Button
            type="button"
            variant="primary"
            icon={sensitiveFieldsHidden ? <EyeIcon /> : <EyeSlashIcon />}
            aria-label={sensitiveFieldsHidden ? 'Show secret values' : 'Hide secret values'}
            isLoading={sensitive.isLoadingFullSecret}
            onClick={handleToggle}
          >
            {sensitiveFieldsHidden ? 'Show values' : 'Hide values'}
          </Button>
        </FlexItem>
      </Flex>
    </div>
  );
};
