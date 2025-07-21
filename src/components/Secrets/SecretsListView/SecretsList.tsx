import * as React from 'react';
import { Table } from '../../../shared';
import { SecretKind } from '../../../types';
import SecretsListHeaderWithComponents from './SecretsListHeaderWithComponents';
import SecretsListRowWithComponents from './SecretsListRowWithComponents';

type SecretsListProps = {
  secrets: SecretKind[];
};

const SecretsList: React.FC<React.PropsWithChildren<SecretsListProps>> = ({ secrets }) => {
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set());

  const handleToggle = (id: number) => {
    const newExpandedIds = new Set(expandedIds);
    if (newExpandedIds.has(id)) {
      newExpandedIds.delete(id);
    } else {
      newExpandedIds.add(id);
    }

    setExpandedIds(newExpandedIds);
  };

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
      customData={{ expandedIds, handleToggle }}
    />
  );
};

export default SecretsList;
