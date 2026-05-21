import React from 'react';
import { Alert, Button, Flex, FlexItem } from '@patternfly/react-core';
import { EyeIcon } from '@patternfly/react-icons/dist/esm/icons';
import { useOptionalSecretEditSensitive } from './SecretEditSensitiveContext';

type SensitiveValuesRevealBannerProps = {
  onReveal: () => void | Promise<void>;
};

export const SensitiveValuesRevealBanner: React.FC<SensitiveValuesRevealBannerProps> = ({
  onReveal,
}) => {
  const sensitive = useOptionalSecretEditSensitive();

  if (!sensitive || sensitive.fullSecret) {
    return null;
  }

  return (
    <div className="pf-v5-u-mb-md">
      <Alert variant="info" isInline title="Sensitive values are hidden" />
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        gap={{ default: 'gapSm' }}
        className="pf-v5-u-mt-sm"
      >
        <FlexItem>To reveal secret values</FlexItem>
        <FlexItem>
          <Button
            type="button"
            variant="primary"
            icon={<EyeIcon />}
            aria-label="Reveal secret values"
            isLoading={sensitive.isLoadingFullSecret}
            onClick={() => void onReveal()}
          >
            Click here
          </Button>
        </FlexItem>
      </Flex>
    </div>
  );
};
