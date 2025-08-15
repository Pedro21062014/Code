
import React, { useMemo } from 'react';
import { ProjectFile } from '../types';

interface CodePreviewProps {
  files: ProjectFile[];
}

export const CodePreview: React.FC<CodePreviewProps> = ({ files }) => {
  const srcDoc = useMemo(() => {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    if (!htmlFile) {
      return '<div class="flex items-center justify-center h-full text-gray-400">No index.html file found to preview.</div>';
    }
    return htmlFile.content;
  }, [files]);

  return (
    <div className="w-full h-full bg-white">
      <iframe
        srcDoc={srcDoc}
        title="Project Preview"
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
      />
    </div>
  );
};
