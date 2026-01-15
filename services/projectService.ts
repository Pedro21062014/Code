import { ProjectFile } from '../types';
import JSZip from 'jszip';

export const createProjectZip = async (files: ProjectFile[]): Promise<Blob> => {
  const zip = new JSZip();

  files.forEach(file => {
    if (file.content.startsWith('data:image/')) {
        // Extract base64 part
        const base64Data = file.content.split(',')[1];
        zip.file(file.name, base64Data, { base64: true });
    } else {
        zip.file(file.name, file.content);
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