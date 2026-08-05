import * as React from 'react';
import { Bullseye, Content, ContentVariants, Flex, Spinner } from '@patternfly/react-core';

const SETTLING_STATUS_FINALIZING = 'Finalizing Conforma results.';
const SETTLING_STATUS_COMPLETE = 'Conforma results finalized.';
const SETTLING_COMPLETE_ANNOUNCEMENT_MS = 2000;

type SettlingAnnouncement = 'idle' | 'finalizing' | 'complete';

type ConformaSettlingAnnouncementProps = {
  settling: boolean;
};

/**
 * Stable live region that announces when Conforma results are finalizing and
 * when that pass completes, then auto-clears the completion message.
 */
export const ConformaSettlingAnnouncement: React.FC<ConformaSettlingAnnouncementProps> = ({
  settling,
}) => {
  const [settlingAnnouncement, setSettlingAnnouncement] =
    React.useState<SettlingAnnouncement>('idle');

  React.useEffect(() => {
    if (settling) {
      setSettlingAnnouncement('finalizing');
      return;
    }
    setSettlingAnnouncement((current) => (current === 'finalizing' ? 'complete' : current));
  }, [settling]);

  React.useEffect(() => {
    if (settlingAnnouncement !== 'complete') return;
    const timer = setTimeout(
      () => setSettlingAnnouncement('idle'),
      SETTLING_COMPLETE_ANNOUNCEMENT_MS,
    );
    return () => clearTimeout(timer);
  }, [settlingAnnouncement]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      data-test="conforma-results-settling-live-region"
      className="conforma-results-tab__settling-live-region"
    >
      {settlingAnnouncement === 'finalizing' ? (
        <Bullseye className="pf-v6-u-mt-md">
          <Flex
            direction={{ default: 'column' }}
            alignItems={{ default: 'alignItemsCenter' }}
            gap={{ default: 'gapSm' }}
          >
            <Spinner size="lg" aria-hidden data-test="conforma-results-settling-spinner" />
            <Content component={ContentVariants.p} data-test="conforma-results-settling-status">
              {SETTLING_STATUS_FINALIZING}
            </Content>
          </Flex>
        </Bullseye>
      ) : settlingAnnouncement === 'complete' ? (
        <Bullseye className="pf-v6-u-mt-md">
          <Content component={ContentVariants.p} data-test="conforma-results-settled-status">
            {SETTLING_STATUS_COMPLETE}
          </Content>
        </Bullseye>
      ) : null}
    </div>
  );
};
