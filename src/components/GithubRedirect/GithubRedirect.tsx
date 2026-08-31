import * as React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { Bullseye, Flex, HelperText, HelperTextItem, Spinner } from '@patternfly/react-core';
import { ArrivalSource, refineArrivalSource } from '~/analytics/arrival-source';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { getErrorState } from '~/shared/utils/error-utils';
import { GitProvider } from '~/shared/utils/git-utils';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { GithubRedirectRouteParams } from '../../routes/utils';

// All PAC-reported providers except UNSURE/INVALID — the git-provider label
// is reliable regardless of hosting (unlike document.referrer, this also
// covers self-hosted Forgejo instances with no fixed domain).
const KNOWN_GIT_PROVIDERS = new Set<ArrivalSource>([
  GitProvider.GITHUB,
  GitProvider.GITLAB,
  GitProvider.BITBUCKET,
  GitProvider.FORGEJO,
]);

const GithubRedirect: React.FC = () => {
  const { pathname } = useLocation();
  const { ns, pipelineRunName, taskName } = useParams<GithubRedirectRouteParams>();
  const isLogsTabSelected = pathname.includes('/logs');
  const [pr, loaded, error] = usePipelineRunV2(ns, pipelineRunName);

  // Pure derivation during render — the actual sessionStorage write happens
  // in the effect below, never here, to keep render side-effect-free.
  const gitProvider =
    loaded && !error && pr
      ? ((pr.metadata.labels?.[PipelineRunLabel.COMMIT_PROVIDER_LABEL] ??
          pr.metadata.annotations?.[PipelineRunLabel.COMMIT_PROVIDER_LABEL]) as
          | ArrivalSource
          | undefined)
      : undefined;

  React.useEffect(() => {
    if (gitProvider && KNOWN_GIT_PROVIDERS.has(gitProvider)) {
      refineArrivalSource(gitProvider);
    }
  }, [gitProvider]);

  if (error) {
    return getErrorState(error, loaded, 'pipeline run');
  }

  const application =
    loaded && !error ? pr.metadata.labels[PipelineRunLabel.APPLICATION] : undefined;

  const navigateUrl = `/ns/${ns}${
    application
      ? `/applications/${application}${pipelineRunName ? `/pipelineruns/${pipelineRunName}` : ''}${
          isLogsTabSelected ? `/logs` : ''
        }${taskName ? `?task=${taskName}` : ''}`
      : ''
  }`;

  const shouldRedirect = pipelineRunName ? application && !error : true;

  return (
    <>
      {shouldRedirect ? (
        <Navigate to={navigateUrl} replace />
      ) : (
        <Bullseye>
          <Flex direction={{ default: 'column' }}>
            <Bullseye style={{ marginBottom: 'var(--pf-t--global--spacer--md)' }}>
              <Spinner size="xl" />
            </Bullseye>
            <HelperText>
              <HelperTextItem variant="indeterminate">
                Redirecting {pipelineRunName ? 'to pipeline run' : null}{' '}
                {isLogsTabSelected ? 'logs' : null}
                ...
              </HelperTextItem>
            </HelperText>
          </Flex>
        </Bullseye>
      )}
    </>
  );
};

export default GithubRedirect;
