import { createUseWorkspaceInfoMock, formikRenderer } from '../../../../../utils/test-utils';
import { ReleasePipelineLocation } from '../form-utils';
import { RunReleasePipelineSection } from '../RunReleasePipelineSection';

jest.mock('../../../../../hooks/useApplications', () => ({
  useApplications: jest.fn(() => [[], true]),
}));

jest.mock('../../../../../shared/hooks/useScrollShadows', () => ({
  useScrollShadows: jest.fn().mockReturnValue('none'),
}));

describe('RunReleasePipelineSection', () => {
  createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });

  it('should not show target fields if location is not selected', () => {
    const values = {};
    const result = formikRenderer(<RunReleasePipelineSection />, values);
    expect(
      result.queryByRole('button', { name: 'Git options for the release pipeline' }),
    ).toBeNull();
    expect(result.queryByRole('textbox', { name: 'Git URL for the release pipeline' })).toBeNull();
    expect(result.queryByRole('textbox', { name: 'Revision' })).toBeNull();
    expect(result.queryByRole('textbox', { name: 'Path in repository' })).toBeNull();
    expect(
      result.queryByRole('region', { name: 'Git options for the release pipeline' }),
    ).toBeNull();
    expect(result.queryByRole('textbox', { name: 'Service account' })).toBeNull();
  });

  it('should show current ws fields if current location is selected', () => {
    const values = { releasePipelineLocation: ReleasePipelineLocation.current };
    const result = formikRenderer(<RunReleasePipelineSection />, values);
    expect(
      result.getByRole('button', { name: 'Git options for the release pipeline' }),
    ).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Git URL for the release pipeline' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Revision' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Path in repository' })).toBeVisible();
    expect(
      result.getByRole('region', { name: 'Git options for the release pipeline' }),
    ).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Service account' })).toBeVisible();
  });

  it('should show target select fields if target location is selected', () => {
    const values = { releasePipelineLocation: ReleasePipelineLocation.target };
    const result = formikRenderer(<RunReleasePipelineSection />, values);
    expect(
      result.getByRole('button', { name: 'Git options for the release pipeline' }),
    ).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Git URL for the release pipeline' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Revision' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Path in repository' })).toBeVisible();
    expect(
      result.getByRole('region', { name: 'Git options for the release pipeline' }),
    ).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Target namespace' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Data' })).toBeVisible();
  });
});
