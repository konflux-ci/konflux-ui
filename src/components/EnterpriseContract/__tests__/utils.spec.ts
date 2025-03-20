import { extractEcResultsFromTaskRunLogs } from '../utils';

describe('extractEcResultsFromTaskRunLogs', () => {
  it('should extract and parse JSON from logs correctly', () => {
    const logs = `
      step-vulnerabilities :-
      Lorem Ipsum some logs
      
      step-report-json :-
      {"success":true,"components":[{"name":"component-name","details":"example"}]}
      
      step-something-else :-
      Some other logs
    `;

    const expectedResult = {
      success: true,
      components: [
        {
          name: 'component-name',
          details: 'example',
        },
      ],
    };
    expect(extractEcResultsFromTaskRunLogs(logs)).toEqual(expectedResult);
  });

  it('should throw error if JSON parsing fails', () => {
    const logs = `
      step-report-json :-
      {invalid JSON}
    `;
    expect(() => extractEcResultsFromTaskRunLogs(logs)).toThrow();
  });

  it('should throw error if step-report-json is missing', () => {
    const logs = `
      step-vulnerabilities :-
      Lorem Ipsum some logs
    `;

    expect(() => extractEcResultsFromTaskRunLogs(logs)).toThrow();
  });

  it('should handle multiple step-report-json blocks and extract the first one', () => {
    const logs = `
      step-report-json :-
      {"success":true,"components":[{"name":"first-component","details":"example"}]}
      
      step-report-json :-
      {"success":false,"components":[{"name":"second-component","details":"example"}]}
    `;

    const expectedResult = {
      success: true,
      components: [
        {
          name: 'first-component',
          details: 'example',
        },
      ],
    };
    expect(extractEcResultsFromTaskRunLogs(logs)).toEqual(expectedResult);
  });

  it('should handle empty logs and throw error', () => {
    expect(() => extractEcResultsFromTaskRunLogs(``)).toThrow();
  });
});
