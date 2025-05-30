import * as React from 'react';
import { TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { SecretKind } from '../../../types/secret';
import { useSecretActions } from '../secret-actions';
import { getSecretRowLabels, getSecretTypetoLabel } from '../utils/secret-utils';
import { SecretLabels } from './SecretLabels';
import { secretsTableColumnClasses } from './SecretsListHeader';

import './SecretsListRow.scss';

export type SecretsListRowProps = {
  obj: SecretKind;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

export enum RemoteSecretStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
}

const SecretsListRow: React.FC<React.PropsWithChildren<SecretsListRowProps>> = ({
  obj,
  isExpanded = false,
  onToggleExpand = () => {},
}) => {
  const actions = useSecretActions(obj);

  const { secretLabels } = getSecretRowLabels(obj);
  const labels = secretLabels !== '-' ? secretLabels.split(', ') : [secretLabels];

  return (
    <>
      <TableData className={`${secretsTableColumnClasses.secretType} vertical-cell-align`}>
        {getSecretTypetoLabel(obj) ?? '-'}
      </TableData>
      <TableData className={`${secretsTableColumnClasses.name} vertical-cell-align`}>
        {' '}
        {obj.metadata?.name}{' '}
      </TableData>
      <TableData className={`${secretsTableColumnClasses.labels} vertical-cell-align`}>
        <SecretLabels labels={labels} isExpanded={isExpanded} onToggle={onToggleExpand} />
      </TableData>
      <TableData className={`${secretsTableColumnClasses.kebab} vertical-cell-align`}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SecretsListRow;
