import { setupNotion } from '../../scripts/setupNotion';
import * as fs from 'fs';
import * as path from 'path';

// Mock fetch for Notion API calls
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Setup Notion Script', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NOTION_TOKEN = 'test-notion-token';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Database creation', () => {
    it('should check if API Control Panel_USER_GEN database exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          has_more: false,
        }),
      } as Response);

      // Mock database creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-db-id',
          properties: {},
        }),
      } as Response);

      // Mock page creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-page-id',
        }),
      } as Response);

      // Create a test env file to avoid file system errors
      const testEnvPath = path.join(process.cwd(), '.env.test-check');
      await setupNotion(testEnvPath);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-notion-token',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            query: 'API Control Panel_USER_GEN',
            filter: { property: 'object', value: 'database' },
          }),
        })
      );

      // Clean up
      if (fs.existsSync(testEnvPath)) {
        fs.unlinkSync(testEnvPath);
      }
    });

    it('should create database if it does not exist', async () => {
      // First call: search returns no results
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          has_more: false,
        }),
      } as Response);

      // Second call: create database
      const mockDatabaseId = 'mock-database-id-123';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: mockDatabaseId,
          properties: {},
        }),
      } as Response);

      // Third call: create page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'mock-page-id',
        }),
      } as Response);

      const testEnvPath = path.join(process.cwd(), '.env.test-create');
      await setupNotion(testEnvPath);

      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.notion.com/v1/databases',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-notion-token',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('API Control Panel_USER_GEN'),
        })
      );

      // Clean up
      if (fs.existsSync(testEnvPath)) {
        fs.unlinkSync(testEnvPath);
      }
    });

    it('should create database with correct schema', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], has_more: false }),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'mock-db-id', properties: {} }),
      } as Response);

      // Mock page creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'mock-page-id' }),
      } as Response);

      const testEnvPath = path.join(process.cwd(), '.env.test-schema');
      await setupNotion(testEnvPath);

      const createCall = mockFetch.mock.calls[1];
      const requestBody = JSON.parse(createCall[1]?.body as string);

      // Verify schema properties
      expect(requestBody.properties).toHaveProperty('enabled');
      expect(requestBody.properties.enabled.checkbox).toBeDefined();

      expect(requestBody.properties).toHaveProperty('startTime');
      expect(requestBody.properties.startTime.rich_text).toBeDefined();

      expect(requestBody.properties).toHaveProperty('endTime');
      expect(requestBody.properties.endTime.rich_text).toBeDefined();

      expect(requestBody.properties).toHaveProperty('minSignups');
      expect(requestBody.properties.minSignups.number).toBeDefined();

      expect(requestBody.properties).toHaveProperty('maxSignups');
      expect(requestBody.properties.maxSignups.number).toBeDefined();

      expect(requestBody.properties).toHaveProperty('openAIPercentage');
      expect(requestBody.properties.openAIPercentage.number).toBeDefined();

      expect(requestBody.properties).toHaveProperty('avgDelay');
      expect(requestBody.properties.avgDelay.number).toBeDefined();

      expect(requestBody.properties).toHaveProperty('jitter');
      expect(requestBody.properties.jitter.number).toBeDefined();

      // Clean up
      if (fs.existsSync(testEnvPath)) {
        fs.unlinkSync(testEnvPath);
      }
    });
  });

  describe('Page creation', () => {
    it('should create LLM Comment Prompt_USER_GEN page', async () => {
      const mockDatabaseId = 'mock-database-id-123';
      const mockPageId = 'mock-page-id-456';

      // Search returns empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], has_more: false }),
      } as Response);

      // Create database
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockDatabaseId, properties: {} }),
      } as Response);

      // Create page
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockPageId }),
      } as Response);

      await setupNotion();

      expect(mockFetch).toHaveBeenNthCalledWith(
        3,
        'https://api.notion.com/v1/pages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-notion-token',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('LLM Comment Prompt_USER_GEN'),
        })
      );

      const pageCreateCall = mockFetch.mock.calls[2];
      const pageRequestBody = JSON.parse(pageCreateCall[1]?.body as string);

      expect(pageRequestBody.parent.database_id).toBe(mockDatabaseId);
      expect(pageRequestBody.properties.title.title[0].text.content).toBe('LLM Comment Prompt_USER_GEN');
    });
  });

  describe('Environment file update', () => {
    const testEnvPath = path.join(process.cwd(), '.env.test');

    beforeEach(() => {
      // Clean up test env file if it exists
      if (fs.existsSync(testEnvPath)) {
        fs.unlinkSync(testEnvPath);
      }
    });

    afterEach(() => {
      // Clean up test env file
      if (fs.existsSync(testEnvPath)) {
        fs.unlinkSync(testEnvPath);
      }
    });

    it('should append new IDs to .env file', async () => {
      const mockDatabaseId = 'mock-database-id-123';
      const mockPageId = 'mock-page-id-456';

      // Mock responses
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], has_more: false }),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockDatabaseId, properties: {} }),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: mockPageId }),
      } as Response);

      // Create test .env file
      fs.writeFileSync(testEnvPath, 'EXISTING_VAR=value\\n');

      await setupNotion(testEnvPath);

      const envContent = fs.readFileSync(testEnvPath, 'utf-8');

      expect(envContent).toContain('EXISTING_VAR=value');
      expect(envContent).toContain(`NOTION_DATABASE_ID_USER_GEN=${mockDatabaseId}`);
      expect(envContent).toContain(`NOTION_USER_GEN_DATABASE_ID=${mockPageId}`);
    });

    it('should not duplicate IDs if they already exist', async () => {
      const mockDatabaseId = 'existing-database-id';
      const mockPageId = 'existing-page-id';

      // Search returns existing database
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ id: mockDatabaseId }],
          has_more: false,
        }),
      } as Response);

      // Create existing .env file with IDs
      const existingEnv = `EXISTING_VAR=value
NOTION_DATABASE_ID_USER_GEN=${mockDatabaseId}
NOTION_USER_GEN_DATABASE_ID=${mockPageId}
`;
      fs.writeFileSync(testEnvPath, existingEnv);

      await setupNotion(testEnvPath);

      const envContent = fs.readFileSync(testEnvPath, 'utf-8');

      // Count occurrences - should only appear once
      const dbIdCount = (envContent.match(/NOTION_DATABASE_ID_USER_GEN=/g) || []).length;
      const pageIdCount = (envContent.match(/NOTION_USER_GEN_DATABASE_ID=/g) || []).length;

      expect(dbIdCount).toBe(1);
      expect(pageIdCount).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should throw error if NOTION_TOKEN is not set', async () => {
      delete process.env.NOTION_TOKEN;

      await expect(setupNotion()).rejects.toThrow('NOTION_TOKEN is required');
    });

    it('should handle Notion API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(setupNotion()).rejects.toThrow('Failed to search for existing database');
    });
  });
});