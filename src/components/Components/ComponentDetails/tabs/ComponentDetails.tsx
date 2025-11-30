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
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { ImageRepositoryModel } from '~/models';
import { CopyableText } from '~/shared/components';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind, ImageRepositoryVisibility } from '~/types';
import { getImageUrlForVisibility, getLastestImage } from '~/utils/component-utils';
import { getPipelineRunStatusResults } from '~/utils/pipeline-utils';
import { useAccessReviewForModel } from '~/utils/rbac';
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

  // Check if image controller is enabled for this cluster
  const { isImageControllerEnabled } = useIsImageControllerEnabled();

  // Check if user has permission to list image repository
  const [canListImageRepository] = useAccessReviewForModel(ImageRepositoryModel, 'list');

  // Fetch ImageRepository to get visibility setting
  const [imageRepository] = useImageRepository(
    canListImageRepository ? component?.metadata?.namespace : null,
    canListImageRepository ? component?.metadata?.name : null,
    false,
  );

  const visibility = imageRepository?.spec?.image?.visibility;

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
      {isImageControllerEnabled && (
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
                      Pull and push secrets are automatically created and managed by the image
                      controller for your build pipelines.
                    </>
                  }
                />
              </DescriptionListTerm>
              <DescriptionListDescription data-test="image-repository-visibility">
                <ComponentImageRepositoryVisibility component={component} />
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
                {visibility === ImageRepositoryVisibility.private ? (
                  <CopyableText
                    text={getImageUrlForVisibility(componentImageURL, visibility)}
                    data-test="component-latest-image-copyable"
                  />
                ) : (
                  <ExternalLink
                    href={
                      componentImageURL.startsWith('http')
                        ? componentImageURL
                        : `https://${componentImageURL}`
                    }
                    text={componentImageURL}
                    isHighlightable
                  />
                )}
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
