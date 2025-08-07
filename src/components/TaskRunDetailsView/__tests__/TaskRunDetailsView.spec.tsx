import * as React from 'react';
import { screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useTaskRun } from '../../../hooks/usePipelineRuns';
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

jest.mock('../../../hooks/usePipelineRuns', () => ({
  useTaskRun: jest.fn(),
}));

const useTaskRunMock = useTaskRun as jest.Mock;
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
});
