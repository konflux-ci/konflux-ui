import { screen } from '@testing-library/react';
import {
  mockPrivateImageRepository,
  mockPublicImageRepository,
} from '~/__data__/image-repository-data';
import { renderWithQueryClient } from '~/utils/test-utils';
import { ImageUrlDisplay } from '../ImageUrlDisplay';

// Mock useImageProxy hook
const mockUseImageProxy = jest.fn();
jest.mock('~/hooks/useImageProxy', () => ({
  useImageProxy: () => mockUseImageProxy(),
}));

// Mock useImageRepository hook
const mockUseImageRepository = jest.fn();
jest.mock('~/hooks/useImageRepository', () => ({
  useImageRepository: (namespace: string, name: string, watch: boolean) =>
    mockUseImageRepository(namespace, name, watch),
}));

const testImageUrl = 'quay.io/test-namespace/test-image@sha256:abc123';
const testNamespace = 'test-namespace';
const testComponentName = 'test-component';

// Helper function to verify external link
const expectExternalLink = (expectedText: string, expectedHref: string) => {
  const link = screen.getByRole('link');
  expect(link).toBeInTheDocument();
  expect(link).toHaveTextContent(expectedText);
  expect(link).toHaveAttribute('href', expectedHref);
  expect(link).toHaveAttribute('target', '_blank');
  return link;
};

// Helper function to verify copyable text
const expectCopyableText = (expectedText: string) => {
  expect(screen.getByText(expectedText)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
};

describe('ImageUrlDisplay', () => {
  const mockUrlInfo = {
    fullUrl: 'https://image-rbac-proxy',
    hostname: 'image-rbac-proxy',
    oauthPath: '/oauth',
    buildUrl: (path: string) => `https://image-rbac-proxy${path}`,
  };

  beforeEach(() => {
    mockUseImageRepository.mockClear();
    mockUseImageProxy.mockClear();
    // Default: image proxy is loaded
    mockUseImageProxy.mockReturnValue([mockUrlInfo, true, null]);
  });

  it('should show loading skeleton while loading image repository', () => {
    mockUseImageRepository.mockReturnValue([null, false, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    expect(screen.getByLabelText('Loading image URL')).toBeInTheDocument();
  });

  it('should show loading skeleton while loading image proxy for private images', () => {
    // Mock useImageProxy to return loading state
    mockUseImageProxy.mockReturnValue([null, false, null]);
    mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    expect(screen.getByLabelText('Loading image URL')).toBeInTheDocument();
  });

  it('should show copyable text with proxy URL for private images', () => {
    mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    expectCopyableText('image-rbac-proxy/test-namespace/test-image@sha256:abc123');
  });

  it('should show external link for public images', () => {
    mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    expectExternalLink(testImageUrl, 'https://quay.io/test-namespace/test-image');
  });

  it('should show external link when imageRepository is null', () => {
    mockUseImageRepository.mockReturnValue([null, true, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    expectExternalLink(testImageUrl, 'https://quay.io/test-namespace/test-image');
  });

  it('should gracefully fall back to external link on error', () => {
    const error = new Error('Failed to fetch image repository');
    mockUseImageRepository.mockReturnValue([null, true, error]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    expectExternalLink(testImageUrl, 'https://quay.io/test-namespace/test-image');
    // Should NOT show error message
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('should add https:// prefix for URLs without protocol', () => {
    mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    expectExternalLink(testImageUrl, 'https://quay.io/test-namespace/test-image');
  });

  it('should not add https:// prefix for URLs that already have protocol', () => {
    const urlWithProtocol = `https://${testImageUrl}`;
    mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={urlWithProtocol}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    expectExternalLink(urlWithProtocol, 'https://quay.io/test-namespace/test-image');
  });

  it('should call useImageRepository with correct parameters', () => {
    mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    // Verify the hook was called with correct parameters
    expect(mockUseImageRepository).toHaveBeenCalledWith(testNamespace, testComponentName, false);
  });

  it('should ensure the image link can be selected', () => {
    mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);

    renderWithQueryClient(
      <ImageUrlDisplay
        imageUrl={testImageUrl}
        namespace={testNamespace}
        componentName={testComponentName}
      />,
    );

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveStyle({
      userSelect: 'auto',
    });
  });
});
