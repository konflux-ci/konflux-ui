import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import ComponentImageRepositoryVisibility from '~/components/Components/ComponentDetails/tabs/ComponentImageRepositoryVisibility';
import { DetailsSection } from '~/components/DetailsPage';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { ComponentKind, ComponentVersion } from '~/types';

const ComponentSourceDetails: React.FC<{
  component: ComponentKind;
  version?: ComponentVersion;
}> = ({ component, version }) => {
  const { isImageControllerEnabled } = useIsImageControllerEnabled();
  const sourceUrl = component.spec.source?.url;
  return (
    <DetailsSection title={version ? 'Version details' : 'Component details'}>
      <Grid hasGutter>
        <GridItem lg={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>Name</DescriptionListTerm>
              <DescriptionListDescription data-test={version ? 'version-name' : 'component-name'}>
                {version?.name ?? component.metadata.name}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Namespace</DescriptionListTerm>
              <DescriptionListDescription>
                {component.metadata.namespace}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Source code</DescriptionListTerm>
              <DescriptionListDescription>
                {sourceUrl ? (
                  <GitRepoLink
                    url={sourceUrl}
                    revision={version?.revision}
                    context={version?.context}
                  />
                ) : (
                  version?.revision || '-'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>
        <GridItem lg={6}>
          <DescriptionList>
            {isImageControllerEnabled && (
              <DescriptionListGroup>
                <DescriptionListTerm>Image repository visibility</DescriptionListTerm>
                <DescriptionListDescription>
                  <ComponentImageRepositoryVisibility component={component} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>Container image repository</DescriptionListTerm>
              <DescriptionListDescription>
                {component.spec.containerImage || '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>
      </Grid>
    </DetailsSection>
  );
};

export default ComponentSourceDetails;
