import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { useComponentV2Actions } from './component-v2-actions';

const ComponentListActionCell: React.FC<{ componentName?: string }> = ({ componentName }) => {
  const actions = useComponentV2Actions(componentName);
  return <ActionMenu actions={actions} />;
};

export default ComponentListActionCell;
