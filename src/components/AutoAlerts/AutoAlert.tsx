import React from 'react';
import { Banner, Flex, FlexItem, Stack } from '@patternfly/react-core';
import { useAutoAlerts } from '~/hooks/useAutoAlerts';
import { BannerType } from '~/hooks/useBanner';
import { typeToIcon, typeToVariant } from '../konfluxBanner/KonfluxBanner';
import { createModalLauncher, type ComponentProps } from '../modal/createModalLauncher';

const fallbackAlertList = [
  { type: 'info', summary: 'This is an info alert.' },
  { type: 'warning', summary: 'This is a warning alert.' },
  { type: 'danger', summary: 'This is an error alert.' },
  { type: 'danger', summary: 'This is another error alert for testing purpose.' },
  { type: 'info', summary: 'This is another info alert for testing purpose.' },
];

const AutoAlertPanel: React.FC<ComponentProps> = () => {
  const { alerts, isLoading, isError } = useAutoAlerts();

  const effectiveAlerts = !isLoading && !isError && alerts?.length > 0 ? alerts : fallbackAlertList;

  return (
    <Stack hasGutter>
      {effectiveAlerts.map((alert, index) => (
        <Banner
          key={`${alert.type}-${index}`}
          isSticky
          variant={typeToVariant(alert.type as BannerType)}
          data-test="banner"
        >
          <Flex
            alignItems={{ default: 'alignItemsFlexStart' }}
            justifyContent={{ default: 'justifyContentFlexStart' }}
            flexWrap={{ default: 'nowrap' }}
            style={{ width: '100%' }}
          >
            <FlexItem>
              {typeToIcon(alert.type as BannerType)} {alert.summary}
            </FlexItem>
          </Flex>
        </Banner>
      ))}
    </Stack>
  );
};

export const createAutoAlertModal = createModalLauncher(AutoAlertPanel, {
  'data-test': 'auto-alert-panel',
  title: 'Alerts',
  variant: 'medium',
  actions: [],
});
