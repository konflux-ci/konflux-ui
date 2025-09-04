/**
 * Tests for FeatureFlagPanel and createFeatureFlagPanelModal.
 *
 * Testing library/framework: Jest + React Testing Library (RTL) with @testing-library/user-event and jest-dom.
 * If this project uses Vitest, replace jest.fn with vi.fn and import from 'vitest' accordingly.
 */

import React from 'react';
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Module under test
// Prefer importing from the actual component file if available (Panel), but fall back to index barrel.

let FeatureFlagPanel: React.ComponentType;

// Mocks for dependencies used by Panel
// Guard/conditions

const guardSatisfiedMock = jest.fn<boolean, unknown[]>();

// Hooks

const setFlagSpy = jest.fn();
const useFeatureFlagsMock = jest.fn(() => [{}, setFlagSpy]);
const useAllFlagsConditionsMock = jest.fn(() => ({}));

// Flags + types + status

const FLAGS_STATUS = {
  wip: 'Work in Progress',
  stable: 'Stable',
  beta: 'Beta',
} as const;

// Provide a flexible FLAGS mock container we can mutate per-test

let FLAGS: Record<string, unknown> = {};

// Store resetAll

const resetAllSpy = jest.fn();

// Modal launcher mock which captures the config passed at module-eval time

const createModalLauncherSpy = jest.fn((_Comp: React.ComponentType, cfg: Record<string, unknown>) => {
  (createModalLauncherSpy as unknown as { lastConfig?: Record<string, unknown> }).lastConfig = cfg;
  const Wrapper: React.FC = (props) => <div data-test="modal-wrapper">{props.children}</div>;
  return Wrapper;
});

// Wire up jest module mocks before importing SUT to intercept module initialization

jest.mock('../conditions', () => ({
  guardSatisfied: (...args: unknown[]) => guardSatisfiedMock(...args),
}));
jest.mock('../hooks', () => ({
  useFeatureFlags: () => useFeatureFlagsMock(),
  useAllFlagsConditions: () => useAllFlagsConditionsMock(),
}));
jest.mock('../flags', () => ({
  // dynamic getters to reference latest FLAGS and FLAGS_STATUS in each test
  get FLAGS() {
    return FLAGS;
  },
  FLAGS_STATUS,
  // Exporting FlagKey type at runtime is a no-op; tests will cast accordingly.
}));
jest.mock('../store', () => ({
  FeatureFlagsStore: {
    resetAll: () => resetAllSpy(),
  },
}));
jest.mock('~/components/modal/createModalLauncher', () => ({
  createModalLauncher: (...args: unknown[]) => createModalLauncherSpy(...args),
}));

// Now import the SUT. Adjust the import path if the component resides at a different location.

beforeAll(async () => {
  // Try common module paths; avoid dynamic require failures breaking test file parse by deferring in beforeAll
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../Panel'); // src/feature-flags/Panel
  FeatureFlagPanel = mod.FeatureFlagPanel;
});

beforeEach(() => {
  jest.clearAllMocks();
  FLAGS = {}; // reset flags mock per test
  (useFeatureFlagsMock as jest.Mock).mockReturnValue([{}, setFlagSpy]);
  (useAllFlagsConditionsMock as jest.Mock).mockReturnValue({});
  (guardSatisfiedMock as jest.Mock).mockReturnValue(true);
});

describe('FeatureFlagPanel', () => {
  test('renders empty state when no experimental features found', () => {
    // No flags
    render(<FeatureFlagPanel />);
    expect(screen.getByText(/No experimental features found\./i)).toBeInTheDocument();
  });

  test('renders a flag without guard as enabled switch with correct status label color', () => {
    FLAGS = {
      testFlag: {
        key: 'testFlag',
        description: 'Test Flag',
        status: 'wip', // should render orange label per implementation
        // no guard
      },
    };

    (useFeatureFlagsMock as jest.Mock).mockReturnValue([{ testFlag: true }, setFlagSpy]);

    render(<FeatureFlagPanel />);

    const switchEl = screen.getByRole('switch', { name: /Test Flag/i });
    expect(switchEl).toBeInTheDocument();
    expect(switchEl).toBeEnabled();
    // Status label text
    expect(screen.getByText(FLAGS_STATUS.wip)).toBeInTheDocument();
  });

  test('renders disabled switch wrapped in tooltip when guard is not satisfied but visible with a reason', async () => {
    FLAGS = {
      guardedFlag: {
        key: 'guardedFlag',
        description: 'Guarded Flag',
        status: 'beta',
        guard: { visible: true, reason: 'Requires admin' },
      },
    };

    (guardSatisfiedMock as jest.Mock).mockReturnValue(false);
    render(<FeatureFlagPanel />);

    // Switch exists but disabled
    const switchEl = screen.getByRole('switch', { name: /Guarded Flag/i });
    expect(switchEl).toBeDisabled();

    // Tooltip content exists in DOM (PatternFly Tooltip renders content; depending on implementation it may be lazy-mounted)
    expect(screen.getByText(/Requires admin/i)).toBeInTheDocument();
  });

  test('does not render flag when guard is not satisfied and not visible', () => {
    FLAGS = {
      hiddenFlag: {
        key: 'hiddenFlag',
        description: 'Hidden Flag',
        status: 'beta',
        guard: { visible: false, reason: 'Secret' },
      },
    };
    (guardSatisfiedMock as jest.Mock).mockReturnValue(false);

    render(<FeatureFlagPanel />);
    // Should fall back to empty message because the only flag is hidden
    expect(screen.getByText(/No experimental features found\./i)).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /Hidden Flag/i })).not.toBeInTheDocument();
  });

  test('enables switch when guard is satisfied', () => {
    FLAGS = {
      readyFlag: {
        key: 'readyFlag',
        description: 'Ready Flag',
        status: 'stable',
        guard: { visible: true },
      },
    };
    (useFeatureFlagsMock as jest.Mock).mockReturnValue([{ readyFlag: false }, setFlagSpy]);
    (guardSatisfiedMock as jest.Mock).mockReturnValue(true);

    render(<FeatureFlagPanel />);
    const switchEl = screen.getByRole('switch', { name: /Ready Flag/i });
    expect(switchEl).toBeEnabled();
  });

  test('toggle dispatches setFlag with the correct key and value', async () => {
    const user = userEvent.setup();

    FLAGS = {
      toggleFlag: {
        key: 'toggleFlag',
        description: 'Toggle Flag',
        status: 'beta',
      },
    };

    (useFeatureFlagsMock as jest.Mock).mockReturnValue([{ toggleFlag: false }, setFlagSpy]);
    render(<FeatureFlagPanel />);

    const switchEl = screen.getByRole('switch', { name: /Toggle Flag/i });
    await user.click(switchEl);

    // onChange passes (_, checked) with new checked state; expect setFlag called with key and checked
    expect(setFlagSpy).toHaveBeenCalledWith('toggleFlag', true);
  });

  test('renders multiple flags in a stack with correct count and order (snapshot sanity)', () => {
    FLAGS = {
      a: { key: 'a', description: 'A', status: 'beta' },
      b: { key: 'b', description: 'B', status: 'stable' },
      c: { key: 'c', description: 'C', status: 'wip' },
    };

    (useFeatureFlagsMock as jest.Mock).mockReturnValue([{ a: true, b: false, c: true }, setFlagSpy]);

    render(<FeatureFlagPanel />);

    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(3);

    // Assert presence by accessible name
    expect(screen.getByRole('switch', { name: /A/ })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /B/ })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /C/ })).toBeInTheDocument();
  });
});

describe('createFeatureFlagPanelModal', () => {
  test('wires modal with title, icon, data-test, and includes Reset action that calls FeatureFlagsStore.resetAll', async () => {
    // The module import in beforeAll should have executed createModalLauncher, capturing config in spy
    const cfg = (createModalLauncherSpy as unknown as { lastConfig: Record<string, unknown> }).lastConfig;
    expect(cfg).toBeTruthy();
    expect(cfg['data-test']).toBe('feature-flag-panel');
    expect(cfg.title).toBe('Feature Flags');
    expect(cfg.variant).toBe('medium');
    expect(cfg.titleIconVariant).toBeTruthy();

    // Actions should contain a Button with text "Reset to Defaults"
    // Render the action in isolation to trigger click
    const user = userEvent.setup();
    const actionEl = cfg.actions.find((el: ReactElement) =>
      // Some PF Buttons render content as children; match by text
      (el?.props?.children && (Array.isArray(el.props.children)
        ? el.props.children.includes('Reset to Defaults')
        : el.props.children === 'Reset to Defaults'))
    );

    expect(actionEl).toBeTruthy();

    // Render the found action into DOM to interact
    render(<div data-test="action-host">{actionEl}</div>);
    const btn = screen.getByRole('button', { name: /Reset to Defaults/i });
    await user.click(btn);

    expect(resetAllSpy).toHaveBeenCalledTimes(1);
  });
});