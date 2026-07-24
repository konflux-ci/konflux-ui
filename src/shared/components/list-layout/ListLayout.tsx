import React from 'react';
import { Flex } from '@patternfly/react-core';
import ListHeader from './ListHeader';

type ListLayoutProps = {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
};

const ListLayout: React.FC<ListLayoutProps> = ({ title, description, children }) => {
  return (
    <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapSm' }}>
      <ListHeader title={title} description={description} />
      {children}
    </Flex>
  );
};

export default ListLayout;
