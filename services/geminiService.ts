import { GoogleGenAI, Type } from "@google/genai";
import { ProjectFile } from '../types';

const fileContentToString = (files: ProjectFile[]): string => {
  if (files.length === 0) {
    return "No files exist yet.";
  }
  return files.map(file => 
    ` --- FILE: ${file.name} --- \`\`\`${file.language} ${file.content} \`\`\` `
  ).join('\n');
};

const getSystemPrompt = (files: ProjectFile[]): string => 
  `You are an expert senior frontend React engineer specializing in creating complete, functional, and aesthetically pleasing web applications with React and Tailwind CSS.
- Your primary goal is to generate all necessary code files based on the user's prompt.
- Always generate complete, runnable code. Do not use placeholders like "// your code here".
- For React, use functional components, TypeScript (.tsx), and hooks.
- For styling, ONLY use Tailwind CSS. Do not generate CSS files or use inline styles. Load Tailwind via CDN in index.html.
- The entire project must be a single-page application contained within the generated files.
- The file structure should be logical (e.g., components/, services/).
- Always include an 'index.html', 'index.tsx', and 'App.tsx'.
- Respond with a JSON object that strictly adheres to the provided schema. The JSON object must contain two keys: "message" (a friendly, conversational message to the user) and "files" (an array of file objects). Each file object must have "name", "language", and "content".
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

export const generateCodeWithGemini = async (
  prompt: string,
  existingFiles: ProjectFile[],
  modelId: string = "gemini-1.5-pro"
): Promise<{ message: string; files: ProjectFile[] }> => {
  try {
    // Chave de API embutida (⚠️ Não recomendado para produção)
    const ai = new GoogleGenAI({ apiKey: "AIzaSyA4C9RxEGOKf2HTZkJ_NmFkVV6yfAstVwg" });

    const response = await ai.models.generateContent({
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

    const text = response.text;
    const parsed = JSON.parse(text);

    if (parsed.files && Array.isArray(parsed.files)) {
      return {
        message: parsed.message || "Here are the files for your project.",
        files: parsed.files,
      };
    } else {
      throw new Error("Invalid JSON structure received from the API.");
    }
  } catch (error) {
    console.error("Error generating code with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      message: `I ran into an error: ${errorMessage}. Please check the console for details.`,
      files: existingFiles,
    };
  }
};