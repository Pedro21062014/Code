import React from 'react';

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
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Ícone oficial do Gemini com gradiente e duas estrelas
export const GeminiIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.0743 3.44658C18.9182 3.03398 18.3323 3.03398 18.1762 3.44658L17.1523 6.15177C16.963 6.65176 16.5656 7.04918 16.0656 7.23842L13.3604 8.26233C12.9478 8.41846 12.9478 9.00441 13.3604 9.16054L16.0656 10.1844C16.5656 10.3737 16.963 10.7711 17.1523 11.2711L18.1762 13.9763C18.3323 14.3889 18.9182 14.3889 19.0743 13.9763L20.0982 11.2711C20.2875 10.7711 20.6849 10.3737 21.1849 10.1844L23.8901 9.16054C24.3027 9.00441 24.3027 8.41846 23.8901 8.26233L21.1849 7.23842C20.6849 7.04918 20.2875 6.65176 20.0982 6.15177L19.0743 3.44658Z" fill="url(#paint0_linear_gemini)"/>
        <path d="M9.81432 2.05063C9.53036 1.30034 8.46467 1.30033 8.18072 2.05063L6.31853 6.97126C5.97441 7.88055 5.25892 8.59604 4.34963 8.94016L-0.571002 10.8023C-1.3213 11.0863 -1.3213 12.152 -0.571002 12.436L4.34963 14.2981C5.25892 14.6423 5.97441 15.3577 6.31853 16.267L8.18072 21.1877C8.46467 21.938 9.53036 21.938 9.81432 21.1877L11.6765 16.267C12.0206 15.3577 12.7361 14.6423 13.6454 14.2981L18.566 12.436C19.3163 12.152 19.3163 11.0863 18.566 10.8023L13.6454 8.94016C12.7361 8.59604 12.0206 7.88055 11.6765 6.97126L9.81432 2.05063Z" fill="url(#paint1_linear_gemini)"/>
        <defs>
            <linearGradient id="paint0_linear_gemini" x1="18.6252" y1="3.24996" x2="18.6252" y2="14.1729" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4E79E3"/>
                <stop offset="1" stopColor="#D66C8C"/>
            </linearGradient>
            <linearGradient id="paint1_linear_gemini" x1="8.99752" y1="1.71078" x2="8.99752" y2="21.5275" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4E79E3"/>
                <stop offset="1" stopColor="#D66C8C"/>
            </linearGradient>
        </defs>
    </svg>
);

export const OpenAIIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
         <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 9.5267 2a6.0282 6.0282 0 0 0-5.7931 4.1017 6.1892 6.1892 0 0 0-.8913 5.8617A5.9922 5.9922 0 0 0 3.355 16.891a6.0505 6.0505 0 0 0 6.5173 2.9037 6.0543 6.0543 0 0 0 5.7275-3.0125 6.0271 6.0271 0 0 0 5.7963-4.1026 6.0792 6.0792 0 0 0 .8858-2.8585Zm-4.8872-3.111c.7176.6219 1.1396 1.4883 1.1892 2.438l-2.9238 1.6888c-.2863-.9904-.9697-1.7826-1.8797-2.1812l3.6143-1.9456ZM19.53 11.235c-.1907.9351-.6924 1.7672-1.42 2.348l-1.9806-3.7667 3.4006-1.83v3.2487ZM14.4754 3.125a4.4146 4.4146 0 0 1 2.3887 1.2828l-3.3768 2.0191c-.9118-.3946-1.5977-1.1831-1.8845-2.1697l2.8726-1.1322Zm-6.5204.6657c.5996-.7238 1.4328-1.2224 2.3686-1.4116l1.832 3.4054-3.2519 1.7508-1.9298-3.5828.9811-.1618Zm-3.532 4.0416c-.193.935-.067 1.907.3601 2.771l3.3736-2.0163c.2872-.9881.9723-1.7786 1.884-2.176l-3.6154-1.943-2.0023 3.3643Zm.6521 6.556c.7176.623 1.6212.9228 2.5298.8406l-1.9298-3.5855 3.3985-1.8288-1.83 3.4026-2.1685 1.1711Zm6.2862 3.8443c-.5985.7227-1.4316 1.2202-2.3664 1.4095l-1.831-3.4037 3.2508-1.7508 1.9299 3.5828-.9833.1622Zm3.533-4.0437c.1919-.9351.066-1.9082-.3611-2.772l-3.3736 2.018c-.2862.9881-.9712 1.7776-1.8829 2.1749l3.6165 1.9442 2.0011-3.3651Zm.9083-2.9048-2.5852 1.3916-2.6738-1.543 2.582-1.3895 2.677 1.541Z"/>
    </svg>
);

export const DeepSeekIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
       <path d="M16.946 7.027c-3.14-1.716-6.64-1.722-10.236-.337-.892.344-1.637.77-2.361 1.258 0 0 2.228-2.612 2.544-2.73 2.173-.812 4.498-1.174 6.815-.97 2.14.188 4.22.955 6.002 2.235l-2.764.544zM4.349 7.948c-.968.647-1.82 1.353-2.368 2.015.688-.85 1.41-1.644 2.235-2.29 2.809-2.193 6.643-3.138 10.236-2.337l-2.765 1.544c-2.458-.598-5.01-.225-7.338 1.068z" fill="#4D6BFE"/>
       <path d="M2.35 9.963c-.42.508-.68 1.057-.866 1.603.208-.636.57-1.32 1.062-1.916 2.808-3.4 8.046-4.996 12.37-3.666l-3.2 1.8c-2.885-1.002-6.425.042-9.366 2.18zM1.484 11.566c-.167.49-.236.92-.284 1.264.03-.33.064-.78.226-1.31 1.708-5.61 9.206-7.39 13.97-3.328l-3.2 1.8c-3.05-2.63-7.904-1.55-10.712 1.574z" fill="#4D6BFE"/>
       <path d="M19.49 14.5c0 3.315-2.685 6-6 6s-6-2.685-6-6 2.685-6 6-6 6 2.685 6 6z" fill="#4D6BFE" fillOpacity="0.9"/>
       <path d="M15.5 14.5c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z" fill="#FFF"/>
    </svg>
);


export const LinkedInIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

export const GithubIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);

export const StripeIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.155 2.592L6.155 21.408C8.324 21.798 13.987 20.803 16.633 15.602C19.279 10.4 18.283 4.74 17.848 2.592H10.155Z" fill="#635BFF"/>
        <path d="M12.001 2.592H4.309C3.874 4.74 2.878 10.4 5.524 15.602C8.17 20.803 13.833 21.798 16.002 21.408L12.001 2.592Z" fill="#635BFF" opacity="0.6"/>
    </svg>
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
    <svg {...defaultProps} className={className} viewBox="0 0 24 24">
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v12c0 1.66 3.58 3 8 3s8 -1.34 8 -3v-12" />
        <path d="M4 12c0 1.66 3.58 3 8 3s8 -1.34 8 -3" />
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
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
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

export const PaperclipIcon = ({ className = "w-6 h-6" }: IconProps) => (
  <svg {...defaultProps} className={className} viewBox="0 0 24 24">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

export const SupabaseIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.3333 1.33331L3.33333 13.8333H12.5L10.8333 22.1666L20.8333 9.66665H11.6667L13.3333 1.33331Z" stroke="#3ECF8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
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
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
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