import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  AlertVariant,
  ButtonVariant,
  EmptyStateBody,
  Flex,
  FlexItem,
  pluralize,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';
import emptyStateImgUrl from '../../../assets/Components.svg';
import pipelineImg from '../../../assets/Pipeline.svg';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useComponents } from '../../../hooks/useComponents';
import { useLatestBuildPipelines } from '../../../hooks/useLatestBuildPipelines';
import { PACState } from '../../../hooks/usePACState';
import usePACStatesForComponents from '../../../hooks/usePACStatesForComponents';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { ComponentModel } from '../../../models';
import { IMPORT_PATH } from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { Table } from '../../../shared';
import AppEmptyState from '../../../shared/components/empty-state/AppEmptyState';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { useNamespace } from '../../../shared/providers/Namespace/useNamespaceInfo';
import { ComponentKind } from '../../../types';
import { useURLForComponentPRs } from '../../../utils/component-utils';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import { createCustomizeAllPipelinesModalLauncher } from '../../CustomizedPipeline/CustomizePipelinesModal';
import { GettingStartedCard } from '../../GettingStartedCard/GettingStartedCard';
import { useModalLauncher } from '../../modal/ModalProvider';
import ComponentsListHeader from './ComponentsListHeader';
import ComponentsListRow from './ComponentsListRow';
import ComponentsToolbar, { pipelineRunStatusFilterId } from './ComponentsToolbar';

import './ComponentListView.scss';

export const COMPONENTS_LIST_GS_LOCAL_STORAGE_KEY = 'components-list-getting-started-modal';

type ComponentListViewProps = {
  applicationName: string;
};

const ComponentListView: React.FC<React.PropsWithChildren<ComponentListViewProps>> = ({
  applicationName,
}) => {
  const namespace = useNamespace();
  const { workspaceName } = useParams<RouterParams>();

  const [nameFilter, setNameFilter] = useSearchParam('name', '');
  const [statusFiltersParam, setStatusFiltersParam] = useSearchParam('status', '');
  const [mergeAlertHidden, setMergeAlertHidden] = React.useState<boolean>(false);

  const [components, componentsLoaded, componentsError] = useComponents(
    namespace,
    workspaceName,
    applicationName,
    true,
  );
  const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');
  const [canPatchComponent] = useAccessReviewForModel(ComponentModel, 'patch');

  const showModal = useModalLauncher();

  const prURL = useURLForComponentPRs(components);
  const componentNames = React.useMemo(() => components.map((c) => c.metadata.name), [components]);

  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsError] = useLatestBuildPipelines(
    namespace,
    applicationName,
    componentNames,
  );
  const componentPACStates = usePACStatesForComponents(components);

  const componentsWithLatestBuild = React.useMemo(() => {
    if (!componentsLoaded || componentsError) {
      return [];
    }
    return components.map((c) => ({
      ...c,
      latestBuildPipelineRun: pipelineRuns?.find(
        (plr) => plr.metadata?.labels?.[PipelineRunLabel.COMPONENT] === c.metadata.name,
      ),
    }));
  }, [components, componentsError, componentsLoaded, pipelineRuns]);

  const statusFilters = React.useMemo(
    () => (statusFiltersParam ? statusFiltersParam.split(',') : []),
    [statusFiltersParam],
  );

  const onClearFilters = () => {
    setNameFilter('');
    setStatusFiltersParam('');
  };

  const pendingCount = React.useMemo(
    () => Object.values(componentPACStates).filter((c) => c === PACState.pending).length,
    [componentPACStates],
  );

  const filteredComponents = React.useMemo(
    () =>
      componentsWithLatestBuild.filter((component) => {
        const compStatus = statusFilters?.length
          ? pipelineRunStatusFilterId(component.latestBuildPipelineRun)
          : '';
        return (
          (!nameFilter || component.metadata.name.indexOf(nameFilter) !== -1) &&
          (!statusFilters?.length || statusFilters.includes(compStatus))
        );
      }),
    [componentsWithLatestBuild, statusFilters, nameFilter],
  );

  const NoDataEmptyMessage = () => (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Bring your application to life">
      <EmptyStateBody>
        A component is an image built from source code in a repository. One or more components that
        run together form an application.
        <br />
        To get started, add a component to your application.{' '}
      </EmptyStateBody>
      <ButtonWithAccessTooltip
        variant="primary"
        component={(props) => (
          <Link
            {...props}
            to={`${IMPORT_PATH.createPath({
              workspaceName: namespace,
            })}?application=${applicationName}`}
          />
        )}
        isDisabled={!canCreateComponent}
        tooltip="You don't have access to add a component"
        analytics={{
          link_name: 'add-component',
          link_location: 'components-list-empty-state',
          app_name: applicationName,
          namespace,
        }}
      >
        Add component
      </ButtonWithAccessTooltip>
    </AppEmptyState>
  );
  const EmptyMessage = () => (
    <FilteredEmptyState
      onClearFilters={onClearFilters}
      data-test="components-list-view__all-filtered"
    />
  );

  const gettingStartedCard = React.useMemo(
    () => (
      <GettingStartedCard
        imgClassName="component-list-view__gs-image"
        localStorageKey={COMPONENTS_LIST_GS_LOCAL_STORAGE_KEY}
        title="Upgrade build pipeline plans for your components."
        imgSrc={pipelineImg}
        imgAlt="build pipeline plans"
        isLight
      >
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          flexWrap={{ default: 'wrap', md: 'nowrap' }}
        >
          <FlexItem>
            Add additional tasks to your pipelines or merge pipelines to your source to gain
            complete control over them.
          </FlexItem>
          <FlexItem>
            <ButtonWithAccessTooltip
              className="pf-u-mr-2xl"
              variant={ButtonVariant.secondary}
              isDisabled={!canPatchComponent}
              tooltip="You don't have access to edit the build pipeline plans"
              onClick={() =>
                showModal(createCustomizeAllPipelinesModalLauncher(applicationName, namespace))
              }
            >
              Edit build pipeline plans
            </ButtonWithAccessTooltip>
          </FlexItem>
        </Flex>
      </GettingStartedCard>
    ),
    [applicationName, namespace, showModal, canPatchComponent],
  );

  return (
    <>
      <Title headingLevel="h3" className="pf-v5-u-mt-lg pf-v5-u-mb-sm">
        Components
      </Title>
      <TextContent>
        <Text component={TextVariants.p}>
          A component is an image built from source code in a repository. One or more components
          that run together form an application.
        </Text>
      </TextContent>
      {pipelineRunsLoaded && pipelineRunsError ? (
        <Alert
          className="pf-v5-u-mt-md"
          variant={AlertVariant.warning}
          isInline
          title="Error while fetching pipeline runs"
        >
          {(pipelineRunsError as { message: string })?.message}{' '}
        </Alert>
      ) : null}
      {gettingStartedCard}
      {componentsLoaded && pipelineRunsLoaded && pendingCount > 0 && !mergeAlertHidden ? (
        <Alert
          className="pf-v5-u-mt-md"
          variant={AlertVariant.warning}
          isInline
          title={`${pluralize(
            pendingCount,
            'component is',
            'components are',
          )} missing a build pipeline definition`}
          actionClose={<AlertActionCloseButton onClose={() => setMergeAlertHidden(true)} />}
          actionLinks={
            <>
              <AlertActionLink
                onClick={() =>
                  showModal(createCustomizeAllPipelinesModalLauncher(applicationName, namespace))
                }
              >
                Manage build pipelines
              </AlertActionLink>
              <ExternalLink href={prURL}>View all pull requests in Github</ExternalLink>
            </>
          }
          data-test="components-unmerged-build-pr"
        >
          We sent a pull request to your repository containing the default build pipeline for you to
          customize. Merge the pull request to set up a build pipeline for your component.
        </Alert>
      ) : null}
      <div data-test="component-list">
        <Table
          virtualize={false}
          data={filteredComponents}
          unfilteredData={componentsWithLatestBuild}
          EmptyMsg={EmptyMessage}
          NoDataEmptyMsg={NoDataEmptyMessage}
          Toolbar={
            <ComponentsToolbar
              applicationName={applicationName}
              components={componentsWithLatestBuild}
            />
          }
          aria-label="Components List"
          Header={ComponentsListHeader}
          Row={ComponentsListRow}
          loaded={componentsLoaded}
          customData={{ pipelineRunsLoaded }}
          getRowProps={(obj: ComponentKind) => ({
            id: `${obj.metadata.name}-component-list-item`,
            'aria-label': obj.metadata.name,
          })}
        />
      </div>
    </>
  );
};

export default ComponentListView;
