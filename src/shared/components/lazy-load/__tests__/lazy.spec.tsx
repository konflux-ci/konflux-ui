import { screen, configure, render, waitFor } from '@testing-library/react';
import { FeedbackSectionProps } from '~/components/FeedbackSection/components/FeedbackForm';
import { lazyLoad, LazyLoadArguments } from '../lazy';

configure({ testIdAttribute: 'data-test' });

const MockOnBack = jest.fn;
const MockOnClose = jest.fn;
const MockOnSubmit = jest.fn;

const FallbackComponent = <div data-test="lazy-fallback-component" />;

const FeedbackSection = lazyLoad<FeedbackSectionProps & LazyLoadArguments>(
  () => import('~/components/FeedbackSection/components/BugRFEForm'),
);

describe('lazy component loading test', () => {
  it('should render fallback component by default', () => {
    render(
      <FeedbackSection
        onBack={MockOnBack}
        onClose={MockOnClose}
        onSubmit={MockOnSubmit}
        fallback={FallbackComponent}
      />,
    );

    expect(screen.getByTestId('lazy-fallback-component')).toBeInTheDocument();
  });
  it('should render lazy component', async () => {
    render(
      <FeedbackSection
        onBack={MockOnBack}
        onClose={MockOnClose}
        onSubmit={MockOnSubmit}
        fallback={FallbackComponent}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('bug-rfe-form')).toBeInTheDocument();
    });
  });
});
