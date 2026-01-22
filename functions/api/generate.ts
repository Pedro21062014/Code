
// Cloudflare Pages Function
// Path: /api/generate

const getSystemPrompt = (files: any[], envVars = {}) => {
  const fileContent = files.map(file => `--- FILE: ${file.name} ---\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n`).join('');
  
  const envContent = Object.keys(envVars).length > 0
    ? `The following environment variables are available to the project via 'process.env.VARIABLE_NAME':\n${JSON.stringify(envVars, null, 2)}`
    : "No environment variables are currently set.";

  return `You are an expert senior frontend engineer. Generate complete, functional, and aesthetically pleasing web applications using standard HTML, CSS, and JavaScript.

- **TECHNOLOGY STACK**:
  - **HTML5**: Semantic structure. Entry point MUST be \`index.html\`.
  - **CSS3**: Modern styling. Use Flexbox/Grid. You MAY use Tailwind CSS via CDN if requested (<script src="https://cdn.tailwindcss.com"></script>), otherwise write standard CSS in \`style.css\`.
  - **JavaScript (ES6+)**: Modern logic in \`script.js\`. Use \`document.querySelector\`, \`addEventListener\`, etc.
  - **NO FRAMEWORKS**: Do NOT use React, Vue, Angular, Svelte, or TypeScript.
  - **NO BUILD TOOLS**: Do NOT generate \`package.json\`, \`vite.config.ts\`, or \`npm install\` commands. This is a static site.

- **FILE STRUCTURE**:
  - \`index.html\`: The main file. Must link CSS (\`<link rel="stylesheet" href="style.css">\`) and JS (\`<script src="script.js" defer></script>\`).
  - \`style.css\`: All custom styles.
  - \`script.js\`: All application logic.

- **CRITICAL FOR DEPLOYMENT**:
  - Ensure \`index.html\` is in the root.
  - Generate a \`netlify.toml\` file in the root for correct routing. Content:
     \`\`\`toml
     [build]
       publish = "."
       command = "# no build command needed for static"
     
     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     \`\`\`

- **IMPORTANT**:
  - You are generating a Static Site that runs in a browser preview.
  - **DO NOT** generate a separate Node.js/Express backend (e.g., \`server.js\`).
  - If the user asks for a database, login, persistence, or "fullstack" features, use **Supabase** via \`@supabase/supabase-js\` CDN link in index.html.

- **GOAL**: Respond with a valid JSON object containing "message", "files" (array with "name", "language", "content"), and optionally "summary".
- **IMPORTANT**: Return ONLY valid JSON. Do not add markdown code blocks. The response should start with { and end with }.

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
