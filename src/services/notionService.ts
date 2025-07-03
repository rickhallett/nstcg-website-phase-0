import { Config, NotionPage, NotionBlock } from '../types';

export class NotionService {
  private readonly apiVersion = '2022-06-28';
  private readonly baseUrl = 'https://api.notion.com/v1';

  constructor(
    private readonly token: string,
    private readonly databaseId: string,
    private readonly promptPageId: string
  ) {}

  private async makeRequest(endpoint: string, method: string = 'GET', body?: unknown): Promise<Response> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      'Notion-Version': this.apiVersion,
    };

    if (method === 'POST' || method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    return response;
  }

  async getConfig(): Promise<Config | null> {
    try {
      const response = await this.makeRequest(`databases/${this.databaseId}/query`, 'POST', {});
      const data = await response.json() as { results: NotionPage[] };

      if (!data.results || data.results.length === 0) {
        return null;
      }

      const page: NotionPage = data.results[0];
      const props = page.properties;

      const config: Config = {
        enabled: props.enabled?.checkbox || false,
        startTime: props.startTime?.rich_text?.[0]?.text?.content || '00:00',
        endTime: props.endTime?.rich_text?.[0]?.text?.content || '23:59',
        minSignups: props.minSignups?.number || 5,
        maxSignups: props.maxSignups?.number || 20,
        openAIPercentage: props.openAIPercentage?.number || 0.3,
        avgDelay: props.avgDelay?.number || 120,
        jitter: props.jitter?.number || 30,
      };

      // Validate configuration
      this.validateConfig(config);

      return config;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid configuration')) {
        throw error;
      }
      throw new Error(`Failed to fetch configuration: ${error}`);
    }
  }

  async getPrompt(): Promise<string> {
    try {
      const response = await this.makeRequest(`blocks/${this.promptPageId}/children`);
      const data = await response.json() as { results: NotionBlock[] };

      if (!data.results || data.results.length === 0) {
        return '';
      }

      const textBlocks: string[] = [];

      for (const block of data.results) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          const text = block.paragraph.rich_text
            .map((rt: any) => rt.text?.content || '')
            .join('');
          
          if (text.trim()) {
            textBlocks.push(text);
          }
        }
      }

      return textBlocks.join('\\n\\n');
    } catch (error) {
      throw new Error(`Failed to fetch prompt: ${error}`);
    }
  }

  private validateConfig(config: Config): void {
    // Validate signup bounds
    if (config.maxSignups < config.minSignups) {
      throw new Error('Invalid configuration: maxSignups must be greater than minSignups');
    }

    // Validate percentage bounds
    if (config.openAIPercentage < 0 || config.openAIPercentage > 1) {
      throw new Error('Invalid configuration: openAIPercentage must be between 0 and 1');
    }

    // Validate positive numbers
    if (config.minSignups < 0 || config.maxSignups < 0 || config.avgDelay < 0 || config.jitter < 0) {
      throw new Error('Invalid configuration: numeric values must be non-negative');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(config.startTime) || !timeRegex.test(config.endTime)) {
      throw new Error('Invalid configuration: times must be in HH:MM format');
    }
  }
}