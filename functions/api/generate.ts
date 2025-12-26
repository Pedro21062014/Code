
// Cloudflare Pages Function
// Path: /api/generate

const getSystemPrompt = (files: any[], envVars = {}) => {
  const fileContent = files.map(file => `--- FILE: ${file.name} ---\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n`).join('');
  
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
  - "supabaseAdminAction": (object, optional) To execute a database modification (e.g., create a table), provide an object with a "query" key containing the SQL statement to execute.

Current project files:
${fileContent || "Nenhum arquivo existe ainda."}

${envContent}
`;
};

export const onRequestPost = async (context: any) => {
  try {
    const apiKey = context.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return new Response(JSON.stringify({ 
            error: 'Variável de ambiente OPENROUTER_API_KEY não encontrada no servidor.' 
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const req = context.request;
    const body = await req.json();
    const { model, prompt, existingFiles, envVars } = body;
    
    const systemPrompt = getSystemPrompt(existingFiles, envVars);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://codegen.studio',
        'X-Title': 'Codegen Studio',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        top_p: 0.9,
        response_format: { type: "json_object" },
        stream: true,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `Erro OpenRouter: ${errorText}` }), { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Erro no proxy de backend:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
