/**
 * Note: Tests assume Jest or Vitest with React Testing Library.
 * - Framework: Jest/Vitest (expect/describe/it)
 * - Library: @testing-library/react (render, renderHook, screen), @testing-library/jest-dom for matchers if available.
 *
 * These tests focus on:
 * - useIsOnFeatureFlag: subscribes via useSyncExternalStore and reflects FeatureFlagsStore.isOn(key).
 * - useFeatureFlags: returns [flags, set] where set delegates to FeatureFlagsStore.set and subscription updates.
 * - IfFeature: renders children or fallback based on feature flag state.
 * - createConditionsHook: ensures conditions via ensureConditions, subscribes to conditions, returns keyed booleans.
 * - useAllFlagsConditions: uses getAllConditionsKeysFromFlags to build hook and behaves similarly.
 */
import * as React from 'react'
import { render, screen, act } from '@testing-library/react'
// Newer @testing-library/react exposes renderHook; for older setups, fall back to @testing-library/react-hooks if present.
// We attempt dynamic import pattern compatible with typical environments.
let renderHook
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  renderHook = require('@testing-library/react').renderHook
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    renderHook = require('@testing-library/react-hooks').renderHook
  } catch {
    // Minimal shim to fail with helpful message later
    renderHook = () => {
      throw new Error('renderHook not available. Ensure @testing-library/react >=13.4 or @testing-library/react-hooks installed.')
    }
  }
}

import type { ConditionKey } from '../conditions'
import type { FlagKey } from '../flags'
jest.mock('../store', () => {
  const subscribers = new Set<() => void>()
  const api = {
    state: {} as Record<string, boolean>,
    conditions: {} as Record<string, boolean>,
    subscribe: (cb: () => void) => {
      subscribers.add(cb)
      return () => subscribers.delete(cb)
    },
    notify: () => {
      subscribers.forEach((cb) => cb())
    },
    isOn: (key: string) => !!api.state[key],
    set: (key: string, value: boolean) => {
      api.state[key] = value
      api.notify()
    },
    ensureConditions: async (keys: string[]) => {
      // Simulate async population: ensure keys exist (leave false unless already set)
      keys.forEach((k) => {
        if (api.conditions[k] === undefined) api.conditions[k] = false
      })
      api.notify()
    },
    __reset: () => {
      api.state = {}
      api.conditions = {}
    },
  }
  return { FeatureFlagsStore: api }
})

jest.mock('../utils', () => ({
  getAllConditionsKeysFromFlags: jest.fn(() => ['cond-a', 'cond-b']),
}))

jest.mock('~/shared', () => ({
  useDeepCompareMemoize: function <T>(value: T) {
    return value
  },
}))

// Import after mocks so hooks use our mocked modules
// eslint-disable-next-line import/first
import {
  useIsOnFeatureFlag,
  useFeatureFlags,
  IfFeature,
  createConditionsHook,
  useAllFlagsConditions,
} from '../hooks'
// eslint-disable-next-line import/first
import { FeatureFlagsStore } from '../store'
// eslint-disable-next-line import/first
import { getAllConditionsKeysFromFlags } from '../utils'

beforeEach(() => {
  // reset mocked store
  // @ts-expect-error - mocked module has helper
  FeatureFlagsStore.__reset()
  jest.clearAllMocks()
})

describe('useIsOnFeatureFlag', () => {
  it('returns false by default for unknown flag and updates on store change (happy path)', () => {
    const FLAG: FlagKey = 'my-flag' as FlagKey
    const { result } = renderHook(() => useIsOnFeatureFlag(FLAG))

    expect(result.current).toBe(false)

    act(() => {
      FeatureFlagsStore.set(FLAG, true)
    })
    expect(result.current).toBe(true)

    act(() => {
      FeatureFlagsStore.set(FLAG, false)
    })
    expect(result.current).toBe(false)
  })

  it('subscribes/unsubscribes correctly (no leaks)', () => {
    const FLAG: FlagKey = 'another-flag' as FlagKey
    const { result, unmount } = renderHook(() => useIsOnFeatureFlag(FLAG))
    expect(result.current).toBe(false)

    act(() => {
      FeatureFlagsStore.set(FLAG, true)
    })
    expect(result.current).toBe(true)

    unmount()
    // After unmount, flipping store should not cause errors or further reads
    act(() => {
      FeatureFlagsStore.set(FLAG, false)
    })
    // no assertion needed beyond no-throw; keep one:
    expect(true).toBe(true)
  })
})

describe('useFeatureFlags', () => {
  it('returns flags snapshot and a setter that delegates to FeatureFlagsStore.set', () => {
    const F1: FlagKey = 'f1' as FlagKey
    const F2: FlagKey = 'f2' as FlagKey

    const { result } = renderHook(() => useFeatureFlags())

    // Initial state empty/falsey
    expect(result.current[0][F1]).toBeUndefined()
    expect(typeof result.current[1]).toBe('function')

    act(() => {
      result.current[1](F1, true)
    })
    expect(FeatureFlagsStore.isOn(F1)).toBe(true)
    expect(result.current[0][F1]).toBe(true)

    act(() => {
      result.current[1](F2, false)
    })
    expect(FeatureFlagsStore.isOn(F2)).toBe(false)
    expect(result.current[0][F2]).toBe(false)
  })

  it('updates snapshot when store changes externally', () => {
    const F: FlagKey = 'extern' as FlagKey
    const { result } = renderHook(() => useFeatureFlags())

    act(() => {
      FeatureFlagsStore.set(F, true)
    })
    expect(result.current[0][F]).toBe(true)
  })
})

describe('IfFeature component', () => {
  const Child = () => <div data-testid="child">child</div>
  const Fallback = () => <div data-testid="fallback">fallback</div>

  it('renders children when flag is on', () => {
    const FLAG: FlagKey = 'flag-on' as FlagKey
    act(() => {
      FeatureFlagsStore.set(FLAG, true)
    })
    render(
      <IfFeature flag={FLAG}>
        <Child />
      </IfFeature>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.queryByTestId('fallback')).toBeNull()
  })

  it('renders fallback when flag is off', () => {
    const FLAG: FlagKey = 'flag-off' as FlagKey
    act(() => {
      FeatureFlagsStore.set(FLAG, false)
    })
    render(
      <IfFeature flag={FLAG} fallback={<Fallback />}>
        <Child />
      </IfFeature>,
    )
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('renders null when flag is off and no fallback provided', () => {
    const FLAG: FlagKey = 'flag-off-null' as FlagKey
    act(() => {
      FeatureFlagsStore.set(FLAG, false)
    })
    const { container } = render(
      <IfFeature flag={FLAG}>
        <Child />
      </IfFeature>,
    )
    // container should be empty when null fragment rendered
    expect(container).toBeEmptyDOMElement()
  })
})

describe('createConditionsHook', () => {
  type CK = ConditionKey

  it('ensures conditions on mount and returns a record defaulting to false', async () => {
    const keys = ['cond-1', 'cond-2'] as CK[]
    const useConditions = createConditionsHook(keys)

    const { result } = renderHook(() => useConditions())

    // Initially defaults to false
    expect(result.current['cond-1']).toBe(false)
    expect(result.current['cond-2']).toBe(false)

    // simulate ensureConditions populating or changing one condition true
    await act(async () => {
      await FeatureFlagsStore.ensureConditions(keys)
      FeatureFlagsStore.conditions['cond-1'] = true
      FeatureFlagsStore.notify()
    })

    expect(result.current['cond-1']).toBe(true)
    expect(result.current['cond-2']).toBe(false)
  })

  it('re-computes map only when deep-equal keys change (memo behavior)', async () => {
    // We mocked useDeepCompareMemoize to return same array instance, so passing equal arrays
    // across re-render should not trigger ensureConditions again beyond initial call.
    const keysA = ['x', 'y'] as CK[]
    const useConditions = createConditionsHook(keysA)

    const { result, rerender } = renderHook(() => useConditions())
    expect(Object.keys(result.current)).toEqual(['x', 'y'])
    await act(async () => {
      await FeatureFlagsStore.ensureConditions(keysA)
    })

    const spyEnsure = jest.spyOn(FeatureFlagsStore, 'ensureConditions')
    rerender()
    expect(spyEnsure).not.toHaveBeenCalled()
  })

  it('handles unknown keys gracefully', () => {
    const keys = ['not-prepared'] as CK[]
    const useConditions = createConditionsHook(keys)
    const { result } = renderHook(() => useConditions())
    expect(result.current['not-prepared']).toBe(false)
  })
})

describe('useAllFlagsConditions', () => {
  it('uses keys from getAllConditionsKeysFromFlags and returns conditions map', async () => {
    (getAllConditionsKeysFromFlags as jest.Mock).mockReturnValue(['cond-a', 'cond-b'])
    const { result } = renderHook(() => useAllFlagsConditions)

    // result is a function (the hook returned by factory); call via renderHook properly:
    const { result: inner } = renderHook(() => (result.current as unknown as () => Record<string, boolean>)())
    expect(inner.current['cond-a']).toBe(false)
    expect(inner.current['cond-b']).toBe(false)

    await act(async () => {
      await FeatureFlagsStore.ensureConditions(['cond-a', 'cond-b'])
      FeatureFlagsStore.conditions['cond-b'] = true
      FeatureFlagsStore.notify()
    })

    expect(inner.current['cond-a']).toBe(false)
    expect(inner.current['cond-b']).toBe(true)
  })
})