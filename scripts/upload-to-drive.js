#!/usr/bin/env node

/**
 * Google Drive Upload Helper for Marcus Auto-Updates
 * This script uploads build files to Google Drive
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:3000/callback'
);

// Set credentials
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Create Drive API client
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Upload file to Google Drive
async function uploadFile(filePath, folderId) {
  const fileName = path.basename(filePath);
  
  console.log(`📤 Uploading ${fileName} to Google Drive...`);

  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        body: fs.createReadStream(filePath)
      },
      fields: 'id, name, size, createdTime'
    });

    console.log(`✅ Upload successful!`);
    console.log(`   File ID: ${response.data.id}`);
    console.log(`   Name: ${response.data.name}`);
    console.log(`   Size: ${Math.round(response.data.size / 1024 / 1024)}MB`);
    console.log(`   Created: ${new Date(response.data.createdTime).toLocaleString()}`);

    return response.data;
  } catch (error) {
    console.error(`❌ Upload failed:`, error.message);
    throw error;
  }
}

// List existing files in folder
async function listFiles(folderId) {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, size, createdTime)',
      orderBy: 'createdTime desc'
    });

    return response.data.files || [];
  } catch (error) {
    console.error('❌ Failed to list files:', error.message);
    return [];
  }
}

// Delete old files (keep only latest 5)
async function cleanupOldFiles(folderId, keepCount = 5) {
  console.log(`🧹 Cleaning up old files (keeping latest ${keepCount})...`);

  try {
    const files = await listFiles(folderId);
    
    if (files.length <= keepCount) {
      console.log('✅ No cleanup needed.');
      return;
    }

    const filesToDelete = files.slice(keepCount);
    
    for (const file of filesToDelete) {
      await drive.files.delete({ fileId: file.id });
      console.log(`🗑️  Deleted: ${file.name}`);
    }

    console.log(`✅ Deleted ${filesToDelete.length} old files.`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Main upload function
async function uploadToDrive() {
  console.log('🚀 Marcus Google Drive Upload Helper');
  console.log('====================================\n');

  // Check configuration
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !FOLDER_ID) {
    console.log('❌ Missing configuration. Set these environment variables:');
    console.log('   export GOOGLE_CLIENT_ID="your_client_id"');
    console.log('   export GOOGLE_CLIENT_SECRET="your_client_secret"');
    console.log('   export GOOGLE_REFRESH_TOKEN="your_refresh_token"');
    console.log('   export GOOGLE_DRIVE_FOLDER_ID="your_folder_id"');
    console.log('\nOr create a .env file with these values.');
    process.exit(1);
  }

  // Get file path from command line
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.log('❌ Please specify a file to upload:');
    console.log('   node upload-to-drive.js path/to/your/file.exe');
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    // Test folder access
    console.log('🔍 Testing folder access...');
    await drive.files.get({
      fileId: FOLDER_ID,
      fields: 'id, name'
    });
    console.log('✅ Folder access confirmed.\n');

    // Upload the file
    await uploadFile(filePath, FOLDER_ID);

    // Clean up old files
    console.log('\n');
    await cleanupOldFiles(FOLDER_ID);

    console.log('\n🎉 Upload process completed!');
    console.log('========================');
    console.log('Your file is now available for auto-updates.');

  } catch (error) {
    console.error('❌ Upload process failed:', error.message);
    
    if (error.code === 404) {
      console.log('   Folder not found. Check your folder ID.');
    } else if (error.code === 403) {
      console.log('   Access denied. Check your permissions.');
    } else {
      console.log('   Check your credentials and try again.');
    }
    process.exit(1);
  }
}

// Auto-upload latest build
async function uploadLatestBuild() {
  console.log('🚀 Auto-uploading latest build');
  console.log('=============================\n');

  const releaseDir = path.join(process.cwd(), 'release');
  
  if (!fs.existsSync(releaseDir)) {
    console.log('❌ Release directory not found. Run build first:');
    console.log('   npm run electron:build -- --win');
    process.exit(1);
  }

  // Find the latest .exe file
  const files = fs.readdirSync(releaseDir).filter(file => file.endsWith('.exe'));
  
  if (files.length === 0) {
    console.log('❌ No .exe files found in release directory.');
    process.exit(1);
  }

  // Get the latest file (by modification time)
  const latestFile = files
    .map(file => ({
      name: file,
      path: path.join(releaseDir, file),
      mtime: fs.statSync(path.join(releaseDir, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)[0];

  console.log(`📁 Found latest build: ${latestFile.name}`);
  console.log(`   Modified: ${latestFile.mtime.toLocaleString()}\n`);

  // Upload the latest file
  await uploadFile(latestFile.path, FOLDER_ID);
  
  // Clean up old files
  console.log('\n');
  await cleanupOldFiles(FOLDER_ID);

  console.log('\n🎉 Auto-upload completed!');
}

// Command line interface
const command = process.argv[2];

if (command === 'latest') {
  uploadLatestBuild();
} else if (command === 'list') {
  listFiles(FOLDER_ID).then(files => {
    console.log('📁 Files in Google Drive folder:');
    console.log('===============================');
    if (files.length === 0) {
      console.log('No files found.');
    } else {
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
        console.log(`   Created: ${new Date(file.createdTime).toLocaleString()}`);
      });
    }
  });
} else if (command === 'cleanup') {
  cleanupOldFiles(FOLDER_ID);
} else if (command === 'help' || !command) {
  console.log('🚀 Marcus Google Drive Upload Helper');
  console.log('====================================\n');
  console.log('Usage:');
  console.log('  node upload-to-drive.js <file>     - Upload specific file');
  console.log('  node upload-to-drive.js latest     - Upload latest build');
  console.log('  node upload-to-drive.js list       - List files in folder');
  console.log('  node upload-to-drive.js cleanup    - Clean up old files');
  console.log('  node upload-to-drive.js help       - Show this help\n');
  console.log('Setup:');
  console.log('1. Set environment variables or create .env file');
  console.log('2. Run: node upload-to-drive.js latest');
  console.log('3. File will be uploaded and old files cleaned up\n');
} else {
  uploadToDrive();
}
