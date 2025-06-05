import * as React from 'react';
import { FLAGS } from '~/feature-flags/flags';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { RowFunctionArgs, Table } from '../../../shared';
import { SecretKind } from '../../../types';
import SecretsListHeader from './SecretsListHeader';
import SecretsListHeaderWithComponents from './SecretsListHeaderWithComponents';
import SecretsListRow from './SecretsListRow';
import SecretsListRowWithComponents from './SecretsListRowWithComponents';

type SecretsListProps = {
  secrets: SecretKind[];
};

const SecretsList: React.FC<React.PropsWithChildren<SecretsListProps>> = ({ secrets }) => {
  const isBuildServiceAccountFeatureOn = useIsOnFeatureFlag(FLAGS.buildServiceAccount.key);
  const Header = isBuildServiceAccountFeatureOn
    ? SecretsListHeaderWithComponents
    : SecretsListHeader;
  const Row = isBuildServiceAccountFeatureOn ? SecretsListRowWithComponents : SecretsListRow;
  const [expandedRowIndexes, setExpandedRowIndexes] = React.useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    setExpandedRowIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <>
      <Table
        data={secrets}
        aria-label="Secret List"
        Header={Header}
        Row={(props: RowFunctionArgs<SecretKind>) => {
          const rowIndex = secrets.findIndex((r) => r === props.obj);
          const isExpanded = expandedRowIndexes.has(rowIndex);

          return Row({ obj: props.obj, isExpanded, onToggleExpand: () => toggleRow(rowIndex) });
        }}
        expandedRowIndexes={expandedRowIndexes}
        loaded
        getRowProps={(obj: SecretKind) => ({
          id: obj.metadata.name,
        })}
      />
    </>
  );
};

export default SecretsList;
