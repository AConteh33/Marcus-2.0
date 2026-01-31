# OAuth2 Setup Guide for Google Drive Auto-Updates

## 🎯 **Complete OAuth2 Configuration**

This guide walks you through setting up OAuth2 credentials for Google Drive API access in Marcus auto-updates.

## 📋 **Prerequisites**

- Google Account with Drive access
- Google Cloud Console access
- Marcus application with auto-update system

---

## 🔧 **Step 1: Create Google Cloud Project**

### **1.1 Go to Google Cloud Console**
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account
3. If you don't have a project, click "Select a project" → "New Project"

### **1.2 Create New Project**
1. **Project name**: `Marcus Auto-Updates`
2. **Organization**: (optional, leave as "No organization")
3. **Location**: (choose your location)
4. Click **"Create"**

### **1.3 Enable Billing (if required)**
- For most Drive API usage, billing is not required
- If prompted, you can enable billing or use the free tier

---

## 🔌 **Step 2: Enable Google Drive API**

### **2.1 Navigate to API Library**
1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Drive API"**
3. Click on **"Google Drive API"** from the results

### **2.2 Enable the API**
1. Click **"Enable"** button
2. Wait for the API to be enabled (usually takes a few seconds)
3. You'll see **"API enabled"** confirmation

---

## 🔐 **Step 3: Configure OAuth2 Consent Screen**

### **3.1 Go to OAuth Consent Screen**
1. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for testing) or **"Internal"** (for organization)
3. Click **"Create"**

### **3.2 Fill in App Information**
```
App name: Marcus Auto-Updates
User support email: your-email@example.com
App logo: (optional, upload your logo)
App homepage: https://github.com/Okami0x0/Dera-tak-demo-playgrounds
App privacy policy: (optional, create if needed)
App terms of service: (optional, create if needed)
Developer contact information: your-email@example.com
```

### **3.3 Configure Scopes**
1. Click **"Add or Remove Scopes"**
2. Search for and add these scopes:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.metadata.readonly`
3. Click **"Update"**
4. Click **"Save and Continue"**

### **3.4 Test Users (if External)**
1. Add your Google account as a test user
2. Click **"Add Users"**
3. Enter your email address
4. Click **"Add"**
5. Click **"Save and Continue"**

### **3.5 Summary**
1. Review your consent screen configuration
2. Click **"Back to Dashboard"** if everything looks correct

---

## 🔑 **Step 4: Create OAuth2 Credentials**

### **4.1 Go to Credentials Page**
1. In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**

### **4.2 Configure OAuth Client**
```
Application type: Web application
Name: Marcus Auto-Update Client
Authorized JavaScript origins: (leave empty)
Authorized redirect URIs:
    http://localhost:3000/callback
```

### **4.3 Save Your Credentials**
1. Click **"Create"**
2. **IMPORTANT**: Copy and save these values:
   - **Client ID**: `xxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: `xxxxxxxxxxxxxxxxxxxxxxxx`

### **4.4 Security Note**
- Keep your Client Secret secure and never share it publicly
- Store it in a secure location (password manager, secure notes)

---

## 🎫 **Step 5: Get Refresh Token**

### **5.1 Use the Automated Setup Script**
```bash
# Navigate to Marcus project
cd /Users/ace/CascadeProjects/Marcus\ 1.9

# Set your credentials
export GOOGLE_CLIENT_ID="your_client_id_here"
export GOOGLE_CLIENT_SECRET="your_client_secret_here"

# Run the setup script
node scripts/setup-google-drive.js
```

### **5.2 Manual OAuth2 Flow (if script fails)**

#### **Option A: Using the Provided Script**
The script will:
1. Generate an authorization URL
2. Open it in your browser automatically
3. Handle the callback automatically
4. Extract and save the refresh token

#### **Option B: Manual Flow**
1. **Generate Authorization URL**:
   ```javascript
   const { google } = require('googleapis');
   const oauth2Client = new google.auth.OAuth2(
     YOUR_CLIENT_ID,
     YOUR_CLIENT_SECRET,
     'http://localhost:3000/callback'
   );
   
   const authUrl = oauth2Client.generateAuthUrl({
     access_type: 'offline',
     scope: [
       'https://www.googleapis.com/auth/drive.readonly',
       'https://www.googleapis.com/auth/drive.metadata.readonly'
     ],
     prompt: 'consent'
   });
   
   console.log('Visit this URL:', authUrl);
   ```

2. **Visit the URL** in your browser
3. **Sign in** and grant permissions
4. **Copy the authorization code** from the callback URL
5. **Exchange for tokens**:
   ```javascript
   oauth2Client.getToken(code, (err, tokens) => {
     if (err) return console.error('Error retrieving access token', err);
     console.log('Refresh Token:', tokens.refresh_token);
   });
   ```

### **5.3 Save Your Refresh Token**
- Copy the refresh token and save it securely
- This token will be used to access Google Drive without user interaction

---

## 📁 **Step 6: Create Google Drive Folder**

### **6.1 Create Update Folder**
1. Go to Google Drive: https://drive.google.com
2. Click **"New"** → **"Folder"**
3. **Folder name**: `Marcus Updates`
4. Click **"Create"**

### **6.2 Get Folder ID**
1. Open the folder you created
2. Look at the URL in your browser:
   ```
   https://drive.google.com/drive/folders/1VedGD5U0UxAFaQulFxs8Zh1KZ24kzaSh
   ```
3. Copy the long string after `/folders/`: `1VedGD5U0UxAFaQulFxs8Zh1KZ24kzaSh`

### **6.3 Optional: Share Settings**
- Right-click folder → **"Share"**
- Add any additional users if needed
- Set appropriate permissions (usually "Viewer" is sufficient)

---

## ⚙️ **Step 7: Update Environment Variables**

### **7.1 Edit .env File**
```bash
# Open your .env file
nano /Users/ace/CascadeProjects/Marcus\ 1.9/.env
```

### **7.2 Add Google Drive Configuration**
```bash
# Google Drive Auto-Update Configuration
GOOGLE_DRIVE_FOLDER_ID=1VedGD5U0UxAFaQulFxs8Zh1KZ24kzaSh
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REFRESH_TOKEN=your_actual_refresh_token_here
```

### **7.3 Replace Placeholders**
- Replace `your_actual_client_id_here` with your Client ID
- Replace `your_actual_client_secret_here` with your Client Secret
- Replace `your_actual_refresh_token_here` with your Refresh Token
- Replace `1VedGD5U0UxAFaQulFxs8Zh1KZ24kzaSh` with your actual Folder ID

---

## ✅ **Step 8: Test Your Setup**

### **8.1 Test Configuration**
```bash
# Test the OAuth2 setup
cd /Users/ace/CascadeProjects/Marcus\ 1.9
node scripts/setup-google-drive.js test
```

### **8.2 Test File Access**
```bash
# Test Google Drive file listing
node scripts/upload-to-drive.js list
```

### **8.3 Test in Marcus App**
1. Start Marcus: `npm run electron`
2. Click update icon (top-right)
3. Click **"Check Now"**
4. Should show "Update available" if files exist

---

## 🚀 **Step 9: Upload Your First Update**

### **9.1 Build Your App**
```bash
npm run electron:build -- --win
```

### **9.2 Upload to Google Drive**
```bash
# Set environment variables
export GOOGLE_DRIVE_FOLDER_ID="your_folder_id"
export GOOGLE_REFRESH_TOKEN="your_refresh_token"

# Upload latest build
node scripts/upload-to-drive.js latest
```

### **9.3 Verify Upload**
1. Check your Google Drive folder
2. Verify the .exe file is uploaded
3. Test the update in Marcus app

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Invalid Client" Error**
- Check Client ID is copied correctly
- Verify Client Secret is correct
- Ensure redirect URI matches exactly

#### **"Redirect URI Mismatch"**
- Make sure redirect URI is exactly: `http://localhost:3000/callback`
- Check for trailing slashes or http vs https

#### **"Access Denied"**
- Verify your account is added as a test user
- Check that Drive API is enabled
- Ensure correct scopes are requested

#### **"Invalid Grant"**
- Refresh token may have expired
- Re-run the OAuth2 flow to get a new refresh token
- Ensure `prompt: 'consent'` was used during authorization

### **Debug Tips**

#### **Check API Console**
1. Go to Google Cloud Console
2. Navigate to **"APIs & Services"** → **"Credentials"**
3. Click on your OAuth client ID
4. Verify all settings are correct

#### **Test with OAuth2 Playground**
1. Go to: https://developers.google.com/oauthplayground/
2. Configure with your credentials
3. Test the Drive API scopes
4. Verify token generation works

#### **Check Network Issues**
- Ensure you can reach Google APIs
- Check firewall/proxy settings
- Verify internet connectivity

---

## 📋 **Quick Reference**

### **Required Scopes**
```
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/drive.metadata.readonly
```

### **Redirect URI**
```
http://localhost:3000/callback
```

### **Environment Variables**
```bash
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

### **File Naming Convention**
```
marcus-1.8.0-setup.exe
marcus-1.8.1-setup.exe
marcus-2.0.0-setup.exe
```

---

## 🎉 **Complete!**

Your OAuth2 setup is now complete! Marcus can now:
- ✅ Access Google Drive securely
- ✅ Check for updates automatically
- ✅ Download updates in background
- ✅ Install updates when you confirm

**Your Google Drive auto-update system is ready to use!** 🚀✨

---

## 📞 **Need Help?**

- **OAuth2 Issues**: Check Google Cloud Console settings
- **Token Issues**: Re-run the setup script
- **API Issues**: Verify Drive API is enabled
- **File Issues**: Check folder permissions and file naming
