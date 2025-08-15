
export enum AIProvider {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  DeepSeek = 'DeepSeek',
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
  userName: string;
  openAIKey: string;
  deepSeekKey: string;
}
