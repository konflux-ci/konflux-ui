import * as React from 'react';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { SecretKind } from '../../../types/secret';
import { useSecretActions } from '../secret-actions';
import { getSecretRowLabels, getSecretTypetoLabel } from '../utils/secret-utils';
import { SecretLabels } from './SecretLabels';
import { secretsTableColumnClasses } from './SecretsListHeader';

import './SecretsListRow.scss';

export enum RemoteSecretStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
}

const SecretsListRow: React.FC<RowFunctionArgs<SecretKind>> = ({ obj: secret }) => {
  const actions = useSecretActions(secret);

  const { secretLabels } = getSecretRowLabels(secret);
  const labels = secretLabels !== '-' ? secretLabels.split(', ') : [secretLabels];

  return (
    <>
      <TableData className={`${secretsTableColumnClasses.secretType} vertical-cell-align`}>
        {getSecretTypetoLabel(secret) ?? '-'}
      </TableData>
      <TableData className={`${secretsTableColumnClasses.name} vertical-cell-align`}>
        {' '}
        {secret.metadata?.name}{' '}
      </TableData>
      <TableData className={`${secretsTableColumnClasses.labels} vertical-cell-align`}>
        <SecretLabels labels={labels} />
      </TableData>
      <TableData className={`${secretsTableColumnClasses.kebab} vertical-cell-align`}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SecretsListRow;
