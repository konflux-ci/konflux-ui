import * as React from 'react';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { OutlinedClockIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-clock-icon';
import { t_global_icon_color_subtle as subtleColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_subtle';
import { useMockWorkspaceConformaViolations } from '~/components/Conforma/__data__/mockConformaResults';
import { ConformaSummaryBarSection } from '~/components/Conforma/ConformaResultsTab/ConformaSummaryBarSection';
import {
  countExceptionsByKind,
  PolicyExceptionKind,
} from '~/components/Conforma/policy-exception-utils';
import { PolicyExceptionList } from '~/components/Conforma/PolicyExceptionList';
import { LoadingSkeleton } from '~/shared';
import { WarningIcon } from '~/shared/components/status/icons';
import { getErrorState } from '~/shared/utils/error-utils';
// import { useWorkspaceConformaViolations } from './useWorkspaceConformaViolations';

const IssuesPolicyExceptionCard: React.FC = () => {
  // TODO: restore the live hook once policy exception data is available from the
  // cluster — mock data is wired up meanwhile so the card can be previewed.
  // const { exceptions, loaded, settling, error } = useWorkspaceConformaViolations();
  const { exceptions, loaded, settling, error } = useMockWorkspaceConformaViolations();

  // While settling, keep the skeleton until at least one exception arrives so
  // the summary never flashes a premature "0 expiring exceptions".
  const showSkeleton = !loaded || (settling && exceptions.length === 0);

  return (
    <Card data-test="issues-policy-exception-card">
      <CardTitle>
        <WarningIcon data-test="warning-icon" /> ECP Policy Warnings
      </CardTitle>
      <CardBody>
        {error ? (
          getErrorState(error, loaded, 'policy results', true)
        ) : showSkeleton ? (
          <LoadingSkeleton count={3} height="1.25rem" widths="80%" />
        ) : (
          <>
            <ConformaSummaryBarSection
              title="Upcoming policy changes"
              data-test="policy-exception-summary"
              items={[
                {
                  icon: <WarningIcon />,
                  count: countExceptionsByKind(exceptions, PolicyExceptionKind.EXPIRING),
                  label: 'expiring exceptions',
                  tooltip: 'Policy exceptions that lapse soon, after which the rule is enforced',
                },
                {
                  icon: <OutlinedClockIcon color={subtleColor.value} />,
                  count: countExceptionsByKind(exceptions, PolicyExceptionKind.UPCOMING),
                  label: 'upcoming activations',
                  tooltip: 'Policy rules that start being enforced on a future date',
                },
              ]}
            />
            <PolicyExceptionList exceptions={exceptions} className="pf-v6-u-mt-md" />
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default IssuesPolicyExceptionCard;
