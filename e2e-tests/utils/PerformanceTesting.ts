
type PerformanceMetrics = Record<string, number>;

function createCheckpoint() {
  return performance.now();
}

function measureCheckpoint(checkpoint: number, name: string) {
  const duration = performance.now() - checkpoint;
  cy.log(`Checkpoint duration: ${duration}ms`);
  const metrics = Cypress.env('performanceMetrics') as PerformanceMetrics;
  metrics[name] = duration;
  return duration;
}

function submitData() {
  const metrics = Cypress.env('performanceMetrics') as PerformanceMetrics;
  cy.log(`Performance metrics: ${JSON.stringify(metrics)}`);
  cy.request({
    method: 'POST',
    url: 'https://script.google.com/a/macros/redhat.com/s/AKfycbxiCkZkmYZYYvu5sRu_-rOvJmFYuXTaOsGzFvpcfbtBBGgUBpettXVBCSm4WYBzua1uZw/exec',
    headers: {
      Authorization: `Bearer $(gcloud auth print-identity-token)`,
      'Content-Type': 'application/json',
    },
    body: metrics,
  });
}


export { createCheckpoint, measureCheckpoint, submitData };