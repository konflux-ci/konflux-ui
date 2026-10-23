import * as React from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSendStreamMessage } from '@redhat-cloud-services/ai-react-state';
import { AIChatPageContextProvider } from '~/components/AIChat/pageContext/AIChatPageContext';
import {
  mergePendingFieldsIntoQueryBody,
  setPendingQueryRequestFields,
} from '~/lightspeed/lightspeedQueryRequestBridge';
import { useLightspeedChat } from '~/lightspeed/useLightspeedChat';
import { withRoutePatterns } from '~/routes/with-route-patterns';

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useInProgress: jest.fn(() => false),
  useIsInitializing: jest.fn(() => false),
  useMessages: jest.fn(() => []),
  useSendStreamMessage: jest.fn(),
}));

jest.mock('~/lightspeed/LightspeedStateProvider', () => ({
  useLightspeedInitError: jest.fn(() => undefined),
  useRetryLightspeedInit: jest.fn(() => jest.fn()),
}));

const useSendStreamMessageMock = useSendStreamMessage as jest.Mock;

const Harness: React.FC<{ includePageContext: boolean }> = ({ includePageContext }) => {
  const { sendMessage } = useLightspeedChat();
  const [done, setDone] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void sendMessage('Which page is this?', { includePageContext }).finally(() =>
            setDone(true),
          );
        }}
      >
        Send
      </button>
      {done ? <div data-test="sent" /> : null}
    </>
  );
};

const renderChat = (includePageContext: boolean) => {
  const router = createMemoryRouter(
    withRoutePatterns([
      {
        path: '/ns/:workspaceName/applications',
        element: <Harness includePageContext={includePageContext} />,
      },
    ]),
    { initialEntries: ['/ns/demo/applications'] },
  );

  return render(
    <AIChatPageContextProvider>
      <RouterProvider router={router} />
    </AIChatPageContextProvider>,
  );
};

describe('useLightspeedChat page context', () => {
  let capturedBody = '';

  beforeEach(() => {
    capturedBody = '';
    setPendingQueryRequestFields(undefined);
    useSendStreamMessageMock.mockReturnValue((query: string) => {
      capturedBody = mergePendingFieldsIntoQueryBody(JSON.stringify({ query }));
      return Promise.resolve({ answer: 'Hello' });
    });
  });

  it('should send only the typed message when context is off', async () => {
    renderChat(false);

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByTestId('sent')).toBeInTheDocument();
    });
    expect(JSON.parse(capturedBody)).toEqual({ query: 'Which page is this?' });
  });

  it('should attach the current route when context is on', async () => {
    renderChat(true);

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByTestId('sent')).toBeInTheDocument();
    });

    const body = JSON.parse(capturedBody) as {
      query: string;
      attachments: { content: string }[];
    };
    expect(body.query).toBe('Which page is this?');
    expect(JSON.parse(body.attachments[0].content)).toEqual({
      route: {
        pathname: '/ns/demo/applications',
        routePattern: '/ns/:workspaceName/applications',
        params: { workspaceName: 'demo' },
      },
    });
  });

  it('should drop a staged attachment when the send fails before the request', async () => {
    useSendStreamMessageMock.mockReturnValue(() => Promise.reject(new Error('unavailable')));
    renderChat(true);

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByTestId('sent')).toBeInTheDocument();
    });
    expect(mergePendingFieldsIntoQueryBody(JSON.stringify({ query: 'later' }))).toBe(
      JSON.stringify({ query: 'later' }),
    );
  });
});
