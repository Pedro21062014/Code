
import { ProjectFile, AIModel, AIProvider } from '../types';

export const fetchAvailableModels = async (userApiKey?: string): Promise<AIModel[]> => {
    try {
        const headers: Record<string, string> = {};
        if (userApiKey) {
            headers['X-OpenRouter-Key'] = userApiKey;
        }

        const response = await fetch('/api/models', { headers });
        if (!response.ok) return [];
        
        const data = await response.json();
        
        if (!data.data) return [];

        // Mapeia os modelos do OpenRouter para o formato interno
        return data.data.map((m: any) => {
            let provider = AIProvider.OpenAI;
            if (m.id.includes('gemini') || m.id.includes('google')) provider = AIProvider.Gemini;
            if (m.id.includes('deepseek')) provider = AIProvider.DeepSeek;

            // Calcula um custo aproximado baseado no pricing (simplificado) ou define padrão
            let cost = 10;
            if (m.pricing) {
                const avgPrice = (parseFloat(m.pricing.prompt) + parseFloat(m.pricing.completion)) * 500; // Custo estimado por request médio
                if (avgPrice > 0.01) cost = 100;
                else if (avgPrice > 0.001) cost = 50;
                else cost = 15;
            }

            return {
                id: m.id,
                name: m.name,
                provider: provider,
                creditCost: cost
            };
        }).sort((a: AIModel, b: AIModel) => a.name.localeCompare(b.name));

    } catch (e) {
        console.error("Erro ao carregar modelos:", e);
        return [];
    }
};

export const generateCodeStream = async (
  prompt: string,
  existingFiles: ProjectFile[],
  envVars: Record<string, string>,
  onChunk: (chunk: string) => void,
  modelId: string,
  attachments?: { data: string; mimeType: string }[],
  userApiKey?: string // Parâmetro opcional para chave do usuário
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
        model: modelId,
        apiKey: userApiKey // Envia a chave se existir
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkText = decoder.decode(value, { stream: true });
      
      // Process OpenRouter SSE format
      const lines = chunkText.split('\n');
      for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          
          if (trimmed.startsWith('data: ')) {
              try {
                  const data = JSON.parse(trimmed.slice(6));
                  const content = data.choices?.[0]?.delta?.content || '';
                  if (content) {
                      fullResponse += content;
                      onChunk(content);
                  }
              } catch (e) {
                  // Ignore parse errors for partial chunks
              }
          }
      }
    }
    
    return fullResponse;

  } catch (error) {
    console.error("Error calling AI API:", error);
    throw error; // Re-throw to be handled by the UI
  }
};

export const generateProjectName = async (prompt: string): Promise<string> => {
   // Simplified for now - can connect to backend if needed later
   return "NovoProjeto";
};
