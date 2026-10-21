
export enum AIProvider {
  Gemini = 'Gemini',
  OpenAI = 'OpenAI',
  DeepSeek = 'DeepSeek',
  Nvidia = 'Nvidia',
}

export enum IntegrationProvider {
  GitHub = 'GitHub',
  Stripe = 'Stripe',
  OpenStreetMap = 'OpenStreetMap',
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  logo?: string; // Caminho do logo do modelo (public/model-logos/...)
}

export interface ProjectFile {
  name: string;
  language: string;
  content: string;
}

// Tipos para a lista de tarefas do plano (AI task list)
export type AITaskStatus = 'pending' | 'running' | 'done' | 'failed';
export interface AITask {
  id: string;
  label: string;
  status: AITaskStatus;
  note?: string;
  children?: AITask[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  summary?: string;
  isThinking?: boolean;
  isImageGenerator?: boolean; // Indicates this message is an image generation task
  image?: string; // Base64 string of the generated image
  filesModified?: Array<string | { name: string; content?: string }>; // Arquivos criados/modificados (nome + conteúdo) 
  terminalCommands?: string[]; // List of commands to execute in WebContainer
  planTasks?: AITask[]; // Structured plan tasks for the AI task list
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
  nvidia_api_key?: string;
  github_access_token?: string;
  netlify_access_token?: string;
  netlify_client_id?: string; // ID for OAuth App
  stripe_public_key?: string;
  stripe_secret_key?: string;
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
  storage?: 'local' | 'google_drive'; // Indicates where the project is primarily stored
  googleDriveFileId?: string; // ID do arquivo no Google Drive para atualizações
  githubRepo?: {
    owner: string;
    name: string;
    branch: string;
    url: string;
  } | null;
}

export type ChatMode = 'general' | 'design' | 'backend';
