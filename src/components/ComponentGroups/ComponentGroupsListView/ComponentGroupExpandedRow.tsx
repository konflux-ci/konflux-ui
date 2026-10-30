import { Link } from 'react-router-dom';
import { Table as PFTable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { COMPONENT_DETAILS_V2_PATH, GROUP_DETAILS_PATH } from '@routes/paths';
import ComponentGroupPromotionStatus from '~/components/ComponentGroups/ComponentGroupPromotionStatus';
import SpecComponentTypeLabel from '~/components/ComponentGroups/SpecComponentTypeLabel';
import LatestPushBuildSection from '~/components/LatestBuild/LatestPushBuildSection';
import { ComponentGroupKind, ComponentReference } from '~/types';

type Props = {
  groupName: string;
  namespace: string;
  components: ComponentReference[];
  allGroups: ComponentGroupKind[];
};

type BuildStatusCellProps = {
  isComponentGroup: boolean;
  allGroups: ComponentGroupKind[];
  component: ComponentReference;
};
const BuildStatusCell: React.FC<BuildStatusCellProps> = ({
  isComponentGroup,
  allGroups,
  component,
}) => {
  if (!isComponentGroup) {
    return (
      <LatestPushBuildSection
        componentName={component.name}
        version={component.componentVersion?.version}
      />
    );
  }

  const group = allGroups.find((g) => g.metadata?.name === component.name);

  if (!group) {
    return <span>-</span>;
  }

  return <ComponentGroupPromotionStatus group={group} />;
};

export const ComponentGroupExpandedRow: React.FC<Props> = ({
  groupName,
  namespace,
  components,
  allGroups,
}) => {
  return (
    <PFTable
      aria-label={`Components and groups in ${groupName}.`}
      data-test="group-detail-table-rows"
      variant="compact"
    >
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Type</Th>
          <Th>Build/Promotion status</Th>
        </Tr>
      </Thead>
      <Tbody>
        {components.map((component) => {
          const isComponentGroup = component.kind?.toLowerCase() === 'componentgroup';
          const rowKey = `${isComponentGroup ? 'group' : 'component'}-${component.name}-${component.componentVersion?.version ?? ''}`;

          return (
            <Tr key={rowKey}>
              <Td dataLabel="Name">
                <Link
                  data-test="component-name"
                  to={
                    isComponentGroup
                      ? GROUP_DETAILS_PATH.createPath({
                          workspaceName: namespace,
                          groupName: component.name,
                        })
                      : COMPONENT_DETAILS_V2_PATH.createPath({
                          workspaceName: namespace,
                          componentName: component.name,
                        })
                  }
                >
                  {component.name ?? '-'}
                </Link>
              </Td>
              <Td dataLabel="Type">
                <SpecComponentTypeLabel component={component} />
              </Td>
              <Td dataLabel="Build/Promotion status">
                <BuildStatusCell
                  isComponentGroup={isComponentGroup}
                  allGroups={allGroups}
                  component={component}
                />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </PFTable>
  );
};

export default ComponentGroupExpandedRow;
