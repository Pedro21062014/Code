import React from 'react';

const iconProps = {
  className: "w-6 h-6",
  strokeWidth: 1.5,
  stroke: "currentColor",
  fill: "none",
  strokeLinecap: "round" as "round",
  strokeLinejoin: "round" as "round",
};

// FIX: Updated component to accept standard SVG props (like `style`) by using React.ComponentProps<'svg'>.
export const AppLogo = ({ className = "w-8 h-8 text-white", ...props }: React.ComponentProps<'svg'>) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export const LinkedInIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

export const GithubIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);

export const StripeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.155 2.592L6.155 21.408C8.324 21.798 13.987 20.803 16.633 15.602C19.279 10.4 18.283 4.74 17.848 2.592H10.155Z" fill="#635BFF"/>
        <path d="M12.001 2.592H4.309C3.874 4.74 2.878 10.4 5.524 15.602C8.17 20.803 13.833 21.798 16.002 21.408L12.001 2.592Z" fill="#635BFF" opacity="0.6"/>
    </svg>
);

export const GoogleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.02C17.72 16.21 16.73 17.69 15.15 18.65V21.48H19.01C21.25 19.44 22.56 16.14 22.56 12.25Z" fill="#4285F4"/>
        <path d="M12 23C14.97 23 17.45 22.02 19.01 20.48L15.15 17.65C14.1 18.39 12.83 18.8 12 18.8C9.62 18.8 7.63 17.29 6.79 15.12H2.82V17.95C4.66 21.05 8.08 23 12 23Z" fill="#34A853"/>
        <path d="M6.79 15.12C6.58 14.52 6.45 13.88 6.45 13.23C6.45 12.58 6.58 11.94 6.79 11.34V8.51H2.82C1.94 10.02 1.45 11.58 1.45 13.23C1.45 14.88 1.94 16.44 2.82 17.95L6.79 15.12Z" fill="#FBBC05"/>
        <path d="M12 7.2C13.23 7.2 14.28 7.64 15.09 8.4L18.01 5.51C16.45 4.02 14.47 3 12 3C8.08 3 4.66 4.95 2.82 8.05L6.79 10.88C7.63 8.71 9.62 7.2 12 7.2Z" fill="#EA4335"/>
    </svg>
);

export const MapIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M9 4v16l-6 -4v-16z" />
        <path d="M15 4v16l6 -4v-16z" />
        <path d="M9 4l6 2" />
        <path d="M9 20l6 -2" />
    </svg>
);

export const DatabaseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg {...iconProps} className={className} viewBox="0 0 24 24">
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v12c0 1.66 3.58 3 8 3s8 -1.34 8 -3v-12" />
        <path d="M4 12c0 1.66 3.58 3 8 3s8 -1.34 8 -3" />
    </svg>
);


export const FileIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
  </svg>
);

export const ShieldIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24">
    <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
  </svg>
);

export const CubeIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24">
    <path d="M12 2l-8 4.5v9l8 4.5l8 -4.5v-9l-8 -4.5" />
    <path d="M12 12l8 -4.5" />
    <path d="M12 12v9" />
    <path d="M12 12l-8 -4.5" />
    <path d="M4 7.5l8 4.5l8 -4.5" />
  </svg>
);

export const SupabaseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.235 2.25C12.063 2.11 11.838 2.11 11.666 2.25L1.82 8.416C1.696 8.513 1.696 8.709 1.82 8.806L11.666 14.972C11.838 15.111 12.063 15.111 12.235 14.972L22.08 8.806C22.204 8.709 22.204 8.513 22.08 8.416L12.235 2.25Z" fill="#3ECF8E"/>
        <path d="M22.08 10.166C22.204 10.069 22.204 9.873 22.08 9.776L12.235 3.61C12.063 3.47 11.838 3.47 11.666 3.61L1.82 9.776C1.696 9.873 1.696 10.069 1.82 10.166L6.5 13.416L11.666 17.583C11.838 17.723 12.063 17.723 12.235 17.583L22.08 11.416L17.5 13.416L22.08 10.166Z" fill="#3ECF8E"/>
        <path d="M22.08 12.916C22.204 12.819 22.204 12.623 22.08 12.526L12.235 6.36C12.063 6.22 11.838 6.22 11.666 6.36L1.82 12.526C1.696 12.623 1.696 12.819 1.82 12.916L11.666 19.083C11.838 19.223 12.063 19.223 12.235 19.083L22.08 12.916Z" fill="#3ECF8E" opacity="0.6"/>
    </svg>
);


export const PublishIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M12 20h-6a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12v5" />
        <path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
        <path d="M18 16v2.5" />
        <path d="M20.5 18.5l-2.5 -2.5" />
    </svg>
);

export const UserIcon = () => (
  <svg {...iconProps} viewBox="0 0 24 24">
    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
    <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
  </svg>
);

export const LogInIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
        <path d="M20 12h-13l3 -3" />
        <path d="M17 15l3 -3" />
    </svg>
);

export const LogOutIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
        <path d="M9 12h12l-3 -3" />
        <path d="M18 15l3 -3" />
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

export const CloseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg {...iconProps} className={className} viewBox="0 0 24 24">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

export const SparklesIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 3l1.5 4.5h4.5l-3.5 2.5 1.5 4.5-4-3-4 3 1.5-4.5-3.5-2.5h4.5z" />
      <path d="M3 12l4.5 1.5v4.5l2.5-3.5 4.5 1.5-3-4 3-4 3-4-4.5 1.5-2.5-3.5v4.5z"/>
    </svg>
);

export const PlusIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
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

export const SunIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
        <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
    </svg>
);

export const MoonIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
    </svg>
);

export const SaveIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M6 4h10l4 4v10a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2" />
        <path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
        <path d="M14 4l0 4l-6 0l0 -4" />
    </svg>
);

export const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M4 7l16 0" />
        <path d="M10 11l0 6" />
        <path d="M14 11l0 6" />
        <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
        <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    </svg>
);

export const EditIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg {...iconProps} className={className} viewBox="0 0 24 24">
        <path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
        <path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
        <path d="M16 5l3 3" />
    </svg>
);

export const ProjectsIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
    </svg>
);

export const FolderIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M5 4h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2" />
    </svg>
);

export const TerminalIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M5 7l5 5l-5 5" />
        <path d="M12 19h7" />
    </svg>
);

export const PaperclipIcon = () => (
    <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M15.5 6.5a3.5 3.5 0 1 1 -7 0v8.5a5.5 5.5 0 1 0 11 0v-6.5" />
    </svg>
);

export const ImageIcon = () => (
    <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M15 8h.01" />
        <path d="M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12z" />
        <path d="M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5" />
        <path d="M14 14l1 -1c.928 -.893 2.072 -.893 3 0l2 2" />
    </svg>
);
