// --- Helper function to create the system prompt ---
const getSystemPrompt = (files) => `You are an expert senior full-stack engineer specializing in creating complete, functional, and aesthetically pleasing web applications.
- Your primary goal is to generate all necessary code files based on the user's prompt. You are proficient in a wide range of web technologies including HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte, Node.js, and more.
- Always generate complete, runnable code. Do not use placeholders like "// your code here".
- For standard web projects, create an 'index.html', a CSS file for styles (e.g., 'style.css'), and a JavaScript file for logic (e.g., 'script.js').
- For React projects, use functional components, TypeScript (.tsx), and hooks.
- For styling, you can use Tailwind CSS via CDN in index.html or generate separate CSS files, whichever is more appropriate for the user's request.
- The file structure should be logical (e.g., components/, services/, assets/).
- If a 'services/supabase.ts' file exists, it means the project is integrated with Supabase. Use the exported Supabase client from that file for any data-related tasks. Do not re-initialize the client.
- You MUST respond with a single, valid JSON object and nothing else. Do not wrap the JSON in markdown backticks or any other text. The JSON object must contain three keys: "message" (a friendly, conversational message to the user, in Portuguese), "summary" (a markdown string summarizing the files created or updated, for example a table with columns for "Arquivo" and "Status" which can be "Criado" or "Modificado"), and "files" (an array of file objects). Each file object must have "name", "language", and "content".

Current project files:
${files.map(file => `--- FILE: ${file.name} ---\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n`).join('')}
`;

// --- API Handlers for each provider ---

async function handleOpenAI(body, apiKey) {
  const { model, prompt, existingFiles } = body;
  const systemPrompt = getSystemPrompt(existingFiles);
  
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
    const { model, prompt, existingFiles } = body;
    const systemPrompt = getSystemPrompt(existingFiles);
    
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

async function handleGemini(body, apiKey) {
    const { model, prompt, existingFiles } = body;
    const systemInstruction = getSystemPrompt(existingFiles);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
                temperature: 0.1,
                topP: 0.9,
                responseMimeType: "application/json",
            }
        }),
    });

    if (!response.body) {
        throw new Error("Empty response body from Gemini API");
    }

    // Gemini uses SSE, which is slightly different from a raw stream.
    // We need to parse it and forward only the content.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
        async start(controller) {
            function push() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        controller.close();
                        return;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    // SSE format is `data: {...}\n\n`. We need to extract the JSON part.
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.substring(6);
                            try {
                                const parsed = JSON.parse(jsonStr);
                                if (parsed.candidates && parsed.candidates[0].content.parts[0].text) {
                                    const text = parsed.candidates[0].content.parts[0].text;
                                    controller.enqueue(new TextEncoder().encode(text));
                                }
                            } catch (e) {
                                // Incomplete JSON, just ignore and wait for next chunk
                            }
                        }
                    }
                    push();
                });
            }
            push();
        }
    });

    return new Response(stream, { headers: response.headers });
}


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
      Gemini: process.env.GEMINI_API_KEY,
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
      case 'Gemini':
        if (!API_KEYS.Gemini) throw new Error("A chave de API do Gemini não está configurada no servidor.");
        providerResponse = await handleGemini(body, API_KEYS.Gemini);
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