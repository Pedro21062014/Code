
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // OpenRouter Free Models (Default)
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', provider: AIProvider.OpenRouter },
  { id: 'moonshotai/moonshot-v1-8k:free', name: 'Kimi (Free)', provider: AIProvider.OpenRouter },
  { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Free)', provider: AIProvider.OpenRouter },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT OSS 120B (Free)', provider: AIProvider.OpenRouter },
  { id: 'xiaomi/mimo-v2-flash:free', name: 'Xiaomi MiMo V2 Flash (Free)', provider: AIProvider.OpenRouter },
  
  // Direct API Models (Requires User Key)
  { id: 'gemini-2.0-flash', name: 'Gemini 2.5 Flash (Own Key)', provider: AIProvider.Gemini }, // Added 2.5 (Mapped to 2.0-flash)
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

// Netlify Client ID para OAuth
export const NETLIFY_CLIENT_ID = 'uz0O6pbDlGcg6yfz0rEDAibosIWNCFsji1DQkGPpoXU';

export const DEFAULT_GEMINI_API_KEY = '';
