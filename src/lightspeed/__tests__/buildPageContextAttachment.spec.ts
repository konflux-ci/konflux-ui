import { buildPageContextAttachment } from '~/lightspeed/buildPageContextAttachment';

const CONTENT_TYPE_KEY = 'content_type';
const ATTACHMENT_TYPE_KEY = 'attachment_type';

describe('buildPageContextAttachment', () => {
  it('should serialize route context as a JSON attachment', () => {
    const attachment = buildPageContextAttachment({
      route: {
        pathname: '/ns/demo/applications',
        routePattern: '/ns/:workspaceName/applications',
        params: { workspaceName: 'demo' },
      },
    });

    const fields = Object.fromEntries(Object.entries(attachment));
    expect(fields[CONTENT_TYPE_KEY]).toBe('application/json');
    expect(fields[ATTACHMENT_TYPE_KEY]).toBe('api object');
    expect(JSON.parse(attachment.content)).toEqual({
      route: {
        pathname: '/ns/demo/applications',
        routePattern: '/ns/:workspaceName/applications',
        params: { workspaceName: 'demo' },
      },
    });
  });
});
