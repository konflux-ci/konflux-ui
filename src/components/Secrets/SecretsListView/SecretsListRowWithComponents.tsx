import * as React from 'react';
import { Alert, AlertVariant, Label, Popover, Spinner } from '@patternfly/react-core';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { useNamespace } from '~/shared/providers/Namespace';
import { useTaskStore } from '~/utils/task-store';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { SecretKind } from '../../../types/secret';
import { useSecretActions } from '../secret-actions';
import { getSecretRowLabels, getSecretTypetoLabel } from '../utils/secret-utils';
import { isLinkableSecret } from '../utils/service-account-utils';
import { secretsTableColumnClasses } from './SecretsListHeaderWithComponents';

export enum LinkSecretStatus {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Running = 'Running',
  Pending = 'Pending',
}

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

  const task = useTaskStore((state) => state.tasks[obj.metadata.name]);

  const taskStatus = !task ? LinkSecretStatus.Succeeded : task?.status;

  const taskErrors = task?.error
    ? task.error.split('\n').map((line) => line.replace(/^"(.*)"$/, '$1'))
    : [];

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
      <TableData className={secretsTableColumnClasses.status} data-test="components-status">
        {taskStatus === LinkSecretStatus.Failed ? (
          <Popover
            triggerAction="hover"
            aria-label="Hoverable popover"
            headerContent={
              <Alert
                isInline
                variant={AlertVariant.warning}
                title="This error is only available in this browser."
              />
            }
            bodyContent={
              taskErrors.length > 0 ? (
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  {taskErrors.map((line, index) => (
                    <li key={index}>- {line}</li>
                  ))}
                </ul>
              ) : (
                <div>{error?.message || 'Unknown Error'}</div>
              )
            }
          >
            <span>Error</span>
          </Popover>
        ) : (
          <span>{taskStatus}</span>
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
