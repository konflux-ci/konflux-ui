import React from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { useSecrets } from '~/hooks/useSecrets';
import { ComponentSelectMenu } from '~/shared/components/component-select-menu/ComponentSelectMenu';
import { useNamespace } from '~/shared/providers/Namespace';
// import { SecretKind } from '~/types';
// import { getLinkedServiceAccounts } from '../Secrets/utils/service-account-utils';

type SecretSelectorProps = {
  linkedSecrets: (data: string[]) => number;
  onClose: () => void;
  handleSubmit: () => void;
};

export const SecretSelector: React.FC = ({
  linkedSecrets,
  onClose,
  handleSubmit,
}: SecretSelectorProps) => {
  const namespace = useNamespace();
  const secrets = useSecrets(namespace)[0]?.map((item) => item?.metadata?.name);
  //   const test:SecretKind=useSecrets(namespace)[0][0];
  const handleClose = () => {
    onClose();
  };

  //   const getData=async ()=>{
  //     const data= await getLinkedServiceAccounts(test);
  //     return data;
  //   }

  //    console.log("API call",getData())

  return (
    <div className="labeled-dropdown-field">
      <div className="title">Select Secrets:</div>
      <div className="component-select-menu" data-test="secret-select-menu">
        <ComponentSelectMenu
          defaultToggleText="Selecting"
          selectedToggleText="Secrets"
          name="relatedSecrets"
          options={secrets}
          isMulti={true}
          includeSelectAll={true}
          linkedSecrets={linkedSecrets}
        />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Button onClick={() => handleSubmit()}>Link Secrets</Button>
        <Button variant={ButtonVariant.link} onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
