import * as React from 'react';
import { useReleasePlans } from '~/hooks/useReleasePlans';
import { ReleasePlanKind } from '~/types/coreBuildService';

type ReleasePlansInNamespaceProps = {
  namespace: string;
  onReleasePlansLoaded: (namespace: string, releasePlans: ReleasePlanKind[]) => void;
  onError: (error: unknown) => void;
};

const ReleasePlansInNamespace: React.FC<ReleasePlansInNamespaceProps> = ({
  namespace,
  onReleasePlansLoaded,
  onError,
}) => {
  const [data, loaded, error] = useReleasePlans(namespace);

  React.useEffect(() => {
    if (loaded) {
      if (error) {
        onError(error);
      } else if (data) {
        onReleasePlansLoaded(namespace, data);
      }
    }
  }, [data, loaded, error, namespace, onError, onReleasePlansLoaded]);

  return null;
};

export default ReleasePlansInNamespace;
