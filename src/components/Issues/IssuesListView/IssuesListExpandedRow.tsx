import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { ExpandableRowContent, Tr } from '@patternfly/react-table';
import { TableData } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { IssueRow } from './IssuesListRow';

type Props = {
  obj: IssueRow;
};

export const IssuesListExpandedRow: React.FC<Props> = ({ obj: issue }) => {
  const hasContent = issue.links?.length || issue.description;

  if (!hasContent) return null;

  return (
    <Tr className="issues-list-expanded-row" data-test="issues-list-expand-content">
      <TableData style={{ width: '5%' }}> </TableData>
      <ExpandableRowContent>
        <DescriptionList>
          {issue.description && (
            <DescriptionListGroup>
              <DescriptionListTerm>Details</DescriptionListTerm>
              <DescriptionListDescription>
                <Text component={TextVariants.p}>{issue.description}</Text>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {issue.links?.length > 0 && (
            <DescriptionListGroup>
              <DescriptionListTerm>Related Links</DescriptionListTerm>
              <DescriptionListDescription>
                <Stack hasGutter>
                  {issue.links.map((link, index) => (
                    <StackItem key={`${link}-${index}`}>
                      <ExternalLink href={link} />
                    </StackItem>
                  ))}
                </Stack>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          <DescriptionListGroup>
            <DescriptionListTerm>Scope</DescriptionListTerm>
            <DescriptionListDescription>
              <Text component={TextVariants.p}>
                <strong>{issue.scope.resourceType}</strong>: {issue.scope.resourceName} (
                {issue.scope.resourceNamespace})
              </Text>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Issue Type</DescriptionListTerm>
            <DescriptionListDescription>
              <Text component={TextVariants.p}>{issue.issueType}</Text>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Detected At</DescriptionListTerm>
            <DescriptionListDescription>
              <Text component={TextVariants.p}>{issue.detectedAt}</Text>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </ExpandableRowContent>
    </Tr>
  );
};
