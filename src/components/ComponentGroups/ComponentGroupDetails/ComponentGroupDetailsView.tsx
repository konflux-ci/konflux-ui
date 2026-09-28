import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { DetailsPage } from '~/components/DetailsPage';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { GROUP_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { useComponentGroupBreadcrumbs } from '../breadcrumb-utils';

const ComponentGroupDetailsView: React.FC = () => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const [componentGroup, loaded, componentError] = useComponentGroup(namespace, groupName);

  const componentGroupBreadcrumbs = useComponentGroupBreadcrumbs(groupName);

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
        headTitle={componentGroup?.metadata?.name || 'Unknown'}
        title={
          <Content component={ContentVariants.h2}>
            <span className="pf-u-mr-sm">
              <b>{componentGroup?.metadata?.name}</b>
            </span>
            <FeatureFlagIndicator flags={['component-model']} />
          </Content>
        }
        breadcrumbs={componentGroupBreadcrumbs}
        baseURL={GROUP_DETAILS_PATH.createPath({ workspaceName: namespace, groupName })}
        tabs={[
          {
            key: 'integrationtests',
            label: 'Integration tests',
          },
          {
            key: 'releases',
            label: 'Releases',
          },
        ]}
      />
    </>
  );
};

export default ComponentGroupDetailsView;
