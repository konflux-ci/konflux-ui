import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  Button,
  ButtonVariant,
  Flex,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { useComponent } from '~/hooks/useComponents';
import { useLinkedSecrets } from '~/hooks/useLinkedSecrets';
import { useSecrets } from '~/hooks/useSecrets';
import { ComponentSelectMenu } from '~/shared/components/component-select-menu/ComponentSelectMenu';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { SecretKind } from '~/types';
import { linkSecretsToComponent } from './link-secret-utils';

type SecretSelectorProps = {
  onClose: () => void;
};

export const SecretSelector: React.FC<React.PropsWithChildren<SecretSelectorProps>> = ({
  onClose,
}) => {
  const namespace = useNamespace();
  const [secrets, secretsLoaded, secretsError] = useSecrets(namespace);
  const [linkedSecretsList, setLinkedSecretsList] = useState<string[]>([]);
  const { componentName } = useParams<RouterParams>();
  const [component, compLoaded, compError] = useComponent(namespace, componentName);
  const [previouslyLinked] = useLinkedSecrets(namespace, componentName);

  const filterUnlinkSecrets = React.useMemo(() => {
    const unlinkedSecrets = secrets?.filter((item) => {
      return !previouslyLinked.find((secret) => secret.metadata.name === item.metadata.name);
    });
    return unlinkedSecrets?.map((item) => item?.metadata?.name);
  }, [secrets, previouslyLinked]);

  const handleSubmit = () => {
    const secretsToBeLinked: SecretKind[] = linkedSecretsList?.map((item) => {
      return secrets.find((i) => item === i.metadata.name);
    });
    linkSecretsToComponent(secretsToBeLinked, component);
    onClose();
  };

  if (!compLoaded || !secretsLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (compError) {
    return getErrorState(compError, compLoaded, 'component');
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
              defaultToggleText="Selecting"
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
        <StackItem>
          <Flex>
            <Button onClick={handleSubmit} isDisabled={linkedSecretsList.length === 0}>
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
