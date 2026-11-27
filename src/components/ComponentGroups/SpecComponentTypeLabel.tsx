import { Label } from '@patternfly/react-core';
import { ComponentReference } from '~/types';

type Props = {
  component: Pick<ComponentReference, 'kind'>;
};

const SpecComponentTypeLabel: React.FC<Props> = ({ component }) => {
  const isComponentGroup = component.kind?.toLowerCase() === 'componentgroup';

  return (
    <Label color={isComponentGroup ? 'blue' : 'grey'}>
      {isComponentGroup ? 'Group' : 'Component'}
    </Label>
  );
};

export default SpecComponentTypeLabel;
