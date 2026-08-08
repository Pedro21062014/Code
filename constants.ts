
import { AIProvider, AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // Free Endpoints válidos na API NVIDIA (build.nvidia.com) — provedor padrão
  { id: 'minimaxai/minimax-m3', name: 'MiniMax M3', provider: AIProvider.Nvidia, logo: '/model-logos/minimax.png' },
  { id: 'z-ai/glm-5.2', name: 'GLM-5.2', provider: AIProvider.Nvidia, logo: '/model-logos/glm.png' },
  { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6', provider: AIProvider.Nvidia, logo: '/model-logos/kimi.png' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron 3 Ultra', provider: AIProvider.Nvidia, logo: '/model-logos/nvidia.png' },
  { id: 'mistralai/mistral-medium-3.5-128b', name: 'Mistral Medium 3.5', provider: AIProvider.Nvidia, logo: '/model-logos/mistral.png' },
  { id: 'stepfun-ai/step-3.7-flash', name: 'Step 3.7 Flash', provider: AIProvider.Nvidia, logo: '/model-logos/stepfun.png' },
  { id: 'qwen/qwen3.5-397b-a17b', name: 'Qwen3.5 397B', provider: AIProvider.Nvidia, logo: '/model-logos/qwen.png' },

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
