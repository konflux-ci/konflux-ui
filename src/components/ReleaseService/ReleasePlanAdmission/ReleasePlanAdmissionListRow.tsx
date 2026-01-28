import * as React from 'react';
import { Link } from 'react-router-dom';
import { capitalize } from '@patternfly/react-core';
import { APPLICATION_DETAILS_PATH } from '../../../routes/paths';
import { TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import TruncatedLinkListWithPopover from '../../../shared/components/truncated-link-list-with-popover/TruncatedLinkListWithPopover';
import { ReleasePlanAdmissionKind } from '../../../types/release-plan-admission';
import { useReleasePlanAdmissionActions } from './releaseplanadmission-actions';
import { releasesPlanAdmissionTableColumnClasses } from './ReleasePlanAdmissionListHeader';

export interface ReleasePlanAdmissionRowProps {
  obj: ReleasePlanAdmissionKind;
  customData: { namespace: string };
}

const ReleasePlanAdmissionListRow: React.FC<ReleasePlanAdmissionRowProps> = ({
  obj,
  customData: { namespace },
}) => {
  const actions = useReleasePlanAdmissionActions(obj);

  const getApplicationLink = React.useCallback(
    (applicationName: string) => (
      <Link
        key={applicationName}
        to={APPLICATION_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName,
        })}
      >
        {applicationName.trim()}
      </Link>
    ),
    [namespace],
  );

  return (
    <>
      <TableData className={releasesPlanAdmissionTableColumnClasses.name}>
        {obj.metadata.name}
      </TableData>
      <TableData className={releasesPlanAdmissionTableColumnClasses.application}>
        <TruncatedLinkListWithPopover
          items={obj.spec.applications ?? []}
          renderItem={getApplicationLink}
          popover={{
            header: 'More applications',
            ariaLabel: 'More applications',
            moreText: (count: number) => `${count} more`,
            dataTestIdPrefix: 'more-applications-popover',
          }}
        />
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
