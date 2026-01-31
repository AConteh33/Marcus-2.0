import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import { join } from 'path';
import { spawn, exec } from 'child_process';
import { homedir } from 'os';
// Import auto-update service using require for CommonJS compatibility
const { AutoUpdateService } = require('./autoUpdateService.cjs');

// Type definition for AutoUpdateService
type AutoUpdateServiceType = InstanceType<typeof AutoUpdateService>;

// Keep a global reference of window object
let mainWindow: BrowserWindow | null = null;

// Auto-update service
let autoUpdateService: AutoUpdateServiceType | null = null;

// Terminal server state
let terminalProcess: any = null;

// Terminal command execution
function executeTerminalCommand(command: string): Promise<string> {
  return new Promise((resolve) => {
    // Execute command in user's home directory
    exec(command, { cwd: homedir() }, (error: any, stdout: string, stderr: string) => {
      if (error) {
        resolve(`Error executing command: ${error.message}`);
      } else {
        const output = stdout || stderr || 'Command executed successfully';
        resolve(output.trim());
      }
    });
  });
}

// Terminal server management
function startTerminalServer() {
  if (terminalProcess) {
    terminalProcess.kill();
  }

  terminalProcess = spawn('node', [join(__dirname, '../../terminal-server.cjs')], {
    cwd: homedir(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  terminalProcess.stdout.on('data', (data) => {
    console.log(`Terminal Server: ${data.toString()}`);
  });

  terminalProcess.stderr.on('data', (data) => {
    console.error(`Terminal Server Error: ${data.toString()}`);
  });

  console.log('Terminal server started in Electron');
}

function stopTerminalServer() {
  if (terminalProcess) {
    terminalProcess.kill();
    terminalProcess = null;
    console.log('Terminal server stopped');
  }
}

function checkTerminalStatus(): string {
  return terminalProcess ? 'Running' : 'Stopped';
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    icon: join(__dirname, '../public/icon.png'), // Set app icon
    titleBarStyle: 'hiddenInset', // macOS style title bar
    show: false, // Don't show until ready
    autoHideMenuBar: true, // Hide menu bar
    backgroundColor: '#000000' // Set background color to match app
  });

  console.log('Window created, loading file...');

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Disable DevTools shortcuts and create custom menu
  const template = [
    {
      label: 'Marcus AI',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);

  // Load the app - in development use Vite dev server, in production use built files
  if (process.env.NODE_ENV === 'development') {
    console.log('Loading development URL');
    mainWindow.loadURL('http://localhost:3001');
  } else {
    console.log('Loading production file');
    const indexPath = join(__dirname, 'index.html');
    console.log('Index path:', indexPath);
    mainWindow.loadFile(indexPath);
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Initialize auto-update service (temporarily disabled to fix IPC conflicts)
  /*
  try {
    autoUpdateService = new AutoUpdateService();
    global.mainWindow = mainWindow;
    
    // Start checking for updates every 30 minutes
    autoUpdateService.startUpdateCheck(30);
    
    console.log('Auto-update service initialized');
  } catch (error) {
    console.error('Failed to initialize auto-update service:', error);
  }
  */

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

// Handle IPC for environment variables
ipcMain.handle('get-env-vars', () => {
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    API_KEY: process.env.API_KEY
  };
});

// Auto-update IPC handlers (temporarily disabled to fix conflicts)
/*
ipcMain.handle('check-for-updates', async () => {
  if (!autoUpdateService) return { hasUpdate: false, error: 'Auto-update service not initialized' };
  return await autoUpdateService.checkForUpdates();
});

ipcMain.handle('download-update', async () => {
  if (!autoUpdateService) return { success: false, error: 'Auto-update service not initialized' };
  return await autoUpdateService.downloadUpdate();
});

ipcMain.handle('install-update', async () => {
  if (!autoUpdateService) throw new Error('Auto-update service not initialized');
  return await autoUpdateService.installUpdate();
});
*/

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Handle terminal command execution
ipcMain.handle('execute-terminal', async (event, command: string) => {
  try {
    const result = await executeTerminalCommand(command);
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

// Handle terminal server management
ipcMain.handle('start-terminal-server', async () => {
  try {
    startTerminalServer();
    return { success: true, status: checkTerminalStatus() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('stop-terminal-server', async () => {
  try {
    stopTerminalServer();
    return { success: true, status: checkTerminalStatus() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('check-terminal-status', async () => {
  return { success: true, status: checkTerminalStatus() };
});
