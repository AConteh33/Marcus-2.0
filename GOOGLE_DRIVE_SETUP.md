# Google Drive Setup for Marcus Auto-Updates

## 🎯 Overview
This guide walks you through setting up Google Drive as an alternative distribution source for Marcus auto-updates.

## 📋 Prerequisites
- Google Account with Drive access
- Google Cloud Console project
- Marcus application with auto-update system

## 🔧 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Project name: `Marcus Auto-Updates`
   - Click "Create"

3. **Enable Google Drive API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click on it and press "Enable"

### Step 2: Create OAuth2 Credentials

1. **Create OAuth2 Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (for testing) or "Internal" (for organization)
   - Fill in required fields:
     - App name: `Marcus Auto-Updates`
     - User support email: `your-email@example.com`
     - Developer contact: `your-email@example.com`
   - Click "Save and Continue"

2. **Configure Scopes**
   - Click "Add or Remove Scopes"
   - Search for and add:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/drive.metadata.readonly`
   - Click "Save and Continue"

3. **Create Test Users (if External)**
   - Add your Google account as a test user
   - Click "Save and Continue"

4. **Create Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: `Marcus Auto-Update Client`
   - Authorized redirect URIs:
     - Click "Add URI"
     - Enter: `http://localhost:3000/callback`
   - Click "Create"

5. **Save Your Credentials**
   - **Client ID**: Copy and save
   - **Client Secret**: Copy and save (keep this secure!)

### Step 3: Get Refresh Token

1. **Create OAuth2 Flow Script**
   Create a temporary script to get your refresh token:

```javascript
// get-refresh-token.js
const { google } = require('googleapis');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Important for refresh token
  scope: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
  ],
  prompt: 'consent' // Force consent dialog
});

console.log('Authorize this app by visiting this URL:');
console.log(authUrl);
```

2. **Run the Script**
```bash
node get-refresh-token.js
```

3. **Get Authorization Code**
   - Copy the URL from the script output
   - Paste it in your browser
   - Sign in and grant permissions
   - You'll be redirected to a page (might show error)
   - Copy the `code` parameter from the URL

4. **Exchange Code for Tokens**
```javascript
// exchange-code.js
const { google } = require('googleapis');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_CODE = 'CODE_FROM_BROWSER';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.getToken(AUTH_CODE, (err, tokens) => {
  if (err) {
    console.error('Error retrieving access token:', err);
    return;
  }
  
  console.log('Refresh Token:', tokens.refresh_token);
  console.log('Access Token:', tokens.access_token);
});
```

5. **Run Exchange Script**
```bash
node exchange-code.js
```

6. **Save Your Refresh Token**
   - Copy the refresh token and save it securely

### Step 4: Create Google Drive Folder

1. **Create Update Folder**
   - Go to Google Drive (https://drive.google.com)
   - Create a new folder named `Marcus Updates`
   - Make sure it's accessible with your account

2. **Get Folder ID**
   - Open the folder
   - Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID`
   - Copy the `FOLDER_ID` part

3. **Set Folder Sharing (Optional)**
   - Right-click folder → "Share"
   - Add any additional users if needed
   - Set appropriate permissions

### Step 5: Upload Update Files

1. **Prepare Update Files**
   - Build your Marcus application: `npm run electron:build -- --win`
   - Locate the `.exe` file in `release/` directory
   - Rename files with version numbers:
     - Example: `marcus-1.8.0-setup.exe`
     - Example: `marcus-1.8.1-setup.exe`

2. **Upload to Google Drive**
   - Go to your `Marcus Updates` folder
   - Upload the `.exe` files
   - Wait for upload to complete

3. **Verify Files**
   - Check that files are uploaded correctly
   - Ensure version numbers are in filenames

### Step 6: Configure Marcus

1. **Open Marcus Application**
   - Launch Marcus application
   - Look for the auto-update icon (top-right corner)

2. **Open Update Settings**
   - Click the settings icon in the update panel
   - Fill in your Google Drive configuration:

```
Client ID: YOUR_GOOGLE_CLIENT_ID
Client Secret: YOUR_GOOGLE_CLIENT_SECRET
Redirect URI: http://localhost:3000/callback
Refresh Token: YOUR_GOOGLE_REFRESH_TOKEN
Folder ID: YOUR_DRIVE_FOLDER_ID
```

3. **Save Configuration**
   - Click "Save" to store the configuration
   - The settings are saved to `~/.marcus-update-config.json`

4. **Test Configuration**
   - Click "Check" button to test the connection
   - Should show "Update available" if files are found

### Step 7: Test Auto-Update

1. **Manual Update Check**
   - Click "Check" button in update panel
   - Should detect new version if available
   - Status should show "Available"

2. **Download Update**
   - Click "Download" button
   - Monitor download progress
   - File should download to `Downloads/` folder

3. **Install Update**
   - Click "Install & Restart" when ready
   - Application should restart with new version

## 🔧 Configuration File

### **Location**: `~/.marcus-update-config.json`

```json
{
  "clientId": "your_google_client_id",
  "clientSecret": "your_google_client_secret",
  "redirectUri": "http://localhost:3000/callback",
  "refreshToken": "your_google_refresh_token",
  "folderId": "your_drive_folder_id"
}
```

## 📋 File Naming Convention

### **Required Format**
- Files must contain version numbers in the name
- Use semantic versioning: `X.Y.Z`
- Include `.exe` extension

### **Examples**
```
marcus-1.8.0-setup.exe
marcus-1.8.1-setup.exe
marcus-2.0.0-setup.exe
```

### **Version Detection**
The system extracts version numbers using regex:
```javascript
const versionMatch = filename.match(/(\d+\.\d+\.\d+)/);
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Authentication Failed**
- **Check Credentials**: Verify Client ID and Secret
- **Refresh Token**: Ensure refresh token is valid
- **Redirect URI**: Must match exactly `http://localhost:3000/callback`

#### **No Updates Found**
- **Folder ID**: Verify folder ID is correct
- **File Naming**: Check version numbers in filenames
- **Permissions**: Ensure Drive API is enabled

#### **Download Failed**
- **File Access**: Check file permissions in Drive
- **Network**: Verify internet connection
- **Storage**: Ensure enough disk space

### **Debug Information**

#### **Check Configuration**
```javascript
// In browser console
const config = await window.electronAPI.getUpdateConfig();
console.log('Config:', config);
```

#### **Test Connection**
```javascript
// Test Google Drive API
const result = await window.electronAPI.checkGoogleDriveUpdates();
console.log('Drive check:', result);
```

#### **Monitor Status**
```javascript
// Listen for update events
window.electronAPI.onUpdateStatus((event, data) => {
  console.log('Update status:', data);
});
```

## 🔒 Security Considerations

### **Protect Your Credentials**
- **Client Secret**: Keep it secure and never share
- **Refresh Token**: Store securely, rotate regularly
- **Configuration File**: Limit access to the config file

### **Best Practices**
- **Service Account**: Consider using service account for production
- **Limited Scopes**: Only request necessary permissions
- **Regular Rotation**: Rotate refresh tokens periodically
- **Monitoring**: Monitor API usage and access

## 📊 Monitoring and Maintenance

### **Regular Tasks**
- **Check API Usage**: Monitor Google Drive API quotas
- **Update Files**: Remove old versions to save space
- **Test Updates**: Regularly test update process
- **Security Audit**: Review credentials and permissions

### **Automation Options**
- **CI/CD Integration**: Automate file uploads
- **Scheduled Checks**: Set up automated testing
- **Backup Config**: Backup configuration files

---

**Google Drive Setup Complete!** 🎉

You now have Marcus auto-updates configured with Google Drive distribution! 🚀
