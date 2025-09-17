import React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Title,
} from '@patternfly/react-core';
import ExternalLink from '../../../../shared/components/links/ExternalLink';
import { ReleaseKind } from '../../../../types';
import { getImageLink } from '../utils/url';

type Props = {
  release?: ReleaseKind;
};

type DescriptionSectionProps = {
  term: string;
  links: string[];
  getLink?: (link: string) => string;
};
const DescriptionSection: React.FC<DescriptionSectionProps> = ({ term, links, getLink }) => {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>{term}</DescriptionListTerm>
      <DescriptionListDescription>
        <Flex direction={{ default: 'column' }}>
          {links.map((href) => (
            <ExternalLink key={href} href={getLink ? getLink(href) : href} text={href} />
          ))}
        </Flex>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export const ReleaseURLsDescriptionList: React.FC<Props> = ({ release }) => {
  const references = release?.spec?.data?.releaseNotes?.references;
  const releaseNotesReferences = references
    ? Array.isArray(references)
      ? references
      : [references]
    : null;

  const indexImage =
    release?.status?.artifacts?.index_image?.index_image ||
    release?.status?.artifacts?.index_image?.index_image_resolved ||
    release?.status?.artifacts?.index_image?.target_index;

  const githubReleaseUrl = release?.status?.artifacts?.['github-release']?.url;

  if (!releaseNotesReferences?.length && !indexImage && !githubReleaseUrl) return null;

  return (
    <div>
      <Title headingLevel="h5" size="md">
        Released URLs
      </Title>
      <DescriptionList
        columnModifier={{ default: '1Col' }}
        style={{ marginTop: 'var(--pf-v5-global--spacer--lg)' }}
      >
        {!!releaseNotesReferences?.length && (
          <DescriptionSection term="Release notes" links={releaseNotesReferences} />
        )}
        {!!indexImage && (
          <DescriptionSection term="Index image" links={[indexImage]} getLink={getImageLink} />
        )}
        {!!githubReleaseUrl && (
          <DescriptionSection
            term="Github release URL"
            links={[githubReleaseUrl]}
            getLink={getImageLink}
          />
        )}
      </DescriptionList>
    </div>
  );
};
