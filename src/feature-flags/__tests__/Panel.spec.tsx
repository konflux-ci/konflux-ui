/**
 * Tests for FeatureFlagPanel and createFeatureFlagPanelModal.
 * Note: This project is assumed to use Jest + React Testing Library.
 * If the repository uses a different runner (e.g., Vitest), the APIs are compatible with minor adjustments.
 */
/* eslint-disable @typescript-eslint/no-explicit-any, global-require, @typescript-eslint/no-var-requires */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
jest.mock('@patternfly/react-core', () => {
  const actual = jest.requireActual('@patternfly/react-core');
  return {
    ...actual,
    // Provide minimal Switch usable behavior; RTL will interact via click/checkbox
    Switch: ({ id, label, isDisabled, isChecked, onChange }) => (
      <label aria-label={`switch-${id}`}>
        <input
          type="checkbox"
          role="switch"
          aria-disabled={isDisabled ? 'true' : 'false'}
          disabled={isDisabled}
          checked={!!isChecked}
          onChange={(e) => onChange?.(e, e.currentTarget.checked)}
        />
        <span>{label}</span>
      </label>
    ),
    Tooltip: ({ content, children }) => (
      <div data-testid="tooltip">
        <span data-testid="tooltip-content">{content}</span>
        {children}
      </div>
    ),
    Label: ({ color, children }) => <span data-testid={`label-${color}`}>{children}</span>,
  };
});
jest.mock('~/components/modal/createModalLauncher', () => {
  // Capture the passed component and options for assertions
  const launcherMock = jest.fn((Comp, opts) => {
    (launcherMock as any).__lastComponent = Comp;
    (launcherMock as any).__lastOptions = opts;
    return function MockLaunched() {
      return <div data-test="mock-modal-launcher" />;
    };
  });
  return { createModalLauncher: launcherMock };
});
jest.mock('../flags', () => {
  // Default FLAGS mock; specific tests will override via jest.doMock when needed
  return {
    __esModule: true,
    FLAGS_STATUS: { wip: 'Work in progress', enabled: 'Enabled' },
    FLAGS: {},
  };
});
jest.mock('../hooks', () => {
  // Default hooks can be overridden per test via mockImplementation
  return {
    __esModule: true,
    useFeatureFlags: jest.fn(() => [{}, jest.fn()]),
    useAllFlagsConditions: jest.fn(() => ({})),
  };
});
jest.mock('../conditions', () => {
  return {
    __esModule: true,
    guardSatisfied: jest.fn(() => true),
  };
});
jest.mock('../store', () => {
  return {
    __esModule: true,
    FeatureFlagsStore: { resetAll: jest.fn() },
  };
});
import { guardSatisfied } from '../conditions';
import { FLAGS_STATUS } from '../flags';
import { useFeatureFlags } from '../hooks';
import { FeatureFlagPanel } from '../Panel';
import { FeatureFlagsStore } from '../store';

describe('FeatureFlagPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no experimental features are found', () => {
    // FLAGS mocked empty by default and guardSatisfied default true does not matter
    render(<FeatureFlagPanel />);
    expect(screen.getByText(/No experimental features found/i)).toBeInTheDocument();
  });

  it('renders a visible flag without guard and toggles it via Switch (happy path)', async () => {
    jest.isolateModules(async () => {
      jest.doMock('../flags', () => ({
        __esModule: true,
        FLAGS_STATUS,
        FLAGS: {
          testFlag: {
            key: 'testFlag',
            description: 'Test Flag',
            status: 'enabled',
          },
        },
      }));
      const { FeatureFlagPanel: Panel } = require('../Panel');
      const setFlag = jest.fn();
      (useFeatureFlags as jest.Mock).mockReturnValue([{ testFlag: false }, setFlag]);
      (guardSatisfied as jest.Mock).mockReturnValue(true);

      render(<Panel />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toBeEnabled();
      expect(switchEl).not.toBeChecked();

      await userEvent.click(switchEl);
      expect(setFlag).toHaveBeenCalledWith('testFlag', true);

      // Label should be green for "enabled"
      expect(screen.getByTestId('label-green')).toHaveTextContent('Enabled');
    });
  });

  it('renders disabled flag with tooltip when guard is not satisfied but visible with reason', async () => {
    jest.isolateModules(async () => {
      jest.doMock('../flags', () => ({
        __esModule: true,
        FLAGS_STATUS,
        FLAGS: {
          guardedFlag: {
            key: 'guardedFlag',
            description: 'Guarded Feature',
            status: 'wip',
            guard: { visible: true, reason: 'Requires admin' },
          },
        },
      }));
      const { FeatureFlagPanel: Panel } = require('../Panel');

      (useFeatureFlags as jest.Mock).mockReturnValue([{ guardedFlag: false }, jest.fn()]);
      (guardSatisfied as jest.Mock).mockReturnValue(false);
      render(<Panel />);

      expect(screen.getByTestId('label-orange')).toHaveTextContent('Work in progress');
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toBeDisabled();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Requires admin');
    });
  });

  it('filters out flags whose guard is not satisfied and not visible', () => {
    jest.isolateModules(async () => {
      jest.doMock('../flags', () => ({
        __esModule: true,
        FLAGS_STATUS,
        FLAGS: {
          hiddenFlag: {
            key: 'hiddenFlag',
            description: 'Hidden Feature',
            status: 'enabled',
            guard: { visible: false, reason: 'Not available' },
          },
        },
      }));
      const { FeatureFlagPanel: Panel } = require('../Panel');
      (guardSatisfied as jest.Mock).mockReturnValue(false);
      render(<Panel />);
      expect(screen.getByText(/No experimental features found/i)).toBeInTheDocument();
    });
  });

  it('passes correct props to modal launcher and triggers reset action', async () => {
    const { createModalLauncher } = require('~/components/modal/createModalLauncher');
    expect(createModalLauncher.__lastOptions).toBeTruthy();
    const opts = createModalLauncher.__lastOptions;

    expect(opts['data-test']).toBe('feature-flag-panel');
    expect(opts.title).toBe('Feature Flags');
    expect(opts.variant).toBe('medium');
    expect(opts.titleIconVariant).toBeTruthy();

    const ActionBtn = opts.actions.find(a => a?.props?.children === 'Reset to Defaults');
    expect(ActionBtn).toBeTruthy();
    render(<div>{ActionBtn}</div>);
    const btn = screen.getByRole('button', { name: /Reset to Defaults/i });
    await userEvent.click(btn);
    expect(FeatureFlagsStore.resetAll).toHaveBeenCalledTimes(1);
  });

  it('handles multiple flags and maintains checked state individually', async () => {
    jest.isolateModules(async () => {
      jest.doMock('../flags', () => ({
        __esModule: true,
        FLAGS_STATUS,
        FLAGS: {
          one: { key: 'one', description: 'One', status: 'enabled' },
          two: { key: 'two', description: 'Two', status: 'wip' },
        },
      }));
      const { FeatureFlagPanel: Panel } = require('../Panel');

      const setFlag = jest.fn();
      (useFeatureFlags as jest.Mock).mockReturnValue([{ one: true, two: false }, setFlag]);
      (guardSatisfied as jest.Mock).mockReturnValue(true);

      render(<Panel />);
      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(2);
      expect(switches[0]).toBeChecked();
      expect(switches[1]).not.toBeChecked();

      await userEvent.click(switches[1]);
      expect(setFlag).toHaveBeenLastCalledWith('two', true);
    });
  });
});

describe('FeatureFlagPanel - edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not crash when hooks return unexpected values', () => {
    jest.isolateModules(async () => {
      jest.doMock('../flags', () => ({
        __esModule: true,
        FLAGS_STATUS: { wip: 'Work in progress', enabled: 'Enabled' },
        FLAGS: {
          weird: { key: 'weird', description: 'Weird', status: 'enabled', guard: undefined },
        },
      }));
      const { FeatureFlagPanel: Panel } = require('../Panel');
      const setFlag = jest.fn();
      const anyVal = null;
      const badConditions = undefined;
      const { useFeatureFlags: mockUseFeatureFlags, useAllFlagsConditions: mockUseAllFlagsConditions } = require('../hooks');
      const { guardSatisfied: mockGuardSatisfied } = require('../conditions');
      (mockUseFeatureFlags as jest.Mock).mockReturnValue([anyVal, setFlag]);
      (mockUseAllFlagsConditions as jest.Mock).mockReturnValue(badConditions);
      (mockGuardSatisfied as jest.Mock).mockImplementation(() => true);

      render(<Panel />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toBeEnabled();
    });
  });

  it('invokes setFlag with false when toggling off', async () => {
    jest.isolateModules(async () => {
      jest.doMock('../flags', () => ({
        __esModule: true,
        FLAGS_STATUS: { wip: 'Work in progress', enabled: 'Enabled' },
        FLAGS: {
          toggler: { key: 'toggler', description: 'Toggle Me', status: 'enabled' },
        },
      }));
      const { FeatureFlagPanel: Panel } = require('../Panel');
      const setFlag = jest.fn();
      const { useFeatureFlags: mockUseFeatureFlags2 } = require('../hooks');
      (mockUseFeatureFlags2 as jest.Mock).mockReturnValue([{ toggler: true }, setFlag]);

      render(<Panel />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toBeChecked();
      await userEvent.click(switchEl);
      expect(setFlag).toHaveBeenCalledWith('toggler', false);
    });
  });
});