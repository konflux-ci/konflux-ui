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

  initialize(config: MonitoringConfig): Promise<void> {
    this.provider = getProvider(config.provider);
    return this.provider.init(config);
  }

  captureException(error: unknown, context?: Record<string, unknown>): this {
    this.provider.captureException(error, context);
    return this;
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
    void service.initialize(config);
    return service;
  }
}
