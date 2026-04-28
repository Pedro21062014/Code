import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { ProjectFile } from '../../types';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export const getWebContainer = async (): Promise<WebContainer> => {
  if (webcontainerInstance) return webcontainerInstance;
  if (bootPromise) return bootPromise;

  bootPromise = WebContainer.boot().then(instance => {
    webcontainerInstance = instance;
    return instance;
  }).catch(err => {
    console.error("Failed to boot WebContainer:", err);
    throw err;
  });

  return bootPromise;
};

export const filesToWebContainerTree = (files: ProjectFile[]): FileSystemTree => {
  const tree: FileSystemTree = {};

  for (const file of files) {
    const parts = file.name.split('/');
    let currentLevel = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (typeof part !== 'string' || part.trim() === '') continue;

      if (i === parts.length - 1) {
        // It's a file
        currentLevel[part] = {
          file: {
            contents: file.content
          }
        };
      } else {
        // It's a directory
        if (!currentLevel[part]) {
          currentLevel[part] = {
            directory: {}
          };
        }
        currentLevel = (currentLevel[part] as any).directory;
      }
    }
  }

  return tree;
};

