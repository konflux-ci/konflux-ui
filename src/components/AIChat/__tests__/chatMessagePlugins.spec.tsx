import { renderHook, waitFor } from '@testing-library/react';
import {
  loadChatMessageRehypePlugins,
  useChatMessageRehypePlugins,
} from '~/components/AIChat/chatMessagePlugins';

const mockRehypeSanitize = jest.fn();
const mockDefaultSchema = {
  attributes: {
    a: ['href'],
    img: ['src'],
  },
};

jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: mockRehypeSanitize,
  defaultSchema: {
    attributes: {
      a: ['href'],
      img: ['src'],
    },
  },
}));

jest.mock('~/monitoring/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('chatMessagePlugins', () => {
  describe('loadChatMessageRehypePlugins', () => {
    it('loads rehype-sanitize with a schema that keeps target and rel on anchors', async () => {
      const plugins = await loadChatMessageRehypePlugins();

      expect(plugins).toHaveLength(1);
      const [plugin, schema] = plugins[0] as [typeof mockRehypeSanitize, { attributes: { a: string[] } }];
      expect(plugin).toBe(mockRehypeSanitize);
      expect(schema.attributes.a).toEqual(
        expect.arrayContaining([...mockDefaultSchema.attributes.a, 'target', 'rel']),
      );
    });

    it('reuses the same promise across calls', () => {
      const first = loadChatMessageRehypePlugins();
      const second = loadChatMessageRehypePlugins();

      expect(first).toBe(second);
    });
  });

  describe('useChatMessageRehypePlugins', () => {
    it('loads plugins when mounted', async () => {
      const { result } = renderHook(() => useChatMessageRehypePlugins());

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });
      expect(result.current).toHaveLength(1);
    });
  });
});
