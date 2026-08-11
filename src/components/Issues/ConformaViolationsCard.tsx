import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  AlertVariant,
  Card,
  CardBody,
  CardTitle,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  List,
  ListItem,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_icon_color_status_danger_default as dangerColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_success_default as successColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { t_global_icon_color_status_warning_default as warningColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_warning_default';
import { type AppViolationSummary, useWorkspaceConformaViolations } from '~/components/Issues/useWorkspaceConformaViolations';
import { APPLICATION_CONFORMA_RESULTS_PATH } from '~/routes/paths';
import { LoadingSkeleton } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';

import './ConformaViolationsCard.scss';

type AppListProps = {
  applications: AppViolationSummary[];
  namespace: string;
};

const AppBreakdownList: React.FC<AppListProps> = ({ applications, namespace }) => (
  <List isPlain className="conforma-violations-card__app-list">
    {applications.map(({ applicationName, violationCount, warningCount }) => (
      <ListItem key={applicationName}>
        <Link
          to={APPLICATION_CONFORMA_RESULTS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
          })}
        >
          {applicationName}
        </Link>
        {violationCount > 0 && (
          <span className="conforma-violations-card__badge conforma-violations-card__badge--violation">
            {` — ${violationCount} ${violationCount === 1 ? 'violation' : 'violations'}`}
          </span>
        )}
        {warningCount > 0 && (
          <span className="conforma-violations-card__badge conforma-violations-card__badge--warning">
            {` — ${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}`}
          </span>
        )}
      </ListItem>
    ))}
  </List>
);

export const ConformaViolationsCard: React.FC = () => {
  const namespace = useNamespace();
  const { totalViolations, totalWarnings, applications, loaded, error, partialError } =
    useWorkspaceConformaViolations();

  const hasError = loaded && !!error;
  const hasViolations = totalViolations > 0;
  const hasWarnings = !hasViolations && totalWarnings > 0;
  const hasEvaluatedApps = applications.length > 0;
  const allPassed = loaded && hasEvaluatedApps && !hasViolations && !hasWarnings && !hasError;
  const noData = loaded && !hasEvaluatedApps && !hasError;

  return (
    <Card data-test="conforma-violations-card">
      <CardTitle>Conforma policy results</CardTitle>
      <CardBody>
        {!loaded ? (
          <LoadingSkeleton count={3} height="1.25rem" widths="80%" />
        ) : hasError ? (
          getErrorState(error, loaded, 'policy results', true)
        ) : noData ? (
          <Content component={ContentVariants.p}>
            No policy evaluations found for this workspace.
          </Content>
        ) : allPassed ? (
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <CheckCircleIcon color={successColor.value} />
            </FlexItem>
            <FlexItem>
              <Content component={ContentVariants.p}>All applications passed</Content>
            </FlexItem>
          </Flex>
        ) : (
          <>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              {hasViolations ? (
                <>
                  <FlexItem>
                    <ExclamationCircleIcon color={dangerColor.value} />
                  </FlexItem>
                  <FlexItem>
                    <Content component={ContentVariants.p}>
                      <strong>{totalViolations}</strong>{' '}
                      {totalViolations === 1 ? 'policy violation' : 'policy violations'}
                      {totalWarnings > 0 && (
                        <>, <strong>{totalWarnings}</strong>{' '}
                        {totalWarnings === 1 ? 'warning' : 'warnings'}</>
                      )}
                    </Content>
                  </FlexItem>
                </>
              ) : (
                <>
                  <FlexItem>
                    <ExclamationTriangleIcon color={warningColor.value} />
                  </FlexItem>
                  <FlexItem>
                    <Content component={ContentVariants.p}>
                      <strong>{totalWarnings}</strong>{' '}
                      {totalWarnings === 1 ? 'warning' : 'warnings'}
                    </Content>
                  </FlexItem>
                </>
              )}
            </Flex>
            {applications.length > 0 && (
              <AppBreakdownList applications={applications} namespace={namespace} />
            )}
          </>
        )}
        {partialError ? (
          <Alert
            data-test="conforma-violations-partial-error"
            className="pf-v6-u-mt-md"
            variant={AlertVariant.warning}
            isInline
            title="Some policy results could not be loaded"
          >
            {partialError instanceof Error && partialError.message
              ? partialError.message
              : 'One or more policy result fetches failed. Results shown may be incomplete.'}
          </Alert>
        ) : null}
      </CardBody>
    </Card>
  );
};
