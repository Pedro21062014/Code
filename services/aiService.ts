
import { ProjectFile } from '../types';

export const generateCodeStream = async (
  prompt: string,
  existingFiles: ProjectFile[],
  envVars: Record<string, string>,
  onChunk: (chunk: string) => void,
  modelId: string,
  // Attachments support can be added later if backend supports it, currently ignored for simplification
  attachments?: { data: string; mimeType: string }[] 
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
