#!/usr/bin/env node

/**
 * Google Drive Setup Helper for Marcus Auto-Updates
 * This script helps you get the refresh token for Google Drive API
 */

const { google } = require('googleapis');
const readline = require('readline');
const http = require('http');
const url = require('url');

// Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Required scopes
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
);

// Simple HTTP server to handle callback
function startCallbackServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      
      if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.query.code;
        
        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>Authorization Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
                <script>
                  setTimeout(() => window.close(), 3000);
                </script>
              </body>
            </html>
          `);
          
          server.close(() => {
            resolve(code);
          });
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body>
                <h1>Authorization Failed!</h1>
                <p>No authorization code received.</p>
              </body>
            </html>
          `);
          reject(new Error('No authorization code received'));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('Not Found');
      }
    });

    server.listen(3000, () => {
      console.log('✅ Callback server started on http://localhost:3000');
    });
  });
}

// Main setup function
async function setupGoogleDrive() {
  console.log('🚀 Marcus Google Drive Setup Helper');
  console.log('=====================================\n');

  // Check if credentials are set
  if (CLIENT_ID === 'YOUR_CLIENT_ID' || CLIENT_SECRET === 'YOUR_CLIENT_SECRET') {
    console.log('❌ Please set your Google credentials:');
    console.log('   export GOOGLE_CLIENT_ID="your_client_id"');
    console.log('   export GOOGLE_CLIENT_SECRET="your_client_secret"');
    console.log('\nOr edit this script and replace the placeholder values.\n');
    process.exit(1);
  }

  try {
    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Important for refresh token
      scope: SCOPES,
      prompt: 'consent' // Force consent dialog to get refresh token
    });

    console.log('📋 Step 1: Authorize the application');
    console.log('=====================================');
    console.log('1. Open this URL in your browser:');
    console.log(`\n${authUrl}\n`);
    console.log('2. Sign in with your Google account');
    console.log('3. Grant the requested permissions');
    console.log('4. You will be redirected to localhost (this will be handled automatically)\n');

    // Start callback server
    console.log('🔄 Starting callback server...');
    const authCode = await startCallbackServer();

    console.log('✅ Authorization code received!');

    // Exchange code for tokens
    console.log('\n📋 Step 2: Getting refresh token');
    console.log('=================================');

    const { tokens } = await oauth2Client.getToken(authCode);
    
    console.log('✅ Tokens retrieved successfully!\n');

    // Display results
    console.log('🎉 Setup Complete!');
    console.log('==================');
    console.log('\n📋 Your credentials:');
    console.log('-------------------');
    console.log(`Client ID: ${CLIENT_ID}`);
    console.log(`Client Secret: ${CLIENT_SECRET}`);
    console.log(`Refresh Token: ${tokens.refresh_token}`);
    console.log(`Access Token: ${tokens.access_token}`);
    console.log(`Token Expires: ${new Date(tokens.expiry_date).toLocaleString()}`);

    console.log('\n📝 Next Steps:');
    console.log('--------------');
    console.log('1. Copy the refresh token above');
    console.log('2. Open Marcus application');
    console.log('3. Click the update settings icon');
    console.log('4. Enter your credentials in the configuration panel');
    console.log('5. Save and test the configuration');

    console.log('\n📁 Folder Setup:');
    console.log('---------------');
    console.log('1. Create a folder in Google Drive named "Marcus Updates"');
    console.log('2. Upload your .exe files to that folder');
    console.log('3. Get the folder ID from the URL');
    console.log('4. Add the folder ID to your Marcus configuration');

    // Save to file for convenience
    const fs = require('fs');
    const config = {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      refreshToken: tokens.refresh_token,
      folderId: 'YOUR_DRIVE_FOLDER_ID' // User needs to fill this
    };

    fs.writeFileSync('google-drive-config.json', JSON.stringify(config, null, 2));
    console.log('\n💾 Configuration saved to: google-drive-config.json');
    console.log('   (Remember to add your folder ID!)');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Test existing configuration
async function testConfiguration() {
  console.log('🔍 Testing Google Drive Configuration');
  console.log('=====================================\n');

  try {
    const fs = require('fs');
    
    // Check if config file exists
    if (!fs.existsSync('google-drive-config.json')) {
      console.log('❌ Configuration file not found. Run setup first.');
      return;
    }

    const config = JSON.parse(fs.readFileSync('google-drive-config.json', 'utf8'));
    
    if (config.folderId === 'YOUR_DRIVE_FOLDER_ID') {
      console.log('❌ Please add your Google Drive folder ID to the configuration.');
      return;
    }

    // Test the configuration
    oauth2Client.setCredentials({ refresh_token: config.refreshToken });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Test folder access
    const response = await drive.files.get({
      fileId: config.folderId,
      fields: 'id, name, createdTime'
    });

    console.log('✅ Configuration test successful!');
    console.log(`Folder: ${response.data.name}`);
    console.log(`Created: ${new Date(response.data.createdTime).toLocaleString()}`);

    // List files in folder
    const filesResponse = await drive.files.list({
      q: `'${config.folderId}' in parents and name contains '.exe'`,
      fields: 'files(id, name, createdTime, size)',
      orderBy: 'createdTime desc'
    });

    const files = filesResponse.data.files;
    
    if (files && files.length > 0) {
      console.log('\n📁 Found update files:');
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
      });
    } else {
      console.log('\n⚠️  No .exe files found in the folder.');
      console.log('   Upload your update files to test the complete flow.');
    }

  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    
    if (error.code === 404) {
      console.log('   Folder not found. Check your folder ID.');
    } else if (error.code === 403) {
      console.log('   Access denied. Check your permissions.');
    } else {
      console.log('   Check your credentials and try again.');
    }
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'test') {
  testConfiguration();
} else if (command === 'help' || !command) {
  console.log('🚀 Marcus Google Drive Setup Helper');
  console.log('=====================================\n');
  console.log('Usage:');
  console.log('  node setup-google-drive.js        - Run setup');
  console.log('  node setup-google-drive.js test   - Test configuration');
  console.log('  node setup-google-drive.js help   - Show this help\n');
  console.log('Setup Instructions:');
  console.log('1. Set environment variables:');
  console.log('   export GOOGLE_CLIENT_ID="your_client_id"');
  console.log('   export GOOGLE_CLIENT_SECRET="your_client_secret"');
  console.log('2. Run: node setup-google-drive.js');
  console.log('3. Follow the instructions in your browser');
  console.log('4. Copy the refresh token to Marcus settings\n');
} else {
  setupGoogleDrive();
}
