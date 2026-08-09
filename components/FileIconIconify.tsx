import React from 'react';
import { Icon } from '@iconify/react';

// Mapeia extensão/caminho do arquivo para um ícone do Iconify (vscode-icons)
const EXT_ICONS: Record<string, string> = {
  'ts': 'vscode-icons:file-type-typescript',
  'tsx': 'vscode-icons:file-type-reactts',
  'js': 'vscode-icons:file-type-js',
  'jsx': 'vscode-icons:file-type-reactjs',
  'py': 'vscode-icons:file-type-python',
  'go': 'vscode-icons:file-type-go',
  'rs': 'vscode-icons:file-type-rust',
  'java': 'vscode-icons:file-type-java',
  'c': 'vscode-icons:file-type-c',
  'cpp': 'vscode-icons:file-type-cpp',
  'cs': 'vscode-icons:file-type-csharp',
  'php': 'vscode-icons:file-type-php',
  'rb': 'vscode-icons:file-type-ruby',
  'swift': 'vscode-icons:file-type-swift',
  'kt': 'vscode-icons:file-type-kotlin',
  'sh': 'vscode-icons:file-type-shell',
  'bash': 'vscode-icons:file-type-shell',
  'sql': 'vscode-icons:file-type-sql',
  'html': 'vscode-icons:file-type-html',
  'htm': 'vscode-icons:file-type-html',
  'css': 'vscode-icons:file-type-css',
  'scss': 'vscode-icons:file-type-scss',
  'sass': 'vscode-icons:file-type-sass',
  'less': 'vscode-icons:file-type-less',
  'md': 'vscode-icons:file-type-markdown',
  'mdx': 'vscode-icons:file-type-markdown',
  'txt': 'vscode-icons:file-type-text',
  'json': 'vscode-icons:file-type-json',
  'yaml': 'vscode-icons:file-type-yaml',
  'yml': 'vscode-icons:file-type-yaml',
  'toml': 'vscode-icons:file-type-toml',
  'xml': 'vscode-icons:file-type-xml',
  'ini': 'vscode-icons:file-type-config',
  'env': 'vscode-icons:file-type-dotenv',
  'lock': 'vscode-icons:file-type-npm',
  'png': 'vscode-icons:file-type-image',
  'jpg': 'vscode-icons:file-type-image',
  'jpeg': 'vscode-icons:file-type-image',
  'gif': 'vscode-icons:file-type-image',
  'svg': 'vscode-icons:file-type-svg',
  'webp': 'vscode-icons:file-type-image',
  'ico': 'vscode-icons:file-type-image',
  'vue': 'vscode-icons:file-type-vue',
  'svelte': 'vscode-icons:file-type-svelte',
  'astro': 'vscode-icons:file-type-astro',
  'dart': 'vscode-icons:file-type-dart',
  'graphql': 'vscode-icons:file-type-graphql',
  'prisma': 'vscode-icons:file-type-prisma',
  'dockerfile': 'vscode-icons:file-type-docker',
  'pdf': 'vscode-icons:file-type-pdf',
  'zip': 'vscode-icons:file-type-zip',
};

const NAME_ICONS: Record<string, string> = {
  'package.json': 'vscode-icons:file-type-npm',
  'vite.config.ts': 'vscode-icons:file-type-vite',
  'vite.config.js': 'vscode-icons:file-type-vite',
  'next.config.js': 'vscode-icons:file-type-next',
  'tailwind.config.js': 'vscode-icons:file-type-tailwind',
  'tailwind.config.ts': 'vscode-icons:file-type-tailwind',
  'tsconfig.json': 'vscode-icons:file-type-tsconfig',
  '.gitignore': 'vscode-icons:file-type-git',
  '.env': 'vscode-icons:file-type-dotenv',
  'Dockerfile': 'vscode-icons:file-type-docker',
  'README.md': 'vscode-icons:file-type-markdown',
};

interface FileIconIconifyProps {
  name: string;
  className?: string;
}

const getIconName = (name: string): string => {
  const lower = name.toLowerCase();
  if (NAME_ICONS[lower]) return NAME_ICONS[lower];
  const parts = name.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].toLowerCase();
    if (EXT_ICONS[ext]) return EXT_ICONS[ext];
  }
  return '';
};

export const FileIconIconify: React.FC<FileIconIconifyProps> = ({ name, className }) => {
  const iconName = getIconName(name);
  if (!iconName) {
    return <span className={className} style={{ width: '1em', height: '1em' }} />;
  }
  return <Icon icon={iconName} className={className} width="1em" height="1em" />;
};

export default FileIconIconify;
