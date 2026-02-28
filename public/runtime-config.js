// Runtime configuration - overwritten by init container in staging/production
// This file provides defaults for local development where monitoring is disabled
window.KONFLUX_RUNTIME = window.KONFLUX_RUNTIME || {};

// Monitoring defaults (disabled for local development)
if (window.KONFLUX_RUNTIME.MONITORING_ENABLED === undefined) {
  window.KONFLUX_RUNTIME.MONITORING_ENABLED = 'false';
}
if (window.KONFLUX_RUNTIME.MONITORING_DSN === undefined) {
  window.KONFLUX_RUNTIME.MONITORING_DSN = '';
}
if (window.KONFLUX_RUNTIME.MONITORING_ENVIRONMENT === undefined) {
  window.KONFLUX_RUNTIME.MONITORING_ENVIRONMENT = 'development';
}
if (window.KONFLUX_RUNTIME.MONITORING_CLUSTER === undefined) {
  window.KONFLUX_RUNTIME.MONITORING_CLUSTER = 'local';
}
if (window.KONFLUX_RUNTIME.MONITORING_SAMPLE_RATE_ERRORS === undefined) {
  window.KONFLUX_RUNTIME.MONITORING_SAMPLE_RATE_ERRORS = '0.2';
}

// Analytics defaults (disabled for local development)
if (window.KONFLUX_RUNTIME.ANALYTICS_ENABLED === undefined) {
  window.KONFLUX_RUNTIME.ANALYTICS_ENABLED = 'false';
}
if (window.KONFLUX_RUNTIME.ANALYTICS_WRITE_KEY === undefined) {
  window.KONFLUX_RUNTIME.ANALYTICS_WRITE_KEY = '';
}
if (window.KONFLUX_RUNTIME.ANALYTICS_API_URL === undefined) {
  window.KONFLUX_RUNTIME.ANALYTICS_API_URL = '';
}
