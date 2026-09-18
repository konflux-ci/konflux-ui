import '@testing-library/jest-dom';
import * as React from 'react';
import { screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { GROUP_DETAILS_PATH, GROUPS_PATH } from '~/routes/paths';
import { createUseParamsMock, mockUseNamespaceHook, routerRenderer } from '~/unit-test-utils';
import { useComponentGroupBreadcrumbs } from '../breadcrumb-utils';

const useParamsMock = createUseParamsMock();
mockUseNamespaceHook('test-ns');

describe('useComponentGroupBreadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should only return the groups crumb when no group name is present', () => {
    useParamsMock.mockReturnValue({});
    const { result } = renderHook(() => useComponentGroupBreadcrumbs());
    expect(result.current).toHaveLength(1);

    routerRenderer(<>{result.current}</>);
    screen.getByText('Groups');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should return a link to the groups list plus the group crumb when group name is passed', () => {
    useParamsMock.mockReturnValue({ groupName: 'test-group' });
    const { result } = renderHook(() => useComponentGroupBreadcrumbs());
    expect(result.current).toHaveLength(2);

    // The second entry is a plain { path, name } object, so only render the elements.
    routerRenderer(<>{result.current.filter(React.isValidElement)}</>);
    expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute(
      'href',
      GROUPS_PATH.createPath({ workspaceName: 'test-ns' }),
    );

    expect(result.current[1]).toEqual({
      path: GROUP_DETAILS_PATH.createPath({ workspaceName: 'test-ns', groupName: 'test-group' }),
      name: 'test-group',
    });
  });
});
