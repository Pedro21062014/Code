import { ProjectFile } from '../types';

const fileContentToString = (files: ProjectFile[]): string => {
  if (files.length === 0) {
    return "No files exist yet.";
  }
  return files.map(file => `
--- FILE: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');
};

const getSystemPrompt = (files: ProjectFile[]): string => `You are an expert senior frontend React engineer specializing in creating complete, functional, and aesthetically pleasing web applications with React and Tailwind CSS.
- Your primary goal is to generate all necessary code files based on the user's prompt.
- Always generate complete, runnable code. Do not use placeholders like "// your code here".
- For React, use functional components, TypeScript (.tsx), and hooks.
- For styling, ONLY use Tailwind CSS. Do not generate CSS files or use inline styles. Load Tailwind via CDN in index.html.
- The entire project must be a single-page application contained within the generated files.
- The file structure should be logical (e.g., components/, services/).
- Always include an 'index.html', 'index.tsx', and 'App.tsx'.
- Respond with a JSON object that strictly adheres to the provided schema. The JSON object must contain two keys: "message" (a friendly, conversational message to the user) and "files" (an array of file objects). Each file object must have "name", "language", and "content".

Current project files:
${fileContentToString(files)}
`;

export const generateCodeWithOpenAI = async (
  prompt: string,
  existingFiles: ProjectFile[],
  apiKey: string,
  model: string
): Promise<{ message: string; files: ProjectFile[] }> => {
  if (!apiKey) {
    return {
      message: "OpenAI API key is not configured. Please add it in the settings.",
      files: existingFiles,
    };
  }

  const systemPrompt = getSystemPrompt(existingFiles);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    if (parsed.files && Array.isArray(parsed.files)) {
      return {
        message: parsed.message || "Here are the files for your project.",
        files: parsed.files,
      };
    } else {
      throw new Error("Invalid JSON structure received from the API.");
    }

  } catch (error) {
    console.error("Error generating code with OpenAI:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      message: `I ran into an error: ${errorMessage}. Please check the console for details.`,
      files: existingFiles,
    };
  }
};
