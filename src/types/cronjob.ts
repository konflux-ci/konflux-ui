import { K8sResourceCommon } from './k8s';

export type CronJob = K8sResourceCommon & {
  spec: {
    schedule: string;
    suspend?: boolean;
    jobTemplate: {
      spec: {
        template: {
          spec: {
            containers: Array<{
              name: string;
              image: string;
              command?: string[];
              args?: string[];
              [key: string]: unknown;
            }>;
            restartPolicy: string;
            [key: string]: unknown;
          };
        };
      };
    };
    successfulJobsHistoryLimit?: number;
    failedJobsHistoryLimit?: number;
    startingDeadlineSeconds?: number;
    concurrencyPolicy?: 'Allow' | 'Forbid' | 'Replace';
    [key: string]: unknown;
  };
}; 