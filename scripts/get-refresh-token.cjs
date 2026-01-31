#!/usr/bin/env node

/**
 * Simple Refresh Token Generator for Google Drive API
 */

const { google } = require('googleapis');

// Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables');
  console.log('\nExample:');
  console.log('export GOOGLE_CLIENT_ID="your_client_id"');
  console.log('export GOOGLE_CLIENT_SECRET="your_client_secret"');
  console.log('node scripts/get-refresh-token.js');
  process.exit(1);
}

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

// Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Important for refresh token
  scope: SCOPES,
  prompt: 'consent' // Force consent dialog to get refresh token
});

console.log('🚀 Google Drive OAuth2 Setup');
console.log('==============================\n');

console.log('📋 Step 1: Authorize the application');
console.log('=====================================');
console.log('1. Copy this URL and paste it in your browser:');
console.log(`\n${authUrl}\n`);
console.log('2. Sign in with your Google account');
console.log('3. Grant the requested permissions');
console.log('4. You will be redirected to a page (might show error)');
console.log('5. Copy the authorization code from the URL\n');

console.log('📋 Step 2: Enter authorization code');
console.log('=====================================');

// Read authorization code from user
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the authorization code: ', (authCode) => {
  if (!authCode) {
    console.error('❌ No authorization code provided');
    rl.close();
    process.exit(1);
  }

  console.log('\n📋 Step 3: Getting refresh token');
  console.log('=================================');

  // Exchange code for tokens
  oauth2Client.getToken(authCode, (err, tokens) => {
    rl.close();
    
    if (err) {
      console.error('❌ Error retrieving access token:', err.message);
      process.exit(1);
    }
    
    console.log('✅ Success! Tokens retrieved.\n');
    
    console.log('📋 Your credentials:');
    console.log('-------------------');
    console.log(`Client ID: ${CLIENT_ID}`);
    console.log(`Client Secret: ${CLIENT_SECRET}`);
    console.log(`Refresh Token: ${tokens.refresh_token}`);
    console.log(`Access Token: ${tokens.access_token}`);
    
    if (tokens.expiry_date) {
      console.log(`Token Expires: ${new Date(tokens.expiry_date).toLocaleString()}`);
    }
    
    console.log('\n📝 Next Steps:');
    console.log('--------------');
    console.log('1. Copy the refresh token above');
    console.log('2. Add it to your .env file:');
    console.log(`   GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('3. Restart Marcus application');
    console.log('4. Test the auto-update functionality');
    
    console.log('\n🎉 Setup complete!');
  });
});
