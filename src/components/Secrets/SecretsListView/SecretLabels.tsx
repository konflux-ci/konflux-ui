import { Label, LabelGroup } from '@patternfly/react-core';
import { SECRET_MAX_LABELS } from '~/consts/secrets';
import './SecretsListRow.scss';

type SecretLabelsProps = {
  labels: string[];
  maxLabels?: number;
};

export const SecretLabels = ({ labels, maxLabels = SECRET_MAX_LABELS }: SecretLabelsProps) => {
  return labels.length === 0 ? (
    '-'
  ) : (
    <LabelGroup numLabels={maxLabels} className="pf-v5-u-my-xs">
      {labels.map((l) => (
        <Label key={l}>{l}</Label>
      ))}
    </LabelGroup>
  );
};
