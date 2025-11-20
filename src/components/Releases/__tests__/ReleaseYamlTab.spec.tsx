import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { stringify as yamlStringify } from 'yaml';
import { useRelease } from '../../../hooks/useReleases';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { mockReleases } from '../__data__/mock-release-data';
import { ReleaseYamlTab } from '../ReleaseYamlTab';

const queryClient = new QueryClient();

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useParams: () => ({ releaseName: 'test-release' }),
}));

jest.mock('../../../hooks/useReleases', () => ({
  useRelease: jest.fn(),
}));

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, language, ...props }: { children: string; language: string }) => (
    <pre data-test="mock-editor" data-language={language} {...props}>
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
    useNamespaceMock.mockReturnValue('my-ns');
  });

  it('should render loading indicator', () => {
    mockUseRelease.mockReturnValue([mockReleases[0], false, undefined]);

    render(<ReleaseYamlTab />);

    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render correct YAML content', () => {
    const release = mockReleases[0];
    mockUseRelease.mockReturnValue([release, true, undefined]);

    render(
      <QueryClientProvider client={queryClient}>
        <ReleaseYamlTab />
      </QueryClientProvider>,
    );

    const expectedYaml = yamlStringify(release);
    const editorContent = screen.getByTestId('mock-editor').textContent;
    expect(editorContent?.replace(/\s+/g, '')).toEqual(expectedYaml.replace(/\s+/g, ''));
  });

  it('should render error state when release fails to load', () => {
    const error = new Error('Failed to load release');
    mockUseRelease.mockReturnValue([null, true, error]);

    render(
      <QueryClientProvider client={queryClient}>
        <ReleaseYamlTab />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Unable to load release')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-editor')).not.toBeInTheDocument();
  });
});
