import { NotionService } from '../../src/services/notionService';
import { Config } from '../../src/types';

// Mock fetch for Notion API calls
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('NotionService', () => {
  let notionService: NotionService;
  const mockToken = 'test-notion-token';
  const mockDatabaseId = 'test-database-id';
  const mockPromptPageId = 'test-prompt-page-id';

  beforeEach(() => {
    jest.clearAllMocks();
    notionService = new NotionService(mockToken, mockDatabaseId, mockPromptPageId);
  });

  describe('getConfig', () => {
    it('should fetch configuration from Notion database', async () => {
      const mockConfig = {
        results: [
          {
            id: 'config-id',
            properties: {
              enabled: { checkbox: true },
              startTime: { rich_text: [{ text: { content: '08:00' } }] },
              endTime: { rich_text: [{ text: { content: '20:00' } }] },
              minSignups: { number: 5 },
              maxSignups: { number: 20 },
              openAIPercentage: { number: 0.3 },
              avgDelay: { number: 120 },
              jitter: { number: 30 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      } as Response);

      const config = await notionService.getConfig();

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.notion.com/v1/databases/${mockDatabaseId}/query`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(config).toEqual({
        enabled: true,
        startTime: '08:00',
        endTime: '20:00',
        minSignups: 5,
        maxSignups: 20,
        openAIPercentage: 0.3,
        avgDelay: 120,
        jitter: 30,
      });
    });

    it('should return null if no configuration is found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);

      const config = await notionService.getConfig();

      expect(config).toBeNull();
    });

    it('should handle Notion API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response);

      await expect(notionService.getConfig()).rejects.toThrow('Notion API error: 400');
    });
  });

  describe('getPrompt', () => {
    it('should fetch prompt from Notion page', async () => {
      const mockPageResponse = {
        object: 'list',
        results: [
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: 'This is the prompt text' },
                },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPageResponse,
      } as Response);

      const prompt = await notionService.getPrompt();

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.notion.com/v1/blocks/${mockPromptPageId}/children`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'Notion-Version': '2022-06-28',
          }),
        })
      );

      expect(prompt).toBe('This is the prompt text');
    });

    it('should handle multiple blocks and concatenate them', async () => {
      const mockPageResponse = {
        object: 'list',
        results: [
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [
                { type: 'text', text: { content: 'First paragraph' } },
              ],
            },
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [
                { type: 'text', text: { content: 'Second paragraph' } },
              ],
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPageResponse,
      } as Response);

      const prompt = await notionService.getPrompt();

      expect(prompt).toBe('First paragraph\\n\\nSecond paragraph');
    });

    it('should handle empty page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: 'list', results: [] }),
      } as Response);

      const prompt = await notionService.getPrompt();

      expect(prompt).toBe('');
    });
  });

  describe('Configuration validation', () => {
    it('should validate configuration times', async () => {
      const mockConfig = {
        results: [
          {
            id: 'config-id',
            properties: {
              enabled: { checkbox: true },
              startTime: { rich_text: [{ text: { content: '20:00' } }] },
              endTime: { rich_text: [{ text: { content: '08:00' } }] },
              minSignups: { number: 5 },
              maxSignups: { number: 20 },
              openAIPercentage: { number: 0.3 },
              avgDelay: { number: 120 },
              jitter: { number: 30 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      } as Response);

      const config = await notionService.getConfig();
      
      // This should handle overnight time ranges
      expect(config).toBeTruthy();
      expect(config?.startTime).toBe('20:00');
      expect(config?.endTime).toBe('08:00');
    });

    it('should validate min/max signup bounds', async () => {
      const mockConfig = {
        results: [
          {
            id: 'config-id',
            properties: {
              enabled: { checkbox: true },
              startTime: { rich_text: [{ text: { content: '08:00' } }] },
              endTime: { rich_text: [{ text: { content: '20:00' } }] },
              minSignups: { number: 20 },
              maxSignups: { number: 5 }, // Invalid: max < min
              openAIPercentage: { number: 0.3 },
              avgDelay: { number: 120 },
              jitter: { number: 30 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      } as Response);

      await expect(notionService.getConfig()).rejects.toThrow('Invalid configuration: maxSignups must be greater than minSignups');
    });

    it('should validate percentage bounds', async () => {
      const mockConfig = {
        results: [
          {
            id: 'config-id',
            properties: {
              enabled: { checkbox: true },
              startTime: { rich_text: [{ text: { content: '08:00' } }] },
              endTime: { rich_text: [{ text: { content: '20:00' } }] },
              minSignups: { number: 5 },
              maxSignups: { number: 20 },
              openAIPercentage: { number: 1.5 }, // Invalid: > 1
              avgDelay: { number: 120 },
              jitter: { number: 30 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      } as Response);

      await expect(notionService.getConfig()).rejects.toThrow('Invalid configuration: openAIPercentage must be between 0 and 1');
    });
  });
});