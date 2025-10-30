import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { FULL_APPLICATION_TITLE } from '~/consts/labels';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import GrantAccessPage from '../GrantAccessPage';

// UserAccessFormPage has been tested by 'UserAccessFormPage.spec.tsx'.
// We mock it here to focus on testing GrantAccessPage's specific logic:
// setting the document title with the correct namespace value.
jest.mock('../UserAccessFormPage', () => ({
  UserAccessFormPage: () => <div data-test="user-access-form-page">UserAccessFormPage</div>,
}));

describe('GrantAccessPage', () => {
  const mockNamespace = 'test-workspace';
  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
  });

  it('should render UserAccessFormPage component', () => {
    render(<GrantAccessPage />);

    expect(screen.getByText('UserAccessFormPage')).toBeInTheDocument();
  });

  it('should set document title with namespace name', () => {
    render(<GrantAccessPage />);

    expect(document.title).toBe(
      `Grant access to workspace, ${mockNamespace} | ${FULL_APPLICATION_TITLE}`,
    );
  });

  it('should update document title when namespace changes', () => {
    const { rerender } = render(<GrantAccessPage />);

    expect(document.title).toBe(
      `Grant access to workspace, ${mockNamespace} | ${FULL_APPLICATION_TITLE}`,
    );

    const newNamespace = 'different-workspace';
    useNamespaceMock.mockReturnValue(newNamespace);

    rerender(<GrantAccessPage />);

    expect(document.title).toBe(
      `Grant access to workspace, ${newNamespace} | ${FULL_APPLICATION_TITLE}`,
    );
  });
});
