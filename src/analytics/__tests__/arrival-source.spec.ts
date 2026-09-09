import { SESSION_STORAGE_KEYS } from '~/consts/constants';
import { GitProvider } from '~/shared/utils/git-utils';
import {
  ArrivalSource,
  captureArrivalSourceOnce,
  classifyReferrer,
  getArrivalSource,
  isKnownGitProvider,
  markSessionStartedOnce,
  refineArrivalSource,
} from '../arrival-source';

const setReferrer = (referrer: string) => {
  Object.defineProperty(document, 'referrer', {
    value: referrer,
    configurable: true,
  });
};

describe('classifyReferrer', () => {
  const cases: Array<[referrer: string, expected: ArrivalSource]> = [
    ['', GitProvider.UNSURE],
    ['https://github.com', GitProvider.GITHUB],
    ['https://github.com/konflux-ci/konflux-ui', GitProvider.GITHUB],
    ['https://github.com/konflux-ci/konflux-ui/pull/1', GitProvider.GITHUB],
    ['https://gist.github.com/someone/abc', GitProvider.GITHUB],
    ['HTTPS://GITHUB.COM/foo', GitProvider.GITHUB],
    ['http://github.com/', GitProvider.GITHUB],
    ['https://gitlab.com/some/project', GitProvider.GITLAB],
    ['https://gitlab.com/konflux-ci/konflux-ui/-/merge_requests/42', GitProvider.GITLAB],
    ['https://sub.gitlab.com/org/repo', GitProvider.GITLAB],
    ['HTTPS://GITLAB.COM/foo', GitProvider.GITLAB],
    ['https://bitbucket.org/some/project', GitProvider.BITBUCKET],
    ['https://sub.bitbucket.org/org/repo', GitProvider.BITBUCKET],
    ['HTTPS://BITBUCKET.ORG/foo', GitProvider.BITBUCKET],
    ['https://app.slack.com/client', GitProvider.UNSURE],
    ['https://notgithub.com', GitProvider.UNSURE],
    ['https://notgitlab.com', GitProvider.UNSURE],
    ['https://notbitbucket.org.evil.com', GitProvider.UNSURE],
    ['https://github.com.evil.com/phishing', GitProvider.UNSURE],
    ['https://gitlab.com.evil.com/phishing', GitProvider.UNSURE],
    ['https://bitbucket.org.evil.com/phishing', GitProvider.UNSURE],
    ['https://evilgithub.com/', GitProvider.UNSURE],
    ['not a valid url', GitProvider.UNSURE],
    ['/relative/path/only', GitProvider.UNSURE],
    ['   ', GitProvider.UNSURE],
  ];

  it.each(cases)('classifies "%s" as "%s"', (referrer, expected) => {
    expect(classifyReferrer(referrer)).toBe(expected);
  });
});

describe('captureArrivalSourceOnce / getArrivalSource', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    setReferrer('');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should default to "other" when nothing has been captured yet', () => {
    expect(getArrivalSource()).toBe(GitProvider.UNSURE);
  });

  it('should capture and persist "github" for a github.com referrer', () => {
    setReferrer('https://github.com/konflux-ci/konflux-ui');

    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe(GitProvider.GITHUB);
  });

  it('should capture and persist "gitlab" for a gitlab.com referrer', () => {
    setReferrer('https://gitlab.com/some/project');

    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe(GitProvider.GITLAB);
  });

  it('should capture and persist "other" for a non-github/gitlab/bitbucket referrer', () => {
    setReferrer('https://app.slack.com/client');

    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe(GitProvider.UNSURE);
  });

  it('should capture and persist "other" for an empty referrer (direct navigation)', () => {
    setReferrer('');

    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe(GitProvider.UNSURE);
  });

  it('should only capture once per session — a second call must not overwrite the first value', () => {
    setReferrer('https://github.com/konflux-ci/konflux-ui');
    captureArrivalSourceOnce();
    expect(getArrivalSource()).toBe(GitProvider.GITHUB);

    // Simulates the OAuth redirect landing back with a different referrer.
    setReferrer('https://oauth-proxy.example.com/oauth2/callback');
    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe(GitProvider.GITHUB);
  });

  it('should only write to sessionStorage once, under the arrival-source key, with only the enum value', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    setReferrer('https://github.com/konflux-ci/konflux-ui');

    captureArrivalSourceOnce();
    captureArrivalSourceOnce();

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(
      SESSION_STORAGE_KEYS.ARRIVAL_SOURCE,
      JSON.stringify(GitProvider.GITHUB),
    );
  });

  it('should never persist the raw referrer URL, only the classified value', () => {
    setReferrer('https://github.com/some-org/super-secret-private-repo/pull/42');

    captureArrivalSourceOnce();

    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEYS.ARRIVAL_SOURCE);
    expect(stored).toBe(JSON.stringify(GitProvider.GITHUB));
    expect(stored).not.toContain('super-secret-private-repo');
  });

  it('should not throw and should default to "other" when sessionStorage access throws', () => {
    jest.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled');
    });
    setReferrer('https://github.com/konflux-ci/konflux-ui');

    expect(() => captureArrivalSourceOnce()).not.toThrow();
    expect(getArrivalSource()).toBe(GitProvider.UNSURE);
  });
});

describe('markSessionStartedOnce', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return true on the first call in a new tab session', () => {
    expect(markSessionStartedOnce()).toBe(true);
  });

  it('should return false on a second call within the same tab session (simulates an effect re-run)', () => {
    expect(markSessionStartedOnce()).toBe(true);
    expect(markSessionStartedOnce()).toBe(false);
  });

  it('should return false on every subsequent call, no matter how many times it is called (simulates in-tab route navigation)', () => {
    expect(markSessionStartedOnce()).toBe(true);
    expect(markSessionStartedOnce()).toBe(false);
    expect(markSessionStartedOnce()).toBe(false);
    expect(markSessionStartedOnce()).toBe(false);
  });

  it('should still return false after a simulated page reload of the same tab (sessionStorage persists across reload)', () => {
    expect(markSessionStartedOnce()).toBe(true);

    // A reload re-executes main.tsx and re-mounts App, but sessionStorage
    // survives — this is the actual mechanism that must prevent a re-fire.
    expect(markSessionStartedOnce()).toBe(false);
  });

  it('should return true again in a fresh tab session (sessionStorage cleared, e.g. a genuinely new tab)', () => {
    expect(markSessionStartedOnce()).toBe(true);

    window.sessionStorage.clear();

    expect(markSessionStartedOnce()).toBe(true);
  });

  it('should persist only a boolean flag under the dedicated session-started key, not the arrival source', () => {
    markSessionStartedOnce();

    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.SESSION_STARTED_FIRED)).toBe(
      JSON.stringify(true),
    );
    expect(window.sessionStorage.getItem(SESSION_STORAGE_KEYS.ARRIVAL_SOURCE)).toBeNull();
  });

  it('should not throw and should return true on every call when sessionStorage access throws', () => {
    jest.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled');
    });

    // Storage-disabled browsers can't dedupe reliably — same accepted
    // limitation as captureArrivalSourceOnce (see above). This can't be
    // fixed without persistent storage, so we only assert it doesn't throw.
    expect(() => markSessionStartedOnce()).not.toThrow();
    expect(markSessionStartedOnce()).toBe(true);
  });
});

describe('refineArrivalSource', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    setReferrer('');
  });

  it('should upgrade from "other" to "gitlab" when git-provider label is available', () => {
    captureArrivalSourceOnce();
    expect(getArrivalSource()).toBe(GitProvider.UNSURE);

    refineArrivalSource(GitProvider.GITLAB);

    expect(getArrivalSource()).toBe(GitProvider.GITLAB);
  });

  it('should upgrade from "other" to "forgejo" when git-provider label is available', () => {
    captureArrivalSourceOnce();

    refineArrivalSource(GitProvider.FORGEJO);

    expect(getArrivalSource()).toBe(GitProvider.FORGEJO);
  });

  it('should not downgrade a specific source back to "other"', () => {
    setReferrer('https://github.com');
    captureArrivalSourceOnce();

    refineArrivalSource(GitProvider.UNSURE);

    expect(getArrivalSource()).toBe(GitProvider.GITHUB);
  });

  it('should not overwrite an already-specific source with a different one', () => {
    setReferrer('https://github.com');
    captureArrivalSourceOnce();

    refineArrivalSource(GitProvider.GITLAB);

    expect(getArrivalSource()).toBe(GitProvider.GITHUB);
  });
});

describe('isKnownGitProvider', () => {
  it.each([GitProvider.GITHUB, GitProvider.GITLAB, GitProvider.BITBUCKET, GitProvider.FORGEJO])(
    'returns true for %s',
    (provider) => {
      expect(isKnownGitProvider(provider)).toBe(true);
    },
  );

  it.each([GitProvider.UNSURE, GitProvider.INVALID, undefined, '', 'not-a-provider'])(
    'returns false for %s',
    (value) => {
      expect(isKnownGitProvider(value)).toBe(false);
    },
  );
});
