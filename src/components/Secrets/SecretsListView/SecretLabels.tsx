import { Button, Label } from '@patternfly/react-core';
import { SECRET_MAX_LABELS } from '~/consts/secrets';
import './SecretsListRow.scss';

type SecretLabelsProps = {
  labels: string[];
  index: number;
  expanded: boolean;
  handleToggle: (index: number) => void;
  maxLabels?: number;
};

export const SecretLabels = ({
  labels,
  index,
  expanded,
  handleToggle,
  maxLabels = SECRET_MAX_LABELS,
}: SecretLabelsProps) => {
  return labels.length === 0 ? (
    '-'
  ) : (
    <>
      {labels.map((l, i) => {
        if (expanded || i <= maxLabels) {
          return (
            <Label key={l} className="secret-label">
              {l}
            </Label>
          );
        }
      })}
      {labels.length > maxLabels && (
        <Button variant="link" onClick={() => handleToggle(index)} className="secret-labels-toggle">
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </>
  );
};
