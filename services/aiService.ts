
import { ProjectFile, AIProvider } from '../types';
import { generateCodeStreamWithGemini } from './geminiService';
import { generateCodeStreamWithOpenRouter } from './openRouterService';
import { AI_MODELS, DEFAULT_GEMINI_API_KEY } from '../constants';

export const generateCodeStream = async (
  prompt: string,
  existingFiles: ProjectFile[],
  envVars: Record<string, string>,
  onChunk: (chunk: string) => void,
  modelId: string,
  attachments: { data: string; mimeType: string }[] = [],
  apiKey?: string
): Promise<string> => {
  const modelDef = AI_MODELS.find(m => m.id === modelId);
  const isGemini = modelId.includes('gemini') || modelDef?.provider === AIProvider.Gemini;

  if (isGemini) {
      // Use provided key, or process.env, or fallback default
      const keyToUse = apiKey || process.env.API_KEY || DEFAULT_GEMINI_API_KEY;
      return generateCodeStreamWithGemini(
          prompt,
          existingFiles,
          envVars,
          onChunk,
          modelId,
          keyToUse,
          attachments
      );
  }

  // Default to OpenRouter for other models (GPT, Claude, DeepSeek via OpenRouter)
  // Ensure we have a key
  if (!apiKey) {
      // Allow fallback for demo purposes if configured, otherwise throw
      throw new Error("Chave de API (OpenRouter) necessária para este modelo.");
  }

  return generateCodeStreamWithOpenRouter(
      prompt,
      existingFiles,
      envVars,
      onChunk,
      apiKey,
      modelId
  );
};
