import * as React from 'react';
import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import yamlParser from 'js-yaml';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import HelpPopover from '~/components/HelpPopover';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useLatestPushBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { HttpError } from '~/k8s/error';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind } from '~/types';
import { getLastestImage } from '~/utils/component-utils';
import { getPipelineRunStatusResults } from '~/utils/pipeline-utils';
import ComponentImageRepositoryVisibility from './ComponentImageRepositoryVisibility';

type ComponentDetailsProps = {
  component: ComponentKind;
};

const RESULT_NAME = 'IMAGE_URL';

const ComponentDetails: React.FC<React.PropsWithChildren<ComponentDetailsProps>> = ({
  component,
}) => {
  const namespace = useNamespace();
  const [latestPushBuildPLR, pipelineRunLoaded, error] =
    useLatestPushBuildPipelineRunForComponentV2(namespace, component.metadata.name);

  const results =
    !error && pipelineRunLoaded && latestPushBuildPLR?.status
      ? getPipelineRunStatusResults(latestPushBuildPLR)
      : null;
  const latestImageURL = results?.find((result) => result.name === RESULT_NAME);
  const componentImageURL = latestImageURL?.value ?? getLastestImage(component);

  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    component?.metadata?.namespace,
    component?.metadata?.name,
    false,
  );

  // Check if user has permission to view image repository
  const hasImageRepoPermission = React.useMemo(() => {
    if (!imageRepoLoaded) return false; // Still loading, don't show
    if (imageRepoError && (imageRepoError as HttpError).code === 403) return false; // 403 = no permission
    return true; // No error or other errors, show the field
  }, [imageRepoLoaded, imageRepoError]);

  const runTime = React.useMemo(() => {
    try {
      const loadedYaml = yamlParser?.load(component.status?.devfile) as {
        metadata: { projectType: string; displayName: string; name: string };
      };
      return (
        loadedYaml?.metadata.projectType ||
        loadedYaml?.metadata.displayName ||
        loadedYaml?.metadata.name ||
        'N/A'
      );
    } catch {
      return 'N/A';
    }
  }, [component]);

  return (
    <Flex direction={{ default: 'row' }}>
      {component.spec.source?.git && (
        <FlexItem style={{ flex: 1 }}>
          <DescriptionList
            columnModifier={{
              default: '1Col',
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>Source code</DescriptionListTerm>
              <DescriptionListDescription>
                <GitRepoLink
                  url={component.spec.source?.git?.url}
                  revision={component.spec.source?.git?.revision}
                  context={component.spec.source?.git?.context}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </FlexItem>
      )}
      {hasImageRepoPermission && (
        <FlexItem style={{ flex: 1 }}>
          <DescriptionList
            columnModifier={{
              default: '1Col',
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>
                Image repository visibility{' '}
                <HelpPopover
                  bodyContent={
                    <>
                      Controls whether the built container images are publicly accessible or
                      private.
                      <br />
                      <br />
                      <strong>Note:</strong> When changing from public to private, ensure you have
                      configured the necessary pull secrets for your deployment targets.
                    </>
                  }
                />
              </DescriptionListTerm>
              <DescriptionListDescription data-test="image-repository-visibility">
                <ComponentImageRepositoryVisibility
                  component={component}
                  imageRepository={imageRepository}
                  imageRepoLoaded={imageRepoLoaded}
                  imageRepoError={imageRepoError}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </FlexItem>
      )}
      {componentImageURL && (
        <FlexItem style={{ flex: 1 }}>
          <DescriptionList
            columnModifier={{
              default: '1Col',
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>Latest image</DescriptionListTerm>
              <DescriptionListDescription data-test="component-latest-image">
                <ExternalLink
                  href={
                    componentImageURL.startsWith('http')
                      ? componentImageURL
                      : `https://${componentImageURL}`
                  }
                  text={componentImageURL}
                  isHighlightable
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </FlexItem>
      )}
      <FlexItem style={{ flex: 1 }}>
        <DescriptionList
          data-test="component-details-2"
          columnModifier={{
            default: '1Col',
          }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Runtime</DescriptionListTerm>
            <DescriptionListDescription>{runTime}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </FlexItem>
    </Flex>
  );
};

export default ComponentDetails;
