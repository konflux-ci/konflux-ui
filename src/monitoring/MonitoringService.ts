import { NoOpProvider } from './providers/NoOpProvider';
import { SentryProvider } from './providers/SentryProvider';
import type {
  IMonitoringProvider,
  LogLevel,
  MonitoringConfig,
  MonitoringProviderId,
  UserContext,
} from './types';

const getProvider = (provider: MonitoringProviderId): IMonitoringProvider<MonitoringConfig> => {
  switch (provider) {
    case 'sentry':
      return new SentryProvider();
    default:
      return new NoOpProvider();
  }
};

export class MonitoringService {
  private provider: IMonitoringProvider<MonitoringConfig>;

  initialize(config: MonitoringConfig): void {
    this.provider = getProvider(config.provider);
    this.provider.init(config);
  }

  captureException(error: unknown, context?: Record<string, unknown>): string | undefined {
    return this.provider.captureException(error, context);
  }

  captureMessage(message: string, level?: LogLevel, context?: Record<string, unknown>): this {
    this.provider.captureMessage(message, level, context);
    return this;
  }

  setUser(user: UserContext | null): this {
    this.provider.setUser(user);
    return this;
  }

  static create(config: MonitoringConfig): MonitoringService {
    const service = new MonitoringService();
    service.initialize(config);
    return service;
  }
}
