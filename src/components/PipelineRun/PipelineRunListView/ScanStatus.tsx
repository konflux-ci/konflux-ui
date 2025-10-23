import React from 'react';
import { Skeleton } from '@patternfly/react-core';
import { ScanResults } from '../../../hooks/useScanResults';
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

  return <ScanDetailStatus data-test="scan-status" scanResults={scanResults} condensed />;
};
