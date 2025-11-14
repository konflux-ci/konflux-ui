import { screen, fireEvent, waitFor } from '@testing-library/react';
import {
  mockImageRepositoryWithoutVisibility,
  mockPrivateImageRepository,
  mockPublicImageRepository,
} from '~/__data__/image-repository-data';
import { updateImageRepositoryVisibility } from '~/utils/component-utils';
import { renderWithQueryClientAndRouter } from '~/utils/test-utils';
import { EditImageRepositoryVisibilityModal } from '../EditImageRepositoryVisibilityModal';

jest.mock('~/utils/component-utils', () => ({
  updateImageRepositoryVisibility: jest.fn(),
}));

const updateImageRepositoryVisibilityMock = updateImageRepositoryVisibility as jest.Mock;

describe('EditImageRepositoryVisibilityModal', () => {
  const onCloseMock = jest.fn();
  beforeEach(() => {
    updateImageRepositoryVisibilityMock.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with switch off for public repository', () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPublicImageRepository}
        onClose={onCloseMock}
      />,
    );

    expect(screen.getByText('Should the image produced be private?')).toBeInTheDocument();
    const switchElement = screen.getByTestId('visibility-switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).not.toBeChecked();
  });

  it('should render the modal with switch on for private repository', () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPrivateImageRepository}
        onClose={onCloseMock}
      />,
    );

    const switchElement = screen.getByTestId('visibility-switch');
    expect(switchElement).toBeChecked();
  });

  it('should disable save button when no changes are made', () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPublicImageRepository}
        onClose={onCloseMock}
      />,
    );

    const saveButton = screen.getByTestId('save-visibility-button');
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when switch is toggled', () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPrivateImageRepository}
        onClose={onCloseMock}
      />,
    );

    const switchElement = screen.getByTestId('visibility-switch');
    fireEvent.click(switchElement);

    const saveButton = screen.getByTestId('save-visibility-button');
    expect(saveButton).not.toBeDisabled();
  });

  it('should call updateImageRepositoryVisibility with true when changing to private', async () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPublicImageRepository}
        onClose={onCloseMock}
      />,
    );

    const switchElement = screen.getByTestId('visibility-switch');
    fireEvent.click(switchElement);

    const saveButton = screen.getByTestId('save-visibility-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateImageRepositoryVisibilityMock).toHaveBeenCalledWith(
        mockPublicImageRepository,
        true,
      );
    });
  });

  it('should call updateImageRepositoryVisibility with false when changing to public', async () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPrivateImageRepository}
        onClose={onCloseMock}
      />,
    );

    const switchElement = screen.getByTestId('visibility-switch');
    fireEvent.click(switchElement);

    const saveButton = screen.getByTestId('save-visibility-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateImageRepositoryVisibilityMock).toHaveBeenCalledWith(
        mockPrivateImageRepository,
        false,
      );
    });
  });

  it('should close modal with submitClicked true on successful save', async () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPublicImageRepository}
        onClose={onCloseMock}
      />,
    );

    const switchElement = screen.getByTestId('visibility-switch');
    fireEvent.click(switchElement);

    const saveButton = screen.getByTestId('save-visibility-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onCloseMock).toHaveBeenCalledWith(null, { submitClicked: true });
    });
  });

  it('should show error message when update fails', async () => {
    const errorMessage = 'Failed to update visibility';
    updateImageRepositoryVisibilityMock.mockRejectedValueOnce(new Error(errorMessage));

    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPublicImageRepository}
        onClose={onCloseMock}
      />,
    );

    const switchElement = screen.getByTestId('visibility-switch');
    fireEvent.click(switchElement);

    const saveButton = screen.getByTestId('save-visibility-button');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('should close modal with submitClicked false when cancel is clicked', () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockPublicImageRepository}
        onClose={onCloseMock}
      />,
    );

    const cancelButton = screen.getByTestId('cancel-visibility-button');
    fireEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalledWith(null, { submitClicked: false });
  });

  it('should default to public visibility when visibility is undefined', () => {
    renderWithQueryClientAndRouter(
      <EditImageRepositoryVisibilityModal
        imageRepository={mockImageRepositoryWithoutVisibility}
        onClose={onCloseMock}
      />,
    );

    const switchElement = screen.getByTestId('visibility-switch');
    expect(switchElement).not.toBeChecked();
  });
});
