import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Title,
  Tooltip,
  pluralize,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { useIntegrationTestScenario } from '../../../../hooks/useIntegrationTestScenarios';
import { RouterParams } from '../../../../routes/utils';
import { Timestamp } from '../../../../shared';
import ExternalLink from '../../../../shared/components/links/ExternalLink';
import MetadataList from '../../../MetadataList';
import { useModalLauncher } from '../../../modal/ModalProvider';
import { useWorkspaceInfo } from '../../../Workspace/useWorkspaceInfo';
import { createEditContextsModal } from '../../EditContextsModal';
import { createEditParamsModal } from '../../EditParamsModal';
import { IntegrationTestLabels } from '../../IntegrationTestForm/types';
import {
  getLabelForParam,
  getURLForParam,
  ResolverRefParams,
} from '../../IntegrationTestForm/utils/create-utils';

const IntegrationTestOverviewTab: React.FC<React.PropsWithChildren> = () => {
  const { workspace, namespace } = useWorkspaceInfo();
  const { integrationTestName, applicationName } = useParams<RouterParams>();

  const [integrationTest] = useIntegrationTestScenario(
    namespace,
    workspace,
    applicationName,
    integrationTestName,
  );

  const optionalReleaseLabel =
    integrationTest.metadata.labels?.[IntegrationTestLabels.OPTIONAL] === 'true';

  const showModal = useModalLauncher();

  const params = integrationTest?.spec?.params;
  const contexts = integrationTest?.spec?.contexts;

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg" size="lg">
        Integration test details
      </Title>
      <Flex>
        <Flex flex={{ default: 'flex_3' }}>
          <FlexItem>
            <DescriptionList
              data-test="integration-test-details"
              columnModifier={{
                default: '1Col',
              }}
            >
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>
                  {integrationTest.metadata.name ?? '-'}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>
                  {integrationTest.metadata.namespace ?? '-'}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Labels</DescriptionListTerm>
                <DescriptionListDescription>
                  <MetadataList metadata={integrationTest.metadata.labels} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Annotations</DescriptionListTerm>
                <DescriptionListDescription>
                  <MetadataList metadata={integrationTest.metadata.annotations} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Created at</DescriptionListTerm>
                <DescriptionListDescription>
                  <Timestamp timestamp={integrationTest.metadata.creationTimestamp ?? '-'} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </FlexItem>
        </Flex>

        <Flex flex={{ default: 'flex_3' }}>
          <FlexItem>
            <DescriptionList
              data-test="integration-test-details"
              columnModifier={{
                default: '1Col',
              }}
            >
              {integrationTest.spec.resolverRef && (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Type</DescriptionListTerm>
                    <DescriptionListDescription>
                      {integrationTest.spec.resolverRef.resolver}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {integrationTest.spec.resolverRef.params.map((param) => {
                    const paramLink = getURLForParam(
                      integrationTest.spec.resolverRef.params,
                      param.name,
                    );
                    if (!param.value) {
                      return null;
                    }
                    return (
                      <DescriptionListGroup key={param.name}>
                        <DescriptionListTerm>{getLabelForParam(param.name)}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {param.name === ResolverRefParams.URL ? (
                            paramLink ? (
                              <ExternalLink href={paramLink} hideIcon>
                                {param.value}
                              </ExternalLink>
                            ) : (
                              param.value
                            )
                          ) : paramLink ? (
                            <ExternalLink href={paramLink}>{param.value}</ExternalLink>
                          ) : (
                            param.value
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    );
                  })}
                </>
              )}
              {contexts && (
                <DescriptionListGroup data-test="its-overview-contexts">
                  <DescriptionListTerm>
                    Contexts{' '}
                    <Tooltip content="Contexts where the integration test can be applied.">
                      <OutlinedQuestionCircleIcon />
                    </Tooltip>
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {pluralize(contexts.length, 'context')}
                    <div>
                      {' '}
                      <Button
                        variant={ButtonVariant.link}
                        className="pf-v5-u-pl-0"
                        onClick={() =>
                          showModal(
                            createEditContextsModal({
                              intTest: integrationTest,
                            }),
                          )
                        }
                        data-test="edit-context-button"
                      >
                        Edit contexts
                      </Button>
                    </div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {params && (
                <DescriptionListGroup data-test="its-overview-params">
                  <DescriptionListTerm>
                    Parameters{' '}
                    <Tooltip content="Parameters which will be added to the integration Tekton pipeline run.">
                      <OutlinedQuestionCircleIcon />
                    </Tooltip>
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    {pluralize(params.length, 'parameter')}
                    <div>
                      {' '}
                      <Button
                        variant={ButtonVariant.link}
                        className="pf-v5-u-pl-0"
                        onClick={() =>
                          showModal(
                            createEditParamsModal({
                              intTest: integrationTest,
                            }),
                          )
                        }
                        data-test="edit-param-button"
                      >
                        Edit parameters
                      </Button>
                    </div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>Optional for release</DescriptionListTerm>
                <DescriptionListDescription>
                  {optionalReleaseLabel ? 'Optional' : 'Mandatory'}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Application</DescriptionListTerm>
                <DescriptionListDescription>
                  <Link
                    to={`/workspaces/${workspace}/applications/${integrationTest.spec.application}`}
                  >
                    {integrationTest.spec.application}
                  </Link>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </FlexItem>
        </Flex>
      </Flex>
    </>
  );
};

export default IntegrationTestOverviewTab;
