/**
 * Sentry initialization — must be imported before any other application code.
 *
 * This follows Sentry's documented pattern for React Router integration:
 * Sentry.init() must run before createBrowserRouter() is called.
 * Since createBrowserRouter runs at module evaluation time in routes/index.tsx,
 * this module ensures Sentry is initialized first via a side-effect import
 * at the top of main.tsx.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/react/features/react-router/v6/
 */
import { initMonitoring } from '~/monitoring';

try {
  initMonitoring();
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('[monitoring] Failed to initialize monitoring', e);
}
