import { GoogleGenAI } from "@google/genai";
import { ProjectFile } from '../types';

const getSystemPrompt = (files: ProjectFile[], envVars: Record<string, string>): string => {
  const fileContent = files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');

  // Safely stringify envVars
  let envString = "No environment variables are currently set.";
  if (Object.keys(envVars).length > 0) {
      try {
          envString = `The following environment variables are available to the project via 'process.env.VARIABLE_NAME':\n${JSON.stringify(envVars, null, 2)}`;
      } catch (e) {
          envString = "Error serializing environment variables.";
      }
  }

  return `You are an expert senior full-stack engineer specializing in creating complete, functional, and aesthetically pleasing web applications.
- Your primary goal is to generate all necessary code files based on the user's prompt. You are proficient in a wide range of web technologies including HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte, Node.js, and more.
- Always generate complete, runnable code. Do not use placeholders like "// your code here".
- For standard web projects, create an 'index.html', a CSS file for styles (e.g., 'style.css'), and a JavaScript file for logic (e.g., 'script.js').
- For React projects, use functional components, TypeScript (.tsx), and hooks.
- For styling, you can use Tailwind CSS via CDN in index.html or generate separate CSS files, whichever is more appropriate for the user's request.
- The file structure should be logical (e.g., components/, services/, assets/).

- **IMPORTANT: ARCHITECTURE FOR FULL-STACK APPS**:
  - You are generating a Client-Side Single Page Application (SPA) that runs in a browser preview.
  - **DO NOT** generate a separate Node.js/Express backend (e.g., \`server.js\`, \`routes.js\`) because it cannot run in the browser preview environment.
  - Instead, use **Supabase** as your Backend-as-a-Service (BaaS) for database, authentication, and realtime features.
  - If the user asks for a database, login, persistence, or "fullstack" features:
    1.  **Services File**: Create a file named \`services/supabase.ts\`. This file must initialize the Supabase client using environment variables:
        \`\`\`typescript
        import { createClient } from '@supabase/supabase-js';
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
        export const supabase = createClient(supabaseUrl, supabaseKey);
        \`\`\`
    2.  **Environment Variables**: In your JSON response, you MUST include \`SUPABASE_URL\` and \`SUPABASE_ANON_KEY\` in the \`environmentVariables\` object (set them to empty strings if not provided in the prompt context).
    3.  **Database Setup**: In the \`supabaseAdminAction\` field of your JSON response, provide the exact SQL query to create the necessary tables. (e.g., \`CREATE TABLE IF NOT EXISTS todos (id bigint primary key generated always as identity, task text, is_complete boolean); make sure to enable RLS policies if needed\`).
    4.  **User Instructions**: In the \`message\` field, explicitely tell the user: "Para que o banco de dados funcione, vá em 'Integrations > Supabase' no menu lateral e conecte sua conta/projeto."
    5.  **Frontend Logic**: Write React components that import \`supabase\` from \`../services/supabase\` and use methods like \`.from('table').select()\`, \`.insert()\`, etc.

- SPECIAL COMMAND: If the user's prompt includes the word "ia" (Portuguese for "AI"), you must integrate a client-side Gemini AI feature into the project. To do this:
  - 1. Create a new file 'services/gemini.ts'. This file should initialize the GoogleGenAI client and export a function to call the Gemini model.
  - 2. The API key for this service MUST be read from an environment variable named 'GEMINI_API_KEY' (e.g., 'process.env.GEMINI_API_KEY').
  - 3. In your JSON response, you MUST include the 'environmentVariables' field and create a key named 'GEMINI_API_KEY'. Set its value to an empty string.
  
- INTEGRATION - STRIPE: If the user asks to add payments or mentions Stripe, integrate it.
  - 1. Add 'https://js.stripe.com/v3/' script tag to index.html.
  - 2. Create a component to handle the checkout flow using Stripe.js.
  - 3. Include 'STRIPE_PUBLIC_KEY' and 'STRIPE_SECRET_KEY' in the 'environmentVariables' field.

- INTEGRATION - MAPS: If the user asks for a map, integrate OpenStreetMap using the Leaflet.js library (via CDN in index.html).

- IMPORTANT: You MUST begin your response with a short, single-line "thought" process message explaining what you are about to do, in Portuguese. For example: "Entendido. Criando um aplicativo de lista de tarefas com React e Tailwind." After this line, you MUST add a separator '---' on a new line. Then, begin the main JSON response.
- You MUST respond with a single, valid JSON object and nothing else. Do not wrap the JSON in markdown backticks or any other text. The JSON object must contain the "message" and "files" keys, and can optionally contain "summary", "environmentVariables", and "supabaseAdminAction".
  - "message": (string) A friendly, conversational message to the user, in Portuguese.
  - "files": (array) An array of file objects. Each file object must have "name", "language", and "content".
  - "summary": (string, optional) A markdown string summarizing the files created or updated.
  - "environmentVariables": (object, optional) An object of environment variables to set.
  - "supabaseAdminAction": (object, optional) To execute a database modification, provide an object with a "query" key containing the SQL statement. Example: { "query": "CREATE TABLE posts (id bigint primary key, title text);" }.

Current project files:
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
    // IMPORTANT: Do NOT include existingFiles in the error JSON. 
    // It can contain circular references or be too large, causing JSON.stringify to fail.
    const errorJson = JSON.stringify({
        message: `Ocorreu um erro ao chamar a API do Gemini: ${errorMessage}. Por favor, verifique sua chave de API e a conexão com a internet.`
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

    // FIX: Safely access text with fallback
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

    // FIX: Ensure generatedImages exists and map safely
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