import * as React from 'react';
import ChatBot from 'react-chatbotify';
import { useAuth } from '~/auth/useAuth';
import { createWatsonSession, getWatSonresponse } from './watson-utils';

import './WatsonChatBot.scss';

const chatSettings = {
  header: { title: 'Konflux chat bot' },
  tooltip: { mode: 'never' },
  footer: {
    text: (
      <>
        Developed by <b>Abhi, Stan & Janaki</b>
      </>
    ),
  },
  general: {
    primaryColor: 'var(--konflux-primary-color)',
    secondaryColor: 'var(--konflux-primary-color)',
  },
  fileAttachment: {
    disabled: true,
  },
  notification: {
    disabled: true,
  },
  chatHistory: {
    disabled: false,
  },
  emoji: {
    disabled: true,
  },
};

const WatsonChatBot: React.FC = () => {
  const [watSonSessionID, setWatsonSessionID] = React.useState<string>('');

  React.useEffect(() => {
    // Create Watson session securely via backend proxy
    createWatsonSession()
      .then((sessionId) => setWatsonSessionID(sessionId))
      .catch((err) => {
        // Session creation error will be handled by getWatSonresponse when sessionId is empty
        // eslint-disable-next-line no-console
        console.error('Failed to create Watson session:', err);
      });
  }, []);

  const id = 'my-chatbot-id'; // if not specified, will auto-generate uuidv4
  const {
    user: { email },
  } = useAuth();

  const fetchData = (data: { userInput: string }) => {
    return getWatSonresponse(data.userInput, watSonSessionID, email);
  };

  const flow = {
    start: {
      message:
        "Hello, I am Watson Assistant👋! Welcome to KonfluxUI, I'm excited that you are using our " +
        'chatbot 😊!',
      path: 'loop',
    },
    loop: {
      message: async (params: { userInput: string }) => {
        const result = await fetchData(params);
        return result;
      },
      path: 'loop',
    },
  };

  return (
    <div className="watson-chatbot">
      <ChatBot id={id} flow={flow} settings={chatSettings} />
    </div>
  );
};

export default WatsonChatBot;
