import { faker } from '@faker-js/faker/locale/en_GB';
import OpenAI from 'openai';
import { Config, GeneratedUser, UserGenerationResult } from '../types';

export class UserGenerator {
  private openai: OpenAI | null = null;

  constructor(
    private readonly config: Config,
    private readonly prompt: string,
    private readonly openaiKey?: string
  ) {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
  }

  async generateUsers(): Promise<UserGenerationResult> {
    const userCount = faker.number.int({
      min: this.config.minSignups,
      max: this.config.maxSignups,
    });

    const users: GeneratedUser[] = [];
    let withComments = 0;
    let withoutComments = 0;

    for (let i = 0; i < userCount; i++) {
      const shouldHaveComment = Math.random() < this.config.openAIPercentage;
      let comment: string | undefined;

      if (shouldHaveComment && this.openai) {
        try {
          comment = await this.generateComment();
          withComments++;
        } catch (error) {
          console.error('Failed to generate comment:', error);
          withoutComments++;
        }
      } else {
        withoutComments++;
      }

      const user = this.generateUser(comment);
      users.push(user);
    }

    return {
      users,
      withComments,
      withoutComments,
    };
  }

  private generateUser(comment?: string): GeneratedUser {
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

  isWithinTimeWindow(): boolean {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const [startHour, startMinute] = this.config.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.config.endTime.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const currentMinutes = currentHour * 60 + currentMinute;

    // Handle overnight windows (e.g., 22:00 to 06:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  calculateDelay(): number {
    const baseDelay = this.config.avgDelay;
    const jitter = this.config.jitter;

    // Random delay between (avgDelay - jitter) and (avgDelay + jitter)
    const minDelay = Math.max(0, baseDelay - jitter);
    const maxDelay = baseDelay + jitter;

    const delay = faker.number.int({ min: minDelay, max: maxDelay });
    return delay * 1000; // Convert to milliseconds
  }
}