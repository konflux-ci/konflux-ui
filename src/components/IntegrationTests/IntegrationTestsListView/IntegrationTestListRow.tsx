import * as React from 'react';
import { Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { INTEGRATION_TEST_DETAILS_PATH } from '../../../routes/paths';
import { RowFunctionArgs, TableData } from '../../../shared';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { useNamespaceInfo } from '../../../shared/providers/Namespace';
import { IntegrationTestScenarioKind } from '../../../types/coreBuildService';
import { IntegrationTestLabels } from '../IntegrationTestForm/types';
import { ResolverRefParams, getURLForParam } from '../IntegrationTestForm/utils/create-utils';
import { integrationListTableColumnClasses } from './IntegrationTestListHeader';
import { useIntegrationTestActions } from './useIntegrationTestActions';

const IntegrationTestListRow: React.FC<
  React.PropsWithChildren<RowFunctionArgs<IntegrationTestScenarioKind>>
> = ({ obj }) => {
  const actions = useIntegrationTestActions(obj);
  const { namespace } = useNamespaceInfo();
  return (
    <>
      <TableData
        className={integrationListTableColumnClasses.name}
        data-test="integration-tests__row-name"
      >
        <Link
          to={INTEGRATION_TEST_DETAILS_PATH.createPath({
            applicationName: obj.spec?.application,
            integrationTestName: obj.metadata?.name,
            workspaceName: namespace,
          })}
        >
          {obj.metadata.name}
        </Link>
      </TableData>
      <TableData className={integrationListTableColumnClasses.containerImage}>
        {obj?.spec?.resolverRef?.params ? (
          <ExternalLink
            href={getURLForParam(obj?.spec?.resolverRef?.params, ResolverRefParams.URL)}
            text={
              <Truncate
                content={
                  obj?.spec?.resolverRef?.params.find(
                    (param) => param.name === ResolverRefParams.URL,
                  )?.value || '-'
                }
              />
            }
            stopPropagation
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={integrationListTableColumnClasses.mandatory}>
        {obj.metadata.labels?.[IntegrationTestLabels.OPTIONAL] === 'true'
          ? 'Optional'
          : 'Mandatory'}
      </TableData>
      <TableData className={integrationListTableColumnClasses.pipeline}>
        {obj?.spec?.resolverRef?.params ? (
          <ExternalLink
            href={getURLForParam(obj?.spec?.resolverRef?.params, ResolverRefParams.REVISION)}
            text={
              obj?.spec?.resolverRef?.params.find(
                (param) => param.name === ResolverRefParams.REVISION,
              )?.value || '-'
            }
            stopPropagation
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={integrationListTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export default IntegrationTestListRow;
