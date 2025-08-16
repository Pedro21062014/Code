import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ProjectFile } from '../tipos';

// Usando a chave diretamente
const ai = new GoogleGenAI({ apiKey: "AIzaSyD0433RALd_5FVbs89xn6okQUsZ3QgHejU" });

const generationConfig = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      message: {
        type: Type.STRING,
        description: "Uma mensagem amigável e coloquial para o usuário explicando o que você criou ou se tiver alguma dúvida."
      },
      files: {
        type: Type.ARRAY,
        description: "Uma matriz de objetos de arquivo que representam a estrutura completa do projeto.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "O caminho completo do arquivo, por exemplo, 'index.html' ou 'components/Button.tsx'."
            },
            language: {
              type: Type.STRING,
              description: "A linguagem de programação do arquivo, por exemplo, 'html', 'typescript', 'css'."
            },
            content: {
              type: Type.STRING,
              description: "O conteúdo completo e integral do arquivo."
            }
          },
          required: ["name", "language", "content"]
        }
      }
    },
    required: ["message", "files"]
  }
};

const fileContentToString = (files: ProjectFile[]): string => {
  if (files.length === 0) {
    return "Ainda não existem arquivos.";
  }
  return files.map(file => `
--- ARQUIVO: ${file.name} ---
\`\`\`${file.language}
${file.content}
\`\`\`
`).join('\n');
};

export const generateCodeWithGemini = async (
  prompt: string,
  existingFiles: ProjectFile[]
): Promise<{ message: string; files: ProjectFile[] }> => {

  const model = "gemini-2.5-flash";
  const systemInstruction = `Você é um engenheiro sênior especialista em React de front-end especializado na criação de aplicativos da Web completos, funcionais e esteticamente agradáveis com React e Tailwind CSS.
 - Seu objetivo principal é gerar todos os arquivos de código necessários com base no prompt do usuário.
 - Sempre gere código completo e executável. Não use espaços reservados como "// seu código aqui".
 - Para React, use componentes funcionais, TypeScript (.tsx) e ganchos.
 - Para estilização, use SOMENTE Tailwind CSS. Não gere arquivos CSS nem use estilos embutidos. Carregue o Tailwind via CDN no index.html.
 - Todo o projeto deve ser um aplicativo de página única contido nos arquivos gerados.
 - A estrutura do arquivo deve ser lógica (por exemplo, components/, services/).
 - Sempre inclua um 'index.html', 'index.tsx' e 'App.tsx'.
 - Responda com um objeto JSON que adere estritamente ao esquema fornecido.
 
Arquivos de projeto atuais:
${fileContentToString(existingFiles)}
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      config: {
        ...generationConfig,
        systemInstruction: systemInstruction,
        temperature: 0.1,
        topP: 0.9,
      }
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    if (parsed.files && Array.isArray(parsed.files)) {
      return {
        message: parsed.message || "Aqui estão os arquivos do seu projeto.",
        files: parsed.files,
      };
    } else {
      throw new Error("Estrutura JSON inválida recebida da API.");
    }
  } catch (error) {
    console.error("Erro ao gerar código com Gemini:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return {
      message: `Encontrei um erro: ${errorMessage}. Por favor, verifique o console para obter detalhes.`,
      files: existingFiles,
    };
  }
};