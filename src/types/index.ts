export interface Config {
  enabled: boolean;
  openAIPercentage: number; // 0-1, determines chance of AI-generated comment
  minSignups: number;
  maxSignups: number;
}

export interface GeneratedUser {
  name: string;
  email: string;
  postcode: string;
  hearAbout: string;
  wantsUpdates: boolean;
  comment?: string;
  referralCode?: string;
  timestamp: Date;
}

export interface UserGenerationResult {
  users: GeneratedUser[];
  withComments: number;
  withoutComments: number;
}

export interface PromptConfig {
  systemPrompt: string;
  userPrompt: string;
}

export interface DatabaseRecord {
  id?: string;
  name: string;
  email: string;
  postcode: string;
  hearAbout: string;
  wantsUpdates: boolean;
  comment?: string;
  referralCode?: string;
  isGenerated: boolean;
  generatedAt: Date;
  generationBatch: string;
}

export interface NotionProperty {
  id?: string;
  type?: string;
  checkbox?: boolean;
  rich_text?: Array<{
    type?: string;
    text?: {
      content: string;
      link?: null;
    };
    plain_text?: string;
  }>;
  number?: number | null;
  title?: Array<{
    type?: string;
    text?: {
      content: string;
      link?: null;
    };
    plain_text?: string;
  }>;
}

export interface NotionPage {
  id: string;
  properties: {
    [key: string]: NotionProperty;
  };
}

export interface NotionBlock {
  type: string;
  paragraph?: {
    rich_text: Array<{
      type: string;
      text: {
        content: string;
      };
    }>;
  };
}