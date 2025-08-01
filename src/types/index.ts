export interface Config {
  openai: {
    apiKey: string | undefined;
    apiBase?: string;
  };
  models: {
    chat: string;
    embedding: string;
  };
  app: {
    maxTokens: number;
    temperature: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DocumentChunk {
  content: string;
  metadata: {
    source: string;
    page?: number;
    startIndex?: number;
    endIndex?: number;
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
