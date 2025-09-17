import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  TextContent,
  TextVariants,
  Text,
  EmptyStateVariant,
  Truncate,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { FieldArray, useField } from 'formik';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useDeepCompareMemoize } from '~/shared';
import ActionMenu from '../../../../../shared/components/action-menu/ActionMenu';
import FilteredEmptyState from '../../../../../shared/components/empty-state/FilteredEmptyState';
import { AddIssueModal, IssueType } from './AddIssueModal';

import './AddIssueSection.scss';

interface AddIssueSectionProps {
  field: string;
  issueType: IssueType;
}

interface IssueCommonData {
  summary?: string;
  source?: string;
  uploadDate?: string;
  status?: string;
}

type BugObject = IssueCommonData & {
  id: string;
  source: string;
};

type CVEObject = IssueCommonData & {
  key?: string;
  components?: { name: string; packages: string[] }[];
};

export type IssueObject = BugObject | CVEObject;

export const issueTableColumnClass = {
  issueKey: 'pf-m-width-15 wrap-column ',
  bugUrl: 'pf-m-width-20 ',
  cveUrl: 'pf-m-width-15 ',
  components: 'pf-m-width-15 ',
  summary: 'pf-m-width-20 pf-m-width-15-on-xl ',
  uploadDate: 'pf-m-width-15 pf-m-width-10-on-xl ',
  status: 'pf-m-hidden pf-m-visible-on-xl pf-m-width-15 ',
  kebab: 'pf-v5-c-table__action',
};

export const AddIssueSection: React.FC<React.PropsWithChildren<AddIssueSectionProps>> = ({
  field,
  issueType,
}) => {
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters = useDeepCompareMemoize({
    name: unparsedFilters[field] ? (unparsedFilters[field] as string) : '',
  });
  const { name: nameFilter } = filters;
  const [{ value: issues }, ,] = useField<IssueObject[]>(field);

  const isBug = issueType === IssueType.BUG;

  const filteredIssues = React.useMemo(
    () =>
      issues && Array.isArray(issues)
        ? issues?.filter((bug) => {
            const key = isBug ? (bug as BugObject).id : (bug as CVEObject).key;
            return !nameFilter || key?.toLowerCase().indexOf(nameFilter.toLowerCase()) >= 0;
          })
        : [],
    [issues, nameFilter, isBug],
  );

  const EmptyMsg = (type) =>
    nameFilter ? (
      <FilteredEmptyState onClearFilters={() => onClearFilters()} variant={EmptyStateVariant.xs} />
    ) : (
      <EmptyState className="pf-v5-u-m-0 pf-v5-u-p-0" variant={EmptyStateVariant.xs}>
        <EmptyStateBody className="pf-v5-u-m-0 pf-v5-u-p-0">
          {type === IssueType.BUG ? 'No Bugs found' : 'No CVEs found'}
        </EmptyStateBody>
      </EmptyState>
    );

  return (
    <FieldArray
      name={field}
      render={(arrayHelper) => {
        const addNewBug = (bug) => {
          arrayHelper.push(bug);
        };

        return (
          <>
            <TextContent className="pf-v5-u-mt-xs">
              <Text component={TextVariants.h4} className="pf-v5-u-mt-0 pf-v5-u-pt-0">
                {isBug
                  ? 'Are there any bug fixes you would like to add to this release?'
                  : 'Are there any CVEs you would like to add to this release?'}
              </Text>
            </TextContent>
            <BaseTextFilterToolbar
              text={nameFilter}
              label="name"
              setText={(name) => setFilters({ [field]: name })}
              onClearFilters={onClearFilters}
              dataTest={`add-${field}-section-toolbar`}
            >
              <AddIssueModal bugArrayHelper={addNewBug} issueType={issueType} />
            </BaseTextFilterToolbar>
            <div className="pf-v5-u-mb-md">
              <Table
                aria-label="Simple table"
                variant="compact"
                borders
                className="pf-v5-u-m-0 pf-v5-u-p-0"
              >
                {isBug ? (
                  <Thead>
                    <Tr>
                      <Th className={issueTableColumnClass.issueKey}>Bug issue key</Th>
                      <Th className={issueTableColumnClass.bugUrl}>URL</Th>
                      <Th className={issueTableColumnClass.summary}>Summary</Th>
                      <Th className={issueTableColumnClass.uploadDate}>Last updated</Th>
                      <Th className={issueTableColumnClass.status}>Status</Th>
                    </Tr>
                  </Thead>
                ) : (
                  <Thead>
                    <Tr>
                      <Th className={issueTableColumnClass.issueKey}>CVE key</Th>
                      <Th className={issueTableColumnClass.components}>Components</Th>
                      <Th className={issueTableColumnClass.summary}>Summary</Th>
                      <Th className={issueTableColumnClass.uploadDate}>Last updated</Th>
                      <Th className={issueTableColumnClass.status}>Status</Th>
                    </Tr>
                  </Thead>
                )}

                {Array.isArray(filteredIssues) && filteredIssues.length > 0 && (
                  <Tbody data-test="issue-table-body">
                    {filteredIssues.map((issue, i) => {
                      const bugObject = issue as BugObject;
                      const cveObject = issue as CVEObject;
                      return (
                        <Tr key={isBug ? bugObject.id : cveObject.key}>
                          <Td className={issueTableColumnClass.issueKey} data-test="issue-key">
                            {isBug ? bugObject.id ?? '-' : cveObject.key ?? '-'}
                          </Td>
                          {isBug && (
                            <Td className={issueTableColumnClass.bugUrl} data-test="issue-url">
                              <Truncate content={issue.source} />
                            </Td>
                          )}
                          {!isBug && (
                            <Td className={issueTableColumnClass.components}>
                              {cveObject.components &&
                              Array.isArray(cveObject.components) &&
                              cveObject.components.length > 0
                                ? cveObject.components?.map((component) => (
                                    <span key={component.name} className="pf-v5-u-mr-sm">
                                      {component.name}
                                    </span>
                                  ))
                                : '-'}
                            </Td>
                          )}
                          <Td className={issueTableColumnClass.summary} data-test="issue-summary">
                            {issue.summary ? <Truncate content={issue.summary} /> : '-'}
                          </Td>
                          <Td
                            className={issueTableColumnClass.uploadDate}
                            data-test="issue-uploadDate"
                          >
                            {issue.uploadDate ?? '-'}
                          </Td>
                          <Td className={issueTableColumnClass.status} data-test="issue-status">
                            {issue.status ?? '-'}
                          </Td>
                          <Td className={issueTableColumnClass.kebab}>
                            <ActionMenu
                              actions={[
                                {
                                  cta: () => arrayHelper.remove(i),
                                  id: 'delete-bug',
                                  label: isBug ? 'Delete bug' : 'Delete CVE',
                                },
                              ]}
                            />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                )}
              </Table>
              {!filteredIssues ||
                (filteredIssues?.length === 0 && (
                  <div className="add-issue-section__emptyMsg">{EmptyMsg(issueType)}</div>
                ))}
            </div>
          </>
        );
      }}
    />
  );
};
