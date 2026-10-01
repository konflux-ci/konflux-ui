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
import { createEditContextsModal } from '~/components/IntegrationTests/EditContextsModal';
import { createEditParamsModal } from '~/components/IntegrationTests/EditParamsModal';
import { IntegrationTestLabels } from '~/components/IntegrationTests/IntegrationTestForm/types';
import {
  getLabelForParam,
  getURLForParam,
  ResolverRefParams,
} from '~/components/IntegrationTests/IntegrationTestForm/utils/create-utils';
import MetadataList from '~/components/MetadataList';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { useIntegrationTestScenarioForContext } from '~/hooks/useIntegrationTestScenarios';
import { APPLICATION_DETAILS_PATH, GROUP_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { Timestamp } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';

const IntegrationTestOverviewTab: React.FC<React.PropsWithChildren> = () => {
  const namespace = useNamespace();
  const { integrationTestName, applicationName, groupName } = useParams<RouterParams>();
  const isGroupContext = Boolean(groupName);

  const [integrationTest, loaded, error] = useIntegrationTestScenarioForContext(
    namespace,
    integrationTestName ?? '',
    { applicationName, groupName },
  );

  const contextTitle = isGroupContext ? 'Component Group' : 'Application';
  const contextDetailsPath = isGroupContext
    ? GROUP_DETAILS_PATH.createPath({ workspaceName: namespace, groupName })
    : APPLICATION_DETAILS_PATH.createPath({ workspaceName: namespace, applicationName });
  const contextName = (isGroupContext ? groupName : applicationName) ?? '';

  const showModal = useModalLauncher();

  if (error) {
    return getErrorState(error, loaded, 'integration test');
  }

  const optionalReleaseLabel =
    integrationTest?.metadata?.labels?.[IntegrationTestLabels.OPTIONAL] === 'true';

  const params = integrationTest?.spec?.params;
  const contexts = integrationTest?.spec?.contexts;

  return (
    <>
      <Title headingLevel="h4" className="pf-v6-c-title pf-v6-u-mt-lg pf-v6-u-mb-lg" size="lg">
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
                        className="pf-v6-u-pl-0"
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
                        className="pf-v6-u-pl-0"
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
                <DescriptionListTerm>{contextTitle}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Link to={contextDetailsPath}>{contextName}</Link>
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
