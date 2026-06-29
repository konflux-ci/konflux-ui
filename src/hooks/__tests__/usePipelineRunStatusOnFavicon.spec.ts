import { global_palette_blue_300 as blueColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import { renderHook } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import * as useFaviconStatusBadgeModule from '~/shared/hooks/useFaviconStatusBadge';
import * as statusColorUtils from '~/utils/status-color-utils';
import { usePipelineRunStatusOnFavicon } from '../usePipelineRunStatusOnFavicon';

jest.mock('~/shared/hooks/useFaviconStatusBadge', () => ({
  useFaviconStatusBadge: jest.fn(),
}));

jest.mock('~/utils/status-color-utils', () => ({
  getColorForPipelineStatus: jest.fn(),
  getColorForReleaseStatus: jest.fn(),
}));

const useFaviconStatusBadgeMock = useFaviconStatusBadgeModule.useFaviconStatusBadge as jest.Mock;
const getColorForPipelineStatusMock = statusColorUtils.getColorForPipelineStatus as jest.Mock;

describe('usePipelineRunStatusOnFavicon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getColorForPipelineStatusMock.mockReturnValue(blueColor.value);
  });

  it('maps pipeline status to color and passes it to useFaviconStatusBadge', () => {
    renderHook(() => usePipelineRunStatusOnFavicon(runStatus.Running));

    expect(getColorForPipelineStatusMock).toHaveBeenCalledWith(runStatus.Running);
    expect(useFaviconStatusBadgeMock).toHaveBeenCalledWith(blueColor.value);
  });
});
