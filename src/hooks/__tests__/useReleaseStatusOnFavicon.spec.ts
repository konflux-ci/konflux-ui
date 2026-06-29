import { global_success_color_100 as greenColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { renderHook } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import * as useFaviconStatusBadgeModule from '~/shared/hooks/useFaviconStatusBadge';
import * as statusColorUtils from '~/utils/status-color-utils';
import { useReleaseStatusOnFavicon } from '../useReleaseStatusOnFavicon';

jest.mock('~/shared/hooks/useFaviconStatusBadge', () => ({
  useFaviconStatusBadge: jest.fn(),
}));

jest.mock('~/utils/status-color-utils', () => ({
  getColorForPipelineStatus: jest.fn(),
  getColorForReleaseStatus: jest.fn(),
}));

const useFaviconStatusBadgeMock = useFaviconStatusBadgeModule.useFaviconStatusBadge as jest.Mock;
const getColorForReleaseStatusMock = statusColorUtils.getColorForReleaseStatus as jest.Mock;

describe('useReleaseStatusOnFavicon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getColorForReleaseStatusMock.mockReturnValue(greenColor.value);
  });

  it('maps release status to color and passes it to useFaviconStatusBadge', () => {
    renderHook(() => useReleaseStatusOnFavicon(runStatus.Succeeded));

    expect(getColorForReleaseStatusMock).toHaveBeenCalledWith(runStatus.Succeeded);
    expect(useFaviconStatusBadgeMock).toHaveBeenCalledWith(greenColor.value);
  });
});
