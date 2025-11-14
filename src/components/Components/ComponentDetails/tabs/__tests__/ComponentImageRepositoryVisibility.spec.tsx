import { screen } from '@testing-library/react';
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

  it('should show "-" when image repository does not exist', () => {
    const { container } = renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={null}
        imageRepoLoaded={true}
        imageRepoError={null}
      />,
    );
    expect(container.textContent).toBe('-');
  });

  it('should display Public label for public visibility', () => {
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
    expect(label.textContent).toBe('Public');
  });

  it('should display Private label for private visibility', () => {
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
    expect(label.textContent).toBe('Private');
  });

  it('should display Edit button when image repository exists', () => {
    renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={mockPublicImageRepository}
        imageRepoLoaded={true}
        imageRepoError={null}
      />,
    );

    const editButton = screen.getByTestId('edit-visibility-button');
    expect(editButton).toBeInTheDocument();
    expect(editButton.textContent).toBe('Edit');
  });

  it('should default to public when visibility is not set', () => {
    renderWithQueryClientAndRouter(
      <ComponentImageRepositoryVisibility
        component={mockComponent}
        imageRepository={mockImageRepositoryWithoutVisibility}
        imageRepoLoaded={true}
        imageRepoError={null}
      />,
    );

    const label = screen.getByTestId('visibility-label-public');
    expect(label).toBeInTheDocument();
    expect(label.textContent).toBe('Public');
  });
});
