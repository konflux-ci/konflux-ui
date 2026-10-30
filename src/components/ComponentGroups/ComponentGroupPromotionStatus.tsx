import { Label } from '@patternfly/react-core';
import { ComponentGroupKind } from '~/types';

type Props = {
  group: ComponentGroupKind;
};

const ComponentGroupPromotionStatus: React.FC<Props> = ({ group }) => {
  const candidateList = group.status?.globalCandidateList ?? [];
  const promoted = candidateList.filter((c) => c.lastPromotedImage).length;
  const total = candidateList.length;

  if (total === 0) {
    return <span data-test="component-group-no-promotions">-</span>;
  }

  const allPromoted = promoted === total;
  return (
    <Label
      data-test="component-group-promotion-status"
      color={allPromoted ? 'green' : promoted === 0 ? 'grey' : 'orange'}
    >
      {promoted}/{total} promoted
    </Label>
  );
};

export default ComponentGroupPromotionStatus;
