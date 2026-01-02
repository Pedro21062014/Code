
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // Gemini Models
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: AIProvider.Gemini },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: AIProvider.Gemini },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', provider: AIProvider.Gemini },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

// Adicionada uma chave de API padrão do Gemini como fallback, lendo de variáveis de ambiente VITE_
export const DEFAULT_GEMINI_API_KEY = (import.meta as any).env?.VITE_DEFAULT_GEMINI_API_KEY || 'AIzaSyD0433RALd_5FVbs89xn6okQUsZ3QgHejU';
