import * as React from 'react';
import {
  Alert,
  Content,
  ContentVariants,
  ExpandableSection,
  Label,
  List,
  ListItem,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import type { ConformaResultRow } from '~/types/conforma';

type ConformaEarlyWarningProps = {
  warningCount: number;
  warnings: ConformaResultRow[];
};

const getDaysUntil = (dateStr?: string): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const ConformaEarlyWarning: React.FC<ConformaEarlyWarningProps> = ({
  warningCount,
  warnings,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (warningCount === 0) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      isInline
      title={`${warningCount} upcoming policy change${warningCount !== 1 ? 's' : ''} require${warningCount === 1 ? 's' : ''} attention`}
      customIcon={<ExclamationTriangleIcon />}
      data-test="conforma-early-warning"
      className="pf-v6-u-mt-md"
    >
      <ExpandableSection
        toggleText={isExpanded ? 'Hide details' : 'Show details'}
        onToggle={(_event, expanded) => setIsExpanded(expanded)}
        isExpanded={isExpanded}
        data-test="conforma-early-warning-details"
      >
        <List isPlain>
          {warnings.map((w, i) => {
            const daysUntil = getDaysUntil(w.timestamp);
            return (
              <ListItem
                key={`${w.code ?? w.title}-${w.component}-${i}`}
                className="pf-v6-u-mb-sm"
              >
                <strong>{w.title}</strong> — {w.component}
                {daysUntil !== null && (
                  <Content component={ContentVariants.small} className="pf-v6-u-mt-xs">
                    {daysUntil > 0
                      ? `Policy activates in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
                      : 'Policy is now active'}
                  </Content>
                )}
                {w.solution && (
                  <Content component={ContentVariants.small} className="pf-v6-u-mt-xs">
                    Remediation: {w.solution}
                  </Content>
                )}
                {daysUntil !== null && (
                  <div className="pf-v6-u-mt-xs">
                    <Label color="red" isCompact>
                      {daysUntil > 0 ? `Activates in ${daysUntil}d` : 'Active now'}
                    </Label>
                  </div>
                )}
              </ListItem>
            );
          })}
        </List>
      </ExpandableSection>
    </Alert>
  );
};
