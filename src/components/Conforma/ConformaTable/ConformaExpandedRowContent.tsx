import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { ExpandableRowContent, Tr } from '@patternfly/react-table';
import { ChatContextTarget } from '~/components/AIChat';
import { CONFORMA_POLICY_AVAILABLE_RULE_COLLECTIONS_URL } from '~/consts/documentation';
import { UIConformaData } from '~/types/conforma';
import { ExternalLink, Timestamp } from '../../../shared';
import {
  getConformaRuleCollectionContext,
  getConformaRuleDescriptionContext,
  getConformaRuleDetailContext,
  getConformaRuleSolutionContext,
  getConformaRuleTimestampContext,
} from '../conforma-chat-context';
import './ConformaTable.scss';

interface Props {
  obj: UIConformaData;
}

export const ConformaExpandedRowContent: React.FC<Props> = ({ obj }) => {
  if (!obj.description && !obj.collection?.length && !obj.solution && !obj.timestamp) return null;

  return (
    <Tr className="conforma-expanded-row" data-test="conforma-expand-content">
      <ExpandableRowContent>
        <ChatContextTarget {...getConformaRuleDetailContext(obj)}>
          <DescriptionList className="conforma-description-list">
            <ChatContextTarget {...getConformaRuleDescriptionContext(obj)} as="div">
              <DescriptionListGroup>
                <DescriptionListTerm>Rule Description</DescriptionListTerm>
                <DescriptionListDescription>{obj.description ?? '-'}</DescriptionListDescription>
              </DescriptionListGroup>
            </ChatContextTarget>

            {obj.collection?.length ? (
              <ChatContextTarget {...getConformaRuleCollectionContext(obj)} as="div">
                <DescriptionListGroup>
                  <DescriptionListTerm>Collection</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ExternalLink href={CONFORMA_POLICY_AVAILABLE_RULE_COLLECTIONS_URL}>
                      {obj.collection.join(', ')}
                    </ExternalLink>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </ChatContextTarget>
            ) : null}

            {obj.solution ? (
              <ChatContextTarget {...getConformaRuleSolutionContext(obj)} as="div">
                <DescriptionListGroup>
                  <DescriptionListTerm>Solution</DescriptionListTerm>
                  <DescriptionListDescription>{obj.solution}</DescriptionListDescription>
                </DescriptionListGroup>
              </ChatContextTarget>
            ) : null}

            {obj.timestamp ? (
              <ChatContextTarget {...getConformaRuleTimestampContext(obj)} as="div">
                <DescriptionListGroup>
                  <DescriptionListTerm>Effective from</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp timestamp={obj.timestamp} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </ChatContextTarget>
            ) : null}
          </DescriptionList>
        </ChatContextTarget>
      </ExpandableRowContent>
    </Tr>
  );
};
