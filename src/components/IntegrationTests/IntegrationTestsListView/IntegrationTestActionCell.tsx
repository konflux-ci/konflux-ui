import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { useIntegrationTestActions } from './useIntegrationTestActions';

const IntegrationTestActionCell: React.FC<{ obj: IntegrationTestScenarioKind }> = ({ obj }) => {
  const actions = useIntegrationTestActions(obj);
  return <ActionMenu actions={actions} />;
};

export default IntegrationTestActionCell;
