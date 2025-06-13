import * as React from 'react';
import { Table } from '../../../shared';
import { SecretKind } from '../../../types';
import SecretsListHeaderWithComponents from './SecretsListHeaderWithComponents';
import SecretsListRowWithComponents from './SecretsListRowWithComponents';

type SecretsListProps = {
  secrets: SecretKind[];
};

const SecretsList: React.FC<React.PropsWithChildren<SecretsListProps>> = ({ secrets }) => {
  return (
    <Table
      data={secrets}
      aria-label="Secret List"
      Header={SecretsListHeaderWithComponents}
      Row={SecretsListRowWithComponents}
      loaded
      getRowProps={(obj: SecretKind) => ({
        id: obj.metadata.name,
      })}
    />
  );
};

export default SecretsList;
