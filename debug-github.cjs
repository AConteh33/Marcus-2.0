#!/usr/bin/env node

/**
 * Debug GitHub API Response
 */

const https = require('https');

function debugGitHubAPI() {
  console.log('🔍 Debugging GitHub API Response');
  console.log('=================================\n');

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
      console.log('📋 HTTP Status:', res.statusCode);
      console.log('📋 Response Headers:', res.headers);
      console.log('📋 Raw Response:');
      console.log(data);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.end();
}

debugGitHubAPI();
