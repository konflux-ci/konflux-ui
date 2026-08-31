import { SESSION_STORAGE_KEYS } from '~/consts/constants';
import {
  ArrivalSource,
  captureArrivalSourceOnce,
  classifyReferrer,
  getArrivalSource,
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
    ['', 'other'],
    ['https://github.com', 'github'],
    ['https://github.com/konflux-ci/konflux-ui', 'github'],
    ['https://github.com/konflux-ci/konflux-ui/pull/1', 'github'],
    ['https://gist.github.com/someone/abc', 'github'],
    ['HTTPS://GITHUB.COM/foo', 'github'],
    ['http://github.com/', 'github'],
    ['https://gitlab.com/some/project', 'gitlab'],
    ['https://gitlab.com/konflux-ci/konflux-ui/-/merge_requests/42', 'gitlab'],
    ['https://sub.gitlab.com/org/repo', 'gitlab'],
    ['HTTPS://GITLAB.COM/foo', 'gitlab'],
    ['https://app.slack.com/client', 'other'],
    ['https://notgithub.com', 'other'],
    ['https://notgitlab.com', 'other'],
    ['https://github.com.evil.com/phishing', 'other'],
    ['https://gitlab.com.evil.com/phishing', 'other'],
    ['https://evilgithub.com/', 'other'],
    ['not a valid url', 'other'],
    ['/relative/path/only', 'other'],
    ['   ', 'other'],
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
    expect(getArrivalSource()).toBe('other');
  });

  it('should capture and persist "github" for a github.com referrer', () => {
    setReferrer('https://github.com/konflux-ci/konflux-ui');

    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe('github');
  });

  it('should capture and persist "gitlab" for a gitlab.com referrer', () => {
    setReferrer('https://gitlab.com/some/project');

    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe('gitlab');
  });

  it('should capture and persist "other" for a non-github/gitlab referrer', () => {
    setReferrer('https://app.slack.com/client');

    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe('other');
  });

  it('should capture and persist "other" for an empty referrer (direct navigation)', () => {
    setReferrer('');

    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe('other');
  });

  it('should only capture once per session — a second call must not overwrite the first value', () => {
    setReferrer('https://github.com/konflux-ci/konflux-ui');
    captureArrivalSourceOnce();
    expect(getArrivalSource()).toBe('github');

    // Simulates the OAuth redirect landing back with a different referrer.
    setReferrer('https://oauth-proxy.example.com/oauth2/callback');
    captureArrivalSourceOnce();

    expect(getArrivalSource()).toBe('github');
  });

  it('should only write to sessionStorage once, under the arrival-source key, with only the enum value', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    setReferrer('https://github.com/konflux-ci/konflux-ui');

    captureArrivalSourceOnce();
    captureArrivalSourceOnce();

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(
      SESSION_STORAGE_KEYS.ARRIVAL_SOURCE,
      JSON.stringify('github'),
    );
  });

  it('should never persist the raw referrer URL, only the classified value', () => {
    setReferrer('https://github.com/some-org/super-secret-private-repo/pull/42');

    captureArrivalSourceOnce();

    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEYS.ARRIVAL_SOURCE);
    expect(stored).toBe(JSON.stringify('github'));
    expect(stored).not.toContain('super-secret-private-repo');
  });

  it('should not throw and should default to "other" when sessionStorage access throws', () => {
    jest.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled');
    });
    setReferrer('https://github.com/konflux-ci/konflux-ui');

    expect(() => captureArrivalSourceOnce()).not.toThrow();
    expect(getArrivalSource()).toBe('other');
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
    expect(getArrivalSource()).toBe('other');

    refineArrivalSource('gitlab');

    expect(getArrivalSource()).toBe('gitlab');
  });

  it('should upgrade from "other" to "github" when git-provider label is available', () => {
    captureArrivalSourceOnce();

    refineArrivalSource('github');

    expect(getArrivalSource()).toBe('github');
  });

  it('should not downgrade a specific source back to "other"', () => {
    setReferrer('https://github.com');
    captureArrivalSourceOnce();

    refineArrivalSource('other');

    expect(getArrivalSource()).toBe('github');
  });

  it('should not overwrite an already-specific source with a different one', () => {
    setReferrer('https://github.com');
    captureArrivalSourceOnce();

    refineArrivalSource('gitlab');

    expect(getArrivalSource()).toBe('github');
  });
});
