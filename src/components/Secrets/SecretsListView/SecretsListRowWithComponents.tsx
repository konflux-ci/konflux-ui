import * as React from 'react';
import { Button, Label, Popover, Spinner } from '@patternfly/react-core';
import ErrorModal from '~/components/modal/ErrorModal';
import { BackgroundStatusIconWithText } from '~/components/StatusIcon/BackgroundTaskStatusIcon';
import { LINKING_ERROR_ANNOTATION, LINKING_STATUS_ANNOTATION } from '~/consts/secrets';
import { useLinkedServiceAccounts } from '~/hooks/useLinkedServiceAccounts';
import { HttpError } from '~/k8s/error';
import { useNamespace } from '~/shared/providers/Namespace';
import { BackgroundJobStatus, useTaskStore } from '~/utils/task-store';
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

  const [isErrorModalOpen, setIsErrorModalOpen] = React.useState(false);

  const handleErrorModalToggle = () => {
    setIsErrorModalOpen(!isErrorModalOpen);
  };

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
      <TableData className={secretsTableColumnClasses.labels}>{labels}</TableData>
      <TableData className={secretsTableColumnClasses.status} data-test="components-status">
        <BackgroundStatusIconWithText status={taskStatus as BackgroundJobStatus} />
        {taskStatus === BackgroundJobStatus.Failed && taskError && (
          <>
            <Button onClick={handleErrorModalToggle} variant="link" style={{ marginLeft: '4rem' }}>
              View Error
            </Button>
            <ErrorModal
              title="Secert link task failed:"
              errorMessage={taskError}
              isOpen={isErrorModalOpen}
              onClose={handleErrorModalToggle}
            />
          </>
        )}
      </TableData>
      <TableData className={secretsTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SecretsListRowWithComponents;
