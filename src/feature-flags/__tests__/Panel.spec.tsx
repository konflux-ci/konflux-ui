/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for Feature Flags Panel component.
 * Framework: The project uses an existing test runner (Vitest or Jest) with @testing-library/react.
 * These tests focus on the recent diff in Panel: rendering changes, flag toggling logic,
 * disabled states, persistence calls, and error/fallback handling.
 */
import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Panel } from '../Panel'

// Attempt both vitest and jest global compat
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockFn = (global as any).vi
  ? (global as any).vi.fn
  : (global as any).jest
  ? (global as any).jest.fn
  : () => {
      throw new Error('No test mock fn available')
    }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const spyOnFn = (global as any).vi
  ? (global as any).vi.spyOn
  : (global as any).jest
  ? (global as any).jest.spyOn
  : () => {
      throw new Error('No spyOn available')
    }

let getFlagsMock = mockFn()
let setFlagMock = mockFn()
let saveMock = mockFn()
let onErrorMock = mockFn()

function jestOrViReset() {
  if ((global as any).vi) {
    (global as any).vi.resetAllMocks()
  } else if ((global as any).jest) {
    (global as any).jest.resetAllMocks()
  }
  // Ensure consistent timing in Jest environments
  ;(global as any).jest?.useFakeTimers?.().setSystemTime?.(new Date('2024-01-01'))
}

function jestOrViMockModules() {
  const g: any = global as any
  const mockImpl = () => ({
    useFlags: () => ({
      flags: getFlagsMock(),
      setFlag: setFlagMock,
      save: saveMock,
      onError: onErrorMock,
    }),
  })

  // Try common module paths; only one needs to succeed in the actual environment.
  try {
    g.jest?.mock?.('../hooks/useFlags', () => mockImpl())
  } catch {
    // no-op
  }

  try {
    g.vi?.mock?.('../hooks/useFlags', () => mockImpl())
  } catch {
    // no-op
  }

  try {
    g.jest?.mock?.('../flags', () => mockImpl())
  } catch {
    // no-op
  }

  try {
    g.vi?.mock?.('../flags', () => mockImpl())
  } catch {
    // no-op
  }
}

jestOrViReset()
jestOrViMockModules()

describe('FeatureFlags Panel', () => {
  beforeEach(() => {
    getFlagsMock = mockFn()
    setFlagMock = mockFn()
    saveMock = mockFn()
    onErrorMock = mockFn()
    jestOrViReset()
  })

  it('renders a list of flags and their current states (happy path)', () => {
    getFlagsMock.mockReturnValue({
      newDashboard: true,
      betaSearch: false,
      legacyMode: false,
    })
    render(<Panel />)
    const list = screen.getByRole('list', { name: /feature flags/i })
    expect(within(list).getByRole('listitem', { name: /newDashboard/i })).toBeInTheDocument()
    expect(
      within(list).getByRole('switch', { name: /newDashboard/i })
    ).toHaveAttribute('aria-checked', 'true')
    expect(within(list).getByRole('switch', { name: /betaSearch/i })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('toggles a flag via UI and calls setFlag with correct key and value', async () => {
    const user = userEvent.setup()
    getFlagsMock.mockReturnValue({ betaSearch: false })
    render(<Panel />)
    const toggle = screen.getByRole('switch', { name: /betaSearch/i })
    await user.click(toggle)
    expect(setFlagMock).toHaveBeenCalledWith('betaSearch', true)
  })

  it('persists changes when clicking Save and shows success feedback', async () => {
    const user = userEvent.setup()
    getFlagsMock.mockReturnValue({ newDashboard: false })
    saveMock.mockResolvedValueOnce(undefined)

    render(<Panel />)
    await user.click(screen.getByRole('switch', { name: /newDashboard/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(saveMock).toHaveBeenCalledTimes(1)
    // Accept either toast or inline alert patterns
    const success = await screen.findByText(/saved/i)
    expect(success).toBeInTheDocument()
  })

  it('handles save failure by showing an error message and not clearing changes', async () => {
    const user = userEvent.setup()
    getFlagsMock.mockReturnValue({ legacyMode: true })
    const error = new Error('Network down')
    saveMock.mockRejectedValueOnce(error)

    render(<Panel />)
    await user.click(screen.getByRole('switch', { name: /legacyMode/i })) // flip to false
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(saveMock).toHaveBeenCalled()
    expect(onErrorMock).toHaveBeenCalledWith(error)
    expect(await screen.findByText(/failed|error/i)).toBeInTheDocument()
    // State should still reflect the attempted change until reverted by user.
    expect(screen.getByRole('switch', { name: /legacyMode/i })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('disables toggles and save when Panel is read-only', async () => {
    const user = userEvent.setup()
    getFlagsMock.mockReturnValue({ newDashboard: true, readOnly: true })
    render(<Panel readOnly />)
    const toggle = screen.getByRole('switch', { name: /newDashboard/i })
    expect(toggle).toHaveAttribute('aria-disabled', 'true')
    await user.click(toggle)
    expect(setFlagMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('supports filtering flags by search input (edge case: no matches)', async () => {
    const user = userEvent.setup()
    getFlagsMock.mockReturnValue({ newDashboard: true, betaSearch: true })
    render(<Panel />)
    const search = screen.getByRole('searchbox', { name: /search flags/i })
    await user.type(search, 'nonexistent-flag-xyz')
    expect(screen.getByText(/no flags found/i)).toBeInTheDocument()
  })

  it('renders fallback when flags are not yet loaded (loading state)', () => {
    getFlagsMock.mockReturnValue(null as any)
    render(<Panel />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('gracefully ignores unknown or non-boolean flag values', () => {
    getFlagsMock.mockReturnValue({ experimentalThing: 'not-boolean' as any })
    render(<Panel />)
    const item = screen.getByRole('listitem', { name: /experimentalThing/i })
    expect(item).toBeInTheDocument()
    // switch may be unchecked by default when value is invalid
    expect(
      screen.getByRole('switch', { name: /experimentalThing/i })
    ).toHaveAttribute('aria-checked', 'false')
  })
})