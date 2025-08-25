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
- Respond with a JSON object that strictly adheres to the provided schema. The JSON object must contain two keys: "message" (a friendly, conversational message to the user, in Portuguese) and "files" (an array of file objects). Each file object must have "name", "language", and "content".

Current project files:
${fileContentToString(files)}
`;

export const generateCodeStreamWithZAI = async (
  prompt: string,
  existingFiles: ProjectFile[],
  onChunk: (chunk: string) => void,
  apiKey: string,
  model: string
): Promise<string> => {
  const systemPrompt = getSystemPrompt(existingFiles);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': `https://codegen.studio`,
        'X-Title': `Codegen Studio`,
      },
      body: JSON.stringify({
        model: model, // This will now correctly be 'zhipu/glm-4.5-air'
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

  } catch (error) {
    console.error("Error generating code with Z.AI (OpenRouter):", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorJson = JSON.stringify({
        message: `Ocorreu um erro: ${errorMessage}. Por favor, verifique o console para mais detalhes.`,
        files: existingFiles
    });
    onChunk(errorJson);
    return errorJson;
  }
};