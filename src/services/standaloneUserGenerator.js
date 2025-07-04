import { faker } from '@faker-js/faker/locale/en_GB';
import fetch from 'node-fetch';

// Peak hours configuration
const PEAK_HOURS = [7, 8, 11, 12, 16, 17, 20, 21];
const PEAK_PROBABILITY_MULTIPLIER = 8;
const BASE_PROBABILITY_PER_MINUTE = 0.0035;

export class StandaloneUserGenerator {
  constructor(prompt, anthropicKey) {
    this.prompt = prompt;
    this.anthropicKey = anthropicKey;
    this.anthropicApiUrl = 'https://api.anthropic.com/v1/messages';
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
   * Generate email address with realistic variations
   */
  generateEmailAddress(firstName, lastName) {
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
    
    // Weighted random selection for email format
    const formatRandom = Math.random();
    let emailLocalPart;
    
    if (formatRandom < 0.25) {
      // 25% - firstname.lastname
      emailLocalPart = `${firstName}.${lastName}`.toLowerCase();
    } else if (formatRandom < 0.45) {
      // 20% - firstnamelastname (no dot)
      emailLocalPart = `${firstName}${lastName}`.toLowerCase();
    } else if (formatRandom < 0.60) {
      // 15% - firstname only
      emailLocalPart = firstName.toLowerCase();
    } else if (formatRandom < 0.75) {
      // 15% - f.lastname (initial + surname)
      emailLocalPart = `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}`;
    } else if (formatRandom < 0.85) {
      // 10% - lastname only
      emailLocalPart = lastName.toLowerCase();
    } else {
      // 15% - various formats with numbers
      const baseFormat = Math.random();
      let baseEmail;
      
      if (baseFormat < 0.4) {
        baseEmail = `${firstName}.${lastName}`.toLowerCase();
      } else if (baseFormat < 0.7) {
        baseEmail = `${firstName}${lastName}`.toLowerCase();
      } else {
        baseEmail = firstName.toLowerCase();
      }
      
      // Add numbers
      const numberType = Math.random();
      let number;
      
      if (numberType < 0.3) {
        // 30% - age (18-75)
        number = faker.number.int({ min: 18, max: 75 });
      } else if (numberType < 0.6) {
        // 30% - birth year (1950-2006)
        number = faker.number.int({ min: 1950, max: 2006 });
      } else if (numberType < 0.8) {
        // 20% - last 2 digits of year
        const year = faker.number.int({ min: 1950, max: 2006 });
        number = year % 100;
      } else {
        // 20% - random 1-4 digits
        number = faker.number.int({ min: 1, max: 9999 });
      }
      
      emailLocalPart = `${baseEmail}${number}`;
    }
    
    // Slugify to ensure safe email format
    emailLocalPart = faker.helpers.slugify(emailLocalPart);
    
    return `${emailLocalPart}@${emailProvider}`;
  }

  /**
   * Generate a single user with optional comment
   */
  async generateUser(includeComment = false) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    // Generate email with realistic variations
    const email = this.generateEmailAddress(firstName, lastName);

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
    if (includeComment && this.anthropicKey) {
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
   * Generate a comment using Anthropic Claude
   */
  async generateComment() {
    if (!this.anthropicKey) {
      throw new Error('Anthropic API key not provided');
    }

    try {
      const response = await fetch(this.anthropicApiUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 150,
          temperature: 0.8,
          system: 'You are a concerned UK citizen providing authentic feedback about local traffic issues. Keep responses concise and natural.',
          messages: [
            {
              role: 'user',
              content: this.prompt || 'Generate a brief, authentic comment about local traffic issues in Swanage.',
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const comment = data.content?.[0]?.text?.trim();
      
      if (!comment) {
        throw new Error('No comment generated');
      }

      return comment;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }
}