
import { ProjectFile } from '../types';
import JSZip from 'jszip';

// Helper simples para resolver caminhos relativos
const resolvePath = (basePath: string, relativePath: string) => {
    const stack = basePath.split('/');
    stack.pop();
    
    const parts = relativePath.split('/');
    for (const part of parts) {
        if (part === '.') continue;
        if (part === '..') {
            stack.pop();
        } else {
            stack.push(part);
        }
    }
    return stack.join('/');
};

// Processa arquivos apenas se for React para garantir compatibilidade de deploy
// Se for estático (HTML/CSS/JS), retorna os arquivos originais limpos.
export const processFilesForStaticDeploy = (files: ProjectFile[]): ProjectFile[] => {
    // Detecta se é React
    const hasReact = files.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx') || f.content.includes('import React'));

    // Se NÃO é React, não injeta nada. Retorna os arquivos como estão para garantir que o index.html funcione nativamente.
    if (!hasReact) {
        return files;
    }

    // Lógica apenas para React (Babel Standalone injection para preview sem build step no navegador se necessário)
    // Nota: Para deploy real (Netlify), o ideal seria um build, mas aqui simulamos um ambiente runtime.
    const processedFiles = [...files];
    const indexHtmlIndex = processedFiles.findIndex(f => f.name === 'index.html');
    
    if (indexHtmlIndex === -1) return files;

    let indexContent = processedFiles[indexHtmlIndex].content;

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
    
    if (indexContent.includes('</head>')) {
        indexContent = indexContent.replace('</head>', `${importMap}</head>`);
    } else {
        indexContent = importMap + indexContent;
    }

    indexContent = indexContent.replace(
        /<script\s+type="module"\s+src="([^"]+)"\s*><\/script>/g, 
        '<script type="text/babel" data-type="module" src="$1"></script>'
    );
    
    processedFiles[indexHtmlIndex] = {
        ...processedFiles[indexHtmlIndex],
        content: indexContent
    };

    return processedFiles;
};

export const createProjectZip = async (files: ProjectFile[]): Promise<Blob> => {
  const zip = new JSZip();

  // Detecção robusta de React
  const hasReact = files.some(f => f.name.endsWith('.tsx') || f.name.endsWith('.jsx') || f.content.includes('import React'));
  
  let filesToZip = hasReact ? processFilesForStaticDeploy(files) : files;

  // CRÍTICO: Para sites estáticos (HTML/CSS/JS), REMOVER package.json e configs de build.
  // Isso impede que Netlify/Cloudflare tentem rodar 'npm install' e falhem.
  if (!hasReact) {
      filesToZip = filesToZip.filter(f => 
          f.name !== 'package.json' && 
          f.name !== 'package-lock.json' && 
          f.name !== 'vite.config.js' &&
          f.name !== 'vite.config.ts' &&
          f.name !== 'tsconfig.json'
      );
  }

  filesToZip.forEach(file => {
    // Remove barra inicial para garantir que os arquivos fiquem na raiz do ZIP
    let fileName = file.name.startsWith('/') ? file.name.slice(1) : file.name;
    
    // Se o arquivo estiver dentro de uma pasta (ex: public/index.html), e for o único index,
    // movemos para a raiz se necessário, ou mantemos a estrutura se for complexa.
    fileName = fileName.replace(/^\.\//, '');

    if (file.content.startsWith('data:image/')) {
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
