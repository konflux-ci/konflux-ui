import * as React from 'react';
import { Stack, StackItem, Content, ContentVariants, List, ListItem } from '@patternfly/react-core';
import { ModalVariant } from '@patternfly/react-core/deprecated';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import {
  EXTERNAL_DOCUMENTATION_BASE_URL,
  INTERNAL_DOCUMENTATION_BASE_URL,
} from '~/consts/documentation';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { ExternalLink } from '~/shared';
import { KEY_FEATURES_LIST_ITEMS, STATIC_RESOURCES } from './const';

const AboutModal: React.FC = () => {
  const [parsedData] = useKonfluxPublicInfo();
  const isInternal = parsedData?.visibility === 'private';
  const documentationURL = isInternal
    ? INTERNAL_DOCUMENTATION_BASE_URL
    : EXTERNAL_DOCUMENTATION_BASE_URL;

  const resourcesListItems = React.useMemo(
    () => [{ url: documentationURL, text: 'Documentation' }, ...STATIC_RESOURCES],
    [documentationURL],
  );

  return (
    <Stack hasGutter>
      <StackItem>
        <Content>
          <Content component={ContentVariants.p}>
            Konflux is a comprehensive platform for modern application development and deployment.
            It provides developers with the tools and infrastructure needed to build, test and
            deploy applications efficiently in cloud-native environments.
          </Content>
        </Content>
      </StackItem>

      <StackItem>
        <Content>
          <Content component={ContentVariants.h3}>Key Features</Content>
        </Content>
        <List>
          {KEY_FEATURES_LIST_ITEMS.map((item) => (
            <ListItem key={item}>
              <Content component={ContentVariants.p}>{item}</Content>
            </ListItem>
          ))}
        </List>
      </StackItem>

      <StackItem>
        <Content>
          <Content component={ContentVariants.h3}>Resources</Content>
        </Content>
        <List>
          {resourcesListItems.map((item) => (
            <ListItem key={item.text}>
              <ExternalLink href={item.url} text={item.text} />
            </ListItem>
          ))}
        </List>
      </StackItem>

      <StackItem>
        <Content>
          <Content component={ContentVariants.small}>
            Konflux UI - Built with React and Patternfly
          </Content>
        </Content>
      </StackItem>
    </Stack>
  );
};

export const createAboutModal = createModalLauncher(AboutModal, {
  'data-test': 'about-modal',
  title: 'About Konflux',
  variant: ModalVariant.medium,
});

export default AboutModal;
