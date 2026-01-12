
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // OpenRouter Free Models (Default)
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', provider: AIProvider.OpenRouter },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Free)', provider: AIProvider.OpenRouter },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B (Free)', provider: AIProvider.OpenRouter },
  
  // Direct API Models (Requires User Key)
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Own Key)', provider: AIProvider.Gemini },
  { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro (Own Key)', provider: AIProvider.Gemini },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

// Netlify Client ID para OAuth
export const NETLIFY_CLIENT_ID = 'uz0O6pbDlGcg6yfz0rEDAibosIWNCFsji1DQkGPpoXU';

export const DEFAULT_GEMINI_API_KEY = '';
