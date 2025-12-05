import * as React from 'react';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { Table /* data-codemods */, Thead, Tbody, Th, Td, Tr } from '@patternfly/react-table';
import { handleURLs } from '../../../../utils/render-utils';

import './NameValueList.scss';

type Item = {
  name: string;
  value: string;
};

type Props = {
  items: Item[];
  descriptionListTestId: string;
  title: string;
  status: string | null;
  compressed?: boolean;
  emptyStatusMessage?: string;
};

const NameValueList: React.FC<React.PropsWithChildren<Props>> = ({
  items,
  status,
  title,
  descriptionListTestId,
  compressed,
  emptyStatusMessage = 'No results available due to failure',
}) => (
  <DescriptionList
    className={css('name-value-list', compressed && 'm-compressed')}
    data-test={descriptionListTestId}
    columnModifier={{
      default: '1Col',
    }}
  >
    <DescriptionListGroup>
      <DescriptionListTerm>{title}</DescriptionListTerm>
      <DescriptionListDescription>
        {status !== 'Failed' ? (
          <Table aria-label="results">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Value</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map(({ name, value }) => (
                <Tr key={`row-${name}`}>
                  <Td className="name-value-list__key">{name}</Td>
                  <Td className="name-value-list__value">{handleURLs(value)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.full}>
              <EmptyStateBody>{emptyStatusMessage}</EmptyStateBody>
            </EmptyState>
          </Bullseye>
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  </DescriptionList>
);

export default NameValueList;
