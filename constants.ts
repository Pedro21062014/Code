
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // Gemini Models
  /* Updated model IDs based on SDK guidelines: basic text tasks use gemini-3-flash-preview, complex tasks use gemini-3-pro-preview */
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: AIProvider.Gemini, creditCost: 30 },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: AIProvider.Gemini, creditCost: 70 },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', provider: AIProvider.Gemini, creditCost: 15 },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

export const DAILY_CREDIT_LIMIT = 300;

// Adicionada uma chave de API padrão do Gemini como fallback, lendo de variáveis de ambiente VITE_
export const DEFAULT_GEMINI_API_KEY = (import.meta as any).env?.VITE_DEFAULT_GEMINI_API_KEY || 'AIzaSyD0433RALd_5FVbs89xn6okQUsZ3QgHejU';
