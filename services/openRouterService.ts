
import { ProjectFile } from '../types';

const getSystemPrompt = (files: ProjectFile[], envVars: Record<string, string>): string => {
  const fileContent = files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');

  const envContent = Object.keys(envVars).length > 0
    ? `The following environment variables are available to the project via 'process.env.VARIABLE_NAME' (client-side simulation): \n${JSON.stringify(envVars, null, 2)}`
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

- **GOAL**: Respond with a valid JSON object containing "message", "files" (array with "name", "language", "content"), and optionally "summary".
- **IMPORTANT**: Return ONLY valid JSON. Do not add markdown code blocks. The response should start with { and end with }.

Current project files:
${fileContent || "Nenhum arquivo existe ainda."}

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
      signal: signal,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    if (!response.body) throw new Error("Response body is empty");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
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
                    // Ignore parsing errors for partial chunks
                }
            }
        }
    }
    return fullResponse;

  } catch (error: any) {
    if (error.name === 'AbortError') return "";
    console.error("Error generating code with OpenRouter:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorJson = JSON.stringify({
        message: `Ocorreu um erro: ${errorMessage}. Por favor, verifique sua chave OpenRouter.`,
        files: existingFiles
    });
    onChunk(errorJson);
    return errorJson;
  }
};
