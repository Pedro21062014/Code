
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
- **NETLIFY DEPLOYMENT CONFIG**: You MUST generate a \`public/_redirects\` file with the content \`/* /index.html 200\` to ensure client-side routing works correctly after deployment.

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

- SPECIAL COMMAND: If the user's prompt includes the word "ia" (Portuguese for "AI"), you must integrate a client-side Gemini AI feature into the project. To do this:
  - 1. Create a new file 'services/gemini.ts'. This file should initialize the GoogleGenAI client and export a function to call the Gemini model.
  - 2. The API key for this service MUST be read from an environment variable named 'GEMINI_API_KEY' (e.g., 'process.env.GEMINI_API_KEY').
  - 3. In your JSON response, you MUST include the 'environmentVariables' field and create a key named 'GEMINI_API_KEY'. Set its value to an empty string (e.g., "GEMINI_API_KEY": ""). The application will automatically populate it with the user's key.
  - 4. Update the application's UI and logic files to import and use the new Gemini service, creating the AI feature requested by the user.
- You MUST respond with a single, valid JSON object and nothing else. Do not wrap the JSON in markdown backticks or any other text. The JSON object must contain the "message" and "files" keys, and can optionally contain "summary", "environmentVariables", and "supabaseAdminAction".
  - "message": (string) A friendly, conversational message to the user, in Portuguese.
  - "files": (array) An array of file objects. Each file object must have "name", "language", and "content".
  - "summary": (string, optional) A markdown string summarizing the files created or updated.
  - "environmentVariables": (object, optional) An object of environment variables to set. To delete a variable, set its value to null.
  - "supabaseAdminAction": (object, optional) To execute a database modification (e.g., create a table), provide an object with a "query" key containing the SQL statement to execute. Example: { "query": "CREATE TABLE posts (id bigint primary key, title text);" }. Use this ONLY for database schema or data manipulation.

Current project files:
${fileContent || "Nenhum arquivo existe ainda."}

${envContent}
`;
};

async function handleOpenAI(body: any, apiKey: string) {
  const { model, prompt, existingFiles, envVars } = body;
  const systemPrompt = getSystemPrompt(existingFiles, envVars);
  
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
  });
}

async function handleDeepSeek(body: any, apiKey: string) {
    const { model, prompt, existingFiles, envVars } = body;
    const systemPrompt = getSystemPrompt(existingFiles, envVars);
    
    return fetch("https://api.deepseek.com/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
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
    });
}

async function handleOpenRouter(body: any, apiKey: string) {
    const { model, prompt, existingFiles, envVars } = body;
    const systemPrompt = getSystemPrompt(existingFiles, envVars);
    
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            temperature: 0.1,
            top_p: 0.9,
            response_format: { type: "json_object" },
            stream: true,
        }),
    });
}

export const onRequestPost = async (context: any) => {
  try {
    const req = context.request;
    const body = await req.json();
    const { provider } = body;
    let providerResponse;

    // Acessar variáveis de ambiente via context.env
    const API_KEYS = {
      OpenAI: context.env.OPENAI_API_KEY,
      DeepSeek: context.env.DEEPSEEK_API_KEY,
      OpenRouter: context.env.OPENROUTER_API_KEY,
    };

    switch (provider) {
      case 'OpenAI':
        if (!API_KEYS.OpenAI) throw new Error("A chave de API da OpenAI não está configurada no servidor.");
        providerResponse = await handleOpenAI(body, API_KEYS.OpenAI);
        break;
      case 'DeepSeek':
        if (!API_KEYS.DeepSeek) throw new Error("A chave de API do DeepSeek não está configurada no servidor.");
        providerResponse = await handleDeepSeek(body, API_KEYS.DeepSeek);
        break;
      case 'OpenRouter':
        if (!API_KEYS.OpenRouter) throw new Error("A chave de API do OpenRouter não está configurada no servidor.");
        providerResponse = await handleOpenRouter(body, API_KEYS.OpenRouter);
        break;
      default:
        return new Response(JSON.stringify({ error: `Provedor não suportado: ${provider}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!providerResponse.ok) {
        const errorBody = await providerResponse.text();
        console.error(`Error from ${provider}:`, errorBody);
        return new Response(`Erro da API ${provider}: ${errorBody}`, { status: providerResponse.status });
    }

    return new Response(providerResponse.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: any) {
    console.error('Erro no proxy de backend:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
