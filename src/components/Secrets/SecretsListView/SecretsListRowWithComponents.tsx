import * as React from 'react';
import { Button, Popover, Spinner } from '@patternfly/react-core';
import ErrorModal from '~/components/modal/ErrorModal';
import { BackgroundStatusIconWithText } from '~/components/StatusIcon/BackgroundTaskStatusIcon';
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

import './SecretsListRow.scss';

type SecretsListRowProps = RowFunctionArgs<
  SecretKind,
  { expandedIds: Set<number>; handleToggle: (id: number) => void }
>;

const SecretsListRowWithComponents: React.FC<React.PropsWithChildren<SecretsListRowProps>> = ({
  obj,
  customData,
  index,
}) => {
  const actions = useSecretActions(obj);
  const namespace = useNamespace();
  const { expandedIds, handleToggle } = customData;

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

  const [isErrorModalOpen, setIsErrorModalOpen] = React.useState(false);

  const handleErrorModalToggle = () => {
    setIsErrorModalOpen(!isErrorModalOpen);
  };

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
      <TableData className={`${secretsTableColumnClasses.labels} vertical-cell-align`}>
        <SecretLabels
          labels={labels}
          index={index}
          expanded={expandedIds.has(index)}
          handleToggle={handleToggle}
        />
      </TableData>
      <TableData
        className={`${secretsTableColumnClasses.status} vertical-cell-align`}
        data-test="components-status"
      >
        <BackgroundStatusIconWithText status={taskStatus as BackgroundJobStatus} />
        {taskStatus === BackgroundJobStatus.Failed && taskError && (
          <>
            <Button onClick={handleErrorModalToggle} variant="link" className="error-button">
              View Error
            </Button>
            <ErrorModal
              title="Secret link task failed:"
              errorMessage={taskError}
              isOpen={isErrorModalOpen}
              onClose={handleErrorModalToggle}
            />
          </>
        )}
      </TableData>
      <TableData className={`${secretsTableColumnClasses.kebab} vertical-cell-align`}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default SecretsListRowWithComponents;
