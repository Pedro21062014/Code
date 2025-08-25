import { ProjectFile } from '../types';

const fileContentToString = (files: ProjectFile[]): string => {
  if (files.length === 0) {
    return "Nenhum arquivo existe ainda.";
  }
  return files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');
};

const getSystemPrompt = (files: ProjectFile[]): string => `You are an expert senior full-stack engineer specializing in creating complete, functional, and aesthetically pleasing web applications.
- Your primary goal is to generate all necessary code files based on the user's prompt. You are proficient in a wide range of web technologies including HTML, CSS, JavaScript, TypeScript, React, Vue, Svelte, Node.js, and more.
- Always generate complete, runnable code. Do not use placeholders like "// your code here".
- For standard web projects, create an 'index.html', a CSS file for styles (e.g., 'style.css'), and a JavaScript file for logic (e.g., 'script.js').
- For React projects, use functional components, TypeScript (.tsx), and hooks.
- For styling, you can use Tailwind CSS via CDN in index.html or generate separate CSS files, whichever is more appropriate for the user's request.
- The file structure should be logical (e.g., components/, services/, assets/).
- If a 'services/supabase.ts' file exists, it means the project is integrated with Supabase. Use the exported Supabase client from that file for any data-related tasks. Do not re-initialize the client.
- You MUST respond with a single, valid JSON object and nothing else. Do not wrap the JSON in markdown backticks or any other text. The JSON object must contain two keys: "message" (a friendly, conversational message to the user, in Portuguese) and "files" (an array of file objects). Each file object must have "name", "language", and "content".

Current project files:
${fileContentToString(files)}
`;

export const generateCodeStreamWithClaude = async (
  prompt: string,
  existingFiles: ProjectFile[],
  onChunk: (chunk: string) => void,
  apiKey: string,
  model: string
): Promise<string> => {
  const systemPrompt = getSystemPrompt(existingFiles);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
            const dataStr = line.substring(5).trim();
            try {
                const data = JSON.parse(dataStr);
                if (data.type === 'content_block_delta' && data.delta.type === 'text_delta') {
                    const contentChunk = data.delta.text;
                    fullResponse += contentChunk;
                    onChunk(contentChunk);
                }
            } catch (e) {
                // Ignore parsing errors for non-JSON or incomplete lines
            }
        }
    }
    return fullResponse;

  } catch (error) {
    console.error("Error generating code with Claude:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorJson = JSON.stringify({
        message: `Ocorreu um erro: ${errorMessage}. Por favor, verifique o console para mais detalhes.`,
        files: existingFiles
    });
    onChunk(errorJson);
    return errorJson;
  }
};
