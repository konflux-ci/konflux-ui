import * as React from 'react';
import { ButtonVariant, EmptyStateBody, EmptyStateActions } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Integration-test.svg';
import { ButtonWithAccessTooltip } from '~/components/ButtonWithAccessTooltip';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';

const IntegrationTestsEmptyState: React.FC<
  React.PropsWithChildren<{
    handleAddTest?: () => void;
    canCreateIntegrationTest?: boolean;
    context?: 'application' | 'componentGroup';
  }>
> = ({ handleAddTest, canCreateIntegrationTest, context = 'application' }) => {
  return (
    <AppEmptyState
      data-test="integration-tests__empty"
      emptyStateImg={emptyStateImgUrl}
      title="Test any code changes"
    >
      <EmptyStateBody>
        Integration tests run in parallel, validating each new component build with the latest
        version of all other {context === 'application' ? 'application' : 'component group'}{' '}
        components.
        <br />
        To add an integration test, link to a Git repository containing code that can test how your
        {context === 'application' ? ' application' : ' component group'} components work together.
      </EmptyStateBody>
      {!!handleAddTest && (
        <EmptyStateActions>
          <ButtonWithAccessTooltip
            variant={ButtonVariant.primary}
            onClick={handleAddTest}
            isDisabled={!canCreateIntegrationTest}
            tooltip="You don't have access to add an integration test"
            data-test="add-integration-test-empty"
          >
            Add integration test
          </ButtonWithAccessTooltip>
        </EmptyStateActions>
      )}
    </AppEmptyState>
  );
};

export default IntegrationTestsEmptyState;
