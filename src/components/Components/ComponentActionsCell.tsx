import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { useComponentV2Actions } from './component-v2-actions';

type ComponentActionsCellProps = {
  componentName?: string;
  version?: string;
  label?: string;
};

const ComponentActionsCell: React.FC<ComponentActionsCellProps> = ({
  componentName,
  version,
  label,
}) => {
  const actions = useComponentV2Actions(componentName, version);
  return (
    <ActionMenu
      actions={actions}
      label={label ?? (componentName ? `Actions for ${componentName}` : undefined)}
    />
  );
};

export default ComponentActionsCell;
