import * as React from 'react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { Table } from '../../../shared';
import { SecretKind } from '../../../types';
import SecretsListHeader from './SecretsListHeader';
import SecretsListHeaderWithComponents from './SecretsListHeaderWithComponents';
import SecretsListRow from './SecretsListRow';
import SecretsListRowWithComponents from './SecretsListRowWithComponents';

type SecretsListProps = {
  secrets: SecretKind[];
};

const SecretsList: React.FC<React.PropsWithChildren<SecretsListProps>> = ({ secrets }) => {
  const isBuildServiceAccountFeatureOn = useIsOnFeatureFlag('buildServiceAccount');
  const Header = isBuildServiceAccountFeatureOn
    ? SecretsListHeaderWithComponents
    : SecretsListHeader;
  const Row = isBuildServiceAccountFeatureOn ? SecretsListRowWithComponents : SecretsListRow;

  return (
    <>
      <Table
        data={secrets}
        aria-label="Secret List"
        Header={Header}
        Row={Row}
        loaded
        getRowProps={(obj: SecretKind) => ({
          id: obj.metadata.name,
        })}
      />
    </>
  );
};

export default SecretsList;
