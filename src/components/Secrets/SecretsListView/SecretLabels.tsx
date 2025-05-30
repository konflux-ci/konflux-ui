import { Flex, FlexItem, Label } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { SECRET_MAX_LABELS } from '~/consts/constants';

type SecretLabelsProps = {
  labels: string[];
  isExpanded: boolean;
  onToggle: () => void;
  maxLabels?: number;
};

export const SecretLabels = ({
  labels,
  isExpanded,
  onToggle,
  maxLabels = SECRET_MAX_LABELS,
}: SecretLabelsProps) => {
  const len = labels.length;
  const toggle = (
    <FlexItem>
      <Label
        key="secret-labels-toggle"
        isOverflowLabel
        onClick={() => onToggle()}
        className={css('pf-m-overflow')}
      >
        {isExpanded ? 'Show less' : `${len - maxLabels} more`}
      </Label>
    </FlexItem>
  );

  return len === 0 ? (
    '-'
  ) : (
    <Flex columnGap={{ default: 'columnGapSm' }}>
      {labels.map((l, i) => {
        if (isExpanded || i < maxLabels) {
          return (
            <FlexItem key={l}>
              <Label>{l}</Label>
            </FlexItem>
          );
        }
      })}
      {len > maxLabels && toggle}
    </Flex>
  );
};
