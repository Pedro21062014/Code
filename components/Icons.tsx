
import React from 'react';

const iconProps = {
  className: "w-6 h-6",
  strokeWidth: 1.5,
  stroke: "currentColor",
  fill: "none",
  strokeLinecap: "round" as "round",
  strokeLinejoin: "round" as "round",
};

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

export const CloseIcon = () => (
  <svg {...iconProps} className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </svg>
);

export const SparklesIcon = () => (
    <svg {...iconProps} className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.25 2.5a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1-.75-.75v-2zM4.75 8.5a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1-.75-.75v-2zm12-2a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1-.75-.75v-2zM11 15.25a.75.75 0 0 0-1.5 0v2a.75.75 0 0 0 1.5 0v-2zm-5.42 2.47a.75.75 0 0 1 1.06-.02l1.439 1.44a.75.75 0 0 1-1.06 1.06l-1.44-1.439a.75.75 0 0 1 .001-1.06zm12.84 0a.75.75 0 0 0-1.06-.02l-1.439 1.44a.75.75 0 1 0 1.06 1.06l1.44-1.439a.75.75 0 0 0-.001-1.06z" />
    </svg>
);
