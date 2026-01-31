# Quick Start: Google Drive Auto-Updates

## 🚀 5-Minute Setup Guide

### Step 1: Get Google Credentials (2 minutes)

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com/
   - Create new project: "Marcus Auto-Updates"
   - Enable "Google Drive API"

2. **Create OAuth2 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Create "OAuth client ID" → "Web application"
   - Add redirect URI: `http://localhost:3000/callback`
   - Save Client ID and Client Secret

### Step 2: Run Setup Script (1 minute)

```bash
# Set your credentials
export GOOGLE_CLIENT_ID="your_client_id_here"
export GOOGLE_CLIENT_SECRET="your_client_secret_here"

# Run the setup helper
cd /Users/ace/CascadeProjects/Marcus\ 1.9
node scripts/setup-google-drive.js
```

3. **Follow the browser instructions**
   - Open the URL provided
   - Sign in and grant permissions
   - Copy the refresh token from the output

### Step 3: Configure Marcus (1 minute)

1. **Open Marcus Application**
2. **Click update icon** (top-right corner)
3. **Click settings icon** in update panel
4. **Enter your credentials**:
   - Client ID: (from Step 1)
   - Client Secret: (from Step 1)
   - Refresh Token: (from Step 2)
   - Folder ID: (get from Step 4)

### Step 4: Create Update Folder (30 seconds)

1. **Go to Google Drive**
2. **Create folder**: "Marcus Updates"
3. **Get Folder ID**: From URL `https://drive.google.com/drive/folders/FOLDER_ID`
4. **Add Folder ID** to Marcus settings

### Step 5: Upload First Update (30 seconds)

```bash
# Build the application
npm run electron:build -- --win

# Upload to Google Drive
export GOOGLE_DRIVE_FOLDER_ID="your_folder_id_here"
export GOOGLE_REFRESH_TOKEN="your_refresh_token_here"
node scripts/upload-to-drive.js latest
```

## ✅ Test Your Setup

1. **Check for updates** in Marcus
2. **Should see** your uploaded file
3. **Download test** to verify everything works

## 🔧 Environment Variables (Optional)

Create `.env` file in project root:

```bash
GOOGLE_CLIENT_ID="your_client_id"
GOOGLE_CLIENT_SECRET="your_client_secret"
GOOGLE_REFRESH_TOKEN="your_refresh_token"
GOOGLE_DRIVE_FOLDER_ID="your_folder_id"
```

## 📋 File Naming

Your update files must include version numbers:

```
marcus-1.8.0-setup.exe
marcus-1.8.1-setup.exe
marcus-2.0.0-setup.exe
```

## 🎉 Done!

Your Marcus app now has Google Drive auto-updates! 🚀

---

## 📞 Need Help?

- **Setup Issues**: Check `GOOGLE_DRIVE_SETUP.md`
- **Configuration**: Use the settings panel in Marcus
- **Testing**: Run `node scripts/setup-google-drive.js test`

**You're all set!** 🎊
