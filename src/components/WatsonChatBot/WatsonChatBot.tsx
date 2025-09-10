import * as React from 'react';
import ChatBot from 'react-chatbotify';
import { API_KEY, ASSISTANT_ID, ENVIRONMENT_ID, getWatSonresponse, VERSION } from './watson-utils';

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
  general: { primaryColor: '#ffcc99', secondaryColor: '#ff7700' },
};

const WatsonChatBot: React.FC = () => {
  const [watSonSessionID, setWatsonSessionID] = React.useState<string>('');
  const [watSonError, setWatsonError] = React.useState<Error>(null);

  React.useEffect(() => {
    const encodedAPIkey = btoa(`apikey:${API_KEY}`);
    const getWatSonSessionID = async () => {
      const response = await fetch(
        `https://api.us-east.assistant.watson.cloud.ibm.com/v2/assistants/${ASSISTANT_ID}/environments/${ENVIRONMENT_ID}/sessions?version=${VERSION}`,
        {
          headers: {
            Authorization: `Basic ${encodedAPIkey}`,
          },
          method: 'POST',
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: { session_id: string } = await response.json();
      return result;
    };

    getWatSonSessionID()
      .then((result) => setWatsonSessionID(result.session_id))
      .catch((err) => setWatsonError(err as Error));
  }, []);

  const id = 'my-chatbot-id'; // if not specified, will auto-generate uuidv4

  const fetchData = (data: { userInput: string }) => {
    return getWatSonresponse(data.userInput, watSonSessionID, watSonError);
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
