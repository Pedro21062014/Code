
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: AIProvider.Gemini },
  { id: 'gpt-4o', name: 'GPT-4o', provider: AIProvider.OpenAI },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: AIProvider.OpenAI },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: AIProvider.OpenAI },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: AIProvider.DeepSeek },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: AIProvider.DeepSeek },
];

export const INITIAL_CHAT_MESSAGE = `Hello! I'm your AI coding assistant. Describe the web application you want to build. For example: "Create a simple portfolio website with a home, about, and contact page."`;
