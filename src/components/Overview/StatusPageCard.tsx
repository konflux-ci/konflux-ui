import * as React from 'react';
import { Card, CardBody, CardTitle, StackItem } from '@patternfly/react-core';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import ExternalLink from '~/shared/components/links/ExternalLink';

const StatusPageCard: React.FC = () => {
  let konfluxInfo;
  try {
    [konfluxInfo] = useKonfluxPublicInfo();
  } catch (e) {
    return null;
  }
  const statusPageUrlRaw = konfluxInfo?.statusPageUrl ?? '';
  const statusPageUrl = statusPageUrlRaw.trim() as string;
  // Only allow http/https URLs
  if (!statusPageUrl || !/^https?:\/\//i.test(statusPageUrl)) {
    return null;
  }

  return (
    <StackItem>
      <Card isLarge>
        <CardTitle>Status Page</CardTitle>
        <CardBody>
          <ExternalLink href={statusPageUrl} text="View Status Page" />
        </CardBody>
      </Card>
    </StackItem>
  );
};

export default StatusPageCard;
