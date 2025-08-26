import { ProjectFile, AIProvider } from '../types';

export const generateCodeStreamWithOpenAI = async (
  prompt: string,
  existingFiles: ProjectFile[],
  onChunk: (chunk: string) => void,
  model: string
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
        provider: AIProvider.OpenAI,
        model: model,
      }),
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

  } catch (error) {
    console.error("Error calling backend proxy for OpenAI:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorJson = JSON.stringify({
        message: `Ocorreu um erro: ${errorMessage}. Por favor, verifique o console do backend para mais detalhes.`,
        files: existingFiles
    });
    onChunk(errorJson);
    return errorJson;
  }
};