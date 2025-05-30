import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { useComponent } from '~/hooks/useComponents';
import { useSecrets } from '~/hooks/useSecrets';
import { ComponentSelectMenu } from '~/shared/components/component-select-menu/ComponentSelectMenu';
import { useNamespace } from '~/shared/providers/Namespace';
import { ComponentKind, SecretKind } from '~/types';
import { linkSecretsToComponent } from './link-secret-utils';

type SecretSelectorProps = {
  onClose: () => void;
};

export const SecretSelector: React.FC<React.PropsWithChildren<SecretSelectorProps>> = ({
  onClose,
}) => {
  const namespace = useNamespace();
  const secrets: SecretKind[] = useSecrets(namespace)[0];
  const secretOptions: string[] = secrets?.map((item) => item?.metadata?.name);
  const [linkedSecretsList, setLinkedSecretsList] = useState<string[]>([]);

  const { componentName } = useParams<RouterParams>();
  const component: ComponentKind = useComponent(namespace, componentName)[0];

  const linkedSecrets = (value: string[]) => {
    setLinkedSecretsList(value);
  };

  const handleSubmit = () => {
    const secretsTobeLinked: SecretKind[] = linkedSecretsList?.map((item) => {
      return secrets.find((i) => item === i.metadata.name);
    });
    linkSecretsToComponent(secretsTobeLinked, component);
    onClose();
  };

  return (
    <div className="labeled-dropdown-field">
      <div className="title">Select Secrets:</div>
      <div className="component-select-menu" data-test="secret-select-menu">
        <ComponentSelectMenu
          defaultToggleText="Selecting"
          selectedToggleText="Secrets"
          name="relatedSecrets"
          options={secretOptions}
          isMulti={true}
          includeSelectAll={true}
          linkedSecrets={linkedSecrets}
          searchInputPlaceholder={'Search secrets...'}
        />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Button onClick={() => handleSubmit()} isDisabled={linkedSecretsList.length === 0}>
          Link Secrets
        </Button>
        <Button variant={ButtonVariant.link} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
