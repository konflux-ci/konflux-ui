import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import EmptySearchImgUrl from '../../assets/Not-found.svg';

export const NotFoundEmptyState: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
}) => {
  const navigate = useNavigate();
  return (
    <EmptyState className={css('app-empty-state', className)} variant={EmptyStateVariant.full}>
      <EmptyStateHeader
        titleText="404: Page not found"
        icon={
          <EmptyStateIcon
            className={css('app-empty-state__icon m-is-error')}
            icon={() => <EmptySearchImgUrl className="app-empty-state__icon m-is-xl" role="img" />}
          />
        }
        headingLevel="h2"
      />
      <EmptyStateBody>
        {`Looks like that page doesn't exist. Let's get you back to your applications list.`}
      </EmptyStateBody>
      <EmptyStateFooter>
        <Button variant={ButtonVariant.primary} onClick={() => navigate('/')}>
          Go to applications list
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
};
