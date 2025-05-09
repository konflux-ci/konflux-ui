import { useQuery } from '@tanstack/react-query';
import { LinkSecretStatus } from '~/components/Secrets/SecretsListView/SecretsListRowWithComponents';
import {
  getLinkedServiceAccounts,
  isLinkableSecret,
} from '~/components/Secrets/utils/service-account-utils';
import { FIVE_MINUTES } from '~/consts/time';
import { SecretKind } from '~/types';

export const useLinkedServiceAccounts = (
  secret: SecretKind | undefined,
  linkingJobStatus?: string | undefined,
) => {
  return useQuery({
    queryKey: ['linked-service-accounts', secret?.metadata?.namespace, secret?.metadata?.name],
    queryFn: () => getLinkedServiceAccounts(secret),
    enabled:
      isLinkableSecret(secret) &&
      (!linkingJobStatus || linkingJobStatus === LinkSecretStatus.Succeeded) &&
      !!secret?.metadata?.namespace &&
      !!secret?.metadata?.name,
    staleTime: FIVE_MINUTES, // keep result within 5 minutes
  });
};
