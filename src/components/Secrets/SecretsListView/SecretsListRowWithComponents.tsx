import * as React from 'react';
import { Popover, Spinner } from '@patternfly/react-core';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { useNamespace } from '~/shared/providers/Namespace';
import { TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { useSecretActions } from '../secret-actions';
import { getSecretRowLabels, getSecretTypetoLabel } from '../utils/secret-utils';
import { isLinkableSecret } from '../utils/service-account-utils';
import { SecretLabels } from './SecretLabels';
import { secretsTableColumnClasses } from './SecretsListHeaderWithComponents';
import { SecretsListRowProps } from './SecretsListRow';

const SecretsListRowWithComponents: React.FC<React.PropsWithChildren<SecretsListRowProps>> = ({
  obj,
  isExpanded = false,
  onToggleExpand = () => {},
}) => {
  const actions = useSecretActions(obj);
  const namespace = useNamespace();

  const { secretLabels } = getSecretRowLabels(obj);
  const labels = secretLabels !== '-' ? secretLabels.split(', ') : [secretLabels];

  const { linkedServiceAccounts, isLoading, error } = useLinkedServiceAccounts(
    obj.metadata?.namespace || namespace,
    obj.metadata.name,
    true,
  );

  return (
    <>
      <TableData className={`${secretsTableColumnClasses.secretType} vertical-cell-align`}>
        {getSecretTypetoLabel(obj) ?? '-'}
      </TableData>
      <TableData className={`${secretsTableColumnClasses.name} vertical-cell-align`}>
        {obj.metadata?.name}
      </TableData>
      <TableData
        className={`${secretsTableColumnClasses.components} vertical-cell-align`}
        data-test="components-content"
      >
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
      <TableData className={`${secretsTableColumnClasses.labels} vertical-cell-align`}>
        <SecretLabels labels={labels} isExpanded={isExpanded} onToggle={onToggleExpand} />
      </TableData>
      <TableData className={`${secretsTableColumnClasses.kebab} vertical-cell-align`}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SecretsListRowWithComponents;
