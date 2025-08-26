const VALID_WIDTH_CLASSES = [10, 15, 20, 25, 30, 33, 40, 50];

const getValidWidthClass = (targetWidth: number): number => {
  return VALID_WIDTH_CLASSES.reduce((closest, current) =>
    Math.abs(current - targetWidth) < Math.abs(closest - targetWidth) ? current : closest,
  );
};

export interface ColumnConfig {
  base: number;
  min: number;
  priority: 1 | 2 | 3 | 4;
}

export interface DynamicColumnOptions {
  specialClasses?: Record<string, string>;
}

export const generateDynamicColumnClasses = <T extends string>(
  visibleColumns: Set<T>,
  columnConfigs: Record<string, ColumnConfig>,
  options: DynamicColumnOptions = {},
): Record<string, string> => {
  const visibleColumnsList = Array.from(visibleColumns);
  const totalColumns = visibleColumnsList.length + 1;
  const classes: Record<string, string> = {};
  const { specialClasses = {} } = options;

  const totalConfigWidth =
    visibleColumnsList.reduce((sum, column) => {
      const config = columnConfigs[column];
      return config ? sum + config.base : sum;
    }, 0) + 5;

  visibleColumnsList.forEach((column) => {
    const config = columnConfigs[column];
    if (!config) {
      return;
    }

    const proportionalWidth = Math.round((config.base / totalConfigWidth) * 100);
    const validWidth = getValidWidthClass(Math.min(proportionalWidth, 50));
    const specialClass = specialClasses[column] ? ` ${specialClasses[column]}` : '';

    if (totalColumns <= 4) {
      classes[column] = `pf-m-width-${validWidth}${specialClass}`;
    } else if (totalColumns <= 6) {
      const mobileWidth = getValidWidthClass(validWidth * 0.8);
      classes[column] = `pf-m-width-${mobileWidth} pf-m-width-${validWidth}-on-lg${specialClass}`;
    } else {
      const compactWidth = getValidWidthClass(Math.max(validWidth * 0.7, 10));
      if (config.priority > 3) {
        classes[column] =
          `pf-m-hidden pf-m-visible-on-md pf-m-width-${compactWidth}-on-md pf-m-width-${validWidth}-on-xl${specialClass}`;
      } else if (config.priority > 1) {
        classes[column] =
          `pf-m-hidden pf-m-visible-on-sm pf-m-width-${compactWidth}-on-sm pf-m-width-${validWidth}-on-xl${specialClass}`;
      } else {
        classes[column] =
          `pf-m-width-${compactWidth} pf-m-width-${validWidth}-on-xl${specialClass}`;
      }
    }
  });

  classes.kebab = 'pf-v5-c-table__action';
  return classes;
};

export const createColumnConfig = (
  base: number,
  min: number,
  priority: 1 | 2 | 3 | 4,
): ColumnConfig => ({
  base,
  min,
  priority,
});

export const COMMON_COLUMN_CONFIGS: Record<string, ColumnConfig> = {
  name: createColumnConfig(20, 15, 1),
  status: createColumnConfig(10, 8, 2),
  created: createColumnConfig(12, 10, 2),
  started: createColumnConfig(12, 10, 2),
  startTime: createColumnConfig(12, 10, 2),
  duration: createColumnConfig(10, 8, 3),
  type: createColumnConfig(10, 8, 3),
  namespace: createColumnConfig(12, 10, 4),
  component: createColumnConfig(15, 12, 2),
  snapshot: createColumnConfig(15, 12, 3),
  reference: createColumnConfig(15, 12, 4),
  vulnerabilities: createColumnConfig(15, 12, 3),
  branch: createColumnConfig(15, 10, 2),
  byUser: createColumnConfig(12, 10, 4),
  committedAt: createColumnConfig(15, 12, 3),
  testResult: createColumnConfig(10, 10, 3),
  trigger: createColumnConfig(8, 8, 4),
  completionTime: createColumnConfig(15, 12, 4),
  releasePlan: createColumnConfig(15, 12, 3),
  releaseSnapshot: createColumnConfig(18, 15, 3),
  tenantCollectorPipelineRun: createColumnConfig(15, 12, 4),
  tenantPipelineRun: createColumnConfig(15, 12, 4),
  managedPipelineRun: createColumnConfig(15, 12, 4),
  finalPipelineRun: createColumnConfig(15, 12, 4),
  kebab: createColumnConfig(5, 5, 1),
};
