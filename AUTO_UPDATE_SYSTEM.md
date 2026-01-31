# Marcus Auto-Update System

## 🎯 Overview
Marcus now includes a comprehensive auto-update system that automatically checks for new versions, downloads updates, and installs them. The system supports both GitHub releases and Google Drive distribution.

## 🚀 Features

### 🔄 **Auto-Update Capabilities**
- **Automatic Version Checking**: Checks for updates every 30 minutes
- **Multiple Sources**: Supports GitHub releases and Google Drive
- **Background Downloads**: Downloads updates in the background
- **Silent Installation**: Installs updates when app restarts
- **User Notifications**: Shows update progress and completion
- **Configuration Panel**: Users can configure update sources

### 📦 **Update Sources**

#### **GitHub Releases** (Primary)
- **Repository**: `Okami0x0/Dera-tak-demo-playgrounds`
- **Automatic Detection**: Checks for new releases
- **Secure Downloads**: Uses GitHub's secure download URLs
- **Version Comparison**: Compares semantic versions automatically

#### **Google Drive** (Alternative)
- **Custom Folder**: Configurable Google Drive folder
- **OAuth2 Authentication**: Secure Google Drive access
- **File Detection**: Looks for `.exe` files with version numbers
- **Direct Downloads**: Downloads directly from Drive

### 🎛️ **User Interface**

#### **Update Manager Panel**
- **Status Display**: Shows current update status
- **Progress Tracking**: Real-time download progress
- **Version Information**: Current and available versions
- **Manual Controls**: Check, download, and install buttons
- **Settings Panel**: Configure Google Drive settings

#### **Update States**
- **Checking**: Searching for updates
- **Available**: New version found
- **Downloading**: Downloading update
- **Downloaded**: Update ready to install
- **Error**: Update process failed

## 🛠️ **Technical Implementation**

### **Core Components**

#### **AutoUpdateService** (`services/autoUpdateService.ts`)
```typescript
class AutoUpdateService {
  // Check for updates from multiple sources
  async checkForUpdates(): Promise<{ hasUpdate: boolean; info?: any; error?: string }>
  
  // Download updates from GitHub or Google Drive
  async downloadUpdate(): Promise<{ success: boolean; error?: string; downloadPath?: string }>
  
  // Install update and restart app
  installUpdate(): void
  
  // Configure Google Drive settings
  getUpdateConfig(): Promise<UpdateConfig>
  setUpdateConfig(config: Partial<UpdateConfig>): Promise<UpdateConfig>
}
```

#### **AutoUpdateManager** (`components/AutoUpdateManager.tsx`)
- React component for update UI
- Real-time status updates
- Configuration management
- User interaction handling

### **Integration Points**

#### **Main Process** (`electron/main.ts`)
```typescript
// Initialize auto-update service
autoUpdateService = new AutoUpdateService();
autoUpdateService.startUpdateCheck(30); // Check every 30 minutes

// IPC handlers for renderer communication
ipcMain.handle('check-for-updates', () => autoUpdateService.checkForUpdates());
ipcMain.handle('download-update', () => autoUpdateService.downloadUpdate());
ipcMain.handle('install-update', () => autoUpdateService.installUpdate());
```

#### **Preload Script** (`electron/preload.ts`)
```typescript
// Expose update APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback)
});
```

### **Configuration**

#### **Google Drive Setup**
```typescript
interface UpdateConfig {
  clientId: string;        // Google OAuth2 Client ID
  clientSecret: string;   // Google OAuth2 Client Secret
  redirectUri: string;    // OAuth2 Redirect URI
  refreshToken: string;    // OAuth2 Refresh Token
  folderId: string;       // Google Drive Folder ID
}
```

#### **Environment Variables**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
```

## 📋 **Usage Instructions**

### **For Users**

#### **Automatic Updates**
1. **Startup**: Marcus automatically checks for updates on launch
2. **Background**: Checks every 30 minutes in background
3. **Notification**: Shows notification when update available
4. **Download**: Downloads automatically (configurable)
5. **Install**: Installs when user restarts app

#### **Manual Updates**
1. **Open Update Panel**: Click update icon in top-right corner
2. **Check Updates**: Click "Check" button
3. **Download**: Click "Download" if update available
4. **Install**: Click "Install & Restart" when ready

#### **Configure Google Drive**
1. **Settings Panel**: Click settings icon in update panel
2. **Enter Credentials**: Fill in Google Drive configuration
3. **Save**: Click "Save" to store configuration
4. **Test**: Use "Check" to test connection

### **For Developers**

#### **GitHub Releases Setup**
1. **Create Release**: Create new release on GitHub
2. **Upload Assets**: Upload `.exe` installer
3. **Version Tag**: Use semantic version (e.g., `v1.8.0`)
4. **Release Notes**: Add release notes
5. **Publish**: Make release public

#### **Google Drive Setup**
1. **Create Folder**: Create folder for updates
2. **Get Folder ID**: Copy folder ID from URL
3. **OAuth2 Setup**: Create Google OAuth2 credentials
4. **Get Refresh Token**: Generate refresh token
5. **Configure**: Set up configuration in Marcus

## 🔧 **Configuration Guide**

### **GitHub Releases (Recommended)**

#### **Setup Steps**
1. **Repository**: Use `Okami0x0/Dera-tak-demo-playgrounds`
2. **Release Naming**: Use format `vX.Y.Z` (e.g., `v1.8.0`)
3. **Asset Naming**: Use format `Dera-tak-Demo-Assistant-Setup-X.Y.Z.exe`
4. **Automatic**: No additional configuration needed

#### **Build Command**
```bash
npm run electron:build -- --win
```

### **Google Drive (Alternative)**

#### **OAuth2 Setup**
1. **Google Cloud Console**: Create new project
2. **Enable Drive API**: Enable Google Drive API
3. **Create Credentials**: Create OAuth2 Client ID
4. **Set Redirect URI**: Set to `http://localhost:3000/callback`
5. **Get Refresh Token**: Use OAuth2 flow to get refresh token

#### **Folder Setup**
1. **Create Folder**: Create folder in Google Drive
2. **Share Settings**: Set appropriate sharing settings
3. **Get Folder ID**: Copy ID from folder URL
4. **Upload Files**: Upload `.exe` files with version in name

#### **Configuration File**
```json
{
  "clientId": "your_google_client_id",
  "clientSecret": "your_google_client_secret", 
  "redirectUri": "http://localhost:3000/callback",
  "refreshToken": "your_google_refresh_token",
  "folderId": "your_drive_folder_id"
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Update Not Found**
- **Check Internet**: Ensure internet connection
- **Verify Repository**: Check GitHub repository URL
- **Version Format**: Ensure version follows semantic format
- **File Naming**: Check file naming convention

#### **Download Failed**
- **Permissions**: Check download folder permissions
- **Disk Space**: Ensure enough disk space
- **Network**: Check network stability
- **Authentication**: Verify Google Drive credentials

#### **Installation Failed**
- **Permissions**: Run as administrator if needed
- **Antivirus**: Check antivirus blocking
- **Running Apps**: Close other applications
- **Disk Space**: Ensure enough space for installation

### **Debug Information**

#### **Enable Debug Logging**
```typescript
// In main.ts
console.log('Auto-update service initialized');
console.log('Update check interval:', 30, 'minutes');
```

#### **Check Configuration**
```typescript
// Verify configuration
const config = await autoUpdateService.getUpdateConfig();
console.log('Update config:', config);
```

#### **Update Status**
```typescript
// Monitor update status
window.electronAPI.onUpdateStatus((event, { status, data }) => {
  console.log('Update status:', status, data);
});
```

## 📊 **System Requirements**

### **Minimum Requirements**
- **Node.js**: 18.0.0 or higher
- **Electron**: 40.0.0 or higher
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB free space
- **Network**: Internet connection for updates

### **Recommended Requirements**
- **Node.js**: 20.0.0 or higher
- **Memory**: 8GB RAM or higher
- **Storage**: 1GB free space
- **Network**: Stable broadband connection

## 🎉 **Benefits**

### **For Users**
- **🔄 Automatic Updates**: No manual checking required
- **🔒 Secure Downloads**: Verified from trusted sources
- **⚡ Background Operation**: No interruption to workflow
- **📱 User Friendly**: Simple interface and notifications
- **🛡️ Safe Installation**: Verified and tested updates

### **For Developers**
- **🚀 Easy Distribution**: Multiple distribution channels
- **📊 Analytics**: Track update adoption
- **🔧 Flexible Configuration**: Customizable update sources
- **🛠️ Maintenance-Free**: Automated update process
- **📈 Scalable**: Works for large user bases

## 🔄 **Update Process Flow**

```
App Startup
    ↓
Initialize AutoUpdateService
    ↓
Check for Updates (GitHub + Google Drive)
    ↓
If Update Available → Show Notification
    ↓
User Chooses Download → Start Download
    ↓
Download Progress → Show Progress Bar
    ↓
Download Complete → Ready to Install
    ↓
User Chooses Install → Restart & Install
    ↓
Update Installed → Launch New Version
```

---

**Marcus Auto-Update System** - Keeping your AI assistant always up-to-date! 🚀✨
