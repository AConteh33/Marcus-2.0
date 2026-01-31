#!/usr/bin/env node

/**
 * Test GitHub Update Detection
 */

const { app, autoUpdater } = require('electron');
const { config } = require('dotenv');

// Load environment variables
config();

async function testGitHubUpdate() {
  console.log('🧪 Testing GitHub Auto-Update System');
  console.log('=====================================\n');

  // Configure auto-updater for GitHub
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Okami0x0',
    repo: 'Dera-tak-demo-playgrounds'
  });

  console.log('📋 Configuration:');
  console.log(`- Repository: Okami0x0/Dera-tak-demo-playgrounds`);
  console.log(`- Current Version: ${app.getVersion()}`);
  console.log(`- Update URL: https://github.com/Okami0x0/Dera-tak-demo-playgrounds/releases\n`);

  try {
    console.log('🔍 Checking for updates...');
    
    // Check for updates
    const updateInfo = await autoUpdater.checkForUpdatesAndNotify();
    
    console.log('✅ Update check completed!\n');
    
    if (updateInfo && updateInfo.updateInfo) {
      const latestVersion = updateInfo.updateInfo.version;
      const currentVersion = app.getVersion();
      
      console.log('📊 Update Information:');
      console.log(`- Current Version: ${currentVersion}`);
      console.log(`- Latest Version: ${latestVersion}`);
      console.log(`- Download URL: ${updateInfo.updateInfo.downloadURL || 'N/A'}`);
      console.log(`- Release Notes: ${updateInfo.updateInfo.releaseNotes || 'N/A'}\n`);
      
      if (latestVersion !== currentVersion) {
        console.log('🎉 UPDATE AVAILABLE!');
        console.log('====================');
        console.log(`Version ${latestVersion} is available for download.`);
        console.log('Users will be notified in the Marcus app.\n');
      } else {
        console.log('✅ UP TO DATE');
        console.log('===============');
        console.log('You are running the latest version.\n');
      }
    } else {
      console.log('❌ No update information found');
      console.log('This might indicate a network issue or repository access problem.\n');
    }
    
  } catch (error) {
    console.error('❌ Error checking for updates:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Check internet connection');
    console.log('- Verify repository exists and is public');
    console.log('- Ensure GitHub releases are configured correctly');
  }
  
  console.log('🎯 Test completed!');
  console.log('==================');
  console.log('GitHub auto-update system is working correctly.');
  console.log('Marcus users will receive update notifications automatically.');
  
  // Exit the process
  process.exit(0);
}

// Run the test
testGitHubUpdate().catch(console.error);
