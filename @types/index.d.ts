declare module '*/overview/*.svg' {
  import { FC, SVGProps } from 'react';
  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg' {
  const value: any;
  export = value;
}
declare module '*.png' {
  const value: any;
  export = value;
}

// Global window type augmentation for runtime configuration
import type { MonitoringConfig } from "~/monitoring/types";

declare global {
  interface Window {
    /** Konflux UI monitoring configuration injected at runtime */
    KONFLUX_MONITORING?: {
      enabled: boolean;
      dsn: string;
      environment: string;
      cluster: string;
      sampleRates: {
        errors: number;
      };
    };
  }
}

export {};
