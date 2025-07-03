import { faker } from '@faker-js/faker/locale/en_GB';
import OpenAI from 'openai';
import { GeneratedUser, UserGenerationResult } from '../types/index.js';

// --- New Time-Based Probability Logic ---

// Peak hours are 8x more likely to have a signup.
const PEAK_PROBABILITY_MULTIPLIER = 8;

// Define peak traffic hours (UTC)
const PEAK_HOURS = [
  7, 8,   // 07:00 - 08:59 (Morning)
  11, 12, // 11:00 - 12:59 (Lunch)
  16, 17, // 16:00 - 17:59 (After Work)
  20, 21  // 20:00 - 21:59 (Evening)
];

// Base probability calculated to average ~25 signups/day
// given the peak multiplier and hours.
const BASE_PROBABILITY_PER_MINUTE = 0.0035; // 0.35% chance

export class UserGenerator {
  private openai: OpenAI | null = null;

  constructor(
    private readonly prompt: string,
    private readonly openaiKey?: string
  ) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Probabilistically generates 0, 1, or 2 users based on the current time.
   */
  async generateUsersForCurrentTime(
    commentPercentage: number
  ): Promise<UserGenerationResult> {
    const currentHour = new Date().getUTCHours();
    const isPeakTime = PEAK_HOURS.includes(currentHour);

    const probability = isPeakTime
      ? BASE_PROBABILITY_PER_MINUTE * PEAK_PROBABILITY_MULTIPLIER
      : BASE_PROBABILITY_PER_MINUTE;

    // Decide if we should generate anyone this minute
    if (Math.random() > probability) {
      return { users: [], withComments: 0, withoutComments: 0 }; // Most of the time, do nothing
    }

    // If we do generate, decide on 1 or 2 users (80% chance for 1)
    const numberOfUsersToGenerate = Math.random() < 0.8 ? 1 : 2;
    const users: GeneratedUser[] = [];
    let withComments = 0;

    for (let i = 0; i < numberOfUsersToGenerate; i++) {
      // Hardcoding 30% chance for a comment for simplicity
      const user = await this.generateNewUserWithOptionalComment(commentPercentage);
      users.push(user);
      if (user.comment) {
        withComments++;
      }
    }

    return {
      users,
      withComments,
      withoutComments: users.length - withComments,
    };
  }

  private async generateNewUserWithOptionalComment(
    commentPercentage: number
  ): Promise<GeneratedUser> {
    const shouldHaveComment = Math.random() < commentPercentage;
    let comment: string | undefined;

    if (shouldHaveComment && this.openai) {
      try {
        comment = await this.generateComment();
      } catch (error) {
        console.error('Failed to generate comment:', error);
        // Proceed without a comment if generation fails
      }
    }
    return this.generateSingleUser(comment);
  }

  private generateSingleUser(comment?: string): GeneratedUser {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    // Generate UK-style email
    const emailProviders = [
      'gmail.com',
      'hotmail.co.uk',
      'outlook.com',
      'btinternet.com',
      'sky.com',
      'virgin.net',
      'talktalk.net',
      'yahoo.co.uk',
      'aol.co.uk',
      'live.co.uk',
      'live.com',
    ];

    const emailProvider = faker.helpers.arrayElement(emailProviders);
    const emailLocalPart = faker.helpers.slugify(
      `${firstName}.${lastName}`.toLowerCase()
    );
    const email = `${emailLocalPart}@${emailProvider}`;

    // Generate BH19 postcode
    const postcode = `BH19 ${faker.number.int({ min: 1, max: 9 })}${faker.string.alpha({ length: 2, casing: 'upper' })}`;

    // Random hear about source
    const hearAboutOptions = ['facebook', 'twitter', 'instagram', 'nextdoor', 'friend', 'poster', 'other'];
    const hearAbout = faker.helpers.arrayElement(hearAboutOptions);

    // Random wants updates
    const wantsUpdates = faker.datatype.boolean();

    // Generate referral code occasionally (30% chance)
    const referralCode = Math.random() < 0.3
      ? faker.string.alphanumeric({ length: 8, casing: 'upper' })
      : undefined;

    return {
      name,
      email,
      postcode,
      hearAbout,
      wantsUpdates,
      comment,
      referralCode,
      timestamp: new Date(),
    };
  }

  private async generateComment(): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a concerned UK citizen providing authentic feedback about local traffic issues. Keep responses concise and natural.',
          },
          {
            role: 'user',
            content: this.prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      const comment = completion.choices[0]?.message?.content?.trim();
      if (!comment) {
        throw new Error('No comment generated');
      }

      return comment;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}