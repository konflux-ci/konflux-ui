import * as React from 'react';
import { Link } from 'react-router-dom';
import { Label, capitalize } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ApplicationKind } from '~/types';
import { getApplicationDisplayName } from '~/utils/common-utils';
import { ReleasePlanColumnKeys } from '../../../consts/release';
import { APPLICATION_DETAILS_PATH } from '../../../routes/paths';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { useNamespace } from '../../../shared/providers/Namespace';
import { ReleasePlanKind, ReleasePlanLabel } from '../../../types/coreBuildService';
import { useReleasePlanActions } from './releaseplan-actions';
import {
  releasesPlanTableColumnClasses,
  getDynamicReleasePlanColumnClasses,
} from './ReleasePlanListHeader';

export type ReleasePlanWithApplicationData = ReleasePlanKind & {
  application?: ApplicationKind;
};

interface ReleasePlanListRowProps
  extends RowFunctionArgs<
    ReleasePlanWithApplicationData,
    { visibleColumns?: Set<ReleasePlanColumnKeys> }
  > {}

const ReleasePlanListRow: React.FC<React.PropsWithChildren<ReleasePlanListRowProps>> = ({
  obj,
  customData,
}) => {
  const visibleColumns = customData?.visibleColumns;
  const actions = useReleasePlanActions(obj);
  const namespace = useNamespace();
  const appDisplayName = getApplicationDisplayName(obj.application) ?? obj.spec?.application;

  const columnClasses = visibleColumns
    ? getDynamicReleasePlanColumnClasses(visibleColumns)
    : releasesPlanTableColumnClasses;

  return (
    <>
      {(!visibleColumns || visibleColumns.has('name')) && (
        <TableData className={columnClasses.name}>{obj.metadata.name}</TableData>
      )}

      {(!visibleColumns || visibleColumns.has('application')) && (
        <TableData className={columnClasses.application}>
          <Link
            to={APPLICATION_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName: obj.spec?.application,
            })}
            title={appDisplayName}
          >
            {appDisplayName}
          </Link>
        </TableData>
      )}

      {(!visibleColumns || visibleColumns.has('target')) && (
        <TableData className={columnClasses.target}>{obj.spec.target ?? '-'}</TableData>
      )}

      {(!visibleColumns || visibleColumns.has('autoRelease')) && (
        <TableData className={columnClasses.autoRelease}>
          {capitalize(obj.metadata.labels?.[ReleasePlanLabel.AUTO_RELEASE] ?? 'false')}
        </TableData>
      )}

      {(!visibleColumns || visibleColumns.has('standingAttribution')) && (
        <TableData className={columnClasses.standingAttribution}>
          {capitalize(obj.metadata.labels?.[ReleasePlanLabel.STANDING_ATTRIBUTION] ?? 'false')}
        </TableData>
      )}

      {(!visibleColumns || visibleColumns.has('status')) && (
        <TableData className={columnClasses.status}>
          {obj.status?.releasePlanAdmission ? (
            <Label variant="outline" color="green" icon={<CheckCircleIcon />}>
              Matched
            </Label>
          ) : (
            <Label variant="outline" color="red" icon={<ExclamationCircleIcon />}>
              Not Matched
            </Label>
          )}
        </TableData>
      )}

      {(!visibleColumns || visibleColumns.has('rpa')) && (
        <TableData className={columnClasses.rpa}>
          {obj.status?.releasePlanAdmission?.name ?? '-'}
        </TableData>
      )}

      <TableData className={columnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default ReleasePlanListRow;
