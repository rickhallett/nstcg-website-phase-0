#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fetch from 'node-fetch';
import { StandaloneUserGenerator } from '../src/services/standaloneUserGenerator.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('enabled', {
    alias: 'e',
    type: 'boolean',
    default: true,
    description: 'Enable/disable the signup generation'
  })
  .option('base-probability', {
    alias: 'p',
    type: 'number',
    default: 0.0035,
    description: 'Base probability per minute (0.0035 = 0.35%)'
  })
  .option('peak-multiplier', {
    alias: 'm',
    type: 'number',
    default: 8,
    description: 'Multiplier for peak hours'
  })
  .option('comment-percentage', {
    alias: 'c',
    type: 'number',
    default: 0.3,
    description: 'Percentage of users with comments (0.3 = 30%)'
  })
  .option('api-url', {
    alias: 'u',
    type: 'string',
    default: process.env.API_URL || 'http://localhost:3000/api/submit-form',
    description: 'URL of the submit-form endpoint'
  })
  .option('dry-run', {
    alias: 'd',
    type: 'boolean',
    default: false,
    description: 'Generate users but don\'t submit them'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    default: false,
    description: 'Enable verbose logging'
  })
  .option('log-file', {
    alias: 'l',
    type: 'string',
    default: path.join(__dirname, '../logs/signup-runner.log'),
    description: 'Path to log file'
  })
  .option('interval', {
    alias: 'i',
    type: 'number',
    default: 60000,
    description: 'Interval between runs in milliseconds (default: 60000 = 1 minute)'
  })
  .option('peak-hours', {
    type: 'string',
    default: '7,8,11,12,16,17,20,21',
    description: 'Comma-separated list of peak hours (UTC)'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Configuration
const config = {
  enabled: argv.enabled,
  baseProbability: argv['base-probability'],
  peakMultiplier: argv['peak-multiplier'],
  commentPercentage: argv['comment-percentage'],
  apiUrl: argv['api-url'],
  dryRun: argv['dry-run'],
  verbose: argv.verbose,
  logFile: argv['log-file'],
  interval: argv.interval,
  peakHours: argv['peak-hours'].split(',').map(h => parseInt(h.trim()))
};

// Logger
class Logger {
  constructor(logFile, verbose) {
    this.logFile = logFile;
    this.verbose = verbose;
  }

  async log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    // Console output
    if (this.verbose || level === 'error') {
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
    }

    // File output
    try {
      const logDir = path.dirname(this.logFile);
      await fs.mkdir(logDir, { recursive: true });
      
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async info(message, data) {
    await this.log('info', message, data);
  }

  async error(message, data) {
    await this.log('error', message, data);
  }

  async debug(message, data) {
    if (this.verbose) {
      await this.log('debug', message, data);
    }
  }
}

// Signup Runner
class SignupRunner {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.stats = {
      totalGenerated: 0,
      totalSubmitted: 0,
      totalFailed: 0,
      startTime: new Date()
    };
    this.isRunning = false;
    this.intervalId = null;
  }

  async start() {
    if (!this.config.enabled) {
      await this.logger.info('Signup generation is disabled');
      return;
    }

    this.isRunning = true;
    await this.logger.info('Starting signup runner', { config: this.config });

    // Run immediately
    await this.runGeneration();

    // Set up interval
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.runGeneration();
      }
    }, this.config.interval);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.stop();
    });

    process.on('SIGTERM', async () => {
      await this.stop();
    });
  }

  async stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    const runtime = Math.floor((new Date() - this.stats.startTime) / 1000);
    await this.logger.info('Stopping signup runner', {
      stats: this.stats,
      runtime: `${runtime} seconds`
    });

    process.exit(0);
  }

  async runGeneration() {
    try {
      const currentHour = new Date().getUTCHours();
      const isPeakTime = this.config.peakHours.includes(currentHour);
      
      const probability = isPeakTime
        ? this.config.baseProbability * this.config.peakMultiplier
        : this.config.baseProbability;

      await this.logger.debug('Running generation', {
        hour: currentHour,
        isPeakTime,
        probability
      });

      // Decide if we should generate anyone this minute
      if (Math.random() > probability) {
        await this.logger.debug('No generation this cycle (probability check)');
        return;
      }

      // If we do generate, decide on 1 or 2 users (80% chance for 1)
      const numberOfUsers = Math.random() < 0.8 ? 1 : 2;
      
      await this.logger.info(`Generating ${numberOfUsers} user(s)`);

      for (let i = 0; i < numberOfUsers; i++) {
        await this.generateAndSubmitUser();
      }

    } catch (error) {
      await this.logger.error('Generation cycle failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  async generateAndSubmitUser() {
    try {
      // Generate user data
      const shouldHaveComment = Math.random() < this.config.commentPercentage;
      const userGenerator = new StandaloneUserGenerator(
        'Generate a brief, authentic comment about local traffic issues in Swanage.',
        process.env.OPENAI_API_KEY
      );

      // Generate user using the standalone generator
      const user = await userGenerator.generateUser(shouldHaveComment);
      
      this.stats.totalGenerated++;

      await this.logger.debug('Generated user', { user });

      if (this.config.dryRun) {
        await this.logger.info('Dry run - user not submitted', { user });
        return;
      }

      // Submit to API
      const submitted = await this.submitUser(user);
      if (submitted) {
        this.stats.totalSubmitted++;
        await this.logger.info('User submitted successfully', {
          email: user.email.substring(0, 3) + '***'
        });
      } else {
        this.stats.totalFailed++;
      }

    } catch (error) {
      this.stats.totalFailed++;
      await this.logger.error('Failed to generate/submit user', {
        error: error.message
      });
    }
  }


  async submitUser(user) {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          timestamp: user.timestamp,
          source: user.source,
          comment: user.comment,
          referrer: user.referralCode,
          user_id: user.user_id,
          submission_id: user.submission_id
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        await this.logger.error('API submission failed', {
          status: response.status,
          error: errorData
        });
        return false;
      }

      const data = await response.json();
      await this.logger.debug('API response', data);
      return true;

    } catch (error) {
      await this.logger.error('Failed to submit user', {
        error: error.message
      });
      return false;
    }
  }
}

// Main execution
async function main() {
  const logger = new Logger(config.logFile, config.verbose);
  const runner = new SignupRunner(config, logger);

  await logger.info('Signup Runner Configuration', { config });
  
  if (config.dryRun) {
    await logger.info('Running in DRY RUN mode - no users will be submitted');
  }

  await runner.start();
}

// Run the script
main().catch(console.error);