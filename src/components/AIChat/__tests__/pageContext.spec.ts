import { CONTEXT_ID_ATTR } from '~/consts/ai-chat-context';
import {
  buildPageContextSelection,
  findPageContextElement,
  getPageContextId,
  getPageContextLabel,
} from '../context/page-context';

describe('page-context', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.title = '';
  });

  it('builds a stable page context id from pathname', () => {
    expect(getPageContextId('/ns/apps/foo/snapshots/bar')).toBe('page-ns-apps-foo-snapshots-bar');
  });

  it('uses document title without application suffix as page label', () => {
    document.title = 'yolo-gphhb | Konflux';
    expect(getPageContextLabel()).toBe('yolo-gphhb');
  });

  it('builds page context selection from pathname', () => {
    document.title = 'Snapshots | Konflux';
    expect(buildPageContextSelection('/ns/apps/yolo/snapshots')).toEqual({
      id: 'page-ns-apps-yolo-snapshots',
      label: 'Snapshots',
      description: 'Entire current page',
      route: '/ns/apps/yolo/snapshots',
    });
  });

  it('finds the page context element in the document', () => {
    document.body.innerHTML = `
      <div data-ai-chat-context-id="page-ns-apps-yolo-snapshots" data-ai-chat-context="true">
        Page content
      </div>
    `;

    expect(findPageContextElement('/ns/apps/yolo/snapshots')).not.toBeNull();
    expect(findPageContextElement('/ns/apps/yolo/snapshots')?.getAttribute(CONTEXT_ID_ATTR)).toBe(
      'page-ns-apps-yolo-snapshots',
    );
  });
});
