
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
    <style>
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
        }
    </style>
</head>
<body class="bg-gray-900 text-white flex flex-col items-center justify-center h-screen font-sans">
    <div class="text-center p-10 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full" style="animation: float 6s ease-in-out infinite;">
        <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">HTML5 & JS</h1>
        <p class="text-gray-400 mb-6">This is a pure HTML/CSS/JS mock response. No React needed!</p>
        <button id="btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all transform hover:scale-105">
            Click Me
        </button>
        <p id="counter" class="mt-4 text-xl font-mono text-blue-300">Count: 0</p>
    </div>

    <script>
        const btn = document.getElementById('btn');
        const counterDisplay = document.getElementById('counter');
        let count = 0;

        btn.addEventListener('click', () => {
            count++;
            counterDisplay.innerText = 'Count: ' + count;
            btn.innerText = 'Clicked!';
            setTimeout(() => btn.innerText = 'Click Me', 500);
        });
    </script>
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
