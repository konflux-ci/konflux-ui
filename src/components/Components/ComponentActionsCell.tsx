import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { ComponentKind } from '~/types';
import { useComponentV2Actions } from './component-v2-actions';

type ComponentActionsCellProps = {
  component?: ComponentKind;
  version?: string;
  label?: string;
};

const ComponentActionsCell: React.FC<ComponentActionsCellProps> = ({
  component,
  version,
  label,
}) => {
  const actions = useComponentV2Actions(component, version);
  return (
    <ActionMenu
      actions={actions}
      label={label ?? (component ? `Actions for ${component.metadata?.name}` : undefined)}
    />
  );
};

export default ComponentActionsCell;
