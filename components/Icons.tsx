import React from 'react';

const iconProps = {
  className: "w-6 h-6",
  strokeWidth: 1.5,
  stroke: "currentColor",
  fill: "none",
  strokeLinecap: "round" as "round",
  strokeLinejoin: "round" as "round",
};

export const AppLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.122 2.388a.936.936 0 0 1 1.756 0l9.31 16.14a.936.936 0 0 1-.878 1.403H2.69a.936.936 0 0 1-.878-1.403l9.31-16.14z"/>
    </svg>
);

export const LinkedInIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

export const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
    </svg>
);

export const RedditIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 14.28c-.46.46-1.2.46-1.66 0-.64-.64-.99-1.49-1.02-2.35-.02-.85.3-1.68.9-2.32.48-.48 1.11-.73 1.78-.73s1.3.25 1.78.73c1.17 1.17 1.17 3.07 0 4.24zm-8.02-4.24c.68-.68 1.76-.68 2.44 0 .39.39.6.9.6 1.44s-.21 1.05-.6 1.44c-.68.68-1.76.68-2.44 0-1.17-1.17-1.17-3.07 0-4.24zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" clipRule="evenodd" fillRule="evenodd"/>
    </svg>
);

export const ChevronDownIcon = () => (
    <svg {...iconProps} className="w-4 h-4 ml-1" viewBox="0 0 24 24">
        <path d="M6 9l6 6l6 -6" />
    </svg>
);

export const PaperclipIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M15.172 7.379a4 4 0 0 1 0 5.656l-5.657 5.657a2 2 0 0 1-2.828-2.828l5.657-5.657a4 4 0 0 1 0-5.656" />
        <path d="m15.879 10.121-2.829 2.829a2 2 0 0 0 2.829 2.828l2.121-2.121" />
    </svg>
);

export const FigmaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 12C12 14.7614 9.76142 17 7 17C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7C9.76142 7 12 9.23858 12 12Z" fill="#F24E1E"/>
        <path d="M12 12C12 9.23858 14.2386 7 17 7C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17C14.2386 17 12 14.7614 12 12Z" fill="#A259FF"/>
        <path d="M7 17C9.76142 17 12 19.2386 12 22C12 19.2386 14.2386 17 17 17C14.2386 17 12 14.7614 12 12C12 14.7614 9.76142 17 7 17Z" fill="#1ABCFE"/>
        <path d="M12 7C12 9.76142 9.76142 12 7 12C4.23858 12 2 9.76142 2 7C2 4.23858 4.23858 2 7 2C9.76142 2 12 4.23858 12 7Z" fill="#0ACF83"/>
        <path d="M12 7C14.2386 7 17 4.76142 17 2C17 4.76142 19.7614 7 22 7C19.7614 7 17 9.23858 17 12C17 9.23858 14.2386 7 12 7Z" fill="#FF7262"/>
    </svg>
);

export const GithubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);


export const FileIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
  </svg>
);

export const ExtensionIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24">
    <path d="M4 10a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M14 4a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M4 20a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M14 14a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
    <path d="M6 10h8" />
    <path d="M10 6v8" />
    <path d="M6 20h8" />
    <path d="M10 16v-4" />
    <path d="M16 14h-2" />
    <path d="M14 18h4" />
    <path d="M14 8h4" />
  </svg>
);

export const UserIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24">
    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
    <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
  </svg>
);

export const SettingsIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1.002 -.608 2.07 .098 2.572 1.065z" />
        <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </svg>
);

export const DownloadIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
        <path d="M7 11l5 5l5 -5" />
        <path d="M12 4l0 12" />
    </svg>
);

export const KeyIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M14 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M21 12a9 9 0 1 1 -18 0a9 9 0 0 1 18 0" />
      <path d="M12.5 11.5l-4 4l1.5 1.5l4 -4" />
      <path d="M12 15l-1.5 -1.5" />
    </svg>
);

export const CloseIcon = () => (
  <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

export const SparklesIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 3l1.5 4.5h4.5l-3.5 2.5 1.5 4.5-4-3-4 3 1.5-4.5-3.5-2.5h4.5z" />
      <path d="M3 12l4.5 1.5v4.5l2.5-3.5 4.5 1.5-3-4 3-4-4.5 1.5-2.5-3.5v4.5z"/>
    </svg>
);


export const MenuIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
      <path d="M4 6l16 0" />
      <path d="M4 12l16 0" />
      <path d="M4 18l16 0" />
    </svg>
);
  
export const ChatIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1 -2 2h-11l-4 4v-13a2 2 0 0 1 2 -2h11a2 2 0 0 1 2 2v8z" />
    </svg>
);