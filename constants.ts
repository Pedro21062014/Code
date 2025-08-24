import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', provider: AIProvider.Gemini },
  { id: 'meta-llama/llama-3-8b-instruct', name: 'Llama 3 8B', provider: AIProvider.OpenAI },
  { id: 'deepseek/deepseek-v2-coder', name: 'DeepSeek V2 Coder', provider: AIProvider.DeepSeek },
  { id: 'moonshot/moonshot-v1-32k', name: 'Kimi (32k)', provider: AIProvider.Kimi },
  { id: 'qwen/qwen-2-7b-instruct', name: 'Qwen 2 7B', provider: AIProvider.Qwen },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;