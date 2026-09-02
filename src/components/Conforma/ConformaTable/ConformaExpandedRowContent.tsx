import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { ExpandableRowContent, Tr } from '@patternfly/react-table';
import { CONFORMA_POLICY_AVAILABLE_RULE_COLLECTIONS_URL } from '~/consts/documentation';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { ConformaResultRow } from '~/types/conforma';
import './ConformaTable.scss';

interface Props {
  obj: ConformaResultRow;
}

export const ConformaExpandedRowContent: React.FC<Props> = ({ obj }) => {
  if (!obj.description && !obj.collection?.length && !obj.solution && !obj.timestamp) return null;

  return (
    <Tr className="conforma-expanded-row" data-test="conforma-expand-content">
      <ExpandableRowContent>
        <DescriptionList className="conforma-description-list">
          <DescriptionListGroup>
            <DescriptionListTerm>Rule Description</DescriptionListTerm>
            <DescriptionListDescription>{obj.description ?? '-'}</DescriptionListDescription>
          </DescriptionListGroup>

          {obj.collection?.length ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Collection</DescriptionListTerm>
              <DescriptionListDescription>
                <ExternalLink href={CONFORMA_POLICY_AVAILABLE_RULE_COLLECTIONS_URL}>
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
