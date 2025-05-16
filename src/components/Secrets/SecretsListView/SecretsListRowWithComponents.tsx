import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Label,
  Spinner,
  Tooltip,
  TooltipPosition,
} from '@patternfly/react-core';
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
import './SecretsListRowTooltip.scss';

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
      <TableData className={secretsTableColumnClasses.components}>
        <div data-test="components-content">
          {isLoading ? (
            <Spinner size="lg" />
          ) : error ? (
            <Tooltip content={error.message || 'Unknown error'} position={TooltipPosition.rightEnd}>
              <span>Error</span>
            </Tooltip>
          ) : !isLinkableSecret(obj) ? (
            '-'
          ) : (
            // The linkedServiceAccounts returns [] or [sa1, sa2...].
            linkedServiceAccounts.length
          )}
        </div>
      </TableData>
      <TableData className={secretsTableColumnClasses.status}>
        <div data-test="components-status">
          {taskStatus === LinkSecretStatus.Failed ? (
            <Tooltip
              content={
                <div>
                  <Alert
                    isInline
                    variant={AlertVariant.warning}
                    title="Note: This error is only available in this browser."
                  />
                  {taskErrors.length > 0 ? (
                    <ul>
                      {taskErrors.map((line, index) => (
                        <li key={index}>- {line}</li>
                      ))}
                    </ul>
                  ) : (
                    <div>Error details not available.</div>
                  )}
                </div>
              }
              position={TooltipPosition.rightEnd}
            >
              <span>Error</span>
            </Tooltip>
          ) : (
            taskStatus
          )}
        </div>
      </TableData>
      <TableData className={secretsTableColumnClasses.labels}>{labels}</TableData>
      <TableData className={secretsTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SecretsListRowWithComponents;
