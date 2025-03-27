import { ApplicationKind } from '~/types';

export const getApplicationDisplayName = (application: ApplicationKind): string =>
  application?.spec?.displayName ?? application?.metadata?.name;
