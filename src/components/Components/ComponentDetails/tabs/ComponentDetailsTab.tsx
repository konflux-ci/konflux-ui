import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { ChatContextTarget } from '~/components/AIChat';
import { LEARN_MORE_ABOUT_LOGIN_IMAGE_REPO } from '~/consts/documentation';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { useComponent } from '../../../../hooks/useComponents';
import { RouterParams } from '../../../../routes/utils';
import { useNamespace } from '../../../../shared/providers/Namespace/useNamespaceInfo';
import { TrackEvents, useTrackEvent } from '../../../../utils/analytics';
import ComponentNudgesDependencies from '../../../ComponentRelation/details-page/ComponentNudgesDependencies';
import { createCustomizeComponentPipelineModalLauncher } from '../../../CustomizedPipeline/CustomizePipelinesModal';
import { DetailsSection } from '../../../DetailsPage';
import { useModalLauncher } from '../../../modal/ModalProvider';
import ComponentBuildSettings from './ComponentBuildSettings';
import ComponentDetails from './ComponentDetails';
import ComponentLatestBuild from './ComponentLatestBuild';
import ComponentRegistryLogin from './ComponentRegistryLogin';

const ComponentDetailsTab: React.FC = () => {
  const namespace = useNamespace();
  const { componentName } = useParams<RouterParams>();
  const track = useTrackEvent();
  const showModal = useModalLauncher();
  const [component] = useComponent(namespace, componentName, true);
  const customizePipeline = () => {
    track(TrackEvents.ButtonClicked, {
      link_name: 'manage-build-pipeline',
      link_location: 'component-list-label',
      component_name: component.metadata.name,
      app_name: component.spec.application,
      namespace,
    });
    showModal(
      createCustomizeComponentPipelineModalLauncher(
        component.metadata.name,
        component.metadata.namespace,
      ),
    );
  };

  return (
    <div className="component-details">
      <DetailsSection title="Component details">
        <ChatContextTarget
          id={`${componentName}-component-details`}
          label="Component details"
          description="Source code, image repository visibility, and latest image"
        >
          <ComponentDetails component={component} />
        </ChatContextTarget>
      </DetailsSection>
      <DetailsSection
        title="Latest build"
        description="All information is based on the latest successful build of this component."
      >
        <ChatContextTarget
          id={`${componentName}-latest-build`}
          label="Latest build"
          description="Information from the latest successful build of this component"
        >
          <ComponentLatestBuild component={component} />
        </ChatContextTarget>
      </DetailsSection>
      <DetailsSection
        title="Build settings"
        description={
          <span>
            Define how to build images from this component.{` `}
            <Button variant={ButtonVariant.link} isInline onClick={customizePipeline}>
              Edit build pipeline plan
            </Button>
          </span>
        }
      >
        <ChatContextTarget
          id={`${componentName}-build-settings`}
          label="Build settings"
          description="Build pipeline plan and component dependencies"
        >
          <ComponentBuildSettings component={component} />
          <ComponentNudgesDependencies component={component} />
        </ChatContextTarget>
      </DetailsSection>
      <DetailsSection
        title="Registry Login Information"
        description={
          <>
            Use this information for accessing the registry for build images.{' '}
            <ExternalLink href={LEARN_MORE_ABOUT_LOGIN_IMAGE_REPO}>More info</ExternalLink>
          </>
        }
      >
        <ChatContextTarget
          id={`${componentName}-registry-login`}
          label="Registry login information"
          description="Credentials for accessing the registry for build images"
        >
          <ComponentRegistryLogin />
        </ChatContextTarget>
      </DetailsSection>
    </div>
  );
};

export default ComponentDetailsTab;
