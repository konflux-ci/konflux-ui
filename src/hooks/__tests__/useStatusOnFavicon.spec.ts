import { t_global_icon_color_status_info_default as blueColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_info_default';
import { t_global_icon_color_status_success_default as greenColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { renderHook } from '@testing-library/react';
import { runStatus } from '~/consts/pipelinerun';
import * as useFaviconStatusBadgeModule from '~/shared/hooks/useFaviconStatusBadge';
import * as statusColorUtils from '~/utils/status-color-utils';
import { useStatusOnFavicon } from '../useStatusOnFavicon';

jest.mock('~/shared/hooks/useFaviconStatusBadge', () => ({
  useFaviconStatusBadge: jest.fn(),
}));

jest.mock('~/utils/status-color-utils', () => ({
  getStatusColor: jest.fn(),
}));

const useFaviconStatusBadgeMock = useFaviconStatusBadgeModule.useFaviconStatusBadge as jest.Mock;
const getStatusColorMock = statusColorUtils.getStatusColor as jest.Mock;

describe('useStatusOnFavicon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps status to color and passes it to useFaviconStatusBadge', () => {
    getStatusColorMock.mockReturnValue(blueColor.value);

    renderHook(() => useStatusOnFavicon(runStatus.Running));

    expect(getStatusColorMock).toHaveBeenCalledWith(runStatus.Running);
    expect(useFaviconStatusBadgeMock).toHaveBeenCalledWith(blueColor.value);
  });

  it('updates when status changes', () => {
    getStatusColorMock.mockReturnValueOnce(blueColor.value).mockReturnValueOnce(greenColor.value);

    const { rerender } = renderHook(({ status }) => useStatusOnFavicon(status), {
      initialProps: { status: runStatus.Running },
    });

    rerender({ status: runStatus.Succeeded });

    expect(getStatusColorMock).toHaveBeenLastCalledWith(runStatus.Succeeded);
    expect(useFaviconStatusBadgeMock).toHaveBeenLastCalledWith(greenColor.value);
  });
});
