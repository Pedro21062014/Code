
import { ProjectFile, AIProvider } from '../types';

const MOCK_RESPONSE = {
    message: "This AI provider is for demonstration purposes only. The response below is a pre-defined sample.",
    files: [
        {
            name: "index.html",
            language: "html",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mock Project</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white flex items-center justify-center h-screen">
    <div class="text-center">
        <h1 class="text-4xl font-bold">Mock Project</h1>
        <p class="mt-2">This is a sample response from a mock AI service.</p>
    </div>
</body>
</html>`
        }
    ]
};

export const generateCodeWithMockAPI = async (
  provider: AIProvider,
  existingFiles: ProjectFile[]
): Promise<{ message: string; files: ProjectFile[] }> => {
  console.log(`Called mock API for ${provider}`);
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
  
  const response = {
      ...MOCK_RESPONSE,
      message: `This is a mock response from the ${provider} service. Full integration is not available in this demo.`
  }
  return response;
};
