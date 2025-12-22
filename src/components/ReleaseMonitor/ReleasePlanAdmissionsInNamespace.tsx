import * as React from 'react';
import { useReleasePlanAdmissions } from '~/hooks/useReleasePlanAdmissions';
import { ReleasePlanAdmissionKind } from '~/types/release-plan-admission';

type ReleasePlanAdmissionsInNamespaceProps = {
  namespace: string;
  onReleasePlanAdmissionsLoaded: (namespace: string, rpas: ReleasePlanAdmissionKind[]) => void;
  onError: (error: unknown) => void;
};

const ReleasePlanAdmissionsInNamespace: React.FC<ReleasePlanAdmissionsInNamespaceProps> = ({
  namespace,
  onReleasePlanAdmissionsLoaded,
  onError,
}) => {
  const [data, loaded, error] = useReleasePlanAdmissions(namespace);

  React.useEffect(() => {
    if (loaded) {
      if (error) {
        // Ignore permission errors (403 Forbidden) for inaccessible namespaces
        // Just treat them as empty data instead of failing the entire page
        const isPermissionError =
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error.code === 403 || error.code === 401);

        if (isPermissionError) {
          // Silently ignore permission errors and return empty data
          onReleasePlanAdmissionsLoaded(namespace, []);
        } else {
          // For other errors, still report them (but this could also be changed to ignore all RPA errors)
          onError(error);
        }
      } else {
        // Always call the callback when loaded (even if data is falsy)
        // to prevent parent component from waiting indefinitely
        onReleasePlanAdmissionsLoaded(namespace, data || []);
      }
    }
  }, [data, loaded, error, namespace, onError, onReleasePlanAdmissionsLoaded]);

  return null;
};

export default ReleasePlanAdmissionsInNamespace;
