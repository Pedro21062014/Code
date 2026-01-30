
import React, { useState, useRef, useEffect } from 'react';

// Re-export UserMenu to be available easily
export { UserMenu } from './UserMenu';

// Props padrão para ícones SVG
type IconProps = React.ComponentProps<'svg'> & {
    className?: string;
};

const defaultProps = {
  className: "w-6 h-6",
  strokeWidth: 1.5,
  stroke: "currentColor",
  fill: "none",
  strokeLinecap: "round" as "round",
  strokeLinejoin: "round" as "round",
};

// Ícone principal da aplicação (Logo)
export const AppLogo = ({ className = "w-8 h-8 text-white", ...props }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const RefreshIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

export const GoogleDriveIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <img src="https://img.icons8.com/?size=100&id=ya4CrqO7PgnY&format=png&color=000000" alt="Google Drive" className={className} />
);

export const LightbulbIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </svg>
);

export const PlanIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M12 3a2 2 0 0 0-2 2v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4V5a2 2 0 0 0-2-2z" />
    <path d="M9 12l2 2l4-4" />
  </svg>
);

export const UploadIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const StopIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const BotIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <rect width="18" height="10" x="3" y="11" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" x2="8" y1="16" y2="16" />
    <line x1="16" x2="16" y1="16" y2="16" />
  </svg>
);

export const PaletteIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M12 21a9 9 0 0 0 9 -9c0 -4.97 -4.03 -9 -9 -9c-2.386 0 -4.556 .927 -6.177 2.45l-.188 .183a9 9 0 0 0 6.365 15.367z" />
    <path d="M8.5 13a1.5 1.5 0 1 0 0 -3a1.5 1.5 0 0 0 0 3z" fill="currentColor" className="opacity-50" />
    <path d="M12.5 9a1.5 1.5 0 1 0 0 -3a1.5 1.5 0 0 0 0 3z" fill="currentColor" className="opacity-50" />
    <path d="M16.5 13a1.5 1.5 0 1 0 0 -3a1.5 1.5 0 0 0 0 3z" fill="currentColor" className="opacity-50" />
    <path d="M12.5 17a1.5 1.5 0 1 0 0 -3a1.5 1.5 0 0 0 0 3z" fill="currentColor" className="opacity-50" />
  </svg>
);

export const CloudSimpleIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M6.331 8h11.339a2 2 0 0 1 1.977 2.304l-1.255 8.152a3 3 0 0 1 -2.966 2.544h-6.852a3 3 0 0 1 -2.965 -2.544l-1.255 -8.152a2 2 0 0 1 1.977 -2.304z" />
    <path d="M9 11v-5a3 3 0 0 1 6 0v5" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
  </svg>
);

// Ícone Oficial do Google Gemini
export const GeminiIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <img src="https://img.icons8.com/?size=100&id=mrNoLXFmvXDX&format=png&color=000000" alt="Gemini" className={className} />
);

export const OpenAIIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <img src="https://img.icons8.com/?size=100&id=fO5yVwARGUEB&format=png&color=000000" alt="OpenAI" className={className} />
);

export const DeepSeekIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
       <path d="M16.946 7.027c-3.14-1.716-6.64-1.722-10.236-.337-.892.344-1.637.77-2.361 1.258 0 0 2.228-2.612 2.544-2.73 2.173-.812 4.498-1.174 6.815-.97 2.14.188 4.22.955 6.002 2.235l-2.764.544zM4.349 7.948c-.968.647-1.82 1.353-2.368 2.015.688-.85 1.41-1.644 2.235-2.29 2.809-2.193 6.643-3.138 10.236-2.337l-2.765 1.544c-2.458-.598-5.01-.225-7.338 1.068z" fill="#4D6BFE"/>
       <path d="M2.35 9.963c-.42.508-.68 1.057-.866 1.603.208-.636.57-1.32 1.062-1.916 2.808-3.4 8.046-4.996 12.37-3.666l-3.2 1.8c-2.885-1.002-6.425.042-9.366 2.18zM1.484 11.566c-.167.49-.236.92-.284 1.264.03-.33.064-.78.226-1.31 1.708-5.61 9.206-7.39 13.97-3.328l-3.2 1.8c-3.05-2.63-7.904-1.55-10.712 1.574z" fill="#4D6BFE"/>
       <path d="M19.49 14.5c0 3.315-2.685 6-6 6s-6-2.685-6-6 2.685-6 6-6 6 2.685 6 6z" fill="#4D6BFE" fillOpacity="0.9"/>
       <path d="M15.5 14.5c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z" fill="#FFF"/>
    </svg>
);

export const NetlifyIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <img src="https://img.icons8.com/?size=100&id=rD15EcpCkinR&format=png&color=000000" alt="Netlify" className={className} />
);

export const CloudflareIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <img src="https://img.icons8.com/?size=100&id=fUGx53gD9Jof&format=png&color=000000" alt="Cloudflare" className={className} />
);

export const DriveIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.228 12.915L5.657 17.371H18.343L20.914 12.915H8.228ZM6.8 19.371H19.2L12 6.857L6.8 19.371ZM13.143 4.886L22.628 21.371H1.371L13.143 4.886Z" fill="currentColor" fillOpacity="0"/>
        <path d="M8.66663 12.6667L5.3333 18.4389H18.6666L21.9999 12.6667H8.66663Z" fill="#0066DA"/>
        <path d="M13.3333 4.58331L18.6666 12.6666L12 24.2178L6.66663 16.1344L13.3333 4.58331Z" fill="#00AC47"/>
        <path d="M21.9999 12.6667L15.3333 24.2178H1.99993L8.66659 12.6667H21.9999Z" fill="#EA4335"/>
        <path d="M13.3333 4.58331L6.66663 16.1344L2.00002 12.6666L10.3889 4.58331H13.3333Z" fill="#00832D"/>
        <path d="M21.9999 12.6667H8.66663L5.3333 18.4389L6.66663 16.1344L18.6666 12.6667H21.9999Z" fill="#2684FC"/>
        <path d="M12 24.2178L18.6666 12.6666L15.3333 24.2178H12Z" fill="#FFBA00"/>
    </svg>
);

export const LinkedInIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

export const GithubIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
);

export const StripeIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <img src="https://img.icons8.com/?size=100&id=7IT9Vpb5ZZUC&format=png&color=000000" alt="Stripe" className={className} />
);

export const GoogleIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.02C17.72 16.21 16.73 17.69 15.15 18.65V21.48H19.01C21.25 19.44 22.56 16.14 22.56 12.25Z" fill="#4285F4"/>
        <path d="M12 23C14.97 23 17.45 22.02 19.01 20.48L15.15 17.65C14.1 18.39 12.83 18.8 12 18.8C9.62 18.8 7.63 17.29 6.79 15.12H2.82V17.95C4.66 21.05 8.08 23 12 23Z" fill="#34A853"/>
        <path d="M6.79 15.12C6.58 14.52 6.45 13.88 6.45 13.23C6.45 12.58 6.58 11.94 6.79 11.34V8.51H2.82C1.94 10.02 1.45 11.58 1.45 13.23C1.45 14.88 1.94 16.44 2.82 17.95L6.79 15.12Z" fill="#FBBC05"/>
        <path d="M12 7.2C13.23 7.2 14.28 7.64 15.09 8.4L18.01 5.51C16.45 4.02 14.47 3 12 3C8.08 3 4.66 4.95 2.82 8.05L6.79 10.88C7.63 8.71 9.62 7.2 12 7.2Z" fill="#EA4335"/>
    </svg>
);

export const MapIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg {...defaultProps} className={className} viewBox="0 0 24 24">
        <path d="M9 4v16l-6 -4v-16z" />
        <path d="M15 4v16l6 -4v-16z" />
        <path d="M9 4l6 2" />
        <path d="M9 20l6 -2" />
    </svg>
);

export const DatabaseIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        {/* Neon Database Icon - Official simplified */}
        <path d="M6.5 5.5C6.5 4.67157 5.82843 4 5 4C4.17157 4 3.5 4.67157 3.5 5.5V18.5C3.5 19.3284 4.17157 20 5 20C5.82843 20 6.5 19.3284 6.5 18.5V5.5Z" />
        <path d="M10.5 5.5C10.5 4.67157 9.82843 4 9 4C8.17157 4 7.5 4.67157 7.5 5.5V18.5C7.5 19.3284 8.17157 20 9 20C9.82843 20 10.5 19.3284 10.5 18.5V5.5Z" />
        <path d="M19.5 5.5C19.5 4.67157 18.8284 4 18 4C17.1716 4 16.5 4.67157 16.5 5.5V18.5C16.5 19.3284 17.1716 20 18 20C18.8284 20 19.5 19.3284 19.5 18.5V5.5Z" />
    </svg>
);


export const FileIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
  </svg>
);

export const ShieldIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M12 3a12 12 0 0 0 8.5 3A12 12 0 0 1 12 21 12 12 0 0 1 3.5 6 12 12 0 0 0 12 3" />
  </svg>
);

export const CubeIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const SettingsIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M12.22 2h-.44a2 2 0 0 1-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const DownloadIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const CloseIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const SparklesIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275 1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export const LightningIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export const FolderIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </svg>
);

export const PlusIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const ChevronDownIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export const ChevronUpIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export const ChatIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export const MenuIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const SunIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const MoonIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const TerminalIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export const ConsoleIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <rect width="18" height="14" x="3" y="5" rx="2" ry="2" />
    <path d="m7 15 3-3-3-3" />
    <path d="M13 15h4" />
  </svg>
);

export const PaperclipIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
  </svg>
);

export const SupabaseIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <img src="https://img.icons8.com/?size=100&id=sH0rW2TvYdr9&format=png&color=000000" alt="Supabase" className={className} />
);

export const LogInIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

export const LogOutIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const SaveIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const ProjectsIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
     <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
     <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const ImageIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export const TrashIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const EditIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const KeyIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

export const ClockIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const LoaderIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export const CheckCircleIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

export const GlobeIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg {...defaultProps} className={className} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

export const HomeIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg {...defaultProps} className={className} viewBox="0 0 24 24">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);

export const UserIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg {...defaultProps} className={className} viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export const UsersIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg {...defaultProps} className={className} viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

export const SidebarIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg {...defaultProps} className={className} viewBox="0 0 24 24">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <line x1="9" x2="9" y1="3" y2="21"/>
    </svg>
);

export const GalleryIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg {...defaultProps} className={className} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

export const HeartIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg {...defaultProps} className={className} viewBox="0 0 24 24" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

export const WrenchIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

export const RocketIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.1 4-1 4-1" />
    <path d="M12 15v5s3.03-.55 4-2c1.1-1.62 1-4 1-4" />
  </svg>
);

export const MagicIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
    <path d="m14 7 3 3" />
    <path d="M5 6v4" />
    <path d="M19 14v4" />
    <path d="M10 2v2" />
    <path d="M7 8H3" />
    <path d="M21 16h-4" />
    <path d="M11 3H9" />
  </svg>
);

export const LinkIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const SmartphoneIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

export const MonitorIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
