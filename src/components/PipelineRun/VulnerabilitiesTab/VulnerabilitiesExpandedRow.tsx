import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  List,
  ListItem,
} from '@patternfly/react-core';
import type { RoxctlCveTableRow } from '~/components/PipelineRun/VulnerabilitiesTab/types';
import ExternalLink from '~/shared/components/links/ExternalLink';

type VulnerabilitiesExpandedRowProps = {
  vulnerability: RoxctlCveTableRow;
};

const formatAffectedPackage = ({
  name,
  version,
  source,
}: RoxctlCveTableRow['components'][number]): string =>
  `${name} ${version}${source ? ` (${source})` : ''}`;

export const VulnerabilitiesExpandedRow: React.FC<VulnerabilitiesExpandedRowProps> = ({
  vulnerability,
}) => {
  const referencesByLink = new Map<string, string>();

  vulnerability.links?.forEach((link) => {
    if (link && link !== vulnerability.link) {
      referencesByLink.set(link, link);
    }
  });

  vulnerability.advisory?.forEach(({ name, link }) => {
    if (link && link !== vulnerability.link) {
      referencesByLink.set(link, name || link);
    }
  });

  const references = Array.from(referencesByLink, ([link, label]) => ({ link, label }));

  return (
    <DescriptionList isCompact isHorizontal aria-label={`${vulnerability.cve} details`}>
      <DescriptionListGroup>
        <DescriptionListTerm>Description</DescriptionListTerm>
        <DescriptionListDescription>{vulnerability.summary ?? '-'}</DescriptionListDescription>
      </DescriptionListGroup>

      {references.length ? (
        <DescriptionListGroup>
          <DescriptionListTerm>References</DescriptionListTerm>
          <DescriptionListDescription>
            <List isPlain>
              {references.map(({ link, label }) => (
                <ListItem key={link}>
                  <ExternalLink href={link}>{label}</ExternalLink>
                </ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}

      {vulnerability.components.length > 1 ? (
        <DescriptionListGroup>
          <DescriptionListTerm>Affected packages</DescriptionListTerm>
          <DescriptionListDescription>
            <List isPlain>
              {vulnerability.components.map((component) => (
                <ListItem key={`${component.name}-${component.version}-${component.source ?? ''}`}>
                  {formatAffectedPackage(component)}
                </ListItem>
              ))}
            </List>
          </DescriptionListDescription>
        </DescriptionListGroup>
      ) : null}
    </DescriptionList>
  );
};
