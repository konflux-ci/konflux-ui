import { initPerfMeasuring } from './perf';

/** Plugins that break Cypress Studio recording — only register outside Studio mode. */
export function registerRunPlugins(): void {
  require('cypress-mochawesome-reporter/register');
  require('@cypress/code-coverage/support');
  require('cypress-terminal-report/src/installLogsCollector')({ enableExtendedCollector: true });
  initPerfMeasuring('cypress/perfstats.json');
}
