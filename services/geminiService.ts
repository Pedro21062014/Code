
import { GoogleGenAI } from "@google/genai";
import { ProjectFile } from '../types';

const getSystemPrompt = (files: ProjectFile[], envVars: Record<string, string>): string => {
  const fileContent = files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');

  let envString = "No environment variables are currently set.";
  if (Object.keys(envVars).length > 0) {
      try {
          envString = `Environment variables available via 'process.env.VARIABLE_NAME':\n${JSON.stringify(envVars, null, 2)}`;
      } catch (e) {
          envString = "Error serializing environment variables.";
      }
  }

  return `You are an expert senior full-stack engineer. Generate complete, functional web applications.
- **GOAL**: Respond with a valid JSON object containing "message", "files" (array with "name", "language", "content"), and optionally "summary", "environmentVariables", "supabaseAdminAction".
- **ARCHITECTURE**: 
  - Single Page Application (Client-side only).
  - Use **React** with functional components and hooks.
  - For navigation, use **react-router-dom**. **IMPORTANT**: Use \`HashRouter\` instead of \`BrowserRouter\` to ensure navigation works correctly within the blob-based preview environment.
  - Use **Supabase** for database/auth/backend if needed.
  - Create 'services/supabase.ts' for Supabase client.
- **STYLING**: Use Tailwind CSS (via CDN in index.html).
- **LIBRARIES**: You can use \`lucide-react\` for icons.
- **LATENCY**: Be concise. Only generate necessary files. No placeholders.
- **IMPORTANT**: Begin with a short one-line "thought" in Portuguese. Then add '---' on a new line. Then the JSON.

Current files:
${fileContent.length > 0 ? fileContent : "Nenhum arquivo existe ainda."}

${envString}
`;
};


export const generateCodeStreamWithGemini = async (
  prompt: string,
  existingFiles: ProjectFile[],
  envVars: Record<string, string>,
  onChunk: (chunk: string) => void,
  modelId: string,
  apiKey: string,
  attachments?: { data: string; mimeType: string }[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = getSystemPrompt(existingFiles, envVars);

    const userParts: any[] = [{ text: prompt }];
    if (attachments && attachments.length > 0) {
        attachments.forEach(file => {
            userParts.push({
                inlineData: {
                    data: file.data,
                    mimeType: file.mimeType,
                },
            });
        });
    }

    const stream = await ai.models.generateContentStream({
        model: modelId,
        contents: { parts: userParts },
        config: {
            systemInstruction,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 }
        },
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
          fullResponse += chunkText;
          onChunk(chunkText);
      }
    }
    
    return fullResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorJson = JSON.stringify({
        message: `Ocorreu um erro ao chamar a API do Gemini: ${errorMessage}.`
    });
    return errorJson;
  }
};

export const generateProjectName = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
   try {
    const ai = new GoogleGenAI({ apiKey });
    const namePrompt = `Gere um nome de projeto em PascalCase (ex: QuantumQuill) para: "${prompt}". Apenas o nome.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: namePrompt,
        config: { thinkingConfig: { thinkingBudget: 0 } }
    });

    const text = response.text || "";
    const projectName = text.trim().replace(/[^a-zA-Z0-9]/g, '');
    return projectName || "NovoProjeto";
  } catch (error) {
    console.error("Error generating project name:", error);
    return "NovoProjeto";
  }
};

export const generateImagesWithImagen = async (
  prompt: string,
  apiKey: string,
  numberOfImages: number,
  aspectRatio: string
): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio as any,
      },
    });

    if (!response.generatedImages) {
        return [];
    }

    return response.generatedImages
        .map(img => img.image?.imageBytes)
        .filter((bytes): bytes is string => !!bytes);
        
  } catch (error) {
    console.error("Error calling Imagen API:", error);
    throw error;
  }
};
