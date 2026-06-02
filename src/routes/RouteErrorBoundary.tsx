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
import NoAccessState from '../components/PageAccess/NoAccessState';
import PageLayout from '../components/PageLayout/PageLayout';
import { HttpError } from '../k8s/error';
import ErrorEmptyState from '../shared/components/empty-state/ErrorEmptyState';

export type ErrorBoundaryFallbackProps = {
  errorMessage: string;
  componentStack?: string;
  stack: string;
  title: string;
};

export const ErrorBoundaryFallback: React.FC<
  React.PropsWithChildren<ErrorBoundaryFallbackProps>
> = (props) => {
  return (
    <PageSection hasBodyWrapper={false}>
      <PageLayout title="Oh no! Something went wrong.">
        <PageSection hasBodyWrapper={false}>
          <ExpandableSection toggleText="Show details">
            <Content>
              <Content component={ContentVariants.h3}>{props.title}</Content>

              <Content component={ContentVariants.h4}>Description:</Content>
              <Content component={ContentVariants.pre}>{props.errorMessage}</Content>

              {props.componentStack ? (
                <>
                  {' '}
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
  if (error.status === 403) {
    return <NoAccessState />;
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
    />
  );
};
