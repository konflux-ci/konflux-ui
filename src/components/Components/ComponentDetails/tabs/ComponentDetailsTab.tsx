import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Button, ButtonVariant } from '@patternfly/react-core';
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

const ComponentDetailsTab: React.FC = () => {
  const namespace = useNamespace();
  const { componentName } = useParams<RouterParams>();
  const track = useTrackEvent();
  const showModal = useModalLauncher();
  const [component] = useComponent(namespace, componentName);
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
        <ComponentDetails component={component} />
      </DetailsSection>
      <DetailsSection
        title="Latest build"
        description="All information is based on the latest successful build of this component."
      >
        <ComponentLatestBuild component={component} />
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
        <ComponentBuildSettings component={component} />
        <ComponentNudgesDependencies component={component} />
      </DetailsSection>
    </div>
  );
};

export default ComponentDetailsTab;
