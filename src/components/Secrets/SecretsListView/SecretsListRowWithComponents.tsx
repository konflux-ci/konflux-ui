import * as React from 'react';
import { Label, Spinner } from '@patternfly/react-core';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { SecretKind } from '../../../types/secret';
import { useSecretActions } from '../secret-actions';
import { getSecretRowLabels, getSecretTypetoLabel } from '../utils/secret-utils';
import { isLinkableSecret } from '../utils/service-account-utils';
import { secretsTableColumnClasses } from './SecretsListHeaderWithComponents';

type SecretsListRowProps = RowFunctionArgs<SecretKind>;

export enum RemoteSecretStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
}

const SecretsListRowWithComponents: React.FC<React.PropsWithChildren<SecretsListRowProps>> = ({
  obj,
}) => {
  const actions = useSecretActions(obj);

  const { secretLabels } = getSecretRowLabels(obj);
  const labels =
    secretLabels !== '-'
      ? secretLabels.split(', ').map((s) => <Label key={s}>{s}</Label>)
      : secretLabels;

  const { data: linkedServiceAccounts = [], isLoading, isError } = useLinkedServiceAccounts(obj);

  return (
    <>
      <TableData className={secretsTableColumnClasses.secretType}>
        {getSecretTypetoLabel(obj) ?? '-'}
      </TableData>
      <TableData className={secretsTableColumnClasses.name}>{obj.metadata?.name}</TableData>
      <TableData className={secretsTableColumnClasses.components}>
        {isLoading ? (
          // We do not need the Bullseye here to force the spinner in the middle of the column.
          // There is just one number for loading. It would be better to keep it align-left.
          <Spinner size="lg" />
        ) : isError ? (
          <div data-test="components-error">Error</div>
        ) : (
          // For those unlinkable secrets like token, the components are meaningless.
          // In this case, we just show '-'.
          <div data-test="components-count">
            {!isLinkableSecret(obj) ? '-' : linkedServiceAccounts.length}
          </div>
        )}
      </TableData>
      <TableData className={secretsTableColumnClasses.labels}>{labels}</TableData>
      <TableData className={secretsTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SecretsListRowWithComponents;
