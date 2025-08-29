import { GoogleGenAI } from "@google/genai";
import { ProjectFile } from '../types';

const getSystemPrompt = (files: ProjectFile[]): string => {
  const fileContent = files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');

  return `You are an expert senior full-stack engineer specializing in creating complete, functional, and aesthetically pleasing web applications.
- Your primary goal is to generate all necessary code files based on the user's prompt. You are proficient in a wide range of web technologies including HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte, Node.js, and more.
- Always generate complete, runnable code. Do not use placeholders like "// your code here".
- For standard web projects, create an 'index.html', a CSS file for styles (e.g., 'style.css'), and a JavaScript file for logic (e.g., 'script.js').
- For React projects, use functional components, TypeScript (.tsx), and hooks.
- For styling, you can use Tailwind CSS via CDN in index.html or generate separate CSS files, whichever is more appropriate for the user's request.
- The file structure should be logical (e.g., components/, services/, assets/).
- If a 'services/supabase.ts' file exists, it means the project is integrated with Supabase. Use the exported Supabase client from that file for any data-related tasks. Do not re-initialize the client.
- You MUST respond with a single, valid JSON object and nothing else. Do not wrap the JSON in markdown backticks or any other text. The JSON object must contain three keys: "message" (a friendly, conversational message to the user, in Portuguese), "summary" (a markdown string summarizing the files created or updated, for example a table with columns for "Arquivo" and "Status" which can be "Criado" or "Modificado"), and "files" (an array of file objects). Each file object must have "name", "language", and "content".

Current project files:
${fileContent.length > 0 ? fileContent : "Nenhum arquivo existe ainda."}
`;
};


export const generateCodeStreamWithGemini = async (
  prompt: string,
  existingFiles: ProjectFile[],
  onChunk: (chunk: string) => void,
  modelId: string,
  apiKey: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = getSystemPrompt(existingFiles);

    const stream = await ai.models.generateContentStream({
        model: modelId,
        contents: { role: 'user', parts: [{ text: prompt }] },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
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
        message: `Ocorreu um erro ao chamar a API do Gemini: ${errorMessage}. Por favor, verifique sua chave de API e a conexão com a internet.`,
        files: existingFiles
    });
    // We don't call onChunk here because the final error is handled in App.tsx
    // onChunk(errorJson);
    return errorJson;
  }
};

export const generateProjectName = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
   try {
    const ai = new GoogleGenAI({ apiKey });
    const namePrompt = `Gere um nome de projeto criativo e curto de duas palavras (em PascalCase, sem espaços, como 'QuantumQuill') para o seguinte conceito: "${prompt}". Responda APENAS com o nome e nada mais.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: namePrompt
    });

    const projectName = response.text.trim().replace(/[^a-zA-Z0-9]/g, '');
    return projectName || "NovoProjeto";
  } catch (error) {
    console.error("Error generating project name:", error);
    return "NovoProjeto";
  }
};