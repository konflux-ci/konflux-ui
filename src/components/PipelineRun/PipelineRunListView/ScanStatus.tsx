import React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { ScanResults } from '../../../utils/scan/scan-utils';
import { ScanDetailStatus } from '../ScanDetailStatus';

export const ScanStatus: React.FC<React.PropsWithChildren<{ scanResults?: ScanResults }>> = ({
  scanResults,
}) => {
  if (scanResults === undefined) {
    return <Skeleton screenreaderText="Loading Vulnerability Scan status" />;
  }

  if (!scanResults?.vulnerabilities) {
    return <>-</>;
  }

  return <ScanDetailStatus scanResults={scanResults} condensed />;
};
