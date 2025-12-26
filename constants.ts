
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // OpenRouter Models
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: AIProvider.Gemini, creditCost: 15 },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro', provider: AIProvider.Gemini, creditCost: 50 },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: AIProvider.OpenAI, creditCost: 100 },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: AIProvider.OpenAI, creditCost: 80 },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: AIProvider.DeepSeek, creditCost: 40 },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

export const DAILY_CREDIT_LIMIT = 300;

export const DEFAULT_GEMINI_API_KEY = ''; // Não é mais usada diretamente no frontend
