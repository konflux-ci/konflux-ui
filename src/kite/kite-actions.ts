import * as React from 'react';
import { ModalVariant } from '@patternfly/react-core';
import { useQueryClient } from '@tanstack/react-query';
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import ErrorModal from '~/components/modal/ErrorModal';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { Issue, IssueState } from '~/kite/issue-type';
import { logger } from '~/monitoring/logger';
import { Action } from '~/shared/components/action-menu/types';
import { PLUGIN_KITE } from './const';
import { resolveIssue } from './kite-fetch';

export const useIssueActions = (issue: Issue): Action[] => {
  const queryClient = useQueryClient();
  const showModal = useModalLauncher();
  const isResolved = issue.state === IssueState.RESOLVED;

  return React.useMemo(
    () => [
      {
        id: `resolve-${issue.id}`,
        label: 'Resolve',
        disabled: isResolved,
        disabledTooltip: isResolved ? 'Issue is already resolved' : undefined,
        cta: () => {
          void resolveIssue(issue.id, issue.namespace)
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: [PLUGIN_KITE] });
            })
            .catch((error: unknown) => {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to resolve issue', err, { issueId: issue.id });
              showModal?.(
                createModalLauncher(ErrorModal, {
                  'data-test': 'resolve-issue-error-modal',
                  variant: ModalVariant.small,
                  title: 'Failed to resolve issue',
                })({ errorMessage: err.message }),
              );
            });
        },
      },
    ],
    [issue.id, issue.namespace, isResolved, queryClient, showModal],
  );
};
