import { screen } from '@testing-library/react';
import { useImageRepository } from '~/hooks/useImageRepository';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { mockComponentsData } from '../../../ApplicationDetails/__data__';
import SnapshotComponentsListRow, {
  SnapshotComponentTableData,
} from '../SnapshotComponentsListRow';

jest.mock('~/hooks/useImageRepository', () => ({
  useImageRepository: jest.fn(),
}));

jest.mock('~/hooks/useImageProxyHost', () => ({
  useImageProxyHost: () => ['image-rbac-proxy', true, null],
}));

const useImageRepositoryMock = useImageRepository as jest.Mock;

const rowData: SnapshotComponentTableData = {
  metadata: { uid: mockComponentsData[1].metadata.uid, name: mockComponentsData[1].metadata.name },
  name: mockComponentsData[1].metadata.name,
  containerImage: mockComponentsData[1].status.lastPromotedImage,
  application: 'test-app',
  source: { git: { url: mockComponentsData[1].spec.source.git.url, revision: 'main' } },
};

describe('SnapshotComponentsListRow', () => {
  beforeEach(() => {
    // Mock useImageRepository to return null (no image repository data)
    useImageRepositoryMock.mockReturnValue([null, true, null]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list correct Component ', () => {
    const { queryByText } = renderWithQueryClientAndRouter(
      <SnapshotComponentsListRow columns={null} obj={rowData} />,
    );
    expect(queryByText('test-go')).toBeInTheDocument();
  });

  it('should list Git URL as a link ', () => {
    renderWithQueryClientAndRouter(<SnapshotComponentsListRow columns={null} obj={rowData} />);
    const githubLink = screen.queryByTestId('snapshot-component-git-url');
    expect(githubLink.getAttribute('href')).toBe(
      'https://github.com/test-user-1/devfile-sample-go-basic',
    );
  });

  it('should not show git section when url is not available ', () => {
    renderWithQueryClientAndRouter(
      <SnapshotComponentsListRow columns={null} obj={{ ...rowData, source: null }} />,
    );
    const githubLink = screen.queryByTestId('snapshot-component-git-url');
    expect(githubLink).toBeNull();
  });

  it('should list Revision correctly ', () => {
    renderWithQueryClientAndRouter(
      <SnapshotComponentsListRow
        columns={null}
        obj={{
          ...rowData,
          source: { git: { ...rowData?.source?.git, revision: 'test-revision' } },
        }}
      />,
    );
    expect(screen.getByText('test-revision')).toBeInTheDocument();
  });

  it('should list Revision as a link ', () => {
    renderWithQueryClientAndRouter(
      <SnapshotComponentsListRow
        columns={null}
        obj={{
          ...rowData,
          source: { git: { ...rowData?.source?.git, revision: 'test-revision' } },
        }}
      />,
    );
    const revisionLink = screen.getByText('test-revision');
    expect(revisionLink).toHaveAttribute(
      'href',
      `/ns//applications/${rowData?.application}/commit/test-revision`,
    );
  });
  it('should show hyphen when revision is not available ', () => {
    renderWithQueryClientAndRouter(
      <SnapshotComponentsListRow
        columns={null}
        obj={{
          ...rowData,
          source: { git: { ...rowData?.source?.git, revision: null } },
        }}
      />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should show skeleton while loading image repository', () => {
    useImageRepositoryMock.mockReturnValue([null, false, null]);
    renderWithQueryClientAndRouter(<SnapshotComponentsListRow columns={null} obj={rowData} />);
    expect(screen.getByLabelText('Loading image URL')).toBeInTheDocument();
  });

  it('should show ClipboardCopy for private image with proxy URL', () => {
    useImageRepositoryMock.mockReturnValue([
      { spec: { image: { visibility: 'private' } } },
      true,
      null,
    ]);
    renderWithQueryClientAndRouter(<SnapshotComponentsListRow columns={null} obj={rowData} />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });
});
