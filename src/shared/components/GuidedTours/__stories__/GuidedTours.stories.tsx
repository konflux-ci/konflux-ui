import React from 'react';
import { Button, Card, CardBody, CardTitle, PageSection, Title } from '@patternfly/react-core';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useTour } from '~/shared/components/GuidedTours/hooks/useTour';
import { HighlightStep } from '~/shared/components/GuidedTours/steps/HighlightStep';
import { ModalStep } from '~/shared/components/GuidedTours/steps/ModalStep';
import { SpotlightStep } from '~/shared/components/GuidedTours/steps/SpotlightStep';
import { StepNavigation } from '~/shared/components/GuidedTours/steps/StepNavigation';
import { TourProvider } from '~/shared/components/GuidedTours/TourProvider';
import { TourRenderer } from '~/shared/components/GuidedTours/TourRenderer';
import type { MergedStep } from '~/shared/components/GuidedTours/types';

const meta: Meta = {
  title: 'GuidedTours',
};

export default meta;

type Story = StoryObj;

// --- StepNavigation ---

export const StepNavigationFirstStep: Story = {
  name: 'StepNavigation / First Step',
  render: () => (
    <StepNavigation
      currentStep={0}
      totalSteps={5}
      isFirstStep
      isLastStep={false}
      onNext={fn()}
      onPrev={fn()}
      onDone={fn()}
    />
  ),
};

export const StepNavigationMiddleStep: Story = {
  name: 'StepNavigation / Middle Step',
  render: () => (
    <StepNavigation
      currentStep={2}
      totalSteps={5}
      isFirstStep={false}
      isLastStep={false}
      onNext={fn()}
      onPrev={fn()}
      onDone={fn()}
    />
  ),
};

export const StepNavigationLastStep: Story = {
  name: 'StepNavigation / Last Step',
  render: () => (
    <StepNavigation
      currentStep={4}
      totalSteps={5}
      isFirstStep={false}
      isLastStep
      onNext={fn()}
      onPrev={fn()}
      onDone={fn()}
    />
  ),
};

// --- ModalStep ---

export const Modal: Story = {
  name: 'ModalStep',
  render: () => (
    <ModalStep
      title="Welcome to Konflux"
      content="This guided tour will walk you through the key features of the application."
      currentStep={0}
      totalSteps={3}
      isFirstStep
      isLastStep={false}
      onNext={fn()}
      onPrev={fn()}
      onSkip={fn()}
      onDone={fn()}
    />
  ),
};

// --- SpotlightStep ---

export const Spotlight: Story = {
  name: 'SpotlightStep',
  decorators: [
    (Story) => (
      <div style={{ padding: '80px' }}>
        <Button data-tour="demo-target">Target Button</Button>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <SpotlightStep
      title="Create Application"
      content="Click this button to create your first application."
      target="demo-target"
      position="bottom"
      currentStep={1}
      totalSteps={3}
      isFirstStep={false}
      isLastStep={false}
      onNext={fn()}
      onPrev={fn()}
      onSkip={fn()}
      onDone={fn()}
    />
  ),
};

// --- HighlightStep ---

export const Highlight: Story = {
  name: 'HighlightStep',
  decorators: [
    (Story) => (
      <div style={{ padding: '80px' }}>
        <Card data-tour="demo-card">
          <CardTitle>Application Overview</CardTitle>
          <CardBody>This card shows your application details.</CardBody>
        </Card>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <HighlightStep
      title="Application Details"
      content="This card provides an overview of your application status and configuration."
      target="demo-card"
      position="bottom"
      currentStep={2}
      totalSteps={3}
      isFirstStep={false}
      isLastStep
      onNext={fn()}
      onPrev={fn()}
      onSkip={fn()}
      onDone={fn()}
    />
  ),
};

// ---------------------------------------------------------------------------
// E2E: Realistic page with a full guided tour
// ---------------------------------------------------------------------------

/**
 * Simulates a real application page with diverse elements in different
 * positions, shapes, and sizes. The tour walks through 7 steps using all
 * three step types (modal, spotlight, highlight) exactly as a consumer would
 * define a tour config.
 */

const E2E_TOUR_STEPS: MergedStep[] = [
  {
    step: {
      type: 'modal',
      title: 'Welcome to your workspace',
      content:
        'This quick tour will walk you through the main areas of the application page. You can dismiss it at any time by clicking X.',
      variant: 'medium',
    },
    sourceId: 'workspace-tour',
  },
  {
    step: {
      type: 'spotlight',
      title: 'Create an application',
      content:
        'Click here to start creating a new application. You will be guided through selecting a repository, configuring components, and setting up pipelines.',
      target: 'e2e-create-btn',
      position: 'bottom',
    },
    sourceId: 'workspace-tour',
  },
  {
    step: {
      type: 'highlight',
      title: 'Navigation sidebar',
      content:
        'Use the sidebar to navigate between Applications, Components, Secrets, and other sections of your workspace.',
      target: 'e2e-sidebar',
      position: 'right',
    },
    sourceId: 'workspace-tour',
  },
  {
    step: {
      type: 'spotlight',
      title: 'Search and filter',
      content:
        'Use the search bar to quickly find applications by name. You can also use the filter dropdown for advanced filtering.',
      target: 'e2e-search',
      position: 'bottom',
    },
    sourceId: 'workspace-tour',
  },
  {
    step: {
      type: 'highlight',
      title: 'Application list',
      content:
        'All your applications are listed here. Each row shows the application name, status, component count, and last build time.',
      target: 'e2e-app-table',
      position: 'top',
    },
    sourceId: 'workspace-tour',
  },
  {
    step: {
      type: 'highlight',
      title: 'Pipeline status overview',
      content:
        'This panel gives you a quick summary of pipeline run statuses across all applications -- at a glance you can see what succeeded, what failed, and what is running.',
      target: 'e2e-stats-panel',
      position: 'left',
    },
    sourceId: 'workspace-tour',
  },
  {
    step: {
      type: 'modal',
      title: 'You are all set!',
      content:
        'That covers the basics. For more details, check our documentation at docs.konflux.dev. You can replay this tour from the Help menu at any time.',
      closing: true,
    },
    sourceId: 'workspace-tour',
  },
];

// -- Simulated page layout --------------------------------------------------

const SidebarNav: React.FC = () => (
  <nav
    data-tour="e2e-sidebar"
    style={{
      width: 220,
      background: 'var(--pf-t--global--background--color--secondary--default, #f0f0f0)',
      padding: 'var(--pf-t--global--spacer--md, 16px)',
      borderRight: '1px solid var(--pf-t--global--border--color--default, #d2d2d2)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <Title headingLevel="h4" style={{ marginBottom: 12 }}>
      Workspace
    </Title>
    {['Applications', 'Components', 'Secrets', 'Pipelines', 'Releases', 'Access'].map((item) => (
      <Button key={item} variant="link" isInline style={{ textAlign: 'left', padding: '6px 8px' }}>
        {item}
      </Button>
    ))}
  </nav>
);

const StatusBadge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      color: '#fff',
      background: color,
    }}
  >
    {label}
  </span>
);

const AppRow: React.FC<{
  name: string;
  status: string;
  statusColor: string;
  components: number;
  lastBuild: string;
}> = ({ name, status, statusColor, components, lastBuild }) => (
  <tr>
    <td
      style={{
        padding: '10px 16px',
        fontWeight: 500,
        color: 'var(--pf-t--global--color--brand--default)',
      }}
    >
      {name}
    </td>
    <td style={{ padding: '10px 16px' }}>
      <StatusBadge label={status} color={statusColor} />
    </td>
    <td style={{ padding: '10px 16px', textAlign: 'center' }}>{components}</td>
    <td style={{ padding: '10px 16px', color: '#6a6e73' }}>{lastBuild}</td>
  </tr>
);

const StatsPanel: React.FC = () => (
  <Card data-tour="e2e-stats-panel" style={{ width: 260, flexShrink: 0 }}>
    <CardTitle>Pipeline status</CardTitle>
    <CardBody>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Succeeded', value: 24, color: '#3e8635' },
          { label: 'Failed', value: 3, color: '#c9190b' },
          { label: 'Running', value: 2, color: '#06c' },
          { label: 'Pending', value: 1, color: '#6a6e73' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>{label}</span>
            <span style={{ fontWeight: 700, fontSize: 18, color }}>{value}</span>
          </div>
        ))}
      </div>
    </CardBody>
  </Card>
);

/** The main page content that both stories share */
const WorkspacePage: React.FC<{ autoStart?: boolean }> = ({ autoStart = false }) => {
  const { startTour, isActive } = useTour();
  const startedRef = React.useRef(false);

  // Auto-trigger on mount (simulates useTourAutoTrigger for first-visit)
  React.useEffect(() => {
    if (autoStart && !startedRef.current) {
      startedRef.current = true;
      // Small delay so the DOM elements render before the tour targets them
      const timer = setTimeout(() => {
        startTour(E2E_TOUR_STEPS, ['workspace-tour']);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoStart, startTour]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'var(--pf-t--global--font--family--text)',
      }}
    >
      {/* Sidebar */}
      <SidebarNav />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Toolbar */}
        <PageSection
          style={{
            borderBottom: '1px solid var(--pf-t--global--border--color--default, #d2d2d2)',
            padding: '16px 24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title headingLevel="h1">Applications</Title>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button data-tour="e2e-create-btn" variant="primary">
                Create application
              </Button>
              <Button variant="secondary">Import</Button>
              {!autoStart && (
                <Button
                  variant="link"
                  onClick={() => startTour(E2E_TOUR_STEPS, ['workspace-tour'])}
                  isDisabled={isActive}
                >
                  Start guided tour
                </Button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div
            data-tour="e2e-search"
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              placeholder="Search applications..."
              style={{
                flex: 1,
                maxWidth: 400,
                padding: '6px 12px',
                border: '1px solid var(--pf-t--global--border--color--default, #d2d2d2)',
                borderRadius: 4,
                fontSize: 14,
              }}
            />
            <Button variant="control">Filter</Button>
          </div>
        </PageSection>

        {/* Body: table + stats side panel */}
        <div style={{ display: 'flex', flex: 1, gap: 24, padding: 24 }}>
          {/* Table */}
          <div data-tour="e2e-app-table" style={{ flex: 1 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid var(--pf-t--global--border--color--default, #d2d2d2)',
                borderRadius: 4,
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      'var(--pf-t--global--background--color--secondary--default, #f0f0f0)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '10px 16px' }}>Name</th>
                  <th style={{ padding: '10px 16px' }}>Status</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Components</th>
                  <th style={{ padding: '10px 16px' }}>Last build</th>
                </tr>
              </thead>
              <tbody>
                <AppRow
                  name="frontend-app"
                  status="Succeeded"
                  statusColor="#3e8635"
                  components={2}
                  lastBuild="12 min ago"
                />
                <AppRow
                  name="backend-api"
                  status="Running"
                  statusColor="#06c"
                  components={4}
                  lastBuild="3 min ago"
                />
                <AppRow
                  name="auth-service"
                  status="Failed"
                  statusColor="#c9190b"
                  components={1}
                  lastBuild="1 hour ago"
                />
                <AppRow
                  name="worker-jobs"
                  status="Succeeded"
                  statusColor="#3e8635"
                  components={3}
                  lastBuild="45 min ago"
                />
                <AppRow
                  name="ml-pipeline"
                  status="Pending"
                  statusColor="#6a6e73"
                  components={2}
                  lastBuild="2 hours ago"
                />
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <StatsPanel />
        </div>
      </div>

      {/* Tour renderer (renders the active step) */}
      <TourRenderer />
    </div>
  );
};

// -- Stories -----------------------------------------------------------------

export const EndToEndManualTour: Story = {
  name: 'E2E / Manual Tour',
  decorators: [
    (Story) => (
      <TourProvider>
        <Story />
      </TourProvider>
    ),
  ],
  render: () => <WorkspacePage />,
};

export const EndToEndAutoTriggered: Story = {
  name: 'E2E / Auto-Triggered Tour',
  decorators: [
    (Story) => (
      <TourProvider>
        <Story />
      </TourProvider>
    ),
  ],
  render: () => <WorkspacePage autoStart />,
};
