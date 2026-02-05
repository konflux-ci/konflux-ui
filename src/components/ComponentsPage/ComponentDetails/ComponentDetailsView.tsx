import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { getErrorState } from '~/shared/utils/error-utils';
import { FeatureFlagIndicator } from '../../../feature-flags/FeatureFlagIndicator';
import { useComponent } from '../../../hooks/useComponents';
import { COMPONENTS_PATH, COMPONENT_DETAILS_V2_PATH } from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { useNamespace } from '../../../shared/providers/Namespace/useNamespaceInfo';
import { DetailsPage } from '../../DetailsPage';
import GitRepoLink from '../../GitLink/GitRepoLink';

export const COMPONENTS_GS_LOCAL_STORAGE_KEY = 'components-getting-started-modal';

const ComponentDetailsView: React.FC = () => {
  const { componentName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [component, loaded, componentError] = useComponent(namespace, componentName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, loaded, 'component');
  }

  return (
    <>
      <DetailsPage
        data-test="component-details-test-id"
        headTitle={component.spec.componentName}
        title={
          <Text component={TextVariants.h2}>
            {component.spec.componentName}{' '}
            <FeatureFlagIndicator flags={['components-page']} fullLabel />
          </Text>
        }
        description={<GitRepoLink url={component.spec?.source?.url} />}
        breadcrumbs={[
          {
            path: COMPONENTS_PATH.createPath({ workspaceName: namespace }),
            name: 'Components',
          },
          {
            path: COMPONENT_DETAILS_V2_PATH.createPath({
              workspaceName: namespace,
              componentName,
            }),
            name: component.spec.componentName,
          },
        ]}
        baseURL={COMPONENT_DETAILS_V2_PATH.createPath({
          workspaceName: namespace,
          componentName,
        })}
        tabs={[
          {
            key: 'index',
            label: 'Overview',
            isFilled: true,
          },
          {
            key: 'activity',
            label: 'Activity',
          },
          {
            key: 'versions',
            label: 'Versions',
          },
        ]}
      />
    </>
  );
};

export default ComponentDetailsView;
