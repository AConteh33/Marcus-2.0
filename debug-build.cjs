const fs = require('fs');
const path = require('path');

console.log('Checking built files...');

// Check index.html
const indexPath = path.join(__dirname, 'dist', 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✓ index.html exists');
  const content = fs.readFileSync(indexPath, 'utf8');
  console.log('Index.html content preview:');
  console.log(content.substring(0, 500) + '...');
} else {
  console.log('✗ index.html missing');
}

// Check assets
const assetsPath = path.join(__dirname, 'dist', 'assets');
if (fs.existsSync(assetsPath)) {
  const files = fs.readdirSync(assetsPath);
  console.log('✓ Assets directory exists with files:', files);
} else {
  console.log('✗ Assets directory missing');
}

// Check main.cjs
const mainPath = path.join(__dirname, 'dist', 'main.cjs');
if (fs.existsSync(mainPath)) {
  console.log('✓ main.cjs exists');
} else {
  console.log('✗ main.cjs missing');
}
