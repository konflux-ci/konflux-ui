import { pipelineRunsPageLoader } from '../pipeline-runs-page';

jest.mock('~/feature-flags/utils', () => ({
  ...jest.requireActual('~/feature-flags/utils'),
  ensureFeatureFlagOnLoader: jest.fn(),
}));

describe('pipelineRunsPageLoader', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no view param', () => {
    const request = new Request('http://localhost/ns/ws/prns');
    const result = pipelineRunsPageLoader({ request });
    expect(result).toBeNull();
  });

  it('returns null when view param but no matching saved view', () => {
    const request = new Request('http://localhost/ns/ws/prns?view=nonexistent');
    const result = pipelineRunsPageLoader({ request });
    expect(result).toBeNull();
  });

  it('redirects bare view URL to full URL with saved params', () => {
    localStorage.setItem(
      'saved-views:pipeline-runs',
      JSON.stringify([
        {
          slug: 'my-view',
          searchParams: 'status=running&type=build',
          label: 'My View',
          columnStateKey: 'prns-columns:my-view',
        },
      ]),
    );
    const request = new Request('http://localhost/ns/ws/prns?view=my-view');
    const result = pipelineRunsPageLoader({ request });
    expect(result).not.toBeNull();
    expect(result).toBeInstanceOf(Response);
    expect(result.headers.get('Location')).toBe(
      '/ns/ws/prns?view=my-view&status=running&type=build',
    );
  });

  it('does NOT redirect when URL already has params beyond view (prevents loop)', () => {
    localStorage.setItem(
      'saved-views:pipeline-runs',
      JSON.stringify([
        {
          slug: 'my-view',
          searchParams: 'status=running',
          label: 'My View',
          columnStateKey: 'prns-columns:my-view',
        },
      ]),
    );
    const request = new Request('http://localhost/ns/ws/prns?view=my-view&status=running');
    const result = pipelineRunsPageLoader({ request });
    expect(result).toBeNull();
  });

  it('returns null when localStorage has invalid JSON', () => {
    localStorage.setItem('saved-views:pipeline-runs', 'not-json');
    const request = new Request('http://localhost/ns/ws/prns?view=my-view');
    const result = pipelineRunsPageLoader({ request });
    expect(result).toBeNull();
  });

  it('returns null when saved view has no searchParams', () => {
    localStorage.setItem(
      'saved-views:pipeline-runs',
      JSON.stringify([
        {
          slug: 'my-view',
          searchParams: '',
          label: 'Empty View',
          columnStateKey: 'prns-columns:my-view',
        },
      ]),
    );
    const request = new Request('http://localhost/ns/ws/prns?view=my-view');
    const result = pipelineRunsPageLoader({ request });
    expect(result).toBeNull();
  });
});
