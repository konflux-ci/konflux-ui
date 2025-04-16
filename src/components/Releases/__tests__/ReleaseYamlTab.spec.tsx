import { render, screen } from '@testing-library/react';
import * as YAML from 'yaml';
import { useRelease } from '../../../hooks/useReleases';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import { mockReleases } from '../__data__/mock-release-data';
import ReleaseYamlTab from '../ReleaseYamlTab';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useParams: () => ({ releaseName: 'test-release' }),
}));

jest.mock('../../../hooks/useReleases', () => ({
  useRelease: jest.fn(),
}));

jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: (props) => <div data-test="monaco-editor">{props.value}</div>,
}));

const mockUseRelease = useRelease as jest.Mock;
const useNamespaceMock = mockUseNamespaceHook('my-ns');
const watchResourceMock = createK8sWatchResourceMock();

describe('ReleaseYamlTab', () => {
  beforeEach(() => {
    useNamespaceMock.mockReturnValue('my-ns');
  });

  it('should render loading indicator', () => {
    mockUseRelease.mockReturnValue([mockReleases[0], false]);

    render(<ReleaseYamlTab />);

    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render correct details', () => {
    watchResourceMock.mockReturnValue([{ spec: { application: 'test-app' } }, true]);
    const release = mockReleases[0];
    mockUseRelease.mockReturnValue([release, true]);

    render(<ReleaseYamlTab />);

    expect(screen.getByText('View Release .yaml file')).toBeVisible();

    const expectedYaml = YAML.stringify(release);
    const content = screen.getByTestId('monaco-editor').textContent;
    expect(content?.replace(/\s+/g, '')).toEqual(expectedYaml.replace(/\s+/g, ''));
  });
});
