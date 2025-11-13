import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockPrivateImageRepository,
  mockPublicImageRepository,
  mockImageRepositoryWithoutVisibility,
} from '~/__data__/image-repository-data';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useAccessReviewForModel } from '~/utils/rbac';
import { renderWithQueryClientAndRouter } from '~/utils/test-utils';
import { mockComponent } from '../../__data__/mockComponentDetails';
import ComponentImageRepositoryVisibility from '../ComponentImageRepositoryVisibility';

jest.mock('~/components/modal/ModalProvider', () => ({
  ...jest.requireActual('~/components/modal/ModalProvider'),
  useModalLauncher: jest.fn(() => () => {}),
}));

jest.mock('~/hooks/useImageRepository', () => ({
  useImageRepository: jest.fn(),
}));

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

const useModalLauncherMock = useModalLauncher as jest.Mock;
const useImageRepositoryMock = useImageRepository as jest.Mock;
const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;

describe('ComponentImageRepositoryVisibility', () => {
  const showModalMock = jest.fn();

  beforeEach(() => {
    useModalLauncherMock.mockImplementation(() => showModalMock);
    // Default: user has both list and update permissions
    useAccessReviewForModelMock.mockReturnValue([true]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('with list and update permissions', () => {
    beforeEach(() => {
      // Mock both permissions to true
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      useAccessReviewForModelMock.mockImplementation((_model, _verb) => {
        return [true]; // Both list and update are allowed
      });
    });

    it('should show spinner when loading', () => {
      useImageRepositoryMock.mockReturnValue([null, false, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      const error = { code: 500, message: 'Internal server error' };
      useImageRepositoryMock.mockReturnValue([null, true, error]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );
      expect(screen.getByText(/Unable to load image repository/i)).toBeInTheDocument();
    });

    it('should display "public" label with blue color for public visibility', () => {
      useImageRepositoryMock.mockReturnValue([mockPublicImageRepository, true, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      const label = screen.getByTestId('visibility-label-public');
      expect(label).toBeInTheDocument();
      expect(label.textContent).toBe('public');
      expect(label).toHaveClass('pf-m-blue');
    });

    it('should display "private" label with orange color for private visibility', () => {
      useImageRepositoryMock.mockReturnValue([mockPrivateImageRepository, true, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      const label = screen.getByTestId('visibility-label-private');
      expect(label).toBeInTheDocument();
      expect(label.textContent).toBe('private');
      expect(label).toHaveClass('pf-m-orange');
    });

    it('should show "-" with tooltip when visibility field is not set', () => {
      useImageRepositoryMock.mockReturnValue([mockImageRepositoryWithoutVisibility, true, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      // Should show placeholder for visibility
      const placeholder = screen.getByTestId('visibility-placeholder');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder.textContent).toBe('-');

      // Should still show Edit button to allow setting visibility
      const editButton = screen.getByTestId('edit-visibility-button');
      expect(editButton).toBeInTheDocument();
      expect(editButton).not.toBeDisabled();
    });

    it('should call modal launcher when Edit button is clicked', async () => {
      const user = userEvent.setup();
      useImageRepositoryMock.mockReturnValue([mockPublicImageRepository, true, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      const editButton = screen.getByTestId('edit-visibility-button');
      await user.click(editButton);

      expect(showModalMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('without list permission', () => {
    beforeEach(() => {
      // Mock: no list permission, no update permission
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      useAccessReviewForModelMock.mockImplementation((_model, _verb) => {
        return [false]; // No permissions
      });
      // When no list permission, hook should not be called with namespace/name
      useImageRepositoryMock.mockReturnValue([null, true, null]);
    });

    it('should show "-" with "no permission" tooltip when user lacks list permission', () => {
      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      // Should show placeholder
      const placeholder = screen.getByTestId('visibility-placeholder');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder.textContent).toBe('-');

      // Verify useImageRepository was called with null (no fetch)
      expect(useImageRepositoryMock).toHaveBeenCalledWith(null, null, false);
    });

    it('should show disabled Edit button with tooltip when user lacks both permissions', () => {
      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      const editButton = screen.getByTestId('edit-visibility-button');
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeDisabled();
    });
  });

  describe('with list permission but without update permission', () => {
    beforeEach(() => {
      // Mock: list permission = true, update permission = false
      useAccessReviewForModelMock.mockImplementation((_model, verb) => {
        if (verb === 'list') {
          return [true];
        }
        if (verb === 'update') {
          return [false];
        }
        return [false];
      });
      useImageRepositoryMock.mockReturnValue([mockPublicImageRepository, true, null]);
    });

    it('should show visibility but disable Edit button', () => {
      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      // Should show visibility label
      const label = screen.getByTestId('visibility-label-public');
      expect(label).toBeInTheDocument();

      // Edit button should be disabled
      const editButton = screen.getByTestId('edit-visibility-button');
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeDisabled();
    });

    it('should not call modal when disabled Edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      const editButton = screen.getByTestId('edit-visibility-button');
      await user.click(editButton);

      // Modal should not be called when button is disabled
      expect(showModalMock).not.toHaveBeenCalled();
    });
  });

  describe('with update permission but without list permission', () => {
    beforeEach(() => {
      // Mock: list permission = false, update permission = true
      useAccessReviewForModelMock.mockImplementation((_model, verb) => {
        if (verb === 'list') {
          return [false];
        }
        if (verb === 'update') {
          return [true];
        }
        return [false];
      });
      // When no list permission, no data is fetched
      useImageRepositoryMock.mockReturnValue([null, true, null]);
    });

    it('should show "-" with no permission tooltip but enable Edit button', () => {
      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      // Should show placeholder
      const placeholder = screen.getByTestId('visibility-placeholder');
      expect(placeholder).toBeInTheDocument();

      // Edit button should be enabled (user has update permission)
      const editButton = screen.getByTestId('edit-visibility-button');
      expect(editButton).toBeInTheDocument();
      expect(editButton).not.toBeDisabled();
    });
  });
});
