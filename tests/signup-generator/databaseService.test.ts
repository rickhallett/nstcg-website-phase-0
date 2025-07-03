import { DatabaseService } from '../../src/services/databaseService';
import { GeneratedUser, DatabaseRecord } from '../../src/types';
import { Pool } from 'pg';

// Mock pg Pool
jest.mock('pg', () => {
  const mockPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockPool: any;

  const mockUsers: GeneratedUser[] = [
    {
      name: 'John Smith',
      email: 'john.smith@gmail.com',
      postcode: 'BH19 1AB',
      hearAbout: 'facebook',
      wantsUpdates: true,
      comment: 'I support the traffic safety initiatives.',
      referralCode: 'ABC12345',
      timestamp: new Date('2024-01-01T10:00:00'),
    },
    {
      name: 'Jane Doe',
      email: 'jane.doe@hotmail.co.uk',
      postcode: 'BH19 2CD',
      hearAbout: 'poster',
      wantsUpdates: false,
      timestamp: new Date('2024-01-01T10:05:00'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const MockedPool = Pool as jest.MockedClass<typeof Pool>;
    mockPool = new MockedPool();
    databaseService = new DatabaseService('postgres://test');
  });

  afterEach(async () => {
    await databaseService.close();
  });

  describe('saveUsers', () => {
    it('should save users to the database', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const batchId = await databaseService.saveUsers(mockUsers);

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      
      // Should insert each user
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO generated_users'),
        expect.arrayContaining([
          'John Smith',
          'john.smith@gmail.com',
          'BH19 1AB',
          'facebook',
          true,
          'I support the traffic safety initiatives.',
          'ABC12345',
          true,
          expect.any(Date),
          expect.any(String), // batch ID
        ])
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO generated_users'),
        expect.arrayContaining([
          'Jane Doe',
          'jane.doe@hotmail.co.uk',
          'BH19 2CD',
          'poster',
          false,
          null, // no comment
          null, // no referral code
          true,
          expect.any(Date),
          expect.any(String), // batch ID
        ])
      );

      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(batchId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should rollback on error', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);
      
      // Make the INSERT fail
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // INSERT

      await expect(databaseService.saveUsers(mockUsers)).rejects.toThrow('Failed to save users');
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle empty user array', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const batchId = await databaseService.saveUsers([]);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT')
      );
      expect(batchId).toBeTruthy();
    });
  });

  describe('getTodayStats', () => {
    it('should retrieve today\'s generation statistics', async () => {
      const mockResult = {
        rows: [
          { total_generated: '25', total_with_comments: '8' },
        ],
      };
      mockPool.query.mockResolvedValue(mockResult);

      const stats = await databaseService.getTodayStats();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE DATE(generated_at) = CURRENT_DATE'),
        []
      );

      expect(stats).toEqual({
        totalGenerated: 25,
        totalWithComments: 8,
        commentPercentage: 0.32,
      });
    });

    it('should handle no data for today', async () => {
      const mockResult = {
        rows: [
          { total_generated: '0', total_with_comments: '0' },
        ],
      };
      mockPool.query.mockResolvedValue(mockResult);

      const stats = await databaseService.getTodayStats();

      expect(stats).toEqual({
        totalGenerated: 0,
        totalWithComments: 0,
        commentPercentage: 0,
      });
    });
  });

  describe('getRecentBatches', () => {
    it('should retrieve recent generation batches', async () => {
      const mockResult = {
        rows: [
          {
            generation_batch: 'batch-1',
            batch_time: new Date('2024-01-01T10:00:00'),
            user_count: '5',
            comment_count: '2',
          },
          {
            generation_batch: 'batch-2',
            batch_time: new Date('2024-01-01T11:00:00'),
            user_count: '8',
            comment_count: '3',
          },
        ],
      };
      mockPool.query.mockResolvedValue(mockResult);

      const batches = await databaseService.getRecentBatches(10);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('GROUP BY generation_batch'),
        [10]
      );

      expect(batches).toHaveLength(2);
      expect(batches[0]).toEqual({
        batchId: 'batch-1',
        timestamp: new Date('2024-01-01T10:00:00'),
        userCount: 5,
        commentCount: 2,
      });
    });
  });

  describe('Database schema', () => {
    it('should create the users table if it does not exist', async () => {
      await databaseService.ensureTable();

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS generated_users')
      );
      
      const createTableQuery = mockPool.query.mock.calls[0][0];
      
      // Verify all required columns
      expect(createTableQuery).toContain('id SERIAL PRIMARY KEY');
      expect(createTableQuery).toContain('name VARCHAR(255) NOT NULL');
      expect(createTableQuery).toContain('email VARCHAR(255) NOT NULL');
      expect(createTableQuery).toContain('postcode VARCHAR(10) NOT NULL');
      expect(createTableQuery).toContain('hear_about VARCHAR(50) NOT NULL');
      expect(createTableQuery).toContain('wants_updates BOOLEAN NOT NULL');
      expect(createTableQuery).toContain('comment TEXT');
      expect(createTableQuery).toContain('referral_code VARCHAR(10)');
      expect(createTableQuery).toContain('is_generated BOOLEAN NOT NULL');
      expect(createTableQuery).toContain('generated_at TIMESTAMP NOT NULL');
      expect(createTableQuery).toContain('generation_batch UUID NOT NULL');
      
      // Verify indexes
      expect(createTableQuery).toContain('CREATE INDEX IF NOT EXISTS idx_generation_batch');
      expect(createTableQuery).toContain('CREATE INDEX IF NOT EXISTS idx_generated_at');
    });
  });

  describe('Connection management', () => {
    it('should close the pool connection', async () => {
      await databaseService.close();
      
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(databaseService.saveUsers(mockUsers)).rejects.toThrow('Failed to save users');
    });
  });
});