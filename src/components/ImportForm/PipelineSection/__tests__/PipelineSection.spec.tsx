import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { mockDynamicPinelineTemplateJson } from '../../../../__data__/pipeline-config-data';
import { useBuildPipelineConfig } from '../../../../hooks/useBuildPipelineConfig';
import { formikRenderer } from '../../../../utils/test-utils';
import '@testing-library/jest-dom';
import { PipelineSection } from '../PipelineSection';

jest.mock('../../../../hooks/useBuildPipelineConfig', () => ({
  useBuildPipelineConfig: jest.fn(),
}));

describe('PipelineSection', () => {
  const useBuildPipelineConfigMock = useBuildPipelineConfig as jest.Mock;
  const examplePipeline = mockDynamicPinelineTemplateJson.pipelines[3].name;
  const exampleDescription = mockDynamicPinelineTemplateJson.pipelines[0].description;
  beforeEach(() => {
    useBuildPipelineConfigMock.mockReturnValue([mockDynamicPinelineTemplateJson, true]);
  });

  it('should loading pipeline when dynamic pipeline configmap is not ready', () => {
    useBuildPipelineConfigMock.mockReset();
    useBuildPipelineConfigMock.mockReturnValue([undefined, false]);
    formikRenderer(<PipelineSection />, { pipeline: '' });
    expect(screen.getByText('Loading pipelines...')).toBeInTheDocument();
  });

  it('should can select when pipeline data is ready', () => {
    formikRenderer(<PipelineSection />, { pipeline: '' });
    expect(screen.getByText('docker-build-oci-ta')).toBeInTheDocument();
  });

  it('should list pipeline well when pipelinedata is ready', async () => {
    formikRenderer(<PipelineSection />, { pipeline: '' });
    const user = userEvent.setup();
    const pipelineButton = screen.getByText('docker-build-oci-ta');
    await user.click(pipelineButton);
    expect(screen.getAllByRole('menuitem').length).toEqual(
      mockDynamicPinelineTemplateJson.pipelines.length,
    );
    expect(screen.getByText(exampleDescription)).toBeInTheDocument();
    expect(screen.getByText(examplePipeline)).toBeInTheDocument();
  });
});
