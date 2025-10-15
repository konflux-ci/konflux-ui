import * as React from 'react';
import {
  Modal,
  ModalVariant,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  List,
  ListItem,
} from '@patternfly/react-core';
import {
  EXTERNAL_DOCUMENTATION_BASE_URL,
  INTERNAL_DOCUMENTATION_BASE_URL,
} from '~/consts/documentation';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { ExternalLink } from '~/shared';
import { GITHUB_REPOSITORY_URL, OFFICIAL_WEBSITE_URL } from './const';

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [parsedData] = useKonfluxPublicInfo();
  const isInternal = parsedData?.visibility === 'private';
  const documentationURL = isInternal
    ? INTERNAL_DOCUMENTATION_BASE_URL
    : EXTERNAL_DOCUMENTATION_BASE_URL;
  const KEY_FEATURES_LIST_ITEMS: string[] = [
    'Application lifecycle management',
    'Pipeline Automation and CI/CD',
    'Component-based development',
    'Release Management',
    'Security scanning and compliance',
    'Integration with modern development tools',
  ];
  const RESOURCES_LIST_ITEMS = [
    { url: documentationURL, text: 'Documentation' },
    { url: GITHUB_REPOSITORY_URL, text: 'Github Repository' },
    { url: OFFICIAL_WEBSITE_URL, text: 'Official Website' },
  ];

  return (
    <Modal variant={ModalVariant.medium} title="About Konflux" isOpen={isOpen} onClose={onClose}>
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <Text component={TextVariants.p}>
              Konflux is a comprehensive platform for modern application development and deployment.
              It provides developers with the tools and infrastructure needed to build, test and
              deploy applications efficiently in cloud-native environments.
            </Text>
          </TextContent>
        </StackItem>

        <StackItem>
          <TextContent>
            <Text component={TextVariants.h3}>Key Features</Text>
          </TextContent>
          <List>
            {KEY_FEATURES_LIST_ITEMS.map((item) => (
              <ListItem key={item}>
                <Text component={TextVariants.p}>{item}</Text>
              </ListItem>
            ))}
          </List>
        </StackItem>

        <StackItem>
          <TextContent>
            <Text component={TextVariants.h3}>Resources</Text>
          </TextContent>
          <List>
            {RESOURCES_LIST_ITEMS.map((item) => (
              <ListItem key={item.text}>
                <ExternalLink href={item.url} text={item.text} />
              </ListItem>
            ))}
          </List>
        </StackItem>

        <StackItem>
          <TextContent>
            <Text component={TextVariants.small}>
              Konflux UI v1.0.0 - Built with React and Patternfly
            </Text>
          </TextContent>
        </StackItem>
      </Stack>
    </Modal>
  );
};

export default AboutModal;
