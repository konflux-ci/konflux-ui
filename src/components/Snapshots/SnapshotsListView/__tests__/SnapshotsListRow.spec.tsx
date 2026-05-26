import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockSnapshot } from '../../../../__data__/mock-snapshots';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '../../../../utils/test-utils';
import SnapshotsListRow from '../SnapshotsListRow';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

const defaultCustomData = {
  applicationName: 'test-app',
  getSource: jest.fn(),
};

describe('SnapshotsListRow - Component links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook('test-namespace');
  });

  it('should display component names as links', () => {
    renderWithQueryClientAndRouter(
      <SnapshotsListRow obj={mockSnapshot} columns={null} customData={defaultCustomData} />,
    );

    expect(screen.getByText('frontend-component')).toBeInTheDocument();
    expect(screen.getByText('backend-component')).toBeInTheDocument();

    const frontendLink = screen.getByText('frontend-component').closest('a');
    expect(frontendLink).toHaveAttribute(
      'href',
      expect.stringContaining('frontend-component'),
    );
  });

  it('should show "more" popover when components exceed maxVisible', () => {
    const snapshotWithManyComponents = {
      ...mockSnapshot,
      spec: {
        ...mockSnapshot.spec,
        components: [
          { name: 'comp-1', containerImage: 'img1' },
          { name: 'comp-2', containerImage: 'img2' },
          { name: 'comp-3', containerImage: 'img3' },
          { name: 'comp-4', containerImage: 'img4' },
          { name: 'comp-5', containerImage: 'img5' },
        ],
      },
    };

    renderWithQueryClientAndRouter(
      <SnapshotsListRow
        obj={snapshotWithManyComponents}
        columns={null}
        customData={defaultCustomData}
      />,
    );

    expect(screen.getByText('comp-1')).toBeInTheDocument();
    expect(screen.getByText('comp-2')).toBeInTheDocument();
    expect(screen.getByText('comp-3')).toBeInTheDocument();
    expect(screen.queryByText('comp-4')).not.toBeInTheDocument();
    expect(screen.queryByText('comp-5')).not.toBeInTheDocument();
    expect(screen.getByText('2 more')).toBeInTheDocument();
  });

  it('should display hidden components in popover when clicked', async () => {
    const user = userEvent.setup();
    const snapshotWithManyComponents = {
      ...mockSnapshot,
      spec: {
        ...mockSnapshot.spec,
        components: [
          { name: 'comp-1', containerImage: 'img1' },
          { name: 'comp-2', containerImage: 'img2' },
          { name: 'comp-3', containerImage: 'img3' },
          { name: 'comp-4', containerImage: 'img4' },
          { name: 'comp-5', containerImage: 'img5' },
        ],
      },
    };

    renderWithQueryClientAndRouter(
      <SnapshotsListRow
        obj={snapshotWithManyComponents}
        columns={null}
        customData={defaultCustomData}
      />,
    );

    const moreButton = screen.getByText('2 more');
    await user.click(moreButton);

    await waitFor(() => {
      expect(screen.getByText('comp-4')).toBeInTheDocument();
      expect(screen.getByText('comp-5')).toBeInTheDocument();
    });
  });

  it('should display "-" when there are no components', () => {
    const snapshotWithNoComponents = {
      ...mockSnapshot,
      spec: {
        ...mockSnapshot.spec,
        components: [],
      },
    };

    const { container } = renderWithQueryClientAndRouter(
      <SnapshotsListRow
        obj={snapshotWithNoComponents}
        columns={null}
        customData={defaultCustomData}
      />,
    );

    const componentListDiv = container.querySelector('.truncated-link-list');
    expect(componentListDiv).toBeInTheDocument();
    expect(componentListDiv).toHaveTextContent('-');
  });
});
