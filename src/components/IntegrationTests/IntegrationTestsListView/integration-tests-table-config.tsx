import { Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { GROUP_INTEGRATION_TEST_DETAILS_PATH, INTEGRATION_TEST_DETAILS_PATH } from '~/routes/paths';
import { defineFilters } from '~/shared/components/Filter';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { nameSearchFilter } from '~/utils/common-filter-configs';
import { IntegrationTestLabels } from '../IntegrationTestForm/types';
import { ResolverRefParams, getURLForParam } from '../IntegrationTestForm/utils/create-utils';
import IntegrationTestActionCell from './IntegrationTestActionCell';

export const INTEGRATION_TESTS_LIST_FILTERS = defineFilters<IntegrationTestScenarioKind>()([
  nameSearchFilter,
]);

export const INTEGRATION_TESTS_LIST_COLUMN_STATE_KEY = 'integration-tests-list';

export const BASE_INTEGRATION_TESTS_COLUMNS: ColumnDefinition<IntegrationTestScenarioKind>[] = [
  {
    id: 'name',
    header: 'Name',
    accessorFn: (obj) => obj.metadata?.name,
    cell: (info) => {
      const obj = info.row.original;
      const detailsPath = obj.spec.application
        ? INTEGRATION_TEST_DETAILS_PATH.createPath({
            applicationName: obj.spec?.application,
            integrationTestName: obj.metadata?.name,
            workspaceName: obj.metadata?.namespace,
          })
        : GROUP_INTEGRATION_TEST_DETAILS_PATH.createPath({
            groupName: obj.spec?.componentGroup ?? '',
            integrationTestName: obj.metadata?.name,
            workspaceName: obj.metadata?.namespace,
          });

      return (
        <Link to={detailsPath} data-test="integration-tests__row-name">
          {obj.metadata?.name}
        </Link>
      );
    },
  },
  {
    id: 'gitUrl',
    header: 'Git URL',
    accessorFn: (obj) =>
      obj?.spec?.resolverRef?.params?.find((param) => param.name === ResolverRefParams.URL)
        ?.value ?? '-',
    cell: (info) => {
      const obj = info.row.original;
      if (!obj?.spec?.resolverRef?.params) return '-';
      return (
        <ExternalLink
          href={getURLForParam(obj.spec.resolverRef.params, ResolverRefParams.URL)}
          text={
            <Truncate
              content={
                obj.spec.resolverRef.params.find((param) => param.name === ResolverRefParams.URL)
                  ?.value || '-'
              }
            />
          }
          stopPropagation
        />
      );
    },
  },
  {
    id: 'optionalForRelease',
    header: 'Optional for release',
    accessorFn: (obj) =>
      obj.metadata?.labels?.[IntegrationTestLabels.OPTIONAL] === 'true' ? 'Optional' : 'Mandatory',
  },
  {
    id: 'revision',
    header: 'Revision',
    accessorFn: (obj) =>
      obj?.spec?.resolverRef?.params?.find((param) => param.name === ResolverRefParams.REVISION)
        ?.value ?? '-',
    cell: (info) => {
      const obj = info.row.original;
      if (!obj?.spec?.resolverRef?.params) return '-';
      return (
        <ExternalLink
          href={getURLForParam(obj.spec.resolverRef.params, ResolverRefParams.REVISION)}
          text={
            obj.spec.resolverRef.params.find((param) => param.name === ResolverRefParams.REVISION)
              ?.value || '-'
          }
          stopPropagation
        />
      );
    },
  },
];

export const INTEGRATION_TESTS_ACTIONS_COLUMN: ColumnDefinition<IntegrationTestScenarioKind> = {
  id: 'actions',
  header: ' ',
  accessorFn: () => null,
  cell: (info) => <IntegrationTestActionCell obj={info.row.original} />,
};
