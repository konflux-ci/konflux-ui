import { createK8sUtilMock } from '../../../../../utils/test-utils';
import { createRelease } from '../form-utils';

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
      'test-ws',
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
        references: 'references',
        labels: [],
      },
      'test-ns',
      'test-ws',
    );
    expect(result.spec.data.releaseNotes).toEqual(
      expect.objectContaining({
        synopsis: 'synopsis',
        topic: 'topic of release',
        description: 'short description',
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
        references: 'references',
        issues: [
          { id: 'RHTAP-5560', summary: 'summary1', source: 'test-url' },
          { id: 'RHTAP-5561', summary: 'summary2', source: 'test-url2' },
          { id: 'RHTAP-5562', summary: 'summary3', source: 'test-url2' },
        ],
        labels: [],
      },
      'test-ns',
      'test-ws',
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
        references: 'references',
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
      'test-ws',
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
});
