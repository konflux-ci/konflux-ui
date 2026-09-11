import React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import ListHeader from '~/shared/components/list-layout/ListHeader';

type ListLayoutProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
};

const ListLayout: React.FC<ListLayoutProps> = ({ title, description, children }) => {
  return (
    <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapSm' }}>
      <FlexItem>
        <ListHeader title={title} description={description} />
      </FlexItem>
      {children}
    </Flex>
  );
};

export default ListLayout;
