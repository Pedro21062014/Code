import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: AIProvider.Gemini },
  { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', provider: AIProvider.Gemini },
  { id: 'gpt-4o', name: 'GPT-4o', provider: AIProvider.OpenAI },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: AIProvider.OpenAI },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: AIProvider.OpenAI },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: AIProvider.DeepSeek },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: AIProvider.DeepSeek },
  { id: 'moonshot-v1-32k', name: 'Kimi (32k)', provider: AIProvider.Kimi },
  { id: 'qwen-max', name: 'Qwen Max', provider: AIProvider.Qwen },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: AIProvider.Claude },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: AIProvider.Claude },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: AIProvider.Claude },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;