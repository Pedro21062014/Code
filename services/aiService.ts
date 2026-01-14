
import { ProjectFile, AIProvider } from '../types';
import { generateCodeStreamWithGemini } from './geminiService';
import { generateCodeStreamWithOpenRouter } from './openRouterService'; // Client-side (if user provides key)
import { AI_MODELS } from '../constants';

// Generic function to call the backend proxy
const generateCodeStreamWithServer = async (
  prompt: string,
  existingFiles: ProjectFile[],
  envVars: Record<string, string>,
  onChunk: (chunk: string) => void,
  provider: AIProvider,
  model: string,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        existingFiles,
        envVars,
        provider,
        model,
      }),
      signal: signal,
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkText = decoder.decode(value, { stream: true });
      fullResponse += chunkText;
      onChunk(chunkText);
    }
    
    return fullResponse;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Generation aborted by user');
      return JSON.stringify({ message: "Geração interrompida pelo usuário.", files: existingFiles });
    }
    console.error(`Error calling backend proxy for ${provider}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorJson = JSON.stringify({
        message: `Ocorreu um erro: ${errorMessage}.`,
        files: existingFiles
    });
    onChunk(errorJson);
    return errorJson;
  }
};

export const generateCodeStream = async (
  prompt: string,
  existingFiles: ProjectFile[],
  envVars: Record<string, string>,
  onChunk: (chunk: string) => void,
  modelId: string,
  attachments: { data: string; mimeType: string }[] = [],
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const modelDef = AI_MODELS.find(m => m.id === modelId);
  const provider = modelDef?.provider;

  // 1. Gemini (Client-side with User Key)
  if (provider === AIProvider.Gemini) {
      if (!apiKey) throw new Error("Chave de API do Gemini necessária.");
      return generateCodeStreamWithGemini(
          prompt,
          existingFiles,
          envVars,
          onChunk,
          modelId,
          apiKey,
          attachments,
          signal
      );
  }

  // 2. OpenRouter (Server-side with default system key OR Client-side with user key)
  if (provider === AIProvider.OpenRouter) {
      // If user provided a custom OpenRouter key, use client-side service
      if (apiKey && apiKey.startsWith('sk-or-')) {
          return generateCodeStreamWithOpenRouter(
              prompt,
              existingFiles,
              envVars,
              onChunk,
              apiKey,
              modelId,
              signal
          );
      }
      
      // Otherwise, use the Server Proxy (Cloudflare Env Var)
      // This handles the "Free" models requested
      return generateCodeStreamWithServer(
          prompt,
          existingFiles,
          envVars,
          onChunk,
          AIProvider.OpenRouter,
          modelId,
          signal
      );
  }

  // 3. OpenAI / DeepSeek (Server-side Proxy)
  if (provider === AIProvider.OpenAI || provider === AIProvider.DeepSeek) {
      return generateCodeStreamWithServer(
          prompt,
          existingFiles,
          envVars,
          onChunk,
          provider,
          modelId,
          signal
      );
  }

  throw new Error(`Provedor de IA não suportado: ${provider}`);
};
