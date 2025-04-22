import * as React from 'react';
import { Label, Popover, Spinner } from '@patternfly/react-core';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { useNamespace } from '~/shared/providers/Namespace';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { SecretKind } from '../../../types/secret';
import { useSecretActions } from '../secret-actions';
import { getSecretRowLabels, getSecretTypetoLabel } from '../utils/secret-utils';
import { isLinkableSecret } from '../utils/service-account-utils';
import { secretsTableColumnClasses } from './SecretsListHeaderWithComponents';

type SecretsListRowProps = RowFunctionArgs<SecretKind>;

const SecretsListRowWithComponents: React.FC<React.PropsWithChildren<SecretsListRowProps>> = ({
  obj,
}) => {
  const actions = useSecretActions(obj);
  const namespace = useNamespace();

  const { secretLabels } = getSecretRowLabels(obj);
  const labels =
    secretLabels !== '-'
      ? secretLabels.split(', ').map((s) => <Label key={s}>{s}</Label>)
      : secretLabels;

  const { linkedServiceAccounts, isLoading, error } = useLinkedServiceAccounts(
    obj.metadata?.namespace || namespace,
    obj.metadata.name,
    true,
  );

  return (
    <>
      <TableData className={secretsTableColumnClasses.secretType}>
        {getSecretTypetoLabel(obj) ?? '-'}
      </TableData>
      <TableData className={secretsTableColumnClasses.name}>{obj.metadata?.name}</TableData>
      <TableData className={secretsTableColumnClasses.components} data-test="components-content">
        {isLoading ? (
          <Spinner size="lg" />
        ) : error ? (
          <Popover
            triggerAction="hover"
            aria-label="Hoverable popover"
            bodyContent={error?.message || 'Unknown Error'}
          >
            <span>Error</span>
          </Popover>
        ) : !isLinkableSecret(obj) ? (
          '-'
        ) : (
          // The linkedServiceAccounts returns [] or [sa1, sa2...].
          <span>{linkedServiceAccounts.length}</span>
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
