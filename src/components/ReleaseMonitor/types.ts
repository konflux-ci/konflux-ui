export const columnNames = {
  application: 'Application', // The application name
  component: 'Component', // The component, a number via link
  releasePlan: 'Release Plan', // The ReleasePlan via the application
  tenant: 'Namespace', // Tenant name
  completionTime: 'Completion Time', // Release end time
  name: 'Release Name', // The release trigger from the ReleasePlan
  status: 'Status', // The status of the release
};

export type ColumnNames = typeof columnNames;
