import { useNavigate } from 'react-router-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { ComponentKind } from '~/types';
import { GIT_PROVIDER_ANNOTATION, GIT_PROVIDER_ANNOTATION_VALUE } from '~/utils/component-utils';
import { COMPONENT_LIST_PATH } from '../../../routes/paths';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useModalLauncher } from '../../modal/ModalProvider';
import { componentDeleteModal } from '../../modal/resource-modals';
import { componentCRMocks } from '../__data__/mock-data';
import { getURLForComponentPR, useComponentActions } from '../component-actions';

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});
jest.mock('../../modal/resource-modals', () => {
  const actual = jest.requireActual('../../modal/resource-modals');
  return {
    ...actual,
    componentDeleteModal: jest.fn((...args: unknown[]) =>
      (actual as { componentDeleteModal: (...a: unknown[]) => unknown }).componentDeleteModal(
        ...args,
      ),
    ),
  };
});
jest.mock('../../modal/ModalProvider', () => ({
  ...jest.requireActual('../../modal/ModalProvider'),
  useModalLauncher: jest.fn(() =>
    jest.fn(() => ({ closed: Promise.resolve({ submitClicked: false }) })),
  ),
}));

const useAccessReviewForModelMock = useAccessReviewForModel as jest.Mock;
const componentDeleteModalMock = componentDeleteModal as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;

const mockedComponent = componentCRMocks[0];

/** CR mock with git-provider so `getURLForComponentPR` returns a PR listing URL. */
const githubComponent: ComponentKind = {
  ...mockedComponent,
  metadata: {
    ...mockedComponent.metadata,
    annotations: {
      ...mockedComponent.metadata.annotations,
      [GIT_PROVIDER_ANNOTATION]: GIT_PROVIDER_ANNOTATION_VALUE.GITHUB,
    },
  },
};

const normalizeAction = (label: string, disabled = false) =>
  expect.objectContaining({
    label,
    cta: expect.anything(),
    disabled,
  });

describe('getURLForComponentPR', () => {
  const createComponent = (
    gitProvider: string | undefined,
    url: string | undefined,
  ): ComponentKind =>
    ({
      metadata: {
        annotations:
          gitProvider === undefined ? undefined : { [GIT_PROVIDER_ANNOTATION]: gitProvider },
      },
      spec: {
        source: {
          git: url === undefined ? {} : { url },
        },
      },
    }) as unknown as ComponentKind;

  it('returns GitHub pulls URL and strips trailing .git (case-insensitive)', () => {
    expect(
      getURLForComponentPR(
        createComponent(GIT_PROVIDER_ANNOTATION_VALUE.GITHUB, 'https://github.com/org/repo.git'),
      ),
    ).toBe('https://github.com/org/repo/pulls');
    expect(
      getURLForComponentPR(
        createComponent(GIT_PROVIDER_ANNOTATION_VALUE.GITHUB, 'https://github.com/org/repo.GIT'),
      ),
    ).toBe('https://github.com/org/repo/pulls');
  });

  it('returns GitHub pulls URL when URL has no .git suffix', () => {
    expect(
      getURLForComponentPR(
        createComponent(GIT_PROVIDER_ANNOTATION_VALUE.GITHUB, 'https://github.com/org/repo'),
      ),
    ).toBe('https://github.com/org/repo/pulls');
  });

  it('returns Forgejo pulls URL', () => {
    expect(
      getURLForComponentPR(
        createComponent(
          GIT_PROVIDER_ANNOTATION_VALUE.FORGEJO,
          'https://code.forgejo.org/org/repo.git',
        ),
      ),
    ).toBe('https://code.forgejo.org/org/repo/pulls');
  });

  it('returns GitLab merge requests URL', () => {
    expect(
      getURLForComponentPR(
        createComponent(GIT_PROVIDER_ANNOTATION_VALUE.GITLAB, 'https://gitlab.com/org/repo.git'),
      ),
    ).toBe('https://gitlab.com/org/repo/-/merge_requests');
  });

  it('returns undefined for unsupported git-provider values', () => {
    expect(
      getURLForComponentPR(createComponent('bitbucket', 'https://bitbucket.org/org/repo.git')),
    ).toBeUndefined();
  });

  it('returns undefined when git URL is missing', () => {
    expect(
      getURLForComponentPR(createComponent(GIT_PROVIDER_ANNOTATION_VALUE.GITHUB, undefined)),
    ).toBeUndefined();
  });

  it('returns undefined when git URL is empty string', () => {
    expect(
      getURLForComponentPR(createComponent(GIT_PROVIDER_ANNOTATION_VALUE.GITHUB, '')),
    ).toBeUndefined();
  });

  it('returns undefined when git-provider is missing but URL is present', () => {
    expect(
      getURLForComponentPR(createComponent(undefined, 'https://github.com/org/repo.git')),
    ).toBeUndefined();
  });

  it('returns undefined when annotations object is missing', () => {
    const component = {
      metadata: { name: 'c' },
      spec: { source: { git: { url: 'https://github.com/org/repo.git' } } },
    } as unknown as ComponentKind;
    expect(getURLForComponentPR(component)).toBeUndefined();
  });
});

describe('component-actions', () => {
  describe('useComponentActions', () => {
    beforeEach(() => {
      useAccessReviewForModelMock.mockReturnValue([true, true]);
    });

    it('should contain all actions', () => {
      const { result } = renderHook(() =>
        useComponentActions(githubComponent, githubComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(
        expect.arrayContaining([
          normalizeAction('Edit build pipeline plan'),
          normalizeAction('Start new build'),
          normalizeAction('Manage linked secrets'),
          normalizeAction('View all pull requests'),
          normalizeAction('Delete component'),
        ]),
      );
    });

    it('actions should be disabled when user does not have access rights', () => {
      useAccessReviewForModelMock.mockReturnValue([false, false]);
      const { result } = renderHook(() =>
        useComponentActions(githubComponent, githubComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions).toEqual(
        expect.arrayContaining([
          normalizeAction('Edit build pipeline plan', true),
          normalizeAction('Start new build', true),
          normalizeAction('Manage linked secrets', true),
          normalizeAction('View all pull requests', true),
          normalizeAction('Delete component', true),
        ]),
      );
    });

    it('should include "Manage linked secrets" action', () => {
      const { result } = renderHook(() =>
        useComponentActions(githubComponent, githubComponent.metadata.name),
      );
      const actions = result.current;
      expect(actions.find((a) => a.label === 'Manage linked secrets')).toBeDefined();
    });

    it('should set external cta for "View all pull requests" from getURLForComponentPR', () => {
      const { result } = renderHook(() =>
        useComponentActions(githubComponent, githubComponent.metadata.name),
      );
      const prAction = result.current.find((a) => a.label === 'View all pull requests');
      const expectedHref = getURLForComponentPR(githubComponent);
      expect(prAction?.cta).toEqual({ href: expectedHref, external: true });
    });

    it('should attach analytics to "View all pull requests"', () => {
      const { result } = renderHook(() =>
        useComponentActions(githubComponent, githubComponent.metadata.name),
      );
      const prAction = result.current.find((a) => a.label === 'View all pull requests');
      expect(prAction?.analytics).toEqual(
        expect.objectContaining({
          link_name: 'view-all-prs',
          link_location: 'component-actions',
          component_name: githubComponent.metadata.name,
          app_name: githubComponent.spec.application,
        }),
      );
    });

    it('should disable "View all pull requests" when prURL is undefined', () => {
      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata.name),
      );
      const prAction = result.current.find((a) => a.label === 'View all pull requests');
      expect(getURLForComponentPR(mockedComponent)).toBeUndefined();
      expect(prAction?.disabled).toBe(true);
      expect(prAction?.disabledTooltip).toBe(
        'Pull request URL is not available for this component',
      );
    });

    it('should return empty array if component is null or undefined', () => {
      expect(renderHook(() => useComponentActions(undefined, 'x')).result.current).toEqual([]);
    });

    it('should use access tooltip for "View all pull requests" when URL exists but user cannot view', () => {
      useAccessReviewForModelMock.mockImplementation((model, verb) => {
        if (model.kind === 'Component' && verb === 'get') {
          return [false, false];
        }
        return [true, true];
      });
      const { result } = renderHook(() =>
        useComponentActions(githubComponent, githubComponent.metadata.name),
      );
      const prAction = result.current.find((a) => a.label === 'View all pull requests');
      expect(prAction?.disabled).toBe(true);
      expect(prAction?.disabledTooltip).toBe("You don't have access to view all pull requests");
    });

    it('should navigate to component list when delete modal closes with submitClicked true', async () => {
      const navigateMock = jest.fn();
      useNavigateMock.mockReturnValue(navigateMock);
      const showModalMock = jest.fn(() => ({
        closed: Promise.resolve({ submitClicked: true }),
      }));
      useModalLauncherMock.mockReturnValue(showModalMock);
      mockUseNamespaceHook(mockedComponent.metadata?.namespace ?? '');
      componentDeleteModalMock.mockClear();

      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata?.name ?? ''),
      );
      const deleteAction = result.current.find((a) => a.label === 'Delete component');
      expect(deleteAction).toBeDefined();
      expect(typeof deleteAction?.cta).toBe('function');

      (deleteAction?.cta as () => void)();

      expect(componentDeleteModalMock).toHaveBeenCalledTimes(1);
      expect(componentDeleteModalMock).toHaveBeenCalledWith(mockedComponent);
      const expectedPath = COMPONENT_LIST_PATH.createPath({
        applicationName: mockedComponent.spec.application,
        workspaceName: mockedComponent.metadata?.namespace,
      });
      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(expectedPath));
    });

    it('should not navigate when delete modal closes with submitClicked false', async () => {
      const navigateMock = jest.fn();
      useNavigateMock.mockReturnValue(navigateMock);
      const showModalMock = jest.fn(() => ({
        closed: Promise.resolve({ submitClicked: false }),
      }));
      useModalLauncherMock.mockReturnValue(showModalMock);

      const { result } = renderHook(() =>
        useComponentActions(mockedComponent, mockedComponent.metadata?.name ?? ''),
      );
      const deleteAction = result.current.find((a) => a.label === 'Delete component');
      expect(deleteAction).toBeDefined();

      (deleteAction?.cta as () => void)();

      expect(showModalMock).toHaveBeenCalled();
      await Promise.resolve(); // allow .closed.then callback to run
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
