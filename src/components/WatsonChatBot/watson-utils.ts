export const API_KEY = '';
export const ASSISTANT_ID = '';
export const ENVIRONMENT_ID = '';
export const VERSION = '';

export const getWatSonresponse = async (
  userInput: string,
  sessionId: string,
  watsonError: Error,
) => {
  if (!sessionId || watsonError) {
    return 'Missing Watson session';
  }
  const url = `https://api.us-east.assistant.watson.cloud.ibm.com/v2/assistants/${ASSISTANT_ID}/environments/${ENVIRONMENT_ID}/sessions/${sessionId}/message?version=${VERSION}`;

  const encodedAPIkey = btoa(`apikey:${API_KEY}`);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${encodedAPIkey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        // eslint-disable-next-line camelcase
        user_id: 'user123',
        input: {
          // eslint-disable-next-line camelcase
          message_type: 'text',
          text: userInput,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.output?.generic?.[1]?.original_response?.text
      ? `Did you mean "${result.output.generic[1].original_response}"?`
      : Array.isArray(result.output?.generic) &&
          result.output?.generic.length > 0 &&
          result.output?.generic[1].original_response
        ? result.output?.generic[1].original_response
        : Array.isArray(result.output?.intents) && result.output?.intents.length > 0
          ? result.output?.intents[0].intent
          : 'No response from WatSon';
  } catch (e) {
    // Proper error handling: return a user-friendly error message
    if (e instanceof Error) {
      return `Watson error: ${e.message}`;
    }
    return 'Unknown error from Watson';
  }
};
