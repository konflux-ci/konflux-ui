import * as React from 'react';
import {
  CriticalRiskIcon,
  AngleDoubleDownIcon,
  AngleDoubleUpIcon,
  EqualsIcon,
  UnknownIcon as PFUnknownIcon,
} from '@patternfly/react-icons/dist/esm/icons';
import { global_palette_black_400 as blackColor } from '@patternfly/react-tokens/dist/js/global_palette_black_400';
import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { global_palette_gold_400 as goldColor } from '@patternfly/react-tokens/dist/js/global_palette_gold_400';
import { global_palette_orange_300 as orangeColor } from '@patternfly/react-tokens/dist/js/global_palette_orange_300';
import { global_palette_red_200 as redColor } from '@patternfly/react-tokens/dist/js/global_palette_red_200';
import { ScanResults } from '../../hooks/useScanResults';

import './ScanDetailStatus.scss';

export const CriticalIcon = () => <CriticalRiskIcon title="Critical" color={redColor.value} />;

export const HighIcon = () => <AngleDoubleUpIcon title="High" color={orangeColor.value} />;

export const MediumIcon = () => <EqualsIcon title="Medium" color={goldColor.value} />;

export const LowIcon = () => <AngleDoubleDownIcon title="Low" color={blueColor.value} />;

export const UnknownIcon = () => <PFUnknownIcon title="Unknown" color={blackColor.value} />;

type ScanDetailStatusProps = {
  scanResults: ScanResults;
  condensed?: boolean;
};

export const ScanDetailStatus: React.FC<React.PropsWithChildren<ScanDetailStatusProps>> = ({
  scanResults,
  condensed,
}) => (
  <div className="scan-detail-status">
    <div className="scan-detail-status__severity" data-test="scan-status-critical-test-id">
      <span className="scan-detail-status__severity-status">
        <CriticalIcon />
        {!condensed ? 'Critical' : null}
      </span>
      <span className="scan-detail-status__severity-count">
        {scanResults.vulnerabilities.critical}
      </span>
    </div>
    <div className="scan-detail-status__severity" data-test="scan-status-high-test-id">
      <span className="scan-detail-status__severity-status">
        <HighIcon />
        {!condensed ? 'High' : null}
      </span>
      <span className="scan-detail-status__severity-count">{scanResults.vulnerabilities.high}</span>
    </div>
    <div className="scan-detail-status__severity" data-test="scan-status-medium-test-id">
      <span className="scan-detail-status__severity-status">
        <MediumIcon />
        {!condensed ? 'Medium' : null}
      </span>
      <span className="scan-detail-status__severity-count">
        {scanResults.vulnerabilities.medium}
      </span>
    </div>
    <div className="scan-detail-status__severity" data-test="scan-status-low-test-id">
      <span className="scan-detail-status__severity-status">
        <LowIcon />
        {!condensed ? 'Low' : null}
      </span>
      <span className="scan-detail-status__severity-count">{scanResults.vulnerabilities.low}</span>
    </div>
    <div className="scan-detail-status__severity" data-test="scan-status-unknown-test-id">
      <span className="scan-detail-status__severity-status">
        <UnknownIcon />
        {!condensed ? 'Unknown' : null}
      </span>
      <span className="scan-detail-status__severity-count">
        {scanResults.vulnerabilities.unknown}
      </span>
    </div>
  </div>
);
