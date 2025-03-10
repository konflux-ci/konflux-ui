import { render, screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import PipelineRunEmptyState from '../../PipelineRunEmptyState';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

describe('PipelineRunEmptyState', () => {
  mockUseNamespaceHook('test-ns');
  it('should render correct Link to Application Name', () => {
    render(<PipelineRunEmptyState applicationName="test" />);
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/workspaces/test-ns/import?application=test',
    );
    screen.getByText('Add component');
  });
});
