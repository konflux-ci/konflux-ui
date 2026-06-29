import React from 'react';
import { Icon } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useIssueCountsBySeverity } from '~/kite/kite-hooks';

export const IssueNavItemContent: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { counts, isLoaded, error } = useIssueCountsBySeverity(namespace);

  const statusIcon = React.useMemo(() => {
    if (!isLoaded || error) {
      return null;
    }

    const hasCriticalIssues = counts?.critical && counts.critical > 0;
    if (hasCriticalIssues) {
      return (
        <Icon status="danger" data-test="critical-issues-icon">
          <ExclamationCircleIcon />
        </Icon>
      );
    }
    const hasMajorIssues = counts?.major && counts.major > 0;
    if (hasMajorIssues) {
      return (
        <Icon status="warning" data-test="major-issues-icon">
          <ExclamationTriangleIcon />
        </Icon>
      );
    }
    return null;
  }, [isLoaded, error, counts]);

  return (
    <>
      Issues <FeatureFlagIndicator flags={['issues-dashboard']} />
      {statusIcon}
    </>
  );
};
