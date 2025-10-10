// Type definitions for Watson Assistant API responses
interface WatsonIntent {
  intent: string;
  confidence: number;
}

interface WatsonEntity {
  entity?: string;
  value: string;
  confidence?: number;
}

interface WatsonGenericResponse {
  response_type: string;
  text?: string;
  title?: string;
  label?: string;
  content?: string;
  message?: string;
  header?: string;
  options?: Array<{ label: string; value?: string }>;
  primary_results?: Array<{ title: string; body?: string }>;
}

interface WatsonSpelling {
  suggestions: string[];
}

interface WatsonOutput {
  generic?: WatsonGenericResponse[];
  intents?: WatsonIntent[];
  entities?: WatsonEntity[];
  spelling?: WatsonSpelling;
}

interface WatsonContext {
  conversation_id?: string;
}

interface WatsonResponse {
  output?: WatsonOutput;
  context?: WatsonContext;
}

export const API_KEY = process.env.API_KEY;
export const ASSISTANT_ID = process.env.ASSISTANT_ID;
export const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;
export const VERSION = process.env.VERSION;

export const getWatSonresponse = async (userInput: string, sessionId: string, email: string) => {
  if (!sessionId) {
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
        user_id: email,
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
    //Console logs will be removed in production
    // eslint-disable-next-line no-console
    console.log('Watson Assistant full response:', JSON.stringify(result, null, 2));

    // Enhanced helper function to extract response from Watson Assistant v2 API
    const extractWatsonResponse = (apiResult: WatsonResponse): string => {
      // Debug logging to understand the response structure
      // eslint-disable-next-line no-console
      console.log('=== DEBUGGING WATSON RESPONSE ===');
      // eslint-disable-next-line no-console
      console.log('result.output exists:', !!apiResult.output);
      // eslint-disable-next-line no-console
      console.log('result.output.generic exists:', !!apiResult.output?.generic);
      // eslint-disable-next-line no-console
      console.log('result.output.generic is array:', Array.isArray(apiResult.output?.generic));
      // eslint-disable-next-line no-console
      console.log('result.output.generic length:', apiResult.output?.generic?.length);

      if (apiResult.output?.generic) {
        apiResult.output.generic.forEach((resp: WatsonGenericResponse, index: number) => {
          // eslint-disable-next-line no-console
          console.log(`Generic[${index}]:`, {
            responseType: resp.response_type,
            hasText: !!resp.text,
            textPreview: resp.text ? `${resp.text.substring(0, 50)}...` : '',
            allKeys: Object.keys(resp),
          });
        });
      }

      // eslint-disable-next-line no-console
      console.log('result.output.intents:', apiResult.output?.intents?.length || 0);
      // eslint-disable-next-line no-console
      console.log('result.output.entities:', apiResult.output?.entities?.length || 0);
      // eslint-disable-next-line no-console
      console.log('=== END DEBUG ===');

      // Confidence thresholds for different response types
      const CONFIDENCE_THRESHOLDS = {
        HIGH: 0.8,
        MEDIUM: 0.6,
        LOW: 0.4,
        MINIMUM: 0.2,
      };

      // Log confidence information for debugging
      if (apiResult.output?.intents?.length > 0) {
        const topIntent = apiResult.output.intents[0];
        // eslint-disable-next-line no-console
        console.log(`Intent: ${topIntent.intent}, Confidence: ${topIntent.confidence}`);
      }

      // Priority 1: ANY response from generic output (more flexible parsing)
      if (apiResult.output?.generic && Array.isArray(apiResult.output.generic)) {
        for (const responseItem of apiResult.output.generic) {
          // eslint-disable-next-line no-console
          console.log(
            `Checking response[${apiResult.output.generic.indexOf(responseItem)}]:`,
            responseItem,
          );

          // Handle text responses with confidence consideration
          if (responseItem.response_type === 'text' && responseItem.text) {
            // eslint-disable-next-line no-console
            console.log('Found text response:', responseItem.text);
            const topIntent = apiResult.output?.intents?.[0];
            if (topIntent && topIntent.confidence < CONFIDENCE_THRESHOLDS.MEDIUM) {
              return `${responseItem.text}\n\n*(I'm ${Math.round(topIntent.confidence * 100)}% confident about this answer)*`;
            }
            return responseItem.text;
          }

          // More flexible: Handle ANY response with text content (fallback)
          if (responseItem.text) {
            // eslint-disable-next-line no-console
            console.log('Found generic text content:', responseItem.text);
            return responseItem.text;
          }

          // Handle responses that might have content in different fields
          if (responseItem.content) {
            // eslint-disable-next-line no-console
            console.log('Found content field:', responseItem.content);
            return responseItem.content;
          }

          // Handle message field
          if (responseItem.message) {
            // eslint-disable-next-line no-console
            console.log('Found message field:', responseItem.message);
            return responseItem.message;
          }

          // Handle option responses with enhanced formatting
          if (responseItem.response_type === 'option' && responseItem.title) {
            const options = responseItem.options?.map((opt) => `• ${opt.label}`).join('\n') || '';
            return options ? `${responseItem.title}\n\n${options}` : responseItem.title;
          }

          // Handle suggestion responses with confidence
          if (responseItem.response_type === 'suggestion' && responseItem.label) {
            return `Did you mean: "${responseItem.label}"?`;
          }

          // Handle search responses
          if (responseItem.response_type === 'search' && responseItem.header) {
            return `${responseItem.header}\n\n${responseItem.primary_results?.map((r) => `• ${r.title}`).join('\n') || ''}`;
          }

          // Handle pause responses (indicate processing)
          if (responseItem.response_type === 'pause') {
            return 'Let me think about that...';
          }
        }
      }

      // Priority 2: High-confidence intent-based responses
      if (
        apiResult.output?.intents &&
        Array.isArray(apiResult.output.intents) &&
        apiResult.output.intents.length > 0
      ) {
        const topIntent = apiResult.output.intents[0];
        const confidence = topIntent.confidence;

        if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
          // Include entities in high-confidence responses
          const entities = apiResult.output?.entities?.map((e) => e.value).join(', ') || '';
          const entityText = entities ? ` about ${entities}` : '';
          return `I'm very confident you're asking about **${topIntent.intent}**${entityText}. How can I help you with this?`;
        }

        if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
          return `I think you're asking about: **${topIntent.intent}** (${Math.round(confidence * 100)}% confident)`;
        }

        if (confidence >= CONFIDENCE_THRESHOLDS.LOW) {
          return `I might be able to help with: **${topIntent.intent}**, but I'm only ${Math.round(confidence * 100)}% confident. Could you provide more details?`;
        }
      }

      // Priority 3: Entity-based responses when intent confidence is low
      if (
        apiResult.output?.entities &&
        Array.isArray(apiResult.output.entities) &&
        apiResult.output.entities.length > 0
      ) {
        const highConfidenceEntities = apiResult.output.entities.filter(
          (e) => (e.confidence || 1) >= CONFIDENCE_THRESHOLDS.MEDIUM,
        );

        if (highConfidenceEntities.length > 0) {
          const entities = highConfidenceEntities
            .map((e) => `${e.value}${e.confidence ? ` (${Math.round(e.confidence * 100)}%)` : ''}`)
            .join(', ');
          return `I found these topics in your message: ${entities}. Could you be more specific about what you'd like to know?`;
        }

        // Fallback to all entities if no high-confidence ones
        const allEntities = apiResult.output.entities.map((e) => e.value).join(', ');
        return `I noticed you mentioned: ${allEntities}. Can you tell me more about what you need help with?`;
      }

      // Priority 4: Context-based responses
      if (apiResult.context?.conversation_id) {
        return "I understand you're continuing our conversation, but I need more information to provide a helpful response. Could you rephrase your question?";
      }

      // Priority 5: Check for spelling suggestions or corrections
      if (
        apiResult.output?.spelling?.suggestions &&
        apiResult.output.spelling.suggestions.length > 0
      ) {
        const suggestions = apiResult.output.spelling.suggestions.join(', ');
        return `I didn't quite understand. Did you mean: ${suggestions}?`;
      }

      // Emergency fallback: Try to find ANY text content in the entire response
      // eslint-disable-next-line no-console
      console.log('Trying emergency text extraction...');

      const tryExtractAnyText = (obj: unknown, path = ''): string | null => {
        if (typeof obj === 'string' && obj.length > 10) {
          // eslint-disable-next-line no-console
          console.log(`Found text at ${path}:`, obj.substring(0, 100));
          return obj;
        }
        if (typeof obj === 'object' && obj !== null) {
          const objRecord = obj as Record<string, unknown>;
          // First pass: prioritize text-related keys
          for (const [key, value] of Object.entries(objRecord)) {
            if (
              key.toLowerCase().includes('text') ||
              key.toLowerCase().includes('message') ||
              key.toLowerCase().includes('response') ||
              key.toLowerCase().includes('content')
            ) {
              const found = tryExtractAnyText(value, `${path}.${key}`);
              if (found) return found;
            }
          }
          // Second pass: search all properties
          for (const [key, value] of Object.entries(objRecord)) {
            const found = tryExtractAnyText(value, `${path}.${key}`);
            if (found) return found;
          }
        }
        return null;
      };

      const emergencyText = tryExtractAnyText(apiResult);
      if (emergencyText) {
        // eslint-disable-next-line no-console
        console.log('Emergency extraction found text!');
        return emergencyText;
      }

      // Final intelligent fallback based on input analysis
      // eslint-disable-next-line no-console
      console.log('Reached final fallback - no response found anywhere');
      const inputLength = userInput.length;
      if (inputLength < 10) {
        return 'Could you provide more details? I need a bit more information to help you effectively.';
      } else if (inputLength > 200) {
        return "I see you've provided quite a bit of information. Could you help me focus by asking a more specific question?";
      }

      return "I received your message, but I'm not confident about the best way to help. Could you try rephrasing your question or providing more context?";
    };

    return extractWatsonResponse(result as WatsonResponse);
  } catch (e) {
    // Proper error handling: return a user-friendly error message
    if (e instanceof Error) {
      return `Watson error: ${e.message}`;
    }
    return 'Unknown error from Watson';
  }
};
