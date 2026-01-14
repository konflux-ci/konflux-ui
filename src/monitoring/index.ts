import { loadMonitoringConfig } from './load-config';
import type { MonitoringService as MonitoringServiceType } from './MonitoringService';

export let monitoringService: MonitoringServiceType | null = null;

export async function initMonitoring(): Promise<MonitoringServiceType> {
  const config = loadMonitoringConfig();
  const MonitoringService = (await import('./MonitoringService' /* webpackChunkName: "monitoring-service" */)).MonitoringService;
  monitoringService = MonitoringService.create(config);
  return monitoringService;
}
