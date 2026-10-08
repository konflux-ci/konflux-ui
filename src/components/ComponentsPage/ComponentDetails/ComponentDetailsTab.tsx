import { useParams } from 'react-router-dom';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Spinner,
} from '@patternfly/react-core';
import { DetailsSection } from '~/components/DetailsPage';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';

const ComponentDetailsTab: React.FC = () => {
  const namespace = useNamespace();
  const { componentName } = useParams<RouterParams>();
  const [component, loaded, error] = useComponentV2(namespace, componentName, true);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }
  if (error || !component) {
    return getErrorState(error ?? { code: 404 }, loaded, 'component');
  }

  const sourceUrl = component.spec.source?.url;
  return (
    <DetailsSection title="Component details">
      <DescriptionList>
        <DescriptionListGroup>
          <DescriptionListTerm>Name</DescriptionListTerm>
          <DescriptionListDescription>{component.metadata.name}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Namespace</DescriptionListTerm>
          <DescriptionListDescription>{component.metadata.namespace}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Source code</DescriptionListTerm>
          <DescriptionListDescription>
            {sourceUrl ? <GitRepoLink url={sourceUrl} /> : '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Container image</DescriptionListTerm>
          <DescriptionListDescription>
            {component.spec.containerImage ?? '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </DetailsSection>
  );
};

export default ComponentDetailsTab;
