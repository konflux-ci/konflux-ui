import * as React from 'react';
import { ErrorResponse, useRouteError } from 'react-router-dom';
import {
  ClipboardCopy,
  ClipboardCopyVariant,
  ExpandableSection,
  PageSection,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import ServiceUnavailablePage from '~/components/ServiceUnavailable/ServiceUnavailablePage';
import { monitoringService } from '~/monitoring';
import NoAccessState from '../components/PageAccess/NoAccessState';
import PageLayout from '../components/PageLayout/PageLayout';
import { HttpError } from '../k8s/error';
import ErrorEmptyState from '../shared/components/empty-state/ErrorEmptyState';

export type ErrorBoundaryFallbackProps = {
  errorMessage: string;
  componentStack?: string;
  stack: string;
  title: string;
  sentryEventId?: string;
};

export const ErrorBoundaryFallback: React.FC<
  React.PropsWithChildren<ErrorBoundaryFallbackProps>
> = (props) => {
  return (
    <PageSection hasBodyWrapper={false}>
      <PageLayout title="Oh no! Something went wrong.">
        <PageSection hasBodyWrapper={false}>
          <Content>
            <Content component={ContentVariants.p}>{props.errorMessage}</Content>
            {props.sentryEventId ? (
              <Content component={ContentVariants.p} data-test="sentry-event-id">
                If reporting this issue, reference ID:{' '}
                <ClipboardCopy
                  isReadOnly
                  hoverTip="Copy"
                  clickTip="Copied"
                  variant="inline-compact"
                >
                  {props.sentryEventId}
                </ClipboardCopy>
              </Content>
            ) : null}
          </Content>
          <ExpandableSection toggleText="Show more details">
            <Content>
              <Content component={ContentVariants.h3}>{props.title}</Content>

              {props.componentStack ? (
                <>
                  <Content component={ContentVariants.h4}>Component trace:</Content>
                  <ClipboardCopy
                    tabIndex={0}
                    variant={ClipboardCopyVariant.expansion}
                    hoverTip="Copy"
                    clickTip="Copied"
                    isReadOnly
                    isExpanded
                    isCode
                  >
                    {props.componentStack.trim()}
                  </ClipboardCopy>
                </>
              ) : null}

              <Content component={ContentVariants.h4}>Stack trace:</Content>
              <ClipboardCopy
                variant={ClipboardCopyVariant.expansion}
                hoverTip="Copy"
                clickTip="Copied"
                isReadOnly
                isExpanded
                isCode
              >
                {props.stack.trim()}
              </ClipboardCopy>
            </Content>
          </ExpandableSection>
        </PageSection>
      </PageLayout>
    </PageSection>
  );
};

export const RouteErrorBoundry: React.FC<React.PropsWithChildren> = () => {
  const error = useRouteError() as ErrorResponse;
  const [sentryEventId, setSentryEventId] = React.useState<string | undefined>();

  React.useEffect(() => {
    const eventId = monitoringService?.captureException(error);
    setSentryEventId(eventId);
  }, [error]);
  if (error.status === 403) {
    return <NoAccessState />;
  }
  if (error.status === 503) {
    return <ServiceUnavailablePage errorMessage={error.data} />;
  }
  if (error instanceof HttpError) {
    const httpError = error as HttpError;
    return (
      <ErrorEmptyState
        httpError={httpError}
        title="Something went wrong"
        body={httpError?.message.length ? httpError?.message : 'Something went wrong'}
      />
    );
  }

  const unknownError = error as unknown as Error;
  return (
    <ErrorBoundaryFallback
      title={unknownError.name}
      errorMessage={unknownError.message}
      stack={unknownError.stack}
      sentryEventId={sentryEventId}
    />
  );
};
