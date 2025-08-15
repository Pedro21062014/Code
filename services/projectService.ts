
import { ProjectFile } from '../types';

declare const JSZip: any;

export const downloadProjectAsZip = async (files: ProjectFile[], projectName: string = 'ai-codegen-project') => {
  if (typeof JSZip === 'undefined') {
    alert('JSZip library not loaded. Cannot download project.');
    return;
  }
  
  const zip = new JSZip();

  files.forEach(file => {
    zip.file(file.name, file.content);
  });

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `${projectName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error creating zip file:", error);
    alert("An error occurred while creating the zip file.");
  }
};
