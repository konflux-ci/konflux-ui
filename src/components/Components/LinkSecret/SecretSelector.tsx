import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Bullseye,
  Button,
  ButtonVariant,
  Flex,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { useLinkedSecrets } from '~/hooks/useLinkedSecrets';
import { useSecrets } from '~/hooks/useSecrets';
import { ComponentSelectMenu } from '~/shared/components/component-select-menu/ComponentSelectMenu';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { SecretKind } from '~/types';
import { linkSecretsToBuildServiceAccount } from '~/utils/service-account/service-account-utils';

type SecretSelectorProps = {
  onClose: () => void;
};

export const SecretSelector: React.FC<React.PropsWithChildren<SecretSelectorProps>> = ({
  onClose,
}) => {
  const namespace = useNamespace();
  const [secrets, secretsLoaded, secretsError] = useSecrets(namespace, true, {
    metadataOnly: true,
  });
  const [linkedSecretsList, setLinkedSecretsList] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { componentName } = useParams<RouterParams>();
  const [previouslyLinked] = useLinkedSecrets(namespace, componentName);

  const filterUnlinkSecrets = React.useMemo(() => {
    const unlinkedSecrets = secrets?.filter((item) => {
      return !previouslyLinked.find((secret) => secret.metadata.name === item.metadata.name);
    });
    return unlinkedSecrets?.map((item) => item?.metadata?.name);
  }, [secrets, previouslyLinked]);

  const handleSubmit = async () => {
    const secretsToBeLinked: SecretKind[] = linkedSecretsList?.map((item) => {
      return secrets.find((i) => item === i.metadata.name);
    });
    setIsSubmitting(true);
    try {
      await linkSecretsToBuildServiceAccount(secretsToBeLinked, {
        metadata: { name: componentName, namespace },
      });
      onClose();
    } catch (err) {
      setSubmitError((err as Error)?.message || 'Failed to link secrets');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!secretsLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (secretsError) {
    return getErrorState(secretsError, secretsLoaded, 'secrets');
  }

  if (filterUnlinkSecrets.length === 0) return <>No Unlinked Secrets</>;

  return (
    <div className="labeled-dropdown-field">
      <Stack hasGutter>
        <StackItem>
          <div className="title">Select Secrets:</div>
          <div className="component-select-menu" data-test="secret-select-menu">
            <ComponentSelectMenu
              defaultToggleText="Select secrets"
              selectedToggleText="Secrets"
              name="relatedSecrets"
              options={filterUnlinkSecrets}
              isMulti={true}
              includeSelectAll={true}
              linkedSecrets={setLinkedSecretsList}
              entity="secret"
              defaultPlaceholderText="Search secrets..."
              defaultAriaLabel="Search secrets"
            />
          </div>
        </StackItem>
        {submitError && (
          <StackItem>
            <Alert
              variant="danger"
              title="Failed to link secrets"
              isInline
              data-test="link-secrets-error"
            >
              {submitError}
            </Alert>
          </StackItem>
        )}
        <StackItem>
          <Flex>
            <Button
              onClick={handleSubmit}
              isDisabled={linkedSecretsList.length === 0 || isSubmitting}
            >
              Link Secrets
            </Button>
            <Button variant={ButtonVariant.link} onClick={onClose}>
              Cancel
            </Button>
          </Flex>
        </StackItem>
      </Stack>
    </div>
  );
};
