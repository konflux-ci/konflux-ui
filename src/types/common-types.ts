export type ResourceStatusCondition = {
  type: string;
  status: 'True' | 'False';
  reason: 'OK' | 'Error';
  message: string;
  lastTransitionTime?: string;
};

export type WorkspaceInfoProps = {
  namespace: string;
  workspace: string;
};
