#!/usr/bin/env node

/**
 * Simple GitHub Release Check
 */

const https = require('https');

function checkGitHubRelease() {
  console.log('🧪 Checking GitHub Release');
  console.log('==========================\n');

  const options = {
    hostname: 'api.github.com',
    path: '/repos/Okami0x0/Dera-tak-demo-playgrounds/releases/latest',
    method: 'GET',
    headers: {
      'User-Agent': 'Marcus-Auto-Update-Checker'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        
        console.log('📊 Latest Release Information:');
        console.log(`- Tag: ${release.tag_name}`);
        console.log(`- Name: ${release.name}`);
        console.log(`- Published: ${new Date(release.published_at).toLocaleString()}`);
        console.log(`- Assets: ${release.assets.length} files`);
        
        if (release.assets.length > 0) {
          console.log('\n📦 Available Assets:');
          release.assets.forEach((asset, index) => {
            console.log(`${index + 1}. ${asset.name} (${formatBytes(asset.size)})`);
          });
        }
        
        console.log('\n🎯 GitHub Release Status: ✅ ACTIVE');
        console.log('Marcus auto-update system can access this release.');
        console.log('\n🔗 Release URL:');
        console.log(`https://github.com/Okami0x0/Dera-tak-demo-playgrounds/releases/tag/${release.tag_name}`);
        
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Check internet connection');
    console.log('- Verify repository name is correct');
    console.log('- Ensure repository is public');
  });

  req.end();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the check
checkGitHubRelease();
