
export enum AIProvider {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  DeepSeek = 'DeepSeek',
  OpenRouter = 'OpenRouter',
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
  isImageGenerator?: boolean; // Indicates this message is an image generation task
  image?: string; // Base64 string of the generated image
  filesModified?: string[]; // List of files modified or created in this step
  groundingMetadata?: {
    groundingChunks: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
}

// UserSettings reflecting Firestore 'users' collection
export interface UserSettings {
  id: string;
  email?: string;
  updated_at?: string;
  credits?: number; // Added credits field
  last_credit_redemption?: string; // Timestamp of last daily credit claim
  gemini_api_key?: string;
  openai_api_key?: string;
  openrouter_api_key?: string;
  github_access_token?: string;
  netlify_access_token?: string;
  netlify_client_id?: string; // ID for OAuth App
  supabase_project_url?: string;
  supabase_anon_key?: string;
  supabase_service_key?: string;
  stripe_public_key?: string;
  stripe_secret_key?: string;
  neon_connection_string?: string;
  plan?: 'Hobby' | 'Pro';
  hasSeenProWelcome?: boolean;
}

export type Theme = 'light' | 'dark';

export interface ProjectVersion {
  id: string;
  timestamp: number;
  files: ProjectFile[];
  message: string; // Descrição curta (ex: último prompt ou "Versão Manual")
}

export interface SavedProject {
  id: number;
  ownerId?: string;
  author?: string; // Nome do criador
  shared_with?: string[];
  is_public_in_gallery?: boolean;
  deployedUrl?: string | null; // Link do Netlify (Updated to allow null)
  netlifySiteId?: string | null; // ID do site no Netlify para atualizações (Updated to allow null)
  previewImage?: string | null; // Base64 image for gallery preview (Updated to allow null)
  logo?: string | null; // Base64 image for app logo (Updated to allow null)
  description?: string; // Project description
  likes?: number;
  likedBy?: string[]; // IDs dos usuários que curtiram
  category?: string; // Categoria do projeto
  name: string;
  files: ProjectFile[];
  chat_history: ChatMessage[];
  env_vars: Record<string, string>;
  created_at: string;
  updated_at: string;
  githubRepo?: {
    owner: string;
    name: string;
    branch: string;
    url: string;
  } | null;
}

export type ChatMode = 'general' | 'design' | 'backend';