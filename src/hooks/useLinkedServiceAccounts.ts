import { useQuery } from '@tanstack/react-query';
import {
  getLinkedServiceAccounts,
  isLinkableSecret,
} from '~/components/Secrets/utils/service-account-utils';
import { FIVE_MINUTES } from '~/consts/time';
import { SecretKind } from '~/types';

export const useLinkedServiceAccounts = (secret: SecretKind | undefined) => {
  return useQuery({
    queryKey: ['linked-service-accounts', secret?.metadata?.namespace, secret?.metadata?.name],
    queryFn: () => getLinkedServiceAccounts(secret),
    enabled: isLinkableSecret(secret) && !!secret?.metadata?.namespace && !!secret?.metadata?.name,
    staleTime: FIVE_MINUTES,
  });
};
