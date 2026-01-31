# 🚀 Deployment Guide

## Automated GitHub Releases

### Setup Required Secrets

In your GitHub repository settings, add these secrets:

#### For All Platforms:
- `GITHUB_TOKEN` (automatically provided by GitHub Actions)

#### For macOS Code Signing (Optional but Recommended):
- `CSC_LINK` - Your macOS Developer Certificate (.p12 file base64 encoded)
- `CSC_KEY_PASSWORD` - Password for your certificate

### How to Create macOS Certificate:

1. Get a macOS Developer Certificate from Apple Developer Portal
2. Export the certificate as .p12 file
3. Convert to base64:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```
4. Paste the result as `CSC_LINK` secret
5. Add the certificate password as `CSC_KEY_PASSWORD`

## Release Process

### Automatic Releases (Recommended)

#### Option 1: Tag-based Release
```bash
# Create and push a new version tag
git tag v1.8.1
git push origin v1.8.1
```

#### Option 2: Manual Trigger
1. Go to Actions tab in GitHub
2. Select "Auto-Update Release" workflow
3. Click "Run workflow"

### Local Releases

#### Build for All Platforms:
```bash
npm run release
```

#### Build for Specific Platform:
```bash
npm run release:mac    # macOS only
npm run release:win    # Windows only
npm run release:linux  # Linux only
```

## Generated Artifacts

### Windows:
- `Marcus-Setup-1.8.0.exe` - Installer
- `Marcus-1.8.0.exe` - Portable version
- `Marcus-1.8.0-win.zip` - ZIP archive

### macOS:
- `Marcus-1.8.0.dmg` - Disk image
- `Marcus-1.8.0-mac.zip` - ZIP archive

### Linux:
- `Marcus-1.8.0.AppImage` - AppImage
- `marcus_1.8.0_amd64.deb` - Debian package
- `marcus-1.8.0-1.x86_64.rpm` - RPM package
- `marcus_1.8.0_amd64.snap` - Snap package

## Auto-Updater Configuration

The app includes auto-updater support. Users will be notified of updates automatically.

### Update Channels:
- **Stable**: Tagged releases (v1.8.0, v1.8.1, etc.)
- **Beta**: Commits to main branch (if configured)

## Monitoring

Check workflow status at:
https://github.com/AConteh33/Marcus-2.0/actions

## GitHub Actions Workflows

### 1. `.github/workflows/release.yml`
- Triggers on version tags
- Builds for all platforms
- Uploads artifacts

### 2. `.github/workflows/auto-update.yml`
- Triggers on pushes to main/develop
- Supports manual triggering
- Creates GitHub releases

## Platform-Specific Notes

### Windows:
- Supports both x64 and ARM64
- Creates installer and portable versions
- Code signing optional but recommended

### macOS:
- Supports Intel (x64) and Apple Silicon (ARM64)
- Requires code signing for distribution
- Notarization recommended for App Store

### Linux:
- Multiple package formats (AppImage, DEB, RPM, Snap)
- Supports both x64 and ARM64
- No code signing required

## Version Management

Update version in `package.json`:
```json
{
  "version": "1.8.1"
}
```

Then create a new tag:
```bash
git add package.json
git commit -m "v1.8.1"
git tag v1.8.1
git push origin main --tags
```

## Troubleshooting

### Common Issues:

1. **Build fails on macOS**: Check certificate configuration
2. **Windows installer issues**: Verify NSIS configuration
3. **Linux package errors**: Check target architecture

### Debug Mode:
```bash
# Build with debug info
npm run electron:build -- --publish=never
```

## Security Considerations

- Always sign your releases
- Use GitHub's security features
- Review dependencies regularly
- Keep build tools updated
