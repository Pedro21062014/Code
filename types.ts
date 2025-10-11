
export enum AIProvider {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  DeepSeek = 'DeepSeek',
}

export enum IntegrationProvider {
  GitHub = 'GitHub',
  Supabase = 'Supabase',
  Stripe = 'Stripe',
  OpenStreetMap = 'OpenStreetMap',
  Neon = 'Neon',
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
  role: 'user' | 'assistant' | 'system';
  content: string;
  summary?: string;
  isThinking?: boolean;
}

// UserSettings agora reflete a estrutura da tabela 'profiles' do Supabase
export interface UserSettings {
  id: string; // Corresponde a auth.users.id
  updated_at?: string;
  gemini_api_key?: string;
  github_access_token?: string;
  supabase_project_url?: string;
  supabase_anon_key?: string;
  supabase_service_key?: string;
  stripe_public_key?: string;
  stripe_secret_key?: string;
  neon_connection_string?: string;
}

export type Theme = 'light' | 'dark';

// SavedProject agora reflete uma estrutura de armazenamento local
export interface SavedProject {
  id: number; // ID exclusivo, pode ser um timestamp
  name: string;
  files: ProjectFile[];
  chat_history: ChatMessage[];
  env_vars: Record<string, string>;
  created_at: string;
  updated_at: string;
}
