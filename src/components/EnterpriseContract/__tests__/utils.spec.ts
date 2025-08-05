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

  it('should handle multi-line JSON strings', () => {
    const logs = `
step-report-json :-
{"success": true,"components": [{"name": "test-component","containerImage": "registry.example.com/test/component@sha256:abc123def456","source": {"git": {"url": "https://github.com/example/test-repo","revision": "1234567890abcdef"}},"successes": [{"msg": "Pass","metadata": {"code": "test.signature_check","description": "The test signature matches available signing materials.","title": "Test signature check passed"}},{"msg": "Pass","metadata": {"code": "test.image_check","description": "The test image signature matches available signing materials.","title": "Test image check passed"}}],"success": true}],"key": "-----BEGIN PUBLIC KEY-----\\nMFkwEwYHTestKeyDataHere\\n-----END PUBLIC KEY-----\\n","policy": {"name": "TestPolicy",
"description": "Test policy for multi-line JSON parsing.","sources": [{"name": "TestSource","policy": ["oci::registry.example.com/test-policy@sha256:test123"]}]},"version": "v1.0.0","timestamp": "2024-01-01T00:00:00.000Z"}

step-something-else :-
Some other logs`;

    const result = extractEcResultsFromTaskRunLogs(logs);

    expect(result).toBeDefined();
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe('test-component');
    expect(result.components[0].containerImage).toContain('registry.example.com/test');
    expect(result.components[0].successes).toHaveLength(2);
    expect(result.components[0].successes?.[0].metadata.title).toBe('Test signature check passed');
  });

  it('should extract complex multi-line JSON with nested objects', () => {
    const logs = `
      step-report-json :-
      {
        "components": [
          {
            "name": "test-component",
            "violations": [
              {
                "metadata": {
                  "title": "Test Rule",
                  "description": "A test rule\\nwith newlines"
                },
                "msg": "Test message"
              }
            ]
          }
        ]
      }

      step-something-else :-
      Some other logs
    `;

    const expectedResult = {
      components: [
        {
          name: 'test-component',
          violations: [
            {
              metadata: {
                title: 'Test Rule',
                description: 'A test rule\nwith newlines',
              },
              msg: 'Test message',
            },
          ],
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
