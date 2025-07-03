import { faker } from '@faker-js/faker/locale/en_GB';
import OpenAI from 'openai';

// Peak hours configuration
const PEAK_HOURS = [7, 8, 11, 12, 16, 17, 20, 21];
const PEAK_PROBABILITY_MULTIPLIER = 8;
const BASE_PROBABILITY_PER_MINUTE = 0.0035;

export class StandaloneUserGenerator {
  constructor(prompt, openaiKey) {
    this.prompt = prompt;
    this.openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
  }

  /**
   * Check if generation should happen based on probability
   */
  shouldGenerate(baseProbability, peakMultiplier, peakHours) {
    const currentHour = new Date().getUTCHours();
    const isPeakTime = (peakHours || PEAK_HOURS).includes(currentHour);
    
    const probability = isPeakTime
      ? baseProbability * peakMultiplier
      : baseProbability;
    
    return Math.random() <= probability;
  }

  /**
   * Generate a single user with optional comment
   */
  async generateUser(includeComment = false) {
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
      ? this.generateReferralCode(firstName)
      : undefined;

    // Generate comment if requested
    let comment;
    if (includeComment && this.openai) {
      try {
        comment = await this.generateComment();
      } catch (error) {
        console.error('Failed to generate comment:', error.message);
        // Continue without comment
      }
    }

    return {
      name,
      firstName,
      lastName,
      email,
      postcode,
      hearAbout,
      wantsUpdates,
      comment,
      referralCode,
      timestamp: new Date().toISOString(),
      source: 'website',
      user_id: `gen_${Date.now()}_${faker.string.alphanumeric(8)}`,
      submission_id: `sub_${Date.now()}_${faker.string.alphanumeric(8)}`
    };
  }

  /**
   * Generate a referral code
   */
  generateReferralCode(firstName) {
    const prefix = firstName.slice(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate a comment using OpenAI
   */
  async generateComment() {
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
            content: this.prompt || 'Generate a brief, authentic comment about local traffic issues in Swanage.',
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