import { GoogleGenAI, Type } from "@google/genai";
import { ProjectFile } from '../types';

const fileContentToString = (files: ProjectFile[]): string => {
  if (files.length === 0) {
    return "Nenhum arquivo existe ainda.";
  }
  return files.map(file => 
    ` --- FILE: ${file.name} --- \`\`\`${file.language} ${file.content} \`\`\` `
  ).join('\n');
};

const getSystemPrompt = (files: ProjectFile[]): string => 
  `You are an expert senior full-stack engineer specializing in creating complete, functional, and aesthetically pleasing web applications.
- Your primary goal is to generate all necessary code files based on the user's prompt. You are proficient in a wide range of web technologies including HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte, Node.js, and more.
- Always generate complete, runnable code. Do not use placeholders like "// your code here".
- For standard web projects, create an 'index.html', a CSS file for styles (e.g., 'style.css'), and a JavaScript file for logic (e.g., 'script.js').
- For React projects, use functional components, TypeScript (.tsx), and hooks.
- For styling, you can use Tailwind CSS via CDN in index.html or generate separate CSS files, whichever is more appropriate for the user's request.
- The file structure should be logical (e.g., components/, services/, assets/).
- If a 'services/supabase.ts' file exists, it means the project is integrated with Supabase. Use the exported Supabase client from that file for any data-related tasks. Do not re-initialize the client.
- Respond with a JSON object that strictly adheres to the provided schema. The JSON object must contain two keys: "message" (a friendly, conversational message to the user, in Portuguese) and "files" (an array of file objects). Each file object must have "name", "language", and "content".
Current project files: ${fileContentToString(files)}`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    message: { type: Type.STRING },
    files: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          language: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ["name", "language", "content"],
      },
    },
  },
  required: ["message", "files"],
};

export const generateCodeStreamWithGemini = async (
  prompt: string,
  existingFiles: ProjectFile[],
  onChunk: (chunk: string) => void,
  modelId: string = "gemini-2.5-flash"
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const stream = await ai.models.generateContentStream({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: getSystemPrompt(existingFiles),
        temperature: 0.1,
        topP: 0.9,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
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
    console.error("Error generating code with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorJson = JSON.stringify({
        message: `Ocorreu um erro: ${errorMessage}. Por favor, verifique o console para mais detalhes.`,
        files: existingFiles
    });
    onChunk(errorJson); // Send the error as a chunk to update the UI
    return errorJson;
  }
};