import React, { Component, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@patternfly/patternfly/patternfly.css';
import '@patternfly/patternfly/utilities/Accessibility/accessibility.css';
import '@patternfly/patternfly/utilities/Display/display.css';
import '@patternfly/patternfly/utilities/Flex/flex.css';
import '@patternfly/patternfly/utilities/Sizing/sizing.css';
import '@patternfly/patternfly/utilities/Spacing/spacing.css';

/**
 * Each agent-generated render file exports a `scenarios` array with this shape.
 * The capture script loads the render file and passes the scenario index via
 * the URL search param `?scenario=<index>`.
 */
export interface Scenario {
  id: string;
  label: string;
  render: () => React.ReactElement;
}

const NAMESPACE_CONTEXT_DEFAULT = {
  namespace: 'test-ns',
  lastUsedNamespace: 'test-ns',
  namespaceResource: undefined,
  namespaces: [],
  namespacesLoaded: true,
};

async function loadNamespaceContext() {
  try {
    const mod = await import(
      // @ts-expect-error resolved by Vite's ~/ alias at runtime, not visible to tsc
      '~/shared/providers/Namespace/namespace-context'
    );
    return mod.NamespaceContext;
  } catch {
    return null;
  }
}

async function loadModalProvider() {
  try {
    const mod = await import(
      // @ts-expect-error resolved by Vite's ~/ alias at runtime
      '~/components/modal/ModalProvider'
    );
    return mod.ModalProvider;
  } catch {
    return null;
  }
}

async function loadFilterContextProvider() {
  try {
    const mod = await import(
      // @ts-expect-error resolved by Vite's ~/ alias at runtime
      '~/components/Filter/generic/FilterContext'
    );
    return mod.FilterContextProvider;
  } catch {
    return null;
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          id="harness-error"
          style={{ padding: 16, color: 'red', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
        >
          <strong>Render error:</strong>
          <br />
          {this.state.error.message}
          <br />
          <br />
          {this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

interface LoadedProviders {
  NsCtx: React.Context<unknown> | null;
  ModalProv: React.FC<{ children: React.ReactNode }> | null;
  FilterProv: React.FC<{ filterParams: string[]; children: React.ReactNode }> | null;
}

function Providers({
  children,
  providers,
}: {
  children: React.ReactNode;
  providers: LoadedProviders;
}) {
  const { NsCtx, ModalProv, FilterProv } = providers;

  let content = children;

  if (FilterProv) {
    content = <FilterProv filterParams={['name']}>{content}</FilterProv>;
  }

  if (ModalProv) {
    content = <ModalProv>{content}</ModalProv>;
  }

  content = (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
    </BrowserRouter>
  );

  if (NsCtx) {
    content = <NsCtx.Provider value={NAMESPACE_CONTEXT_DEFAULT}>{content}</NsCtx.Provider>;
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
}

function Harness() {
  const [scenarioElement, setScenarioElement] = useState<React.ReactElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<LoadedProviders | null>(null);

  useEffect(() => {
    Promise.all([loadNamespaceContext(), loadModalProvider(), loadFilterContextProvider()]).then(
      ([nsCtx, modalProv, filterProv]) => {
        setProviders({
          NsCtx: nsCtx as LoadedProviders['NsCtx'],
          ModalProv: modalProv as LoadedProviders['ModalProv'],
          FilterProv: filterProv as LoadedProviders['FilterProv'],
        });
      },
    );
  }, []);

  useEffect(() => {
    if (!providers) return;

    async function loadScenario() {
      try {
        const params = new URLSearchParams(window.location.search);
        const renderFile = params.get('renderFile');
        const scenarioIndex = parseInt(params.get('scenario') ?? '0', 10);

        if (!renderFile) {
          setError('Missing ?renderFile= search param');
          return;
        }

        const mod = await import(/* @vite-ignore */ renderFile);
        const scenarios: Scenario[] = mod.scenarios ?? mod.default?.scenarios ?? mod.default;

        if (!Array.isArray(scenarios) || scenarios.length === 0) {
          setError(`Render file "${renderFile}" did not export a scenarios array`);
          return;
        }

        if (scenarioIndex >= scenarios.length) {
          setError(`Scenario index ${scenarioIndex} out of bounds (${scenarios.length} scenarios)`);
          return;
        }

        const element = scenarios[scenarioIndex].render();
        setScenarioElement(element);
      } catch (e) {
        setError(String(e));
      }
    }

    loadScenario();
  }, [providers]);

  if (error) {
    return (
      <div id="harness-error" style={{ padding: 16, color: 'red', fontFamily: 'monospace' }}>
        {error}
      </div>
    );
  }

  if (!scenarioElement || !providers) {
    return <div id="harness-loading">Loading...</div>;
  }

  return (
    <Providers providers={providers}>
      <div id="harness-ready" style={{ height: '100vh', overflow: 'auto' }}>
        {scenarioElement}
      </div>
    </Providers>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Harness />);
