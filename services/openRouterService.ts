
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
- **NETLIFY CONFIG**: You MUST generate a \`public/_redirects\` file with the content \`/* /index.html 200\` to ensure client-side routing works on Netlify.

- **CRITICAL FOR DEPLOYMENT (WHITE SCREEN FIX)**:
  - In \`index.html\`, ensure you have \`<div id="root"></div>\`.
  - The script tag MUST use an absolute path starting with slash: \`<script type="module" src="/src/main.tsx"></script>\`. Do NOT use "./src/main.tsx" or "src/main.tsx".
  - In \`src/main.tsx\`, ensure you import React and ReactDOM properly and mount to the 'root' element with a null check: \`ReactDOM.createRoot(document.getElementById('root')!).render(...)\`.

- **IMPORTANT: ARCHITECTURE FOR FULL-STACK APPS**:
  - You are generating a Client-Side Single Page Application (SPA) that runs in a browser preview.
  - **DO NOT** generate a separate Node.js/Express backend (e.g., \`server.js\`) because it cannot run in the browser preview environment.
  - Instead, use **Supabase** as your Backend-as-a-Service (BaaS) for database, authentication, and realtime features.
  - If the user asks for a database, login, persistence, or "fullstack" features:
    1.  **Services File**: Create a file named \`services/supabase.ts\`. This file must initialize the Supabase client using environment variables:
        \`\`\`typescript
        import { createClient } from '@supabase/supabase-js';
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
        export const supabase = createClient(supabaseUrl, supabaseKey);
        \`\`\`
    2.  **Environment Variables**: In your JSON response, you MUST include \`SUPABASE_URL\` and \`SUPABASE_ANON_KEY\` in the \`environmentVariables\` object.
    3.  **Database Setup**: In the \`supabaseAdminAction\` field of your JSON response, provide the exact SQL query to create the necessary tables.
    4.  **User Instructions**: In the \`message\` field, explicitly tell the user to connect their Supabase account in the "Integrations" menu to make the app work.
    5.  **Frontend Logic**: Write React components that import \`supabase\` from \`../services/supabase\` and interact with the database directly.

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

export const generateCodeStreamWithOpenRouter = async (
  prompt: string,
  existingFiles: ProjectFile[],
  envVars: Record<string, string>,
  onChunk: (chunk: string) => void,
  apiKey: string,
  model: string,
  signal?: AbortSignal
): Promise<string> => {
  const systemPrompt = getSystemPrompt(existingFiles, envVars);
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      credentials: 'omit', // Fix for "No cookie auth credentials found" error
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': `https://codegen.studio`, // Recommended by OpenRouter
        'X-Title': `Codegen Studio`, // Recommended by OpenRouter
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        top_p: 0.9,
        response_format: { type: "json_object" },
        stream: true,
      }),
      signal: signal
    });

    if (!response.ok) {
      // Try to read error body if possible
      let errorText = "";
      try {
          errorText = await response.text();
      } catch (e) {
          errorText = response.statusText;
      }
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) errorMessage = errorJson.error.message;
      } catch (e) {
          // Use text if JSON parse fails
          if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }
    
    if (!response.body) throw new Error("Response body is empty");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // The response is a server-sent event stream
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6);
          if (dataStr === '[DONE]') {
            break;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              const contentChunk = data.choices[0].delta.content;
              fullResponse += contentChunk;
              onChunk(contentChunk);
            }
          } catch (e) {
            console.error('Error parsing stream data chunk:', line, e);
          }
        }
      }
    }
    
    return fullResponse;

  } catch (error: any) {
    if (error.name === 'AbortError') {
        return JSON.stringify({ message: "Gerando interrompido." });
    }
    console.error("Error generating code with OpenRouter:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorJson = JSON.stringify({
        message: `Erro no OpenRouter: ${errorMessage}. Verifique sua chave de API ou conexão.`,
        files: existingFiles
    });
    // Don't call onChunk here as it's handled in App.tsx
    return errorJson;
  }
};
