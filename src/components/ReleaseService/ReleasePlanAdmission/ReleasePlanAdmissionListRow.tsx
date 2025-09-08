import * as React from 'react';
import { capitalize } from '@patternfly/react-core';
import { ApplicationKind } from '~/types';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { ReleasePlanAdmissionKind } from '../../../types/release-plan-admission';
import { useReleasePlanAdmissionActions } from './releaseplanadmission-actions';
import { releasesPlanAdmissionTableColumnClasses } from './ReleasePlanAdmissionListHeader';

export type ReleasePlanAdmissionWithApplicationData = ReleasePlanAdmissionKind & {
  application?: ApplicationKind;
};

const ReleasePlanAdmissionListRow: React.FC<
  React.PropsWithChildren<RowFunctionArgs<ReleasePlanAdmissionWithApplicationData>>
> = ({ obj }) => {
  const actions = useReleasePlanAdmissionActions(obj);
  return (
    <>
      <TableData className={releasesPlanAdmissionTableColumnClasses.name}>
        {obj.metadata.name}
      </TableData>
      <TableData className={releasesPlanAdmissionTableColumnClasses.application}>
        {obj.application?.spec?.displayName ?? obj.spec.application ?? '-'}
      </TableData>
      <TableData className={releasesPlanAdmissionTableColumnClasses.source}>
        {obj.spec.origin ?? '-'}
      </TableData>
      <TableData className={releasesPlanAdmissionTableColumnClasses.blockReleases}>
        {capitalize(obj.metadata.labels?.['release.appstudio.openshift.io/block-releases'] ?? '-')}
      </TableData>
      <TableData className={releasesPlanAdmissionTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default ReleasePlanAdmissionListRow;
