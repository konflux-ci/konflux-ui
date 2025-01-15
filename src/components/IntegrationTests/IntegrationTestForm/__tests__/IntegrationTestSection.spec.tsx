import { screen, waitFor } from '@testing-library/react';
import { createK8sWatchResourceMock, formikRenderer } from '../../../../utils/test-utils';
import IntegrationTestSection from '../IntegrationTestSection';

const navigateMock = jest.fn();

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: () => navigateMock,
  // Used in ContextsField
  useParams: jest.fn(() => ({
    applicationName: 'test-app',
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('IntegrationTestSection', () => {
  beforeEach(() => {
    useK8sWatchResourceMock.mockReturnValue([[], false]);
  });
  it('should render the page header by default', async () => {
    const wrapper = formikRenderer(<IntegrationTestSection />, {
      source: 'test-source',
      secret: null,
    });
    await waitFor(() => {
      expect(wrapper).toBeTruthy();
      expect(wrapper.getByTestId('integration-test-section-header')).toBeTruthy();
    });
  });

  it('should hide the page header when isInPage is set', async () => {
    const wrapper = formikRenderer(<IntegrationTestSection isInPage />, {
      source: 'test-source',
      secret: null,
    });
    let found;
    try {
      wrapper.getByTestId('integration-test-section-header');
      found = true;
    } catch {
      found = false;
    }

    await waitFor(() => expect(found).toEqual(false));
  });

  it('should render parameter section', () => {
    formikRenderer(<IntegrationTestSection isInPage />, {
      source: 'test-source',
      secret: null,
    });

    screen.queryByTestId('its-param-field');
  });

  it('should render contexts section', () => {
    formikRenderer(<IntegrationTestSection isInPage />, {
      source: 'test-source',
      secret: null,
    });

    screen.queryByTestId('its-context-field');
  });
});
