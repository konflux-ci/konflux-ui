import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNudgeConfig } from '~/hooks/useNudgeConfig';
import { ComponentKind } from '~/types';
import { renderWithQueryClientAndRouter, mockUseNamespaceHook } from '~/unit-test-utils';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';
import { mockNudgeConfig } from '../__data__/mock-nudge-config';
import NudgingSection from '../NudgingSection';

jest.mock('~/hooks/useNudgeConfig');
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

const useNudgeConfigMock = useNudgeConfig as jest.Mock;

const component = {
  metadata: { name: 'app1', namespace: 'test-ns' },
} as ComponentKind;

mockUseNamespaceHook('test-ns');
setupVirtualizerMock();

describe('NudgingSection (outgoing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a row per outgoing nudge, defaulting an omitted mode to immediate', () => {
    useNudgeConfigMock.mockReturnValue([mockNudgeConfig, true, undefined]);
    renderWithQueryClientAndRouter(<NudgingSection component={component} direction="outgoing" />);

    expect(screen.getByText('app2')).toBeInTheDocument();
    expect(screen.getByText('immediate')).toBeInTheDocument();
    expect(screen.getByText('Nudges (1)')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByTestId('nudging-mode')).toHaveClass('pf-m-filled');
    expect(screen.getByTestId('nudging-mode')).not.toHaveClass('pf-m-blue');
  });

  it('links the nudged component name to its details page', () => {
    useNudgeConfigMock.mockReturnValue([mockNudgeConfig, true, undefined]);
    renderWithQueryClientAndRouter(<NudgingSection component={component} direction="outgoing" />);

    expect(screen.getByRole('link', { name: 'app2' })).toHaveAttribute(
      'href',
      '/ns/test-ns/components/app2',
    );
  });

  it('renders an explicit mode as-is', () => {
    const uiComponent = { metadata: { name: 'app2', namespace: 'test-ns' } } as ComponentKind;
    useNudgeConfigMock.mockReturnValue([mockNudgeConfig, true, undefined]);
    renderWithQueryClientAndRouter(<NudgingSection component={uiComponent} direction="outgoing" />);

    expect(screen.getByText('app3')).toBeInTheDocument();
    expect(screen.getByText('validated')).toBeInTheDocument();
    expect(screen.getByTestId('nudging-mode')).toHaveClass('pf-m-blue');
  });

  it('renders the gating group when present', () => {
    const configWithGatingGroup = {
      ...mockNudgeConfig,
      spec: {
        nudges: [{ from: 'app1', to: 'app2', gatingGroup: 'builds' }],
      },
    };
    useNudgeConfigMock.mockReturnValue([configWithGatingGroup, true, undefined]);
    renderWithQueryClientAndRouter(<NudgingSection component={component} direction="outgoing" />);

    expect(screen.getByTestId('nudging-gating-group')).toHaveTextContent('builds');
  });

  it('renders the placeholder empty state when there are no matching entries', () => {
    const otherComponent = { metadata: { name: 'no-nudges-here' } } as ComponentKind;
    useNudgeConfigMock.mockReturnValue([mockNudgeConfig, true, undefined]);
    renderWithQueryClientAndRouter(
      <NudgingSection component={otherComponent} direction="outgoing" />,
    );

    expect(screen.getByTestId('nudging-empty-state')).toBeInTheDocument();
  });

  it('renders the placeholder empty state when NudgeConfig is entirely absent', () => {
    useNudgeConfigMock.mockReturnValue([null, true, undefined]);
    renderWithQueryClientAndRouter(<NudgingSection component={component} direction="outgoing" />);

    expect(screen.getByTestId('nudging-empty-state')).toBeInTheDocument();
  });

  it('handles a component without a metadata name', () => {
    useNudgeConfigMock.mockReturnValue([mockNudgeConfig, true, undefined]);
    renderWithQueryClientAndRouter(
      <NudgingSection component={{ metadata: {} } as ComponentKind} direction="outgoing" />,
    );

    expect(screen.getByText('Nudges (0)')).toBeInTheDocument();
    expect(screen.getByTestId('nudging-empty-state')).toBeInTheDocument();
  });

  it('surfaces a non-404 error instead of the table', () => {
    useNudgeConfigMock.mockReturnValue([null, true, { code: 403 }]);
    renderWithQueryClientAndRouter(<NudgingSection component={component} direction="outgoing" />);

    expect(screen.queryByTestId('nudging-table')).not.toBeInTheDocument();
  });

  it('is collapsible', async () => {
    const user = userEvent.setup();
    useNudgeConfigMock.mockReturnValue([mockNudgeConfig, true, undefined]);
    renderWithQueryClientAndRouter(<NudgingSection component={component} direction="outgoing" />);

    expect(screen.getByText('app2')).toBeVisible();
    await user.click(
      screen.getByTestId('nudges-section-toggle').querySelector('button') as HTMLElement,
    );
    expect(screen.getByText('app2')).not.toBeVisible();
  });

  it('renders no add/remove/edit controls (read-only)', () => {
    useNudgeConfigMock.mockReturnValue([mockNudgeConfig, true, undefined]);
    renderWithQueryClientAndRouter(<NudgingSection component={component} direction="outgoing" />);

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});

describe('NudgingSection (incoming)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a row per incoming nudge', () => {
    useNudgeConfigMock.mockReturnValue([mockNudgeConfig, true, undefined]);
    renderWithQueryClientAndRouter(<NudgingSection component={component} direction="incoming" />);

    expect(screen.getByText('app4')).toBeInTheDocument();
    expect(screen.getByText('Nudged by (1)')).toBeInTheDocument();
  });
});
