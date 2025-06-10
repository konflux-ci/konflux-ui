export const BackgroundJobActions = {
  LinkSecretToServiceAccounts: 'LinkSecretToSeriveAccounts',
};

export type BackgroundJobAction = (typeof BackgroundJobActions)[keyof typeof BackgroundJobActions];

export interface BackgroundTaskPageInfo {
  pageName: string;
  action: BackgroundJobAction;
}

export const BackgroundTaskInfo: Record<string, BackgroundTaskPageInfo> = {
  SecretTask: {
    pageName: 'Secrets List',
    action: BackgroundJobActions.LinkSecretToServiceAccounts,
  },
};
