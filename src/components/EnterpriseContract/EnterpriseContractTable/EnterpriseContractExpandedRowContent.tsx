import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { ExpandableRowContent, Tr } from '@patternfly/react-table';
import { ExternalLink, Timestamp } from '../../../shared';
import { UIEnterpriseContractData } from '../types';

import './EnterpriceContractTable.scss';

interface Props {
  obj: UIEnterpriseContractData;
}

export const EnterpriseContractExpandedRowContent: React.FC<Props> = ({ obj }) => {
  if (!obj.description && !obj.collection?.length && !obj.solution && !obj.timestamp) return null;

  return (
    <Tr className="ex-expanded-row" data-test="ec-expand-content">
      <ExpandableRowContent>
        <DescriptionList className="ec-description-list">
          <DescriptionListGroup>
            <DescriptionListTerm>Rule Description</DescriptionListTerm>
            <DescriptionListDescription>{obj.description ?? '-'}</DescriptionListDescription>
          </DescriptionListGroup>

          {obj.collection?.length ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Collection</DescriptionListTerm>
              <DescriptionListDescription>
                <ExternalLink href="https://enterprisecontract.dev/docs/ec-policies/release_policy.html#_available_rule_collections">
                  {obj.collection.join(', ')}
                </ExternalLink>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}

          {obj.solution ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Solution</DescriptionListTerm>
              <DescriptionListDescription>{obj.solution}</DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}

          {obj.timestamp ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Effective from</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={obj.timestamp} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
        </DescriptionList>
      </ExpandableRowContent>
    </Tr>
  );
};
