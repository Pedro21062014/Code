
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

  return `You are an expert senior frontend engineer. Generate complete, functional, and aesthetically pleasing web applications using standard HTML, CSS, and JavaScript.

- **TECHNOLOGY STACK**:
  - **HTML5**: Semantic structure. Entry point MUST be \`index.html\`.
  - **CSS3**: Modern styling. Use Flexbox/Grid. You MAY use Tailwind CSS via CDN if requested (<script src="https://cdn.tailwindcss.com"></script>), otherwise write standard CSS in \`style.css\`.
  - **JavaScript (ES6+)**: Modern logic in \`script.js\`. Use \`document.querySelector\`, \`addEventListener\`, etc.
  - **NO FRAMEWORKS**: Do NOT use React, Vue, Angular, Svelte, or TypeScript.
  - **NO BUILD TOOLS**: Do NOT generate \`package.json\`, \`vite.config.ts\`, or \`npm install\` commands. This is a static site.

- **FILE STRUCTURE**:
  - \`index.html\`: The main file. Must link CSS (\`<link rel="stylesheet" href="style.css">\`) and JS (\`<script src="script.js" defer></script>\`).
  - \`style.css\`: All custom styles.
  - \`script.js\`: All application logic.
  - Assets can be assumed to be external URLs or generated inline (base64) if strictly necessary, but prefer clean code.

- **CRITICAL FOR DEPLOYMENT**:
  - Ensure \`index.html\` is in the root.
  - Generate a \`netlify.toml\` file in the root for correct routing. Content:
     \`\`\`toml
     [build]
       publish = "."
       command = "# no build command needed for static"
     
     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     \`\`\`

- **GOAL**: Respond with a valid JSON object containing "message", "files" (array with "name", "language", "content"), and optionally "summary".
- **LATENCY**: Be concise. Only generate/update necessary files.
- **IMPORTANT**: Return ONLY valid JSON. Do not add markdown code blocks. The response should start with { and end with }.

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
