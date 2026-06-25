import {
  DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
  getServiceUnavailableMessage,
  SERVICE_UNAVAILABLE_MESSAGES,
} from '../condition-messages';

describe('getServiceUnavailableMessage', () => {
  it('should return the default message when page name is null', () => {
    expect(getServiceUnavailableMessage(null)).toBe(DEFAULT_SERVICE_UNAVAILABLE_MESSAGE);
  });

  it('should return the default message when page name is not configured', () => {
    expect(getServiceUnavailableMessage('unknown-page')).toBe(DEFAULT_SERVICE_UNAVAILABLE_MESSAGE);
  });

  it('should return the configured message for a known page', () => {
    expect(getServiceUnavailableMessage('issues')).toBe(SERVICE_UNAVAILABLE_MESSAGES.issues);
  });
});
