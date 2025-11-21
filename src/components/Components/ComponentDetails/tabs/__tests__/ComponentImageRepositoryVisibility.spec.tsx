import { screen, fireEvent } from '@testing-library/react';
import {
  mockPrivateImageRepository,
  mockPublicImageRepository,
  mockImageRepositoryWithoutVisibility,
} from '~/__data__/image-repository-data';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { renderWithQueryClientAndRouter } from '~/utils/test-utils';
import { mockComponent } from '../../__data__/mockComponentDetails';
import ComponentImageRepositoryVisibility from '../ComponentImageRepositoryVisibility';

jest.mock('~/components/modal/ModalProvider', () => ({
  ...jest.requireActual('~/components/modal/ModalProvider'),
  useModalLauncher: jest.fn(() => () => {}),
}));

const useModalLauncherMock = useModalLauncher as jest.Mock;

describe('ComponentImageRepositoryVisibility', () => {
  const showModalMock = jest.fn();

  beforeEach(() => {
    useModalLauncherMock.mockImplementation(() => showModalMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show spinner when loading', () => {
    renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={null}
        imageRepoLoaded={false}
        imageRepoError={null}
      />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error state when there is an error', () => {
    const error = { code: 500, message: 'Internal server error' };
    renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={null}
        imageRepoLoaded={true}
        imageRepoError={error}
      />,
    );
    expect(screen.getByText(/Unable to load image repository/i)).toBeInTheDocument();
  });

  it('should display "public" label with blue color for public visibility', () => {
    renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={mockPublicImageRepository}
        imageRepoLoaded={true}
        imageRepoError={null}
      />,
    );

    const label = screen.getByTestId('visibility-label-public');
    expect(label).toBeInTheDocument();
    expect(label.textContent).toBe('public');
    expect(label).toHaveClass('pf-m-blue');
  });

  it('should display "private" label with orange color for private visibility', () => {
    renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={mockPrivateImageRepository}
        imageRepoLoaded={true}
        imageRepoError={null}
      />,
    );

    const label = screen.getByTestId('visibility-label-private');
    expect(label).toBeInTheDocument();
    expect(label.textContent).toBe('private');
    expect(label).toHaveClass('pf-m-orange');
  });

  it('should show "-" with Edit button when visibility field is not set', () => {
    renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={mockImageRepositoryWithoutVisibility}
        imageRepoLoaded={true}
        imageRepoError={null}
      />,
    );

    // Should show placeholder for visibility
    const placeholder = screen.getByTestId('visibility-not-set');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder.textContent).toBe('-');

    // Should still show Edit button to allow setting visibility
    const editButton = screen.getByTestId('edit-visibility-button');
    expect(editButton).toBeInTheDocument();
  });

  it('should call modal launcher when Edit button is clicked', () => {
    renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={mockPublicImageRepository}
        imageRepoLoaded={true}
        imageRepoError={null}
      />,
    );

    const editButton = screen.getByTestId('edit-visibility-button');
    fireEvent.click(editButton);

    expect(showModalMock).toHaveBeenCalledTimes(1);
  });
});
