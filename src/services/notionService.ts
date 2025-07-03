import { Config, NotionPage, NotionBlock } from '../types/index.js';

export class NotionService {
  private readonly apiVersion = '2022-06-28';
  private readonly baseUrl = 'https://api.notion.com/v1';

  constructor(
    private readonly token: string,
    private readonly databaseId: string,
    private readonly promptPageId: string
  ) { }

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
        openAIPercentage: props.openAIPercentage?.number ?? 0.3,
        minSignups: props.minSignups?.number ?? 10,
        maxSignups: props.maxSignups?.number ?? 40,
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
    // Validate percentage bounds
    if (config.openAIPercentage < 0 || config.openAIPercentage > 1) {
      throw new Error('Invalid configuration: openAIPercentage must be between 0 and 1');
    }

    // Validate daily signup bounds
    if (config.maxSignups < config.minSignups) {
      throw new Error('Invalid configuration: maxSignupsPerDay must be greater than or equal to minSignupsPerDay');
    }

    if (config.minSignups < 0) {
      throw new Error('Invalid configuration: minSignupsPerDay must be non-negative');
    }
  }
}