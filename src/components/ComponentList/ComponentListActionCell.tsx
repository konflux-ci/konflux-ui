import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { useComponentActions } from './component-actions';

const ComponentListActionCell: React.FC<{ componentName?: string }> = ({ componentName }) => {
  const actions = useComponentActions(componentName);
  return <ActionMenu actions={actions} />;
};

export default ComponentListActionCell;
