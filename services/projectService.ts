
import { ProjectFile } from '../types';
import JSZip from 'jszip';

// Função auxiliar para injetar configurações de runtime no navegador
const processFilesForStaticDeploy = (files: ProjectFile[]): ProjectFile[] => {
    const processedFiles = [...files];
    const indexHtmlIndex = processedFiles.findIndex(f => f.name === 'index.html');
    
    if (indexHtmlIndex === -1) return files; // Se não tem index.html, não faz nada

    let indexContent = processedFiles[indexHtmlIndex].content;
    const hasReact = processedFiles.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx'));

    if (hasReact) {
        // 1. Injetar Import Map para resolver 'react' e 'react-dom' sem node_modules
        const importMap = `
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
    "react-dom": "https://esm.sh/react-dom@18.2.0",
    "lucide-react": "https://esm.sh/lucide-react@0.263.1",
    "recharts": "https://esm.sh/recharts@2.12.0",
    "framer-motion": "https://esm.sh/framer-motion@10.16.4",
    "clsx": "https://esm.sh/clsx@2.0.0",
    "tailwind-merge": "https://esm.sh/tailwind-merge@1.14.0"
  }
}
</script>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
`;
        
        // Inserir antes do fechamento do head ou no início do body
        if (indexContent.includes('</head>')) {
            indexContent = indexContent.replace('</head>', `${importMap}</head>`);
        } else {
            indexContent = importMap + indexContent;
        }

        // 2. Modificar a tag script principal para usar o Babel
        // De: <script type="module" src="/src/main.tsx"></script>
        // Para: <script type="text/babel" data-type="module" src="/src/main.tsx"></script>
        indexContent = indexContent.replace(
            /<script\s+type="module"\s+src="([^"]+)"\s*><\/script>/g, 
            '<script type="text/babel" data-type="module" src="$1"></script>'
        );
        
        // Atualiza o index.html processado
        processedFiles[indexHtmlIndex] = {
            ...processedFiles[indexHtmlIndex],
            content: indexContent
        };

        // 3. Corrigir importações relativas nos arquivos TSX/JS
        // Navegadores exigem extensões explícitas (ex: './App' -> './App.tsx')
        // Esta é uma correção ingênua, mas resolve 90% dos casos simples gerados por IA
        processedFiles.forEach((file, idx) => {
            if (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.jsx') || file.name.endsWith('.js')) {
                let content = file.content;
                
                // Regex para encontrar imports relativos sem extensão: import ... from './Comp'
                content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, path) => {
                    if (path.endsWith('.css') || path.endsWith('.svg') || path.endsWith('.png')) return match;
                    
                    // Tenta adivinhar a extensão baseada nos arquivos existentes
                    const potentialPathTsx = `${path}.tsx`.replace(/^\.\//, ''); // Remove ./ para busca
                    const potentialPathTs = `${path}.ts`.replace(/^\.\//, '');
                    
                    // Verifica se existe algum arquivo que combine com o path (simplificado)
                    const targetFile = files.find(f => f.name.includes(potentialPathTsx) || f.name.includes(potentialPathTs));
                    
                    if (targetFile) {
                        const ext = targetFile.name.endsWith('.tsx') ? '.tsx' : '.ts';
                        return `from '${path}${ext}'`;
                    }
                    
                    // Fallback padrão se não encontrar (assume .tsx para React)
                    return `from '${path}.tsx'`;
                });

                processedFiles[idx] = { ...file, content };
            }
        });
    }

    return processedFiles;
};

export const createProjectZip = async (files: ProjectFile[]): Promise<Blob> => {
  const zip = new JSZip();

  // Process files to make them executable in browser without a build step
  const readyToDeployFiles = processFilesForStaticDeploy(files);

  readyToDeployFiles.forEach(file => {
    // Remove leading slash if present to avoid zip structure issues
    const fileName = file.name.startsWith('/') ? file.name.slice(1) : file.name;

    if (file.content.startsWith('data:image/')) {
        // Extract base64 part
        const base64Data = file.content.split(',')[1];
        zip.file(fileName, base64Data, { base64: true });
    } else {
        zip.file(fileName, file.content);
    }
  });

  return zip.generateAsync({ type: 'blob' });
};


export const downloadProjectAsZip = async (files: ProjectFile[], projectName: string = 'ai-codegen-project') => {
  try {
    const zipBlob = await createProjectZip(files);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${projectName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error creating zip file:", error);
    const message = error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao criar o arquivo zip.";
    alert(message);
  }
};
