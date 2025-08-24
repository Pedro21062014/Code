
export enum AIProvider {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  DeepSeek = 'DeepSeek',
  Kimi = 'Kimi',
  Qwen = 'Qwen',
}

export enum IntegrationProvider {
  GitHub = 'GitHub',
  Supabase = 'Supabase',
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
}

export interface ProjectFile {
  name: string;
  language: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
}

export interface UserSettings {
  openAIKey: string;
  deepSeekKey: string;
  kimiKey: string;
  qwenKey: string;
}