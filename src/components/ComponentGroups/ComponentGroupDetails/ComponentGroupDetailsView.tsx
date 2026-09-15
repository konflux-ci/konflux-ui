import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { GROUP_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { DetailsPage } from '../../DetailsPage';

export const COMPONENTS_GS_LOCAL_STORAGE_KEY = 'components-getting-started-modal';

const ComponentGroupDetailsView: React.FC = () => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const [componentGroup, loaded, componentError] = useComponentGroup(namespace, groupName);

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
        baseURL={GROUP_DETAILS_PATH.createPath({ workspaceName: namespace, groupName })}
        tabs={[
          {
            key: 'index',
            label: 'Overview',
            isFilled: true,
          },
          {
            key: 'integrationtests',
            label: 'Integration tests',
          },
        ]}
      />
    </>
  );
};

export default ComponentGroupDetailsView;
