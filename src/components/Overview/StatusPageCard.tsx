import * as React from 'react';
import { Card, CardBody, CardTitle, StackItem } from '@patternfly/react-core';
import { useKonfluxPublicInfo } from '../../hooks/useKonfluxPublicInfo';

const StatusPageCard: React.FC = () => {
  const [konfluxInfo] = useKonfluxPublicInfo();
  const statusPageUrl = konfluxInfo?.status_page_url || '';

  if (statusPageUrl) {
    return (
      <StackItem>
        <Card isLarge>
          <CardTitle>Status Page</CardTitle>
          <CardBody>
            <a href={`${statusPageUrl}`} target="_blank" rel="noreferrer">
              View Status Page
            </a>
          </CardBody>
        </Card>
      </StackItem>
    );
  }
};

export default StatusPageCard;
