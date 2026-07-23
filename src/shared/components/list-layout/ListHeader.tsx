import React from 'react';
import { Title, Content, ContentVariants } from '@patternfly/react-core';

type ListHeaderProps = {
  title: string;
  description: React.ReactNode;
};

const ListHeader: React.FC<ListHeaderProps> = ({ title, description }) => {
  return (
    <>
      <Title headingLevel="h3">{title}</Title>
      <Content component={ContentVariants.p}>{description}</Content>
    </>
  );
};

export default ListHeader;
