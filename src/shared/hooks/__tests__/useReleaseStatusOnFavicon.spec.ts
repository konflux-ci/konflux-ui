import { global_success_color_100 as greenColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { renderHook } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import * as statusColorUtils from '~/shared/utils/status-color-utils';
import * as useFaviconStatusBadgeModule from '../useFaviconStatusBadge';
import { useReleaseStatusOnFavicon } from '../useReleaseStatusOnFavicon';

jest.mock('../useFaviconStatusBadge', () => ({
  useFaviconStatusBadge: jest.fn(),
}));

jest.mock('~/shared/utils/status-color-utils', () => ({
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
