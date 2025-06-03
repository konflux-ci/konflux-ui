import { useEffect, useState } from 'react';
import { LINKING_ERROR_ANNOTATION } from '~/consts/secrets';
import { K8sGetResource } from '~/k8s';
import { SecretModel } from '~/models/secret';
import { SecretKind } from '~/types';

export const useSecretLinkingError = (namespace: string, secretName: string) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSecret = async () => {
      setLoading(true);
      try {
        const secret = await K8sGetResource<SecretKind>({
          model: SecretModel,
          queryOptions: { ns: namespace, name: secretName },
        });

        const annotation = secret.metadata.annotations?.[LINKING_ERROR_ANNOTATION] ?? null;
        setErrorMessage(annotation);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    void fetchSecret();
  }, [namespace, secretName]);

  return { errorMessage, loading, error };
};
