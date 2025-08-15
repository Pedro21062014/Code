import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ProjectFile } from '../types';

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

if (!ai) {
  console.warn("Gemini API key not found in environment variables. Gemini functionality will be disabled.");
}

const generationConfig = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      message: {
        type: Type.STRING,
        description: "A friendly, conversational message to the user explaining what you have created or if you have any questions."
      },
      files: {
        type: Type.ARRAY,
        description: "An array of file objects representing the complete project structure.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The full path of the file, e.g., 'index.html' or 'components/Button.tsx'."
            },
            language: {
              type: Type.STRING,
              description: "The programming language of the file, e.g., 'html', 'typescript', 'css'."
            },
            content: {
              type: Type.STRING,
              description: "The complete and unabridged content of the file."
            }
          },
          required: ["name", "language", "content"]
        }
      }
    },
    required: ["message", "files"]
  }
};

const fileContentToString = (files: ProjectFile[]): string => {
    if (files.length === 0) {
        return "No files exist yet.";
    }
    return files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');
}

export const generateCodeWithGemini = async (
  prompt: string,
  existingFiles: ProjectFile[]
): Promise<{ message: string; files: ProjectFile[] }> => {
  if (!ai) {
      return {
        message: "It looks like the Gemini API key isn't set up. I can't generate code right now. Please check your environment configuration.",
        files: existingFiles,
      };
  }

  const model = "gemini-2.5-flash";
  const systemInstruction = `You are an expert senior frontend React engineer specializing in creating complete, functional, and aesthetically pleasing web applications with React and Tailwind CSS.
  - Your primary goal is to generate all the necessary code files based on the user's prompt.
  - Always generate complete, runnable code. Do not use placeholders like "// your code here".
  - For React, use functional components, TypeScript (.tsx), and hooks.
  - For styling, ONLY use Tailwind CSS. Do not generate CSS files or use inline styles. Load Tailwind via CDN in the index.html.
  - The entire project should be a single-page application contained within the generated files.
  - The file structure should be logical (e.g., components/, services/).
  - Always include an 'index.html', 'index.tsx', and 'App.tsx'.
  - Respond with a JSON object that strictly adheres to the provided schema.
  
  Current project files:
  ${fileContentToString(existingFiles)}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            ...generationConfig,
            systemInstruction: systemInstruction,
            temperature: 0.1,
            topP: 0.9,
        }
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (parsed.files && Array.isArray(parsed.files)) {
      return {
        message: parsed.message || "Here are the files for your project.",
        files: parsed.files,
      };
    } else {
      throw new Error("Invalid JSON structure received from API.");
    }
  } catch (error) {
    console.error("Error generating code with Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      message: `I encountered an error: ${errorMessage}. Please check the console for details.`,
      files: existingFiles,
    };
  }
};