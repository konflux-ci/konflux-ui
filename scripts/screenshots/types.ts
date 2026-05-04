export interface K8sResourceEntry {
  data?: unknown;
  isLoading?: boolean;
  error?: unknown;
}

export interface ScreenshotState {
  k8sResources?: Record<string, K8sResourceEntry>;
}

export function setScreenshotState(state: ScreenshotState) {
  (window as unknown as { __screenshotState: ScreenshotState }).__screenshotState = state;
}
