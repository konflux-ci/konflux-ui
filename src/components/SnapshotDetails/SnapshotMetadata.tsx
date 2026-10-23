import { ReactNode } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Title,
} from '@patternfly/react-core';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';

type Props = {
  creationTimestamp?: string;
  triggeredBy?: ReactNode;
  vulnerabilities: ReactNode;
};

const SnapshotMetadata = ({ creationTimestamp, triggeredBy, vulnerabilities }: Props) => (
  <>
    <Title headingLevel="h4" className="pf-v6-c-title pf-v6-u-mt-lg pf-v6-u-mb-lg" size="lg">
      Snapshot details
    </Title>
    <Flex>
      <Flex flex={{ default: 'flex_3' }}>
        <FlexItem>
          <DescriptionList data-test="snapshot-details" columnModifier={{ default: '1Col' }}>
            <DescriptionListGroup>
              <DescriptionListTerm>Created at</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={creationTimestamp ?? '-'} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            {triggeredBy && (
              <DescriptionListGroup>
                <DescriptionListTerm>Triggered by</DescriptionListTerm>
                <DescriptionListDescription data-test="snapshot-commit-link">
                  {triggeredBy}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </FlexItem>
      </Flex>
      <Flex flex={{ default: 'flex_3' }}>
        <FlexItem>
          <DescriptionList data-test="snapshot-details" columnModifier={{ default: '1Col' }}>
            <DescriptionListGroup>
              <DescriptionListTerm>Vulnerabilities</DescriptionListTerm>
              <DescriptionListDescription>{vulnerabilities}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </FlexItem>
      </Flex>
    </Flex>
  </>
);

export default SnapshotMetadata;
