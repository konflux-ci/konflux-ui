import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parsePathsFile, buildUrlFromRoute } from '../path-resolver.js';

describe('path-resolver', () => {
  it('resolves nested path constants', () => {
    const paths = parsePathsFile();
    assert.equal(paths.get('NAMESPACE_LIST_PATH'), 'ns');
    assert.equal(paths.get('APPLICATION_LIST_PATH'), 'ns/:workspaceName/applications');
    assert.equal(
      paths.get('APPLICATION_DETAILS_PATH'),
      'ns/:workspaceName/applications/:applicationName',
    );
  });

  it('builds URLs when all params are provided', () => {
    const url = buildUrlFromRoute('ns/:workspaceName/applications', 'https://localhost:8080', {
      workspaceName: 'rh-ee-mmarcin-tenant',
    });
    assert.equal(url, 'https://localhost:8080/ns/rh-ee-mmarcin-tenant/applications');
  });

  it('returns undefined when params are missing', () => {
    const url = buildUrlFromRoute(
      'ns/:workspaceName/applications/:applicationName',
      'https://localhost:8080',
      {
        workspaceName: 'rh-ee-mmarcin-tenant',
      },
    );
    assert.equal(url, undefined);
  });
});
