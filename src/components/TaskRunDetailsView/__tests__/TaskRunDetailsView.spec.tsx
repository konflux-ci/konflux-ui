import * as React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { downloadYaml } from '~/utils/common-utils';
import { useTaskRunV2 } from '../../../hooks/useTaskRunsV2';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '../../../utils/test-utils';
import { testTaskRuns } from '../../TaskRunListView/__data__/mock-TaskRun-data';
import { TaskRunDetailsView } from '../TaskRunDetailsView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

const navigateMock = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: () => navigateMock,
    useSearchParams: () => React.useState(() => new URLSearchParams()),
  };
});

jest.mock('../../../hooks/useTaskRunsV2', () => ({
  useTaskRunV2: jest.fn(),
}));

jest.mock('~/utils/common-utils', () => ({
  ...jest.requireActual('~/utils/common-utils'),
  downloadYaml: jest.fn(),
}));

const useTaskRunMock = useTaskRunV2 as jest.Mock;
const downloadYamlMock = downloadYaml as jest.Mock;
// const sanitizeHtmlMock = sanitizeHtml as jest.Mock;

describe('TaskRunDetailsView', () => {
  createUseParamsMock({ taskRunName: testTaskRuns[0].metadata.name });
  mockUseNamespaceHook('test-ns');

  it('should render spinner if taskrun data is not loaded', () => {
    useTaskRunMock.mockReturnValue([null, false]);
    renderWithQueryClientAndRouter(<TaskRunDetailsView />);
    screen.getByRole('progressbar');
  });

  it('should render the error state if the taskrun is not found', () => {
    useTaskRunMock.mockReturnValue([null, true, { code: 404 }]);
    renderWithQueryClientAndRouter(<TaskRunDetailsView />);
    screen.getByText('404: Page not found');
    screen.getByText('Go to applications list');
  });

  it('should render the actions button and download YAML when clicked', async () => {
    const user = userEvent.setup();
    useTaskRunMock.mockReturnValue([testTaskRuns[0], true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsView />);

    const actionsButton = screen.getByRole('button', { name: /Actions/i });
    await user.click(actionsButton);

    expect(screen.getByText('Download YAML')).toBeInTheDocument();

    // Test the download action
    const downloadMenuItem = screen.getByText('Download YAML');
    await user.click(downloadMenuItem);

    expect(downloadYamlMock).toHaveBeenCalledWith(testTaskRuns[0]);
  });
});
