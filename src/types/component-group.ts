import { ResourceStatusCondition } from './common-types';
import { K8sResourceCommon } from './k8s';

export type ComponentReferenceKind = 'component' | 'componentGroup';

export type ComponentVersionReference = {
  name: string;
  version?: string;
  context?: string;
};

export type ComponentReference = {
  name: string;
  kind?: ComponentReferenceKind;
  /** Can only be set if `kind` is `component` or omitted */
  componentVersion?: ComponentVersionReference;
};

export type TestGraphNode = {
  name: string;
  failFast?: boolean;
};

export type ResolverParameter = {
  name: string;
  value: string;
};

export type ComponentGroupTaskRef = {
  resolver: string;
  params: ResolverParameter[];
};

export type SnapshotCreatorSpec = {
  taskRef?: ComponentGroupTaskRef;
};

export type ComponentGroupSpec = {
  components: ComponentReference[];
  testGraph?: Record<string, TestGraphNode[]>;
  /** Do not use yet, reserved for future implementation */
  snapshotCreator?: SnapshotCreatorSpec;
};

export type ComponentState = {
  name: string;
  /** Required when multiple versions of the same Component are in the group */
  version?: string;
  url?: string;
  lastPromotedImage?: string;
  lastPromotedCommit?: string;
  /** Format: RFC3339 (e.g., "2026-08-13T12:00:00Z") */
  lastPromotedBuildTime?: string;
};

export type ComponentGroupStatus = {
  conditions?: ResourceStatusCondition[];
  globalCandidateList?: ComponentState[];
};

export type ComponentGroupKind = K8sResourceCommon & {
  spec: ComponentGroupSpec;
  status?: ComponentGroupStatus;
};
