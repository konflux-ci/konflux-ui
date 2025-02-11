import { screen, render } from '@testing-library/react';
import { mockComponentsData } from '../../../ApplicationDetails/__data__';
import SnapshotComponentsListRow, {
  SnapshotComponentTableData,
} from '../SnapshotComponentsListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

const rowData: SnapshotComponentTableData = {
  metadata: { uid: mockComponentsData[1].metadata.uid, name: mockComponentsData[1].metadata.name },
  name: mockComponentsData[1].metadata.name,
  containerImage: mockComponentsData[1].status.lastPromotedImage,
  application: 'test-app',
  source: { git: { url: mockComponentsData[1].spec.source.git.url, revision: 'main' } },
};

describe('SnapshotComponentsListRow', () => {
  it('should list correct Component ', () => {
    const { queryByText } = render(<SnapshotComponentsListRow columns={null} obj={rowData} />);
    expect(queryByText('test-go')).toBeInTheDocument();
  });

  it('should list Git URL as a link ', () => {
    render(<SnapshotComponentsListRow columns={null} obj={rowData} />);
    const githubLink = screen.queryByTestId('snapshot-component-git-url');
    expect(githubLink.getAttribute('href')).toBe(
      'https://github.com/test-user-1/devfile-sample-go-basic',
    );
  });

  it('should not show git section when url is not available ', () => {
    render(<SnapshotComponentsListRow columns={null} obj={{ ...rowData, source: null }} />);
    const githubLink = screen.queryByTestId('snapshot-component-git-url');
    expect(githubLink).toBeNull();
  });

  it('should list Revision correctly ', () => {
    render(
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
    render(
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
      `/workspaces//applications/${rowData?.application}/commit/test-revision`,
    );
  });
  it('should show hyphen when revision is not available ', () => {
    render(
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
});
