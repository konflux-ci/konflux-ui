/* eslint-disable camelcase */
import { render, screen } from '@testing-library/react';
import { ReleaseKind } from '../../../../../types/release';
import { ReleaseURLsDescriptionList } from '../ReleaseURLsDescriptionList';

const createMockRelease = (overrides: Partial<ReleaseKind> = {}): ReleaseKind => ({
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: { name: 'test-release' },
  spec: {
    releasePlan: '',
    snapshot: '',
  },
  status: {},
  ...overrides,
});

describe('ReleaseURLsDescriptionList', () => {
  it('renders nothing if no relevant data is provided', () => {
    render(<ReleaseURLsDescriptionList release={createMockRelease()} />);
    expect(screen.queryByText(/Release notes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Index image/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Github release URL/i)).not.toBeInTheDocument();
  });

  it('renders release notes references if provided', () => {
    const release = createMockRelease({
      spec: {
        releasePlan: '',
        snapshot: '',
        data: {
          releaseNotes: {
            references: ['https://notes.com/1', 'https://notes.com/2'],
          },
        },
      },
    });

    render(<ReleaseURLsDescriptionList release={release} />);
    expect(screen.getByText('Release notes')).toBeInTheDocument();
    expect(screen.getByText('https://notes.com/1')).toBeInTheDocument();
    expect(screen.getByText('https://notes.com/2')).toBeInTheDocument();
  });

  it('renders single release note if not an array', () => {
    const release = createMockRelease({
      spec: {
        releasePlan: '',
        snapshot: '',
        data: {
          releaseNotes: {
            references: 'https://notes.com/single',
          },
        },
      },
    });

    render(<ReleaseURLsDescriptionList release={release} />);
    expect(screen.getByText('https://notes.com/single')).toBeInTheDocument();
  });

  it('renders index image if available in index_image', () => {
    const release = createMockRelease({
      status: {
        releasePlan: '',
        snapshot: '',
        artifacts: {
          index_image: {
            target_index: 'quay.io/org/image:latest',
          },
        },
      },
    });

    render(<ReleaseURLsDescriptionList release={release} />);
    expect(screen.getByText('Index image')).toBeInTheDocument();
    expect(screen.queryByText(/quay.io\/org\/image:latest/i)).toBeInTheDocument();
  });

  it('renders resolved index image if fallback is used', () => {
    const release = createMockRelease({
      status: {
        artifacts: {
          index_image: {
            index_image_resolved: 'quay.io/org/image@sha256:abc123',
          },
        },
      },
    });

    render(<ReleaseURLsDescriptionList release={release} />);
    expect(screen.getByText('Index image')).toBeInTheDocument();
    expect(screen.queryByText(/quay.io\/org\/image@sha256:abc123/i)).toBeInTheDocument();
  });

  it('renders github release URL if available', () => {
    const release = createMockRelease({
      status: {
        artifacts: {
          'github-release': {
            url: 'https://github.com/org/repo/releases/tag/v1.0.0',
          },
        },
      },
    });

    render(<ReleaseURLsDescriptionList release={release} />);
    expect(screen.getByText('Github release URL')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/org/repo/releases/tag/v1.0.0')).toBeInTheDocument();
  });
});
