import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // FIX: Removed 'gemini-2.5-pro' as 'gemini-2.5-flash' is the recommended model for general text tasks.
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: AIProvider.Gemini },
  { id: 'gpt-4o', name: 'GPT-4o', provider: AIProvider.OpenAI },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: AIProvider.OpenAI },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: AIProvider.OpenAI },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: AIProvider.DeepSeek },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: AIProvider.DeepSeek },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

// Adicionada uma chave de API padrão do Gemini como fallback
export const DEFAULT_GEMINI_API_KEY = 'AIzaSyD0433RALd_5FVbs89xn6okQUsZ3QgHejU';