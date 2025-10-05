// --- Helper function to create the system prompt ---
const getSystemPrompt = (files, envVars = {}) => {
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
- If a 'services/supabase.ts' file exists, it means the project is integrated with Supabase. You have the ability to execute SQL queries on the user's Supabase database.
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

// --- API Handlers for each provider ---

async function handleOpenAI(body, apiKey) {
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

async function handleDeepSeek(body, apiKey) {
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

// Note: The direct Gemini streaming proxy is no longer used by the frontend,
// but is kept here for potential future use or as a reference.
// The frontend now uses the @google/genai SDK directly.

// --- Main Request Handler for Netlify ---

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { provider } = body;
    let providerResponse;

    const API_KEYS = {
      OpenAI: process.env.OPENAI_API_KEY,
      DeepSeek: process.env.DEEPSEEK_API_KEY,
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
      default:
        return new Response(JSON.stringify({ error: `Provedor não suportado: ${provider}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!providerResponse.ok) {
        const errorBody = await providerResponse.text();
        console.error(`Error from ${provider}:`, errorBody);
        return new Response(`Erro da API ${provider}: ${errorBody}`, { status: providerResponse.status });
    }

    // Stream the response back to the client
    return new Response(providerResponse.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Erro no proxy de backend:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const config = {
  path: "/api/generate",
};