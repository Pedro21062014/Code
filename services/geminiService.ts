
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
- **STRUCTURE & ORGANIZATION**:
  - Organise your code into a professional folder structure.
  - Core files in root: \`index.html\`, \`package.json\`, \`vite.config.ts\`, \`tsconfig.json\`, \`tailwind.config.js\`.
  - Source code MUST be in \`src/\`.
  - Components in \`src/components/\`.
  - Styles in \`src/styles/\`.
  - Hooks in \`src/hooks/\`.
  - Utils/Services in \`src/lib/\` or \`src/services/\`.
  - Assets in \`public/\`.
  - **IMPORTANT**: Every file in the "files" array must have a full relative path (e.g., "src/components/Navbar.tsx").

- **ARCHITECTURE (NODE.JS + VITE)**:
  - You are running in a **WebContainer** environment.
  - You MUST generate a \`package.json\` with \`vite\` as a dependency and scripts: \`"dev": "vite"\`.
  - Typical dependencies: \`react\`, \`react-dom\`, \`lucide-react\`, \`react-router-dom\`, \`framer-motion\`, \`clsx\`, \`tailwind-merge\`.
  - Place your React entry point at \`src/main.tsx\`.
  - The \`index.html\` must point to \`/src/main.tsx\`.

- **GOAL**: Respond with a valid JSON object containing "message", "files" (array with "name", "language", "content"), and optionally "summary", "environmentVariables".
- **LATENCY**: Be concise. Only generate/update necessary files. No placeholders.
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
    // Note: guidelines suggest process.env.API_KEY, but we support the provided apiKey as fallback
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || apiKey });
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

    const response = await ai.models.generateContentStream({
        model: modelId,
        contents: { parts: userParts },
        config: {
            systemInstruction,
            temperature: 0.2,
        },
    });

    let fullResponse = "";
    for await (const chunk of response) {
      // Fix: response.text is a property, not a method. Access directly.
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
    return JSON.stringify({
        message: `Ocorreu um erro ao chamar a API do Gemini: ${errorMessage}.`
    });
  }
};

export const generateProjectName = async (prompt: string, apiKey: string): Promise<string> => {
   try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || apiKey });
    const namePrompt = `Gere um nome de projeto em PascalCase (ex: QuantumQuill) para: "${prompt}". Apenas o nome.`;
    /* Using gemini-3-flash-preview for basic text task as per guidelines */
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: namePrompt,
    });
    // Fix: response.text is a property. Access directly.
    return response.text?.trim().replace(/[^a-zA-Z0-9]/g, '') || "NovoProjeto";
  } catch (error) {
    return "NovoProjeto";
  }
};

export const generateImagesWithImagen = async (prompt: string, apiKey: string, numberOfImages: number, aspectRatio: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || apiKey });
    /* Switch to gemini-2.5-flash-image (default for image gen) using generateContent as per SDK rules */
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
      },
    });

    const images: string[] = [];
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        // Find the image part in the response as per guidelines
        if (part.inlineData && part.inlineData.data) {
          images.push(part.inlineData.data);
        }
      }
    }
    return images;
  } catch (error) {
    throw error;
  }
};
