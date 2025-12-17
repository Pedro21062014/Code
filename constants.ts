import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // Gemini Models
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: AIProvider.Gemini, creditCost: 30 },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro Preview', provider: AIProvider.Gemini, creditCost: 70 },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: AIProvider.Gemini, creditCost: 15 },
  
  // OpenAI Models
  { id: 'gpt-4o', name: 'GPT-4o', provider: AIProvider.OpenAI, creditCost: 15 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: AIProvider.OpenAI, creditCost: 2 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: AIProvider.OpenAI, creditCost: 1 },
  
  // DeepSeek Models
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: AIProvider.DeepSeek, creditCost: 5 },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: AIProvider.DeepSeek, creditCost: 5 },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

export const DAILY_CREDIT_LIMIT = 300;

// Adicionada uma chave de API padrão do Gemini como fallback, lendo de variáveis de ambiente VITE_
export const DEFAULT_GEMINI_API_KEY = (import.meta as any).env?.VITE_DEFAULT_GEMINI_API_KEY || 'AIzaSyD0433RALd_5FVbs89xn6okQUsZ3QgHejU';