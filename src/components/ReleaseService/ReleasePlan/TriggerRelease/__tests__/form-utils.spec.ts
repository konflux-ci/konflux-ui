import { createK8sUtilMock } from '../../../../../utils/test-utils';
import { createRelease, createReleaseNotes, getIssues } from '../form-utils';

const k8sCreateMock = createK8sUtilMock('K8sQueryCreateResource');

describe('triggerReleasePlan', () => {
  beforeEach(() => {
    k8sCreateMock.mockImplementation((obj) => obj.resource);
  });

  it('should add snapshot & releasePlan to spec.snapshot & spec.releasePlan', async () => {
    const result = await createRelease(
      {
        snapshot: 'test-snapshot',
        releasePlan: 'test-releasePlan',
        synopsis: null,
        topic: null,
        references: null,
        labels: [],
      },
      'test-ns',
    );
    expect(result.spec).toEqual(
      expect.objectContaining({
        snapshot: 'test-snapshot',
        releasePlan: 'test-releasePlan',
      }),
    );
  });

  it('should add Synopsis, Topic, Description, Reference to spec.data', async () => {
    const result = await createRelease(
      {
        snapshot: 'test-plan',
        synopsis: 'synopsis',
        releasePlan: 'test-releasePlan',
        description: 'short description',
        topic: 'topic of release',
        references: ['reference1', 'reference2'],
        labels: [],
      },
      'test-ns',
    );
    expect(result.spec.data.releaseNotes).toEqual(
      expect.objectContaining({
        synopsis: 'synopsis',
        topic: 'topic of release',
        description: 'short description',
        references: ['reference1', 'reference2'],
      }),
    );
  });

  it('should add Bug Data to advisory', async () => {
    const result = await createRelease(
      {
        snapshot: 'test-plan',
        synopsis: 'synopsis',
        releasePlan: 'test-releasePlan',
        description: 'short description',
        topic: 'topic of release',
        references: ['reference1', 'reference2'],
        issues: [
          { id: 'RHTAP-5560', summary: 'summary1', source: 'test-url' },
          { id: 'RHTAP-5561', summary: 'summary2', source: 'test-url2' },
          { id: 'RHTAP-5562', summary: 'summary3', source: 'test-url2' },
        ],
        labels: [],
      },
      'test-ns',
    );

    const advisoryIssues = result.spec.data.releaseNotes.fixed;
    expect(advisoryIssues.length).toEqual(3);
    expect(advisoryIssues[0]).toEqual(
      expect.objectContaining({
        id: 'RHTAP-5560',
        source: 'test-url',
      }),
    );
  });

  it('should add CVE Data to advisory', async () => {
    const result = await createRelease(
      {
        snapshot: 'test-plan',
        synopsis: 'synopsis',
        releasePlan: 'test-releasePlan',
        description: 'short description',
        topic: 'topic of release',
        references: ['reference1', 'reference2'],
        cves: [
          {
            issueKey: 'cve1',
            components: ['a', 'b'],
            url: 'test-url',
          },
          {
            issueKey: 'cve2',
            components: ['c', 'd'],
            url: 'test-url2',
          },
        ],
        labels: [],
      },
      'test-ns',
    );

    const advisoryCVE = result.spec.data.releaseNotes.cves;
    expect(advisoryCVE.length).toEqual(2);
    expect(advisoryCVE[0]).toEqual(
      expect.objectContaining({
        issueKey: 'cve1',
        url: 'test-url',
        components: ['a', 'b'],
      }),
    );
  });

  it('should omit empty fields from releaseNotes', async () => {
    const result = await createRelease(
      {
        snapshot: 'test-snapshot',
        releasePlan: 'test-releasePlan',
        synopsis: '', // empty string
        topic: '',
        description: undefined, // undefined
        solution: null, // null
        references: [], // empty array
        issues: [], // empty array
        cves: [], // empty array
        labels: [],
      },
      'test-ns',
    );
    // data should be omitted entirely
    expect(result.spec.data).toBeUndefined();
  });

  it('should only include non-empty fields in releaseNotes', async () => {
    const result = await createRelease(
      {
        snapshot: 'test-snapshot',
        releasePlan: 'test-releasePlan',
        synopsis: 'A summary',
        topic: '',
        description: '',
        solution: undefined,
        references: [],
        issues: [{ id: 'ISSUE-1', source: 'src' }],
        cves: [],
        labels: [],
      },
      'test-ns',
    );
    expect(result.spec.data.releaseNotes).toEqual({
      synopsis: 'A summary',
      fixed: [{ id: 'ISSUE-1', source: 'src' }],
    });
  });
});

describe('createReleaseNotes', () => {
  it('returns undefined if all required fields are empty', () => {
    expect(
      createReleaseNotes({
        synopsis: '',
        topic: '',
        description: '',
        issues: [],
        cves: [],
        references: [],
        solution: '',
      }),
    ).toBeUndefined();
  });

  it('returns only non-empty fields', () => {
    const result = createReleaseNotes({
      synopsis: 'syn',
      topic: '',
      description: '',
      issues: [{ id: '1', source: 'src' }],
      cves: [],
      references: [],
      solution: '',
    });
    expect(result).toEqual({
      synopsis: 'syn',
      fixed: [{ id: '1', source: 'src' }],
    });
  });

  it('returns all fields if all are set', () => {
    const result = createReleaseNotes({
      synopsis: 'syn',
      topic: 'top',
      description: 'desc',
      issues: [{ id: '1', source: 'src' }],
      cves: [{ issueKey: 'cve', components: ['a'], url: 'u' }],
      references: ['ref'],
      solution: 'sol',
    });
    expect(result).toEqual({
      synopsis: 'syn',
      topic: 'top',
      description: 'desc',
      fixed: [{ id: '1', source: 'src' }],
      cves: [{ issueKey: 'cve', components: ['a'], url: 'u' }],
      references: ['ref'],
      solution: 'sol',
    });
  });

  it('trims string fields and omits if only whitespace', () => {
    const result = createReleaseNotes({
      synopsis: '   ',
      topic: '   ',
      description: 'desc',
      issues: [],
      cves: [],
      references: [],
      solution: '',
    });
    expect(result).toEqual({ description: 'desc' });
  });
});

describe('getIssues', () => {
  it('returns empty array if issues is undefined', () => {
    expect(getIssues(undefined)).toEqual(undefined);
  });
  it('returns mapped issues if present', () => {
    const issues = [
      { id: '1', source: 'src', extra: 'x' },
      { id: '2', source: 'src2' },
    ];
    expect(getIssues(issues)).toEqual([
      { id: '1', source: 'src' },
      { id: '2', source: 'src2' },
    ]);
  });
  it('handles empty array', () => {
    expect(getIssues([])).toEqual([]);
  });
});
