
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

    if (!response.ok) {
      const errorText = await response.text();
      // Try to parse JSON error if possible
      try {
          const errJson = JSON.parse(errorText);
          throw new Error(errJson.error || `HTTP error! status: ${response.status}`);
      } catch (e) {
          throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
    }

    if (!response.body) throw new Error("Response body is empty");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkRaw = decoder.decode(value, { stream: true });
      
      // OpenAI-compatible providers (OpenAI, DeepSeek, OpenRouter) return SSE streams via the proxy
      if ([AIProvider.OpenRouter, AIProvider.OpenAI, AIProvider.DeepSeek].includes(provider)) {
          buffer += chunkRaw;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ""; // Keep the incomplete line in the buffer

          for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;
              
              if (trimmed.startsWith("data: ")) {
                  try {
                      const jsonStr = trimmed.substring(6);
                      const data = JSON.parse(jsonStr);
                      const content = data.choices?.[0]?.delta?.content;
                      if (content) {
                          fullResponse += content;
                          onChunk(content);
                      }
                  } catch (e) {
                      console.debug("SSE Parse Error (ignoring):", trimmed);
                  }
              }
          }
      } else {
          // Fallback for providers that return raw text
          fullResponse += chunkRaw;
          onChunk(chunkRaw);
      }
    }
    
    return fullResponse;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('Generation aborted by user');
      return JSON.stringify({ message: "Geração interrompida pelo usuário.", files: existingFiles });
    }
    console.error(`Error calling backend proxy for ${provider}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    
    // Check for rate limits or quota
    let friendlyMessage = errorMessage;
    if (errorMessage.includes("429")) friendlyMessage = "Muitas requisições. Tente novamente em alguns instantes.";
    if (errorMessage.includes("402") || errorMessage.includes("credit")) friendlyMessage = "Créditos insuficientes no provedor.";

    const errorJson = JSON.stringify({
        message: `Ocorreu um erro: ${friendlyMessage}`,
        files: existingFiles
    });
    // Do not call onChunk with error JSON, as it might corrupt code view if mid-stream
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
  signal?: AbortSignal,
  onMetadata?: (metadata: any) => void
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
          signal,
          onMetadata
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
