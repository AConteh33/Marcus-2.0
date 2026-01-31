import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Terminal execution
  executeTerminal: (command: string) => ipcRenderer.invoke('execute-terminal', command),
  
  // Terminal server control
  startTerminalServer: () => ipcRenderer.invoke('start-terminal-server'),
  stopTerminalServer: () => ipcRenderer.invoke('stop-terminal-server'),
  getTerminalStatus: () => ipcRenderer.invoke('get-terminal-status'),
  
  // Auto-update methods
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Auto-update events
  onUpdateStatus: (callback: (event: any, data: any) => void) => {
    ipcRenderer.on('update-status', callback);
  },
  removeAllUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-status');
  },
  
  // Mouse and keyboard control
  mouseControl: (args: any) => ipcRenderer.invoke('mouse-control', args),
  keyboardControl: (args: any) => ipcRenderer.invoke('keyboard-control', args)
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      executeTerminal: (command: string) => Promise<string>;
      startTerminalServer: () => Promise<string>;
      stopTerminalServer: () => Promise<string>;
      getTerminalStatus: () => Promise<string>;
      checkForUpdates: () => Promise<any>;
      downloadUpdate: () => Promise<any>;
      installUpdate: () => Promise<void>;
      getAppVersion: () => Promise<string>;
      onUpdateStatus: (callback: (event: any, data: any) => void) => void;
      removeAllUpdateListeners: () => void;
      mouseControl: (args: any) => Promise<string>;
      keyboardControl: (args: any) => Promise<string>;
    };
  }
}
