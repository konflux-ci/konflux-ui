import { Navigate, useLocation, useParams } from 'react-router-dom';
import { Bullseye, Flex, HelperText, HelperTextItem, Spinner } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { usePipelineRun } from '../../hooks/usePipelineRuns';
import { HttpError } from '../../k8s/error';
import { GithubRedirectRouteParams } from '../../routes/utils';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';

const GithubRedirect: React.FC = () => {
  const { pathname } = useLocation();
  const { ns, pipelineRunName, taskName } = useParams<GithubRedirectRouteParams>();
  const isLogsTabSelected = pathname.includes('/logs');
  const [pr, loaded, error] = usePipelineRun(ns, ns, pipelineRunName);

  const application =
    loaded && !error ? pr.metadata.labels[PipelineRunLabel.APPLICATION] : undefined;

  const navigateUrl = `/workspaces/${ns}${
    application && !error
      ? `/applications/${application}${pipelineRunName ? `/pipelineruns/${pipelineRunName}` : ''}${
          isLogsTabSelected ? `/logs` : ''
        }${taskName ? `?task=${taskName}` : ''}`
      : ''
  }`;

  const shouldRedirect = pipelineRunName ? application && !error : true;

  if (error || (error && !application)) {
    return (
      <ErrorEmptyState
        httpError={error ? HttpError.fromCode((error as { code: number })?.code) : undefined}
        title={`Unable to load pipeline run ${pipelineRunName}`}
        body={
          error
            ? (error as { message: string })?.message
            : `Could not find '${PipelineRunLabel.APPLICATION}' label in pipeline run`
        }
      />
    );
  }

  return (
    <>
      {shouldRedirect ? (
        <Navigate to={navigateUrl} replace />
      ) : (
        <Bullseye>
          <Flex direction={{ default: 'column' }}>
            <Bullseye style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>
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
