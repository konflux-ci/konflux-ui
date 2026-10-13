declare module '*.png' {
  const value: any;
  export = value;
}

declare module '*/overview/*.svg' {
  import { FC, SVGProps } from 'react';
  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg' {
  const value: any;
  export = value;
}

// Global window type augmentation for runtime configuration
interface Window {
  /** Konflux UI runtime configuration injected via runtime-config.js */
  KONFLUX_RUNTIME?: {
    [key: string]: string | undefined;
    // Monitoring configuration
    MONITORING_ENABLED?: string;
    MONITORING_DSN?: string;
    MONITORING_ENVIRONMENT?: string;
    MONITORING_CLUSTER?: string;
    MONITORING_SAMPLE_RATE_ERRORS?: string;
    MONITORING_SAMPLE_RATE_TRACES?: string;
    // Analytics configuration
    ANALYTICS_ENABLED?: string;
    ANALYTICS_WRITE_KEY?: string;
    ANALYTICS_API_URL?: string;
  };
}
