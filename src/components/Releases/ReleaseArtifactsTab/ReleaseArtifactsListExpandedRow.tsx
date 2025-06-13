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
import { TableData } from '../../../shared';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { ReleaseArtifactsImages } from '../../../types';
import { getImageLink } from './utils/url';

type Props = {
  releaseArtifactImage: ReleaseArtifactsImages;
};

export const ReleaseArtifactsListExpandedRow: React.FC<Props> = ({ releaseArtifactImage }) => {
  if (!releaseArtifactImage?.urls?.length) return null;
  return (
    <Tr className="artifacts-images-expanded-row" data-test="release-artifacts-expand-content">
      <TableData style={{ width: '5%' }}> </TableData>
      <ExpandableRowContent>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Additional URLs</DescriptionListTerm>
            <DescriptionListDescription>
              <Stack>
                {releaseArtifactImage.urls ? (
                  releaseArtifactImage.urls.map((url: string) => (
                    <StackItem key={url} style={{ marginTop: 'var(--pf-v5-global--spacer--sm)' }}>
                      <ExternalLink href={getImageLink(url)} text={url} />
                    </StackItem>
                  ))
                ) : (
                  <Text component={TextVariants.p}> - </Text>
                )}
              </Stack>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </ExpandableRowContent>
    </Tr>
  );
};
