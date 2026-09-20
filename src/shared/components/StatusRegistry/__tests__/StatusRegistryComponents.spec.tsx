import { screen } from '@testing-library/react';
import { createStatusRegistry } from '~/shared/utils/status-registry';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import {
  RegistryStatusIcon,
  RegistryStatusIconWithText,
  buildStatusFilterOptions,
  createStatusComponents,
  useStatusDisplay,
} from '../StatusRegistryComponents';

// ---------------------------------------------------------------------------
// Minimal test registry
// ---------------------------------------------------------------------------

type TestStatus = 'Active' | 'Done' | 'Unknown';
type TestResource = { state: string };

const testRegistry = createStatusRegistry<TestStatus, TestResource>()({
  statuses: [
    { status: 'Active', match: (obj) => obj.state === 'active', category: 'info', weight: 10 },
    {
      status: 'Done',
      match: (obj) => obj.state === 'done',
      category: 'success',
      weight: 50,
      label: 'Completed',
    },
    { status: 'Unknown', match: () => true, category: 'neutral', weight: 90 },
  ],
});

// ---------------------------------------------------------------------------
// useStatusDisplay
// ---------------------------------------------------------------------------

describe('useStatusDisplay', () => {
  const TestHookConsumer = ({ resource }: { resource: TestResource | null }) => {
    const display = useStatusDisplay(testRegistry, resource);
    return (
      <div>
        <span data-test="status">{display.status ?? 'null'}</span>
        <span data-test="label">{display.label}</span>
        <span data-test="category">{display.category}</span>
        <span data-test="color">{display.color}</span>
      </div>
    );
  };

  it('derives status from resource', () => {
    renderWithQueryClientAndRouter(<TestHookConsumer resource={{ state: 'active' }} />);
    expect(screen.getByTestId('status')).toHaveTextContent('Active');
    expect(screen.getByTestId('label')).toHaveTextContent('Active');
    expect(screen.getByTestId('category')).toHaveTextContent('info');
  });

  it('uses label override when present', () => {
    renderWithQueryClientAndRouter(<TestHookConsumer resource={{ state: 'done' }} />);
    expect(screen.getByTestId('label')).toHaveTextContent('Completed');
  });

  it('returns null status for null resource', () => {
    renderWithQueryClientAndRouter(<TestHookConsumer resource={null} />);
    expect(screen.getByTestId('status')).toHaveTextContent('null');
  });
});

// ---------------------------------------------------------------------------
// RegistryStatusIcon
// ---------------------------------------------------------------------------

describe('RegistryStatusIcon', () => {
  it('renders without crashing', () => {
    const { container } = renderWithQueryClientAndRouter(
      <RegistryStatusIcon registry={testRegistry} status="Active" />,
    );
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// RegistryStatusIconWithText
// ---------------------------------------------------------------------------

describe('RegistryStatusIconWithText', () => {
  it('renders status label text', () => {
    renderWithQueryClientAndRouter(
      <RegistryStatusIconWithText registry={testRegistry} status="Active" />,
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('uses custom text when provided', () => {
    renderWithQueryClientAndRouter(
      <RegistryStatusIconWithText registry={testRegistry} status="Active" text="Custom Label" />,
    );
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('renders data-test attribute', () => {
    renderWithQueryClientAndRouter(
      <RegistryStatusIconWithText
        registry={testRegistry}
        status="Active"
        dataTestAttribute="test-status"
      />,
    );
    expect(screen.getByTestId('test-status')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// buildStatusFilterOptions
// ---------------------------------------------------------------------------

describe('buildStatusFilterOptions', () => {
  it('returns filter options for all statuses sorted by weight', () => {
    const options = buildStatusFilterOptions(testRegistry);
    expect(options).toHaveLength(3);
    expect(options[0].value).toBe('Active');
    expect(options[1].value).toBe('Done');
    expect(options[2].value).toBe('Unknown');
  });

  it('each option has label, value, and icon', () => {
    const options = buildStatusFilterOptions(testRegistry);
    for (const opt of options) {
      expect(opt.label).toBeTruthy();
      expect(opt.value).toBeTruthy();
      expect(opt.icon).toBeDefined();
    }
  });

  it('uses label override for option label', () => {
    const options = buildStatusFilterOptions(testRegistry);
    const doneOpt = options.find((o) => o.value === 'Done');
    expect(doneOpt?.label).toBe('Completed');
  });

  it('excludes specified statuses', () => {
    const options = buildStatusFilterOptions(testRegistry, new Set(['Unknown'] as TestStatus[]));
    expect(options).toHaveLength(2);
    expect(options.find((o) => o.value === 'Unknown')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// createStatusComponents (factory → namespace pattern)
// ---------------------------------------------------------------------------

describe('createStatusComponents', () => {
  const TestStatus = createStatusComponents(testRegistry);

  describe('StatusIconWithText', () => {
    it('renders status text without passing registry', () => {
      renderWithQueryClientAndRouter(<TestStatus.StatusIconWithText status="Active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('uses label override', () => {
      renderWithQueryClientAndRouter(<TestStatus.StatusIconWithText status="Done" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('accepts custom text', () => {
      renderWithQueryClientAndRouter(<TestStatus.StatusIconWithText status="Active" text="Busy" />);
      expect(screen.getByText('Busy')).toBeInTheDocument();
    });
  });

  describe('StatusIcon', () => {
    it('renders without crashing', () => {
      const { container } = renderWithQueryClientAndRouter(
        <TestStatus.StatusIcon status="Active" />,
      );
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('useStatusDisplay', () => {
    const HookConsumer = ({ resource }: { resource: TestResource | null }) => {
      const display = TestStatus.useStatusDisplay(resource);
      return (
        <div>
          <span data-test="ns-status">{display.status ?? 'null'}</span>
          <span data-test="ns-label">{display.label}</span>
        </div>
      );
    };

    it('derives status without passing registry', () => {
      renderWithQueryClientAndRouter(<HookConsumer resource={{ state: 'done' }} />);
      expect(screen.getByTestId('ns-status')).toHaveTextContent('Done');
      expect(screen.getByTestId('ns-label')).toHaveTextContent('Completed');
    });

    it('returns null for null resource', () => {
      renderWithQueryClientAndRouter(<HookConsumer resource={null} />);
      expect(screen.getByTestId('ns-status')).toHaveTextContent('null');
    });
  });

  describe('filterOptions', () => {
    it('has options for all statuses', () => {
      expect(TestStatus.filterOptions).toHaveLength(3);
    });

    it('each option has icon', () => {
      for (const opt of TestStatus.filterOptions) {
        expect(opt.icon).toBeDefined();
      }
    });
  });

  describe('statusFilterFn', () => {
    it('filters by derived status', () => {
      expect(TestStatus.statusFilterFn({ state: 'active' }, ['Active'])).toBe(true);
      expect(TestStatus.statusFilterFn({ state: 'active' }, ['Done'])).toBe(false);
    });
  });
});
