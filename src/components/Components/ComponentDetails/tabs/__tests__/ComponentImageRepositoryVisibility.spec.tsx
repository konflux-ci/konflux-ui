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

  describe('with update permission', () => {
    beforeEach(() => {
      // Mock update permission to true
      useAccessReviewForModelMock.mockReturnValue([true]);
    });

    it('should show skeleton when loading', () => {
      useImageRepositoryMock.mockReturnValue([null, false, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );
      const skeleton = screen.getByText('', { selector: '.pf-v5-c-skeleton' });
      expect(skeleton).toBeInTheDocument();
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

      // Should show placeholder for visibility (just the "-" text)
      expect(screen.getByText('-')).toBeInTheDocument();

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

  describe('without update permission', () => {
    beforeEach(() => {
      // Mock update permission to false
      useAccessReviewForModelMock.mockReturnValue([false]);
    });

    it('should show "-" when no data and disable Edit button', () => {
      useImageRepositoryMock.mockReturnValue([null, true, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      // Should show placeholder
      expect(screen.getByText('-')).toBeInTheDocument();

      // Edit button should be disabled
      const editButton = screen.getByTestId('edit-visibility-button');
      expect(editButton).toBeInTheDocument();
      expect(editButton).toBeDisabled();
    });

    it('should show visibility but disable Edit button when data is loaded', () => {
      useImageRepositoryMock.mockReturnValue([mockPublicImageRepository, true, null]);

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
      useImageRepositoryMock.mockReturnValue([mockPublicImageRepository, true, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      const editButton = screen.getByTestId('edit-visibility-button');
      await user.click(editButton);

      // Modal should not be called when button is disabled
      expect(showModalMock).not.toHaveBeenCalled();
    });
  });

  describe('data loading behavior', () => {
    beforeEach(() => {
      // Permission doesn't affect data loading anymore
      useAccessReviewForModelMock.mockReturnValue([true]);
    });

    it('should always call useImageRepository with component namespace and name', () => {
      useImageRepositoryMock.mockReturnValue([null, true, null]);

      renderWithQueryClientAndRouter(
        <ComponentImageRepositoryVisibility component={mockComponent} />,
      );

      // Verify useImageRepository was called with actual namespace/name
      expect(useImageRepositoryMock).toHaveBeenCalledWith(
        mockComponent.metadata.namespace,
        mockComponent.metadata.name,
        false,
      );
    });
  });
});
