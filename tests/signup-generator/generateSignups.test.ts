import { generateSignups } from '../../src/handlers/generateSignups';
import { NotionService } from '../../src/services/notionService';
import { UserGenerator } from '../../src/services/userGenerator';
import { DatabaseService } from '../../src/services/databaseService';

// Mock all services
jest.mock('../../src/services/notionService');
jest.mock('../../src/services/userGenerator');
jest.mock('../../src/services/databaseService');

const MockNotionService = NotionService as jest.MockedClass<typeof NotionService>;
const MockUserGenerator = UserGenerator as jest.MockedClass<typeof UserGenerator>;
const MockDatabaseService = DatabaseService as jest.MockedClass<typeof DatabaseService>;

describe('generateSignups', () => {
  let mockNotionService: jest.Mocked<NotionService>;
  let mockUserGenerator: jest.Mocked<UserGenerator>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  const mockConfig = {
    enabled: true,
    startTime: '08:00',
    endTime: '20:00',
    minSignups: 5,
    maxSignups: 10,
    openAIPercentage: 0.3,
    avgDelay: 120,
    jitter: 30,
  };

  const mockPrompt = 'Generate a thoughtful comment...';

  const mockUsers = {
    users: [
      {
        name: 'Test User',
        email: 'test@example.com',
        postcode: 'BH19 1AB',
        hearAbout: 'facebook',
        wantsUpdates: true,
        comment: 'Test comment',
        timestamp: new Date(),
      },
    ],
    withComments: 1,
    withoutComments: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env.NOTION_TOKEN = 'test-notion-token';
    process.env.NOTION_DATABASE_ID_USER_GEN = 'test-db-id';
    process.env.NOTION_USER_GEN_DATABASE_ID = 'test-page-id';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.POSTGRES_URL = 'postgres://test';

    // Create mock instances
    mockNotionService = {
      getConfig: jest.fn(),
      getPrompt: jest.fn(),
    } as any;

    mockUserGenerator = {
      generateUsers: jest.fn(),
      isWithinTimeWindow: jest.fn(),
      calculateDelay: jest.fn(),
    } as any;

    mockDatabaseService = {
      ensureTable: jest.fn(),
      saveUsers: jest.fn(),
      getTodayStats: jest.fn(),
      close: jest.fn(),
    } as any;

    // Set up constructor mocks
    MockNotionService.mockImplementation(() => mockNotionService);
    MockUserGenerator.mockImplementation(() => mockUserGenerator);
    MockDatabaseService.mockImplementation(() => mockDatabaseService);
  });

  it('should successfully generate and save users', async () => {
    mockNotionService.getConfig.mockResolvedValue(mockConfig);
    mockNotionService.getPrompt.mockResolvedValue(mockPrompt);
    mockUserGenerator.isWithinTimeWindow.mockReturnValue(true);
    mockUserGenerator.generateUsers.mockResolvedValue(mockUsers);
    mockDatabaseService.ensureTable.mockResolvedValue(undefined);
    mockDatabaseService.saveUsers.mockResolvedValue('batch-123');

    const result = await generateSignups();

    expect(mockNotionService.getConfig).toHaveBeenCalled();
    expect(mockNotionService.getPrompt).toHaveBeenCalled();
    expect(mockUserGenerator.generateUsers).toHaveBeenCalled();
    expect(mockDatabaseService.ensureTable).toHaveBeenCalled();
    expect(mockDatabaseService.saveUsers).toHaveBeenCalledWith(mockUsers.users);
    expect(mockDatabaseService.close).toHaveBeenCalled();

    expect(result).toEqual({
      success: true,
      generated: 1,
      withComments: 1,
      batchId: 'batch-123',
    });
  });

  it('should skip generation when disabled', async () => {
    mockNotionService.getConfig.mockResolvedValue({
      ...mockConfig,
      enabled: false,
    });

    const result = await generateSignups();

    expect(mockUserGenerator.generateUsers).not.toHaveBeenCalled();
    expect(mockDatabaseService.saveUsers).not.toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      message: 'Generation is disabled',
    });
  });

  it('should skip generation outside time window', async () => {
    mockNotionService.getConfig.mockResolvedValue(mockConfig);
    mockNotionService.getPrompt.mockResolvedValue(mockPrompt);
    mockUserGenerator.isWithinTimeWindow.mockReturnValue(false);

    const result = await generateSignups();

    expect(mockUserGenerator.generateUsers).not.toHaveBeenCalled();
    expect(mockDatabaseService.saveUsers).not.toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      message: 'Outside configured time window',
    });
  });

  it('should handle missing configuration', async () => {
    mockNotionService.getConfig.mockResolvedValue(null);

    const result = await generateSignups();

    expect(result).toEqual({
      success: false,
      message: 'No configuration found',
    });
  });

  it('should handle errors gracefully', async () => {
    mockNotionService.getConfig.mockRejectedValue(new Error('Notion API error'));

    const result = await generateSignups();

    expect(result).toEqual({
      success: false,
      error: 'Notion API error',
    });

    expect(mockDatabaseService.close).toHaveBeenCalled();
  });

  it('should handle missing environment variables', async () => {
    delete process.env.NOTION_TOKEN;

    const result = await generateSignups();

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining('environment variables'),
    });
  });

  describe('With throttling', () => {
    it('should apply delays between user generations', async () => {
      const multipleUsers = {
        users: [
          { ...mockUsers.users[0], name: 'User 1' },
          { ...mockUsers.users[0], name: 'User 2' },
          { ...mockUsers.users[0], name: 'User 3' },
        ],
        withComments: 2,
        withoutComments: 1,
      };

      mockNotionService.getConfig.mockResolvedValue(mockConfig);
      mockNotionService.getPrompt.mockResolvedValue(mockPrompt);
      mockUserGenerator.isWithinTimeWindow.mockReturnValue(true);
      mockUserGenerator.generateUsers.mockResolvedValue(multipleUsers);
      mockUserGenerator.calculateDelay.mockReturnValue(1000); // 1 second
      mockDatabaseService.ensureTable.mockResolvedValue(undefined);
      mockDatabaseService.saveUsers.mockResolvedValue('batch-123');

      const startTime = Date.now();
      const result = await generateSignups(true); // Enable throttling
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.generated).toBe(3);

      // Should have delays between users (3 users = 2 delays)
      // Allow some margin for execution time
      expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('Stats reporting', () => {
    it('should report generation statistics', async () => {
      mockNotionService.getConfig.mockResolvedValue(mockConfig);
      mockNotionService.getPrompt.mockResolvedValue(mockPrompt);
      mockUserGenerator.isWithinTimeWindow.mockReturnValue(true);
      mockUserGenerator.generateUsers.mockResolvedValue(mockUsers);
      mockDatabaseService.ensureTable.mockResolvedValue(undefined);
      mockDatabaseService.saveUsers.mockResolvedValue('batch-123');
      mockDatabaseService.getTodayStats.mockResolvedValue({
        totalGenerated: 50,
        totalWithComments: 15,
        commentPercentage: 0.3,
      });

      const result = await generateSignups();

      expect(mockDatabaseService.getTodayStats).toHaveBeenCalled();
      expect(result.todayStats).toEqual({
        totalGenerated: 50,
        totalWithComments: 15,
        commentPercentage: 0.3,
      });
    });
  });
});