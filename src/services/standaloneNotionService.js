import fetch from 'node-fetch';

export class StandaloneNotionService {
  constructor(token, promptPageId) {
    this.token = token;
    this.promptPageId = promptPageId;
    this.apiVersion = '2022-06-28';
    this.baseUrl = 'https://api.notion.com/v1';
  }

  async getPrompt() {
    try {
      const response = await fetch(`${this.baseUrl}/blocks/${this.promptPageId}/children`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': this.apiVersion,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notion API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return 'Generate a brief, authentic comment about local traffic issues in Swanage.';
      }

      const textBlocks = [];

      for (const block of data.results) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
          const text = block.paragraph.rich_text
            .map((rt) => rt.text?.content || '')
            .join('');

          if (text.trim()) {
            textBlocks.push(text);
          }
        }
      }

      const prompt = textBlocks.join('\n\n');
      return prompt || 'Generate a brief, authentic comment about local traffic issues in Swanage.';
    } catch (error) {
      console.error('Failed to fetch prompt from Notion:', error);
      // Return default prompt if Notion fetch fails
      return 'Generate a brief, authentic comment about local traffic issues in Swanage.';
    }
  }
}