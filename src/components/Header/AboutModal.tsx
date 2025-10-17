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

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const GITHUB_REPOSITORY_URL = 'https://github.com/konflux-ci/konflux-ui';
  const [parsedData] = useKonfluxPublicInfo();
  const isInternal = parsedData.visibility === 'private';
  const documentationLink = isInternal
    ? INTERNAL_DOCUMENTATION_BASE_URL
    : EXTERNAL_DOCUMENTATION_BASE_URL;

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
            <ListItem>
              <Text component={TextVariants.p}>Application lifecycle management</Text>
            </ListItem>
            <ListItem>
              <Text component={TextVariants.p}>Pipeline Automation and CI/CD</Text>
            </ListItem>
            <ListItem>
              <Text component={TextVariants.p}>Component-based development</Text>
            </ListItem>
            <ListItem>
              <Text component={TextVariants.p}>Release Management</Text>
            </ListItem>
            <ListItem>
              <Text component={TextVariants.p}>Security scanning and compliance</Text>
            </ListItem>
            <ListItem>
              <Text component={TextVariants.p}>Integration with modern development tools</Text>
            </ListItem>
          </List>
        </StackItem>

        <StackItem>
          <TextContent>
            <Text component={TextVariants.h3}>Resources</Text>
          </TextContent>
          <List>
            <ListItem>
              <ExternalLink href={documentationLink} text="Documentation" />
            </ListItem>
            <ListItem>
              <ExternalLink href={GITHUB_REPOSITORY_URL} text="Github Repository" />
            </ListItem>
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
