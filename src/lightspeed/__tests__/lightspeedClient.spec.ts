import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';

describe('getLightspeedClient', () => {
  it('returns the upstream Lightspeed client that renames and deletes conversations', () => {
    const client = getLightspeedClient();

    expect(client).toBeInstanceOf(LightspeedClient);
    expect(client.constructor).toBe(LightspeedClient);
    expect(getLightspeedClient()).toBe(client);
  });
});
