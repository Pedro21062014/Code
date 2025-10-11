import { GoogleGenAI } from "@google/genai";
import { ProjectFile } from '../types';

const getSystemPrompt = (files: ProjectFile[], envVars: Record<string, string>): string => {
  const fileContent = files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');

  const envContent = Object.keys(envVars).length > 0
    ? `The following environment variables are available to the project via 'process.env.VARIABLE_NAME':\n${JSON.stringify(envVars, null, 2)}`
    : "No environment variables are currently set.";

  return `You are an expert senior full-stack engineer specializing in creating complete, functional, and aesthetically pleasing web applications.
- Your primary goal is to generate all necessary code files based on the user's prompt. You are proficient in a wide range of web technologies including HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte, Node.js, and more.
- Always generate complete, runnable code. Do not use placeholders like "// your code here".
- For standard web projects, create an 'index.html', a CSS file for styles (e.g., 'style.css'), and a JavaScript file for logic (e.g., 'script.js').
- For React projects, use functional components, TypeScript (.tsx), and hooks.
- For styling, you can use Tailwind CSS via CDN in index.html or generate separate CSS files, whichever is more appropriate for the user's request.
- The file structure should be logical (e.g., components/, services/, assets/).
- If a 'services/supabase.ts' file exists, it means the project is integrated with Supabase. You have the ability to execute SQL queries on the user's Supabase database.
- SPECIAL COMMAND: If the user's prompt includes the word "ia" (Portuguese for "AI"), you must integrate a client-side Gemini AI feature into the project. To do this:
  - 1. Create a new file 'services/gemini.ts'. This file should initialize the GoogleGenAI client and export a function to call the Gemini model.
  - 2. The API key for this service MUST be read from an environment variable named 'GEMINI_API_KEY' (e.g., 'process.env.GEMINI_API_KEY').
  - 3. In your JSON response, you MUST include the 'environmentVariables' field and create a key named 'GEMINI_API_KEY'. Set its value to an empty string (e.g., "GEMINI_API_KEY": ""). The application will automatically populate it with the user's key.
  - 4. Update the application's UI and logic files to import and use the new Gemini service, creating the AI feature requested by the user.
- INTEGRATION - STRIPE: If the user asks to add payments or mentions Stripe, integrate it.
  - 1. Add 'https://js.stripe.com/v3/' script tag to index.html.
  - 2. Create a component to handle the checkout flow using Stripe.js.
  - 3. You MUST include 'STRIPE_PUBLIC_KEY' and 'STRIPE_SECRET_KEY' in the 'environmentVariables' field of your JSON response. The application will automatically populate them from user settings. Use 'process.env.STRIPE_PUBLIC_KEY' in the frontend code.
- INTEGRATION - NEON DB: If the user asks for a backend with a database or mentions Neon, you can use it.
  - 1. Explain that you will generate placeholder backend code that uses a PostgreSQL database.
  - 2. You MUST include 'NEON_CONNECTION_STRING' in the 'environmentVariables' field of your JSON response. The application will populate it.
  - 3. Generate example backend code (e.g., a simple Express server as a file) that uses a library like 'pg' to connect to the database using 'process.env.NEON_CONNECTION_STRING'.
- INTEGRATION - MAPS: If the user asks for a map, integrate OpenStreetMap using the Leaflet.js library.
  - 1. Add Leaflet CSS and JS links to index.html.
  - 2. Create a component that initializes a map centered on a default location.
- IMPORTANT: You MUST begin your response with a short, single-line "thought" process message explaining what you are about to do, in Portuguese. For example: "Entendido. Criando um aplicativo de lista de tarefas com React e Tailwind." After this line, you MUST add a separator '---' on a new line. Then, begin the main JSON response.
- You MUST respond with a single, valid JSON object and nothing else. Do not wrap the JSON in markdown backticks or any other text. The JSON object must contain the "message" and "files" keys, and can optionally contain "summary", "environmentVariables", and "supabaseAdminAction".
  - "message": (string) A friendly, conversational message to the user, in Portuguese.
  - "files": (array) An array of file objects. Each file object must have "name", "language", and "content".
  - "summary": (string, optional) A markdown string summarizing the files created or updated.
  - "environmentVariables": (object, optional) An object of environment variables to set. To delete a variable, set its value to null.
  - "supabaseAdminAction": (object, optional) To execute a database modification (e.g., create a table), provide an object with a "query" key containing the SQL statement to execute. Example: { "query": "CREATE TABLE posts (id bigint primary key, title text);" }. Use this ONLY for database schema or data manipulation.

Current project files:
${fileContent.length > 0 ? fileContent : "Nenhum arquivo existe ainda."}

${envContent}
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
        // FIX: Removed `role: 'user'` from contents to align with the recommended format for single-turn, multi-part requests.
        contents: { parts: userParts },
        config: {
            systemInstruction,
            // Instructing for a plain text response as we will parse the thought and JSON manually
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
    return response.generatedImages.map(img => img.image.imageBytes);
  } catch (error) {
    console.error("Error calling Imagen API:", error);
    throw error;
  }
};
