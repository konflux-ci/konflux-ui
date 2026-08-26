import { loadMonitoringConfig } from './load-config';
import { MonitoringService } from './MonitoringService';

export let monitoringService: MonitoringService | null = null;

export function initMonitoring(): MonitoringService {
  const config = loadMonitoringConfig();
  monitoringService = MonitoringService.create(config);
  return monitoringService;
}
