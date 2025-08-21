import React from 'react';
import { ExpandableSection, FormSection } from '@patternfly/react-core';
import { useField } from 'formik';
import { getErrorState } from '~/shared/utils/error-utils';
import HelpPopover from '../../../components/HelpPopover';
import { useRoleMap } from '../../../hooks/useRole';
import DropdownField from '../../../shared/components/formik-fields/DropdownField';
import { NamespaceRole } from '../../../types';
import { PermissionsTable } from './PermissionsTable';
import './RoleSection.scss';

export const RoleSection: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [{ value: role }] = useField<NamespaceRole>('role');
  const [roleMap, loaded, error] = useRoleMap();

  const dropdownItems =
    loaded && roleMap
      ? Object.entries(roleMap?.roleMap).map(([key, value]) => ({
          key,
          value,
          description: roleMap.roleDescription[key],
        }))
      : [];

  return (
    <>
      <FormSection title="Assign role">
        {error ? (
          getErrorState(error, loaded, 'roles', true)
        ) : (
          <DropdownField
            className="role-section"
            name="role"
            placeholder={!loaded ? 'Loading...' : 'Select role'}
            label="Select a role to assign to all of the users you added."
            helpText="Provides access to all permissions except the ability to add or delete certain resources. To view a full list of permissions, refer to the following table."
            data-test="role-input"
            labelIcon={
              <HelpPopover
                aria-label="Usernames in RHTAP"
                headerContent="About default roles and permissions"
                bodyContent="At this time we do not offer custom roles. You can only assign the default roles."
              />
            }
            isDisabled={!loaded}
            items={dropdownItems}
            validateOnChange
            required
          />
        )}
      </FormSection>

      {role && (
        <ExpandableSection toggleText={`Show list of permissions for the ${role}`}>
          <PermissionsTable role={role} />
        </ExpandableSection>
      )}
    </>
  );
};
