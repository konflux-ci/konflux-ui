import * as React from 'react';
import { Card, CardBody, CardTitle, StackItem } from '@patternfly/react-core';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';

const StatusPageCard: React.FC = () => {
  const [konfluxInfo] = useKonfluxPublicInfo();
  const statusPageUrlRaw = konfluxInfo?.status_page_url ?? '';
  const statusPageUrl = statusPageUrlRaw.trim();
  // Only allow http/https URLs
  if (!statusPageUrl || !/^https?:\/\//i.test(statusPageUrl)) {
    return null;
  }

  return (
    <StackItem>
      <Card isLarge>
        <CardTitle>Status Page</CardTitle>
        <CardBody>
          <a href={statusPageUrl} target="_blank" rel="noopener noreferrer">
            View Status Page
          </a>
        </CardBody>
      </Card>
    </StackItem>
  );
};

export default StatusPageCard;
