import { autoUpdater } from 'electron-updater';
import { app, dialog, ipcMain } from 'electron';
import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface UpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes?: string;
  mandatory?: boolean;
}

interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  folderId: string;
}

export class AutoUpdateService {
  private isCheckingForUpdates = false;
  private updateInfo: UpdateInfo | null = null;
  private configPath: string;
  private config: GoogleDriveConfig;

  constructor() {
    this.configPath = join(homedir(), '.marcus-update-config.json');
    this.config = this.loadConfig();
    this.setupAutoUpdater();
    this.setupIpcHandlers();
  }

  private loadConfig(): GoogleDriveConfig {
    try {
      if (existsSync(this.configPath)) {
        const configData = readFileSync(this.configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error('Failed to load update config:', error);
    }

    // Default config - should be configured by user
    return {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: 'http://localhost:3000/callback',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || ''
    };
  }

  private saveConfig() {
    try {
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save update config:', error);
    }
  }

  private setupAutoUpdater() {
    // Configure electron-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    // Event handlers
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
      this.sendUpdateStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      this.updateInfo = {
        version: info.version,
        downloadUrl: (info as any).downloadURL || '',
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : JSON.stringify(info.releaseNotes),
        mandatory: (info as any).mandatory
      };
      this.sendUpdateStatus('available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available:', info);
      this.sendUpdateStatus('not-available', info);
    });

    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
      this.sendUpdateStatus('error', { message: err.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const progress = Math.round(progressObj.percent);
      console.log(`Download progress: ${progress}%`);
      this.sendUpdateStatus('downloading', { progress });
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      this.sendUpdateStatus('downloaded', info);
      
      // Show dialog to restart app
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart the application to apply the update.',
        buttons: ['Restart Now', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }

  private setupIpcHandlers() {
    ipcMain.handle('check-for-updates', async () => {
      return await this.checkForUpdates();
    });

    ipcMain.handle('download-update', async () => {
      return await this.downloadUpdate();
    });

    ipcMain.handle('install-update', () => {
      autoUpdater.quitAndInstall();
    });

    ipcMain.handle('get-update-config', () => {
      return this.config;
    });

    ipcMain.handle('set-update-config', (event, config: Partial<GoogleDriveConfig>) => {
      this.config = { ...this.config, ...config };
      this.saveConfig();
      return this.config;
    });

    ipcMain.handle('check-google-drive-updates', async () => {
      return await this.checkGoogleDriveUpdates();
    });
  }

  private sendUpdateStatus(status: string, data?: any) {
    // Send status to renderer process
    if (global.mainWindow) {
      global.mainWindow.webContents.send('update-status', { status, data });
    }
  }

  async checkForUpdates(): Promise<{ hasUpdate: boolean; info?: any; error?: string }> {
    if (this.isCheckingForUpdates) {
      return { hasUpdate: false };
    }

    this.isCheckingForUpdates = true;

    try {
      // Check GitHub releases first
      await autoUpdater.checkForUpdates();
      
      // Also check Google Drive
      const driveUpdate = await this.checkGoogleDriveUpdates();
      
      if (driveUpdate.hasUpdate) {
        return { hasUpdate: true, info: driveUpdate };
      }

      return { hasUpdate: false, info: this.updateInfo };
    } catch (error: any) {
      console.error('Check for updates failed:', error);
      return { hasUpdate: false, error: error.message };
    } finally {
      this.isCheckingForUpdates = false;
    }
  }

  private async checkGoogleDriveUpdates(): Promise<{ hasUpdate: boolean; info?: UpdateInfo }> {
    try {
      if (!this.config.refreshToken || !this.config.folderId) {
        console.log('Google Drive not configured for updates');
        return { hasUpdate: false };
      }

      const auth = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      auth.setCredentials({ refresh_token: this.config.refreshToken });

      const drive = google.drive({ version: 'v3', auth });

      // Get files in the update folder
      const response = await drive.files.list({
        q: `'${this.config.folderId}' in parents and name contains 'marcus' and name contains '.exe'`,
        fields: 'files(id, name, createdTime, size, webViewLink)',
        orderBy: 'createdTime desc'
      });

      const files = response.data.files;
      if (!files || files.length === 0) {
        return { hasUpdate: false };
      }

      const latestFile = files[0];
      const currentVersion = app.getVersion();

      // Extract version from filename (assuming format: marcus-1.8.0-setup.exe)
      const versionMatch = latestFile.name?.match(/(\d+\.\d+\.\d+)/);
      if (!versionMatch) {
        return { hasUpdate: false };
      }

      const latestVersion = versionMatch[1];
      
      if (this.isNewerVersion(latestVersion, currentVersion)) {
        const updateInfo: UpdateInfo = {
          version: latestVersion,
          downloadUrl: latestFile.webViewLink || '',
          releaseNotes: `New version ${latestVersion} available from Google Drive`,
          mandatory: false
        };

        return { hasUpdate: true, info: updateInfo };
      }

      return { hasUpdate: false };
    } catch (error) {
      console.error('Google Drive update check failed:', error);
      return { hasUpdate: false };
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

      // If it's a Google Drive update, we need custom download logic
      if (this.updateInfo.downloadUrl && this.updateInfo.downloadUrl.includes('drive.google.com')) {
        return await this.downloadGoogleDriveUpdate();
      }

      // Use electron-updater for GitHub releases
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error: any) {
      console.error('Download update failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async downloadGoogleDriveUpdate(): Promise<{ success: boolean; error?: string; downloadPath?: string }> {
    try {
      if (!this.config.refreshToken) {
        return { success: false, error: 'Google Drive not authenticated' };
      }

      const auth = new google.auth.OAuth2(
        this.config.clientId,
        this.config.clientSecret,
        this.config.redirectUri
      );

      auth.setCredentials({ refresh_token: this.config.refreshToken });

      const drive = google.drive({ version: 'v3', auth });

      // Get the latest file
      const response = await drive.files.list({
        q: `'${this.config.folderId}' in parents and name contains 'marcus' and name contains '.exe'`,
        fields: 'files(id, name)',
        orderBy: 'createdTime desc',
        pageSize: 1
      });

      const files = response.data.files;
      if (!files || files.length === 0) {
        return { success: false, error: 'No update file found' };
      }

      const fileId = files[0].id;
      
      // Download the file
      const downloadResponse = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      // Save to downloads folder
      const fs = require('fs');
      const path = require('path');
      const downloadsPath = join(homedir(), 'Downloads', files[0].name || 'marcus-update.exe');
      
      const writer = fs.createWriteStream(downloadsPath);
      downloadResponse.data.pipe(writer);

      return new Promise<{ success: boolean; error?: string; downloadPath?: string }>((resolve) => {
        writer.on('finish', () => {
          resolve({ 
            success: true, 
            downloadPath: downloadsPath
          });
        });
        writer.on('error', (error: any) => {
          resolve({ success: false, error: error.message });
        });
      });
    } catch (error: any) {
      console.error('Google Drive download failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Start checking for updates on interval
  startUpdateCheck(intervalMinutes: number = 60) {
    // Check immediately on start
    this.checkForUpdates();

    // Then check on interval
    setInterval(() => {
      this.checkForUpdates();
    }, intervalMinutes * 60 * 1000);
  }

  // Get current version info
  getCurrentVersion(): string {
    return app.getVersion();
  }

  // Check if update is available
  isUpdateAvailable(): boolean {
    return this.updateInfo !== null;
  }

  // Get update info
  getUpdateInfo(): UpdateInfo | null {
    return this.updateInfo;
  }
}
