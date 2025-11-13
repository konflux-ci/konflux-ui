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
import { useLatestPushBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
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

  // Check if image controller is enabled for this cluster
  const { isImageControllerEnabled } = useIsImageControllerEnabled();

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
        <FlexItem flex={{ default: 'flex_1' }}>
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
        <FlexItem flex={{ default: 'flex_1' }}>
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
        <FlexItem flex={{ default: 'flex_1' }}>
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
      <FlexItem flex={{ default: 'flex_1' }}>
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
