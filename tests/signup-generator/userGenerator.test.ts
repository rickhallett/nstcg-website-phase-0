import { UserGenerator } from '../../src/services/userGenerator';
import { Config, GeneratedUser } from '../../src/types';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

// Mock fetch for network requests
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('UserGenerator', () => {
  let userGenerator: UserGenerator;
  const mockConfig: Config = {
    enabled: true,
    startTime: '08:00',
    endTime: '20:00',
    minSignups: 5,
    maxSignups: 10,
    openAIPercentage: 0.3,
    avgDelay: 120,
    jitter: 30,
  };

  const mockPrompt = 'Generate a thoughtful comment about traffic safety in North Swanage.';

  beforeEach(() => {
    jest.clearAllMocks();
    userGenerator = new UserGenerator(mockConfig, mockPrompt, 'test-openai-key');
  });

  describe('generateUsers', () => {
    it('should generate users within the configured range', async () => {
      const result = await userGenerator.generateUsers();

      expect(result.users.length).toBeGreaterThanOrEqual(mockConfig.minSignups);
      expect(result.users.length).toBeLessThanOrEqual(mockConfig.maxSignups);
    });

    it('should generate valid user data', async () => {
      const result = await userGenerator.generateUsers();

      for (const user of result.users) {
        expect(user.name).toBeTruthy();
        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(user.postcode).toMatch(/^BH19 \d[A-Z]{2}$/);
        expect(['facebook', 'twitter', 'instagram', 'nextdoor', 'friend', 'poster', 'other']).toContain(user.hearAbout);
        expect(typeof user.wantsUpdates).toBe('boolean');
        expect(user.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should generate comments for approximately the configured percentage', async () => {
      // Mock OpenAI responses
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'I am concerned about the speeding on High Street.'
          }
        }]
      });
      
      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate
        }
      } as any;

      const iterations = 10;
      let totalWithComments = 0;
      let totalUsers = 0;

      for (let i = 0; i < iterations; i++) {
        const result = await userGenerator.generateUsers();
        totalWithComments += result.withComments;
        totalUsers += result.users.length;
      }

      const actualPercentage = totalWithComments / totalUsers;
      expect(actualPercentage).toBeGreaterThan(mockConfig.openAIPercentage - 0.1);
      expect(actualPercentage).toBeLessThan(mockConfig.openAIPercentage + 0.1);
    });

    it('should include valid referral codes', async () => {
      const result = await userGenerator.generateUsers();

      for (const user of result.users) {
        if (user.referralCode) {
          expect(user.referralCode).toMatch(/^[A-Z0-9]{8}$/);
        }
      }
    });
  });

  describe('generateComment', () => {
    it('should generate comments using OpenAI', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'I strongly support the traffic safety initiatives in North Swanage.'
          }
        }]
      });
      
      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate
        }
      } as any;

      const result = await userGenerator.generateUsers();
      const usersWithComments = result.users.filter((u: GeneratedUser) => u.comment);

      if (usersWithComments.length > 0) {
        expect(usersWithComments[0].comment).toBeTruthy();
        expect(mockCreate).toHaveBeenCalled();
      }
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      
      mockOpenAI.prototype.chat = {
        completions: {
          create: mockCreate
        }
      } as any;

      const result = await userGenerator.generateUsers();
      
      // Should still generate users even if OpenAI fails
      expect(result.users.length).toBeGreaterThanOrEqual(mockConfig.minSignups);
    });
  });

  describe('UK-specific data generation', () => {
    it('should generate UK postcodes in BH19 area', async () => {
      const result = await userGenerator.generateUsers();

      for (const user of result.users) {
        expect(user.postcode).toMatch(/^BH19 \d[A-Z]{2}$/);
      }
    });

    it('should generate UK-style names', async () => {
      const result = await userGenerator.generateUsers();

      for (const user of result.users) {
        // Should have first and last name
        const nameParts = user.name.split(' ');
        expect(nameParts.length).toBeGreaterThanOrEqual(2);
        
        // Each part should start with capital letter
        for (const part of nameParts) {
          expect(part[0]).toMatch(/[A-Z]/);
        }
      }
    });

    it('should generate realistic UK email providers', async () => {
      const result = await userGenerator.generateUsers();
      const ukProviders = ['gmail.com', 'hotmail.co.uk', 'outlook.com', 'btinternet.com', 'sky.com', 'virgin.net', 'talktalk.net'];

      for (const user of result.users) {
        const domain = user.email.split('@')[1];
        expect(ukProviders).toContain(domain);
      }
    });
  });

  describe('Timing and throttling', () => {
    it('should respect time windows', async () => {
      const lateNightConfig: Config = {
        ...mockConfig,
        startTime: '22:00',
        endTime: '06:00',
      };

      const lateNightGenerator = new UserGenerator(lateNightConfig, mockPrompt, 'test-key');
      
      // Mock current time to be outside window (3 PM)
      const mockDate = new Date('2024-01-01T15:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const isActive = lateNightGenerator.isWithinTimeWindow();
      expect(isActive).toBe(false);

      // Restore Date
      (global.Date as any).mockRestore();
    });

    it('should handle overnight time windows', async () => {
      const overnightConfig: Config = {
        ...mockConfig,
        startTime: '22:00',
        endTime: '06:00',
      };

      const overnightGenerator = new UserGenerator(overnightConfig, mockPrompt, 'test-key');
      
      // Mock current time to be 11 PM
      const mockDate = new Date('2024-01-01T23:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const isActive = overnightGenerator.isWithinTimeWindow();
      expect(isActive).toBe(true);

      // Restore Date
      (global.Date as any).mockRestore();
    });

    it('should calculate delays with jitter', () => {
      const delays: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const delay = userGenerator.calculateDelay();
        delays.push(delay);
      }

      const minDelay = mockConfig.avgDelay - mockConfig.jitter;
      const maxDelay = mockConfig.avgDelay + mockConfig.jitter;

      for (const delay of delays) {
        expect(delay).toBeGreaterThanOrEqual(minDelay * 1000); // Convert to ms
        expect(delay).toBeLessThanOrEqual(maxDelay * 1000);
      }

      // Check that we have some variation
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(10);
    });
  });
});