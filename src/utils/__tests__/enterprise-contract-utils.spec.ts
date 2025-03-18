import { extractEcResultsFromTaskRunLogs } from '../enterprise-contract-utils';

describe('extractEcResultsFromTaskRunLogs', () => {
  it('should extract logs from string ', () => {
    expect(
      extractEcResultsFromTaskRunLogs(`asdfcdfadsf
        step-report-json :- {"name": "Report1", "status": "success"} step-
    `),
    ).toEqual({ name: 'Report1', status: 'success' });
    expect(
      extractEcResultsFromTaskRunLogs(`asdfcdfadsf
    [report-json] { "components":
    [report-json] [] }
    safkjasdfj 9034823 0dju@#$@#
    `),
    ).toEqual(null);
  });
});
