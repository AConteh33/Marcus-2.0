# Environment-Only Auto-Update Setup

## 🔒 **Secure Configuration - No UI Settings**

The Marcus auto-update system now uses **environment variables only** for maximum security. No configuration UI is available in the app.

## 📋 **Required Environment Variables**

Add these to your `.env` file:

```bash
# Google Drive Auto-Update Configuration
GOOGLE_DRIVE_FOLDER_ID=1VedGD5U0UxAFaQulFxs8Zh1KZ24kzaSh
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
```

## 🚀 **Setup Steps**

### **Step 1: Get Google Credentials**

1. **Create Google Cloud Project**: https://console.cloud.google.com/
2. **Enable Drive API**: Search and enable "Google Drive API"
3. **Create OAuth2 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Create "OAuth client ID" → "Web application"
   - Redirect URI: `http://localhost:3000/callback`
   - Save Client ID and Client Secret

### **Step 2: Get Refresh Token**

```bash
# Set your credentials
export GOOGLE_CLIENT_ID="your_client_id"
export GOOGLE_CLIENT_SECRET="your_client_secret"

# Run setup script
cd /Users/ace/CascadeProjects/Marcus\ 1.9
node scripts/setup-google-drive.js
```

Follow browser instructions and copy the refresh token.

### **Step 3: Create Google Drive Folder**

1. Go to Google Drive
2. Create folder named "Marcus Updates"
3. Get Folder ID from URL: `https://drive.google.com/drive/folders/FOLDER_ID`

### **Step 4: Update .env File**

```bash
# Edit your .env file
GEMINI_API_KEY=AIzaSyDgQo24SF5s1LvdoupuLZ1DcDESHTk3zwg

GOOGLE_API_KEY1=AIzaSyDgQo24SF5s1LvdoupuLZ1DcDESHTk3zwg
GOOGLE_API_KEY2=AIzaSyABIxyrSuJHEyV2D-uJZN9rhfodiC4ZA
GOOGLE_API_KEY3=AIzaSyCHYSj4CyN0E5rwtaJubr4KNjCBaB4gdmM

# Google Drive Auto-Update Configuration
GOOGLE_DRIVE_FOLDER_ID=1VedGD5U0UxAFaQulFxs8Zh1KZ24kzaSh
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REFRESH_TOKEN=your_actual_refresh_token_here
```

### **Step 5: Upload Updates**

```bash
# Set environment variables
export GOOGLE_DRIVE_FOLDER_ID="your_folder_id"
export GOOGLE_REFRESH_TOKEN="your_refresh_token"

# Upload latest build
node scripts/upload-to-drive.js latest
```

## ✅ **What Changed**

### **Removed from App**:
- ❌ Settings panel in update UI
- ❌ Configuration input fields
- ❌ Save/Cancel buttons
- ❌ User-configurable settings

### **Now Uses**:
- ✅ Environment variables only
- ✅ Code-level configuration
- ✅ Secure credential storage
- ✅ No user access to sensitive data

## 🎯 **App UI Features**

The update manager now only shows:
- **Check Now** button
- **Download** button (when update available)
- **Install & Restart** button (when downloaded)
- **Status indicators**
- **Progress bars**
- **Error messages**

## 🔧 **File Naming Requirements**

Update files must include version numbers:
```
marcus-1.8.0-setup.exe
marcus-1.8.1-setup.exe
marcus-2.0.0-setup.exe
```

## 🚨 **Security Benefits**

- **No UI Exposure**: Credentials never appear in app interface
- **Environment Storage**: Secure .env file storage
- **Code Control**: Only developers can modify configuration
- **No User Errors**: Users cannot accidentally change settings
- **Production Safe**: Environment variables work in all environments

## 📱 **Testing Your Setup**

1. **Start App**: `npm run electron`
2. **Check Updates**: Click "Check Now" button
3. **Verify Status**: Should show "Update available" if files exist
4. **Test Download**: Click "Download" to test file retrieval
5. **Test Install**: Click "Install & Restart" to test installation

## 🔄 **Automatic Updates**

Once configured:
- ✅ Checks every 30 minutes automatically
- ✅ Shows notifications for new updates
- ✅ Downloads in background
- ✅ Installs on user confirmation

## 📞 **Troubleshooting**

### **"Google Drive not configured"**
- Check environment variables in `.env`
- Verify all required variables are set
- Restart app after changing `.env`

### **"Authentication failed"**
- Verify Client ID and Secret are correct
- Check Refresh Token is valid
- Ensure Redirect URI matches exactly

### **"No updates found"**
- Verify Folder ID is correct
- Check files have version numbers in names
- Ensure files are in the correct Google Drive folder

---

**Your auto-update system is now secure and environment-only!** 🔒✨
