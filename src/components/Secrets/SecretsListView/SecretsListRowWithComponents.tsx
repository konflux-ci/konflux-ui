import { Popover, Spinner } from '@patternfly/react-core';
import HelpPopover from '~/components/HelpPopover';
import { LINKING_ERROR_ANNOTATION, LINKING_STATUS_ANNOTATION } from '~/consts/secrets';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { HttpError } from '~/k8s/error';
import { useNamespace } from '~/shared/providers/Namespace';
import { BackgroundJobStatus, useTaskStore } from '~/utils/task-store';
import { TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { useSecretActions } from '../secret-actions';
import { getSecretRowLabels, getSecretTypetoLabel } from '../utils/secret-utils';
import { isLinkableSecret } from '../utils/service-account-utils';
import { SecretLabels } from './SecretLabels';
import { secretsTableColumnClasses } from './SecretsListHeaderWithComponents';
import { SecretsListRowProps } from './SecretsListRow';

const SecretsListRowWithComponents = ({
  obj,
  isExpanded = false,
  onToggleExpand = () => {},
}: SecretsListRowProps) => {
  const actions = useSecretActions(obj);
  const namespace = useNamespace();

  const { secretLabels } = getSecretRowLabels(obj);
  const labels = secretLabels !== '-' ? secretLabels.split(', ') : [secretLabels];

  const task = useTaskStore((state) => state.tasks[obj.metadata.name]);
  const taskError = task?.error ?? obj.metadata?.annotations?.[LINKING_ERROR_ANNOTATION];
  const taskStatus =
    task?.status ??
    obj.metadata?.annotations?.[LINKING_STATUS_ANNOTATION] ??
    BackgroundJobStatus.Succeeded;

  const { linkedServiceAccounts, isLoading, error } = useLinkedServiceAccounts(
    obj.metadata?.namespace || namespace,
    obj,
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
            bodyContent={(error as HttpError)?.message || 'Unknown Error'}
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
        <span>{taskStatus}</span>
        {taskStatus === BackgroundJobStatus.Failed && taskError && (
          <HelpPopover
            headerContent="Error when linking secret"
            bodyContent={<div style={{ whiteSpace: 'pre-line' }}>{taskError}</div>}
          />
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
