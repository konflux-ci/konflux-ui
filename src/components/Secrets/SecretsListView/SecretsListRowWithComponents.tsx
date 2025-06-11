import { Popover, Spinner } from '@patternfly/react-core';
import HelpPopover from '~/components/HelpPopover';
import { LINKING_ERROR_ANNOTATION, LINKING_STATUS_ANNOTATION } from '~/consts/secrets';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { HttpError } from '~/k8s/error';
import { useNamespace } from '~/shared/providers/Namespace';
import { SecretKind } from '~/types';
import { BackgroundJobStatus, useTaskStore } from '~/utils/task-store';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { useSecretActions } from '../secret-actions';
import { getSecretRowLabels, getSecretTypetoLabel } from '../utils/secret-utils';
import { isLinkableSecret } from '../utils/service-account-utils';
import { SecretLabels } from './SecretLabels';
import { secretsTableColumnClasses } from './SecretsListHeaderWithComponents';

const SecretsListRowWithComponents: React.FC<RowFunctionArgs<SecretKind>> = ({ obj: secret }) => {
  const actions = useSecretActions(secret);
  const namespace = useNamespace();

  const { secretLabels } = getSecretRowLabels(secret);
  const labels = secretLabels !== '-' ? secretLabels.split(', ') : [secretLabels];

  const task = useTaskStore((state) => state.tasks[secret.metadata.name]);
  const taskError = task?.error ?? secret.metadata?.annotations?.[LINKING_ERROR_ANNOTATION];
  const taskStatus =
    task?.status ??
    secret.metadata?.annotations?.[LINKING_STATUS_ANNOTATION] ??
    BackgroundJobStatus.Succeeded;

  const { linkedServiceAccounts, isLoading, error } = useLinkedServiceAccounts(
    secret.metadata?.namespace || namespace,
    secret,
    true,
  );

  return (
    <>
      <TableData className={`${secretsTableColumnClasses.secretType} vertical-cell-align`}>
        {getSecretTypetoLabel(secret) ?? '-'}
      </TableData>
      <TableData className={`${secretsTableColumnClasses.name} vertical-cell-align`}>
        {secret.metadata?.name}
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
            bodyContent={(error as HttpError)?.message || 'Unknown Error'}
          >
            <span>Error</span>
          </Popover>
        ) : !isLinkableSecret(secret) ? (
          '-'
        ) : (
          // The linkedServiceAccounts returns [] or [sa1, sa2...].
          <span>{linkedServiceAccounts.length}</span>
        )}
      </TableData>

      <TableData
        className={`${secretsTableColumnClasses.status} vertical-cell-align`}
        data-test="components-status"
      >
        <span>{taskStatus}</span>
        {taskStatus === BackgroundJobStatus.Failed && taskError && (
          <HelpPopover
            headerContent="Error when linking secret"
            bodyContent={<div style={{ whiteSpace: 'pre-line' }}>{taskError}</div>}
          />
        )}
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

export default SecretsListRowWithComponents;
