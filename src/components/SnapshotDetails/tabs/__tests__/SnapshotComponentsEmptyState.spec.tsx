import { render, screen } from '@testing-library/react';
import { createUseWorkspaceInfoMock } from '../../../../utils/test-utils';
import SnapshotComponentsEmptyState from '../SnapshotComponentsEmptyState';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

describe('SnapshotComponentsEmptyState', () => {
  createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });

  it('should render correct Link to Application Name', () => {
    render(<SnapshotComponentsEmptyState applicationName="test" />);
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/workspaces/test-ws/import?application=test',
    );
    screen.getByText('Add component');
  });
});
