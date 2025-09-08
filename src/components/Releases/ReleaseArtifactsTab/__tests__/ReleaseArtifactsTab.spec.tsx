import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRelease } from '../../../../hooks/useReleases';
import { useSearchParam } from '../../../../hooks/useSearchParam';
import { useSortedResources } from '../../../../hooks/useSortedResources';
import { ReleaseArtifactsImages } from '../../../../types';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import ReleaseArtifactsTab from '../index';
import { ReleaseArtifactsListRow } from '../ReleaseArtifactsListRow';

jest.mock('../../../../hooks/useReleases');
jest.mock('../../../../hooks/useSearchParam');
jest.mock('../../../../hooks/useSortedResources');

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: jest.fn(),
  };
});

jest.mock('../../../../shared/components/table/TableComponent', () => {
  return (props) => {
    const { data, filters, selected, match, kindObj } = props;
    const cProps = { data, filters, selected, match, kindObj };
    const columns = props.Header(cProps);

    return (
      <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
        <TableHeader role="rowgroup" />
        <tbody>
          {props.data.map((d, i) => (
            <tr key={i}>
              <ReleaseArtifactsListRow columns={columns} obj={d} />
            </tr>
          ))}
        </tbody>
      </PfTable>
    );
  };
});

const mockImages: ReleaseArtifactsImages[] = [
  {
    name: 'my-component',
    urls: ['https://example.com/image', 'https://example.com/image2'],
    arches: ['amd64'],
  },
];

describe('ReleaseArtifactsTab', () => {
  beforeEach(() => {
    mockUseNamespaceHook('test-ns');
    (useRelease as jest.Mock).mockReturnValue([
      {
        spec: { releasePlan: 'mock-plan' },
        status: { artifacts: { images: mockImages } },
      },
      true,
      undefined,
      undefined,
      false,
    ]);
    (useSortedResources as jest.Mock).mockReturnValue(mockImages);
    (useSearchParam as jest.Mock).mockReturnValue(['', jest.fn()]);
  });

  it('renders spinner while loading', () => {
    (useRelease as jest.Mock).mockReturnValue([{}, false, undefined, undefined, false]);

    render(
      <MemoryRouter
        initialEntries={['/application/test-app/environment/test-env/release/test-release']}
      >
        <Routes>
          <Route
            path="/application/:applicationName/environment/:environmentName/release/:releaseName"
            element={<ReleaseArtifactsTab />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty state if no artifacts found', async () => {
    (useRelease as jest.Mock).mockReturnValue([
      {
        spec: { releasePlan: 'mock-plan' },
        status: { artifacts: { images: [] } },
      },
      true,
      undefined,
      undefined,
      false,
    ]);
    (useSortedResources as jest.Mock).mockReturnValue([]);

    render(<ReleaseArtifactsTab />);

    await waitFor(() => {
      expect(screen.getByText(/No release artifacts images found/i)).toBeInTheDocument();
    });
  });

  it('renders release artifacts table after loading', () => {
    render(<ReleaseArtifactsTab />);

    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('my-component')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'https://example.com/image' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/image');
    expect(screen.getByText('amd64')).toBeInTheDocument();
  });

  it('filters artifacts based on name filter', async () => {
    const setNameFilter = jest.fn();
    (useSearchParam as jest.Mock).mockReturnValue(['', setNameFilter]);

    render(<ReleaseArtifactsTab />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'my-component' } });

    await waitFor(() => {
      expect(setNameFilter).toHaveBeenCalledWith('my-component');
    });
  });
});
