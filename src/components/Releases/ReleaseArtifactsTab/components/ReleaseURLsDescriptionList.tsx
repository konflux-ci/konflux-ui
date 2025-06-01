import React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
} from '@patternfly/react-core';
import ExternalLink from '../../../../shared/components/links/ExternalLink';
import { ReleaseKind } from '../../../../types';
import { DetailsSection } from '../../../DetailsPage';
import { getImageLink } from '../utils/url';

type Props = {
  release?: ReleaseKind;
};

export const ReleaseURLsDescriptionList: React.FC<Props> = ({ release }) => {
  const releaseNotesReferences = React.useMemo(() => {
    if (!release?.spec?.data?.releaseNotes?.references) return null;
    const references = Array.isArray(release.spec.data.releaseNotes.references)
      ? release?.spec.data.releaseNotes.references
      : [release?.spec.data.releaseNotes.references];
    return references;
  }, [release?.spec?.data?.releaseNotes]);

  const indexImage = React.useMemo(() => {
    if (!release?.status?.artifacts?.index_image) return null;
    return (
      release.status.artifacts.index_image.index_image ||
      release.status.artifacts.index_image.index_image_resolved ||
      release.status.artifacts.index_image.target_index
    );
  }, [release?.status?.artifacts?.index_image]);

  const githubReleaseUrl = React.useMemo(() => {
    if (!release?.status?.artifacts?.['github-release']?.url) return null;
    return release.status.artifacts['github-release'].url;
  }, [release?.status?.artifacts]);

  if (!releaseNotesReferences && !indexImage && !githubReleaseUrl) return null;

  return (
    <>
      <DetailsSection title="Released URLs">
        <DescriptionList columnModifier={{ default: '1Col' }} style={{ marginTop: 20 }}>
          {!!releaseNotesReferences && (
            <DescriptionListGroup>
              <DescriptionListTerm>Release notes</DescriptionListTerm>
              <DescriptionListDescription>
                <Flex direction={{ default: 'column' }}>
                  {releaseNotesReferences.map((ref) => (
                    <ExternalLink href={ref} text={ref} key={ref} />
                  ))}
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {!!indexImage && (
            <DescriptionListGroup>
              <DescriptionListTerm>Index image</DescriptionListTerm>
              <DescriptionListDescription>
                <ExternalLink href={getImageLink(indexImage)} text={indexImage} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {!!githubReleaseUrl && (
            <DescriptionListGroup>
              <DescriptionListTerm>Github release URL</DescriptionListTerm>
              <DescriptionListDescription>
                <ExternalLink href={getImageLink(githubReleaseUrl)} text={githubReleaseUrl} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </DetailsSection>
    </>
  );
};
