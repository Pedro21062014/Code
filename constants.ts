
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // Free Models (Default) — served by the built-in provider
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: AIProvider.Nvidia },
  { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6', provider: AIProvider.Nvidia },
  { id: 'minimaxai/minimax-m2.7', name: 'MiniMax M2.7', provider: AIProvider.Nvidia },
  { id: 'meta/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick', provider: AIProvider.Nvidia },
  { id: 'mistralai/mistral-large-3-675b-instruct-2512', name: 'Mistral Large 3', provider: AIProvider.Nvidia },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super', provider: AIProvider.Nvidia },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: AIProvider.Nvidia },

  // Direct API Models (Requires User Key)
  { id: 'gemini-2.0-flash', name: 'Gemini 2.5 Flash (Own Key)', provider: AIProvider.Gemini }, // Added 2.5 (Mapped to 2.0-flash)
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

// Netlify Client ID para OAuth
export const NETLIFY_CLIENT_ID = 'uz0O6pbDlGcg6yfz0rEDAibosIWNCFsji1DQkGPpoXU';

// Google OAuth Client ID (Necessário criar no Google Cloud Console)
// Substitua pelo seu Client ID real para produção
export const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com'; 

export const DEFAULT_GEMINI_API_KEY = '';
