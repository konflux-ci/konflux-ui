import { ReleaseKind } from '~/types';
import {
  getFinalFromRelease,
  getManagedProcessingFromRelease,
  getNamespaceAndPRName,
  getTenantCollectorProcessingFromRelease,
  getTenantProcessingFromRelease,
} from '~/utils/release-utils';

export interface PipelineRunProcessing {
  type: string;
  startTime: string | null;
  completionTime: string;
  snapshot: string;
  pipelineRun: string;
  prNamespace: string;
}

export const getReleasePipelineRuns = (release: ReleaseKind): PipelineRunProcessing[] => {
  const stages = [
    { type: 'Tenant Collector', processing: getTenantCollectorProcessingFromRelease(release) },
    { type: 'Tenant', processing: getTenantProcessingFromRelease(release) },
    { type: 'Final', processing: getFinalFromRelease(release) },
    { type: 'Managed', processing: getManagedProcessingFromRelease(release) },
  ];
  return stages.flatMap(({ type, processing }) => {
    const [prNamespace, pipelineRun] = getNamespaceAndPRName(processing?.pipelineRun);
    if (!prNamespace || !pipelineRun) return [];
    return [
      {
        type,
        startTime: processing.startTime ?? null,
        completionTime: processing.completionTime ?? '',
        snapshot: release.spec.snapshot,
        pipelineRun,
        prNamespace,
      },
    ];
  });
};
