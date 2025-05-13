import * as React from 'react';
import { useAuth } from '../../auth/useAuth';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { Action } from '../../shared/components/action-menu/types';
import { useNamespace } from '../../shared/providers/Namespace/useNamespaceInfo';
import { ReleaseKind } from '../../types';
import { releaseRerun } from '../../utils/release-actions';

export const useReleaseActions = (release: ReleaseKind): Action[] => {
  const namespace = useNamespace();
  const applicationName = release.metadata?.labels?.[PipelineRunLabel.APPLICATION] ?? '';
  const releaseName = release.metadata?.name;
  const {
    user: { email },
  } = useAuth();

  const actions: Action[] = React.useMemo(() => {
    if (!release) {
      return [];
    }
    const updatedActions: Action[] = [
      {
        cta: () => releaseRerun(release, email),
        id: 're-run-release',
        label: 'Re-run release',
        analytics: {
          link_name: 're-run-release',
          link_location: 'release-actions',
          release_name: releaseName,
          app_name: applicationName,
          namespace,
        },
      },
    ];
    return updatedActions;
  }, [release, releaseName, applicationName, namespace, email]);

  return actions;
};
