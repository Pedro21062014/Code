
export enum AIProvider {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  DeepSeek = 'DeepSeek',
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
  summary?: string;
  isThinking?: boolean;
}

export interface UserSettings {
  geminiApiKey?: string;
  githubAccessToken?: string;
}

export type Theme = 'light' | 'dark';

export interface SavedProject {
  id: string;
  name: string;
  files: ProjectFile[];
  chatHistory: ChatMessage[];
  savedAt: string;
}
