import React from 'react';
import { Alert, AlertActionLink, Spinner } from '@patternfly/react-core';
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

  const isLoadingReveal = sensitive.isLoadingFullSecret && sensitiveFieldsHidden;

  const actionLabel = isLoadingReveal
    ? 'Loading...'
    : sensitiveFieldsHidden
      ? 'Show values'
      : 'Hide values';

  const title = isLoadingReveal
    ? 'Loading sensitive values...'
    : sensitiveFieldsHidden
      ? 'Sensitive values are hidden'
      : 'Sensitive values are visible';

  const handleToggle = () => {
    if (isLoadingReveal) {
      return;
    }
    if (sensitiveFieldsHidden) {
      void onReveal();
      return;
    }
    sensitive.clearFullSecretAndSensitiveFields();
  };

  return (
    <Alert
      variant="info"
      isInline
      title={title}
      className="pf-v5-u-mb-md"
      actionLinks={
        <AlertActionLink onClick={handleToggle} isDisabled={isLoadingReveal}>
          {actionLabel}
        </AlertActionLink>
      }
    >
      {isLoadingReveal ? (
        <>
          <Spinner size="sm" className="pf-v5-u-mr-sm" aria-label="Loading secret values" />
          Loading secret values from the cluster.
        </>
      ) : (
        <>
          For security, secret values are hidden by default. Click &quot;{actionLabel}&quot; to
          toggle visibility.
        </>
      )}
    </Alert>
  );
};
