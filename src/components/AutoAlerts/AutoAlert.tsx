import React from 'react';
import { Banner, Flex, FlexItem, Stack } from '@patternfly/react-core';
import { useAutoAlerts } from '~/hooks/useAutoAlerts';
import { typeToIcon, typeToVariant } from '../konfluxBanner/KonfluxBanner';
import { createModalLauncher, type ComponentProps } from '../modal/createModalLauncher';

const AutoAlertPanel: React.FC<ComponentProps> = () => {
  const { alerts, isLoading, isError } = useAutoAlerts();

  const effectiveAlerts = !isLoading && !isError && alerts?.length > 0 ? alerts : [];

  return (
    <Stack hasGutter>
      {effectiveAlerts.length === 0 ? (
        <p data-test="no-alerts-message">No alerts found.</p>
      ) : (
        effectiveAlerts.map((alert, index) => (
          <Banner
            key={`${alert.type}-${index}`}
            isSticky
            variant={typeToVariant(alert.type)}
            data-test="banner"
          >
            <Flex
              alignItems={{ default: 'alignItemsFlexStart' }}
              justifyContent={{ default: 'justifyContentFlexStart' }}
              flexWrap={{ default: 'nowrap' }}
              style={{ width: '100%' }}
            >
              <FlexItem>
                {typeToIcon(alert.type)} {alert.summary}
              </FlexItem>
            </Flex>
          </Banner>
        ))
      )}
    </Stack>
  );
};

export const createAutoAlertModal = createModalLauncher(AutoAlertPanel, {
  'data-test': 'auto-alert-panel',
  title: 'Alerts',
  variant: 'medium',
  actions: [],
});
