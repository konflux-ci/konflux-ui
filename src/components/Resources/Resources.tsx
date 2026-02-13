import React from 'react';
import { PageSection, Title, Text, TextContent, Flex, FlexItem } from '@patternfly/react-core';
import { BookIcon } from '@patternfly/react-icons/dist/esm/icons/book-icon';
import {
  EXTERNAL_DOCUMENTATION_BASE_URL,
  INTERNAL_DOCUMENTATION_BASE_URL,
} from '~/consts/documentation';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import ExternalLink from '../../shared/components/links/ExternalLink';

const Resources: React.FunctionComponent = () => {
  const [parsedData] = useKonfluxPublicInfo();
  const isInternal = parsedData?.visibility === 'private';
  const documentationURL = isInternal
    ? INTERNAL_DOCUMENTATION_BASE_URL
    : EXTERNAL_DOCUMENTATION_BASE_URL;

  return (
    <PageSection className="pf-v5-u-p-lg">
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
        <FlexItem>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsSm' }}
          >
            <FlexItem>
              <BookIcon />
            </FlexItem>
            <FlexItem>
              <Title headingLevel="h1" size="2xl">
                Resources
              </Title>
            </FlexItem>
          </Flex>
          <TextContent className="pf-v5-u-mt-sm">
            <Text>
              Access all learning resources for Konflux CI/CD and supported applications. To learn
              more about Konflux,
              <ExternalLink href={documentationURL} text=" view the documentation" />
            </Text>
          </TextContent>
        </FlexItem>

        {/* Upcoming Changes */}
        {/* <FlexItem>
          <Sidebar hasGutter>
            <ResourcesSidebar
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />
            <SidebarContent>
              <ResourcesCards
                selectedCategory={selectedCategory}
              />
            </SidebarContent>
          </Sidebar>
        </FlexItem> */}
      </Flex>
    </PageSection>
  );
};

export default Resources;
