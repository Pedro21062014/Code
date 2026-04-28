import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { getWebContainer } from '../lib/webcontainer';

interface TerminalPaneProps {
  onServerReady?: (url: string) => void;
  env?: Record<string, string>;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ onServerReady, env = {} }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const fitAddon = new FitAddon();
    const xterm = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e'
      }
    });

    xterm.loadAddon(fitAddon);
    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    let shellProcess: any;

    const startShell = async () => {
      const webcontainerInstance = await getWebContainer();
      
      webcontainerInstance.on('server-ready', (port: number, url: string) => {
        if (onServerReady) {
          onServerReady(url);
        }
      });

      // Start the shell, passing our env vars
      shellProcess = await webcontainerInstance.spawn('jsh', {
        env,
      });

      // Pipe to terminal
      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            xterm.write(data);
          },
        })
      );

      // Pipe from terminal
      const input = shellProcess.input.getWriter();
      xterm.onData((data) => {
        input.write(data);
      });
    };

    startShell();

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (shellProcess) {
        shellProcess.kill();
      }
      xterm.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Boot shell exactly once on mount, or re-boot if we want to change env deeply? For simplicity, we keep it simple or reboot when env changes.

  return (
    <div className="h-full w-full bg-[#1e1e1e] p-2 overflow-hidden" ref={terminalRef} />
  );
};
