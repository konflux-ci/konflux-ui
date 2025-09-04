import * as React from 'react';
/**
 * Note: This test suite assumes the project's configured test runner (Jest or Vitest)
 * and @testing-library/react for rendering. If your project uses Vitest, replace jest.*
 * with vi.* or rely on provided compatibility. Tests are written to be framework-agnostic
 * aside from the mocking API naming.
 */

import { render, screen, act, renderHook } from '@testing-library/react';
import type { ConditionKey } from '../conditions';
import type { FlagKey } from '../flags';
// Under test
import {
  IfFeature,
  useFeatureFlags,
  useIsOnFeatureFlag,
  createConditionsHook,
  useAllFlagsConditions,
} from '../hooks';

// Mocks
jest.mock('../store', () => {
  // Simple subscription hub to simulate useSyncExternalStore source
  const subscribers = new Set<() => void>();
  let state: Record<string, boolean> = {};
  let conditions: Record<string, boolean> = {};

  const notify = () => subscribers.forEach((cb) => cb());

  return {
    FeatureFlagsStore: {
      // exposed for tests to manipulate
      _notify: notify,
      _setState(next: Record<string, boolean>) {
        state = { ...next };
        notify();
      },
      _setConditions(next: Record<string, boolean>) {
        conditions = { ...next };
        notify();
      },

      // API used by hooks
      subscribe: (cb: () => void) => {
        subscribers.add(cb);
        return () => subscribers.delete(cb);
      },
      isOn: (key: string) => !!state[key],
      set: (key: string, value: boolean) => {
        state = { ...state, [key]: value };
        notify();
      },
      ensureConditions: jest.fn(async () => {
        // noop in tests; can be inspected via mock
      }),
      get state() {
        return state;
      },
      get conditions() {
        return conditions;
      },
    },
  };
});

jest.mock('../utils', () => ({
  getAllConditionsKeysFromFlags: jest.fn(() => ['condA', 'condB']),
}));

// useDeepCompareMemoize is imported from '~/shared' in the code.
// We mock it to return a stable reference when the deep-equal content is the same.
// For the keys passed by the factory, it should just return the same array value.
jest.mock('~/shared', () => ({
  useDeepCompareMemoize: (value: unknown) => value,
}));

const { FeatureFlagsStore } = jest.requireMock('../store') as {
  FeatureFlagsStore: {
    _notify: () => void;
    _setState: (s: Record<string, boolean>) => void;
    _setConditions: (c: Record<string, boolean>) => void;
    subscribe: (cb: () => void) => () => void;
    isOn: (key: string) => boolean;
    set: (key: string, value: boolean) => void;
    ensureConditions: jest.Mock<Promise<void>, [ConditionKey[]]>;
    readonly state: Record<string, boolean>;
    readonly conditions: Record<string, boolean>;
  };
};

const { getAllConditionsKeysFromFlags } = jest.requireMock('../utils') as {
  getAllConditionsKeysFromFlags: jest.Mock<ConditionKey[]>;
};

describe('feature-flags hooks', () => {
  beforeEach(() => {
    // reset store state/conditions and mock calls
    FeatureFlagsStore._setState({});
    FeatureFlagsStore._setConditions({});
    FeatureFlagsStore.ensureConditions.mockClear();
    getAllConditionsKeysFromFlags.mockClear();
  });

  describe('useIsOnFeatureFlag', () => {
    it('returns false by default and reflects store.isOn', () => {
      const { result } = renderHook(() => useIsOnFeatureFlag('beta-ui' as FlagKey));
      expect(result.current).toBe(false);

      act(() => {
        FeatureFlagsStore._setState({ 'beta-ui': true });
      });
      expect(result.current).toBe(true);

      act(() => {
        FeatureFlagsStore._setState({ 'beta-ui': false });
      });
      expect(result.current).toBe(false);
    });

    it('subscribes to store updates and cleans up on unmount', () => {
      const unsubscribeSpy = jest.fn();
      const subscribeSpy = jest
        .spyOn(FeatureFlagsStore, 'subscribe')
        // @ts-expect-error override for spy
        .mockImplementation((cb: () => void) => {
          const unsub = () => unsubscribeSpy();
          // Immediately register; call-through to actual behavior
          const cleanup = unsub;
          // Capture: we still want updates to flow
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const realUnsub = (FeatureFlagsStore as any).subscribe.wrappedOriginal
            ? (FeatureFlagsStore as any).subscribe.wrappedOriginal(cb)
            : (() => {
                // minimal impl if spy wraps first time
                return cleanup;
              })();
          /* eslint-enable @typescript-eslint/no-explicit-any */
          // Return composed cleanup
          return () => {
            realUnsub?.();
            cleanup();
          };
        });

      const { unmount } = renderHook(() => useIsOnFeatureFlag('exp' as FlagKey));
      expect(subscribeSpy).toHaveBeenCalledTimes(1);
      unmount();
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

      subscribeSpy.mockRestore();
    });
  });

  describe('useFeatureFlags', () => {
    it('returns [flags, set] where flags tracks store.state over time', () => {
      const { result } = renderHook(() => useFeatureFlags());

      // initial
      expect(result.current[0]).toEqual({});

      act(() => {
        FeatureFlagsStore._setState({ a: true, b: false });
      });
      expect(result.current[0]).toEqual({ a: true, b: false });

      // set function should delegate to FeatureFlagsStore.set
      act(() => {
        const set = result.current[1];
        set('b' as FlagKey, true);
      });
      expect(result.current[0]).toEqual({ a: true, b: true });
    });

    it('set function identity is stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useFeatureFlags());
      const firstSet = result.current[1];
      rerender();
      expect(result.current[1]).toBe(firstSet);
    });
  });

  describe('IfFeature component', () => {
    it('renders children when flag is ON', () => {
      act(() => {
        FeatureFlagsStore._setState({ 'new-nav': true });
      });

      render(
        <IfFeature flag={'new-nav' as FlagKey}>
          <div data-testid="content">Hello</div>
        </IfFeature>,
      );

      expect(screen.getByTestId('content')).toHaveTextContent('Hello');
    });

    it('renders fallback when flag is OFF', () => {
      act(() => {
        FeatureFlagsStore._setState({ 'new-nav': false });
      });

      render(
        <IfFeature flag={'new-nav' as FlagKey} fallback={<span data-testid="fallback">Nope</span>}>
          <div data-testid="content">Hello</div>
        </IfFeature>,
      );

      expect(screen.queryByTestId('content')).toBeNull();
      expect(screen.getByTestId('fallback')).toHaveTextContent('Nope');
    });

    it('renders null when flag is OFF and no fallback provided', () => {
      act(() => {
        FeatureFlagsStore._setState({ 'new-nav': false });
      });

      const { container } = render(
        <IfFeature flag={'new-nav' as FlagKey}>
          <div data-testid="content">Hello</div>
        </IfFeature>,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('createConditionsHook', () => {
    it('calls ensureConditions with provided keys on mount (deep-memoized)', async () => {
      const keys = ['condX', 'condY'] as ConditionKey[];
      const useConditions = createConditionsHook(keys);

      renderHook(() => useConditions());
      expect(FeatureFlagsStore.ensureConditions).toHaveBeenCalledTimes(1);
      expect(FeatureFlagsStore.ensureConditions).toHaveBeenCalledWith(keys);
    });

    it('returns a record with defaults false and updates when store changes', () => {
      const keys = ['alpha', 'beta'] as ConditionKey[];
      const useConditions = createConditionsHook(keys);

      const { result } = renderHook(() => useConditions());

      // default false when missing
      expect(result.current).toEqual({ alpha: false, beta: false });

      act(() => {
        FeatureFlagsStore._setConditions({ alpha: true });
      });
      expect(result.current).toEqual({ alpha: true, beta: false });

      act(() => {
        FeatureFlagsStore._setConditions({ alpha: true, beta: true });
      });
      expect(result.current).toEqual({ alpha: true, beta: true });
    });

    it('does not recall ensureConditions on re-render if keys are deep-equal', () => {
      const literal = ['c1', 'c2'] as ConditionKey[];
      const useConditions = createConditionsHook(literal);

      const { rerender } = renderHook(() => useConditions());
      expect(FeatureFlagsStore.ensureConditions).toHaveBeenCalledTimes(1);

      rerender();
      expect(FeatureFlagsStore.ensureConditions).toHaveBeenCalledTimes(1);
    });
  });

  describe('useAllFlagsConditions', () => {
    it('uses keys from getAllConditionsKeysFromFlags and ensures them', () => {
      getAllConditionsKeysFromFlags.mockReturnValue(['k1', 'k2']);
      const { result } = renderHook(() => useAllFlagsConditions);

      // IMPORTANT: useAllFlagsConditions is a hook factory already invoked at module init,
      // so result.current is a hook function. We need to run that hook.
      const { result: inner } = renderHook(() => result.current());

      expect(FeatureFlagsStore.ensureConditions).toHaveBeenCalledWith(['k1', 'k2']);
      // Default values are false
      expect(inner.current).toEqual({ k1: false, k2: false });

      act(() => {
        FeatureFlagsStore._setConditions({ k1: true });
      });
      expect(inner.current).toEqual({ k1: true, k2: false });
    });
  });
});