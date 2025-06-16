import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { stringify as yamlStringify } from 'yaml';
import { useRelease } from '../../../hooks/useReleases';
import { mockedSwaggerDefinitions } from '../../../shared/components/code-editor/__data__/mock-data';
import { useSwaggerDefinitions } from '../../../shared/components/code-editor/hooks/useSwaggerDefinitions';
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

jest.mock('../../../shared/components/code-editor/hooks/useSwaggerDefinitions', () => ({
  useSwaggerDefinitions: jest.fn(),
}));

jest.mock('@patternfly/react-code-editor', () => ({
  CodeEditor: (props) => {
    React.useEffect(() => {
      props.onEditorDidMount?.({}, {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <pre data-test="mock-editor">{props.code}</pre>;
  },
  Language: { yaml: 'yaml', json: 'json' },
  EditorDidMount: jest.fn(),
}));

const mockUseRelease = useRelease as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('my-ns');

describe('ReleaseYamlTab', () => {
  beforeEach(() => {
    useNamespaceMock.mockReturnValue('my-ns');

    (useSwaggerDefinitions as jest.Mock).mockReturnValue({
      data: mockedSwaggerDefinitions,
      isLoading: false,
    });
  });

  it('should render loading indicator', () => {
    mockUseRelease.mockReturnValue([mockReleases[0], false]);

    render(<ReleaseYamlTab />);

    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render correct YAML content', () => {
    const release = mockReleases[0];
    mockUseRelease.mockReturnValue([release, true]);

    render(
      <QueryClientProvider client={queryClient}>
        <ReleaseYamlTab />
      </QueryClientProvider>,
    );

    const expectedYaml = yamlStringify(release);
    const editorContent = screen.getByTestId('mock-editor').textContent;
    expect(editorContent?.replace(/\s+/g, '')).toEqual(expectedYaml.replace(/\s+/g, ''));
  });
});
