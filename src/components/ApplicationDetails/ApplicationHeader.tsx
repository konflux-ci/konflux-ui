import * as React from 'react';
import { Flex, FlexItem, Content } from '@patternfly/react-core';
import { ApplicationKind } from '../../types';

export const ApplicationHeader: React.FC<
  React.PropsWithChildren<{ application: ApplicationKind }>
> = ({ application }) => {
  return (
    <Flex>
      <FlexItem alignSelf={{ default: 'alignSelfCenter' }}>
        <Content component="h1" data-test="details__title">
          {application?.spec?.displayName || ''}
        </Content>
      </FlexItem>
    </Flex>
  );
};
