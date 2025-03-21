import {
  APPLICATION_ACTIVITY_PATH,
  IMPORT_PATH,
  INTEGRATION_TEST_ADD_PATH,
  RELEASEPLAN_CREATE_PATH,
} from '@routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import componentsIcon from '../../assets/Components.svg';
import editCodeIcon from '../../assets/Edit code.svg';
import gitAppIcon from '../../assets/git-app.svg';
import integrationTestIcon from '../../assets/Integration-test.svg';
import pipelineIcon from '../../assets/Pipeline.svg';
import releaseIcon from '../../assets/Release.svg';
import { useApplicationPipelineGitHubApp } from '../../hooks/useApplicationPipelineGitHubApp';
import { ComponentModel, IntegrationTestScenarioModel, ReleasePlanModel } from '../../models';
import { useAccessReviewForModel } from '../../utils/rbac';
import { createCustomizeAllPipelinesModalLauncher } from '../CustomizedPipeline/CustomizePipelinesModal';
import { useModalLauncher } from '../modal/ModalProvider';
import { WhatsNextItem } from '../WhatsNext/WhatsNextSection';

export const useWhatsNextItems = (applicationName: string) => {
  const showModal = useModalLauncher();
  const namespace = useNamespace();
  const { url: githubAppURL } = useApplicationPipelineGitHubApp();
  const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');
  const [canPatchComponent] = useAccessReviewForModel(ComponentModel, 'patch');
  const [canCreateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'create',
  );
  const [canCreateReleasePlan] = useAccessReviewForModel(ReleasePlanModel, 'create');

  const whatsNextItems: WhatsNextItem[] = [
    {
      title: 'Grow your application',
      description: 'Grow your application by adding components.',
      icon: componentsIcon,
      cta: {
        label: 'Add component',
        href: `${IMPORT_PATH.createPath({ workspaceName: namespace })}?application=${applicationName}`,
        disabled: !canCreateComponent,
        disabledTooltip: "You don't have access to add a component",
        testId: 'add-component',
        analytics: {
          link_name: 'add-component',
          link_location: 'whats-next',
          app_name: applicationName,
          namespace,
        },
      },
      helpLink: 'https://konflux-ci.dev/docs/building/creating/',
    },
    {
      title: 'Add integration tests',
      description:
        'Integration tests run in parallel, validating each new component build with the latest version of all other components.',
      icon: integrationTestIcon,
      cta: {
        label: 'Add a test',
        href: INTEGRATION_TEST_ADD_PATH.createPath({ workspaceName: namespace, applicationName }),
        disabled: !canCreateIntegrationTest,
        disabledTooltip: "You don't have access to add an integration test",
        testId: 'add-test',
        analytics: {
          link_name: 'add-test',
          link_location: 'whats-next',
          app_name: applicationName,
          namespace,
        },
      },
      helpLink: 'https://konflux-ci.dev/docs/testing/integration/adding/',
    },
    {
      title: 'Create a release plan',
      description:
        'A release object represents deployable snapshot of your application. To release your code, create a release plan with release details.',
      icon: releaseIcon,
      cta: {
        label: 'Create a plan',
        href: RELEASEPLAN_CREATE_PATH.createPath({ workspaceName: namespace }),
        disabled: !canCreateReleasePlan,
        disabledTooltip: "You don't have access to create a release plan",
        testId: 'add-release-plan',
        analytics: {
          link_name: 'add-release-plan',
          link_location: 'whats-next',
          app_name: applicationName,
          namespace,
        },
      },
      helpLink: 'https://konflux-ci.dev/docs/releasing/',
    },
    {
      title: 'Install our GitHub app',
      description: 'Install the GitHub app to monitor your work from a commit to deployment.',
      icon: gitAppIcon,
      cta: {
        label: 'Start the flow',
        href: githubAppURL,
        external: true,
        analytics: {
          link_name: 'install-github-app',
          link_location: 'whats-next',
          app_name: applicationName,
          namespace,
        },
      },
      helpLink: 'https://konflux-ci.dev/docs/building/creating/',
    },
    {
      title: 'Make a code change',
      description: 'Make a change to your source code to automatically trigger a new build.',
      icon: editCodeIcon,
      cta: {
        label: 'View build activity',
        href: APPLICATION_ACTIVITY_PATH.createPath({ workspaceName: namespace, applicationName }),
        analytics: {
          link_name: 'view-build-activity',
          link_location: 'whats-next',
          app_name: applicationName,
          namespace,
        },
      },
      helpLink: 'https://konflux-ci.dev/docs/building/creating/',
    },
    {
      title: 'Manage build pipelines',
      description:
        'Add some automation by upgrading your default build pipelines to custom build pipelines.',
      icon: pipelineIcon,
      cta: {
        disabled: !canPatchComponent,
        disabledTooltip: "You don't have access to manage build pipelines",
        label: 'Manage build pipelines',
        onClick: () =>
          showModal(createCustomizeAllPipelinesModalLauncher(applicationName, namespace)),
        analytics: {
          link_name: 'manage-build-pipelines',
          link_location: 'whats-next',
          app_name: applicationName,
          namespace,
        },
      },
      helpLink: 'https://konflux-ci.dev/docs/building/customizing-the-build/',
    },
  ];
  return whatsNextItems;
};
