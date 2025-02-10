import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NoAccessState from '../NoAccessState';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModels: jest.fn(),
}));

jest.mock('../../Workspace/useWorkspaceInfo', () => ({
  useWorkspaceInfo: jest.fn(() => ({ workspace: 'test-ws' })),
}));

const useNavigateMock = useNavigate as jest.Mock;

describe('NoAccessState', () => {
  let navigateMock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
  });

  it('should render default values when no props are passed', () => {
    render(<NoAccessState />);

    screen.getByTestId('no-access-state');
    screen.getByText(`Let's get you access`);
    screen.getByText(
      `Ask the administrator or the owner of the test-ws namespace for access permissions.`,
    );
    screen.getByText('Go to Overview page');
  });

  it('should navigate to the overview page', async () => {
    render(<NoAccessState />);
    fireEvent.click(screen.queryByTestId('no-access-action'));
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });

  it('should render custom title, body, and button', () => {
    render(
      <NoAccessState title="Test title" body="Test body">
        <Button>Test Button</Button>
      </NoAccessState>,
    );

    screen.getByTestId('no-access-state');
    screen.getByText('Test title');
    screen.getByText('Test body');
    screen.getByText('Test Button');
  });
});
