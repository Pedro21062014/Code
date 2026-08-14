
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
          envString = `Environment variables available via 'process.env.VARIABLE_NAME' (Note: purely client-side variables in JS): \n${JSON.stringify(envVars, null, 2)}`;
      } catch (e) {
          envString = "Error serializing environment variables.";
      }
  }

  return `You are an expert senior full-stack engineer. Generate complete, functional web applications using React, Vite, and tailwindcss.

- **TECHNOLOGY STACK**:
  - **Framework**: React with Vite. Use functional components and hooks.
  - **Styles**: Tailwind CSS. (Generate the necessary tailwind.config.js and postcss.config.js, or use standard configurations).
  - **Language**: TypeScript or modern JavaScript.
  - **Environment**: Your code runs in an in-browser Node runtime (WebContainer/Navebox). You MUST generate all core configuration files like package.json, vite.config.ts, etc.

- **FILE STRUCTURE**:
  - \`index.html\`: The HTML entry point referencing \`/src/main.tsx\`.
  - \`package.json\`: Must include necessary dependencies like \`react\`, \`react-dom\`, \`vite\`, \`@vitejs/plugin-react\`, \`tailwindcss\`, etc., and standard scripts ("dev": "vite").
  - \`vite.config.ts\`: Standard Vite configuration.
  - \`src/main.tsx\`: React entry point.
  - \`src/App.tsx\`: Root application component.

- **TERMINAL EXECUTION**:
  - Your code runs in an in-browser Node environment. The user sees a real terminal that runs the development server automatically and shows a live preview URL.
  - If you need to install specific packages or run custom shell commands, you can include them in an array called "terminalCommands" inside your JSON response. Those commands will be executed one by one in the in-browser environment.
  - Use a dev server on a fixed port (e.g. npm run dev -- --port 3000). For Next.js projects, use next dev on port 3000. If you want a static site, use a static server (e.g. npx --yes serve -l 3000).

- **GOAL**: Respond with a valid JSON object containing:
  - "message" (string): Friendly response to the user.
  - "files" (array of objects): { "name": string, "language": string, "content": string }. Paths must be relative to project root (e.g., "src/components/Button.tsx").
  - "terminalCommands" (array of strings, optional): Shell commands to execute (e.g., ["npm install react-router-dom", "npm run dev"]).
  - "summary" (string, optional).

- **LATENCY**: Be concise. Only generate/update necessary files.

- **IMPORTANT**: Return ONLY valid JSON. Your response must parse directly to JSON.

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
  attachments?: { data: string; mimeType: string }[],
  signal?: AbortSignal,
  onMetadata?: (metadata: any) => void
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
            responseMimeType: 'application/json',
        },
    });

    let fullResponse = "";
    for await (const chunk of response) {
      if (signal?.aborted) {
          throw new Error("AbortError");
      }
      // Fix: response.text is a property, not a method. Access directly.
      const chunkText = chunk.text;
      if (chunkText) {
          fullResponse += chunkText;
          onChunk(chunkText);
      }
      
      // Handle metadata
      if (onMetadata && chunk.candidates?.[0]?.groundingMetadata) {
          onMetadata(chunk.candidates[0].groundingMetadata);
      }
    }
    
    return fullResponse;

  } catch (error: any) {
    if (error.message === "AbortError" || error.name === "AbortError") {
       return JSON.stringify({ message: "Geração interrompida." });
    }
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
