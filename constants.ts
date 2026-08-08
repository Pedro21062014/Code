
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // Free Endpoints válidos na API NVIDIA (build.nvidia.com) — provedor padrão
  // Rápidos / Coding / Agent
  { id: 'minimaxai/minimax-m3', name: 'MiniMax M3', provider: AIProvider.Nvidia, logo: '/model-logos/minimax.png' },
  { id: 'z-ai/glm-5.2', name: 'GLM-5.2', provider: AIProvider.Nvidia, logo: '/model-logos/glm.png' },
  { id: 'moonshotai/kimi-k2-6', name: 'Kimi K2.6', provider: AIProvider.Nvidia, logo: '/model-logos/kimi.png' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra', provider: AIProvider.Nvidia, logo: '/model-logos/nvidia.png' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super', provider: AIProvider.Nvidia, logo: '/model-logos/nvidia.png' },
  { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'Nemotron 3 Nano', provider: AIProvider.Nvidia, logo: '/model-logos/nvidia.png' },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning', name: 'Nemotron 3 Nano Omni', provider: AIProvider.Nvidia, logo: '/model-logos/nvidia.png' },
  { id: 'nvidia/nemotron-mini-4b-instruct', name: 'Nemotron Mini 4B', provider: AIProvider.Nvidia, logo: '/model-logos/nvidia.png' },
  { id: 'nvidia/nvidia-nemotron-nano-9b-v2', name: 'Nemotron Nano 9B', provider: AIProvider.Nvidia, logo: '/model-logos/nvidia.png' },
  { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5', name: 'Nemotron Super 49B', provider: AIProvider.Nvidia, logo: '/model-logos/nvidia.png' },
  { id: 'mistralai/mistral-medium-3.5-128b', name: 'Mistral Medium 3.5', provider: AIProvider.Nvidia, logo: '/model-logos/mistral.png' },
  { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B', provider: AIProvider.Nvidia, logo: '/model-logos/mistral.png' },
  { id: 'stepfun-ai/step-3-7-flash', name: 'Step 3.7 Flash', provider: AIProvider.Nvidia, logo: '/model-logos/stepfun.png' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct', name: 'Qwen3 Next 80B', provider: AIProvider.Nvidia, logo: '/model-logos/qwen.png' },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: AIProvider.Nvidia, logo: '/model-logos/deepseek.png' },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: AIProvider.Nvidia, logo: '/model-logos/deepseek.png' },
  { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B', provider: AIProvider.Nvidia, logo: '/model-logos/google.png' },
  { id: 'google/paligemma', name: 'PaliGemma', provider: AIProvider.Nvidia, logo: '/model-logos/google.png' },
  { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: AIProvider.Nvidia, logo: '/model-logos/meta.png' },
  { id: 'meta/llama-guard-4-12b', name: 'Llama Guard 4', provider: AIProvider.Nvidia, logo: '/model-logos/meta.png' },
];

// Modelos BYOK do Google (Gemini) — o usuário usa a própria chave da API do Google.
export const GOOGLE_BYOK_MODELS: AIModel[] = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Preview)', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', provider: AIProvider.Gemini, logo: '/model-logos/gemini.png' },
];

export const INITIAL_CHAT_MESSAGE = `Olá! Sou seu assistente de codificação de IA. Descreva a aplicação web que você deseja construir. Por exemplo: "Crie um site de portfólio simples com uma página inicial, sobre e de contato."`;

// Netlify Client ID para OAuth
export const NETLIFY_CLIENT_ID = 'uz0O6pbDlGcg6yfz0rEDAibosIWNCFsji1DQkGPpoXU';

// Google OAuth Client ID (Necessário criar no Google Cloud Console)
// Substitua pelo seu Client ID real para produção
export const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com'; 

export const DEFAULT_GEMINI_API_KEY = '';
