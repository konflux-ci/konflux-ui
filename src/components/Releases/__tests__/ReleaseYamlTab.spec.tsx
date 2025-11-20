import { screen } from '@testing-library/react';
import { stringify as yamlStringify } from 'yaml';
import { useRelease } from '../../../hooks/useReleases';
import { renderWithQueryClient } from '../../../unit-test-utils';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { mockReleases } from '../__data__/mock-release-data';
import { ReleaseYamlTab } from '../ReleaseYamlTab';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useParams: () => ({ releaseName: 'test-release' }),
}));

jest.mock('../../../hooks/useReleases', () => ({
  useRelease: jest.fn(),
}));

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, language, ...props }: { children: string; language: string }) => (
    <pre data-test="mock-viewer" data-language={language} {...props}>
      {children}
    </pre>
  ),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

const mockUseRelease = useRelease as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('my-ns');

describe('ReleaseYamlTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue('my-ns');
  });

  it('should render loading indicator when data is not loaded', () => {
    mockUseRelease.mockReturnValue([null, false, undefined]);

    renderWithQueryClient(<ReleaseYamlTab />);

    expect(screen.getByTestId('release-yaml-loading')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeVisible();
    expect(screen.queryByTestId('mock-viewer')).not.toBeInTheDocument();
    expect(screen.queryByText('Unable to load release')).not.toBeInTheDocument();
  });

  it('should render correct YAML content', () => {
    const release = mockReleases[0];
    mockUseRelease.mockReturnValue([release, true, undefined]);

    renderWithQueryClient(<ReleaseYamlTab />);

    const expectedYaml = yamlStringify(release);
    const viewerContent = screen.getByTestId('mock-viewer').textContent;
    expect(viewerContent?.replace(/\s+/g, '')).toEqual(expectedYaml.replace(/\s+/g, ''));
  });

  it('should render error state when release fails to load', () => {
    const error = new Error('Failed to load release');
    mockUseRelease.mockReturnValue([null, true, error]);

    renderWithQueryClient(<ReleaseYamlTab />);

    expect(screen.getByText('Unable to load release')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-viewer')).not.toBeInTheDocument();
  });
});
