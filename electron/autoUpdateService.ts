import { autoUpdater } from 'electron-updater';
import { app, dialog, ipcMain } from 'electron';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes?: string;
  mandatory?: boolean;
}

export class AutoUpdateService {
  private isCheckingForUpdates = false;
  private updateInfo: UpdateInfo | null = null;

  constructor() {
    // Configure auto-updater for GitHub releases only
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Set up event listeners
    this.setupEventListeners();
    this.setupIpcHandlers();
  }

  private setupEventListeners() {
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
      this.sendUpdateStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      this.updateInfo = {
        version: info.version,
        downloadUrl: (info as any).downloadURL || '',
        releaseNotes: Array.isArray((info as any).releaseNotes) 
          ? JSON.stringify((info as any).releaseNotes)
          : (info as any).releaseNotes || ''
      };
      this.sendUpdateStatus('available', {
        version: info.version,
        downloadUrl: (info as any).downloadURL
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info);
      this.sendUpdateStatus('idle');
    });

    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
      this.sendUpdateStatus('error', err.message);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const progress = Math.round(progressObj.percent);
      this.sendUpdateStatus('downloading', { progress });
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      this.sendUpdateStatus('downloaded');
    });
  }

  private setupIpcHandlers() {
    ipcMain.handle('check-for-updates', async () => {
      if (this.isCheckingForUpdates) {
        return { hasUpdate: false, error: 'Already checking for updates' };
      }
      return await this.checkForUpdates();
    });

    ipcMain.handle('download-update', async () => {
      if (!this.updateInfo) {
        return { success: false, error: 'No update available' };
      }
      return await this.downloadUpdate();
    });

    ipcMain.handle('install-update', async () => {
      if (!this.updateInfo) {
        throw new Error('No update available');
      }
      return await this.installUpdate();
    });

    ipcMain.handle('get-app-version', async () => {
      return app.getVersion();
    });
  }

  private sendUpdateStatus(status: string, data?: any) {
    // Send status to renderer process
    if (global.mainWindow) {
      global.mainWindow.webContents.send('update-status', { status, data });
    }
  }

  async checkForUpdates(): Promise<{ hasUpdate: boolean; info?: any; error?: string }> {
    try {
      this.isCheckingForUpdates = true;
      this.sendUpdateStatus('checking');

      console.log('Checking GitHub for updates...');
      
      // Use electron-updater for GitHub releases only
      return new Promise((resolve) => {
        autoUpdater.checkForUpdatesAndNotify().then((updateInfo) => {
          if (updateInfo && updateInfo.updateInfo && updateInfo.updateInfo.version) {
            const currentVersion = app.getVersion();
            const latestVersion = updateInfo.updateInfo.version;
            
            if (this.isNewerVersion(latestVersion, currentVersion)) {
              this.updateInfo = {
                version: latestVersion,
                downloadUrl: (updateInfo.updateInfo as any).downloadURL || '',
                releaseNotes: Array.isArray((updateInfo.updateInfo as any).releaseNotes) 
                  ? JSON.stringify((updateInfo.updateInfo as any).releaseNotes)
                  : (updateInfo.updateInfo as any).releaseNotes || ''
              };
              
              this.sendUpdateStatus('available', {
                version: latestVersion,
                downloadUrl: (updateInfo.updateInfo as any).downloadURL
              });
              
              resolve({ 
                hasUpdate: true, 
                info: this.updateInfo 
              });
            } else {
              this.sendUpdateStatus('idle');
              resolve({ hasUpdate: false });
            }
          } else {
            this.sendUpdateStatus('idle');
            resolve({ hasUpdate: false });
          }
        }).catch((error) => {
          console.error('GitHub update check failed:', error);
          this.sendUpdateStatus('error', error.message);
          resolve({ hasUpdate: false, error: error.message });
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Update check failed:', errorMessage);
      this.sendUpdateStatus('error', errorMessage);
      return { hasUpdate: false, error: errorMessage };
    } finally {
      this.isCheckingForUpdates = false;
    }
  }

  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
    
    return false;
  }

  async downloadUpdate(): Promise<{ success: boolean; error?: string; downloadPath?: string }> {
    try {
      if (!this.updateInfo) {
        return { success: false, error: 'No update available' };
      }

      this.sendUpdateStatus('downloading');

      // Use electron-updater's download method for GitHub releases
      await autoUpdater.downloadUpdate();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      console.error('Download failed:', errorMessage);
      this.sendUpdateStatus('error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async installUpdate(): Promise<void> {
    try {
      if (!this.updateInfo) {
        throw new Error('No update available');
      }

      this.sendUpdateStatus('installing');
      
      // Show confirmation dialog before installing
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Install Update',
        message: 'Marcus will now restart to install the update.',
        detail: 'Any unsaved work will be lost. Make sure to save your work before continuing.',
        buttons: ['Install Now', 'Cancel'],
        defaultId: 0,
        cancelId: 1
      });

      if (result.response === 0) {
        // Use electron-updater's install method
        autoUpdater.quitAndInstall();
      } else {
        this.sendUpdateStatus('downloaded');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Installation failed';
      console.error('Installation failed:', errorMessage);
      this.sendUpdateStatus('error', errorMessage);
      throw error;
    }
  }

  startUpdateCheck(intervalMinutes: number = 30) {
    // Check for updates immediately
    this.checkForUpdates();

    // Set up periodic checks
    setInterval(() => {
      if (!this.isCheckingForUpdates) {
        this.checkForUpdates();
      }
    }, intervalMinutes * 60 * 1000);
  }
}