import * as React from 'react';
import {
  EmptyState,
  EmptyStateBody,
  TextContent,
  TextVariants,
  Text,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { Table, Tbody } from '@patternfly/react-table';
import { FieldArray, useField } from 'formik';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useDeepCompareMemoize } from '~/shared';
import FilteredEmptyState from '../../../../../shared/components/empty-state/FilteredEmptyState';
import { AddIssueModal, IssueType } from './AddIssueModal';
import './AddIssueSection.scss';
import BugTableHead from './BugTableHead';
import BugTableRow from './BugTableRow';
import CVETableHead from './CVETableHead';
import CVETableRow from './CVETableRow';
import { BugObject, CVEObject, IssueObject } from './types';

interface AddIssueSectionProps {
  field: string;
  issueType: IssueType;
}

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
          {type === IssueType.BUG ? 'No Jira issues found' : 'No CVEs found'}
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
                  ? 'Are there any Jira issues you would like to add to this release?'
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
                {isBug ? <BugTableHead /> : <CVETableHead />}
                {Array.isArray(filteredIssues) && filteredIssues.length > 0 && (
                  <Tbody data-test="issue-table-body">
                    {filteredIssues.map((issue, i) => {
                      const bugObject = issue as BugObject;
                      const cveObject = issue as CVEObject;

                      if (isBug) {
                        return (
                          <BugTableRow
                            key={bugObject.id}
                            arrayHelper={arrayHelper}
                            bug={bugObject}
                            index={i}
                          />
                        );
                      }

                      return (
                        <CVETableRow
                          key={cveObject.key}
                          arrayHelper={arrayHelper}
                          cve={cveObject}
                          index={i}
                        />
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
